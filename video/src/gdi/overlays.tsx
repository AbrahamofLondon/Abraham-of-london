import React from "react";
import { AbsoluteFill } from "remotion";

// ── Film Grain ────────────────────────────────────────────────────────────────
// SVG feTurbulence is too expensive in headless Chrome (~1-4s/frame).
// Grain character is carried by the vignette crush and atmospheric haze.
// This component is retained as a no-op so call sites don't need updating.

export function FilmGrain(_props?: { opacity?: number }) {
  return null;
}

// ── Vignette ─────────────────────────────────────────────────────────────────
// Two-pass vignette: wide soft falloff + tight edge crush for cinematic depth.

export function Vignette({ strength = 0.78 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(ellipse 88% 82% at center, transparent 30%, rgba(0,0,0,${strength * 0.38}) 65%, rgba(0,0,0,${strength}) 100%)`,
          `radial-gradient(ellipse 50% 50% at center, transparent 0%, rgba(0,0,0,0.06) 100%)`,
        ].join(", "),
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}

// ── Atmospheric Haze ─────────────────────────────────────────────────────────
// Warm gold wash at top (ceiling light) + cool dark at bottom (depth shadow).

export function AtmosphericHaze() {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(201,169,110,0.055) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}
