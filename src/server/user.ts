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
import { getParkTrackDatabaseConnection } from "./database/util";

// TODO: Write Tests

// TODO: Update the user object with any new props added to the table
type Session = {
	session: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null | undefined;
		userAgent?: string | null | undefined;
	};
	user: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		email: string;
		emailVerified: boolean;
		name: string;
		image?: string | null | undefined;
		type: string;
		favourites: string[];
	};
};

// Short-lived global cache (process-local). TTL in ms.
const GLOBAL_CACHE_TTL_MS = 5_000;

// Map from cacheKey -> { session, expiresAt }
const globalSessionCache = new Map<
	string,
	{ session: Session; expiresAt: number }
>();

// Map from cacheKey -> pending promise to deduplicate concurrent requests
const pendingSessionPromises = new Map<string, Promise<Session | null>>();

function getCacheKeyFromHeaders(headers: Headers): string | null {
	// Prefer cookie as the cache key; fall back to authorization header.
	// If neither present, return null (we won't do global caching).
	const cookie = headers.get("cookie");
	if (cookie && cookie.length > 0) return `cookie:${cookie}`;

	const auth = headers.get("authorization");
	if (auth && auth.length > 0) return `auth:${auth}`;

	return null;
}

async function fetchSession(headers: Headers): Promise<Session | null> {
	return AUTH.api.getSession({ headers });
}

async function getSession(): Promise<Session | null> {
	const event = getRequestEvent();
	if (!event) return null;

	// Use locals for per-request caching so multiple calls in the same request reuse the result.
	// Avoid using type assertions; using an index property on locals is safe here.
	if (event.locals && Object.hasOwn(event.locals, "__session")) {
		//@ts-expect-error reading back the cached value
		return event.locals.__session as Session | null;
	}

	const headers = event.request.headers;
	const cacheKey = getCacheKeyFromHeaders(headers);

	// If we have a cacheKey, try the global cache first.
	if (cacheKey) {
		const cached = globalSessionCache.get(cacheKey);
		if (cached && cached.expiresAt > Date.now()) {
			//@ts-expect-error store into locals for per-request reuse
			event.locals.__session = cached.session;
			return cached.session;
		}

		// If a pending promise exists for this key, reuse it to avoid duplicate fetches.
		const existingPromise = pendingSessionPromises.get(cacheKey);
		if (existingPromise) {
			const session = await existingPromise;
			//@ts-expect-error store into locals for per-request reuse
			event.locals.__session = session;
			return session;
		}

		// No pending promise; create one and store it in the pending map.
		const promise = (async () => {
			try {
				const session = await fetchSession(headers);
				if (session) {
					globalSessionCache.set(cacheKey, {
						session,
						expiresAt: Date.now() + GLOBAL_CACHE_TTL_MS,
					});
				}
				return session;
			} finally {
				// clean up pending promise regardless of success/failure to avoid leaks
				pendingSessionPromises.delete(cacheKey);
			}
		})();

		pendingSessionPromises.set(cacheKey, promise);

		const session = await promise;
		//@ts-expect-error store into locals for per-request reuse
		event.locals.__session = session;
		return session;
	}

	// No safe cache key available (no cookie/authorization header). Only do per-request caching.
	const session = await fetchSession(headers);
	//@ts-expect-error store into locals for per-request reuse
	event.locals.__session = session;
	return session;
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
export async function getUserFavourites(): Promise<ReadonlyArray<string>> {
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

export async function updateUserType(
	userId: string,
	newType: UserType,
): Promise<void> {
	const conn = await getParkTrackDatabaseConnection();

	await conn.streamAndReadAll(`
		UPDATE "user"
		SET type = '${newType}'
		WHERE id = '${userId}'
	`);
}

/** Get current user information */
export async function getCurrentUserInfo(): Promise<User | null> {
	return getCurrentUser();
}

/** Check if current user is logged in */
export async function isUserLoggedIn(): Promise<boolean> {
	return !!(await getSession());
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

export async function isUserRegular() {
	const userType = await getUserType();
	return userType === "user";
}

// export async function isUserGuest() {
// 	const session = await getSession();

// 	if (session) return false;

// 	return true;
// }

/** Check if user has permission to perform owner actions */

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

/**
 * @returns `true` if the user was successfully converted to an owner, `false` otherwise
 */
export async function convertUserToOwner(): Promise<boolean> {
	const userInfo = await getCurrentUserInfo();

	if (!userInfo) return false;

	await updateUserType(userInfo.id, "owner");

	return true;
}

/**
 * @returns `true` if the owner was successfully converted to a user, `false` otherwise
 */
export async function convertOwnerToUser(): Promise<boolean> {
	const ownerInfo = await getCurrentUserInfo();

	if (!ownerInfo) return false;

	await updateUserType(ownerInfo.id, "user");

	return true;
}
