import { getUserWorkspaceContext } from "@/lib/household";
import { PrivacyAndPlanPanel } from "@/components/PrivacyAndPlanPanel";

export default async function PrivacyPage() {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Privacy &amp; Subscription Plan
        </h1>
        <p className="text-sm text-slate-600">
          Full GDPR transparency, 1-click portability, and your subscription tier.
        </p>
      </div>

      <PrivacyAndPlanPanel
        effectiveTier={ctx.entitlements.effectiveTier}
        activeItemCount={ctx.activeItemCount}
        maxActiveItems={ctx.entitlements.maxActiveItems}
        retentionMonths={ctx.household.data_retention_months}
      />
    </div>
  );
}
