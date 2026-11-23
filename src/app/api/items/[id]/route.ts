import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ItemActionSchema = z.object({
  action: z.enum(["confirm", "resolve", "snooze", "archive", "delete"]),
  snoozeDays: z.number().int().min(1).max(30).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ItemActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action, snoozeDays = 2 } = parsed.data;
  const updatePayload: Record<string, unknown> = {};

  if (action === "confirm") {
    updatePayload.status = "active";
    updatePayload.confidence_score = 1.0;
  } else if (action === "resolve") {
    updatePayload.status = "resolved";
  } else if (action === "archive") {
    updatePayload.status = "archived";
  } else if (action === "snooze") {
    const snoozeDate = new Date();
    snoozeDate.setUTCDate(snoozeDate.getUTCDate() + snoozeDays);
    updatePayload.status = "snoozed";
    updatePayload.snooze_until = snoozeDate.toISOString().slice(0, 10);
  } else if (action === "delete") {
    updatePayload.deleted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("life_items")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}
