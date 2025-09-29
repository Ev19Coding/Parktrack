/** biome-ignore-all lint/complexity/useLiteralKeys: <Typescript prefers if we use string literals in dynamic access> */
"use server";

// This contains functions for reading from the database
import { redirect } from "@solidjs/router";
import Fuse from "fuse.js";
import QuickLRU from "quick-lru";
import * as v from "valibot";
import { PLACEHOLDER_IMG } from "~/shared/constants";
import type { Satisfies } from "~/types/generics";
import { approximateNumberToDecimalPlaces } from "~/utils/formatting";
import { getDistanceInKmBetweenCoords } from "~/utils/location";
import { tryParseObject } from "~/utils/parse";
import type { UserType } from "../better-auth-schema";
import { RecreationalLocationSchema } from "../schema";
import { getParkTrackDatabaseConnection } from "../util";
import { USER_RECREATIONAL_LOCATION_TABLE } from "./constants";

const DEFAULT_MAX_RESULTS = 10;

const UrlSchema = v.pipe(
	v.string(),
	v.transform((url) => {
		// Handle protocol-relative URLs by adding https:
		if (url.startsWith("//")) {
			return `https:${url}`;
		}
		return url;
	}),
	v.url(),
);

const NullishStringSchema = v.nullish(v.string()),
	CategoryStringSchema = v.nullish(v.string(), "Other"),
	AddressStringSchema = v.nullish(v.string(), "N/A"),
	ImageUrlWithDefaultSchema = v.nullish(
		v.union([UrlSchema, v.literal(PLACEHOLDER_IMG)]),
		PLACEHOLDER_IMG,
	);

const ForceStringSchema = v.pipe(v.unknown(), v.transform(String));

const LightweightRecreationalLocationSchema = v.object({
	id: ForceStringSchema,
	title: v.string(),
	description: NullishStringSchema,
	thumbnail: ImageUrlWithDefaultSchema,
	category: CategoryStringSchema,
	address: AddressStringSchema,
	latitude: v.number(),

	longitude: v.number(),
	// Keep this loose since `about` is a structured field (categories + options).
	// We'll derive a searchable string from it for Fuse.js instead of indexing the raw object.
	about: v.nullish(v.array(v.any())),
	// Keep owner so we can surface owner name in the Fuse index and affect ranking
	owner: v.nullish(v.any()),
});

/** Since fetching all the data seems like a waste */
type LightweightRecreationalLocationSchema = Satisfies<
	v.InferOutput<typeof LightweightRecreationalLocationSchema>,
	Partial<RecreationalLocationSchema>
>;

const BareMinimumRecreationalLocationSchema = v.object({
	id: ForceStringSchema,
	title: v.string(),
	thumbnail: ImageUrlWithDefaultSchema,
});

type BareMinimumRecreationalLocationSchema = Satisfies<
	v.InferOutput<typeof BareMinimumRecreationalLocationSchema>,
	Partial<LightweightRecreationalLocationSchema>
>;

const BareMinimumRecreationalLocationPlusCoordsSchema = v.object({
	...BareMinimumRecreationalLocationSchema.entries,
	longitude: v.number(),
	latitude: v.number(),
});

type BareMinimumRecreationalLocationPlusCoordsSchema = Satisfies<
	v.InferOutput<typeof BareMinimumRecreationalLocationPlusCoordsSchema>,
	Partial<RecreationalLocationSchema>
>;

type AboutOption = { name?: string; enabled?: boolean };
type AboutCategory = { id?: string; name?: string; options?: AboutOption[] };

/**
 * Build a normalized searchable string from the structured `about` field.
 * - Accepts the common shape: AboutCategory[]
 * - Falls back to stringifying unknown objects
 * - Returns `undefined` when nothing useful was found
 */
