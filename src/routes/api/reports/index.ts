import { APIEvent, json } from "solid-start";
import { queryAuthenticatedUser } from "~/utils/user-query";
import { queryRecreationalLocationOwner } from "~/server/database/query";
import { createReport } from "~/server/database/user/query";
import { z } from "zod";

const reportSchema = z.object({
  locationId: z.string(),
  reason: z.string(),
  details: z.string(),
  email: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

export async function POST({ request }: APIEvent) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());

  try {
    const validatedData = reportSchema.parse(data);
    
    // Get location owner
    const owner = await queryRecreationalLocationOwner(validatedData.locationId);
    if (!owner) {
      return json({ error: "Location does not have an owner" }, { status: 400 });
    }

    // Create report
    await createReport({
      locationId: validatedData.locationId,
      ownerId: owner.id,
      reason: validatedData.reason,
      details: validatedData.details,
      email: validatedData.email,
      photo: validatedData.photo,
      createdAt: new Date()
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error creating report:", error);
    return json({ error: "Failed to create report" }, { status: 500 });
  }
}