import { query, revalidate } from "@solidjs/router";
import { getRecreationalLocationCategories } from "~/server/database/user/query";
import { _isUserLoggedIn, isUserOwner, isUserRegular } from "~/server/user";
import { getRandomElementInArray } from "./random";

// These need to be wrapped with query to handle redirects properly
export const getOwnerData = query(async () => {
	if (await isUserOwner()) return {};
	return null;
}, "owner-data");

export const getRegularUserData = query(async () => {
	if (await isUserRegular()) return {};
	return null;
}, "regular-user-data");

export const isUserLoggedIn = query(_isUserLoggedIn, "is-user-logged-in");

export async function revalidateUserLoginData() {
	return revalidate([
		isUserLoggedIn.key,
		getOwnerData.key,
		getRegularUserData.key,
	]);
}

export const queryRecreationalLocationCategories = query(
	() => getRecreationalLocationCategories(),
	"location-categories",
);