export function computeAboutText(about: unknown): string | undefined {
	const parts: string[] = [];

	if (!about) return undefined;

	// `about` is expected to be an array of categories each with `name` and `options`.
	// We'll extract category names and enabled option names to form a searchable text blob.
	if (Array.isArray(about)) {
		for (const rawCategory of about) {
			if (!rawCategory || typeof rawCategory !== "object") continue;

			const category = rawCategory as AboutCategory;

			if (typeof category.name === "string" && category.name.trim()) {
				parts.push(category.name.trim());
			}

			if (Array.isArray(category.options)) {
				for (const rawOpt of category.options) {
					if (!rawOpt || typeof rawOpt !== "object") continue;

					const opt = rawOpt as AboutOption;
					if (opt.enabled && typeof opt.name === "string" && opt.name.trim()) {
						parts.push(opt.name.trim());
					}
				}
			}
		}
	} else if (typeof about === "string") {
		if (about.trim()) parts.push(about.trim());
	} else if (about && typeof about === "object") {
		// Fallback: stringify reasonable object shapes
		try {
			const stringified = JSON.stringify(about);
			if (stringified && stringified !== "{}" && stringified !== "null") {
				parts.push(stringified);
			}
		} catch {
			// ignore any circular or unexpected shapes
		}
	}

	if (!parts.length) return undefined;
	// Join with spaces so the text behaves like a normal searchable string
	return parts.join(" ");
}

/**
 * Compute owner name from the lightweight owner object.
 * - Accepts shapes like { id: string, name: string, ... }
 * - Returns normalized trimmed name or undefined
 */
export function computeOwnerName(owner: unknown): string | undefined {
	if (!owner || typeof owner !== "object") return undefined;
	try {
		const name = (owner as any).name;
		if (typeof name === "string" && name.trim()) return name.trim();
	} catch {
		// ignore unexpected shapes
	}
	return undefined;
}

const CACHE_DURATION_IN_MS = 1000 * 60 * 5; // 5 minutes

let recreationalLocationsCache: {
	data: LightweightRecreationalLocationSchema[];
	fuseIndex: Fuse<LightweightRecreationalLocationSchema>;
	cachedOn: Date;
} = { cachedOn: new Date(0), data: [], fuseIndex: new Fuse([]) };

async function getAllRecreationalLocations() {
	const currentDate = new Date();

	// cache is expired
	if (
		recreationalLocationsCache.cachedOn.getTime() + CACHE_DURATION_IN_MS <
		currentDate.getTime()
	) {
		const fetchedData: Array<
			LightweightRecreationalLocationSchema & {
				aboutText?: string;
				ownerName?: string;
				latitude?: number;
				longitude?: number;
			}
		> = (
			await (
				await getParkTrackDatabaseConnection()
			).streamAndReadAll(`
         SELECT id, title, thumbnail, category, address, description, about, latitude, longitude
         FROM ${USER_RECREATIONAL_LOCATION_TABLE}
         `)
		)
			.getRowObjectsJS()
			.map((rowObjectData) => {
				try {
					// Validate the data (only the lightweight fields)
					const validatedData = v.parse(
						LightweightRecreationalLocationSchema,
						tryParseObject(rowObjectData),
						{ abortEarly: true },
					);

					// Compute searchable strings from structured fields
					const aboutText = computeAboutText(validatedData.about);
					const ownerName = computeOwnerName(validatedData.owner);

					// Build augmented object only including fields when present
					const augment: Partial<{
						aboutText: string;
						ownerName: string;
						latitude: number;
						longitude: number;
					}> = {};
					if (typeof aboutText === "string") augment["aboutText"] = aboutText;
					if (typeof ownerName === "string") augment["ownerName"] = ownerName;

					// Attach coords from the raw DB row (if available and finite)
					try {
						const rawLat = rowObjectData["latitude"];
						const rawLon = rowObjectData["longitude"];
						const lat =
							typeof rawLat === "string" || typeof rawLat === "number"
								? Number(rawLat)
								: NaN;
						const lon =
							typeof rawLon === "string" || typeof rawLon === "number"
								? Number(rawLon)
								: NaN;
						if (Number.isFinite(lat) && Number.isFinite(lon)) {
							augment["latitude"] = lat;
							augment["longitude"] = lon;
						}
					} catch {
						/* ignore malformed coords */
					}

					if (Object.keys(augment).length) {
						return { ...validatedData, ...augment };
					}
					return validatedData;
				} catch (e) {
					throw new Error(
						`Invalid recreational location data: ${JSON.stringify(
							e,
							(_, value) =>
								typeof value === "bigint" ? value.toString() : value,
							2,
						)}`,
					);
				}
			});

		// Build Fuse index with the augmented shape (aboutText & ownerName included, coords ignored by Fuse)
		const fuse = new Fuse(fetchedData, {
			keys: [
				// Prioritize title heavily.
				{ name: "title", weight: 2.5 },
				// `aboutText` aggregates tags/features from the structured `about` field; boost it for relevance.
				{ name: "aboutText", weight: 1.8 },
				// Owner name should be searchable and moderately influence ranking.
				{ name: "ownerName", weight: 1.6 },
				// Description is helpful but less weighted than title/about.
				{ name: "description", weight: 1.2 },
				{ name: "address", weight: 1 },
				{ name: "category", weight: 1.5 },
			],
			threshold: 0.3,
			includeScore: true,
			ignoreLocation: true,
			shouldSort: true,
		});

		recreationalLocationsCache = {
			cachedOn: currentDate,
			data: fetchedData,
			fuseIndex: fuse,
		};
	}

	return recreationalLocationsCache;
}

