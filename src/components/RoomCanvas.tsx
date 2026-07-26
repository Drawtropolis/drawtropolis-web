"use client";

import { useRef, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import type Konva from "konva";

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
//
// Doubled in size (26 July, same day) — 600x400 read as a small sticky
// note next to the "100 floors, 1000 rooms, each floor is your canvas"
// framing everywhere else on the site; 1200x800 actually reads as a
// canvas. Zoom added at the same time since a bigger drawing surface with
// no way to zoom in just means more empty white space on screen, not
// more room to actually draw detail — mouse wheel / trackpad pinch zooms
// around the pointer, and the +/-/Reset buttons cover the case where
// scroll-to-zoom isn't obvious or the input device doesn't support it.
//
// Fixed same day: at zoom levels below 1, the 1200x800 paper shrinks
// smaller than the 900x600 viewport, exposing the viewport's own
// background around the edges. That background used to be dark
// (#0a0e14) — visible and wrong ("fully zoomed out exposes black around
// the edges. I want fully zoomed out to be fully white"). Switched to
// white so the exposed edge always matches the paper. Max zoom raised
// 400% -> 800% per follow-up request. Trackpad gestures also split out:
// browsers report a two-finger pinch as a wheel event with ctrlKey set
// (regardless of whether an actual modifier key is held), and a plain
// two-finger scroll as a wheel event without it — so ctrlKey now decides
// zoom vs. pan instead of every wheel event being treated as zoom.
//
// Canvas enlarged again + bounded same day: once panning worked, the
// paper had no visible edge and the surrounding viewport was the same
// white as the paper itself — panning far enough in any direction just
// looked like more blank paper forever, with no way to find a corner
// ("I kept drawing a line to the top left corner and I never got to the
// edge... does it go on forever?"). Two fixes: (1) the paper now has a
// visible stroke around it, so its actual boundary is always visible
// regardless of zoom or background colour; (2) panning is clamped
// (`clampStagePos`) so the paper can never be dragged out of view
// entirely — it stops at its own edge, like a bounded map, instead of
// scrolling into empty space indefinitely. Base canvas size tripled
// (1200x800 -> 3600x2400, same 3:2 ratio as the viewport) at the same
// time — Andrew wants a large, walkable canvas with real corners to
// find, not just a slightly bigger sticky note, and the combination of
// this size with 800% max zoom means you can zoom deep into any corner
// and still draw fine detail there.
const BASE_WIDTH = 3600;
const BASE_HEIGHT = 2400;
// MIN_ZOOM lowered 0.5 -> 0.25 same day: at 50% the viewport only ever
// showed one quarter of the 3600x2400 canvas (900x600 viewport / 0.5 =
// 1800x1200 of canvas visible), so panning around at that zoom felt like
// there were "four full squares" and no way to see them all at once.
// 25% is the exact fit — 3600*0.25 = 900 and 2400*0.25 = 600, matching
// the viewport exactly — so this is the natural "whole canvas visible"
// zoom level, not an arbitrary extra step. Nothing else changed: canvas
// size, panning clamp, and max zoom are untouched.
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 600;

// Clamp panning so the paper's own edge is the farthest you can scroll —
// once BASE_WIDTH/HEIGHT * zoom exceeds the viewport (true across the
// whole zoom range given how much larger the canvas is than the
// viewport), 0 is the left/top-most valid position and
// VIEWPORT - BASE*zoom is the right/bottom-most.
function clampStagePos(
  pos: { x: number; y: number },
  zoomLevel: number,
): { x: number; y: number } {
  const minX = VIEWPORT_WIDTH - BASE_WIDTH * zoomLevel;
  const minY = VIEWPORT_HEIGHT - BASE_HEIGHT * zoomLevel;
  return {
    x: Math.min(0, Math.max(minX, pos.x)),
    y: Math.min(0, Math.max(minY, pos.y)),
  };
}

export function RoomCanvas() {
  const [lines, setLines] = useState<number[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);

  function clampZoom(z: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  }

  function zoomAtPoint(newZoom: number, pointer: { x: number; y: number }) {
    const stage = stageRef.current;
    if (!stage) {
      setZoom(newZoom);
      return;
    }
    const oldZoom = stage.scaleX();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldZoom,
      y: (pointer.y - stage.y()) / oldZoom,
    };
    setZoom(newZoom);
    setStagePos(
      clampStagePos(
        {
          x: pointer.x - mousePointTo.x * newZoom,
          y: pointer.y - mousePointTo.y * newZoom,
        },
        newZoom,
      ),
    );
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey) {
      // Trackpad pinch (browsers report pinch-to-zoom as a wheel event
      // with ctrlKey set, whether or not a real modifier key is down) —
      // zoom in/out anchored under the pointer, same as before.
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      zoomAtPoint(clampZoom(zoom + direction * 0.15), pointer);
    } else {
      // Plain two-finger trackpad scroll — pan the canvas instead of
      // zooming it, in whichever direction the fingers move. Clamped so
      // panning stops at the paper's own edge rather than continuing
      // into empty viewport space forever.
      setStagePos((prev) =>
        clampStagePos(
          { x: prev.x - e.evt.deltaX, y: prev.y - e.evt.deltaY },
          zoom,
        ),
      );
    }
  }

  function stepZoom(delta: number) {
    zoomAtPoint(clampZoom(zoom + delta), {
      x: VIEWPORT_WIDTH / 2,
      y: VIEWPORT_HEIGHT / 2,
    });
  }

  function resetView() {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  }

  // Convert a pointer position on the (possibly zoomed/panned) stage back
  // into the untransformed drawing coordinate space, so strokes stay
  // pinned to the paper under the cursor instead of drifting once zoomed.
  function toCanvasPoint(stage: Konva.Stage) {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
  }

  return (
    <div className="inline-block rounded-lg overflow-hidden shadow-lg border border-[var(--border)]">
      <div
        style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
        className="max-w-full overflow-hidden bg-white"
      >
        <Stage
          ref={stageRef}
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePos.x}
          y={stagePos.y}
          onWheel={handleWheel}
          onMouseDown={(e) => {
            setDrawing(true);
            const point = toCanvasPoint(e.target.getStage()!);
            if (point) setLines((prev) => [...prev, [point.x, point.y]]);
          }}
          onMouseMove={(e) => {
            if (!drawing) return;
            const point = toCanvasPoint(e.target.getStage()!);
            if (!point) return;
            setLines((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = [...last, point.x, point.y];
              return next;
            });
          }}
          onMouseUp={() => setDrawing(false)}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={BASE_WIDTH}
              height={BASE_HEIGHT}
              fill="#ffffff"
              stroke="#2a2a2a"
              strokeWidth={6}
            />
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

      <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-[var(--panel)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => stepZoom(-0.25)}
            className="w-7 h-7 rounded text-[var(--muted)] hover:opacity-80 border border-[var(--border)]"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-[var(--muted)] w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => stepZoom(0.25)}
            className="w-7 h-7 rounded text-[var(--muted)] hover:opacity-80 border border-[var(--border)]"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={resetView}
            className="text-xs px-2 h-7 rounded text-[var(--muted)] hover:opacity-80 border border-[var(--border)]"
          >
            Reset
          </button>
        </div>

        {lines.length > 0 && (
          <button
            onClick={() => setLines([])}
            className="text-xs px-2 h-7 rounded text-[var(--muted)] hover:opacity-80 border border-[var(--border)]"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
