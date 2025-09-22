import { query, revalidate } from "@solidjs/router";
import { isUserAdmin, isUserOwner, isUserRegular } from "~/server/user";

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

export async function revalidateUserLoginData() {
	return revalidate([
		getOwnerData.key,
		getAdminData.key,
		getRegularUserData.key,
	]);
}
