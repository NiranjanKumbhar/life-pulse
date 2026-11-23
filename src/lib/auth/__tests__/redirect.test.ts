import { describe, it, expect } from "vitest";
import { sanitizeNextPath } from "@/lib/auth/redirect";

describe("sanitizeNextPath", () => {
  it("allows valid internal app routes", () => {
    expect(sanitizeNextPath("/pulse")).toBe("/pulse");
    expect(sanitizeNextPath("/setup")).toBe("/setup");
    expect(sanitizeNextPath("/vault?q=nike")).toBe("/vault?q=nike");
  });

  it("blocks external URLs and protocol-relative open redirects", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/pulse");
    expect(sanitizeNextPath("//evil.com/phish")).toBe("/pulse");
    expect(sanitizeNextPath("/\\evil.com")).toBe("/pulse");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/pulse");
  });

  it("falls back when empty or null", () => {
    expect(sanitizeNextPath(null)).toBe("/pulse");
    expect(sanitizeNextPath("")).toBe("/pulse");
    expect(sanitizeNextPath(undefined, "/setup")).toBe("/setup");
  });
});
