import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Building } from "@/lib/types";
import { HeroSearch } from "@/components/HeroSearch";
import { CityMap } from "@/components/CityMap";

// City home — rebuilt 26 July 2026, replacing the "one mega image with
// everything baked in" version. That version worked but was fragile: the
// title, search bar, sign-in button, City Hall panel, and all 10 district
// card name-lists were painted directly into `hero-city.png`, so every
// interactive element had to land an invisible click-region on exactly the
// right baked pixels — any mismatch (or any future re-generation of the
// art) broke something. See CityMap.tsx for the new approach: the
// background (`/city-map.png`) is pure artwork with no text at all, and
// every functional piece (logo, title, search, sign-in, district labels,
// building lists, City Hall entry) is real HTML rendered on top of it.
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

  const allBuildings = (buildings ?? []) as Building[];
  const cityHall = allBuildings.find((b) => b.is_special) ?? null;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Real top bar — logo, title, search, sign-in. Independent of the
          city artwork entirely, so it never fights with what's underneath
          it and never depends on where the art happens to paint anything. */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-4 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3">
          <Image
            src="/drawtropolis-logo.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold leading-none tracking-tight">
              DRAWTROPOLIS
            </h1>
            <p className="text-[11px] sm:text-xs text-[var(--muted)]">
              A million rooms. One city. Find yours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-40 sm:w-64">
            <HeroSearch buildings={allBuildings} />
          </div>
          <Link
            href="/sign-in"
            className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* The city itself — nearly full-bleed, minimal margin either side */}
      <div className="px-2 sm:px-3 pb-6 max-w-[1800px] mx-auto">
        <CityMap buildings={allBuildings} cityHall={cityHall} />
      </div>
    </main>
  );
}
