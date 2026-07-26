import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The missing piece of the auth flow, added 26 July 2026. Both
// signInWithOtp (magic link) and signInWithOAuth (Google) use Supabase's
// PKCE flow: the initial call stores a `code_verifier` cookie, then the
// user gets redirected back to the site with a `?code=` in the URL. That
// code is NOT a session on its own — the app has to explicitly trade it
// for one by calling `exchangeCodeForSession()`. Nothing in the codebase
// was doing that. Every sign-in (magic link and Google both) looked like
// it completed — Google consent screen, or the email link — landed back
// on drawtropolis.com, and produced zero actual session. That's why
// "Claim this room" kept saying "Sign in first" no matter what account or
// browser was used to sign in: there was never a session to find.
//
// Both `emailRedirectTo` (sign-in/page.tsx) and `redirectTo` (same file,
// Google button) now point here instead of straight back to "/", so this
// route is what actually receives the code, exchanges it, and only then
// redirects on to wherever the user should land.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange itself failed — send back to sign-in with a
  // flag rather than silently landing on the homepage still signed out
  // with no explanation.
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
