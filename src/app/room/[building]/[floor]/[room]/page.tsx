import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatCoordinate } from "@/lib/types";
import { ClaimRoomButton } from "@/components/ClaimRoomButton";
import { RoomCanvas } from "@/components/RoomCanvasLoader";
import { getDistrictTheme, districtBackground } from "@/lib/districtTheme";

// Door/plaque redesign — 26 July 2026. The room page used to be a plain
// left-aligned settings stack (district label, "{building}, Room {n}" as
// one h1, coordinate, then a status line). It read like an admin panel,
// not a place. Rebuilt as a door: a portrait panel with district band,
// building name, floor label and coordinate stacked and centred, all
// deliberately quiet, so the plaque near the bottom — the one place doing
// visual work — is what people actually look at. Real door nameplates
// don't shift material with what's behind them, so the plaque is exempt
// from districtTheme entirely: dull pewter when unclaimed, polished brass
// once claimed. That material change *is* the claimed/unclaimed signal,
// on top of the copy change.
//
// New this pass: the claimed plaque shows who claimed the room and when.
// That required joining rooms.host_user_id to profiles.username — which
// didn't exist before, and which RLS silently blocked (profiles are only
// publicly readable when is_public = true, and every profile in the
// database currently has is_public = false / username = null). Added a
// narrow `profiles_public_read_room_hosts` policy so a profile's username
// is public exactly when that profile hosts a room — a claim is already a
// public fact the room page itself announces, so this doesn't expose
// anything the page wasn't already implying. See handoff notes: usernames
// still aren't collected anywhere, so real claims will show the "A
// builder" fallback until that's built — separate backlog item, not part
// of this pass.
function formatClaimedAt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
      .select("name, is_special, collection")
      .eq("id", buildingId)
      .single(),
    supabase
      .from("rooms")
      .select(
        "id, host_user_id, visibility, claim_type, contributor_cap, created_at, host:profiles!rooms_host_user_id_fkey(username)",
      )
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
  const theme = getDistrictTheme(buildingRow?.collection);

  // Supabase embeds a to-one relationship as an object, but returns an
  // array if it can't resolve cardinality confidently — handle both so a
  // schema-cache hiccup doesn't crash the page.
  const hostProfile = Array.isArray(roomRow?.host)
    ? roomRow.host[0]
    : roomRow?.host;
  const claimantName = hostProfile?.username?.trim() || "A builder";

  // City Hall's "open to everyone" room used to render inside the same
  // 420px-wide door card as every claimed/unclaimed room — so walking in
  // just showed a small canvas squeezed into a doorway-shaped box, and it
  // never actually felt like you'd gone anywhere ("displaying over the
  // room entrance and you're not going inside it"). The door card exists
  // to dramatise claiming a room; City Hall has nothing to claim, so it
  // gets a plain header instead and the canvas is the main event,
  // breaking out of the narrow door width entirely rather than being
  // boxed inside it. Claimed/unclaimed rooms are untouched below.
  if (isOpenToEveryone) {
    return (
      <main
        className="min-h-screen p-8 flex flex-col items-center"
        style={districtBackground(buildingRow?.collection)}
      >
        <div className="w-full max-w-[420px]">
          <Link
            href={`/room/${buildingId}/${floorNumber}`}
            className="text-sm text-[var(--muted)] hover:underline"
          >
            &larr; Back to floor {floorNumber}
          </Link>
        </div>

        <div className="text-center mt-6">
          {buildingRow?.collection && (
            <p
              className="text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ color: theme?.accent ?? "var(--muted)" }}
            >
              {buildingRow.collection}
            </p>
          )}
          <h1 className="text-4xl font-bold mt-2 leading-tight">
            {buildingRow?.name}
          </h1>
          <p className="text-base text-[var(--foreground)] opacity-70 mt-2">
            Floor {floorNumber}
          </p>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] font-mono mt-1">
            {coordinate}
          </p>
          <p className="text-sm text-[var(--muted)] mt-3">
            Open to everyone · no claim needed
          </p>
        </div>

        <div className="mt-8">
          <RoomCanvas />
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Drawing is local-only right now — not yet saved or synced. See the
          RoomCanvas component notes.
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-8 flex flex-col items-center"
      style={districtBackground(buildingRow?.collection)}
    >
      <div className="w-full max-w-[420px]">
        <Link
          href={`/room/${buildingId}/${floorNumber}`}
          className="text-sm text-[var(--muted)] hover:underline"
        >
          &larr; Back to floor {floorNumber}
        </Link>

        {/* The door */}
        <div
          className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] px-8 pt-10 pb-9 text-center shadow-2xl"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px -20px rgba(0,0,0,0.5)",
          }}
        >
          {buildingRow?.collection && (
            <p
              className="text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ color: theme?.accent ?? "var(--muted)" }}
            >
              {buildingRow.collection}
            </p>
          )}

          <h1 className="text-4xl font-bold mt-2 leading-tight">
            {buildingRow?.name}
          </h1>

          <p className="text-base text-[var(--foreground)] opacity-70 mt-2">
            Floor {floorNumber}
          </p>

          <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] font-mono mt-1">
            {coordinate}
          </p>

          {!roomRow ? (
            // Unclaimed plaque — dull pewter. Deliberately theme-independent:
            // a plaque doesn't take on the district's colour, only its own
            // finish. Local CSS-variable overrides give ClaimRoomButton
            // (which is styled with --border/--panel and relies on inherited
            // text colour) a fixed light-on-dark palette so it reads clearly
            // against pewter regardless of the site's light/dark mode.
            <div
              className="mt-10 rounded-md px-6 py-7"
              style={{
                background:
                  "linear-gradient(180deg, #4a5058 0%, #363b42 55%, #2b2f35 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 5px rgba(0,0,0,0.35), 0 6px 14px rgba(0,0,0,0.3)",
                border: "1px solid #22262b",
                // Scoped overrides for ClaimRoomButton's own var(--*) classes.
                ["--foreground" as string]: "#f2f2f2",
                ["--panel" as string]: "#1c2129",
                ["--border" as string]: "rgba(255,255,255,0.35)",
                ["--muted" as string]: "#c7cdd6",
              }}
            >
              <p className="text-sm text-[#e5e8ec] mb-4">
                This room hasn&apos;t been claimed yet.
              </p>
              <Suspense fallback={null}>
                <ClaimRoomButton
                  buildingId={buildingId}
                  floorNumber={floorNumber}
                  roomNumber={roomNumber}
                  claimType="standard"
                />
              </Suspense>
            </div>
          ) : (
            <>
              {/* Claimed plaque — polished brass, engraved-plate styling. */}
              <div
                className="mt-10 rounded-md px-6 py-6"
                style={{
                  background:
                    "linear-gradient(180deg, #ecd9a0 0%, #c9a24c 45%, #a9813a 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 5px rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.35)",
                  border: "1px solid #8a6b30",
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.25em]"
                  style={{ color: "#4a3a16", opacity: 0.75 }}
                >
                  Claimed by
                </p>
                <p
                  className="text-2xl font-semibold mt-1"
                  style={{
                    color: "#2b2008",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    textShadow: "0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  {claimantName}
                </p>
                {roomRow.created_at && (
                  <p
                    className="text-xs mt-2 tracking-wide"
                    style={{ color: "#4a3a16", opacity: 0.85 }}
                  >
                    {formatClaimedAt(roomRow.created_at)}
                  </p>
                )}
              </div>

              <p className="text-sm text-[var(--muted)] mt-5 mb-4">
                {roomRow.visibility === "locked" ? "Locked" : "Open"} ·{" "}
                {roomRow.claim_type} · cap {roomRow.contributor_cap}
              </p>
              <RoomCanvas />
              <p className="text-xs text-[var(--muted)] mt-2">
                Drawing is local-only right now — not yet saved or synced.
                See the RoomCanvas component notes.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
