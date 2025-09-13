"use server";

import Fuse from "fuse.js";
import * as v from "valibot";
import { tryParse } from "~/utils/parse";
import { RecreationalLocationSchema } from "../schema";
import { getParkTrackDatabaseConnection } from "../util";
import { USER_RECREATION_LOCATION_TABLE } from "./constants";

const CACHE_DURATION_IN_MS = 1000 * 60 * 5; // 5 minutes

let recreationalLocationsCache: {
	data: RecreationalLocationSchema[];
	fuseIndex: Fuse<RecreationalLocationSchema>;
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
         SELECT *
         FROM ${USER_RECREATION_LOCATION_TABLE}
         `)
		)
			.getRowObjects()
			.map((rowObjectData) => {
				let key: keyof typeof rowObjectData;

				for (key in rowObjectData) {
					const value = rowObjectData[key];

					// Ensure we have a valid js value
					rowObjectData[key] =
						typeof value === "string" ? tryParse(value) : value;
				}

				try {
					// Validate the data
					const validatedData = v.parse(
						RecreationalLocationSchema,
						rowObjectData,
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

/** Returns a fuzzy searched result array of the recreation areas based off a user's search query */
export async function getUserQueryResultFromDatabase(
	query: string,
	maxResults = 10,
) {
	const { fuseIndex } = await getAllRecreationalLocations();

	const results = fuseIndex.search(query);
	return results.slice(0, maxResults).map((result) => result.item);
}
