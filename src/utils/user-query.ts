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
	getCurrentUserInfo,
	isUserLoggedIn,
	isUserOwner,
	isUserRegular,
} from "~/server/user";

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
}, "auth/getOwnerData");

export const getRegularUserData = query(async () => {
	if (await isUserRegular()) return {};
	return null;
}, "auth/getRegularUserData");

export const queryUserLoggedIn = query(isUserLoggedIn, "auth/isUserLoggedIn");

export const queryIsUserOwner = query(isUserOwner, "auth/isUserOwner");

export async function revalidateUserLoginData(extraKeys: string[] = []) {
	return revalidate([
		// Core auth keys
		queryUserLoggedIn.key,
		getOwnerData.key,
		getRegularUserData.key,
		queryIsUserOwner.key,

		// Additional user-dependent queries that should be refreshed when auth changes
		queryUsersByType.key,
		queryUserFavouriteLocations.key,
		queryIsLocationInUserFavourites.key,
		queryLocationsByOwner.key,

		// Allow callers to pass dynamic keys (e.g. per-item keys like `is-location-${id}-favourite`)
		...extraKeys,
	]);
}

//
// Recreational location queries
//

export const queryUserSearchForRecreationalLocations = query(
	getUserQueryResultFromDatabase,
	"search/userRecreationalLocations",
);

export const queryRecreationalLocationById = query(
	getRecreationalLocationFromDatabaseById,
	"location/byId",
);

export async function revalidateRecreationalLocationById() {
	return revalidate([queryRecreationalLocationById.key]);
}

export const queryRecreationalLocationCategories = query(
	getRecreationalLocationCategories,
	"location/categories",
);

export async function revalidateRecreationalLocationCategories() {
	return revalidate([queryRecreationalLocationCategories.key]);
}

export const queryRecreationalLocationsAtRandom = query(
	getRecreationalLocationsFromDatabaseAtRandom,
	"location/random",
);

export const queryRecreationalLocationsCloseToCoords = query(
	getRecreationalLocationsCloseToCoords,
	"location/nearby",
);

export const queryUsersByType = query(getUsersByType, "users/byType");

export const queryUserFavouriteLocations = query(
	getUserFavouriteLocations,
	"user/favouriteLocations",
);

export async function revalidateUserFavourites() {
	return revalidate([queryUserFavouriteLocations.key]);
}

export async function revalidateUserFavouriteStatus() {
	return revalidate([
		queryIsLocationInUserFavourites.key,
		queryUserFavouriteLocations.key,
	]);
}

export const queryIsLocationInUserFavourites = query(
	isLocationInUserFavourites,
	"user/isLocationInFavourites",
);

//
// Owner queries
//

export const queryLocationsByOwner = query(
	getLocationsByOwner,
	"owner/locationsByOwner",
);

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
