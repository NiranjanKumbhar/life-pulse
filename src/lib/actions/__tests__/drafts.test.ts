import { describe, it, expect } from "vitest";
import { generateActionDraft } from "@/lib/actions/drafts";

describe("generateActionDraft", () => {
  it("creates a clear subscription cancellation email with formatted currency", () => {
    const draft = generateActionDraft({
      actionType: "cancel_subscription",
      merchantName: "Adobe",
      title: "Creative Cloud Trial",
      amountMinor: 1999,
      currency: "GBP",
      locale: "en-GB",
      userName: "Alex",
    });

    expect(draft.subject).toContain("Cancellation Request");
    expect(draft.subject).toContain("Adobe");
    expect(draft.body).toContain("£19.99");
    expect(draft.body).toContain("Alex");
  });

  it("includes order reference for return requests", () => {
    const draft = generateActionDraft({
      actionType: "start_return",
      merchantName: "Nike",
      title: "Air Max",
      amountMinor: 11800,
      currency: "GBP",
      orderNumber: "NK-884192",
      locale: "en-GB",
    });

    expect(draft.subject).toContain("#NK-884192");
    expect(draft.body).toContain("Order Reference: NK-884192");
  });

  it("generates price-hike dispute and warranty claim drafts", () => {
    const dispute = generateActionDraft({
      actionType: "dispute_price_hike",
      merchantName: "Allianz",
      title: "Car Insurance",
      amountMinor: 64000,
      currency: "EUR",
      policyRef: "ALZ-44102",
    });
    const warranty = generateActionDraft({
      actionType: "warranty_claim",
      merchantName: "Sony",
      title: "WH-1000XM5",
      amountMinor: 29900,
      currency: "GBP",
    });

    expect(dispute.body).toContain("ALZ-44102");
    expect(warranty.subject).toContain("Warranty Support Request");
  });
});
