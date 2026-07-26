"use client";

import { useEffect, useState } from "react";

// Moon/sun light-dark toggle, added 26 July 2026. Requested because the
// site had no manual theme control — it silently followed the visitor's
// OS setting, which is why it was always dark on Andrew's own devices
// ("my computer is on diet mode... need a little moon and a star
// toggle"). Sets a `data-theme` attribute on <html>, which globals.css
// reads via the [data-theme="light"] selector; persists the choice in
// localStorage so it survives reloads. The matching inline script in
// layout.tsx applies the saved (or system-default) theme before first
// paint, so there's no flash of the wrong theme on load.
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("drawtropolis-theme", next);
  }

  // Avoid rendering the wrong icon for a split second before we've read
  // the real value off the DOM.
  if (theme === null) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--panel)] text-[var(--foreground)]"
    >
      {theme === "light" ? (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        </svg>
      )}
    </button>
  );
}
