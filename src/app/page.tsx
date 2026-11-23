import { redirect } from "next/navigation";
import { Activity, ShieldCheck, Clock, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/AuthCard";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/pulse");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 md:flex-row md:items-center md:gap-12">
      <section className="mb-8 flex-1 space-y-5 md:mb-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
          <Activity className="h-3.5 w-3.5" />
          <span>Life Pulse · EU/UK/US & India Ready</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Stop losing money to forgotten trials, renewals, and return windows.
        </h1>

        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Forward receipts or snap paper bills. Get one calm 60-second{" "}
          <strong className="text-slate-900">Morning Life Pulse</strong> every day—without
          handing over full access to your personal inbox.
        </p>

        <ul className="space-y-3 pt-1 text-sm text-slate-700">
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <strong>Privacy-first by default:</strong> Private Auto-Forwarding + Mobile
              Snap. Raw email text is discarded in memory.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>
              <strong>Never miss a deadline:</strong> Tracks free trials, price hikes,
              regional return windows (14d EU/UK, 30d US, 7d IN), and renewals.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span>
              <strong>Encrypted Warranty Vault:</strong> Search any receipt or warranty in
              plain English, hosted in EU (`eu-west-1`).
            </span>
          </li>
        </ul>
      </section>

      <section className="flex flex-1 justify-center">
        <AuthCard />
      </section>
    </main>
  );
}
