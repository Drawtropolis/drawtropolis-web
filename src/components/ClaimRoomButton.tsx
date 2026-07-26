"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Calls the claim-room edge function directly (see
// claim-room-edge-function.ts). Free-claim and existing-credit paths need
// no payment_intent_id at all — the function figures out entitlement
// server-side. The payment path (collecting a stripe_payment_intent_id
// after a real Checkout) isn't wired into the UI yet — this button only
// covers the free/credit paths for now. Wiring real Checkout is the next
// piece of frontend work once this scaffold is confirmed working.
export function ClaimRoomButton({
  buildingId,
  floorNumber,
  roomNumber,
  claimType,
}: {
  buildingId: number;
  floorNumber: number;
  roomNumber: number;
  claimType: "standard" | "premium";
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Bug fixed 26 July 2026: this whole function used to have no
  // try/catch. Any failure that wasn't a clean HTTP error response from
  // the edge function — a hung getSession() call, a network drop, a
  // malformed response — left status stuck on "loading" forever, with no
  // error shown and no way to retry short of reloading the page. That's
  // exactly what "stuck on Claiming..." was: not proof the claim failed
  // server-side, just proof nothing ever reset the button state. Also
  // added a client-side timeout so a genuinely hung request still
  // recovers instead of spinning indefinitely.
  async function handleClaim() {
    setStatus("loading");
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("error");
        setMessage("Sign in first to claim a room.");
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/claim-room`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            building_id: buildingId,
            floor_number: floorNumber,
            room_number: roomNumber,
            claim_type: claimType,
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setStatus("error");
        setMessage(
          data.payment_required
            ? "This claim needs payment — Checkout isn't wired up yet."
            : data.error ?? `Could not claim this room (${resp.status}).`,
        );
        return;
      }

      setStatus("idle");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out — try again."
          : "Something went wrong claiming this room. Try again.",
      );
    }
  }

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={status === "loading"}
        className="border border-neutral-800 rounded px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
      >
        {status === "loading" ? "Claiming…" : "Claim this room (free, if eligible)"}
      </button>
      {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
    </div>
  );
}
