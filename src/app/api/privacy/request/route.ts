import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";

const PrivacyRequestSchema = z.object({
  requestType: z.enum(["delete_account", "purge_documents"]),
});

export async function POST(request: Request) {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PrivacyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("privacy_requests")
    .insert({
      user_id: ctx.userId,
      household_id: ctx.household.id,
      request_type: parsed.data.requestType,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
