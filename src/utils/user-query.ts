import { query, revalidate } from "@solidjs/router";
import { _isUserLoggedIn, isUserOwner, isUserRegular } from "~/server/user";

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
