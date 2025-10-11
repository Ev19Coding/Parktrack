"use server";

// This contains functions for writing to the database

import * as v from "valibot";
import { getCurrentUserInfo } from "~/server/user";
import type { RecreationalLocationSchema } from "../schema";
import { getParkTrackDatabaseConnection } from "../util";
import { USER_RECREATIONAL_LOCATION_TABLE } from "./constants";
import { getRecreationalLocationFromDatabaseById } from "./query";

// Helper to escape single quotes for SQL strings
const escapeForSql = (val: string) => val.replace(/'/g, "''");

const toSqlString = (val: string | null | undefined) =>
	val == null ? "NULL" : `'${escapeForSql(String(val))}'`;

const toSqlJson = (val: unknown) =>
	val == null ? "NULL" : `'${escapeForSql(JSON.stringify(val))}'`;

const toSqlNumber = (val: number | null | undefined) =>
	val == null ? "NULL" : String(val);

// Event-specific schemas
export const EventSchema = v.object({
	id: v.string(),
	name: v.pipe(v.string(), v.nonEmpty()),
	description: v.string(),
	dueFor: v.date(),
});

export type Event = v.InferOutput<typeof EventSchema>;

export const CreateEventSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty()),
	description: v.string(),
	dueFor: v.date(),
});

export type CreateEvent = v.InferOutput<typeof CreateEventSchema>;

/**
 * Create a new recreational location entry.
 *
 * The database (DuckDB) is expected to generate the `id` value itself.
 * Returns the created row from the DB (using the read helper).
 */
export async function createUserRecreationalLocationTableEntry(
	locationData: RecreationalLocationSchema,
) {
	const ownerInfo = await getCurrentUserInfo();

	if (!ownerInfo || ownerInfo.type !== "owner")
		throw Error("Only Owners can create table entries");

	// If the caller didn't supply owner data, fall back to current owner's info
	const ownerPayload =
		locationData.owner ??
		({
			id: ownerInfo.id,
			name: ownerInfo.name,
			link: "",
		} as unknown);

	// Use a CTE to compute the current max id and assign sequential ids with row_number().
	// This pattern lets DuckDB (when no SERIAL/sequence is defined) derive ids deterministically
	// at insert time. For heavy concurrency consider adding an explicit sequence mechanism.
	const sql = `
    WITH maxid AS (
      SELECT COALESCE(MAX(id), 0) AS m
      FROM ${USER_RECREATIONAL_LOCATION_TABLE}
    ), to_insert AS (
      SELECT
        ${toSqlString(locationData.title)} AS title,
        ${toSqlString(locationData.category)} AS category,
        ${toSqlString(locationData.address)} AS address,
        ${toSqlString(locationData.link)} AS link,
        ${toSqlNumber(locationData.latitude)} AS latitude,
        ${toSqlNumber(locationData.longitude)} AS longitude,
        ${toSqlString(locationData.thumbnail)} AS thumbnail,
        ${toSqlJson(locationData.images)} AS images,
        ${toSqlJson(locationData.openHours)} AS openHours,
        ${toSqlJson(locationData.popularTimes)} AS popularTimes,
        ${toSqlString(locationData.description)} AS description,
        ${toSqlString(locationData.phone)} AS phone,
        ${toSqlString(locationData.website)} AS website,
        ${toSqlJson(locationData.emails ?? [])} AS emails,
        ${toSqlNumber(locationData.rating)} AS rating,
        ${toSqlNumber(locationData.reviewRating)} AS reviewRating,
        ${toSqlNumber(locationData.reviewCount)} AS reviewCount,
        ${toSqlJson(locationData.reviewsBreakdown)} AS reviewsBreakdown,
        ${toSqlJson(locationData.reviewsPerRating)} AS reviewsPerRating,
        ${toSqlString(locationData.priceRange)} AS priceRange,
        ${toSqlString(locationData.timezone)} AS timezone,
        ${toSqlString(locationData.plusCode)} AS plusCode,
        ${toSqlString(locationData.dataId)} AS dataId,
        ${toSqlString(locationData.reviewsLink)} AS reviewsLink,
        ${toSqlJson(locationData.reservations)} AS reservations,
        ${toSqlJson(locationData.orderOnline)} AS orderOnline,
        ${toSqlJson(locationData.menu)} AS menu,
        ${toSqlJson(ownerPayload)} AS owner,
        ${toSqlJson(locationData.about ?? [])} AS about,
        ${toSqlJson(locationData.userReviews)} AS userReviews,
        ${toSqlJson(locationData.userReviewsExtended)} AS userReviewsExtended,
        ${locationData.isActive ? "TRUE" : "FALSE"} AS isActive
    )
    INSERT INTO ${USER_RECREATIONAL_LOCATION_TABLE} (
      id, title, category, address, link, latitude, longitude, thumbnail,
      images, openHours, popularTimes, description, phone, website, emails,
      rating, reviewRating, reviewCount, reviewsBreakdown, reviewsPerRating,
      priceRange, timezone, plusCode, dataId, reviewsLink, reservations,
      orderOnline, menu, owner, about, userReviews, userReviewsExtended, events, isActive
    )
  SELECT
    maxid.m + row_number() OVER () AS id,
    ti.title,
    ti.category,
    ti.address,
    ti.link,
    ti.latitude,
    ti.longitude,
    ti.thumbnail,
    ti.images,
    ti.openHours,
    ti.popularTimes,
    ti.description,
    ti.phone,
    ti.website,
    ti.emails,
    ti.rating,
    ti.reviewRating,
    ti.reviewCount,
    ti.reviewsBreakdown,
    ti.reviewsPerRating,
    ti.priceRange,
    ti.timezone,
    ti.plusCode,
    ti.dataId,
    ti.reviewsLink,
    ti.reservations,
    ti.orderOnline,
    ti.menu,
    ti.owner,
    ti.about,
    ti.userReviews,
    ti.userReviewsExtended,
    '[]' AS events,
    ti.isActive
    FROM to_insert ti, maxid
    RETURNING id
  `;

	const connection = await getParkTrackDatabaseConnection();

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	const returnedId = rows?.[0]?.["id"];
	if (returnedId == null) {
		// If the DB didn't return an id, something unexpected happened.
		throw new Error("Failed to create recreational location");
	}

	// Normalize id to string and return the inserted row
	const idStr = String(returnedId);
	return await getRecreationalLocationFromDatabaseById(idStr);
}

