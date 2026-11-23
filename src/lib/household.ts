import { createClient } from "@/lib/supabase/server";
import {
  getHouseholdEntitlements,
  type HouseholdEntitlements,
} from "@/lib/entitlements";
import type { Database } from "@/types/database";

type HouseholdRow = Database["public"]["Tables"]["households"]["Row"];
type IngestionSourceRow = Database["public"]["Tables"]["ingestion_sources"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface UserWorkspaceContext {
  userId: string;
  profile: ProfileRow;
  household: HouseholdRow;
  entitlements: HouseholdEntitlements;
  defaultForwardSource: IngestionSourceRow | null;
  activeItemCount: number;
}

export async function getUserWorkspaceContext(): Promise<UserWorkspaceContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("household_members")
      .select("household_id, households(*)")
      .eq("user_id", user.id)
      .limit(1)
      .single(),
  ]);

  if (!profile || !membership?.households) return null;

  const household = membership.households as unknown as HouseholdRow;

  const [{ data: sources }, { count: activeCount }] = await Promise.all([
    supabase
      .from("ingestion_sources")
      .select("*")
      .eq("household_id", household.id)
      .eq("channel", "auto_forward")
      .order("is_default", { ascending: false })
      .limit(1),
    supabase
      .from("life_items")
      .select("id", { count: "exact", head: true })
      .eq("household_id", household.id)
      .in("status", ["active", "needs_review"])
      .is("deleted_at", null),
  ]);

  return {
    userId: user.id,
    profile,
    household,
    entitlements: getHouseholdEntitlements({
      plan_tier: household.plan_tier,
      subscription_status: household.subscription_status,
      feature_overrides:
        (household.feature_overrides as Record<string, unknown> | null) ?? null,
    }),
    defaultForwardSource: sources?.[0] ?? null,
    activeItemCount: activeCount ?? 0,
  };
}
