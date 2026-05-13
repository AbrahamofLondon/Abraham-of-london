/**
 * gdi/manifest.ts
 *
 * Scene data derived directly from gdi_brand_film_manifest.csv.
 * All durations match the manifest exactly.
 * Asset paths are relative to video/public/ (staticFile() root).
 */

export const FPS = 30;

export const SCENE_DATA = [
  {
    id: "hook",
    still: "gdi_build/mapped_assets/S01_hook_still.png",
    voice: "gdi_build/mapped_assets/S01_voice.mp3",
    durationSeconds: 16.64,
  },
  {
    id: "decision_map",
    still: "gdi_build/mapped_assets/S02_decision_map_still.png",
    voice: "gdi_build/mapped_assets/S02_voice.mp3",
    durationSeconds: 28.96,
  },
  {
    id: "market_problem",
    still: "gdi_build/mapped_assets/S03_market_problem_still.png",
    voice: "gdi_build/mapped_assets/S03_voice.mp3",
    durationSeconds: 25.76,
  },
  {
    id: "corridor",
    still: "gdi_build/mapped_assets/S04_corridor_still.png",
    voice: "gdi_build/mapped_assets/S04_voice.mp3",
    durationSeconds: 35.20,
  },
  {
    id: "system_response",
    still: "gdi_build/mapped_assets/S05_system_response_still.png",
    voice: "gdi_build/mapped_assets/S05_voice.mp3",
    durationSeconds: 32.32,
  },
  {
    id: "refusal_gate",
    still: "gdi_build/mapped_assets/S06_refusal_gate_still.png",
    voice: "gdi_build/mapped_assets/S06_voice.mp3",
    durationSeconds: 29.52,
  },
  {
    id: "user_journey",
    still: "gdi_build/mapped_assets/S07_user_journey_still.png",
    voice: "gdi_build/mapped_assets/S07_voice.mp3",
    durationSeconds: 46.72,
  },
  {
    id: "compounding_record",
    still: "gdi_build/mapped_assets/S08_compounding_record_still.png",
    voice: "gdi_build/mapped_assets/S08_voice.mp3",
    durationSeconds: 27.60,
  },
  {
    id: "evidence_detail",
    still: "gdi_build/mapped_assets/S09_evidence_detail_still.png",
    voice: "gdi_build/mapped_assets/S09_voice.mp3",
    durationSeconds: 28.24,
  },
  {
    id: "operator_pilot",
    still: "gdi_build/mapped_assets/S10_operator_pilot_still.png",
    voice: "gdi_build/mapped_assets/S10_voice.mp3",
    durationSeconds: 31.28,
  },
  {
    id: "standard",
    still: "gdi_build/mapped_assets/S11_standard_still.png",
    voice: "gdi_build/mapped_assets/S11_voice.mp3",
    durationSeconds: 36.56,
  },
  {
    id: "closing",
    still: "gdi_build/mapped_assets/S12_closing_still.png",
    voice: "gdi_build/mapped_assets/S12_voice.mp3",
    durationSeconds: 36.56,
  },
] as const;

export type SceneId = typeof SCENE_DATA[number]["id"];

export const TOTAL_DURATION_SECONDS = SCENE_DATA.reduce(
  (sum, s) => sum + s.durationSeconds,
  0
);

// Total frames — sum of per-scene rounded frames (avoids float accumulation drift)
export const TOTAL_FRAMES = SCENE_DATA.reduce(
  (sum, s) => sum + Math.round(s.durationSeconds * FPS),
  0
);

/** Cumulative frame start offset for each scene, in composition frame space. */
export function buildSceneOffsets(): number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const scene of SCENE_DATA) {
    offsets.push(offset);
    offset += Math.round(scene.durationSeconds * FPS);
  }
  return offsets;
}
