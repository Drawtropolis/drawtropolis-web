import type { Metadata } from "next";
import "./globals.css";

// Deliberately not using next/font/google (Geist) — it fetches from
// fonts.googleapis.com at build time, which fails in network-restricted
// build environments (this crashed the build entirely in sandbox testing,
// not just a cosmetic font miss). System font stack costs nothing and
// works everywhere. Swap in a self-hosted font file later if the brand
// needs something specific — that avoids the network dependency too.
// SEO metadata — this is the whole site's default title/description/social
// preview config. Filled out properly 26 July 2026 once drawtropolis.com
// was verified in Google Search Console and the homepage submitted for
// indexing; before that it was just a bare title + description with no
// Open Graph or Twitter card data, so shared links had no preview image
// and Google had nothing but the title to go on.
//
// `title.template` means any page that sets its own `metadata.title`
// (e.g. a building page setting title: "Crown") automatically renders as
// "Crown | Drawtropolis" in the tab and in search results — no need to
// repeat the site name on every page. Use `generateMetadata()` for
// dynamic routes (building/room pages) once those need their own
// descriptions — not done yet, this pass only covers the site-wide
// default that every page inherits until overridden.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.drawtropolis.com"),
  title: {
    default: "Drawtropolis — A Million Rooms. One City. Find Yours.",
    template: "%s | Drawtropolis",
  },
  description:
    "Claim your own room in Drawtropolis, a persistent collaborative city of a million rooms across 100 buildings, 100 floors and 100 rooms each. Draw alone, or invite friends into your space.",
  keywords: [
    "Drawtropolis",
    "collaborative drawing",
    "online city",
    "draw together",
    "shared canvas",
    "virtual city",
    "claim a room",
  ],
  openGraph: {
    title: "Drawtropolis — A Million Rooms. One City. Find Yours.",
    description:
      "A persistent collaborative city of a million rooms. Claim yours and draw alone, or with friends.",
    url: "https://www.drawtropolis.com",
    siteName: "Drawtropolis",
    images: [
      {
        url: "/hero-city.png",
        width: 1536,
        height: 1024,
        alt: "Drawtropolis — an illustrated city of a million rooms across ten districts, with City Hall at the centre",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Drawtropolis — A Million Rooms. One City. Find Yours.",
    description:
      "A persistent collaborative city of a million rooms. Claim yours and draw alone, or with friends.",
    images: ["/hero-city.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