/** Returns a fuzzy searched result array of the recreation areas based off a user's search query. Only contains the id, title, and thumbnail to be as light as possible.
 *
 * If the user coordinates are given, the requests are sorted with closer ones at the beginning of the array
 */
export async function getUserQueryResultFromDatabase(
	query: string,
	coords: [lat: number, long: number] | null = null,
	maxResults = DEFAULT_MAX_RESULTS,
): Promise<
	ReadonlyArray<BareMinimumRecreationalLocationSchema & { distanceKm?: number }>
> {
	const { fuseIndex } = await getAllRecreationalLocations();

	// Run Fuse search
	const fuseResults = fuseIndex.search(query);

	// Map fuse results (keep Fuse ordering). If coords were provided and the item has coords,
	// compute distanceKm and attach it. No DB roundtrip.
	const enriched = fuseResults.map(({ item }) => {
		const { id, title, thumbnail } = item;
		const base: BareMinimumRecreationalLocationSchema = {
			id,
			title,
			thumbnail,
		};

		if (!coords) {
			return base;
		}

		const [userLat, userLong] = coords;
		const latitude = item.latitude;
		const longitude = item.longitude;

		if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
			const distanceKm = approximateNumberToDecimalPlaces(
				getDistanceInKmBetweenCoords(
					userLat,
					userLong,
					Number(latitude),
					Number(longitude),
				),
				2,
			);
			return { ...base, distanceKm };
		}
		return base;
	});

	return enriched.slice(0, maxResults);
}

export async function getRecreationalLocationFromDatabaseById(
	id: string,
): Promise<RecreationalLocationSchema | undefined> {
	try {
		const fetchedLocation = (
			await (
				await getParkTrackDatabaseConnection()
			).streamAndReadAll(`
         SELECT *
         FROM ${USER_RECREATIONAL_LOCATION_TABLE}
         WHERE id = ${id}
         `)
		)
			.getRowObjectsJS()
			.map((rowObjectData) => {
				try {
					// Validate the data
					const validatedData = v.parse(
						RecreationalLocationSchema,
						tryParseObject(rowObjectData),
						{ abortEarly: true },
					);

					return validatedData;
				} catch (e) {
					throw new Error(
						`Invalid recreational location data: ${JSON.stringify(
							e,
							(_, value) =>
								typeof value === "bigint" ? value.toString() : value,
							2,
						)}`,
					);
				}
			});

		// Our data should be in the first index
		return fetchedLocation[0];
	} catch {
		throw redirect("/");
	}
}

export async function getAllRecreationalLocationCategories(): Promise<
	ReadonlyArray<string>
