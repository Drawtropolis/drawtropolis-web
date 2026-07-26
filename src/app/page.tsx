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
// input. Positions below were measured directly from the source PNG
// (flood-fill + manual pixel crops), not eyeballed, so they should sit
// much closer to the actual art than the first pass.
//
// Each collection card currently links to the first building in that
// collection (a stand-in "enter this district" action) since there's no
// dedicated district page yet — that's the natural Level-2 page in
// Andrew's proposed asset architecture (district building page, reusing
// one image per district with a blank name plaque), not built this
// session. Swap the link target once that page exists.

type Rect = { top: string; left: string; width: string; height: string };

// Measured against the 1536x1024 reference image.
const COLLECTION_LAYOUT: Record<string, Rect> = {
  Crown: { top: "26.2%", left: "0.3%", width: "14.5%", height: "18.8%" },
  Olympus: { top: "28.1%", left: "20.7%", width: "14.3%", height: "18.8%" },
  Liberty: { top: "46.7%", left: "0.5%", width: "14%", height: "19.5%" },
  Sakura: { top: "29.6%", left: "67.8%", width: "14.3%", height: "17.3%" },
  Pharaoh: { top: "27.8%", left: "85.3%", width: "14.3%", height: "19.5%" },
  Valhalla: { top: "48.3%", left: "83.9%", width: "14.3%", height: "18.1%" },
  Empire: { top: "69.1%", left: "0.5%", width: "14%", height: "19.5%" },
  Dynasty: { top: "67.2%", left: "33.1%", width: "13.8%", height: "21.2%" },
  Renaissance: { top: "68.4%", left: "54.6%", width: "12%", height: "18.1%" },
  Oasis: { top: "70.1%", left: "85.2%", width: "14.3%", height: "16.3%" },
};

const CITY_HALL_RECT: Rect = { top: "37.1%", left: "41.8%", width: "16.8%", height: "21%" };
const SEARCH_RECT: Rect = { top: "1.8%", left: "68.5%", width: "17.5%", height: "3.9%" };

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
        <div
          style={SEARCH_RECT}
          className="absolute z-20"
        >
          <HeroSearch buildings={(buildings ?? []) as Building[]} transparent />
        </div>

        {/* City Hall — invisible clickable region over the baked panel + button */}
        {cityHall && (
          <Link
            href={`/building/${cityHall.id}`}
            style={CITY_HALL_RECT}
            className="absolute z-20"
            aria-label="Enter City Hall — open to everyone, no claim needed"
          />
        )}

        {/* collection cards — invisible clickable regions over each baked panel */}
        {Array.from(collections.entries()).map(([name, list]) => {
          const rect = COLLECTION_LAYOUT[name];
          if (!rect || list.length === 0) return null;
          return (
            <Link
              key={name}
              href={`/building/${list[0].id}`}
              style={rect}
              className="absolute z-20"
              aria-label={`${name} district — ${list.map((b) => b.name).join(", ")}`}
            />
          );
        })}
      </div>
    </main>
  );
}
