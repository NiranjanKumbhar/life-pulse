"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Mail,
  Camera,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OnboardingSetupProps {
  householdId: string;
  forwardingAddress: string;
  forwardingStatus: string;
}

const FILTER_QUERY =
  'receipt OR invoice OR "order confirmation" OR "free trial" OR "auto-renew" OR "renewal" OR "return window"';

const SAMPLE_EMAILS = [
  {
    label: "Adobe Free Trial (£19.99/mo)",
    fromAddress: "billing@adobe.com",
    subject: "Your Adobe Creative Cloud free trial ends soon",
    textBody:
      "Thanks for trying Creative Cloud. Your 7-day free trial auto-renews at £19.99/month unless cancelled.",
  },
  {
    label: "Nike Order Return (£118.00)",
    fromAddress: "orders@nike.co.uk",
    subject: "Order Confirmation #NK-884192 — Air Max",
    textBody:
      "Your Nike order #NK-884192 for £118.00 has shipped. Easy online returns available.",
  },
  {
    label: "Car Insurance Renewal (€640.00)",
    fromAddress: "renewals@allianz.eu",
    subject: "Your annual car insurance policy renewal notice",
    textBody:
      "Your annual insurance renewal invoice of €640.00 is due soon. Policy ref #ALZ-44102.",
  },
];

export function OnboardingSetup({
  householdId,
  forwardingAddress,
  forwardingStatus,
}: OnboardingSetupProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<"gmail" | "outlook" | "apple">("gmail");
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedFilter, setCopiedFilter] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapStatus, setSnapStatus] = useState<string | null>(null);

  async function copyText(text: string, which: "alias" | "filter") {
    await navigator.clipboard.writeText(text);
    if (which === "alias") {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedFilter(true);
      setTimeout(() => setCopiedFilter(false), 2000);
    }
  }

  async function runSampleForward(sample: (typeof SAMPLE_EMAILS)[number]) {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/inbound/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: sample.fromAddress,
          subject: sample.subject,
          textBody: sample.textBody,
          channel: "auto_forward",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSimResult(json.error || "Could not process sample email.");
        return;
      }
      setSimResult(
        `Parsed "${json.item.title}" in ${json.processingMs}ms (raw email discarded). Check Today's Pulse!`
      );
      router.refresh();
    } finally {
      setSimLoading(false);
    }
  }

  async function handleSnapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSnapLoading(true);
    setSnapStatus(null);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${householdId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("vault-documents")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Hash file client-side for deduplication
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const sha256 = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { error: docError } = await supabase.from("documents").insert({
        household_id: householdId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size_bytes: file.size,
        sha256_hash: sha256,
      });

      if (docError) throw docError;
      setSnapStatus(`Saved "${file.name}" to your encrypted EU Vault.`);
      router.refresh();
    } catch (err) {
      setSnapStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSnapLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Recommended Default: Private Auto-Forwarding */}
      <section className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              1. Private Auto-Forwarding
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Recommended Default · {forwardingStatus === "active" ? "Verified" : "Ready"}
          </span>
        </div>

        <p className="text-sm text-slate-600">
          You keep full control of your inbox. Only emails matching your receipt/renewal
          filter are forwarded—and raw email bodies are discarded immediately after
          extraction.
        </p>

        {/* Alias box */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <code className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
            {forwardingAddress}
          </code>
          <button
            type="button"
            onClick={() => copyText(forwardingAddress, "alias")}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {copiedAlias ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedAlias ? "Copied" : "Copy Alias"}
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="mt-4">
          <div className="mb-2 flex gap-1.5 text-xs font-medium">
            {(["gmail", "outlook", "apple"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`rounded-lg px-3 py-1.5 capitalize ${
                  provider === p
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                {p === "apple" ? "Apple Mail" : p}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">1-Click Search Filter:</span>
              <button
                type="button"
                onClick={() => copyText(FILTER_QUERY, "filter")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-100"
              >
                {copiedFilter ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedFilter ? "Copied Filter" : "Copy Filter"}
              </button>
            </div>
            <code className="block break-all rounded-lg bg-white p-2 text-[11px] text-slate-600">
              {FILTER_QUERY}
            </code>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-slate-600">
              {provider === "gmail" && (
                <>
                  <li>Open Gmail Settings → Forwarding and POP/IMAP → Add forwarding address above.</li>
                  <li>Paste the Search Filter into Gmail&apos;s top search bar → click &quot;Create filter&quot;.</li>
                  <li>Check &quot;Forward it to&quot; your Life Pulse alias and save. Done!</li>
                </>
              )}
              {provider === "outlook" && (
                <>
                  <li>Open Outlook Settings → Mail → Rules → Add new rule.</li>
                  <li>Set condition: Subject or Body includes receipt, invoice, renewal, or free trial.</li>
                  <li>Set action: Forward to your Life Pulse alias and save.</li>
                </>
              )}
              {provider === "apple" && (
                <>
                  <li>Open iCloud Mail or Apple Mail → Settings → Rules → Add Rule.</li>
                  <li>Match &quot;Any&quot; keyword (receipt, invoice, order confirmation, renewal).</li>
                  <li>Choose Action: Forward Message to your Life Pulse alias.</li>
                </>
              )}
            </ol>
          </div>
        </div>

        {/* Instant Aha Test */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            Test the Zero-Retention Parser Right Now (1-Tap Sample):
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_EMAILS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                disabled={simLoading}
                onClick={() => runSampleForward(sample)}
                className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-100 disabled:opacity-50"
              >
                + {sample.label}
              </button>
            ))}
          </div>
          {simResult && (
            <p className="mt-2.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              {simResult}
            </p>
          )}
        </div>
      </section>

      {/* 2. Mobile Snap / Receipt Upload */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            2. Mobile Snap & PDF Upload
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          Snap a photo of a paper bill, physical receipt, or upload a PDF warranty directly
          into your encrypted EU Vault (max 15 MB).
        </p>

        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50/40">
          <Camera className="h-4 w-4 text-indigo-600" />
          <span>{snapLoading ? "Encrypting & uploading..." : "Snap Photo or Choose PDF"}</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            disabled={snapLoading}
            onChange={handleSnapUpload}
            className="hidden"
          />
        </label>

        {snapStatus && (
          <p className="mt-2.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800">
            {snapStatus}
          </p>
        )}
      </section>

      {/* 3. Optional Secondary Option: Gmail / Outlook OAuth */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">
              3. Direct Gmail / Outlook Sync (Optional)
            </h2>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            Phase 3 Opt-In
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-600">
          Prefer 1-click historical backfill without setting up a forwarding rule? Read-only
          OAuth sync will be available as an optional upgrade for Solo Pro &amp; Household
          plans once CASA security certification completes. Auto-Forwarding remains our
          recommended default.
        </p>
      </section>
    </div>
  );
}
