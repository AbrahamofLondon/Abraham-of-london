/**
 * lib/demo/journey-design.ts
 *
 * One enterprise-grade design language for the flagship demo journey (Decision Signal →
 * governed result → corridor → Operator Pilot). We have no market history, so the
 * presentation itself must signal discipline and standard. This replaces the ad-hoc
 * inline hex + 6–8px labels that read as unfinished, with a small, legible, cohesive
 * token set: an editorial serif for authority, a clean sans for legible body, mono used
 * sparingly for instrument-grade data labels — at accessible sizes.
 */

import type { CSSProperties } from "react";

export const COLORS = {
  canvas: "#08080A",
  ink: "rgba(255,255,255,0.92)",
  body: "rgba(255,255,255,0.66)",
  muted: "rgba(255,255,255,0.44)",
  faint: "rgba(255,255,255,0.28)",
  hair: "rgba(255,255,255,0.10)",
  hairStrong: "rgba(255,255,255,0.18)",
  surface: "rgba(255,255,255,0.025)",
  surfaceRaised: "rgba(255,255,255,0.045)",
  gold: "#C9A96E",
  goldSoft: "rgba(201,169,110,0.85)",
  emerald: "#7BE0B6",
  amber: "#F1A94E",
  rose: "#EC8A8A",
} as const;

export const FONTS = {
  display: "'Cormorant Garamond', Georgia, ui-serif, serif",
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
} as const;

/** Pressure-band → refined semantic colour + human label. */
export const BAND = {
  LOW: { color: COLORS.emerald, label: "Low" },
  MODERATE: { color: COLORS.gold, label: "Moderate" },
  HIGH: { color: COLORS.amber, label: "High" },
  CRITICAL: { color: COLORS.rose, label: "Critical" },
} as const;

/** Eyebrow / instrument label — mono, uppercase, LEGIBLE (11px, not 7px). */
export function eyebrow(color: string = COLORS.goldSoft): CSSProperties {
  return { fontFamily: FONTS.mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color };
}

/** Section caption above a block of content. */
export function caption(color: string = COLORS.faint): CSSProperties {
  return { fontFamily: FONTS.mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color };
}

export const display: CSSProperties = { fontFamily: FONTS.display, fontWeight: 300, lineHeight: 1.1, color: COLORS.ink };
export const bodyText: CSSProperties = { fontFamily: FONTS.sans, fontSize: "15px", lineHeight: 1.72, color: COLORS.body, fontWeight: 400 };
export const bodyTextSm: CSSProperties = { fontFamily: FONTS.sans, fontSize: "13.5px", lineHeight: 1.7, color: COLORS.muted };

export function card(accent?: string): CSSProperties {
  return {
    border: `1px solid ${accent ? hexA(accent, 0.28) : COLORS.hair}`,
    background: accent ? hexA(accent, 0.05) : COLORS.surface,
    borderRadius: 6,
    padding: "22px 24px",
  };
}

/** primary CTA button */
export function primaryButton(): CSSProperties {
  return {
    fontFamily: FONTS.mono, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase",
    color: COLORS.canvas, background: COLORS.gold, border: `1px solid ${COLORS.gold}`,
    padding: "15px 26px", borderRadius: 4, cursor: "pointer", fontWeight: 600,
  };
}
export function ghostButton(): CSSProperties {
  return {
    fontFamily: FONTS.mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase",
    color: COLORS.body, background: "transparent", border: `1px solid ${COLORS.hairStrong}`,
    padding: "13px 22px", borderRadius: 4, cursor: "pointer",
  };
}

/** input field */
export function field(): CSSProperties {
  return {
    width: "100%", fontFamily: FONTS.sans, fontSize: "14.5px", color: COLORS.ink,
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.hair}`, borderRadius: 4,
    padding: "11px 13px", marginTop: 7, outline: "none",
  };
}

/** hex (#RRGGBB) + alpha → rgba(); passthrough for rgba/named inputs. */
export function hexA(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) return hex;
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const r = parseInt(full.slice(1, 3), 16), g = parseInt(full.slice(3, 5), 16), b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
