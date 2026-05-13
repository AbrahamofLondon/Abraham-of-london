/**
 * gdi/scenes.tsx
 *
 * All 12 cinematic scene components for GDI_CinematicBrandFilm.
 *
 * Design rules applied throughout:
 *   - Max zoom: 1.06 (most scenes use 1.04–1.05 for subtlety)
 *   - Fade transitions only — no cuts, no effects
 *   - Text overlays only where explicitly directed in the brief
 *   - No invented text — approved copy only
 *   - No flashy elements, no glitch, no kinetic effects
 *   - Assets: approved stills + approved voice tracks only
 */
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { FilmGrain, Vignette, AtmosphericHaze } from "./overlays";
import {
  CinematicStill,
  SceneEnvelope,
  GoldAccent,
  GoldRule,
  ThresholdPulse,
  FadeText,
  TextPanel,
  SeqItem,
  CorridorStage,
  GOLD,
  WHITE,
  DIM,
  FAINT,
  serif,
  mono,
} from "./cinematic";

type SceneProps = { durationInFrames: number };

// ── Shared atmospheric stack (applied in every scene) ────────────────────────

function Atmosphere() {
  return (
    <>
      <AtmosphericHaze />
      <Vignette />
      <FilmGrain />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S01 — Hook
// Slow push toward text. Slight gold glow. Hold long enough for line to land.
// ─────────────────────────────────────────────────────────────────────────────
export function S01_Hook({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S01_hook_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.05}
        yDrift={-8}
      />
      <Atmosphere />
      <GoldAccent position="bottom" delay={20} />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S02 — Decision Map
// Subtle slow drift. No nodes, no arrows, no circuit feel.
// ─────────────────────────────────────────────────────────────────────────────
export function S02_DecisionMap({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S02_decision_map_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.04}
        xDrift={-14}
      />
      <Atmosphere />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S03 — Market Problem
// Slow push toward Decision Record. Approved bottom text only — minimal.
// ─────────────────────────────────────────────────────────────────────────────
export function S03_MarketProblem({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S03_market_problem_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.06}
        yDrift={-6}
      />
      <Atmosphere />
      {/* Approved bottom text — single approved label only */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 70 }}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "8%",
          }}
        >
          <FadeText delay={40} duration={20}>
            <p
              style={{
                ...mono,
                fontSize: "16px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}99`,
              }}
            >
              Decision Record
            </p>
          </FadeText>
        </div>
      </AbsoluteFill>
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S04 — Corridor (Category Definition)
// Slight forward movement. Corridor labels must remain readable — no overlay.
// ─────────────────────────────────────────────────────────────────────────────
export function S04_Corridor({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S04_corridor_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.05}
        yDrift={-12}
      />
      <Atmosphere />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S05 — System Response
// Restrained typographic reveal of the four approved exchange lines.
// ─────────────────────────────────────────────────────────────────────────────
const RESPONSE_LINES = [
  { label: "Finding",           delay: 30  },
  { label: "Contradiction",     delay: 110 },
  { label: "Required move",     delay: 190 },
  { label: "Consequence path",  delay: 270 },
];

export function S05_SystemResponse({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S05_system_response_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.04}
      />
      <Atmosphere />
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 70 }}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "8%",
          }}
        >
          <TextPanel delay={20} style={{ minWidth: "280px" }}>
            {RESPONSE_LINES.map((line) => (
              <SeqItem
                key={line.label}
                label={line.label}
                delay={line.delay}
                useMono
                size="19px"
                color={DIM}
              />
            ))}
          </TextPanel>
        </div>
      </AbsoluteFill>
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S06 — Refusal Gate
// Slow push toward gate. Threshold light pulse. Refusal text stays readable.
// ─────────────────────────────────────────────────────────────────────────────
export function S06_RefusalGate({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S06_refusal_gate_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.05}
        yDrift={-10}
      />
      <Atmosphere />
      <ThresholdPulse delay={30} />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S07 — User Journey
// Sequential emphasis on six corridor stages. Longest scene at 46.72s.
// Stages spread across scene duration — one every ~7s (210 frames at 30fps).
// ─────────────────────────────────────────────────────────────────────────────
const CORRIDOR_STAGES = [
  { label: "Signal",       delay: 60  },
  { label: "Instrument",   delay: 230 },
  { label: "Report",       delay: 410 },
  { label: "Intervention", delay: 590 },
  { label: "Oversight",    delay: 790 },
  { label: "Verification", delay: 990 },
];

export function S07_UserJourney({ durationInFrames }: SceneProps) {
  const frame = useCurrentFrame();
  // Active stage = the most recently revealed one, so each stage glows as
  // it appears and dims when the next one takes over.
  const activeIndex = CORRIDOR_STAGES.reduce((acc, stage, i) =>
    frame >= stage.delay ? i : acc, -1);

  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S07_user_journey_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.05}
        xDrift={8}
      />
      <Atmosphere />
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 70 }}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <TextPanel delay={40} style={{ display: "flex", gap: "36px", alignItems: "flex-start" }}>
            {CORRIDOR_STAGES.map((stage, i) => (
              <CorridorStage
                key={stage.label}
                label={stage.label}
                delay={stage.delay}
                active={i === activeIndex}
              />
            ))}
          </TextPanel>
        </div>
      </AbsoluteFill>
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S08 — Compounding Record
// Sequential fade-in of the five approved record entries.
// ─────────────────────────────────────────────────────────────────────────────
const RECORD_ENTRIES = [
  { label: "Contradiction detected",    delay: 40  },
  { label: "Checkpoint created",        delay: 190 },
  { label: "Response submitted",        delay: 340 },
  { label: "Operator review completed", delay: 490 },
  { label: "Record updated",            delay: 620 },
];

