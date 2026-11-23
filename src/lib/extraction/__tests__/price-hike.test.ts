import { describe, it, expect } from "vitest";
import { detectPriceHike } from "@/lib/extraction/price-hike";

describe("detectPriceHike", () => {
  it("detects a price increase against the most recent same-currency charge", () => {
    const result = detectPriceHike(2399, "GBP", [
      { amount_minor: 1799, currency: "GBP", billed_on: "2026-09-01" },
      { amount_minor: 1999, currency: "GBP", billed_on: "2026-10-01" },
    ]);

    expect(result.isHike).toBe(true);
    expect(result.previousAmountMinor).toBe(1999);
    expect(result.deltaMinor).toBe(400);
    expect(result.percentChange).toBe(20);
  });

  it("returns false when price stays flat or drops", () => {
    const flat = detectPriceHike(1999, "GBP", [
      { amount_minor: 1999, currency: "GBP", billed_on: "2026-10-01" },
    ]);
    const drop = detectPriceHike(1599, "GBP", [
      { amount_minor: 1999, currency: "GBP", billed_on: "2026-10-01" },
    ]);

    expect(flat.isHike).toBe(false);
    expect(drop.isHike).toBe(false);
  });

  it("ignores historical charges in a different currency", () => {
    const result = detectPriceHike(2500, "EUR", [
      { amount_minor: 1999, currency: "GBP", billed_on: "2026-10-01" },
    ]);

    expect(result.isHike).toBe(false);
    expect(result.previousAmountMinor).toBeNull();
  });
});
