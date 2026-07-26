import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoordinate } from "@/lib/types";

// One floor: central lobby (implied, not rendered yet) + 100 rooms.
// Outer corridor = even numbers 00-98 (56 rooms), inner corridor = odd
// numbers 01-99 (44 rooms), per WORLD_ARCHITECTURE doctrine. Claimed rooms
// are the ones that actually have a row in `rooms` — everything else is
// just an address waiting to be claimed.
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
    supabase.from("buildings").select("id, name").eq("id", buildingId).single(),
    supabase
      .from("rooms")
      .select("room_number, visibility, claim_type")
      .eq("building_id", buildingId)
      .eq("floor_number", floorNumber),
  ]);

  const claimedByNumber = new Map(
    (claimedRooms ?? []).map((r) => [r.room_number, r]),
  );

  const outer = Array.from({ length: 56 }, (_, i) => i * 2); // 0,2,...,98
  const inner = Array.from({ length: 44 }, (_, i) => i * 2 + 1); // 1,3,...,99

  const roomLink = (roomNumber: number) => {
    const claimed = claimedByNumber.get(roomNumber);
    return (
      <Link
        key={roomNumber}
        href={`/room/${buildingId}/${floorNumber}/${roomNumber}`}
        className={`border rounded px-2 py-2 text-center text-xs hover:bg-neutral-50 ${
          claimed ? "border-neutral-800 font-medium" : "border-neutral-200 text-neutral-400"
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
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link
        href={`/building/${buildingId}`}
        className="text-sm text-neutral-500 hover:underline"
      >
        &larr; Back to {buildingRow?.name ?? `Building ${buildingId}`}
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">
        {buildingRow?.name} — Floor {floorNumber}
      </h1>
      <p className="text-neutral-500 mb-6 text-sm">
        Coordinate prefix: {formatCoordinate(buildingId, floorNumber, 0).slice(0, -3)}
        xx
      </p>

      <h2 className="font-medium text-sm text-neutral-500 mb-2">
        Outer corridor (even)
      </h2>
      <div className="grid grid-cols-8 sm:grid-cols-14 gap-1 mb-6">
        {outer.map(roomLink)}
      </div>

      <h2 className="font-medium text-sm text-neutral-500 mb-2">
        Inner corridor (odd)
      </h2>
      <div className="grid grid-cols-8 sm:grid-cols-11 gap-1">
        {inner.map(roomLink)}
      </div>
    </main>
  );
}
