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
// HTML positioned on top, same percentage-rect technique as before, but
// now nothing has to match baked pixels, so nothing can drift out of sync
// with the art.
//
// Rects below are carried over from the old COLLECTION_LAYOUT/CITY_HALL_RECT
// in page.tsx — the new blank background is the same underlying composition
// (Andrew asked for identical buildings/positions, just with the text
// removed), so the same percentages should still land on the right building.
// Nudge here if any label drifts off its district once it's live.

type Rect = { top: number; left: number; width: number; height: number };

const DISTRICT_LABEL_RECT: Record<string, Rect> = {
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

const CITY_HALL_RECT: Rect = { top: 37.1, left: 41.8, width: 16.8, height: 21 };

function pct(r: Rect) {
  return {
    top: `${r.top}%`,
    left: `${r.left}%`,
    width: `${r.width}%`,
    height: `${r.height}%`,
  } as const;
}

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
        // Click anywhere outside a district's own button/card closes it.
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
          className="absolute z-20 flex flex-col items-center justify-end pb-3 pointer-events-none"
          style={pct(CITY_HALL_RECT)}
        >
          <Link
            href={`/building/${cityHall.id}`}
            className="pointer-events-auto rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-1.5 sm:py-2 shadow-lg transition-colors"
          >
            Enter City Hall
          </Link>
        </div>
      )}

      {/* District labels — pills, not circles (reverted per feedback). Hover
          reveals "Explore this district"; click scatters all 10 building
          names as their own small pills in a ring around the district
          pill, rather than one dropdown list. Positions are computed (even
          angle spacing around a fixed radius), not hand-placed per
          building — that's the only way this works for 100 buildings
          without positioning each one by hand. Pills for districts right at
          the map edge (Pharaoh, Oasis) can clip against the container edge
          since the ring is centred on the district regardless of how close
          it sits to the border — flag if that looks bad live and the
          radius/edge districts can get a smaller ring.
          The open district still gets bumped to z-40 so its ring renders
          above every other district's pill. */}
      {Array.from(collections.entries()).map(([name, list]) => {
        const rect = DISTRICT_LABEL_RECT[name];
        if (!rect || list.length === 0) return null;
        const isOpen = openDistrict === name;
        const theme = getDistrictTheme(name);
        const ringRadius = 90;

        return (
          <div
            key={name}
            className="absolute flex flex-col items-center justify-end pb-2 pointer-events-none"
            style={{ ...pct(rect), zIndex: isOpen ? 40 : 20 }}
          >
            <div className="group relative pointer-events-auto">
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
                  Explore this district
                </span>
              )}

              {isOpen && (
                <div className="absolute left-1/2 top-1/2 w-0 h-0">
                  {list.map((b, i) => {
                    const angle = (i / list.length) * 2 * Math.PI - Math.PI / 2;
                    const x = Math.round(Math.cos(angle) * ringRadius);
                    const y = Math.round(Math.sin(angle) * ringRadius);
                    return (
                      <Link
                        key={b.id}
                        href={`/building/${b.id}`}
                        className="absolute rounded-full border bg-[#0a1220]/95 text-white text-[10px] sm:text-[11px] font-medium px-2.5 py-1 shadow-lg hover:bg-black whitespace-nowrap transition-colors"
                        style={{
                          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                          borderColor: theme?.accent ?? "rgba(255,255,255,0.3)",
                        }}
                      >
                        {b.name}
                      </Link>
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
