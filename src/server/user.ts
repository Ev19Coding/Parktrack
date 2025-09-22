"use server";
import { redirect } from "@solidjs/router";
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
export async function isUserOwner() {
	return ensureUserIsLoggedIn();
}

//TODO
export async function isUserAdmin() {
	return ensureUserIsLoggedIn();
}

//TODO
export async function isUserRegular() {
	return ensureUserIsLoggedIn();
}

export async function isUserGuest() {
	const session = await getSession();

	if (session) return false;

	return true;
}
