import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDistrictTheme } from "@/lib/districtTheme";
import { DISTRICT_FACADE, BACK_LINK_RECT, type Rect } from "@/lib/districtFacade";

// Building page redesign — 26 July 2026. Was a plain grid of 100 floor
// links on a flat background. Now uses the district's shared facade
// artwork (same image for all 10 buildings in a district), with the
// building name and all 100 floor numbers rendered as real, code-driven
// overlays — not baked into the art. See districtFacade.ts for why: most
// of the generated facade images have wrong numbers baked in, so the
// overlay has to be opaque (fully covering what's underneath), not just
// an invisible click target like the homepage's card links.
//
// Districts without a facade config yet (Valhalla — no image exists) fall
// straight back to the original plain grid, so this never renders broken.

function pct(r: Rect) {
  return {
    top: `${r.top}%`,
    left: `${r.left}%`,
    width: `${r.width}%`,
    height: `${r.height}%`,
  } as const;
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buildingId = Number(id);
  const supabase = await createClient();

  const { data: building } = await supabase
    .from("buildings")
    .select("id, name, collection, is_special")
    .eq("id", buildingId)
    .single();

  if (!building) notFound();

  const floors = Array.from({ length: 100 }, (_, i) => i + 1);
  const theme = getDistrictTheme(building.collection);
  const facade = building.collection
    ? DISTRICT_FACADE[building.collection]
    : undefined;

  if (!facade) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-[var(--muted)] hover:underline">
          &larr; Back to the city
        </Link>

        {building.collection && (
          <p
            className="text-sm font-semibold tracking-widest uppercase mt-4"
            style={{ color: theme?.accent ?? "var(--muted)" }}
          >
            {building.collection}
          </p>
        )}
        <h1 className="text-4xl font-bold mt-1 mb-1">{building.name}</h1>
        {building.is_special && (
          <p className="text-[var(--muted)] mb-6 text-sm">
            Public landmark — open to everyone, no claim required.
          </p>
        )}
        {building.collection === "Valhalla" && (
          <p className="text-[var(--muted)] mb-6 text-sm">
            Valhalla&apos;s facade art isn&apos;t built yet — plain grid
            until then. Add it to DISTRICT_FACADE in districtFacade.ts.
          </p>
        )}

        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mt-8">
          {floors.map((floor) => (
            <Link
              key={floor}
              href={`/room/${building.id}/${floor}`}
              className="rounded-lg px-2 py-4 text-center text-base font-medium border border-[var(--border)] bg-[var(--panel)] hover:opacity-80 transition-opacity"
            >
              {floor}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const accent = theme?.accent ?? "#f2d78a";

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sized in viewport-height units, not aspect-ratio, so the facade
          reliably fills roughly half the screen regardless of window
          shape — an aspect-[3/2] box scales strictly off the container's
          width, so on a tall/narrow window it ends up looking small
          (Andrew's report: "just a little bit small... filling maybe 20%
          of it") even though it's technically full width. */}
      <div className="relative w-full h-[62vh] sm:h-[72vh] min-h-[420px] overflow-hidden">
        <Image
          src={facade.image}
          alt={facade.alt}
          fill
          priority
          className="object-cover object-center"
        />

        {/* Invisible click target over the "Back" pill already baked into the art */}
        <Link
          href="/"
          style={pct(BACK_LINK_RECT)}
          className="absolute z-30"
          aria-label="Back to the city"
        />

        {/* Building name — real text over the blank plaque slot in the art */}
        <div
          className="absolute z-20 flex items-center justify-center text-center px-2 pointer-events-none"
          style={pct(facade.plaqueRect)}
        >
          <p
            className="font-bold leading-none"
            style={{
              color: accent,
              fontSize: "clamp(13px, 2.4vw, 32px)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "0.04em",
              textShadow: "0 2px 6px rgba(0,0,0,0.75)",
            }}
          >
            {building.name}
          </p>
        </div>

        {/* Floor grid — opaque numbered tiles. Code-rendered so every
            number is guaranteed correct no matter what's baked into the
            art underneath (see districtFacade.ts). */}
        <div
          className="absolute z-20"
          style={{
            ...pct(facade.gridRect),
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gridTemplateRows: "repeat(10, 1fr)",
          }}
        >
          {floors.map((floor) => (
            <Link
              key={floor}
              href={`/room/${building.id}/${floor}`}
              className="flex items-center justify-center m-[1px] rounded-sm font-semibold transition-[filter] hover:brightness-125"
              style={{
                background: "#0a0e14",
                color: accent,
                border: `1px solid ${accent}55`,
                fontSize: "clamp(8px, 1vw, 13px)",
              }}
            >
              {floor}
            </Link>
          ))}
        </div>
      </div>

      {building.is_special && (
        <p className="text-[var(--muted)] text-sm text-center py-3">
          Public landmark — open to everyone, no claim required.
        </p>
      )}
    </main>
  );
}
