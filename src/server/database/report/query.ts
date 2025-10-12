/** biome-ignore-all lint/complexity/useLiteralKeys: <Typescript takes priority> */
"use server";

import * as v from "valibot";
import { ReportSchema, type ReportSchema as ReportSchemaType } from "../schema";
import { USER_RECREATIONAL_LOCATION_TABLE } from "../user/constants";
import { getParkTrackDatabaseConnection } from "../util";

const REPORT_TABLE = "report";

// Helper to escape single quotes for SQL strings
const escapeForSql = (val: string) => val.replace(/'/g, "''");

/**
 * Get a report by ID
 */
export async function getReportById(
	reportId: string,
): Promise<ReportSchemaType | null> {
	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		SELECT * FROM ${REPORT_TABLE}
		WHERE id = '${escapeForSql(reportId)}'
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	if (rows.length === 0) return null;

	const row = rows[0];
	if (!row) return null;

	return v.parse(ReportSchema, {
		id: String(row["id"]),
		locationId: String(row["locationId"]),
		userId: String(row["userId"]),
		title: String(row["title"]),
		message: String(row["message"]),
		createdAt: row["createdAt"],
		updatedAt: row["updatedAt"],
		isResolved: Boolean(row["isResolved"]),
		ownerReply: row["ownerReply"] ? String(row["ownerReply"]) : null,
		ownerReplyAt: row["ownerReplyAt"] || null,
	});
}

/**
 * Get all reports for a specific location
 */
export async function getReportsByLocationId(
	locationId: string,
): Promise<ReportSchemaType[]> {
	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		SELECT * FROM ${REPORT_TABLE}
		WHERE locationId = '${escapeForSql(locationId)}'
		ORDER BY createdAt DESC
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	return rows.map((row) =>
		v.parse(ReportSchema, {
			id: String(row["id"]),
			locationId: String(row["locationId"]),
			userId: String(row["userId"]),
			title: String(row["title"]),
			message: String(row["message"]),
			createdAt: row["createdAt"],
			updatedAt: row["updatedAt"],
			isResolved: Boolean(row["isResolved"]),
			ownerReply: row["ownerReply"] ? String(row["ownerReply"]) : null,
			ownerReplyAt: row["ownerReplyAt"] || null,
		}),
	);
}

/**
 * Get all reports created by a specific user
 */
export async function getReportsByUserId(
	userId: string,
): Promise<ReportSchemaType[]> {
	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		SELECT * FROM ${REPORT_TABLE}
		WHERE userId = '${escapeForSql(userId)}'
		ORDER BY createdAt DESC
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	return rows.map((row) =>
		v.parse(ReportSchema, {
			id: String(row["id"]),
			locationId: String(row["locationId"]),
			userId: String(row["userId"]),
			title: String(row["title"]),
			message: String(row["message"]),
			createdAt: row["createdAt"],
			updatedAt: row["updatedAt"],
			isResolved: Boolean(row["isResolved"]),
			ownerReply: row["ownerReply"] ? String(row["ownerReply"]) : null,
			ownerReplyAt: row["ownerReplyAt"] || null,
		}),
	);
}

/**
 * Get reports for locations owned by a specific user
 */
export async function getReportsForOwnerLocations(
	ownerId: string,
): Promise<Array<ReportSchemaType & { locationTitle: string }>> {
	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		SELECT
			r.*,
			l.title as locationTitle
		FROM ${REPORT_TABLE} r
		JOIN user_recreational_locations l ON r.locationId = l.id
		WHERE json_extract_string(l.owner, '$.id') = '${escapeForSql(ownerId)}'
		ORDER BY r.createdAt DESC
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	return rows.map((row) => ({
		...v.parse(ReportSchema, {
			id: String(row["id"]),
			locationId: String(row["locationId"]),
			userId: String(row["userId"]),
			title: String(row["title"]),
			message: String(row["message"]),
			createdAt: row["createdAt"],
			updatedAt: row["updatedAt"],
			isResolved: Boolean(row["isResolved"]),
			ownerReply: row["ownerReply"] ? String(row["ownerReply"]) : null,
			ownerReplyAt: row["ownerReplyAt"] || null,
		}),
		locationTitle: String(row["locationTitle"]),
	}));
}

export async function queryLocationOwnerId(
	locationId: string,
): Promise<string | undefined> {
	const connection = await getParkTrackDatabaseConnection();

	try {
		const fetchedLocation = (
			await connection.streamAndReadAll(`
				SELECT owner
				FROM ${USER_RECREATIONAL_LOCATION_TABLE}
				WHERE id = ${locationId}
				LIMIT 1
			`)
		).getRowObjectsJS();

		if (!fetchedLocation.length) {
			return undefined;
		}

		const ownerData = fetchedLocation[0]?.["owner"];

		if (!ownerData) {
			return undefined; // No owner data exists
		}

		let ownerObject: { id?: string | number };
		try {
			// Parse the JSON string into an object (DuckDB often returns JSON as a string)
			ownerObject =
				typeof ownerData === "string" ? JSON.parse(ownerData) : ownerData;
		} catch {
			return undefined; // Failed to parse owner JSON
		}

		const ownerId = ownerObject?.id;

		if (ownerId === undefined || ownerId === null) {
			return undefined; // 'id' field is missing or null in the JSON
		}

		// Ensure the ID is a string for consistent comparison (since DB IDs are often BIGINTs)
		return String(ownerId);
	} catch (error) {
		console.error(`Error querying location owner ID for ${locationId}:`, error);
		return undefined;
	}
}
/**
 * Check if a user owns the location for a given report
 */
export async function doesUserOwnReportLocation(
	userId: string,
	reportId: string,
): Promise<boolean> {
	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		SELECT COUNT(*) as count
		FROM ${REPORT_TABLE} r
		JOIN user_recreational_locations l ON r.locationId = l.id
		WHERE r.id = '${escapeForSql(reportId)}'
		AND json_extract_string(l.owner, '$.id') = '${escapeForSql(userId)}'
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	return Number(rows[0]?.["count"] || 0) > 0;
}
