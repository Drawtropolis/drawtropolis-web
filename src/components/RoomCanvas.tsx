"use client";

import { useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";

// Placeholder canvas — proves Konva renders and captures strokes client
// side. NOT wired to Supabase Realtime or the strokes table yet: no
// loading of existing strokes on join, no broadcasting to other viewers,
// no persistence on mouse-up. That's the next real chunk of work (the
// "genuine realtime multiplayer canvas" the docs call out as the
// expensive part still to build) — this only proves the rendering layer
// works inside Next.js's app router (Konva needs the DOM, so this
// component must stay client-only; it's never imported into a server
// component directly).
//
// Bug fixed 26 July 2026: the Stage had no fill of its own — it's
// transparent by default — and strokes were drawn in near-black (#111).
// On the site's dark background that meant the canvas was invisible and
// so was anything drawn on it ("no drawing mechanism it's just this
// now"). Fixed with an explicit white Rect behind the strokes, like a
// sheet of paper, so drawings stay visible regardless of whether the
// site itself is in light or dark mode.
const WIDTH = 600;
const HEIGHT = 400;

export function RoomCanvas() {
  const [lines, setLines] = useState<number[][]>([]);
  const [drawing, setDrawing] = useState(false);

  return (
    <div className="inline-block rounded-lg overflow-hidden shadow-lg border border-[var(--border)]">
      <Stage
        width={WIDTH}
        height={HEIGHT}
        onMouseDown={(e) => {
          setDrawing(true);
          const pos = e.target.getStage()?.getPointerPosition();
          if (pos) setLines((prev) => [...prev, [pos.x, pos.y]]);
        }}
        onMouseMove={(e) => {
          if (!drawing) return;
          const pos = e.target.getStage()?.getPointerPosition();
          if (!pos) return;
          setLines((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = [...last, pos.x, pos.y];
            return next;
          });
        }}
        onMouseUp={() => setDrawing(false)}
      >
        <Layer>
          <Rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#ffffff" />
          {lines.map((points, i) => (
            <Line
              key={i}
              points={points}
              stroke="#111"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
      {lines.length > 0 && (
        <button
          onClick={() => setLines([])}
          className="w-full text-xs py-1.5 bg-[var(--panel)] text-[var(--muted)] hover:opacity-80"
        >
          Clear
        </button>
      )}
    </div>
  );
}
