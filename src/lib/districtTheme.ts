// District colour identity — added 26 July 2026. The homepage art
// (hero-city.png) paints each of the ten districts in its own colour
// (Crown navy/gold, Sakura pink, Pharaoh gold/sand, etc.), but every page
// past the homepage — building floor list, floor room list, individual
// room — was plain grey with no colour tie-back to the district you're
// actually in. These are approximations of the badge colours from the
// source artwork, picked to read clearly as a wash behind both light and
// dark mode text (see BuildingPage / FloorPage / RoomPage, which each
// apply this as a low-opacity gradient rather than a flat fill so it
// never fights with theme contrast).
export const DISTRICT_THEME: Record<string, { color: string; accent: string }> = {
  Crown: { color: "#1e3a5f", accent: "#d4af37" },
  Olympus: { color: "#3b6ea8", accent: "#eaf2fb" },
  Liberty: { color: "#2f6b3a", accent: "#c9e8c9" },
  Sakura: { color: "#c23b6b", accent: "#ffd9e8" },
  Pharaoh: { color: "#b8863b", accent: "#f5e4b8" },
  Valhalla: { color: "#3b4552", accent: "#8fb8d6" },
  Empire: { color: "#8b2020", accent: "#f0c9c9" },
  Dynasty: { color: "#c2540c", accent: "#ffd9b3" },
  Renaissance: { color: "#5b3a8a", accent: "#e3d4f7" },
  Oasis: { color: "#1a7a7a", accent: "#c9f0f0" },
};

export function getDistrictTheme(collection: string | null | undefined) {
  if (!collection) return null;
  return DISTRICT_THEME[collection] ?? null;
}

// Applied as the page's background — a soft radial wash of the district
// colour fading into the theme background, so it reads as "this page
// belongs to Crown" without turning into a solid colour block that
// fights with light/dark mode.
export function districtBackground(collection: string | null | undefined) {
  const theme = getDistrictTheme(collection);
  if (!theme) return undefined;
  return {
    backgroundImage: `radial-gradient(ellipse 120% 60% at 50% -10%, ${theme.color}33, transparent 70%)`,
  };
}
