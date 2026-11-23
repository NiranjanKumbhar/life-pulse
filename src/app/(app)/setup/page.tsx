import { getUserWorkspaceContext } from "@/lib/household";
import { OnboardingSetup } from "@/components/OnboardingSetup";

export default async function SetupPage() {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Forward &amp; Snap Setup
        </h1>
        <p className="text-sm text-slate-600">
          Privacy-first ingestion: default to Auto-Forwarding + Mobile Snap.
        </p>
      </div>

      <OnboardingSetup
        householdId={ctx.household.id}
        forwardingAddress={
          ctx.defaultForwardSource?.address_or_handle ?? "Generating alias..."
        }
        forwardingStatus={ctx.defaultForwardSource?.status ?? "pending_test"}
      />
    </div>
  );
}
