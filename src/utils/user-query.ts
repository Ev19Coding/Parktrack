import { query, revalidate } from "@solidjs/router";
import {
	getLocationsByOwner,
	getRecreationalLocationCategories,
	getRecreationalLocationFromDatabaseById,
	getRecreationalLocationsCloseToCoords,
	getRecreationalLocationsFromDatabaseAtRandom,
	getUserFavouriteLocations,
	getUserQueryResultFromDatabase,
	getUsersByType,
	isLocationInUserFavourites,
} from "~/server/database/user/query";
import {
	isUserLoggedIn as isUserLoggedIn,
	getCurrentUserInfo,
	isUserOwner,
	isUserRegular,
} from "~/server/user";
import { generateRandomUUID } from "~/utils/random";

// Query-wrapped read-only helpers that mirror server reads.
// Keys are deterministic so `revalidate` can target them.

//
// Auth queries
//

export const getOwnerData = query(async () => {
	if (await isUserOwner()) {
		const ownerInfo = await getCurrentUserInfo();

		if (!ownerInfo) return null;

		const ownerLocations = await getLocationsByOwner(ownerInfo.id);

		return { locations: ownerLocations } as const;
	}
	return null;
}, generateRandomUUID());

export const getRegularUserData = query(async () => {
	if (await isUserRegular()) return {};
	return null;
}, generateRandomUUID());

export const queryUserLoggedIn = query(isUserLoggedIn, generateRandomUUID());

export const queryIsUserOwner = query(isUserOwner, generateRandomUUID());

export async function revalidateUserLoginData() {
	return revalidate([
		queryUserLoggedIn.key,
		getOwnerData.key,
		getRegularUserData.key,
		queryIsUserOwner.key,
	]);
}

//
// Recreational location queries
//

export const queryUserSearchForRecreationalLocations = query(
	getUserQueryResultFromDatabase,
	generateRandomUUID(),
);

export const queryRecreationalLocationById = query(
	getRecreationalLocationFromDatabaseById,
	generateRandomUUID(),
);

export async function revalidateRecreationalLocationById() {
	return revalidate([queryRecreationalLocationById.key]);
}

export const queryRecreationalLocationCategories = query(
	getRecreationalLocationCategories,
	generateRandomUUID(),
);

export async function revalidateRecreationalLocationCategories() {
	return revalidate([queryRecreationalLocationCategories.key]);
}

export const queryRecreationalLocationsAtRandom = query(
	getRecreationalLocationsFromDatabaseAtRandom,
	generateRandomUUID(),
);

export const queryRecreationalLocationsCloseToCoords = query(
	getRecreationalLocationsCloseToCoords,
	generateRandomUUID(),
);

export const queryUsersByType = query(getUsersByType, generateRandomUUID());

export const queryUserFavouriteLocations = query(
	getUserFavouriteLocations,
	generateRandomUUID(),
);

export async function revalidateUserFavourites() {
	return revalidate([queryUserFavouriteLocations.key]);
}

export async function revalidateUserFavouriteStatus() {
	return revalidate([queryIsLocationInUserFavourites.key, queryUserFavouriteLocations.key]);
}

export const queryIsLocationInUserFavourites = query(
	isLocationInUserFavourites,
	generateRandomUUID(),
);

//
// Owner queries
//

export const queryLocationsByOwner = query(getLocationsByOwner, generateRandomUUID());

//
// Convenience revalidation helpers
//

export async function revalidateSearchQuery() {
	return revalidate([queryUserSearchForRecreationalLocations.key]);
}

export async function revalidateNearbyCoords() {
	return revalidate(queryRecreationalLocationsCloseToCoords.key);
}

export async function revalidateRandomCategory() {
	return revalidate([queryRecreationalLocationsAtRandom.key]);
}
