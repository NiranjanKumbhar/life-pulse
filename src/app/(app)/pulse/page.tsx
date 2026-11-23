import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceContext } from "@/lib/household";
import { PulseFeed } from "@/components/PulseFeed";

export default async function PulsePage() {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("life_items")
    .select("*")
    .eq("household_id", ctx.household.id)
    .in("status", ["needs_review", "active"])
    .is("deleted_at", null)
    .order("action_date", { ascending: true, nullsFirst: false })
    .limit(50);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Today&apos;s Pulse
        </h1>
        <p className="text-sm text-slate-600">
          Your calm daily check-in for trials, return windows, and upcoming renewals.
        </p>
      </div>

      <PulseFeed initialItems={items ?? []} locale={ctx.profile.locale} />
    </div>
  );
}
