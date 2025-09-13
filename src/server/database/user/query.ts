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
	cachedOn: Date;
} = { cachedOn: new Date(0), data: [] };

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
					console.log(
						JSON.stringify(
							e,
							(_, value) =>
								typeof value === "bigint" ? value.toString() : value,
							2,
						),
					);

					// biome-ignore lint/suspicious/noExplicitAny: <Yes I know this is an error>
					return {} as any;
				}
			});

		recreationalLocationsCache = {
			cachedOn: currentDate,
			data: fetchedData,
		};
	}

	return recreationalLocationsCache.data;
}

/** Returns a fuzzy searched result array of the recreation areas based off a user's search query */
export async function getUserQueryResultFromDatabase(
	query: string,
	maxResults = 10,
) {
	const locations = await getAllRecreationalLocations();

	const fuse = new Fuse(locations, {
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

	const results = fuse.search(query);
	return results
		.values()
		.take(maxResults)
		.map((result) => result.item);
}
