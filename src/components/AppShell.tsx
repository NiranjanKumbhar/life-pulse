"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Camera,
  FolderSearch,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AppShellProps {
  children: React.ReactNode;
  planTier: string;
  activeItemCount: number;
  maxActiveItems: number | null;
}

const NAV_ITEMS = [
  { href: "/pulse", label: "Pulse", icon: Activity },
  { href: "/setup", label: "Forward & Snap", icon: Camera },
  { href: "/vault", label: "Vault", icon: FolderSearch },
  { href: "/privacy", label: "Privacy & Plan", icon: ShieldCheck },
];

export function AppShell({
  children,
  planTier,
  activeItemCount,
  maxActiveItems,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/pulse" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sky-400">
              <Activity className="h-4 w-4" />
            </span>
            <span>Life Pulse</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {planTier.replace("_", " ").toUpperCase()}
              {maxActiveItems !== null ? ` · ${activeItemCount}/${maxActiveItems}` : ""}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 px-2 py-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium ${
                  active ? "text-slate-900" : "text-slate-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-sky-600" : ""}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
