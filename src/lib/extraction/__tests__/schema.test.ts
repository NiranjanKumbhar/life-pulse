import { describe, it, expect } from "vitest";
import {
  formatMinorAmount,
  getDefaultReturnWindowDays,
} from "@/lib/extraction/schema";

describe("getDefaultReturnWindowDays", () => {
  it("returns 14 days for UK and EU locales by default (statutory minimum)", () => {
    expect(getDefaultReturnWindowDays("en-GB")).toBe(14);
    expect(getDefaultReturnWindowDays("de-DE")).toBe(14);
    expect(getDefaultReturnWindowDays("fr-FR")).toBe(14);
  });

  it("returns 30 days for US/CA locales and Amazon/Target US", () => {
    expect(getDefaultReturnWindowDays("en-US")).toBe(30);
    expect(getDefaultReturnWindowDays("en-CA")).toBe(30);
    expect(getDefaultReturnWindowDays("en-GB", "amazon.co.uk")).toBe(30);
  });

  it("returns 7 days for India locale and Indian e-commerce domains", () => {
    expect(getDefaultReturnWindowDays("en-IN")).toBe(7);
    expect(getDefaultReturnWindowDays("en-GB", "amazon.in")).toBe(7);
    expect(getDefaultReturnWindowDays("en-US", "flipkart.com")).toBe(7);
  });
});

describe("formatMinorAmount", () => {
  it("formats GBP, USD, EUR, and INR minor units cleanly", () => {
    expect(formatMinorAmount(1999, "GBP", "en-GB")).toBe("£19.99");
    expect(formatMinorAmount(11800, "USD", "en-US")).toBe("$118.00");
    expect(formatMinorAmount(49900, "INR", "en-IN")).toContain("499.00");
  });

  it("returns em dash when amount or currency is missing", () => {
    expect(formatMinorAmount(null, "GBP")).toBe("—");
    expect(formatMinorAmount(1000, null)).toBe("—");
  });
});
