import { query, revalidate } from "@solidjs/router";
import {
	_isUserLoggedIn,
	isUserAdmin,
	isUserOwner,
	isUserRegular,
} from "~/server/user";

// These need to be wrapped with query to handle redirects properly
export const getOwnerData = query(async () => {
	if (await isUserOwner()) return {};
	return null;
}, "owner-data");

export const getAdminData = query(async () => {
	if (await isUserAdmin()) return {};
	return null;
}, "admin-data");

export const getRegularUserData = query(async () => {
	if (await isUserRegular()) return {};
	return null;
}, "regular-user-data");

export const isUserLoggedIn = query(_isUserLoggedIn, "is-user-logged-in");

export async function revalidateUserLoginData() {
	return revalidate([
		isUserLoggedIn.key,
		getOwnerData.key,
		getAdminData.key,
		getRegularUserData.key,
	]);
}
