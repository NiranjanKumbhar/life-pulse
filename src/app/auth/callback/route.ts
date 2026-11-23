import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = sanitizeNextPath(searchParams.get("next"), "/pulse");
  const consentAccepted = searchParams.get("consent") === "accepted";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_oauth_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=oauth_exchange_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && consentAccepted) {
    const { count } = await supabase
      .from("user_consents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("consent_type", "privacy_policy");

    if (!count || count === 0) {
      await supabase.from("user_consents").insert([
        {
          user_id: user.id,
          consent_type: "privacy_policy",
          policy_version: "2026-11-v1",
        },
        {
          user_id: user.id,
          consent_type: "email_parsing",
          policy_version: "2026-11-v1",
        },
      ]);
    }
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