/**
 * Delete a recreational location entry.
 * Only the owner who created the entry can delete it.
 * Returns true if deletion succeeded (row no longer exists), false otherwise.
 */
export async function deleteUserRecreationalLocationTableEntry(
	entryId: string,
) {
	const [ownerInfo, originalEntryData] = await Promise.all([
		getCurrentUserInfo(),
		getRecreationalLocationFromDatabaseById(entryId),
	]);

	if (ownerInfo?.type !== "owner")
		throw Error("Only Owners can delete entries");

	if (!originalEntryData) return false;

	if (originalEntryData.owner?.id !== ownerInfo.id)
		throw Error("Owners can only delete entries they created");

	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(`
    DELETE FROM ${USER_RECREATIONAL_LOCATION_TABLE}
    WHERE id = ${entryId}
  `);

	// Confirm deletion
	const maybeStillThere =
		await getRecreationalLocationFromDatabaseById(entryId);
	return !maybeStillThere;
}

/**
 *
 * @param entryId
 * @param locationData
 */
export async function updateUserRecreationalLocationTableEntry(
	entryId: string,
	locationData: RecreationalLocationSchema,
) {
	const [ownerInfo, originalEntryData] = await Promise.all([
		getCurrentUserInfo(),
		getRecreationalLocationFromDatabaseById(entryId),
	]);

	if (ownerInfo?.type !== "owner")
		throw Error("Only Owners can update the table info");

	if (!originalEntryData) throw Error("No entry to update found");

	if (originalEntryData.owner?.id !== ownerInfo.id)
		throw Error("Owners can only update enties they created");

	// Build the UPDATE statement, only using the columns present on the schema
	const sql = `
   UPDATE ${USER_RECREATIONAL_LOCATION_TABLE}
   SET
    title = ${toSqlString(locationData.title)},
    category = ${toSqlString(locationData.category)},
    address = ${toSqlString(locationData.address)},
    link = ${toSqlString(locationData.link)},
    latitude = ${toSqlNumber(locationData.latitude)},
    longitude = ${toSqlNumber(locationData.longitude)},
    thumbnail = ${toSqlString(locationData.thumbnail)},
    images = ${toSqlJson(locationData.images)},
    openHours = ${toSqlJson(locationData.openHours)},
    popularTimes = ${toSqlJson(locationData.popularTimes)},
    description = ${toSqlString(locationData.description)},
    phone = ${toSqlString(locationData.phone)},
    website = ${toSqlString(locationData.website)},
    emails = ${toSqlJson(locationData.emails)},
    rating = ${toSqlNumber(locationData.rating)},
    reviewRating = ${toSqlNumber(locationData.reviewRating)},
    reviewCount = ${toSqlNumber(locationData.reviewCount)},
    reviewsBreakdown = ${toSqlJson(locationData.reviewsBreakdown)},
    reviewsPerRating = ${toSqlJson(locationData.reviewsPerRating)},
    priceRange = ${toSqlString(locationData.priceRange)},
    timezone = ${toSqlString(locationData.timezone)},
    plusCode = ${toSqlString(locationData.plusCode)},
    dataId = ${toSqlString(locationData.dataId)},
    reviewsLink = ${toSqlString(locationData.reviewsLink)},
    reservations = ${toSqlJson(locationData.reservations)},
    orderOnline = ${toSqlJson(locationData.orderOnline)},
    menu = ${toSqlJson(locationData.menu)},
    owner = ${toSqlJson(locationData.owner)},
    about = ${toSqlJson(locationData.about ?? [])},
    userReviews = ${toSqlJson(locationData.userReviews)},
    userReviewsExtended = ${toSqlJson(locationData.userReviewsExtended)},
    events = ${toSqlJson(locationData.events ?? [])},
    updatedAt = CURRENT_TIMESTAMP,
    isActive = ${locationData.isActive ? "TRUE" : "FALSE"}
   WHERE id = ${entryId}
  `;

	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(sql);

	// Return the updated row (if exists)
	return await getRecreationalLocationFromDatabaseById(entryId);
}

