import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";
import { canAddLifeItem } from "@/lib/entitlements";
import { parseInboundInMemory } from "@/lib/extraction/parser";
import { CONFIDENCE_AUTO_APPROVE_THRESHOLD } from "@/lib/extraction/schema";

const SimulateEmailSchema = z.object({
  fromAddress: z.string().min(3).max(200),
  subject: z.string().min(1).max(300),
  textBody: z.string().min(1).max(15000),
  channel: z.enum(["auto_forward", "mobile_snap"]).default("auto_forward"),
});

export async function POST(request: Request) {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedInput = SimulateEmailSchema.safeParse(body);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsedInput.error.flatten() },
      { status: 400 }
    );
  }

  if (!canAddLifeItem(ctx.entitlements, ctx.activeItemCount)) {
    return NextResponse.json(
      {
        error: "Free tier limit reached (5 active items). Upgrade to Solo Pro for unlimited tracking.",
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 402 }
    );
  }

  const startedAt = Date.now();
  const { parserUsed, item } = parseInboundInMemory({
    fromAddress: parsedInput.data.fromAddress,
    subject: parsedInput.data.subject,
    textBody: parsedInput.data.textBody,
    locale: ctx.profile.locale,
  });

  // Raw textBody is never persisted — strictly in-memory extraction.
  const supabase = await createClient();

  if (!item.is_relevant_life_admin || !item.item_type) {
    return NextResponse.json({
      ignored: true,
      reason: item.metadata.summary_one_liner,
      rawBodyDiscarded: true,
      processingMs: Date.now() - startedAt,
    });
  }

  const status =
    item.confidence_score >= CONFIDENCE_AUTO_APPROVE_THRESHOLD
      ? "active"
      : "needs_review";

  const { data: savedItem, error: insertError } = await supabase
    .from("life_items")
    .upsert(
      {
        household_id: ctx.household.id,
        item_type: item.item_type,
        status,
        merchant_name: item.merchant_name,
        merchant_domain: item.merchant_domain,
        title: item.title,
        amount_minor: item.amount_minor,
        currency: item.currency ?? ctx.profile.default_currency,
        billing_cycle: item.billing_cycle,
        action_date: item.action_date,
        expiry_date: item.expiry_date,
        tags: item.tags,
        source_channel: parsedInput.data.channel,
        confidence_score: item.confidence_score,
        dedupe_key: item.dedupe_key,
        metadata: item.metadata,
      },
      { onConflict: "household_id,dedupe_key" }
    )
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Could not save extracted item", details: insertError.message },
      { status: 500 }
    );
  }

  // Mark forwarding source active on first successful test
  if (
    ctx.defaultForwardSource &&
    ctx.defaultForwardSource.status === "pending_test" &&
    parsedInput.data.channel === "auto_forward"
  ) {
    await supabase
      .from("ingestion_sources")
      .update({ status: "active", last_received_at: new Date().toISOString() })
      .eq("id", ctx.defaultForwardSource.id);
  }

  return NextResponse.json({
    item: savedItem,
    parserUsed,
    rawBodyDiscarded: true,
    processingMs: Date.now() - startedAt,
  });
}
