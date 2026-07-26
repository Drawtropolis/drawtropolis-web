"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false must live inside a Client Component in the
// app router — it can't be called directly from the server component that
// renders the room page. This wrapper exists purely to satisfy that rule.
export const RoomCanvas = dynamic(
  () => import("@/components/RoomCanvas").then((m) => m.RoomCanvas),
  { ssr: false },
);
