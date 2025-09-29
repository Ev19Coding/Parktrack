"use server";

// This contains functions for writing to the database

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
      orderOnline, menu, owner, about, userReviews, userReviewsExtended, isActive
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
    updatedAt = CURRENT_TIMESTAMP,
    isActive = ${locationData.isActive ? "TRUE" : "FALSE"}
   WHERE id = ${entryId}
  `;

	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(sql);

	// Return the updated row (if exists)
	return await getRecreationalLocationFromDatabaseById(entryId);
}
