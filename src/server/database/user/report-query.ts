import { generateRandomUUID } from "~/utils/random";
import { getParkTrackDatabaseConnection } from "../util";
import { z } from "zod";

export const ReportSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  ownerId: z.string(),
  reason: z.string(),
  details: z.string().optional(),
  email: z.string().optional(),
  photo: z.instanceof(Blob).optional(),
  createdAt: z.date(),
  status: z.enum(["pending", "resolved", "rejected"]).default("pending")
});

export type Report = z.infer<typeof ReportSchema>;

export async function createReport(report: Omit<Report, "id" | "status">) {
  const id = generateRandomUUID();
  const db = await getParkTrackDatabaseConnection();
  await db.query(`
    INSERT INTO reports (id, location_id, owner_id, reason, details, email, photo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    report.locationId,
    report.ownerId,
    report.reason,
    report.details || null,
    report.email || null,
    report.photo || null,
    report.createdAt.toISOString()
  ]);
  return id;
}

export async function getReportsByOwnerId(ownerId: string) {
  const db = await getParkTrackDatabaseConnection();
  const reports = await db.query(`
    SELECT r.*, rl.name as location_name
    FROM reports r
    JOIN recreational_locations rl ON r.location_id = rl.id
    WHERE r.owner_id = ?
    ORDER BY r.created_at DESC
  `, [ownerId]);
  
  return reports.map((row: any) => ({
    ...ReportSchema.parse(row),
    locationName: row.location_name
  }));
}

export async function updateReportStatus(reportId: string, status: Report["status"]) {
  const db = await getParkTrackDatabaseConnection();
  await db.query(`
    UPDATE reports
    SET status = ?
    WHERE id = ?
  `, [status, reportId]);
}