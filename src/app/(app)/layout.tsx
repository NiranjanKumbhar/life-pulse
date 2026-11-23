import { redirect } from "next/navigation";
import { getUserWorkspaceContext } from "@/lib/household";
import { AppShell } from "@/components/AppShell";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserWorkspaceContext();
  if (!ctx) {
    redirect("/");
  }

  return (
    <AppShell
      planTier={ctx.entitlements.effectiveTier}
      activeItemCount={ctx.activeItemCount}
      maxActiveItems={ctx.entitlements.maxActiveItems}
    >
      {children}
    </AppShell>
  );
}
