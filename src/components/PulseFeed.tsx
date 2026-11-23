"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  Sparkles,
  ArrowRight,
  Send,
  Copy,
  Check,
} from "lucide-react";
import type { Database } from "@/types/database";
import { daysUntil, formatMinorAmount } from "@/lib/extraction/schema";

type LifeItemRow = Database["public"]["Tables"]["life_items"]["Row"];

interface PulseFeedProps {
  initialItems: LifeItemRow[];
  locale: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  subscription: { label: "Subscription", color: "bg-sky-100 text-sky-800" },
  order_return: { label: "Return Window", color: "bg-amber-100 text-amber-800" },
  bill_renewal: { label: "Bill / Renewal", color: "bg-indigo-100 text-indigo-800" },
  warranty_receipt: { label: "Warranty Vault", color: "bg-emerald-100 text-emerald-800" },
};

export function PulseFeed({ initialItems, locale }: PulseFeedProps) {
  const [items, setItems] = useState<LifeItemRow[]>(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftPanel, setDraftPanel] = useState<{
    itemId: string;
    subject: string;
    body?: string;
    upgradeMessage?: string;
  } | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  async function requestDraft(item: LifeItemRow) {
    setBusyId(item.id);
    const actionType =
      item.item_type === "order_return"
        ? "start_return"
        : item.item_type === "bill_renewal"
          ? "dispute_price_hike"
          : item.item_type === "warranty_receipt"
            ? "warranty_claim"
            : "cancel_subscription";
    try {
      const res = await fetch(`/api/items/${item.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType }),
      });
      const json = await res.json();
      if (res.status === 402) {
        setDraftPanel({
          itemId: item.id,
          subject: json.previewSubject ?? "Solo Pro Draft",
          upgradeMessage: json.error,
        });
        return;
      }
      if (res.ok && json.action) {
        setDraftPanel({
          itemId: item.id,
          subject: json.action.draft_subject,
          body: json.action.draft_body,
        });
      }
    } finally {
      setBusyId(null);
    }
  }

  async function runAction(
    id: string,
    action: "confirm" | "resolve" | "snooze" | "archive"
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { item: LifeItemRow };

      if (action === "confirm") {
        setItems((prev) => prev.map((it) => (it.id === id ? json.item : it)));
      } else {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  const needsReview = items.filter((i) => i.status === "needs_review");
  const activeItems = items.filter((i) => i.status === "active");

  const urgentItems = activeItems.filter((i) => {
    const d1 = daysUntil(i.action_date);
    const d2 = daysUntil(i.expiry_date);
    return (d1 !== null && d1 <= 3) || (d2 !== null && d2 <= 3);
  });

  const upcomingItems = activeItems.filter((i) => !urgentItems.includes(i));

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Your Pulse is calm and clear</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
          Set up your private Auto-Forward rule or snap a receipt to see subscriptions,
          return windows, and renewals appear automatically.
        </p>
        <Link
          href="/setup"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <span>Set up Auto-Forward & Snap</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  function renderCard(item: LifeItemRow) {
    const badge = TYPE_LABELS[item.item_type] ?? {
      label: item.item_type,
      color: "bg-slate-100 text-slate-700",
    };
    const targetDate = item.expiry_date ?? item.action_date;
    const days = daysUntil(targetDate);
    const isBusy = busyId === item.id;

    return (
      <article
        key={item.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.color}`}>
                {badge.label}
              </span>
              {days !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    days <= 3 ? "text-rose-600" : "text-slate-500"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {days < 0
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                      ? "Due today"
                      : `In ${days}d (${targetDate})`}
                </span>
              )}
            </div>
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {item.merchant_name} — {item.title}
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-900">
              {formatMinorAmount(item.amount_minor, item.currency, locale)}
            </p>
            {item.billing_cycle && item.billing_cycle !== "one_time" && (
              <p className="text-[11px] text-slate-500">/{item.billing_cycle}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {item.status === "needs_review" && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runAction(item.id, "confirm")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm ({Math.round(Number(item.confidence_score) * 100)}%)
            </button>
          )}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(item.id, "resolve")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Done
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(item.id, "snooze")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Snooze 2d
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(item.id, "archive")}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Archive className="h-3.5 w-3.5" />
            Vault
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => requestDraft(item)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            Draft Email
          </button>
        </div>

        {draftPanel?.itemId === item.id && (
          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs">
            <p className="font-semibold text-slate-900">{draftPanel.subject}</p>
            {draftPanel.upgradeMessage ? (
              <p className="mt-1 text-slate-600">{draftPanel.upgradeMessage}</p>
            ) : (
              <>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-700">
                  {draftPanel.body}
                </pre>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `Subject: ${draftPanel.subject}\n\n${draftPanel.body ?? ""}`
                    );
                    setCopiedDraft(true);
                    setTimeout(() => setCopiedDraft(false), 2000);
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  {copiedDraft ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedDraft ? "Copied Draft" : "Copy Email Draft"}
                </button>
              </>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {needsReview.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-700 uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>Quick Confirm ({needsReview.length})</span>
          </div>
          <div className="space-y-3">{needsReview.map(renderCard)}</div>
        </section>
      )}

      {urgentItems.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold tracking-wide text-rose-700 uppercase">
            Needs Action Soon ({urgentItems.length})
          </h2>
          <div className="space-y-3">{urgentItems.map(renderCard)}</div>
        </section>
      )}

      {upcomingItems.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Active & Upcoming ({upcomingItems.length})
          </h2>
          <div className="space-y-3">{upcomingItems.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
