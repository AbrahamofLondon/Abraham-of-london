// lib/fonts.ts

import { useEffect, useState } from "react";
import type { FontFamilyKey } from "./fonts/index";

// Re-export everything from the canonical font module
export * from "./fonts/index";
export { default } from "./fonts/index";

/**
 * Simple utility class presets – used by components that just want
 * a semantic “font style” without worrying about raw Tailwind classes.
 */
export const fontPresets = {
  h1: "text-4xl md:text-5xl font-bold font-serif tracking-tight",
  h2: "text-3xl md:text-4xl font-semibold font-serif tracking-tight",
  h3: "text-2xl md:text-3xl font-semibold font-serif",
  subtitle: "text-lg md:text-xl font-sans text-soft-charcoal/80",
  articleBody: "text-lg font-sans leading-relaxed md:leading-loose",
  body: "text-base font-sans leading-relaxed",
  caption: "text-sm font-sans text-soft-charcoal/70",
} as const;

/**
 * Minimal “loader” hook to keep older code happy.
 * It pretends to “load” fonts once on the client and then reports `loaded: true`.
 * There is no network dependency – fonts are system-based now.
 */
export function useFontLoader(
  families: FontFamilyKey[] = ["sans", "serif"],
  preload = true
): { loaded: boolean } {
  const [loaded, setLoaded] = useState(!preload);

  useEffect(() => {
    if (!preload) return;

    // In a real setup you might dynamically inject <link> tags, etc.
    // Here we just mark as loaded on first client render.
    setLoaded(true);
  }, [preload, families.join(",")]);

  return { loaded };
}