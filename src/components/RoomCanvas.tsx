"use client";

import { useEffect, useRef, useState } from "react";
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
// Mobile fix — 26 July 2026 (Andrew: canvas bled off the edge of the
// screen on his phone, and touch didn't draw at all). Two separate root
// causes, both fixed here:
//   1. The viewport was a hardcoded 900x600 — wider than almost any phone
//      screen, so it simply overflowed. Viewport size is now measured
//      from the wrapper's actual rendered width (ResizeObserver), capped
//      at 900px, keeping the same 3:2 ratio at any size.
//   2. Drawing only ever listened for mouse events (onMouseDown/Move/Up).
//      Touch fires an entirely different event family in the DOM — those
//      handlers never fired on a phone, so nothing was ever drawn no
//      matter how the screen was touched. Added onTouchStart/Move/End
//      alongside the existing mouse handlers: one finger draws, exactly
//      like the mouse; two fingers pinch-zoom and pan together, mirroring
//      the desktop trackpad's ctrlKey-wheel-zoom / plain-wheel-pan split.
//      `touchAction: "none"` on the wrapper stops the browser's own
//      scroll/zoom from fighting over the same gesture.
//
// Same pass: colour and pencil-size controls added under the zoom bar —
// each stroke now remembers the colour/width it was drawn with instead of
// every line being hardcoded near-black at 2px.
const BASE_WIDTH = 3600;
const BASE_HEIGHT = 2400;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const MAX_VIEWPORT_WIDTH = 900;
const VIEWPORT_ASPECT = 900 / 600; // 3:2, matches BASE_WIDTH/BASE_HEIGHT

const COLORS = ["#111111", "#e03131", "#2f6b3a", "#1d5fa8", "#c2540c", "#8b2fb0"];
const STROKE_WIDTHS = [
  { label: "S", value: 2 },
  { label: "M", value: 4 },
  { label: "L", value: 8 },
];

type StrokeLine = { points: number[]; color: string; width: number };

