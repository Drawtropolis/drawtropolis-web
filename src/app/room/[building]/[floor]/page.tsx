import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoordinate } from "@/lib/types";
import { getDistrictTheme, districtBackground } from "@/lib/districtTheme";

// One floor: central lobby (implied, not rendered yet) + 100 rooms,
// numbered 00-99, laid out as a single 10x10 grid in sequential order.
// Claimed rooms are the ones that actually have a row in `rooms` —
// everything else is just an address waiting to be claimed.
//
// Redesigned 26 July 2026 — the old version split the grid into an
// "outer corridor (even)" / "inner corridor (odd)" pair, which was a
// layout idea that never earned its keep: it made the numbering harder
// to scan (doors 00-98 skip a beat, then 01-99 restart underneath) and
// added two unlabelled-feeling section headers above a page that was
// already fighting for visual hierarchy. Straight 00-99 in one 10x10
// grid is simpler to scan and matches how the building/floor plaques
// already present numbers elsewhere in the app.
//
// The header block above the grid was also flattened from a cramped
// "DISTRICT / Name — Floor N / coordinate" stack into four clearly
// separated lines — district (large, coloured per-district), building
// name, floor number, coordinate prefix (small step up from the door
// grid's own type size) — so the hierarchy reads at a glance instead of
// running together.
export default async function FloorPage({
  params,
}: {
  params: Promise<{ building: string; floor: string }>;
}) {
  const { building, floor } = await params;
  const buildingId = Number(building);
  const floorNumber = Number(floor);
  const supabase = await createClient();

  const [{ data: buildingRow }, { data: claimedRooms }] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, name, collection")
      .eq("id", buildingId)
      .single(),
    supabase
      .from("rooms")
      .select("room_number, visibility, claim_type")
      .eq("building_id", buildingId)
      .eq("floor_number", floorNumber),
  ]);

  const claimedByNumber = new Map(
    (claimedRooms ?? []).map((r) => [r.room_number, r]),
  );

  const rooms = Array.from({ length: 100 }, (_, i) => i); // 0..99, in order
  const theme = getDistrictTheme(buildingRow?.collection);

  const roomLink = (roomNumber: number) => {
    const claimed = claimedByNumber.get(roomNumber);
    return (
      <Link
        key={roomNumber}
        href={`/room/${buildingId}/${floorNumber}/${roomNumber}`}
        className={`aspect-square flex items-center justify-center rounded-lg text-base sm:text-lg lg:text-xl font-medium border transition-all hover:scale-105 hover:opacity-90 ${
          claimed
            ? "border-[var(--foreground)] bg-[var(--panel)] shadow-sm"
            : "border-[var(--border)] text-[var(--muted)]"
        }`}
        title={
          claimed
            ? `Claimed (${claimed.claim_type}, ${claimed.visibility})`
            : "Unclaimed"
        }
        style={claimed ? { borderColor: theme?.accent ?? "var(--foreground)" } : undefined}
      >
        {String(roomNumber).padStart(2, "0")}
      </Link>
    );
  };

  return (
    <main
      className="min-h-screen p-8 sm:p-12 max-w-5xl mx-auto"
      style={districtBackground(buildingRow?.collection)}
    >
      <Link
        href={`/building/${buildingId}`}
        className="text-sm text-[var(--muted)] hover:underline"
      >
        &larr; Back to {buildingRow?.name ?? `Building ${buildingId}`}
      </Link>

      <div className="mt-5 mb-10">
        {buildingRow?.collection && (
          <p
            className="text-4xl sm:text-5xl font-extrabold tracking-tight uppercase"
            style={{ color: theme?.accent ?? "var(--foreground)" }}
          >
            {buildingRow.collection}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2">
          {buildingRow?.name ?? `Building ${buildingId}`}
        </h1>
        <p className="text-lg sm:text-xl text-[var(--muted)] mt-1">
          Floor {floorNumber}
        </p>
        <p className="text-base sm:text-lg text-[var(--muted)] mt-2">
          Coordinate prefix: {formatCoordinate(buildingId, floorNumber, 0).slice(0, -3)}
          xx
        </p>
      </div>

      <div className="grid grid-cols-10 gap-2 sm:gap-3">
        {rooms.map(roomLink)}
      </div>
    </main>
  );
}
