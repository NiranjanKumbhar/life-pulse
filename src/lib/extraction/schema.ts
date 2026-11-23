import { z } from "zod";

export const CORE_ITEM_TYPES = [
  "subscription",
  "order_return",
  "bill_renewal",
  "warranty_receipt",
] as const;

export const SUPPORTED_CURRENCIES = [
  "USD",
  "GBP",
  "EUR",
  "INR",
  "CAD",
  "AUD",
] as const;

export const ExtractedLifeItemSchema = z.object({
  is_relevant_life_admin: z
    .boolean()
    .describe("False for marketing newsletters, OTPs, or social notifications."),

  item_type: z.enum(CORE_ITEM_TYPES).nullable(),
  merchant_name: z.string().min(1).max(120),
  merchant_domain: z.string().nullable(),
  title: z.string().min(1).max(140),

  amount_minor: z.number().int().nonnegative().nullable(),
  currency: z.enum(SUPPORTED_CURRENCIES).nullable(),
  billing_cycle: z
    .enum(["weekly", "monthly", "quarterly", "yearly", "one_time"])
    .nullable(),

  action_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),

  tags: z.array(z.string().max(32)).max(5).default([]),

  metadata: z.object({
    is_free_trial: z.boolean().default(false),
    auto_renews: z.boolean().default(false),
    order_number: z.string().nullable().default(null),
    policy_or_account_ref: z.string().nullable().default(null),
    cancel_or_manage_url: z.string().url().nullable().default(null),
    return_portal_url: z.string().url().nullable().default(null),
    warranty_months: z.number().int().positive().nullable().default(null),
    summary_one_liner: z.string().max(180),
  }),

  confidence_score: z.number().min(0).max(1),
  dedupe_key: z.string().min(3).max(160),
});

export type ExtractedLifeItem = z.infer<typeof ExtractedLifeItemSchema>;

export const CONFIDENCE_AUTO_APPROVE_THRESHOLD = 0.75;

/**
 * Regional statutory / merchant fallback return windows (in days).
 * UK & EU: 14-day distance-selling statutory minimum.
 * US: 30-day standard retail default.
 * India: 7-day standard e-commerce replacement/return window.
 */
export function getDefaultReturnWindowDays(
  locale: string,
  merchantDomain?: string | null
): number {
  const domain = (merchantDomain ?? "").toLowerCase();
  if (domain.includes("amazon.in") || domain.includes("flipkart.")) return 7;
  if (domain.includes("amazon.") || domain.includes("target.")) return 30;

  const upperLocale = locale.toUpperCase();
  if (upperLocale.endsWith("-IN")) return 7;
  if (upperLocale.endsWith("-US") || upperLocale.endsWith("-CA")) return 30;
  return 14; // UK / EU default
}

export function formatMinorAmount(
  amountMinor: number | null,
  currency: string | null,
  locale = "en-GB"
): string {
  if (amountMinor === null || !currency) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target.getTime() - todayUtc) / 86_400_000);
}
