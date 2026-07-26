"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Building } from "@/lib/types";
import { getDistrictTheme } from "@/lib/districtTheme";

// City map — 26 July 2026. Replaces the old "one mega image with everything
// baked in + invisible overlay links" homepage. That approach kept breaking
// in small ways (sign-in stuck wherever the art happened to paint a button,
// search bar fighting the image underneath it, card positions drifting) for
// the same root reason every other baked-text problem this session had:
// text and interactive elements shouldn't live inside static artwork.
//
// New approach: the background image (`/city-map.png`) has no text or UI
// baked in at all — just the illustrated city. Every interactive piece
// (district name, hover prompt, building list, City Hall button) is real
// HTML positioned on top, so nothing has to match baked pixels.
//
// Second pass (same day): district labels moved from a "box + anchor pill
// at the bottom" layout to a plain centre point per district. Andrew's
// direction — labels can sit directly over the artwork, right on the main
// monument, since the ring of building-name pills bursts outward from
// wherever the label sits anyway. A bounding box was never necessary; a
// point is simpler and makes per-district nudges (this session's other big
// ask — move Crown right onto the castle door, Liberty under the statue,
// Empire off the left edge onto the Colosseum, etc.) a one-line change.

type Point = { top: number; left: number };

const DISTRICT_LABEL_CENTER: Record<string, Point> = {
  Crown: { top: 40, left: 11 },
  Olympus: { top: 44, left: 28 },
  Liberty: { top: 58, left: 17 },
  Sakura: { top: 40, left: 70 },
  Pharaoh: { top: 34, left: 88 },
  Valhalla: { top: 52, left: 88 },
  Empire: { top: 78, left: 13 },
  Dynasty: { top: 85, left: 40 },
  Renaissance: { top: 84, left: 60 },
  Oasis: { top: 80, left: 88 },
};

const CITY_HALL_CENTER: Point = { top: 58, left: 50 };

export function CityMap({
  buildings,
  cityHall,
}: {
  buildings: Building[];
  cityHall: Building | null;
}) {
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);

  const collections = new Map<string, Building[]>();
  for (const b of buildings) {
    if (b.is_special) continue;
    const key = b.collection ?? "Uncategorised";
    if (!collections.has(key)) collections.set(key, []);
    collections.get(key)!.push(b);
  }

  return (
    <div
      className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl border border-[var(--border)]"
      onClick={(e) => {
        // Click anywhere outside a district's own button/ring closes it.
        if (e.target === e.currentTarget) setOpenDistrict(null);
      }}
    >
      <Image
        src="/city-map.png"
        alt="Drawtropolis — an illustrated city of ten districts around a central City Hall"
        fill
        priority
        className="object-cover object-center"
      />

      {/* City Hall — always open to everyone, no hover-gate like the districts */}
      {cityHall && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${CITY_HALL_CENTER.top}%`, left: `${CITY_HALL_CENTER.left}%` }}
        >
          <Link
            href={`/building/${cityHall.id}`}
            className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-1.5 sm:py-2 shadow-lg transition-colors whitespace-nowrap"
          >
            Enter City Hall
          </Link>
        </div>
      )}

      {/* District labels — pills, centred exactly on a point over the
          monument. Click bursts all 10 building names outward as their own
          small pills in a ring, evenly spaced by angle (not hand-placed
          per building — the only way this scales to 100 buildings without
          positioning each one). Ring radius bumped up from the first pass
          so pills don't crowd each other at the top of the circle.
          The open district gets bumped to z-40 so its ring renders above
          every other district's pill regardless of DOM order. */}
      {Array.from(collections.entries()).map(([name, list]) => {
        const point = DISTRICT_LABEL_CENTER[name];
        if (!point || list.length === 0) return null;
        const isOpen = openDistrict === name;
        const theme = getDistrictTheme(name);
        const ringRadius = 120;
        // Buildings are numbered 0-99 globally, ten per district in a
        // contiguous block (Crown 00-09, Olympus 10-19, ... Oasis 90-99).
        // The district's own number is just that block's tens digit —
        // derived from the first building's id so it's never hand-typed
        // and can't drift out of sync with the real data.
        const districtNumber = Math.floor(list[0].id / 10);

        return (
          <div
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${point.top}%`,
              left: `${point.left}%`,
              zIndex: isOpen ? 40 : 20,
            }}
          >
            <div className="group relative">
              <button
                type="button"
                onClick={() => setOpenDistrict(isOpen ? null : name)}
                className="rounded-full bg-black/65 group-hover:bg-black/85 group-hover:scale-105 text-white text-[11px] sm:text-sm font-bold uppercase tracking-wide px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg transition-all backdrop-blur-sm border whitespace-nowrap"
                style={{ borderColor: theme?.accent ?? "rgba(255,255,255,0.3)" }}
              >
                {name}
              </button>

              {!isOpen && (
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded bg-black/80 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore district {districtNumber}
                </span>
              )}

              {isOpen && (
                <div className="absolute left-1/2 top-1/2 w-0 h-0">
                  {list.map((b, i) => {
                    const angle = (i / list.length) * 2 * Math.PI - Math.PI / 2;
                    const x = Math.round(Math.cos(angle) * ringRadius);
                    const y = Math.round(Math.sin(angle) * ringRadius);
                    const buildingNumber = String(b.id).padStart(2, "0");
                    return (
                      <div
                        key={b.id}
                        className="group/bldg absolute"
                        style={{
                          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                        }}
                      >
                        <Link
                          href={`/building/${b.id}`}
                          className="block rounded-full border bg-[#0a1220]/95 text-white text-[10px] sm:text-[11px] font-medium px-2.5 py-1 shadow-lg hover:bg-black whitespace-nowrap transition-colors"
                          style={{ borderColor: theme?.accent ?? "rgba(255,255,255,0.3)" }}
                        >
                          {b.name}
                        </Link>
                        {/* Numeric guide — the building name alone doesn't
                            let someone navigate straight to "building 45".
                            Hovering a name pill reveals its real number so
                            the ring works as coordinate navigation, not
                            just a name index. */}
                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded bg-black/85 text-white text-[10px] px-2 py-1 opacity-0 group-hover/bldg:opacity-100 transition-opacity z-10">
                          Explore building {buildingNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