> {
	const fetchedCategories = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
    SELECT DISTINCT category
    FROM user_recreational_locations
    WHERE category IS NOT NULL
    `)
	)
		.getColumnsJson()
		.flatMap((columnData) => {
			try {
				// Validate the data
				const validatedData = v.parse(v.array(v.string()), columnData, {
					abortEarly: true,
				});

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid column data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedCategories;
}

/** Returns all the categories that occur at least a specified amount of times */
export async function getCommonRecreationalLocationCategories(
	frequency: number,
): Promise<ReadonlyArray<string>> {
	const fetchedCategories = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
		SELECT category
    FROM user_recreational_locations
    WHERE category IS NOT NULL
    GROUP BY category
    HAVING COUNT(*) >= ${frequency};
    `)
	)
		.getColumnsJson()
		.flatMap((columnData) => {
			try {
				// Validate the data
				const validatedData = v.parse(v.array(v.string()), columnData, {
					abortEarly: true,
				});

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid column data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedCategories;
}

/** Returns from any category randomly */
export async function getRecreationalLocationsFromDatabaseAtRandom(
	category: string,
	maxResults = DEFAULT_MAX_RESULTS,
): Promise<ReadonlyArray<BareMinimumRecreationalLocationSchema>> {
	const fetchedParks = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
          SELECT id, title, thumbnail
          FROM ${USER_RECREATIONAL_LOCATION_TABLE}
          WHERE category LIKE '%${category}%'
          ORDER BY RANDOM()
          LIMIT ${maxResults}
          `)
	)
		.getRowObjectsJS()
		.map((rowObjectData) => {
			try {
				// Validate the data
				const validatedData = v.parse(
					BareMinimumRecreationalLocationSchema,
					tryParseObject(rowObjectData),
					{ abortEarly: true },
				);

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid recreational location data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedParks;
}

/**
 *
 * @param lat latitude
 * @param long longitude
 * @param range (optional) distance in km
 */
export async function getRecreationalLocationsCloseToCoords(arg: {
	lat: number;
	long: number;
	range?: number;
	maxResults?: number;
}): Promise<ReadonlyArray<BareMinimumRecreationalLocationPlusCoordsSchema>> {
	const { lat, long, maxResults = DEFAULT_MAX_RESULTS, range = 10 } = arg;

	if (lat === Infinity || long === Infinity) return [];

	// First load the spatial extension
	const connection = await getParkTrackDatabaseConnection();
	await connection.streamAndReadAll("INSTALL spatial; LOAD spatial;");

	const fetchedLocations = (
		await connection.streamAndReadAll(`
			SELECT id, title, thumbnail, latitude, longitude
			FROM ${USER_RECREATIONAL_LOCATION_TABLE}
			WHERE ST_DWithin_Spheroid(
				ST_Point2D(latitude, longitude),
				ST_Point2D(${lat}, ${long}),
				${range * 1000}
			)
			ORDER BY ST_Distance_Spheroid(
				ST_Point2D(latitude, longitude),
				ST_Point2D(${lat}, ${long})
			)
			LIMIT ${maxResults};
		`)
	)
		.getRowObjectsJS()
		.map((rowObjectData) => {
			try {
				// Validate the data
				const validatedData = v.parse(
					BareMinimumRecreationalLocationPlusCoordsSchema,
					tryParseObject(rowObjectData),
					{ abortEarly: true },
				);

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid recreational location data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedLocations;
}

/**
 * Get users by type (user, owner)
 */
export async function getUsersByType(
	userType: UserType,
	maxResults = DEFAULT_MAX_RESULTS,
): Promise<
	ReadonlyArray<{ id: string; name: string; email: string; type: string }>
> {
	const fetchedUsers = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
          SELECT id, name, email, type
          FROM "user"
          WHERE type = '${userType}'
          LIMIT ${maxResults}
          `)
	)
		.getRowObjectsJS()
		.map((rowObjectData) => {
			return {
				id: String(rowObjectData["id"]),
				name: String(rowObjectData["name"]),
				email: String(rowObjectData["email"]),
				type: String(rowObjectData["type"]),
			};
		});

	return fetchedUsers;
}

/**
 * Get recreational locations from user's favourites
 */
