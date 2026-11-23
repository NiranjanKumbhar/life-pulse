import { describe, it, expect } from "vitest";
import { parseInboundInMemory } from "@/lib/extraction/parser";

describe("parseInboundInMemory", () => {
  it("extracts free trial subscription with GBP amount and high confidence", () => {
    const { item, parserUsed } = parseInboundInMemory({
      fromAddress: "billing@adobe.com",
      subject: "Your Adobe Creative Cloud free trial ends soon",
      textBody: "Your 7-day free trial auto-renews at £19.99/month unless cancelled.",
      locale: "en-GB",
    });

    expect(parserUsed).toBe("deterministic:generic-v1");
    expect(item.is_relevant_life_admin).toBe(true);
    expect(item.item_type).toBe("subscription");
    expect(item.amount_minor).toBe(1999);
    expect(item.currency).toBe("GBP");
    expect(item.billing_cycle).toBe("monthly");
    expect(item.metadata.is_free_trial).toBe(true);
    expect(item.confidence_score).toBeGreaterThanOrEqual(0.75);
  });

  it("extracts order return with order number and regional return deadline", () => {
    const { item } = parseInboundInMemory({
      fromAddress: "orders@nike.co.uk",
      subject: "Order Confirmation #NK-884192",
      textBody: "Thanks for your order #NK-884192 totaling £118.00. Shipped today.",
      locale: "en-GB",
    });

    expect(item.is_relevant_life_admin).toBe(true);
    expect(item.item_type).toBe("order_return");
    expect(item.amount_minor).toBe(11800);
    expect(item.currency).toBe("GBP");
    expect(item.metadata.order_number).toBe("NK-884192");
    expect(item.expiry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(item.dedupe_key).toContain("NK-884192");
  });

  it("extracts Indian INR bills cleanly", () => {
    const { item } = parseInboundInMemory({
      fromAddress: "billing@airtel.in",
      subject: "Your monthly broadband invoice is ready",
      textBody: "Total bill due: ₹1,178.00. Please pay before due date.",
      locale: "en-IN",
    });

    expect(item.is_relevant_life_admin).toBe(true);
    expect(item.item_type).toBe("bill_renewal");
    expect(item.amount_minor).toBe(117800);
    expect(item.currency).toBe("INR");
  });

  it("filters out OTP and security verification emails as noise", () => {
    const { item, parserUsed } = parseInboundInMemory({
      fromAddress: "no-reply@bank.co.uk",
      subject: "Your one-time password (OTP) is 482910",
      textBody: "Use verification code 482910 to sign in.",
      locale: "en-GB",
    });

    expect(parserUsed).toBe("deterministic:noise-filter");
    expect(item.is_relevant_life_admin).toBe(false);
    expect(item.item_type).toBeNull();
  });
});