/**
 * Add a new event to a recreational location.
 * Only the owner of the location can add events.
 */
export async function addEventToLocation(
	locationId: string,
	eventData: CreateEvent,
): Promise<RecreationalLocationSchema | null> {
	const [ownerInfo, locationData] = await Promise.all([
		getCurrentUserInfo(),
		getRecreationalLocationFromDatabaseById(locationId),
	]);

	if (ownerInfo?.type !== "owner") throw Error("Only owners can add events");

	if (!locationData) throw Error("Location not found");

	if (locationData.owner?.id !== ownerInfo.id)
		throw Error("Owners can only add events to locations they own");

	// Generate a new event ID
	const eventId = crypto.randomUUID();

	// Create the new event object
	const newEvent: Event = {
		id: eventId,
		name: eventData.name,
		description: eventData.description,
		dueFor: eventData.dueFor,
	};

	// Get current events and add the new one
	const currentEvents = locationData.events || [];
	const updatedEvents = [...currentEvents, newEvent];

	// Update the location with the new events array
	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(`
		UPDATE ${USER_RECREATIONAL_LOCATION_TABLE}
		SET
			events = ${toSqlJson(updatedEvents)},
			updatedAt = CURRENT_TIMESTAMP
		WHERE id = ${locationId}
	`);

	// Return the updated location
	const updatedLocation =
		await getRecreationalLocationFromDatabaseById(locationId);
	return updatedLocation || null;
}

/**
 * Update an event in a recreational location.
 * Only the owner of the location can update events.
 */
export async function updateEventInLocation(
	locationId: string,
	eventId: string,
	eventData: Partial<Omit<Event, "id">>,
): Promise<RecreationalLocationSchema | null> {
	const [ownerInfo, locationData] = await Promise.all([
		getCurrentUserInfo(),
		getRecreationalLocationFromDatabaseById(locationId),
	]);

	if (ownerInfo?.type !== "owner") throw Error("Only owners can update events");

	if (!locationData) throw Error("Location not found");

	if (locationData.owner?.id !== ownerInfo.id)
		throw Error("Owners can only update events for locations they own");

	// Get current events and find the one to update
	const currentEvents = locationData.events || [];
	const eventIndex = currentEvents.findIndex((e) => e.id === eventId);

	if (eventIndex === -1) throw Error("Event not found");

	// Update the event
	const currentEvent = currentEvents[eventIndex];
	if (!currentEvent) throw Error("Event not found");

	const updatedEvent: Event = {
		id: currentEvent.id,
		name: eventData.name ?? currentEvent.name,
		description: eventData.description ?? currentEvent.description,
		dueFor: eventData.dueFor ?? currentEvent.dueFor,
	};

	// Replace the event in the array
	const updatedEvents = [...currentEvents];
	updatedEvents[eventIndex] = updatedEvent;

	// Update the location with the modified events array
	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(`
		UPDATE ${USER_RECREATIONAL_LOCATION_TABLE}
		SET
			events = ${toSqlJson(updatedEvents)},
			updatedAt = CURRENT_TIMESTAMP
		WHERE id = ${locationId}
	`);

	// Return the updated location
	const updatedLocation =
		await getRecreationalLocationFromDatabaseById(locationId);
	return updatedLocation || null;
}

