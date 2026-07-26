"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Site-wide signed-in indicator, added 26 July 2026. Nothing on the site
// showed who (if anyone) was signed in — no username, no email, no sign
// out link, anywhere. That's why testing was confusing even after the
// auth fix: a successful sign-in produced no visible confirmation
// anywhere on the page. This sits in the root layout so it's present on
// every route. Reads the session client-side and subscribes to auth
// state changes so it updates immediately after sign-in/out without a
// full page reload.
export function UserBadge() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // undefined = still checking, render nothing to avoid a flash
  if (email === undefined) return null;

  return (
    <div className="w-full flex justify-end px-4 py-2 text-xs text-neutral-400 gap-3">
      {email ? (
        <>
          <span>Signed in as {email}</span>
          <button onClick={handleSignOut} className="hover:underline">
            Sign out
          </button>
        </>
      ) : (
        <a href="/sign-in" className="hover:underline">
          Sign in
        </a>
      )}
    </div>
  );
}
