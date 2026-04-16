// lib/reader/reader-presets.ts
// Typed reader presets for long-form reading surfaces.
// Each preset encodes the reader spec for a specific surface.

export type ReaderSurface = "canon" | "vault";

export type ReaderPreset = {
  surface: ReaderSurface;

  /** CSS class applied to the outer reading frame */
  frameClass: string;

  /** CSS class applied to the content/prose body */
  bodyClass: string;

  /** Eyebrow label shown above the title */
  eyebrow: string;

  /** Title font family key */
  titleFont: "serif" | "sans";

  /** Body font family key */
  bodyFont: "serif" | "sans";

  /** Whether the body sits on a warm panel (Option A) or stays on dark bg */
  warmPanel: boolean;

  /** Background class for the page scaffold */
  scaffoldClass: string;
};

export const READER_PRESETS: Record<ReaderSurface, ReaderPreset> = {
  canon: {
    surface: "canon",
    frameClass: "reader-frame reader-frame--canon",
    bodyClass: "reader-body reader-body--canon",
    eyebrow: "Canonical Volume",
    titleFont: "serif",
    bodyFont: "serif",
    warmPanel: true,
    scaffoldClass: "min-h-screen bg-black text-white",
  },
  vault: {
    surface: "vault",
    frameClass: "reader-frame reader-frame--vault",
    bodyClass: "reader-body reader-body--vault",
    eyebrow: "Intelligence Briefing",
    titleFont: "serif",
    bodyFont: "sans",
    warmPanel: false,
    scaffoldClass: "min-h-screen bg-black text-white",
  },
};

export function getReaderPreset(surface: ReaderSurface): ReaderPreset {
  return READER_PRESETS[surface];
}
