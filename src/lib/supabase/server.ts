import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for Server Components / Route Handlers.
// Reads the user's session from cookies so RLS applies exactly as it does
// for direct client calls — this is what makes server-rendered pages able
// to show locked rooms to their actual members without a service role key.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore if
            // middleware is refreshing sessions (see middleware.ts).
          }
        },
      },
    },
  );
}
