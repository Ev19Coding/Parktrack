"use server";
import { query, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import AUTH from "../server/lib/auth";

async function getSession() {
	const event = getRequestEvent();
	if (!event) return null;

	const possibleSession = await AUTH.api.getSession({
		headers: event.request.headers,
	});

	if (!possibleSession) return null;

	return possibleSession;
}

/** Ensures that the user is logged in, otherwise boots them to the login page  */
async function ensureUserIsLoggedIn() {
	const session = await getSession();

	// Redirect back to the login page
	if (!session) throw redirect("/");

	return true;
}

//TODO
async function isUserOwner() {
	return ensureUserIsLoggedIn();
}

//TODO
async function isUserAdmin() {
	return ensureUserIsLoggedIn();
}

//TODO
async function isUserRegular() {
	return ensureUserIsLoggedIn();
}

//TODO
export const isUserGuest = async () => {
	const session = await getSession();

	if (session) return false;

	return true;
};

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
