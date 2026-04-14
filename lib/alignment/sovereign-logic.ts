/* lib/alignment/sovereign-logic.ts — DECISION GOVERNANCE PROTOCOL */

import { PulseAnalysis } from "./hardened-pulse-engine";

export interface SovereignSnapshot {
  sovereignCertainty: number;
  institutionalResonance: number;
  frictionIndex: number;
  isActionable: boolean;
  clearanceLevel: "ALPHA" | "BETA" | "GAMMA";
}

export interface SovereignInputs {
  resonance: number;
  friction: number;
  dataIntegrity?: "HIGH" | "MEDIUM" | "LOW";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : fallback;
  return Number.isFinite(n) ? n : fallback;
}

function roundInt(value: number): number {
  return Math.round(value);
}

function resolveClearance(
  certainty: number,
  dataIntegrity: "HIGH" | "MEDIUM" | "LOW"
): "ALPHA" | "BETA" | "GAMMA" {
  if (certainty >= 90 && dataIntegrity === "HIGH") return "ALPHA";
  if (certainty >= 75 && dataIntegrity !== "LOW") return "BETA";
  return "GAMMA";
}

function resolveActionability(
  certainty: number,
  dataIntegrity: "HIGH" | "MEDIUM" | "LOW"
): boolean {
  return dataIntegrity !== "LOW" && certainty >= 90;
}

export function calculateSovereignCertaintyFromInputs(
  inputs: SovereignInputs
): SovereignSnapshot {
  const R = clamp(toFiniteNumber(inputs?.resonance, 0), 0, 100);
  const F = clamp(toFiniteNumber(inputs?.friction, 0), 0, 100);
  const dataIntegrity = inputs?.dataIntegrity ?? "HIGH";
  const C_sov = clamp((R * 0.7) + ((100 - F) * 0.3), 0, 100);

  return {
    sovereignCertainty: roundInt(C_sov),
    institutionalResonance: roundInt(R),
    frictionIndex: roundInt(F),
    isActionable: resolveActionability(C_sov, dataIntegrity),
    clearanceLevel: resolveClearance(C_sov, dataIntegrity),
  };
}

export function deriveFrictionFromTelemetry(analysis: PulseAnalysis): number {
  const confidenceScore = clamp(
    toFiniteNumber(analysis?.confidenceScore, 0),
    0,
    100
  );

  // PulseAnalysis does not expose varianceIndex directly.
  // standardError is the dispersion proxy — measures spread across
  // weighted telemetry nodes. Scale 0-50 => 0-100 then clamp.
  const varianceProxy = clamp(
    toFiniteNumber(analysis?.standardError, 0),
    0,
    100
  );

  const confidenceWeakness = 100 - confidenceScore;
  const dissonanceFriction = clamp((varianceProxy / 50) * 100, 0, 100);

  return clamp(
    (confidenceWeakness * 0.6) + (dissonanceFriction * 0.4),
    0,
    100
  );
}

export function calculateSovereignCertaintyFromTelemetry(
  analysis: PulseAnalysis
): SovereignSnapshot {
  const R = clamp(toFiniteNumber(analysis?.weightedScore, 0), 0, 100);
  const F = deriveFrictionFromTelemetry(analysis);
  const dataIntegrity = analysis?.dataIntegrity ?? "LOW";

  return calculateSovereignCertaintyFromInputs({
    resonance: R,
    friction: F,
    dataIntegrity,
  });
}

export function calculateSovereignCertainty(
  analysis: PulseAnalysis
): SovereignSnapshot {
  return calculateSovereignCertaintyFromTelemetry(analysis);
}