export async function getUserFavouriteLocations(
	userId: string,
): Promise<ReadonlyArray<BareMinimumRecreationalLocationSchema>> {
	const connection = await getParkTrackDatabaseConnection();

	// First get the user's favourites array
	const userResult = await connection.streamAndReadAll(`
		SELECT favourites
		FROM "user"
		WHERE id = '${userId}'
	`);

	const userRows = userResult.getRowObjectsJS();
	if (!userRows.length) return [];

	const favouritesData = userRows[0]?.["favourites"];
	if (!favouritesData) return [];

	// Parse favourites array (stored as JSON string)
	let favouriteIds: string[] = [];
	try {
		favouriteIds =
			typeof favouritesData === "string"
				? JSON.parse(favouritesData)
				: favouritesData;
	} catch {
		return [];
	}

	if (!favouriteIds.length) return [];

	// Get the recreational locations for these IDs
	const fetchedLocations = (
		await connection.streamAndReadAll(`
          SELECT id, title, thumbnail
          FROM ${USER_RECREATIONAL_LOCATION_TABLE}
          WHERE id IN (${favouriteIds.map((id) => `'${id}'`).join(", ")})
          `)
	)
		.getRowObjectsJS()
		.map((rowObjectData) => {
			try {
				const validatedData = v.parse(
					BareMinimumRecreationalLocationSchema,
					tryParseObject(rowObjectData),
					{ abortEarly: true },
				);

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid recreational location data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedLocations;
}

/**
 * Add a location to user's favourites (if not already present)
 */
export async function addLocationToUserFavourites(
	userId: string,
	locationId: string,
): Promise<boolean> {
	const connection = await getParkTrackDatabaseConnection();

	// Get current favourites
	const userResult = await connection.streamAndReadAll(`
		SELECT favourites
		FROM "user"
		WHERE id = '${userId}'
	`);

	const userRows = userResult.getRowObjectsJS();
	if (!userRows.length) return false;

	const favouritesData = userRows[0]?.["favourites"];
	let currentFavourites: string[] = [];

	try {
		currentFavourites =
			typeof favouritesData === "string"
				? JSON.parse(favouritesData)
				: favouritesData || [];
	} catch {
		currentFavourites = [];
	}

	// Check if already in favourites
	if (currentFavourites.includes(locationId)) {
		return false; // Already exists
	}

	// Add to favourites
	const updatedFavourites = [...currentFavourites, locationId];

	await connection.streamAndReadAll(`
		UPDATE "user"
		SET favourites = '${JSON.stringify(updatedFavourites).replace(/'/g, "''")}'
		WHERE id = '${userId}'
	`);

	return true;
}

/**
 * Remove a location from user's favourites
 */
export async function removeLocationFromUserFavourites(
	userId: string,
	locationId: string,
): Promise<boolean> {
	const connection = await getParkTrackDatabaseConnection();

	// Get current favourites
	const userResult = await connection.streamAndReadAll(`
		SELECT favourites
		FROM "user"
		WHERE id = '${userId}'
	`);

	const userRows = userResult.getRowObjectsJS();
	if (!userRows.length) return false;

	const favouritesData = userRows[0]?.["favourites"];
	let currentFavourites: string[] = [];

	try {
		currentFavourites =
			typeof favouritesData === "string"
				? JSON.parse(favouritesData)
				: favouritesData || [];
	} catch {
		currentFavourites = [];
	}

	// Check if in favourites
	if (!currentFavourites.includes(locationId)) {
		return false; // Not in favourites
	}

	// Remove from favourites
	const updatedFavourites = currentFavourites.filter((id) => id !== locationId);

	await connection.streamAndReadAll(`
		UPDATE "user"
		SET favourites = '${JSON.stringify(updatedFavourites).replace(/'/g, "''")}'
		WHERE id = '${userId}'
	`);

	return true;
}

/**
 * Check if a location is in user's favourites
 */
export async function isLocationInUserFavourites(
	userId: string,
	locationId: string,
): Promise<boolean> {
	const connection = await getParkTrackDatabaseConnection();

	const userResult = await connection.streamAndReadAll(`
		SELECT favourites
		FROM "user"
		WHERE id = '${userId}'
	`);

	const userRows = userResult.getRowObjectsJS();
	if (!userRows.length) return false;

	const favouritesData = userRows[0]?.["favourites"];
	let currentFavourites: string[] = [];

	try {
		currentFavourites =
			typeof favouritesData === "string"
				? JSON.parse(favouritesData)
				: favouritesData || [];
	} catch {
		return false;
	}

	return currentFavourites.includes(locationId);
}

/**
 * Get locations owned by a specific owner (for future use when owners table is separate)
 */
export async function getLocationsByOwner(
	ownerId: string,
	maxResults = DEFAULT_MAX_RESULTS,
): Promise<ReadonlyArray<BareMinimumRecreationalLocationSchema>> {
	const fetchedLocations = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
          SELECT id, title, thumbnail
          FROM ${USER_RECREATIONAL_LOCATION_TABLE}
          WHERE owner->>'id' = '${ownerId}'
          LIMIT ${maxResults}
          `)
	)
		.getRowObjectsJS()
		.map((rowObjectData) => {
			try {
				const validatedData = v.parse(
					BareMinimumRecreationalLocationSchema,
					tryParseObject(rowObjectData),
					{ abortEarly: true },
				);

				return validatedData;
			} catch (e) {
				throw new Error(
					`Invalid recreational location data: ${JSON.stringify(
						e,
						(_, value) =>
							typeof value === "bigint" ? value.toString() : value,
						2,
					)}`,
				);
			}
		});

	return fetchedLocations;
}
