"use server";
import { redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import AUTH from "../server/lib/auth";

async function getSession() {
	const event = getRequestEvent();
	if (!event) {
		throw new Error(
			"Request event not available. This function must be called on the server.",
		);
	}

	const possibleSession = await AUTH.api.getSession({
		headers: event.request.headers,
	});

	if (!possibleSession) return null;

	return possibleSession;
}

/** Ensures that the user is authenticated, otherwise boots them to the login page  */
export async function ensureUserIsAuthenticated() {
	const session = await getSession();

	// Redirect back to the login page
	if (!session) throw redirect("/");

	return true;
}
