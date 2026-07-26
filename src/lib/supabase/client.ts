import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Uses the publishable/anon key only —
// never the service role key, which should never exist in frontend code.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
