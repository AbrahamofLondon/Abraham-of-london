import React from "react";
import { Audio, Composition, Sequence, staticFile } from "remotion";

import { Scene01_Opening } from "./scenes/Scene01_Opening";
import { Scene02_CategoryProblem } from "./scenes/Scene02_CategoryProblem";
import { Scene03_CategoryDeclaration } from "./scenes/Scene03_CategoryDeclaration";
import { Scene04_WhatItDoes } from "./scenes/Scene04_WhatItDoes";
import { Scene05_FastDiagnostic } from "./scenes/Scene05_FastDiagnostic";
import { Scene06_Instruments } from "./scenes/Scene06_Instruments";
import { Scene07_Refusal } from "./scenes/Scene07_Refusal";
import { Scene08_DecisionCentre } from "./scenes/Scene08_DecisionCentre";
import { Scene09_ExecutiveReporting } from "./scenes/Scene09_ExecutiveReporting";
import { Scene10_StrategyRoom } from "./scenes/Scene10_StrategyRoom";
import { Scene11_BoardroomOversight } from "./scenes/Scene11_BoardroomOversight";
import { Scene12_NotClaimed } from "./scenes/Scene12_NotClaimed";
import { Scene13_WhyItMatters } from "./scenes/Scene13_WhyItMatters";
import { Scene14_Closing } from "./scenes/Scene14_Closing";

const FPS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// VOICEOVER TIMING MAP
//
// Each entry defines when (in seconds from the START of the audio) that
// scene's voiceover segment begins. The scene runs from its startAt until
// the next scene's startAt.
//
// HOW TO CALIBRATE:
// 1. Open your voiceover-main.mp3 in any audio player
// 2. Note the timestamp where each scene's narration starts
// 3. Update the startAt values below
// 4. Preview in Remotion studio: npx remotion studio src/index.ts
// 5. Adjust until visuals and voice are aligned
// ─────────────────────────────────────────────────────────────────────────────

const VOICE_TIMING = [
  // Scene 1: "Serious decisions rarely fail..."
  { startAt: 0 },
  // Scene 2: "Consulting gives recommendations..."
  { startAt: 25 },
  // Scene 3: "Abraham of London is building..."
  { startAt: 47 },
  // Scene 4: "The system does not begin by selling..."
  { startAt: 65 },
  // Scene 5: "The first entry point is a fast diagnostic..."
  { startAt: 89 },
  // Scene 6: "From there, the operator can use decision instruments..."
  { startAt: 119 },
  // Scene 7: "The category wedge is refusal..."
  { startAt: 146 },
  // Scene 8: "Once a decision enters the system..."
  { startAt: 170 },
  // Scene 9: "When the decision is serious enough..."
  { startAt: 192 },
  // Scene 10: "Strategy Room is where the decision moves..."
  { startAt: 216 },
  // Scene 11: "For institutional cases..."
  { startAt: 236 },
  // Scene 12: "The system is deliberately bounded..."
  { startAt: 260 },
  // Scene 13: "The aim is simple..."
  { startAt: 287 },
  // Scene 14: "I am inviting a small number..."
  { startAt: 309 },
];

// Total duration — set this to your audio length in seconds
// Listen to the end of your recording and note the final timestamp
const TOTAL_DURATION_SECONDS = 340;

// ─────────────────────────────────────────────────────────────────────────────

const SCENE_COMPONENTS = [
  Scene01_Opening,
  Scene02_CategoryProblem,
  Scene03_CategoryDeclaration,
  Scene04_WhatItDoes,
  Scene05_FastDiagnostic,
  Scene06_Instruments,
  Scene07_Refusal,
  Scene08_DecisionCentre,
  Scene09_ExecutiveReporting,
  Scene10_StrategyRoom,
  Scene11_BoardroomOversight,
  Scene12_NotClaimed,
  Scene13_WhyItMatters,
  Scene14_Closing,
];

const SCENE_IDS = [
  "opening",
  "category-problem",
  "category-declare",
  "what-it-does",
  "fast-diagnostic",
  "instruments",
  "refusal",
  "decision-centre",
  "executive-reporting",
  "strategy-room",
  "boardroom-oversight",
  "not-claimed",
  "why-it-matters",
  "closing",
];

function buildScenes() {
  return SCENE_COMPONENTS.map((Component, i) => {
    const startSeconds = VOICE_TIMING[i]!.startAt;
    const endSeconds = i < VOICE_TIMING.length - 1
      ? VOICE_TIMING[i + 1]!.startAt
      : TOTAL_DURATION_SECONDS;
    const durationSeconds = endSeconds - startSeconds;

    return {
      id: SCENE_IDS[i]!,
      Component,
      fromFrame: Math.round(startSeconds * FPS),
      durationFrames: Math.round(durationSeconds * FPS),
    };
  });
}

// ── MAIN VIDEO ──

function MainVideo() {
  const scenes = buildScenes();

  return (
    <>
      <Audio src={staticFile("assets/voiceover-main.mp3")} volume={1} />
      {scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.fromFrame}
          durationInFrames={scene.durationFrames}
        >
          <scene.Component />
        </Sequence>
      ))}
    </>
  );
}

// ── 90-SECOND SHORT VERSION (no audio — separate recording needed) ──

const SHORT_SCENES = [
  { id: "opening",          component: Scene01_Opening,            duration: 13 * FPS },
  { id: "category-declare", component: Scene03_CategoryDeclaration, duration: 13 * FPS },
  { id: "what-it-does",     component: Scene04_WhatItDoes,         duration: 14 * FPS },
  { id: "instruments",      component: Scene06_Instruments,        duration: 14 * FPS },
  { id: "refusal",          component: Scene07_Refusal,            duration: 12 * FPS },
  { id: "why-it-matters",   component: Scene13_WhyItMatters,       duration: 12 * FPS },
  { id: "closing",          component: Scene14_Closing,            duration: 12 * FPS },
];

function ShortVideo() {
  let offset = 0;
  return (
    <>
      {SHORT_SCENES.map((scene) => {
        const from = offset;
        offset += scene.duration;
        const Component = scene.component;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration}>
            <Component />
          </Sequence>
        );
      })}
    </>
  );
}

// ── REGISTER ──

const TOTAL_MAIN_FRAMES = Math.round(TOTAL_DURATION_SECONDS * FPS);
const TOTAL_SHORT = SHORT_SCENES.reduce((sum, s) => sum + s.duration, 0);

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={TOTAL_MAIN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={TOTAL_SHORT}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
}
