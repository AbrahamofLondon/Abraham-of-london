/**
 * GDI_CinematicBrandFilm.tsx
 *
 * Main Remotion composition: GDI_CinematicBrandFilm
 *
 * Sequences all 12 approved scenes back-to-back using durations from the
 * gdi_brand_film_manifest.csv (via manifest.ts).
 *
 * Each scene:
 *   - Uses its approved PNG still with slow push-in (max 1.06x zoom)
 *   - Uses its approved per-scene MP3 voice track
 *   - Has fade-in / fade-out envelope (18 frames each)
 *   - Atmospheric overlays: film grain, vignette, haze
 *   - Scene-specific motion and text where directed by the brief
 *
 * No AI-generated content. No stock footage. No external assets.
 * All overlays are pure CSS/SVG.
 *
 * Output: video/out/abraham-of-london-gdi-cinematic.mp4
 */
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { SCENE_DATA, FPS, TOTAL_FRAMES, buildSceneOffsets } from "./gdi/manifest";
import { SCENE_COMPONENTS } from "./gdi/scenes";

// ── Composition component ─────────────────────────────────────────────────────

export function GDI_CinematicBrandFilm() {
  const offsets = buildSceneOffsets();

  return (
    <>
      {SCENE_DATA.map((scene, i) => {
        const fromFrame = offsets[i]!;
        const durationInFrames = Math.round(scene.durationSeconds * FPS);
        const SceneComponent = SCENE_COMPONENTS[i]!;

        return (
          <Sequence
            key={scene.id}
            from={fromFrame}
            durationInFrames={durationInFrames}
            name={scene.id}
          >
            {/* Per-scene approved voice track */}
            <Audio src={staticFile(scene.voice)} volume={1} />
            {/* Scene visuals — receives its own durationInFrames for correct fades */}
            <SceneComponent durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </>
  );
}

// ── Composition metadata ──────────────────────────────────────────────────────
// Export for registration in Video.tsx

export const GDI_CINEMATIC_META = {
  id: "GDI-CinematicBrandFilm",
  component: GDI_CinematicBrandFilm,
  durationInFrames: TOTAL_FRAMES,
  fps: FPS,
  width: 1920,
  height: 1080,
} as const;
