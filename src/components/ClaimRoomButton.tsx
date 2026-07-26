"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Calls the claim-room edge function directly (see
// claim-room-edge-function.ts). Free-claim and existing-credit paths need
// no payment_intent_id at all — the function figures out entitlement
// server-side.
//
// Payment path added 26 July 2026 (was previously a dead end: "Checkout
// isn't wired up yet"). Flow is two edge functions:
//   1. create-checkout-session — builds a Stripe Checkout Session for
//      this exact room and redirects the browser to Stripe's hosted page.
//   2. resolve-checkout-session — runs automatically when Stripe redirects
//      back here with ?checkout_session_id=..., verifies the payment
//      server-side, and forwards to claim-room's existing payment path.
// No webhook needed — verification happens synchronously when the user
// lands back on this page, which is simpler for a project this size and
// matches how claim-room already verifies payment_intent_id directly.
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
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "needs_payment" | "confirming"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // If Stripe just redirected back here with a session id, resolve it
  // automatically — the user shouldn't have to click anything twice.
  useEffect(() => {
    const checkoutSessionId = searchParams.get("checkout_session_id");
    const cancelled = searchParams.get("checkout_cancelled");

    if (cancelled) {
      setStatus("idle");
      setMessage("Payment cancelled — no charge was made.");
      router.replace(pathname);
      return;
    }

    if (!checkoutSessionId) return;

    (async () => {
      setStatus("confirming");
      setMessage("Confirming your payment…");
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setStatus("error");
          setMessage("Sign in first to complete this claim.");
          return;
        }

        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resolve-checkout-session`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
          },
        );
        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          setStatus("error");
          setMessage(data.error ?? "Could not confirm payment.");
          return;
        }

        setStatus("idle");
        router.replace(pathname);
        router.refresh();
      } catch {
        setStatus("error");
        setMessage("Something went wrong confirming payment. Contact support if you were charged.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        if (data.payment_required) {
          setStatus("needs_payment");
          setMessage(null);
          return;
        }
        setStatus("error");
        setMessage(data.error ?? `Could not claim this room (${resp.status}).`);
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

  async function handlePay() {
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

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
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
        },
      );
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.url) {
        setStatus("error");
        setMessage(data.error ?? "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setStatus("error");
      setMessage("Something went wrong starting checkout. Try again.");
    }
  }

  if (status === "needs_payment") {
    return (
      <div>
        <p className="text-sm text-[var(--muted)] mb-3">
          This room isn&apos;t free — you&apos;re out of eligible claims.
        </p>
        <button
          onClick={handlePay}
          className="rounded px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white"
        >
          Pay &amp; claim this room
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={status === "loading" || status === "confirming"}
        className="border border-[var(--border)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--panel)] disabled:opacity-50"
      >
        {status === "confirming"
          ? "Confirming payment…"
          : status === "loading"
            ? "Claiming…"
            : "Claim this room (free, if eligible)"}
      </button>
      {message && (
        <p
          className={`text-sm mt-2 ${
            message.startsWith("Payment cancelled") ? "text-[var(--muted)]" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
