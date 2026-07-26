"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Building } from "@/lib/types";

// Minimum-viable "find a room or city" search for the hero bar.
// If the input looks like a coordinate (b-f-r, e.g. 12-56-60) it routes
// straight to that room. Otherwise it does a case-insensitive match
// against building names and routes to that building. This is the same
// coordinate-finder concept flagged as the next-stage minimum requirement
// (see WORLD_ARCHITECTURE / continuity doc) — this is a first, simple cut
// of it, not the full "request access" flow.
const COORDINATE_RE = /^(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})$/;

export function HeroSearch({
  buildings,
  transparent = false,
}: {
  buildings: Building[];
  // When true, renders with no visible background/border of its own — for
  // sitting exactly on top of a reference image that already has a search
  // bar painted in, so we don't render a second, duplicate box.
  transparent?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [notFound, setNotFound] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = value.trim();
    if (!query) return;

    const coordMatch = query.match(COORDINATE_RE);
    if (coordMatch) {
      const [, b, f, r] = coordMatch;
      router.push(`/room/${Number(b)}/${Number(f)}/${Number(r)}`);
      return;
    }

    const match = buildings.find(
      (b) => b.name.toLowerCase() === query.toLowerCase(),
    ) ?? buildings.find((b) =>
      b.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (match) {
      setNotFound(false);
      router.push(`/building/${match.id}`);
    } else {
      setNotFound(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full h-full">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (notFound) setNotFound(false);
        }}
        type="text"
        placeholder={transparent ? "" : "Find a room or city..."}
        aria-label="Find a room or city"
        className={
          transparent
            ? "w-full h-full bg-transparent border-none text-white placeholder-transparent px-3 outline-none focus:bg-black/20 rounded-full"
            : "w-full rounded-full bg-black/40 border border-white/25 text-white placeholder-white/60 text-[11px] sm:text-xs px-3 py-1.5 sm:py-2 pr-8 outline-none focus:border-white/60 backdrop-blur-sm"
        }
      />
      {!transparent && (
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}
      {notFound && (
        <p className="absolute top-full left-0 mt-1 text-[10px] text-rose-300 bg-black/60 rounded px-2 py-1">
          No building matched &ldquo;{value.trim()}&rdquo; — try a name like &ldquo;Zeus&rdquo; or a coordinate like 12-56-60.
        </p>
      )}
    </form>
  );
}
