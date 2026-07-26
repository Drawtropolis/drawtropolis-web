export type Rect = { top: number; left: number; width: number; height: number }; // % of the image container

type FacadeConfig = {
  image: string; // path under /public
  alt: string;
  gridRect: Rect; // where the 10x10 floor-number grid sits
  plaqueRect: Rect; // where the building-name text sits (the blank bar baked into the art)
};

// Shared facade art per district — 26 July 2026. Reused across all 10
// buildings in a district; only the plaque text (building name) and the
// floor numbers differ per building, and both are real HTML rendered on
// top of the image, never baked into the artwork.
//
// Why: of the 9 generated district images, only Crown's baked-in window
// numbers were actually correct (1-100, no dupes, no skips). Every other
// one had duplicated numbers, skipped numbers, or (Pharaoh) blank window
// panes with no digit at all — Empire additionally has a decorative inset
// picture pasted directly over ~10 of its window cells. Valhalla has no
// facade image at all yet. Rather than trying to fix or regenerate nine
// flawed images, the art is used purely as background/mood — the opaque
// numbered tiles below fully cover whatever's baked in underneath, so the
// numbers are always guaranteed correct regardless of the art. A cleaner
// Valhalla image (or fixed versions of the others) is a one-line swap
// here later, not a rebuild.
//
// gridRect/plaqueRect are estimated by eye from the source images, not
// pixel-measured like the homepage's ROW_ANCHORS were — expect to nudge
// these once it's live and something drifts off its window, same
// iteration pattern as the homepage card links.
export const BACK_LINK_RECT: Rect = { top: 1.5, left: 1, width: 13, height: 6 };

export const DISTRICT_FACADE: Record<string, FacadeConfig | null> = {
  Crown: {
    image: "/district-facades/crown.png",
    alt: "Crown district castle facade",
    gridRect: { top: 29, left: 20, width: 60, height: 50 },
    plaqueRect: { top: 16.5, left: 36, width: 28, height: 5 },
  },
  Liberty: {
    image: "/district-facades/liberty.png",
    alt: "Liberty district facade",
    gridRect: { top: 27, left: 15, width: 70, height: 52 },
    plaqueRect: { top: 13.5, left: 35, width: 30, height: 5 },
  },
  Olympus: {
    image: "/district-facades/olympus.jpg",
    alt: "Olympus district facade",
    gridRect: { top: 32, left: 18, width: 64, height: 52 },
    plaqueRect: { top: 15.5, left: 36, width: 28, height: 6 },
  },
  Sakura: {
    image: "/district-facades/sakura.jpg",
    alt: "Sakura district facade",
    gridRect: { top: 32, left: 18, width: 64, height: 52 },
    plaqueRect: { top: 15.5, left: 36, width: 28, height: 6 },
  },
  Pharaoh: {
    image: "/district-facades/pharaoh.jpg",
    alt: "Pharaoh district facade",
    gridRect: { top: 32, left: 18, width: 64, height: 52 },
    plaqueRect: { top: 15.5, left: 36, width: 28, height: 6 },
  },
  // No facade art yet — building-page.tsx falls back to the original
  // plain grid for this district until an image is added here.
  Valhalla: null,
  Empire: {
    image: "/district-facades/empire.jpg",
    alt: "Empire district facade",
    gridRect: { top: 30, left: 18, width: 64, height: 58 },
    plaqueRect: { top: 25, left: 33, width: 34, height: 7 },
  },
  Dynasty: {
    image: "/district-facades/dynasty.jpg",
    alt: "Dynasty district facade",
    gridRect: { top: 30, left: 18, width: 64, height: 58 },
    plaqueRect: { top: 25, left: 33, width: 34, height: 7 },
  },
  Renaissance: {
    image: "/district-facades/renaissance.jpg",
    alt: "Renaissance district facade",
    gridRect: { top: 30, left: 18, width: 64, height: 58 },
    plaqueRect: { top: 25, left: 33, width: 34, height: 7 },
  },
  Oasis: {
    image: "/district-facades/oasis.jpg",
    alt: "Oasis district facade",
    gridRect: { top: 30, left: 18, width: 64, height: 58 },
    plaqueRect: { top: 25, left: 33, width: 34, height: 7 },
  },
};
