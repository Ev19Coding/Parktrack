"use server";
import { redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import AUTH from "../server/lib/auth";
import type { User, UserType } from "./database/better-auth-schema";
import {
	addLocationToUserFavourites,
	isLocationInUserFavourites,
	removeLocationFromUserFavourites,
} from "./database/user/query";

async function getSession() {
	const event = getRequestEvent();
	if (!event) return null;

	const possibleSession = await AUTH.api.getSession({
		headers: event.request.headers,
	});

	if (!possibleSession) return null;

	return possibleSession;
}

async function getCurrentUser(): Promise<User | null> {
	const session = await getSession();
	if (!session?.user) return null;

	return session.user as User;
}

async function getUserType(): Promise<UserType | null> {
	const user = await getCurrentUser();
	return user?.type || null;
}

/** Get the current user's favourites array */
export async function getUserFavourites(): Promise<string[]> {
	const user = await getCurrentUser();
	return user?.favourites || [];
}

/** Add a recreational location to user's favourites */
export async function addToFavourites(locationId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("User not logged in");

	await addLocationToUserFavourites(user.id, locationId);
}

/** Remove a recreational location from user's favourites */
export async function removeFromFavourites(locationId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("User not logged in");

	await removeLocationFromUserFavourites(user.id, locationId);
}

/** Check if a location is in user's favourites */
export async function isLocationInFavourites(
	locationId: string,
): Promise<boolean> {
	const user = await getCurrentUser();
	if (!user) return false;

	return await isLocationInUserFavourites(user.id, locationId);
}

/** Update user type (admin only function) - requires custom implementation */
export async function updateUserType(
	userId: string,
	newType: UserType,
): Promise<void> {
	const currentUserType = await getUserType();
	if (currentUserType !== "admin") {
		throw new Error("Only administrators can change user types");
	}

	const event = getRequestEvent();
	if (!event) throw new Error("Request event not available");

	// Note: Better Auth doesn't have a built-in updateUser endpoint that works this way
	// We would need to implement a custom admin API endpoint for this functionality
	// For now, we'll use direct database update through the adapter

	const { getParkTrackDatabaseConnection } = await import("./database/util");
	const conn = await getParkTrackDatabaseConnection();

	await conn.streamAndReadAll(`
		UPDATE "user"
		SET type = '${newType}'
		WHERE id = '${userId}'
	`);
}

/** Get current user information */
export async function getCurrentUserInfo(): Promise<User | null> {
	return await getCurrentUser();
}

/** Check if current user is logged in */
export async function isUserLoggedIn(): Promise<boolean> {
	const session = await getSession();
	return !!session;
}

/** Get current user's ID */
export async function getCurrentUserId(): Promise<string | null> {
	const user = await getCurrentUser();
	return user?.id || null;
}

export async function isUserOwner() {
	const userType = await getUserType();
	return userType === "owner";
}

export async function isUserAdmin() {
	const userType = await getUserType();
	return userType === "admin";
}

export async function isUserRegular() {
	const userType = await getUserType();
	return userType === "user";
}

export async function isUserGuest() {
	const session = await getSession();

	if (session) return false;

	return true;
}

/** Check if user has permission to perform owner actions */
export async function canUserPerformOwnerActions(): Promise<boolean> {
	const userType = await getUserType();
	return userType === "owner" || userType === "admin";
}

/** Check if user has permission to perform admin actions */
export async function canUserPerformAdminActions(): Promise<boolean> {
	const userType = await getUserType();
	return userType === "admin";
}

/** Ensure user has specific type, otherwise redirect */
export async function ensureUserType(requiredType: UserType | UserType[]) {
	const userType = await getUserType();
	if (!userType) throw redirect("/");

	const allowedTypes = Array.isArray(requiredType)
		? requiredType
		: [requiredType];

	if (!allowedTypes.includes(userType)) {
		throw redirect("/"); // or redirect to unauthorized page
	}

	return true;
}

/** Ensure user is owner or admin */
export async function ensureUserIsOwnerOrAdmin() {
	return await ensureUserType(["owner", "admin"]);
}

/** Ensure user is admin */
export async function ensureUserIsAdmin() {
	return await ensureUserType("admin");
}
