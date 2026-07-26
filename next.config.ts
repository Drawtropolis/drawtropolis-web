import type { NextConfig } from "next";

// Canonical-domain redirect — added 26 July 2026. Bug found: the bare
// apex domain (drawtropolis.com, no www) and www.drawtropolis.com were
// both serving the site with no redirect between them. Supabase auth
// sets its session cookie against whichever host the sign-in redirect
// lands on (www.drawtropolis.com, per SITE_URL in sign-in/page.tsx) —
// browsers treat apex and www as different origins for cookies, so
// anyone who ended up on the bare domain (e.g. typed "drawtropolis.com"
// directly into the address bar) looked signed-out everywhere, even
// right after actually signing in on www. This forces every request to
// the apex domain to 308-redirect to the www version, so there's only
// ever one origin holding the session — fixes the "claim room" flow
// that was blocked by this same-origin cookie split.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "drawtropolis.com" }],
        destination: "https://www.drawtropolis.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
