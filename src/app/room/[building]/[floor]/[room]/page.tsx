import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoordinate } from "@/lib/types";
import { ClaimRoomButton } from "@/components/ClaimRoomButton";
import { RoomCanvas } from "@/components/RoomCanvasLoader";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ building: string; floor: string; room: string }>;
}) {
  const { building, floor, room } = await params;
  const buildingId = Number(building);
  const floorNumber = Number(floor);
  const roomNumber = Number(room);
  const supabase = await createClient();

  const [{ data: buildingRow }, { data: roomRow }] = await Promise.all([
    supabase
      .from("buildings")
      .select("name, is_special")
      .eq("id", buildingId)
      .single(),
    supabase
      .from("rooms")
      .select("id, host_user_id, visibility, claim_type, contributor_cap")
      .eq("building_id", buildingId)
      .eq("floor_number", floorNumber)
      .eq("room_number", roomNumber)
      .maybeSingle(),
  ]);

  const coordinate = formatCoordinate(buildingId, floorNumber, roomNumber);

  // City Hall (is_special) is advertised on the homepage as "open to
  // everyone, no claim needed" — but this page used to treat it exactly
  // like any other unclaimed room, gating it behind sign-in + claim. That
  // was a real bug: it's the one place a brand-new visitor would try
  // first, and it locked them out instead of letting them straight in.
  // Fixed: special buildings always show the canvas, no room row and no
  // sign-in required.
  const isOpenToEveryone = buildingRow?.is_special === true;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link
        href={`/room/${buildingId}/${floorNumber}`}
        className="text-sm text-neutral-500 hover:underline"
      >
        &larr; Back to floor {floorNumber}
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">
        {buildingRow?.name}, Room {String(roomNumber).padStart(2, "0")}
      </h1>
      <p className="text-neutral-500 mb-6 text-sm">{coordinate}</p>

      {isOpenToEveryone ? (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            Open to everyone · no claim needed
          </p>
          <RoomCanvas />
          <p className="text-xs text-neutral-400 mt-2">
            Drawing is local-only right now — not yet saved or synced. See
            the RoomCanvas component notes.
          </p>
        </>
      ) : !roomRow ? (
        <div className="border border-dashed rounded p-6 text-center">
          <p className="text-neutral-500 mb-4">
            This room hasn&apos;t been claimed yet.
          </p>
          <ClaimRoomButton
            buildingId={buildingId}
            floorNumber={floorNumber}
            roomNumber={roomNumber}
            claimType="standard"
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            {roomRow.visibility === "locked" ? "Locked" : "Open"} ·{" "}
            {roomRow.claim_type} · cap {roomRow.contributor_cap}
          </p>
          <RoomCanvas />
          <p className="text-xs text-neutral-400 mt-2">
            Drawing is local-only right now — not yet saved or synced. See
            the RoomCanvas component notes.
          </p>
        </>
      )}
    </main>
  );
}
