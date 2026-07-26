import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoordinate } from "@/lib/types";
import { getDistrictTheme, districtBackground } from "@/lib/districtTheme";

// One floor: central lobby (implied, not rendered yet) + 100 rooms,
// numbered 00-99 only — never three digits (matches the `rooms.room_number
// between 0 and 99` DB constraint). Outer corridor = even 00-98 (50
// rooms), inner corridor = odd 01-99 (50 rooms). Bug fixed 26 July 2026:
// this used to generate length:56/44, which is wrong arithmetic (56+44=100
// but 0,2,...,110 in 56 steps overshoots to 110, and 1,3,...,87 in 44
// steps stops short of 99) — corrected to the actual even/odd split,
// length:50 each, 0-98 and 1-99. Claimed rooms are the ones that actually
// have a row in `rooms` — everything else is just an address waiting to
// be claimed.
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

  const outer = Array.from({ length: 50 }, (_, i) => i * 2); // 0,2,...,98
  const inner = Array.from({ length: 50 }, (_, i) => i * 2 + 1); // 1,3,...,99
  const theme = getDistrictTheme(buildingRow?.collection);

  const roomLink = (roomNumber: number) => {
    const claimed = claimedByNumber.get(roomNumber);
    return (
      <Link
        key={roomNumber}
        href={`/room/${buildingId}/${floorNumber}/${roomNumber}`}
        className={`rounded-lg px-2 py-3 text-center text-sm font-medium border hover:opacity-80 transition-opacity ${
          claimed
            ? "border-[var(--foreground)] bg-[var(--panel)]"
            : "border-[var(--border)] text-[var(--muted)]"
        }`}
        title={
          claimed
            ? `Claimed (${claimed.claim_type}, ${claimed.visibility})`
            : "Unclaimed"
        }
      >
        {String(roomNumber).padStart(2, "0")}
      </Link>
    );
  };

  return (
    <main
      className="min-h-screen p-8 max-w-4xl mx-auto"
      style={districtBackground(buildingRow?.collection)}
    >
      <Link
        href={`/building/${buildingId}`}
        className="text-sm text-[var(--muted)] hover:underline"
      >
        &larr; Back to {buildingRow?.name ?? `Building ${buildingId}`}
      </Link>

      {buildingRow?.collection && (
        <p
          className="text-sm font-semibold tracking-widest uppercase mt-4"
          style={{ color: theme?.accent ?? "var(--muted)" }}
        >
          {buildingRow.collection}
        </p>
      )}
      <h1 className="text-3xl font-bold mt-1 mb-1">
        {buildingRow?.name} — Floor {floorNumber}
      </h1>
      <p className="text-[var(--muted)] mb-8 text-sm">
        Coordinate prefix: {formatCoordinate(buildingId, floorNumber, 0).slice(0, -3)}
        xx
      </p>

      <h2 className="font-semibold text-sm text-[var(--muted)] mb-2 uppercase tracking-wide">
        Outer corridor (even)
      </h2>
      <div className="grid grid-cols-8 sm:grid-cols-14 gap-1.5 mb-8">
        {outer.map(roomLink)}
      </div>

      <h2 className="font-semibold text-sm text-[var(--muted)] mb-2 uppercase tracking-wide">
        Inner corridor (odd)
      </h2>
      <div className="grid grid-cols-8 sm:grid-cols-11 gap-1.5">
        {inner.map(roomLink)}
      </div>
    </main>
  );
}
