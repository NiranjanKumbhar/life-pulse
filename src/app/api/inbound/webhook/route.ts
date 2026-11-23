import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAddLifeItem, getHouseholdEntitlements } from "@/lib/entitlements";
import { normalizeInboundWebhookPayload } from "@/lib/inbound/normalize";
import { parseInboundInMemory } from "@/lib/extraction/parser";
import { detectPriceHike } from "@/lib/extraction/price-hike";
import { buildReminderSchedule } from "@/lib/extraction/reminders";
import { CONFIDENCE_AUTO_APPROVE_THRESHOLD } from "@/lib/extraction/schema";

function verifyWebhookSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secretHeader = request.headers.get("x-inbound-secret");
  if (!verifyWebhookSecret(secretHeader, process.env.INBOUND_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  const rawJson = await request.json().catch(() => null);
  const normalized = normalizeInboundWebhookPayload(rawJson);
  if (!normalized) {
    return NextResponse.json({ error: "Unsupported inbound payload" }, { status: 400 });
  }

  const startedAt = Date.now();
  const admin = createAdminClient();

  const { data: source } = await admin
    .from("ingestion_sources")
    .select("id, household_id, user_id, status")
    .eq("address_or_handle", normalized.toAddress)
    .eq("channel", "auto_forward")
    .maybeSingle();

  if (!source || source.status === "revoked" || source.status === "paused") {
    // Return 200 to prevent provider retries for unknown/paused aliases
    return NextResponse.json({ ignored: true, reason: "Unknown or inactive alias" });
  }

  const [{ data: household }, { data: profile }, { count: activeCount }] =
    await Promise.all([
      admin.from("households").select("*").eq("id", source.household_id).single(),
      admin.from("profiles").select("locale, default_currency").eq("id", source.user_id).single(),
      admin
        .from("life_items")
        .select("id", { count: "exact", head: true })
        .eq("household_id", source.household_id)
        .in("status", ["active", "needs_review"])
        .is("deleted_at", null),
    ]);

  if (!household) {
    return NextResponse.json({ ignored: true, reason: "Household not found" });
  }

  const entitlements = getHouseholdEntitlements({
    plan_tier: household.plan_tier,
    subscription_status: household.subscription_status,
    feature_overrides:
      (household.feature_overrides as Record<string, unknown> | null) ?? null,
  });

  if (!canAddLifeItem(entitlements, activeCount ?? 0)) {
    await admin.from("ingestion_audit_log").insert({
      household_id: household.id,
      channel: "auto_forward",
      parser_used: "entitlement-gate",
      outcome: "failed",
      raw_body_discarded: true,
      processing_ms: Date.now() - startedAt,
    });
    return NextResponse.json({ ignored: true, reason: "Plan active item limit reached" });
  }

  const { parserUsed, item } = parseInboundInMemory({
    fromAddress: normalized.fromAddress,
    subject: normalized.subject,
    textBody: normalized.textBody,
    locale: profile?.locale ?? "en-GB",
  });

  // Raw email body is never stored — immediately dropped after extraction
  if (!item.is_relevant_life_admin || !item.item_type) {
    await admin.from("ingestion_audit_log").insert({
      household_id: household.id,
      channel: "auto_forward",
      parser_used: parserUsed,
      outcome: "ignored_noise",
      raw_body_discarded: true,
      processing_ms: Date.now() - startedAt,
    });
    return NextResponse.json({ ignored: true, rawBodyDiscarded: true });
  }

  const status =
    item.confidence_score >= CONFIDENCE_AUTO_APPROVE_THRESHOLD
      ? "active"
      : "needs_review";
  const resolvedCurrency = item.currency ?? profile?.default_currency ?? "GBP";

  const { data: savedItem, error: upsertError } = await admin
    .from("life_items")
    .upsert(
      {
        household_id: household.id,
        item_type: item.item_type,
        status,
        merchant_name: item.merchant_name,
        merchant_domain: item.merchant_domain,
        title: item.title,
        amount_minor: item.amount_minor,
        currency: resolvedCurrency,
        billing_cycle: item.billing_cycle,
        action_date: item.action_date,
        expiry_date: item.expiry_date,
        tags: item.tags,
        source_channel: "auto_forward",
        confidence_score: item.confidence_score,
        dedupe_key: item.dedupe_key,
        metadata: item.metadata,
      },
      { onConflict: "household_id,dedupe_key" }
    )
    .select("*")
    .single();

  if (upsertError || !savedItem) {
    return NextResponse.json(
      { error: upsertError?.message ?? "Failed to upsert item" },
      { status: 500 }
    );
  }

  // Price-hike check & history log
  let priceHikeDetected = false;
  if (savedItem.amount_minor !== null) {
    const { data: history } = await admin
      .from("item_price_history")
      .select("amount_minor, currency, billed_on")
      .eq("life_item_id", savedItem.id)
      .order("billed_on", { ascending: false })
      .limit(5);

    const hike = detectPriceHike(
      savedItem.amount_minor,
      resolvedCurrency,
      history ?? []
    );

    if (hike.isHike && entitlements.canUsePriceHikeAlerts) {
      priceHikeDetected = true;
      const updatedTags = Array.from(new Set([...savedItem.tags, "price_hike"]));
      await admin
        .from("life_items")
        .update({ tags: updatedTags })
        .eq("id", savedItem.id);
    }

    await admin.from("item_price_history").insert({
      household_id: household.id,
      life_item_id: savedItem.id,
      amount_minor: savedItem.amount_minor,
      currency: resolvedCurrency,
      billed_on: new Date().toISOString().slice(0, 10),
    });
  }

  // Schedule deterministic future reminders
  const reminders = buildReminderSchedule(savedItem.expiry_date ?? savedItem.action_date);
  if (reminders.length > 0) {
    await admin.from("item_reminders").insert(
      reminders.map((r) => ({
        household_id: household.id,
        life_item_id: savedItem.id,
        trigger_at: r.trigger_at,
        channel: r.channel,
        status: "pending",
      }))
    );
  }

  // Mark forwarding source active & write GDPR zero-retention audit record
  await Promise.all([
    admin
      .from("ingestion_sources")
      .update({ status: "active", last_received_at: new Date().toISOString() })
      .eq("id", source.id),
    admin.from("ingestion_audit_log").insert({
      household_id: household.id,
      channel: "auto_forward",
      parser_used: parserUsed,
      outcome: status === "needs_review" ? "needs_review" : "parsed",
      raw_body_discarded: true,
      processing_ms: Date.now() - startedAt,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    itemId: savedItem.id,
    status,
    priceHikeDetected,
    remindersScheduled: reminders.length,
    rawBodyDiscarded: true,
  });
}
