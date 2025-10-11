import { query } from "@solidjs/router";
import {
	getReportById,
	getReportsByLocationId,
	getReportsByUserId,
	getReportsForOwnerLocations,
} from "~/server/database/report/query";
import { getCurrentUserInfo } from "~/server/user";

/**
 * Get a specific report by ID
 */
export const queryReportById = query(async (reportId: string) => {
	"use server";
	return await getReportById(reportId);
}, "reportById");

/**
 * Get all reports for a specific location
 */
export const queryLocationReports = query(async (locationId: string) => {
	"use server";
	return await getReportsByLocationId(locationId);
}, "locationReports");

/**
 * Get all reports created by the current user
 */
export const queryUserReports = query(async () => {
	"use server";
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) return [];

	return await getReportsByUserId(userInfo.id);
}, "userReports");

/**
 * Get all reports for locations owned by the current user
 */
export const queryOwnerReports = query(async () => {
	"use server";
	const userInfo = await getCurrentUserInfo();
	if (!userInfo) return [];

	return await getReportsForOwnerLocations(userInfo.id);
}, "ownerReports");
