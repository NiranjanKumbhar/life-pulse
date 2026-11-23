import { z } from "zod";

export interface NormalizedInboundEmail {
  toAddress: string;
  fromAddress: string;
  subject: string;
  textBody: string;
  provider: "postmark" | "resend" | "generic";
}

const PostmarkPayloadSchema = z.object({
  OriginalRecipient: z.string().optional(),
  To: z.string().optional(),
  From: z.string().optional(),
  FromFull: z.object({ Email: z.string() }).optional(),
  Subject: z.string().default(""),
  TextBody: z.string().default(""),
  StrippedTextReply: z.string().optional(),
});

const GenericPayloadSchema = z.object({
  to: z.string().min(3),
  from: z.string().min(3),
  subject: z.string().default(""),
  text: z.string().default(""),
});

function extractEmailAddress(raw: string): string {
  const angleMatch = raw.match(/<([^>]+)>/);
  const candidate = (angleMatch?.[1] ?? raw).split(",")[0]?.trim() ?? "";
  return candidate.toLowerCase();
}

/**
 * Normalizes Postmark, Resend, or generic inbound email webhook JSON
 * into a single in-memory shape. Never persists raw body to disk/DB.
 */
export function normalizeInboundWebhookPayload(
  payload: unknown
): NormalizedInboundEmail | null {
  if (!payload || typeof payload !== "object") return null;

  // 1. Postmark inbound format
  if ("FromFull" in payload || "OriginalRecipient" in payload || "TextBody" in payload) {
    const parsed = PostmarkPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    const toRaw = parsed.data.OriginalRecipient || parsed.data.To || "";
    const fromRaw = parsed.data.FromFull?.Email || parsed.data.From || "";
    const toAddress = extractEmailAddress(toRaw);
    const fromAddress = extractEmailAddress(fromRaw);
    if (!toAddress || !fromAddress) return null;

    return {
      toAddress,
      fromAddress,
      subject: parsed.data.Subject,
      textBody: parsed.data.StrippedTextReply || parsed.data.TextBody,
      provider: "postmark",
    };
  }

  // 2. Generic / Resend inbound format
  const generic = GenericPayloadSchema.safeParse(payload);
  if (generic.success) {
    return {
      toAddress: extractEmailAddress(generic.data.to),
      fromAddress: extractEmailAddress(generic.data.from),
      subject: generic.data.subject,
      textBody: generic.data.text,
      provider: "generic",
    };
  }

  return null;
}