export function S08_CompoundingRecord({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S08_compounding_record_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.04}
      />
      <Atmosphere />
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 70 }}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "8%",
          }}
        >
          <TextPanel delay={20} style={{ minWidth: "340px" }}>
            {RECORD_ENTRIES.map((entry) => (
              <SeqItem
                key={entry.label}
                label={entry.label}
                delay={entry.delay}
                size="20px"
                color={DIM}
              />
            ))}
          </TextPanel>
        </div>
      </AbsoluteFill>
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S09 — Evidence Detail
// Slow document push-in. Subtle field highlight lines. Title must read.
// ─────────────────────────────────────────────────────────────────────────────
export function S09_EvidenceDetail({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S09_evidence_detail_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.06}
        yDrift={-8}
      />
      <Atmosphere />
      {/* Subtle field line highlight — horizontal gold rule above document area */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 60 }}>
        <GoldAccent position="top" delay={40} />
      </AbsoluteFill>
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S10 — Operator Pilot
// Gate frame. Controlled light opening. No spectacle.
// ─────────────────────────────────────────────────────────────────────────────
export function S10_OperatorPilot({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S10_operator_pilot_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.04}
        yDrift={-6}
      />
      <Atmosphere />
      <ThresholdPulse delay={45} />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S11 — The Standard
// Slow push across document/decision field. Serious and restrained.
// ─────────────────────────────────────────────────────────────────────────────
export function S11_Standard({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S11_standard_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.05}
        xDrift={-10}
      />
      <Atmosphere />
    </SceneEnvelope>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S12 — Closing
// Corridor fully illuminated. Staged brand hold.
// Abraham of London → Governed Decision Intelligence → CTA → URL
// ─────────────────────────────────────────────────────────────────────────────
export function S12_Closing({ durationInFrames }: SceneProps) {
  return (
    <SceneEnvelope durationInFrames={durationInFrames}>
      <CinematicStill
        src="gdi_build/mapped_assets/S12_closing_still.png"
        durationInFrames={durationInFrames}
        zoomTo={1.04}
      />
      <Atmosphere />

      {/* Institutional brand plate — centred, staged reveal */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 70,
        }}
      >
        <FadeText
          delay={40}
          duration={35}
          style={{
            background: "rgba(3,3,5,0.78)",
            padding: "52px 80px",
            textAlign: "center",
            border: `1px solid rgba(201,169,110,0.14)`,
            minWidth: "680px",
            maxWidth: "820px",
          }}
        >
          {/* Institution name */}
          <FadeText delay={55} duration={28}>
            <p
              style={{
                ...mono,
                fontSize: "12px",
                letterSpacing: "0.46em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
                margin: 0,
              }}
            >
              Abraham of London
            </p>
          </FadeText>

          {/* Gold rule — institutional separator */}
          <GoldRule delay={90} />

          {/* Category — the declaration */}
          <FadeText delay={110} duration={32}>
            <p
              style={{
                ...serif,
                fontSize: "42px",
                fontStyle: "italic",
                lineHeight: 1.10,
                color: WHITE,
                margin: 0,
                marginBottom: "32px",
              }}
            >
              Governed Decision Intelligence
            </p>
          </FadeText>

          {/* Divider */}
          <FadeText delay={220} duration={20}>
            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.07)",
                margin: "0 0 28px 0",
              }}
            />
          </FadeText>

          {/* CTA */}
          <FadeText delay={240} duration={28}>
            <p
              style={{
                ...mono,
                fontSize: "14px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: DIM,
                margin: 0,
                marginBottom: "20px",
              }}
            >
              Submit one real decision
            </p>
          </FadeText>

          {/* URL */}
          <FadeText delay={360} duration={25}>
            <p
              style={{
                ...mono,
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: FAINT,
                margin: 0,
              }}
            >
              abrahamoflondon.org/engagements/operator-pilot
            </p>
          </FadeText>
        </FadeText>
      </AbsoluteFill>

      <GoldAccent position="bottom" delay={90} />
    </SceneEnvelope>
  );
}

// ── Ordered export — must match SCENE_DATA order in manifest.ts ───────────────

export const SCENE_COMPONENTS = [
  S01_Hook,
  S02_DecisionMap,
  S03_MarketProblem,
  S04_Corridor,
  S05_SystemResponse,
  S06_RefusalGate,
  S07_UserJourney,
  S08_CompoundingRecord,
  S09_EvidenceDetail,
  S10_OperatorPilot,
  S11_Standard,
  S12_Closing,
] as const;
