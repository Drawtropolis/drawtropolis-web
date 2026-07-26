"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Minimum-viable sign-in — magic link by email via Supabase Auth, plus
// Google as a faster alternative. No password to manage, no separate
// sign-up flow needed: the `on_auth_user_created` trigger already creates
// a `profiles` row automatically for any new auth.users row.
//
// Bug fixed 26 July 2026: emailRedirectTo used to be
// `window.location.origin`, so the link in the email sent you back to
// whichever domain you happened to click "sign in" from — if Andrew
// tested from drawtropolis-web.vercel.app, the email took him back to
// vercel.app instead of drawtropolis.com, even though the real site is
// the custom domain. Fixed by hardcoding the production URL so the
// redirect is always the same regardless of which domain the sign-in
// request came from. Same fix applied to the new Google button below.
//
// Note on rate limits: Supabase's default built-in email service (no
// custom SMTP configured) has a very low send limit — a handful of
// emails per hour. Rapid repeat testing will hit "email rate limit
// exceeded" or produce links that expire before they're used. That's a
// Supabase account-level limit, not a bug in this page. Fix long-term by
// wiring a custom SMTP provider (e.g. Resend, Postmark) in Supabase's
// Auth → Emails settings — not done yet, needs Andrew's own account with
// whichever provider he picks.
const SITE_URL = "https://www.drawtropolis.com/";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: SITE_URL,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: SITE_URL },
    });
    // On success this navigates away to Google immediately — no further
    // state update needed. Only reachable here if it failed to even start
    // (e.g. Google provider not yet configured in Supabase).
    if (error) {
      setGoogleLoading(false);
      setStatus("error");
      setErrorMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-[#0a1220]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-1">Sign in</h1>
        <p className="text-white/60 text-sm mb-6">
          No password needed — we&apos;ll email you a link, or continue with
          Google.
        </p>

        {status === "sent" ? (
          <p className="text-emerald-400 text-sm">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full rounded bg-white hover:bg-neutral-100 text-neutral-900 text-sm font-medium px-4 py-2 disabled:opacity-50 mb-4"
            >
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-xs text-white/40">or</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded bg-white/10 border border-white/25 text-white placeholder-white/40 px-3 py-2 text-sm outline-none focus:border-white/60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
              >
                {status === "loading" ? "Sending…" : "Email me a link"}
              </button>
              {status === "error" && errorMessage && (
                <p className="text-rose-400 text-sm">{errorMessage}</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
