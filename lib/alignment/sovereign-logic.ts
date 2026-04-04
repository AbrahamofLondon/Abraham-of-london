/* lib/alignment/sovereign-logic.ts — DECISION GOVERNANCE PROTOCOL */

import { PulseAnalysis } from "./hardened-pulse-engine";

export interface SovereignSnapshot {
  sovereignCertainty: number;        // C_sov (0-100)
  institutionalResonance: number;    // R (0-100)
  frictionIndex: number;             // F (0-100)
  isActionable: boolean;
  clearanceLevel: "ALPHA" | "BETA" | "GAMMA";
}

export interface SovereignInputs {
  resonance: number;                 // R (0-100)
  friction: number;                  // F (0-99.99 or 0-100 depending on caller)
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
  // Manifest hard-lock:
  // below 90 => no-go
  // LOW integrity => no-go
  return dataIntegrity !== "LOW" && certainty >= 90;
}

/* -------------------------------------------------------------------------- */
/* PURE MANIFEST FORMULA                                                       */
/* -------------------------------------------------------------------------- */
/**
 * Manifest Formula:
 *   C_sov = (R * 0.7) + ((100 - F) * 0.3)
 *
 * This is the authoritative implementation when you already have true
 * resonance (R) and friction (F) as explicit system inputs.
 */
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

/* -------------------------------------------------------------------------- */
/* TELEMETRY-DERIVED FRICTION                                                  */
/* -------------------------------------------------------------------------- */
/**
 * This converts telemetry analysis into a friction proxy.
 *
 * It is NOT the same thing as externally modelled market friction.
 * It is a governance-layer inference based on:
 * - confidence weakness
 * - internal disagreement / variance
 */
export function deriveFrictionFromTelemetry(analysis: PulseAnalysis): number {
  const confidenceScore = clamp(
    toFiniteNumber(analysis?.confidenceScore, 0),
    0,
    100
  );

  const varianceIndex = clamp(
    toFiniteNumber(analysis?.varianceIndex, 0),
    0,
    100
  );

  const confidenceWeakness = 100 - confidenceScore;

  // varianceIndex is treated as a standard-deviation-like value.
  // Scale 0-50 => 0-100, then clamp.
  const dissonanceFriction = clamp((varianceIndex / 50) * 100, 0, 100);

  // 60% confidence weakness, 40% disagreement
  return clamp(
    (confidenceWeakness * 0.6) + (dissonanceFriction * 0.4),
    0,
    100
  );
}

/* -------------------------------------------------------------------------- */
/* TELEMETRY PATH                                                              */
/* -------------------------------------------------------------------------- */
/**
 * Uses telemetry-derived resonance and derived friction proxy, then routes them
 * through the exact same sovereign formula.
 */
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

/* -------------------------------------------------------------------------- */
/* LEGACY COMPATIBILITY                                                        */
/* -------------------------------------------------------------------------- */
/**
 * Backward-compatible export.
 * Existing callers using calculateSovereignCertainty(analysis) will continue
 * to work via the telemetry path.
 */
export function calculateSovereignCertainty(
  analysis: PulseAnalysis
): SovereignSnapshot {
  return calculateSovereignCertaintyFromTelemetry(analysis);
}