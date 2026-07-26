import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Building } from "@/lib/types";
import { HeroSearch } from "@/components/HeroSearch";

// City home — redesigned 26 July 2026 to match
// `drawtropolis landing page.png` (illustrated isometric city, provided by
// Andrew as the target design). The background art is the real reference
// image; everything on top of it (nav, title, City Hall panel, the 10
// collection cards, footer strip) is real HTML/CSS positioned over it with
// percentage-based coordinates, so it scales with the container. Positions
// are a close approximation of the reference, not pixel-measured — worth a
// fine-tuning pass next session if anything looks off on a real screen.
//
// Building names inside each collection card are pulled live from
// Supabase (same query the old plain-list homepage used), not hardcoded,
// so this always reflects the real seeded data.

type CollectionLayout = {
  top: string;
  left: string;
  width: string;
  badge: string; // tailwind classes for the badge bg/border
  label: string; // display label
};

// Position map approximates the reference image (1536x1024). Left/top are
// the card's top-left corner as a percentage of the hero container.
const COLLECTION_LAYOUT: Record<string, CollectionLayout> = {
  Crown: { top: "26%", left: "1%", width: "13%", badge: "bg-neutral-900/90 border-amber-400/50", label: "Crown" },
  Olympus: { top: "28%", left: "17.5%", width: "13%", badge: "bg-blue-950/90 border-blue-400/50", label: "Olympus" },
  Liberty: { top: "47%", left: "1%", width: "13%", badge: "bg-emerald-950/90 border-emerald-400/50", label: "Liberty" },
  Sakura: { top: "28%", left: "68%", width: "13%", badge: "bg-rose-950/90 border-rose-400/50", label: "Sakura" },
  Pharaoh: { top: "28%", left: "85.5%", width: "13.5%", badge: "bg-amber-950/90 border-amber-400/50", label: "Pharaoh" },
  Valhalla: { top: "47%", left: "85.5%", width: "13.5%", badge: "bg-slate-900/90 border-slate-400/50", label: "Valhalla" },
  Empire: { top: "68%", left: "1%", width: "13%", badge: "bg-red-950/90 border-red-400/50", label: "Empire" },
  Dynasty: { top: "68%", left: "18%", width: "13%", badge: "bg-orange-950/90 border-orange-400/50", label: "Dynasty" },
  Renaissance: { top: "68%", left: "52%", width: "14%", badge: "bg-purple-950/90 border-purple-400/50", label: "Renaissance" },
  Oasis: { top: "68%", left: "85.5%", width: "13.5%", badge: "bg-teal-950/90 border-teal-400/50", label: "Oasis" },
};

const FEATURES = [
  { title: "Draw Anywhere", body: "Every room is a canvas." },
  { title: "Draw Together", body: "Invite friends and create side by side." },
  { title: "Explore Endlessly", body: "A million rooms. Infinite possibilities." },
  { title: "Safe & Welcoming", body: "A positive space for everyone." },
  { title: "Your World", body: "Save, share and leave your mark." },
];

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
      {/* Hero: illustrated city + overlay UI, aspect-ratio locked to the reference art */}
      <div className="relative w-full aspect-[1536/1024] overflow-hidden">
        <Image
          src="/hero-city.png"
          alt="Drawtropolis — an illustrated city of a million rooms"
          fill
          priority
          className="object-cover object-center"
        />

        {/* top nav */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[1.5%] py-[1.5%] z-20">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-black/45 border border-white/25 backdrop-blur-sm px-3 py-1.5 text-[10px] sm:text-xs text-white font-medium">
              1,000,000+ Rooms
            </span>
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-black/45 border border-white/25 backdrop-blur-sm px-3 py-1.5 text-[10px] sm:text-xs text-white font-medium">
              Draw Together
            </span>
          </div>
          <div className="flex items-center gap-2 w-[45%] sm:w-[35%] max-w-md">
            <div className="flex-1">
              <HeroSearch buildings={(buildings ?? []) as Building[]} />
            </div>
            <button
              type="button"
              title="Sign in — coming soon"
              className="rounded-full bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] sm:text-xs font-medium px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* hero title */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[6%] text-center z-20 pointer-events-none">
          <h1 className="text-white font-bold tracking-tight text-[6vw] sm:text-[4vw] leading-none drop-shadow-lg">
            DRAWTROPOLIS
          </h1>
          <p className="text-white/85 text-[1.6vw] sm:text-[1vw] mt-1 drop-shadow">
            A million rooms. One city. Find yours.
          </p>
        </div>

        {/* City Hall panel */}
        {cityHall && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[36%] z-20 flex flex-col items-center gap-2">
            <span className="rounded bg-blue-900/90 border border-blue-300/40 text-white text-[1.4vw] sm:text-[0.9vw] font-semibold px-4 py-1.5 backdrop-blur-sm">
              City Hall
            </span>
            <span className="rounded bg-black/45 border border-white/20 text-white/85 text-[1vw] sm:text-[0.6vw] px-3 py-1 text-center backdrop-blur-sm">
              Open to everyone. Draw here, no claim needed.
            </span>
            <Link
              href={`/building/${cityHall.id}`}
              className="rounded bg-blue-600/95 hover:bg-blue-600 text-white text-[1.2vw] sm:text-[0.75vw] font-semibold px-5 py-2 shadow-lg"
            >
              Enter City Hall
            </Link>
          </div>
        )}

        {/* collection cards */}
        {Array.from(collections.entries()).map(([name, list]) => {
          const layout = COLLECTION_LAYOUT[name];
          if (!layout) return null;
          return (
            <div
              key={name}
              style={{ top: layout.top, left: layout.left, width: layout.width }}
              className={`absolute z-20 rounded border ${layout.badge} backdrop-blur-sm px-2 py-1.5 shadow-lg`}
            >
              <p className="text-white text-[1vw] sm:text-[0.65vw] font-semibold uppercase tracking-wide mb-1">
                {layout.label}
              </p>
              <ul className="space-y-0.5">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/building/${b.id}`}
                      className="block text-white/75 hover:text-white text-[0.85vw] sm:text-[0.55vw] leading-tight truncate"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* footer feature strip */}
        <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm border-t border-white/10 z-20">
          <div className="flex flex-wrap justify-between gap-y-2 px-[2%] py-[1.2%]">
            {FEATURES.map((f) => (
              <div key={f.title} className="min-w-[18%] flex-1">
                <p className="text-white text-[1.1vw] sm:text-[0.7vw] font-semibold">{f.title}</p>
                <p className="text-white/60 text-[0.95vw] sm:text-[0.6vw]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
