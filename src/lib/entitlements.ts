export type PlanTier = "free" | "solo_pro" | "household";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface HouseholdBillingContext {
  plan_tier: string;
  subscription_status: string;
  feature_overrides?: Record<string, unknown> | null;
}

export interface HouseholdEntitlements {
  effectiveTier: PlanTier;
  maxActiveItems: number | null; // null = unlimited
  maxVaultDocuments: number | null;
  maxHouseholdMembers: number;
  canUseAiActionDrafts: boolean;
  canUsePriceHikeAlerts: boolean;
  canUseOAuthSync: boolean;
  canInviteMembers: boolean;
}

const PLAN_DEFAULTS: Record<PlanTier, Omit<HouseholdEntitlements, "effectiveTier">> = {
  free: {
    maxActiveItems: 5,
    maxVaultDocuments: 10,
    maxHouseholdMembers: 1,
    canUseAiActionDrafts: false,
    canUsePriceHikeAlerts: false,
    canUseOAuthSync: false,
    canInviteMembers: false,
  },
  solo_pro: {
    maxActiveItems: null,
    maxVaultDocuments: null,
    maxHouseholdMembers: 1,
    canUseAiActionDrafts: true,
    canUsePriceHikeAlerts: true,
    canUseOAuthSync: true,
    canInviteMembers: false,
  },
  household: {
    maxActiveItems: null,
    maxVaultDocuments: null,
    maxHouseholdMembers: 4,
    canUseAiActionDrafts: true,
    canUsePriceHikeAlerts: true,
    canUseOAuthSync: true,
    canInviteMembers: true,
  },
};

function isPlanTier(value: string): value is PlanTier {
  return value === "free" || value === "solo_pro" || value === "household";
}

/**
 * Central provider-agnostic subscription entitlement resolver.
 * When Stripe/Paddle/RevenueCat is connected later, only webhooks update
 * `households.plan_tier` and `subscription_status` — zero app code changes needed.
 */
export function getHouseholdEntitlements(
  household: HouseholdBillingContext
): HouseholdEntitlements {
  const isStanding =
    household.subscription_status === "active" ||
    household.subscription_status === "trialing";

  const requestedTier: PlanTier = isPlanTier(household.plan_tier)
    ? household.plan_tier
    : "free";

  const effectiveTier: PlanTier = isStanding ? requestedTier : "free";
  const base = PLAN_DEFAULTS[effectiveTier];
  const overrides = household.feature_overrides ?? {};

  return {
    effectiveTier,
    maxActiveItems:
      typeof overrides.maxActiveItems === "number" || overrides.maxActiveItems === null
        ? (overrides.maxActiveItems as number | null)
        : base.maxActiveItems,
    maxVaultDocuments:
      typeof overrides.maxVaultDocuments === "number" ||
      overrides.maxVaultDocuments === null
        ? (overrides.maxVaultDocuments as number | null)
        : base.maxVaultDocuments,
    maxHouseholdMembers:
      typeof overrides.maxHouseholdMembers === "number"
        ? overrides.maxHouseholdMembers
        : base.maxHouseholdMembers,
    canUseAiActionDrafts:
      typeof overrides.canUseAiActionDrafts === "boolean"
        ? overrides.canUseAiActionDrafts
        : base.canUseAiActionDrafts,
    canUsePriceHikeAlerts:
      typeof overrides.canUsePriceHikeAlerts === "boolean"
        ? overrides.canUsePriceHikeAlerts
        : base.canUsePriceHikeAlerts,
    canUseOAuthSync:
      typeof overrides.canUseOAuthSync === "boolean"
        ? overrides.canUseOAuthSync
        : base.canUseOAuthSync,
    canInviteMembers:
      typeof overrides.canInviteMembers === "boolean"
        ? overrides.canInviteMembers
        : base.canInviteMembers,
  };
}

export function canAddLifeItem(
  entitlements: HouseholdEntitlements,
  currentActiveItemCount: number
): boolean {
  if (entitlements.maxActiveItems === null) return true;
  return currentActiveItemCount < entitlements.maxActiveItems;
}

export const PLAN_CATALOG = [
  {
    id: "free" as const,
    name: "Free",
    priceLabel: "£0 / $0",
    cadence: "forever",
    highlights: [
      "Private Auto-Forward alias + Mobile Snap",
      "Up to 5 active tracked items",
      "Daily Morning Pulse & 10 Vault documents",
    ],
  },
  {
    id: "solo_pro" as const,
    name: "Solo Pro",
    priceLabel: "£8 / $9",
    cadence: "per month",
    highlights: [
      "Unlimited subscriptions, returns, bills & Vault docs",
      "Price-hike & return-window countdown alerts",
      "1-tap AI cancel/return drafts & optional OAuth sync",
    ],
  },
  {
    id: "household" as const,
    name: "Household",
    priceLabel: "£12 / $14",
    cadence: "per month",
    highlights: [
      "Everything in Solo Pro for up to 4 household members",
      "Shared Daily Pulse & 1-tap partner task handoffs",
      "Shared encrypted receipt & warranty vault",
    ],
  },
];
