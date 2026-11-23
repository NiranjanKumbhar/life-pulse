import { formatMinorAmount } from "@/lib/extraction/schema";

export type ActionDraftType =
  | "cancel_subscription"
  | "start_return"
  | "dispute_price_hike"
  | "warranty_claim";

export interface ActionDraftInput {
  actionType: ActionDraftType;
  merchantName: string;
  title: string;
  amountMinor: number | null;
  currency: string | null;
  orderNumber?: string | null;
  policyRef?: string | null;
  locale?: string;
  userName?: string | null;
}

export interface GeneratedActionDraft {
  subject: string;
  body: string;
}

/**
 * Generates a calm, concise, legally aware action email draft (EU/UK/US friendly)
 * for 1-tap resolution without requiring an external LLM call.
 */
export function generateActionDraft(input: ActionDraftInput): GeneratedActionDraft {
  const signer = input.userName?.trim() || "Account Holder";
  const formattedAmount = formatMinorAmount(
    input.amountMinor,
    input.currency,
    input.locale ?? "en-GB"
  );
  const refLine = input.orderNumber
    ? `Order Reference: ${input.orderNumber}`
    : input.policyRef
      ? `Account / Policy Reference: ${input.policyRef}`
      : null;

  if (input.actionType === "cancel_subscription") {
    return {
      subject: `Cancellation Request — ${input.merchantName} (${input.title})`,
      body: [
        `Hello ${input.merchantName} Support,`,
        "",
        `Please cancel my subscription/trial (${input.title}) effective immediately and ensure auto-renewal is turned off so no further charges (${formattedAmount}) are billed.`,
        refLine,
        "",
        "Please reply with written confirmation of cancellation.",
        "",
        `Thank you,\n${signer}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  if (input.actionType === "start_return") {
    return {
      subject: `Return Request — ${input.merchantName}${input.orderNumber ? ` (#${input.orderNumber})` : ""}`,
      body: [
        `Hello ${input.merchantName} Support,`,
        "",
        `I would like to initiate a return and full refund (${formattedAmount}) for ${input.title} within the eligible return window.`,
        refLine,
        "",
        "Please send the return instructions or prepaid return label.",
        "",
        `Thank you,\n${signer}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  if (input.actionType === "dispute_price_hike") {
    return {
      subject: `Renewal Pricing Inquiry — ${input.merchantName}`,
      body: [
        `Hello ${input.merchantName} Team,`,
        "",
        `I noticed my upcoming renewal for ${input.title} increased to ${formattedAmount}. Before I cancel or switch providers, could you confirm whether you can match my previous rate or apply a loyalty discount?`,
        refLine,
        "",
        `Best regards,\n${signer}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  return {
    subject: `Warranty Support Request — ${input.merchantName} (${input.title})`,
    body: [
      `Hello ${input.merchantName} Support,`,
      "",
      `I am writing to open a warranty claim for ${input.title}. I have my original proof of purchase ready to share.`,
      refLine,
      "",
      "Please let me know the next steps for repair or replacement.",
      "",
      `Thank you,\n${signer}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  };
}