// Clamp panning so the paper's own edge is the farthest you can scroll —
// takes the current viewport size as an argument now that it's
// responsive rather than a fixed constant.
function clampStagePos(
  pos: { x: number; y: number },
  zoomLevel: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const minX = viewportWidth - BASE_WIDTH * zoomLevel;
  const minY = viewportHeight - BASE_HEIGHT * zoomLevel;
  return {
    x: Math.min(0, Math.max(minX, pos.x)),
    y: Math.min(0, Math.max(minY, pos.y)),
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function RoomCanvas() {
  const [lines, setLines] = useState<StrokeLine[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[0].value);
  const stageRef = useRef<Konva.Stage>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Responsive viewport — measured from the wrapper's parent, capped at
  // 900px, always 3:2. Replaces the old fixed VIEWPORT_WIDTH/HEIGHT
  // constants so the canvas fits any screen instead of just overflowing
  // narrower ones.
  const [viewport, setViewport] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const available = el.parentElement?.clientWidth ?? window.innerWidth;
      const width = Math.max(240, Math.min(MAX_VIEWPORT_WIDTH, available));
      const height = Math.round(width / VIEWPORT_ASPECT);
      setViewport((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    if (el.parentElement) observer.observe(el.parentElement);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Re-clamp whenever the viewport itself changes size (rotating a phone,
  // resizing a window) so the paper never ends up scrolled out of view.
  useEffect(() => {
    setStagePos((prev) => clampStagePos(prev, zoom, viewport.width, viewport.height));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height]);

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
        viewport.width,
        viewport.height,
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
          viewport.width,
          viewport.height,
        ),
      );
    }
  }

  function stepZoom(delta: number) {
    zoomAtPoint(clampZoom(zoom + delta), {
      x: viewport.width / 2,
      y: viewport.height / 2,
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

  // --- Touch: one finger draws, two fingers pinch-zoom + pan ---
  // Pinch state lives in a ref rather than component state — it's read
  // and written many times per second during a gesture and doesn't need
  // to trigger its own re-render (the zoom/stagePos state updates already
  // do that).
  const pinchRef = useRef<{ distance: number; midpoint: { x: number; y: number } } | null>(null);

  function handleTouchStart(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const touches = e.evt.touches;

    if (touches.length === 1) {
      pinchRef.current = null;
      setDrawing(true);
      const point = toCanvasPoint(stage);
      if (point) setLines((prev) => [...prev, { points: [point.x, point.y], color, width: strokeWidth }]);
    } else if (touches.length === 2) {
      // Second finger landed mid-stroke — abandon the in-progress line
      // rather than leaving a stray single-point mark, and switch to
      // pinch/pan tracking.
      setDrawing(false);
      const positions = stage.getPointersPositions();
      if (positions.length >= 2) {
        pinchRef.current = {
          distance: distance(positions[0], positions[1]),
          midpoint: midpoint(positions[0], positions[1]),
        };
      }
    }
  }

  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const touches = e.evt.touches;

    if (touches.length === 1 && drawing) {
      const point = toCanvasPoint(stage);
      if (!point) return;
      setLines((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, points: [...last.points, point.x, point.y] };
        return next;
      });
      return;
    }

    if (touches.length === 2) {
      const positions = stage.getPointersPositions();
      if (positions.length < 2) return;
      const newDistance = distance(positions[0], positions[1]);
      const newMidpoint = midpoint(positions[0], positions[1]);
      const prev = pinchRef.current;

      if (prev) {
        const ratio = newDistance / prev.distance;
        const newZoom = clampZoom(zoom * ratio);

        // Combined pinch-zoom + pan in one step: find the canvas-space
        // point currently sitting under the fingers' new position, then
        // solve for the stage position that keeps that same point under
        // the fingers after applying newZoom. That single calculation
        // captures both "zoom in/out under your fingers" and "follow your
        // fingers as they move together" at once.
        const oldStageZoom = stageRef.current?.scaleX() ?? zoom;
        const canvasPointUnderFingers = {
          x: (newMidpoint.x - stagePos.x) / oldStageZoom,
          y: (newMidpoint.y - stagePos.y) / oldStageZoom,
        };
        const nextStagePos = {
          x: newMidpoint.x - canvasPointUnderFingers.x * newZoom,
          y: newMidpoint.y - canvasPointUnderFingers.y * newZoom,
        };
        setZoom(newZoom);
        setStagePos(clampStagePos(nextStagePos, newZoom, viewport.width, viewport.height));
      }

      pinchRef.current = { distance: newDistance, midpoint: newMidpoint };
    }
  }

  function handleTouchEnd(e: Konva.KonvaEventObject<TouchEvent>) {
    const remaining = e.evt.touches.length;
    if (remaining === 0) {
      setDrawing(false);
      pinchRef.current = null;
    } else if (remaining === 1) {
      // Dropped from two fingers to one — don't resume drawing with
      // whichever finger is still down, that would jump a line across
      // the canvas. Require a fresh touch to start a new stroke.
      pinchRef.current = null;
    }
  }

  return (
    <div ref={wrapperRef} className="inline-block w-full">
      <div className="rounded-lg overflow-hidden shadow-lg border border-[var(--border)] inline-block max-w-full">
        <div
          style={{ width: viewport.width, height: viewport.height, touchAction: "none" }}
          className="max-w-full overflow-hidden bg-white"
        >
          <Stage
            ref={stageRef}
            width={viewport.width}
            height={viewport.height}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onMouseDown={(e) => {
              setDrawing(true);
              const point = toCanvasPoint(e.target.getStage()!);
              if (point) setLines((prev) => [...prev, { points: [point.x, point.y], color, width: strokeWidth }]);
            }}
            onMouseMove={(e) => {
              if (!drawing) return;
              const point = toCanvasPoint(e.target.getStage()!);
              if (!point) return;
              setLines((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, points: [...last.points, point.x, point.y] };
                return next;
              });
            }}
            onMouseUp={() => setDrawing(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
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
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.width}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
            </Layer>
          </Stage>
        </div>

        <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-[var(--panel)]">
          <div className="flex items-center justify-between gap-2">
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

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className="w-6 h-6 rounded-full border-2 shrink-0"
                  style={{
                    background: c,
                    borderColor: c === color ? "var(--foreground)" : "transparent",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setStrokeWidth(w.value)}
                  className={`w-7 h-7 rounded text-xs font-medium border ${
                    strokeWidth === w.value
                      ? "border-[var(--foreground)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
