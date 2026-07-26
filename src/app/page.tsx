import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Building } from "@/lib/types";
import { HeroSearch } from "@/components/HeroSearch";

// City home — redesigned 26 July 2026 to match
// `drawtropolis landing page.png` (illustrated isometric city, provided by
// Andrew as the target design).
//
// IMPORTANT: the reference image is a full mockup — the title, nav badges,
// City Hall panel, all 10 collection-card labels/name-lists, and the
// footer feature strip are already painted into the artwork itself. The
// first version of this page made the mistake of rendering a *second*,
// separate set of HTML text on top of all of that, which is why it showed
// up doubled and misaligned. Fixed by removing every duplicate visible
// element — the image supplies 100% of the visible chrome — and replacing
// them with invisible clickable regions (no background, no border, no
// text) positioned over the real artwork, plus one functional search
// input. Card positions were measured directly from the source PNG
// (flood-fill + manual pixel crops), not eyeballed.
//
// Second fix (same session): each card used to be ONE big link to the
// first building in that collection, so every name in e.g. the Dynasty
// card routed to "Ming" no matter which name you actually clicked. Fixed
// by splitting each card into one invisible link strip per building name,
// stacked to match the row positions in the baked artwork (header band
// ~24% of card height, remaining rows split evenly — matches every card
// crop checked while measuring positions).
//
// This whole "one mega image + overlay" approach is a stopgap. Andrew's
// proposed asset architecture — one reusable background image per
// district with a blank plaque that only the building name changes on —
// is the right long-term direction and should replace this. Not built
// this session (see continuity doc for the full plan and why).

type Rect = { top: number; left: number; width: number; height: number }; // all in % of hero container

const COLLECTION_LAYOUT: Record<string, Rect> = {
  Crown: { top: 26.2, left: 0.3, width: 14.5, height: 18.8 },
  Olympus: { top: 28.1, left: 20.7, width: 14.3, height: 18.8 },
  Liberty: { top: 46.7, left: 0.5, width: 14, height: 19.5 },
  Sakura: { top: 29.6, left: 67.8, width: 14.3, height: 17.3 },
  Pharaoh: { top: 27.8, left: 85.3, width: 14.3, height: 19.5 },
  Valhalla: { top: 48.3, left: 83.9, width: 14.3, height: 18.1 },
  Empire: { top: 69.1, left: 0.5, width: 14, height: 19.5 },
  Dynasty: { top: 67.2, left: 33.1, width: 13.8, height: 21.2 },
  Renaissance: { top: 68.4, left: 54.6, width: 12, height: 18.1 },
  Oasis: { top: 70.1, left: 85.2, width: 14.3, height: 16.3 },
};

// Fraction of each card's height taken up by the icon+title band before
// the name list starts — measured off the Crown card crop, applied as a
// shared default since every card uses the same template.
const HEADER_FRACTION = 0.24;

const CITY_HALL_RECT: Rect = { top: 37.1, left: 41.8, width: 16.8, height: 21 };
const SEARCH_RECT: Rect = { top: 1.8, left: 68.5, width: 17.5, height: 3.9 };
const SIGN_IN_RECT: Rect = { top: 1.8, left: 88, width: 8, height: 3.9 };

function pct(r: Rect): CSSProperties {
  return { top: `${r.top}%`, left: `${r.left}%`, width: `${r.width}%`, height: `${r.height}%` };
}

export default async function Home() {
  const supabase = await createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, name, collection, is_special")
    .order("id");

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-500">
          Could not load buildings: {error.message}
        </p>
      </main>
    );
  }

  const cityHall = (buildings ?? []).find((b: Building) => b.is_special);
  const collections = new Map<string, Building[]>();
  for (const b of buildings ?? []) {
    if (b.is_special) continue;
    const key = b.collection ?? "Uncategorised";
    if (!collections.has(key)) collections.set(key, []);
    collections.get(key)!.push(b);
  }

  return (
    <main className="bg-[#0a1220]">
      <div className="relative w-full aspect-[1536/1024] overflow-hidden">
        <Image
          src="/hero-city.png"
          alt="Drawtropolis — an illustrated city of a million rooms, with ten districts: Crown, Olympus, Liberty, Sakura, Pharaoh, Valhalla, Empire, Dynasty, Renaissance and Oasis, and City Hall at the centre"
          fill
          priority
          className="object-cover object-center"
        />

        {/* functional search — transparent, sits exactly over the baked search bar art */}
        <div style={pct(SEARCH_RECT)} className="absolute z-20">
          <HeroSearch buildings={(buildings ?? []) as Building[]} transparent />
        </div>

        {/* Sign In — invisible clickable region over the baked nav button */}
        <Link
          href="/sign-in"
          style={pct(SIGN_IN_RECT)}
          className="absolute z-20"
          aria-label="Sign in"
        />

        {/* City Hall — invisible clickable region over the baked panel + button */}
        {cityHall && (
          <Link
            href={`/building/${cityHall.id}`}
            style={pct(CITY_HALL_RECT)}
            className="absolute z-20"
            aria-label="Enter City Hall — open to everyone, no claim needed"
          />
        )}

        {/* collection cards — one invisible link strip per building name row */}
        {Array.from(collections.entries()).map(([name, list]) => {
          const rect = COLLECTION_LAYOUT[name];
          if (!rect || list.length === 0) return null;
          const headerHeight = rect.height * HEADER_FRACTION;
          const rowHeight = (rect.height - headerHeight) / list.length;
          return (
            <div key={name} style={pct(rect)} className="absolute z-20">
              {list.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/building/${b.id}`}
                  aria-label={b.name}
                  className="absolute left-0 w-full"
                  style={{
                    top: `${(headerHeight + i * rowHeight) / rect.height * 100}%`,
                    height: `${rowHeight / rect.height * 100}%`,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </main>
  );
}
