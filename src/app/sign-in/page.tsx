"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Minimum-viable sign-in — magic link by email via Supabase Auth. No
// password to manage, no separate sign-up flow needed: the
// `on_auth_user_created` trigger already creates a `profiles` row
// automatically for any new auth.users row, so first-time and returning
// visitors go through the exact same "email me a link" flow. This is the
// first real auth screen in the app — previously "Sign In" was a
// non-functional placeholder button.
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-[#0a1220]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-1">Sign in</h1>
        <p className="text-white/60 text-sm mb-6">
          No password needed — we&apos;ll email you a link.
        </p>

        {status === "sent" ? (
          <p className="text-emerald-400 text-sm">
            Check {email} for a sign-in link.
          </p>
        ) : (
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
        )}
      </div>
    </main>
  );
}
