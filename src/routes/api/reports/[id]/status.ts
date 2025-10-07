import { APIEvent, json } from "solid-start";
import { z } from "zod";
import { queryAuthenticatedUser } from "~/utils/user-query";
import { updateReportStatus } from "~/server/database/user/report-query";

const updateStatusSchema = z.object({
  status: z.enum(["resolved", "rejected"])
});

export async function POST({ params, request }: APIEvent) {
  try {
    // Verify authentication
    const user = await queryAuthenticatedUser();
    if (!user) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Update report status
    await updateReportStatus(params.id, status);

    return json({ success: true });
  } catch (error) {
    console.error("Error updating report status:", error);
    return json({ error: "Failed to update report status" }, { status: 500 });
  }
}