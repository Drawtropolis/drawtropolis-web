"use client";

// Claimed-room view — split out of page.tsx 26 July 2026.
//
// Two bugs fixed at once, both flagged the same night as the plaque
// redesign went live:
//   1. The canvas rendered immediately under the brass plaque, inside the
//      420px-wide door card — RoomCanvas is 900px wide, so it visibly
//      bled out past the card's rounded border the moment a room was
//      claimed. There was no "enter" step at all.
//   2. Andrew wants claiming a room to feel like walking through a door,
//      not just scrolling past a plaque: the plaque itself is now the
//      only way in. Click it, and the view swaps to a wide layout —
//      "same size and settings as City Hall" (Andrew's words) — matching
//      the isOpenToEveryone branch in page.tsx exactly, since that's the
//      one place on the site that already does "canvas breaks out of the
//      420px door width" correctly.
//
// This has to be a Client Component (needs useState for entered/not), so
// the whole claimed-room body moved here rather than trying to toggle
// state from inside the async Server Component in page.tsx.
import { useState } from "react";
import Link from "next/link";
import { RoomCanvas } from "@/components/RoomCanvasLoader";

export function ClaimedRoomView({
  backHref,
  collection,
  accentColor,
  buildingName,
  floorNumber,
  coordinate,
  claimantName,
  claimedAtLabel,
  visibilityLabel,
  claimType,
  contributorCap,
}: {
  backHref: string;
  collection: string | null | undefined;
  accentColor: string | undefined;
  buildingName: string | undefined;
  floorNumber: number;
  coordinate: string;
  claimantName: string;
  claimedAtLabel: string | null;
  visibilityLabel: string;
  claimType: string;
  contributorCap: number;
}) {
  const [entered, setEntered] = useState(false);

  if (entered) {
    // Same size and settings as City Hall: wide, centred header, canvas
    // breaking out of the 420px door width entirely, not boxed in a card.
    return (
      <>
        <div className="w-full max-w-[420px]">
          <Link
            href={backHref}
            className="text-sm text-[var(--muted)] hover:underline"
          >
            &larr; Back to floor {floorNumber}
          </Link>
        </div>

        <div className="text-center mt-6">
          {collection && (
            <p
              className="text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ color: accentColor ?? "var(--muted)" }}
            >
              {collection}
            </p>
          )}
          <h1 className="text-4xl font-bold mt-2 leading-tight">
            {buildingName}
          </h1>
          <p className="text-base text-[var(--foreground)] opacity-70 mt-2">
            Floor {floorNumber}
          </p>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] font-mono mt-1">
            {coordinate}
          </p>
          <p className="text-sm text-[var(--muted)] mt-3">
            Claimed by {claimantName} · {visibilityLabel} · {claimType} · cap{" "}
            {contributorCap}
          </p>
        </div>

        <div className="mt-8">
          <RoomCanvas />
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Drawing is local-only right now — not yet saved or synced. See the
          RoomCanvas component notes.
        </p>
      </>
    );
  }

  // Not entered yet: the familiar narrow door + brass plaque, exactly as
  // before visually — except the plaque is now the button that opens the
  // room. No canvas exists anywhere in the DOM until it's clicked, so
  // there's nothing left to bleed out of the card.
  return (
    <div className="w-full max-w-[420px]">
      <Link
        href={backHref}
        className="text-sm text-[var(--muted)] hover:underline"
      >
        &larr; Back to floor {floorNumber}
      </Link>

      <div
        className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] px-8 pt-10 pb-9 text-center shadow-2xl"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px -20px rgba(0,0,0,0.5)",
        }}
      >
        {collection && (
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ color: accentColor ?? "var(--muted)" }}
          >
            {collection}
          </p>
        )}

        <h1 className="text-4xl font-bold mt-2 leading-tight">
          {buildingName}
        </h1>

        <p className="text-base text-[var(--foreground)] opacity-70 mt-2">
          Floor {floorNumber}
        </p>

        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] font-mono mt-1">
          {coordinate}
        </p>

        <button
          type="button"
          onClick={() => setEntered(true)}
          className="w-full mt-10 rounded-md px-6 py-6 text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none"
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
          {claimedAtLabel && (
            <p
              className="text-xs mt-2 tracking-wide"
              style={{ color: "#4a3a16", opacity: 0.85 }}
            >
              {claimedAtLabel}
            </p>
          )}
          <p
            className="text-[11px] mt-3 tracking-wide"
            style={{ color: "#4a3a16", opacity: 0.6 }}
          >
            Click to enter &rarr;
          </p>
        </button>
      </div>
    </div>
  );
}
