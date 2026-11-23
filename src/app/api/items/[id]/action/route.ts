import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";
import { generateActionDraft } from "@/lib/actions/drafts";

const DraftRequestSchema = z.object({
  actionType: z.enum([
    "cancel_subscription",
    "start_return",
    "dispute_price_hike",
    "warranty_claim",
  ]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const ctx = await getUserWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase
    .from("life_items")
    .select("*")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  const draft = generateActionDraft({
    actionType: parsed.data.actionType,
    merchantName: item.merchant_name,
    title: item.title,
    amountMinor: item.amount_minor,
    currency: item.currency,
    orderNumber:
      typeof metadata.order_number === "string" ? metadata.order_number : null,
    policyRef:
      typeof metadata.policy_or_account_ref === "string"
        ? metadata.policy_or_account_ref
        : null,
    locale: ctx.profile.locale,
    userName: ctx.profile.full_name,
  });

  if (!ctx.entitlements.canUseAiActionDrafts) {
    return NextResponse.json(
      {
        error: "1-tap action drafts are a Solo Pro & Household feature.",
        code: "UPGRADE_REQUIRED",
        previewSubject: draft.subject,
      },
      { status: 402 }
    );
  }

  const { data: savedAction, error: saveError } = await supabase
    .from("item_actions")
    .insert({
      household_id: ctx.household.id,
      life_item_id: item.id,
      action_type: parsed.data.actionType,
      status: "draft",
      draft_subject: draft.subject,
      draft_body: draft.body,
    })
    .select("*")
    .single();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ action: savedAction });
}
