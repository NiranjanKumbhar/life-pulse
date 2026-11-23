import { Search, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";
import { formatMinorAmount } from "@/lib/extraction/schema";

interface VaultPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) return null;

  const { q = "" } = await searchParams;
  const trimmed = q.trim();
  const supabase = await createClient();

  let itemsQuery = supabase
    .from("life_items")
    .select("*")
    .eq("household_id", ctx.household.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (trimmed) {
    itemsQuery = itemsQuery.textSearch("search_vector", trimmed, {
      type: "websearch",
      config: "simple",
    });
  }

  const [{ data: items }, { data: docs }] = await Promise.all([
    itemsQuery,
    supabase
      .from("documents")
      .select("*")
      .eq("household_id", ctx.household.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Warranty &amp; Receipt Vault
        </h1>
        <p className="text-sm text-slate-600">
          Instant plain-English search across all tracked receipts, orders, and renewals.
        </p>
      </div>

      <form method="GET" action="/vault" className="relative">
        <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={trimmed}
          placeholder='Search e.g. "Nike", "Adobe", "insurance", or an order number...'
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </form>

      <section className="space-y-2.5">
        <h2 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
          Tracked Records ({items?.length ?? 0})
        </h2>
        {!items || items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {trimmed
              ? `No records matched "${trimmed}".`
              : "No records stored yet. Forward a receipt or test a sample in Forward & Snap."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {item.merchant_name} — {item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.item_type.replace("_", " ")} · {item.status}
                    {item.expiry_date ? ` · Expires ${item.expiry_date}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">
                  {formatMinorAmount(item.amount_minor, item.currency, ctx.profile.locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
          Uploaded Files ({docs?.length ?? 0}
          {ctx.entitlements.maxVaultDocuments !== null
            ? ` / ${ctx.entitlements.maxVaultDocuments}`
            : ""}
          )
        </h2>
        {!docs || docs.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No snapped receipts or PDFs yet. Use Mobile Snap in the Forward &amp; Snap tab.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="truncate font-medium text-slate-800">
                    {doc.file_name ?? doc.storage_path}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{doc.mime_type}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
