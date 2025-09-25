/** biome-ignore-all lint/complexity/useLiteralKeys: <Typescript prefers if we use string literals in dynamic access> */
"use server";
// This contains functions for reading from the database

import Fuse from "fuse.js";
import QuickLRU from "quick-lru";
import * as v from "valibot";
import { PLACEHOLDER_IMG } from "~/shared/constants";
import type { Satisfies } from "~/types/generics";
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
		const fetchedData = (
			await (
				await getParkTrackDatabaseConnection()
			).streamAndReadAll(`
         SELECT id, title, thumbnail, category, address
         FROM ${USER_RECREATIONAL_LOCATION_TABLE}
         `)
		)
			.getRowObjectsJS()
			.map((rowObjectData) => {
				try {
					// Validate the data
					const validatedData = v.parse(
						LightweightRecreationalLocationSchema,
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

		const fuse = new Fuse(fetchedData, {
			keys: [
				{ name: "title", weight: 2 },
				{ name: "description", weight: 1 },
				{ name: "address", weight: 1 },
				{ name: "category", weight: 1.5 },
				// { name: "phone", weight: 0.5 },
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

/** Returns a fuzzy searched result array of the recreation areas based off a user's search query. Only contains the id, title, and thumbnail to be as light as possible */
export async function getUserQueryResultFromDatabase(
	query: string,
	maxResults = DEFAULT_MAX_RESULTS,
): Promise<ReadonlyArray<BareMinimumRecreationalLocationSchema>> {
	const { fuseIndex } = await getAllRecreationalLocations();

	const results = fuseIndex.search(query);
	return results.slice(0, maxResults).map((result) => {
		const { id, title, thumbnail } = result.item;

		return { id, title, thumbnail };
	});
}

const recreationalLocationLruCache = new QuickLRU<
	string | bigint,
	RecreationalLocationSchema | undefined
>({ maxAge: CACHE_DURATION_IN_MS, maxSize: 100 });

export async function getRecreationalLocationFromDatabaseById(
	id: string,
): Promise<RecreationalLocationSchema | undefined> {
	const possiblyCachedLocation = recreationalLocationLruCache.get(id);

	if (possiblyCachedLocation) return possiblyCachedLocation;

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
	return recreationalLocationLruCache.set(id, fetchedLocation[0]).get(id);
}

export async function getRecreationalLocationCategories(): Promise<
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
	const placeholders = favouriteIds.map(() => "?").join(", ");
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
