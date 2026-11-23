import { describe, it, expect } from "vitest";
import { normalizeInboundWebhookPayload } from "@/lib/inbound/normalize";

describe("normalizeInboundWebhookPayload", () => {
  it("normalizes Postmark inbound webhook JSON cleanly", () => {
    const normalized = normalizeInboundWebhookPayload({
      OriginalRecipient: "LP-ABC123@in.lifepulse.app",
      FromFull: { Email: "billing@adobe.com" },
      Subject: "Trial ending soon",
      TextBody: "Your trial renews at £19.99/mo",
    });

    expect(normalized).toEqual({
      toAddress: "lp-abc123@in.lifepulse.app",
      fromAddress: "billing@adobe.com",
      subject: "Trial ending soon",
      textBody: "Your trial renews at £19.99/mo",
      provider: "postmark",
    });
  });

  it("normalizes generic/Resend payloads with angle-bracket display names", () => {
    const normalized = normalizeInboundWebhookPayload({
      to: "Life Pulse <lp-xyz@in.lifepulse.app>",
      from: "Nike Store <orders@nike.co.uk>",
      subject: "Order #NK-10023",
      text: "Order confirmed for £118.00",
    });

    expect(normalized?.toAddress).toBe("lp-xyz@in.lifepulse.app");
    expect(normalized?.fromAddress).toBe("orders@nike.co.uk");
    expect(normalized?.provider).toBe("generic");
  });

  it("returns null for invalid payloads", () => {
    expect(normalizeInboundWebhookPayload(null)).toBeNull();
    expect(normalizeInboundWebhookPayload({ hello: "world" })).toBeNull();
  });
});
