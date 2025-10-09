"use server";

import { motherDuckAdapter } from "~/server/lib/motherduck-adapter";
import { randomUUID } from "crypto";

// initialize adapter once
const adapter = motherDuckAdapter({ usePlural: false, debugLogs: true }).adapter({});


// 1. Create a report
export async function submitReportAction(formData: FormData) {
  const userEmail = formData.get("userEmail") as string;
  const locationId = formData.get("locationId") as string;
  const ownerId = formData.get("ownerId") as string;
  const reason = formData.get("reason") as string;
  const description = formData.get("description") as string;

  if (!userEmail || !locationId || !reason) {
    throw new Error("Missing required fields");
  }

  return await adapter.create({ model: "reports", data:{} })({
    model: "reports",
    data: {
      id: randomUUID(),
      locationId: locationId,
      ownerId: ownerId,
      userEmail: userEmail,
      reason,
      description,
      date: new Date(),
    },
  });
}

// 2. Get all reports for a specific owner
export async function getReportsForOwner(ownerId: string) {
  return await adapter.findMany({
    model: "reports",
    where: [{ field: "owner_id", value: ownerId }],
    sortBy: { field: "date", direction: "DESC" },
  });
}

// 3. Get a single report by ID
export async function getReportById(reportId: string) {
  return await adapter.findOne({
    model: "reports",
    where: [{ field: "id", value: reportId }],
  });
}

// 4. Delete report (optional)
export async function deleteReport(reportId: string) {
  await adapter.delete({
    model: "reports",
    where: [{ field: "id", value: reportId }],
  });
}
