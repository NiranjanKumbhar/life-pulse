import {
  ExtractedLifeItemSchema,
  getDefaultReturnWindowDays,
  type ExtractedLifeItem,
} from "./schema";

export interface InboundPayload {
  subject: string;
  fromAddress: string;
  textBody: string;
  locale?: string;
}

const CURRENCY_PATTERNS: Array<{
  regex: RegExp;
  currency: "GBP" | "EUR" | "USD" | "INR";
}> = [
  { regex: /£\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: "GBP" },
  { regex: /€\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: "EUR" },
  { regex: /(?:₹|INR|Rs\.?)\s?(\d+(?:,\d{2,3})*(?:\.\d{2})?)/i, currency: "INR" },
  { regex: /\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: "USD" },
];

function extractAmount(text: string): {
  amount_minor: number | null;
  currency: "GBP" | "EUR" | "USD" | "INR" | null;
} {
  for (const { regex, currency } of CURRENCY_PATTERNS) {
    const match = text.match(regex);
    if (match?.[1]) {
      const normalized = Number.parseFloat(match[1].replace(/,/g, ""));
      if (!Number.isNaN(normalized)) {
        return { amount_minor: Math.round(normalized * 100), currency };
      }
    }
  }
  return { amount_minor: null, currency: null };
}

function extractDomain(fromAddress: string): string | null {
  const match = fromAddress.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match?.[1]?.toLowerCase() ?? null;
}

function inferMerchantName(domain: string | null, fromAddress: string): string {
  if (domain) {
    const parts = domain.split(".");
    const core = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return core.charAt(0).toUpperCase() + core.slice(1);
  }
  return fromAddress.split("@")[0] || "Merchant";
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Privacy-first in-memory deterministic parser (Pass 1).
 * Raw email bodies are inspected strictly in-memory and never persisted.
 * Plug in your structured LLM fallback here for low-confidence or complex emails.
 */
export function parseInboundInMemory(payload: InboundPayload): {
  parserUsed: string;
  item: ExtractedLifeItem;
} {
  const combined = `${payload.subject}\n${payload.textBody}`;
  const lower = combined.toLowerCase();
  const domain = extractDomain(payload.fromAddress);
  const merchantName = inferMerchantName(domain, payload.fromAddress);
  const { amount_minor, currency } = extractAmount(combined);
  const locale = payload.locale ?? "en-GB";

  // Noise filter: OTPs / verification codes
  if (/\b(otp|verification code|one-time password|login code)\b/i.test(lower)) {
    return {
      parserUsed: "deterministic:noise-filter",
      item: ExtractedLifeItemSchema.parse({
        is_relevant_life_admin: false,
        item_type: null,
        merchant_name: merchantName,
        merchant_domain: domain,
        title: payload.subject.slice(0, 140) || "Verification email",
        amount_minor: null,
        currency: null,
        billing_cycle: null,
        action_date: null,
        expiry_date: null,
        tags: [],
        metadata: {
          summary_one_liner: "Ignored security/OTP notification.",
        },
        confidence_score: 0.99,
        dedupe_key: `noise:${domain ?? "unknown"}:${Date.now()}`,
      }),
    };
  }

  const isTrial = /\b(free trial|trial ends|trial period)\b/i.test(lower);
  const isSubscription =
    isTrial || /\b(subscription|auto-renew|monthly plan|annual plan|membership)\b/i.test(lower);
  const isOrder = /\b(order confirm|shipped|delivered|return window|order #)\b/i.test(lower);
  const isBill = /\b(invoice|bill due|statement|insurance renewal|utility|policy renewal)\b/i.test(
    lower
  );

  const orderMatch = combined.match(/(?:order\s*#?|ref\s*#?)\s*([A-Z0-9-]{5,24})/i);
  const orderNumber = orderMatch?.[1] ?? null;

  let itemType: "subscription" | "order_return" | "bill_renewal" | "warranty_receipt" =
    "warranty_receipt";
  let actionDate: string | null = null;
  let expiryDate: string | null = null;
  let billingCycle: "monthly" | "yearly" | "one_time" | null = "one_time";
  let confidence = 0.68;

  if (isSubscription) {
    itemType = "subscription";
    billingCycle = /\b(annual|yearly|per year|\/yr)\b/i.test(lower) ? "yearly" : "monthly";
    actionDate = addDaysIso(isTrial ? 7 : 30);
    confidence = amount_minor ? 0.84 : 0.7;
  } else if (isOrder) {
    itemType = "order_return";
    const returnDays = getDefaultReturnWindowDays(locale, domain);
    expiryDate = addDaysIso(returnDays);
    confidence = amount_minor || orderNumber ? 0.82 : 0.68;
  } else if (isBill) {
    itemType = "bill_renewal";
    actionDate = addDaysIso(14);
    confidence = amount_minor ? 0.8 : 0.65;
  }

  const dedupeKey = orderNumber
    ? `order:${domain ?? merchantName.toLowerCase()}:${orderNumber}`
    : `${itemType}:${domain ?? merchantName.toLowerCase()}:${billingCycle ?? "once"}`;

  const parsed = ExtractedLifeItemSchema.parse({
    is_relevant_life_admin: true,
    item_type: itemType,
    merchant_name: merchantName,
    merchant_domain: domain,
    title: payload.subject.trim().slice(0, 140) || `${merchantName} ${itemType.replace("_", " ")}`,
    amount_minor,
    currency,
    billing_cycle: billingCycle,
    action_date: actionDate,
    expiry_date: expiryDate,
    tags: isTrial ? ["trial"] : [],
    metadata: {
      is_free_trial: isTrial,
      auto_renews: isSubscription,
      order_number: orderNumber,
      summary_one_liner: `Extracted from ${merchantName} (${itemType.replace("_", " ")}).`,
    },
    confidence_score: confidence,
    dedupe_key: dedupeKey,
  });

  return {
    parserUsed: "deterministic:generic-v1",
    item: parsed,
  };
}
