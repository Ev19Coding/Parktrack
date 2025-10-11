"use server";

import * as v from "valibot";
import { getCurrentUserInfo } from "~/server/user";
import type { ReportSchema as ReportSchemaType } from "../schema";
import { getParkTrackDatabaseConnection } from "../util";
import { doesUserOwnReportLocation, getReportById } from "./query";

const REPORT_TABLE = "report";

// Helper to escape single quotes for SQL strings
const escapeForSql = (val: string) => val.replace(/'/g, "''");

const toSqlString = (val: string | null | undefined) =>
	val == null ? "NULL" : `'${escapeForSql(String(val))}'`;

const CreateReportSchema = v.pipe(
	v.object({
		locationId: v.string(),
		title: v.pipe(v.string(), v.nonEmpty()),
		message: v.string(),
	}),
	v.readonly(),
);

const UpdateReportSchema = v.pipe(
	v.object({
		id: v.string(),
		title: v.optional(v.pipe(v.string(), v.nonEmpty())),
		message: v.optional(v.string()),
		isResolved: v.optional(v.boolean()),
		ownerReply: v.optional(v.string()),
	}),
	v.readonly(),
);

type CreateReportInput = v.InferInput<typeof CreateReportSchema>;
type UpdateReportInput = v.InferInput<typeof UpdateReportSchema>;

/**
 * Create a new report
 */
export async function createReport(
	input: CreateReportInput,
): Promise<ReportSchemaType> {
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) {
		throw new Error("User must be logged in to create reports");
	}

	const validatedInput = v.parse(CreateReportSchema, input);

	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		INSERT INTO ${REPORT_TABLE} (
			locationId,
			userId,
			title,
			message
		) VALUES (
			'${escapeForSql(validatedInput.locationId)}',
			'${escapeForSql(userInfo.id)}',
			${toSqlString(validatedInput.title)},
			${toSqlString(validatedInput.message)}
		)
		RETURNING id
	`;

	const result = await connection.streamAndReadAll(sql);
	const rows = result.getRowObjectsJS();

	const reportId = String(rows[0]?.["id"]);
	if (!reportId) {
		throw new Error("Failed to create report");
	}

	const createdReport = await getReportById(reportId);
	if (!createdReport) {
		throw new Error("Failed to retrieve created report");
	}

	return createdReport;
}

/**
 * Update a report (users can update their own reports, owners can update any report on their locations)
 */
export async function updateReport(
	input: UpdateReportInput,
): Promise<ReportSchemaType> {
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) {
		throw new Error("User must be logged in to update reports");
	}

	const validatedInput = v.parse(UpdateReportSchema, input);
	const existingReport = await getReportById(validatedInput.id);

	if (!existingReport) {
		throw new Error("Report not found");
	}

	// Check permissions - users can update their own reports, owners can update reports on their locations
	const isReportOwner = existingReport.userId === userInfo.id;
	const isLocationOwner = await doesUserOwnReportLocation(
		userInfo.id,
		validatedInput.id,
	);

	if (!isReportOwner && !isLocationOwner) {
		throw new Error("Not authorized to update this report");
	}

	const connection = await getParkTrackDatabaseConnection();

	// Build update fields
	const updateFields: string[] = ["updatedAt = CURRENT_TIMESTAMP"];

	if (validatedInput.title !== undefined) {
		updateFields.push(`title = ${toSqlString(validatedInput.title)}`);
	}

	if (validatedInput.message !== undefined) {
		updateFields.push(`message = ${toSqlString(validatedInput.message)}`);
	}

	if (validatedInput.isResolved !== undefined) {
		updateFields.push(
			`isResolved = ${validatedInput.isResolved ? "TRUE" : "FALSE"}`,
		);
	}

	if (validatedInput.ownerReply !== undefined) {
		updateFields.push(`ownerReply = ${toSqlString(validatedInput.ownerReply)}`);
		updateFields.push("ownerReplyAt = CURRENT_TIMESTAMP");
	}

	const sql = `
		UPDATE ${REPORT_TABLE}
		SET ${updateFields.join(", ")}
		WHERE id = '${escapeForSql(validatedInput.id)}'
	`;

	await connection.streamAndReadAll(sql);

	const updatedReport = await getReportById(validatedInput.id);
	if (!updatedReport) {
		throw new Error("Failed to retrieve updated report");
	}

	return updatedReport;
}

/**
 * Delete a report (only the report creator can delete their own reports)
 */
export async function deleteReport(reportId: string): Promise<boolean> {
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) {
		throw new Error("User must be logged in to delete reports");
	}

	const existingReport = await getReportById(reportId);
	if (!existingReport) {
		return false; // Report doesn't exist
	}

	// Only the report creator can delete their report
	if (existingReport.userId !== userInfo.id) {
		throw new Error("Not authorized to delete this report");
	}

	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		DELETE FROM ${REPORT_TABLE}
		WHERE id = '${escapeForSql(reportId)}'
	`;

	await connection.streamAndReadAll(sql);

	// Verify deletion
	const deletedReport = await getReportById(reportId);
	return !deletedReport;
}

/**
 * Resolve a report (only location owners can resolve reports on their locations)
 */
export async function resolveReport(
	reportId: string,
	ownerReply?: string,
): Promise<ReportSchemaType> {
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) {
		throw new Error("User must be logged in to resolve reports");
	}

	const existingReport = await getReportById(reportId);
	if (!existingReport) {
		throw new Error("Report not found");
	}

	// Check if user owns the location
	const isLocationOwner = await doesUserOwnReportLocation(
		userInfo.id,
		reportId,
	);

	if (!isLocationOwner) {
		throw new Error("Only location owners can resolve reports");
	}

	const connection = await getParkTrackDatabaseConnection();

	const updateFields = ["isResolved = TRUE", "updatedAt = CURRENT_TIMESTAMP"];

	if (ownerReply) {
		updateFields.push(`ownerReply = ${toSqlString(ownerReply)}`);
		updateFields.push("ownerReplyAt = CURRENT_TIMESTAMP");
	}

	const sql = `
		UPDATE ${REPORT_TABLE}
		SET ${updateFields.join(", ")}
		WHERE id = '${escapeForSql(reportId)}'
	`;

	await connection.streamAndReadAll(sql);

	const resolvedReport = await getReportById(reportId);
	if (!resolvedReport) {
		throw new Error("Failed to retrieve resolved report");
	}

	return resolvedReport;
}

/**
 * Unresolve a report (only location owners can unresolve reports on their locations)
 */
export async function unresolveReport(
	reportId: string,
): Promise<ReportSchemaType> {
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) {
		throw new Error("User must be logged in to unresolve reports");
	}

	const existingReport = await getReportById(reportId);
	if (!existingReport) {
		throw new Error("Report not found");
	}

	// Check if user owns the location
	const isLocationOwner = await doesUserOwnReportLocation(
		userInfo.id,
		reportId,
	);

	if (!isLocationOwner) {
		throw new Error("Only location owners can unresolve reports");
	}

	const connection = await getParkTrackDatabaseConnection();

	const sql = `
		UPDATE ${REPORT_TABLE}
		SET isResolved = FALSE, updatedAt = CURRENT_TIMESTAMP
		WHERE id = '${escapeForSql(reportId)}'
	`;

	await connection.streamAndReadAll(sql);

	const unresolvedReport = await getReportById(reportId);
	if (!unresolvedReport) {
		throw new Error("Failed to retrieve unresolved report");
	}

	return unresolvedReport;
}
