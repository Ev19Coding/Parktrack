import { query, revalidate } from "@solidjs/router";
import {
	getLocationsByOwner,
	getRecreationalLocationCategories,
} from "~/server/database/user/query";
import {
	_isUserLoggedIn,
	getCurrentUserInfo,
	isUserOwner,
	isUserRegular,
} from "~/server/user";

// These need to be wrapped with query to handle redirects properly

/** Returns all the relevant data of the owner */
export const getOwnerData = query(async () => {
	if (await isUserOwner()) {
		const ownerInfo = await getCurrentUserInfo();

		if (!ownerInfo) return null;

		const ownerLocations = await getLocationsByOwner(ownerInfo.id);

		return { locations: ownerLocations } as const;
	}
	return null;
}, "owner-data");

export const getRegularUserData = query(async () => {
	if (await isUserRegular()) return {};
	return null;
}, "regular-user-data");

export const isUserLoggedIn = query(_isUserLoggedIn, "is-user-logged-in");

export const queryIsUserOwner = query(isUserOwner, "is-user-owner");

export async function revalidateUserLoginData() {
	return revalidate([
		isUserLoggedIn.key,
		getOwnerData.key,
		getRegularUserData.key,
		queryIsUserOwner.key,
	]);
}

export const queryRecreationalLocationCategories = query(
	() => getRecreationalLocationCategories(),
	"location-categories",
);
