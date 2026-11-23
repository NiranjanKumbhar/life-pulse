import { describe, it, expect } from "vitest";
import {
  canAddLifeItem,
  getHouseholdEntitlements,
} from "@/lib/entitlements";

describe("getHouseholdEntitlements", () => {
  it("returns free tier limits by default", () => {
    const ent = getHouseholdEntitlements({
      plan_tier: "free",
      subscription_status: "active",
    });

    expect(ent.effectiveTier).toBe("free");
    expect(ent.maxActiveItems).toBe(5);
    expect(ent.maxVaultDocuments).toBe(10);
    expect(ent.maxHouseholdMembers).toBe(1);
    expect(ent.canUseAiActionDrafts).toBe(false);
    expect(ent.canInviteMembers).toBe(false);
  });

  it("grants solo_pro unlimited items when active or trialing", () => {
    const ent = getHouseholdEntitlements({
      plan_tier: "solo_pro",
      subscription_status: "trialing",
    });

    expect(ent.effectiveTier).toBe("solo_pro");
    expect(ent.maxActiveItems).toBeNull();
    expect(ent.maxVaultDocuments).toBeNull();
    expect(ent.canUseAiActionDrafts).toBe(true);
    expect(ent.canUseOAuthSync).toBe(true);
    expect(ent.canInviteMembers).toBe(false);
  });

  it("grants household tier multi-member invites", () => {
    const ent = getHouseholdEntitlements({
      plan_tier: "household",
      subscription_status: "active",
    });

    expect(ent.effectiveTier).toBe("household");
    expect(ent.maxHouseholdMembers).toBe(4);
    expect(ent.canInviteMembers).toBe(true);
  });

  it("falls back to free tier if subscription is past_due or canceled", () => {
    const canceled = getHouseholdEntitlements({
      plan_tier: "household",
      subscription_status: "canceled",
    });
    const pastDue = getHouseholdEntitlements({
      plan_tier: "solo_pro",
      subscription_status: "past_due",
    });

    expect(canceled.effectiveTier).toBe("free");
    expect(canceled.maxActiveItems).toBe(5);
    expect(pastDue.effectiveTier).toBe("free");
    expect(pastDue.canUseAiActionDrafts).toBe(false);
  });

  it("respects server-side feature_overrides for beta/VIP access", () => {
    const ent = getHouseholdEntitlements({
      plan_tier: "free",
      subscription_status: "active",
      feature_overrides: {
        maxActiveItems: null,
        canUseAiActionDrafts: true,
      },
    });

    expect(ent.effectiveTier).toBe("free");
    expect(ent.maxActiveItems).toBeNull();
    expect(ent.canUseAiActionDrafts).toBe(true);
  });
});

describe("canAddLifeItem", () => {
  it("enforces free tier cap of 5 active items", () => {
    const freeEnt = getHouseholdEntitlements({
      plan_tier: "free",
      subscription_status: "active",
    });

    expect(canAddLifeItem(freeEnt, 0)).toBe(true);
    expect(canAddLifeItem(freeEnt, 4)).toBe(true);
    expect(canAddLifeItem(freeEnt, 5)).toBe(false);
  });

  it("allows unlimited items on solo_pro", () => {
    const proEnt = getHouseholdEntitlements({
      plan_tier: "solo_pro",
      subscription_status: "active",
    });

    expect(canAddLifeItem(proEnt, 500)).toBe(true);
  });
});
