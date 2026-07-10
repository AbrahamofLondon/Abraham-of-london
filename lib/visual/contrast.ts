/**
 * lib/visual/contrast.ts
 *
 * WCAG 2.x contrast-ratio computation with proper alpha compositing.
 *
 * The Phase 0 baseline pass caught a real bug in an ad-hoc version of this
 * logic: computing luminance directly from an rgba() triple while
 * discarding the alpha channel silently overstates contrast for every
 * translucent colour (e.g. treats rgba(255,255,255,0.3) as opaque white).
 * This module is the single tested source of truth going forward — the
 * visual-authority contrast gate (Phase 2) and any ad-hoc measurement must
 * both import from here, not reimplement the maths.
 */

export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

/** Parses "rgb(r,g,b)" or "rgba(r,g,b,a)" (with or without spaces). Defaults alpha to 1. */
export function parseRgba(input: string): RGBA {
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const parts = m[1].split(",").map((x) => parseFloat(x.trim()));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts.length > 3 ? parts[3] : 1];
}

/** Composites a translucent foreground over an opaque background (src-over blend). */
export function composite(fg: RGBA, bg: RGB): RGB {
  const [fr, fg_, fb, fa] = fg;
  return [
    fr * fa + bg[0] * (1 - fa),
    fg_ * fa + bg[1] * (1 - fa),
    fb * fa + bg[2] * (1 - fa),
  ];
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance([r, g, b]: RGB): number {
  const f = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two already-opaque colours. */
export function contrastRatio(a: RGB, b: RGB): number {
  const L1 = relativeLuminance(a) + 0.05;
  const L2 = relativeLuminance(b) + 0.05;
  return Math.max(L1, L2) / Math.min(L1, L2);
}

/**
 * The composed measurement: given a (possibly translucent) foreground colour
 * string and an opaque background RGB, returns the WCAG contrast ratio
 * after proper alpha compositing. This is the function every caller should
 * use — never call relativeLuminance directly on a raw rgba string.
 */
export function measureContrast(foregroundCss: string, backgroundRgb: RGB): number {
  const fg = parseRgba(foregroundCss);
  const composited = composite(fg, backgroundRgb);
  return contrastRatio(composited, backgroundRgb);
}

export const WCAG_MIN = {
  primaryBody: 4.5,
  secondaryBody: 4.5,
  meaningfulMetadata: 4.5,
  formLabel: 4.5,
  placeholder: 4.5,
  largeDisplay: 3,
} as const;
