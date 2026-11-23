"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptParsing, setAcceptParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && (!acceptPrivacy || !acceptParsing)) {
      setError("Please confirm both GDPR privacy consents before creating your account.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session && data.user) {
          // Record auditable GDPR Article 7 consents
          await supabase.from("user_consents").insert([
            {
              user_id: data.user.id,
              consent_type: "privacy_policy",
              policy_version: "2026-11-v1",
            },
            {
              user_id: data.user.id,
              consent_type: "email_parsing",
              policy_version: "2026-11-v1",
            },
          ]);
          router.push("/setup");
          router.refresh();
          return;
        }

        setMessage(
          "Check your email to confirm your account. Your private forwarding alias is already provisioned."
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/pulse");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex rounded-xl bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2 transition ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2 transition ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Full name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 py-2.5 pr-3.5 pl-9 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border border-slate-300 py-2.5 pr-3.5 pl-9 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              <span>
                I agree to the Privacy Policy (EU `eu-west-1` storage, 1-click GDPR export &
                erasure).
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptParsing}
                onChange={(e) => setAcceptParsing(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              <span>
                I consent to automated in-memory parsing of forwarded receipts & bills (raw
                email bodies are discarded immediately).
              </span>
            </label>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 text-sky-400" />
          {loading
            ? "Working..."
            : mode === "signup"
              ? "Start Free (Privacy-First)"
              : "Sign In to Life Pulse"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>No inbox password needed · Auto-Forward default · GDPR native</span>
      </div>
    </div>
  );
}
