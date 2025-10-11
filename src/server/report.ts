"use server";

import { revalidate } from "@solidjs/router";
import {
	queryLocationReports,
	queryOwnerReports,
	queryReportById,
	queryUserReports,
} from "~/utils/report-query";
import {
	createReport,
	deleteReport,
	resolveReport,
	unresolveReport,
	updateReport,
} from "./database/report/action";

/**
 * Create a new report for a location
 */
export async function createLocationReport(
	locationId: string,
	title: string,
	message: string,
) {
	const report = await createReport({
		locationId,
		title,
		message,
	});

	// Revalidate relevant queries
	await revalidate([
		queryUserReports.key,
		queryLocationReports.key,
		queryOwnerReports.key,
	]);

	return report;
}

/**
 * Update a report
 */
export async function updateLocationReport(
	reportId: string,
	updates: {
		title?: string;
		message?: string;
		isResolved?: boolean;
		ownerReply?: string;
	},
) {
	const report = await updateReport({
		id: reportId,
		...updates,
	});

	// Revalidate relevant queries
	await revalidate([
		queryUserReports.key,
		queryLocationReports.key,
		queryOwnerReports.key,
		queryReportById.key,
	]);

	return report;
}

/**
 * Delete a report
 */
export async function deleteLocationReport(reportId: string) {
	const success = await deleteReport(reportId);

	// Revalidate relevant queries
	await revalidate([
		queryUserReports.key,
		queryLocationReports.key,
		queryOwnerReports.key,
	]);

	return success;
}

/**
 * Resolve a report with optional owner reply
 */
export async function resolveLocationReport(
	reportId: string,
	ownerReply?: string,
) {
	const report = await resolveReport(reportId, ownerReply);

	// Revalidate relevant queries
	await revalidate([
		queryUserReports.key,
		queryLocationReports.key,
		queryOwnerReports.key,
		queryReportById.key,
	]);

	return report;
}

/**
 * Unresolve a report
 */
export async function unresolveLocationReport(reportId: string) {
	const report = await unresolveReport(reportId);

	// Revalidate relevant queries
	await revalidate([
		queryUserReports.key,
		queryLocationReports.key,
		queryOwnerReports.key,
		queryReportById.key,
	]);

	return report;
}
