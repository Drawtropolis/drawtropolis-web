"use client";

import { useState } from "react";
import { Stage, Layer, Line } from "react-konva";

// Placeholder canvas — proves Konva renders and captures strokes client
// side. NOT wired to Supabase Realtime or the strokes table yet: no
// loading of existing strokes on join, no broadcasting to other viewers,
// no persistence on mouse-up. That's the next real chunk of work (the
// "genuine realtime multiplayer canvas" the docs call out as the
// expensive part still to build) — this only proves the rendering layer
// works inside Next.js's app router (Konva needs the DOM, so this
// component must stay client-only; it's never imported into a server
// component directly).
export function RoomCanvas() {
  const [lines, setLines] = useState<number[][]>([]);
  const [drawing, setDrawing] = useState(false);

  return (
    <div className="border rounded">
      <Stage
        width={600}
        height={400}
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
    </div>
  );
}
