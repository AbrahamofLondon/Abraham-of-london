import React from "react";
import { Composition, Sequence } from "remotion";

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

// ── SCENE TIMING (in frames at 30fps) ──
// Total target: ~5 minutes = 9000 frames

const FPS = 30;
const SCENES = [
  { id: "opening",            component: Scene01_Opening,           duration: 7 * FPS },  // 7s
  { id: "category-problem",   component: Scene02_CategoryProblem,   duration: 8 * FPS },  // 8s
  { id: "category-declare",   component: Scene03_CategoryDeclaration, duration: 7 * FPS },// 7s
  { id: "what-it-does",       component: Scene04_WhatItDoes,        duration: 9 * FPS },  // 9s
  { id: "fast-diagnostic",    component: Scene05_FastDiagnostic,    duration: 10 * FPS }, // 10s
  { id: "instruments",        component: Scene06_Instruments,       duration: 10 * FPS }, // 10s
  { id: "refusal",            component: Scene07_Refusal,           duration: 9 * FPS },  // 9s
  { id: "decision-centre",    component: Scene08_DecisionCentre,    duration: 7 * FPS },  // 7s
  { id: "executive-reporting", component: Scene09_ExecutiveReporting, duration: 9 * FPS },// 9s
  { id: "strategy-room",      component: Scene10_StrategyRoom,      duration: 7 * FPS },  // 7s
  { id: "boardroom-oversight", component: Scene11_BoardroomOversight, duration: 8 * FPS },// 8s
  { id: "not-claimed",        component: Scene12_NotClaimed,        duration: 9 * FPS },  // 9s
  { id: "why-it-matters",     component: Scene13_WhyItMatters,      duration: 9 * FPS },  // 9s
  { id: "closing",            component: Scene14_Closing,           duration: 8 * FPS },  // 8s
];

// ── MAIN COMPOSITION ──

function MainVideo() {
  let offset = 0;
  return (
    <>
      {SCENES.map((scene) => {
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

// ── 90-SECOND SHORT VERSION ──
// Uses scenes 1, 3, 4, 7, 13, 14 with tighter timing

const SHORT_SCENES = [
  { id: "opening",          component: Scene01_Opening,            duration: 5 * FPS },
  { id: "category-declare", component: Scene03_CategoryDeclaration, duration: 5 * FPS },
  { id: "what-it-does",     component: Scene04_WhatItDoes,         duration: 7 * FPS },
  { id: "instruments",      component: Scene06_Instruments,        duration: 6 * FPS },
  { id: "refusal",          component: Scene07_Refusal,            duration: 6 * FPS },
  { id: "why-it-matters",   component: Scene13_WhyItMatters,       duration: 6 * FPS },
  { id: "closing",          component: Scene14_Closing,            duration: 5 * FPS },
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

// ── TOTAL DURATIONS ──
const TOTAL_MAIN = SCENES.reduce((sum, s) => sum + s.duration, 0);
const TOTAL_SHORT = SHORT_SCENES.reduce((sum, s) => sum + s.duration, 0);

// ── REGISTER COMPOSITIONS ──
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={TOTAL_MAIN}
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
