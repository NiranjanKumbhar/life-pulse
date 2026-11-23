"use client";

import { useState } from "react";
import { Download, Trash2, ShieldCheck, Check } from "lucide-react";
import { PLAN_CATALOG, type PlanTier } from "@/lib/entitlements";

interface PrivacyAndPlanPanelProps {
  effectiveTier: PlanTier;
  activeItemCount: number;
  maxActiveItems: number | null;
  retentionMonths: number;
}

export function PrivacyAndPlanPanel({
  effectiveTier,
  activeItemCount,
  maxActiveItems,
  retentionMonths,
}: PrivacyAndPlanPanelProps) {
  const [requestMsg, setRequestMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPrivacyRequest(
    requestType: "delete_account" | "purge_documents"
  ) {
    setBusy(true);
    setRequestMsg(null);
    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRequestMsg(json.error || "Could not submit privacy request.");
        return;
      }
      setRequestMsg(
        requestType === "delete_account"
          ? "GDPR Article 17 account erasure request logged. All personal data & vault files will be purged."
          : "Vault document purge request logged."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Foundation (Provider-Agnostic) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Subscription Plan
            </h2>
            <p className="text-xs text-slate-600">
              Current tier:{" "}
              <strong className="uppercase text-slate-900">
                {effectiveTier.replace("_", " ")}
              </strong>{" "}
              · Active items: {activeItemCount}
              {maxActiveItems !== null ? ` / ${maxActiveItems}` : " (Unlimited)"}
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            Billing provider connects in next milestone
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PLAN_CATALOG.map((plan) => {
            const isCurrent = plan.id === effectiveTier;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 ${
                  isCurrent
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {plan.priceLabel}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    {plan.cadence}
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* GDPR Privacy Center */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            GDPR Privacy &amp; Data Control
          </h2>
        </div>

        <div className="grid gap-3 text-xs text-slate-700 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">Data Residency</p>
            <p className="mt-0.5 text-slate-600">EU West (`eu-west-1`, Ireland)</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">Raw Email Storage</p>
            <p className="mt-0.5 text-slate-600">Zero retention (discarded in memory)</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">Retention Window</p>
            <p className="mt-0.5 text-slate-600">{retentionMonths} months (Article 5)</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/privacy/export"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export My Data (GDPR Art. 15 &amp; 20 JSON)
          </a>

          <button
            type="button"
            disabled={busy}
            onClick={() => submitPrivacyRequest("purge_documents")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Purge Vault Documents
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => submitPrivacyRequest("delete_account")}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Request Account Erasure (GDPR Art. 17)
          </button>
        </div>

        {requestMsg && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {requestMsg}
          </p>
        )}
      </section>
    </div>
  );
}
