import type { Metadata } from "next";
import "./globals.css";

// Deliberately not using next/font/google (Geist) — it fetches from
// fonts.googleapis.com at build time, which fails in network-restricted
// build environments (this crashed the build entirely in sandbox testing,
// not just a cosmetic font miss). System font stack costs nothing and
// works everywhere. Swap in a self-hosted font file later if the brand
// needs something specific — that avoids the network dependency too.
export const metadata: Metadata = {
  title: "Drawtropolis",
  description: "A million rooms. One city. Find yours.",
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
