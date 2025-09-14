"use server";

import Fuse from "fuse.js";
import * as v from "valibot";
import type { Satisfies } from "~/utils/generics";
import { tryParseObject } from "~/utils/parse";
import { RecreationalLocationSchema } from "../schema";
import { getParkTrackDatabaseConnection } from "../util";
import { USER_RECREATION_LOCATION_TABLE } from "./constants";

const NullableStringSchema = v.optional(v.nullable(v.string()));

const LightweightRecreationalLocationSchema = v.object({
	id: v.bigint(),
	title: v.string(),
	description: NullableStringSchema,
	thumbnail: NullableStringSchema,
	category: v.string(),
	address: v.string(),
});

/** Since fetching all the data seems like a waste */
type LightweightRecreationalLocationSchema = Satisfies<
	v.InferOutput<typeof LightweightRecreationalLocationSchema>,
	Partial<RecreationalLocationSchema>
>;

const BareMinimumRecreationalLocationSchema = v.object({
	id: v.bigint(),
	title: v.string(),
	thumbnail: NullableStringSchema,
});

type BareMinimumRecreationalLocationSchema = Satisfies<
	v.InferOutput<typeof BareMinimumRecreationalLocationSchema>,
	Partial<LightweightRecreationalLocationSchema>
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
         FROM ${USER_RECREATION_LOCATION_TABLE}
         `)
		)
			.getRowObjects()
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
	maxResults = 10,
): Promise<ReadonlyArray<BareMinimumRecreationalLocationSchema>> {
	const { fuseIndex } = await getAllRecreationalLocations();

	const results = fuseIndex.search(query);
	return results.slice(0, maxResults).map((result) => {
		const { id, title, thumbnail } = result.item;

		return { id, title, thumbnail };
	});
}

export async function getRecreationalLocationFromDatabaseById(
	id: string | bigint,
): Promise<RecreationalLocationSchema | undefined> {
	const fetchedLocation = (
		await (
			await getParkTrackDatabaseConnection()
		).streamAndReadAll(`
         SELECT *
         FROM ${USER_RECREATION_LOCATION_TABLE}
         WHERE id = ${id}
         `)
	)
		.getRowObjects()
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
}
