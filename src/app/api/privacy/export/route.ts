import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";

/**
 * GDPR Articles 15 & 20 — Right of Access & Data Portability.
 * Exports all structured personal and household records as portable JSON.
 */
export async function GET() {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const [items, documents, sources, consents, auditLogs] = await Promise.all([
    supabase
      .from("life_items")
      .select("*")
      .eq("household_id", ctx.household.id)
      .is("deleted_at", null),
    supabase.from("documents").select("*").eq("household_id", ctx.household.id),
    supabase
      .from("ingestion_sources")
      .select("*")
      .eq("household_id", ctx.household.id),
    supabase.from("user_consents").select("*").eq("user_id", ctx.userId),
    supabase
      .from("ingestion_audit_log")
      .select("*")
      .eq("household_id", ctx.household.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  await supabase.from("privacy_requests").insert({
    user_id: ctx.userId,
    household_id: ctx.household.id,
    request_type: "export",
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  const exportBundle = {
    exported_at: new Date().toISOString(),
    gdpr_region: "eu-west-1",
    profile: ctx.profile,
    household: ctx.household,
    ingestion_sources: sources.data ?? [],
    life_items: items.data ?? [],
    documents: documents.data ?? [],
    consents: consents.data ?? [],
    ingestion_audit_log: auditLogs.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportBundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="life-pulse-gdpr-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