/**
 * Delete an event from a recreational location.
 * Only the owner of the location can delete events.
 */
export async function deleteEventFromLocation(
	locationId: string,
	eventId: string,
): Promise<RecreationalLocationSchema | null> {
	const [ownerInfo, locationData] = await Promise.all([
		getCurrentUserInfo(),
		getRecreationalLocationFromDatabaseById(locationId),
	]);

	if (ownerInfo?.type !== "owner") throw Error("Only owners can delete events");

	if (!locationData) throw Error("Location not found");

	if (locationData.owner?.id !== ownerInfo.id)
		throw Error("Owners can only delete events from locations they own");

	// Get current events and filter out the one to delete
	const currentEvents = locationData.events || [];
	const updatedEvents = currentEvents.filter((e) => e.id !== eventId);

	// Update the location with the filtered events array
	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(`
		UPDATE ${USER_RECREATIONAL_LOCATION_TABLE}
		SET
			events = ${toSqlJson(updatedEvents)},
			updatedAt = CURRENT_TIMESTAMP
		WHERE id = ${locationId}
	`);

	// Return the updated location
	const updatedLocation =
		await getRecreationalLocationFromDatabaseById(locationId);
	return updatedLocation || null;
}

/**
 * Get upcoming events from user's favorite locations.
 * Returns events that are scheduled for the next specified number of days.
 */
export async function getUpcomingEventsForUser(
	daysAhead: number = 90,
): Promise<Array<Event & { locationId: string; locationTitle: string }>> {
	const ownerInfo = await getCurrentUserInfo();

	if (!ownerInfo) throw Error("User must be logged in");

	const connection = await getParkTrackDatabaseConnection();

	// Get user's favorites
	const userResult = await connection.streamAndReadAll(`
		SELECT favourites
		FROM "user"
		WHERE id = '${escapeForSql(ownerInfo.id)}'
	`);

	const userRows = userResult.getRowObjectsJS();
	if (!userRows.length) return [];

	const userRow = userRows[0];
	if (!userRow || typeof userRow !== "object") return [];

	const favouritesRaw = userRow["favourites"] || [];
	// Parse favorites if it's a JSON string
	const favourites =
		typeof favouritesRaw === "string"
			? JSON.parse(favouritesRaw)
			: favouritesRaw;
	if (!Array.isArray(favourites) || favourites.length === 0) return [];

	// Get locations with events
	const locationIds = favourites
		.map((id) => `'${escapeForSql(String(id))}'`)
		.join(",");

	const locationsResult = await connection.streamAndReadAll(`
		SELECT id, title, events
		FROM ${USER_RECREATIONAL_LOCATION_TABLE}
		WHERE id IN (${locationIds})
		AND events IS NOT NULL
		AND json_array_length(events) > 0
	`);

	const locationRows = locationsResult.getRowObjectsJS();

	// Process events and filter for upcoming ones
	const upcomingEvents: Array<
		Event & { locationId: string; locationTitle: string }
	> = [];
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

	for (const row of locationRows) {
		if (!row || typeof row !== "object") continue;

		const eventsRaw = row["events"] || [];
		// Parse events if it's a JSON string
		const events =
			typeof eventsRaw === "string" ? JSON.parse(eventsRaw) : eventsRaw;
		if (!Array.isArray(events)) continue;

		for (const event of events) {
			if (!event || typeof event !== "object") continue;

			const eventObj = event as Record<string, unknown>;
			if (!eventObj["dueFor"]) continue;

			const eventDate = new Date(eventObj["dueFor"] as string);
			const now = new Date();

			// Include events that are today or in the future, within the specified range
			if (eventDate >= now && eventDate <= cutoffDate) {
				upcomingEvents.push({
					id: String(eventObj["id"] || ""),
					name: String(eventObj["name"] || ""),
					description: String(eventObj["description"] || ""),
					dueFor: eventDate,
					locationId: String(row["id"]),
					locationTitle: String(row["title"]),
				});
			}
		}
	}

	// Sort by date
	upcomingEvents.sort((a, b) => a.dueFor.getTime() - b.dueFor.getTime());

	return upcomingEvents;
}
