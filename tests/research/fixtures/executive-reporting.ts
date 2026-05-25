/**
 * tests/research/fixtures/executive-reporting.ts
 *
 * Synthetic fixtures for the Executive Reporting Foundry adapter.
 *
 * IMPORTANT:
 * - All data is illustrative. No real user, campaign, or human capital data.
 * - Figures are chosen to exercise specific state boundaries in buildExecutiveReport().
 * - DISORDERED: averageDissonance > 30 OR hcdAggregate.riskScore === "CRITICAL"
 * - MISALIGNED: averageDissonance > 12 OR !ogr.isAuthorizedToExecute
 * - ORDERED: averageDissonance <= 12 AND ogr.isAuthorizedToExecute
 */

import type { RawExecutiveResponse } from "@/lib/admin/reporting/derive-resonance-metrics";
import type { HCDMetrics } from "@/lib/alignment/human-capital-delta";
import type { OGRMetrics } from "@/lib/ogr/manifest-engine";
import type { BuildExecutiveReportInput } from "@/lib/admin/reporting/executive-report-builder";

// ─── DISORDERED ───────────────────────────────────────────────────────────────
// High dissonance across 3 domains + critical HCD burnout → DISORDERED state.
// Resonance:
//   LEADERSHIP_TRUST: intent=85, reality=(15+20)/2=17.5, dissonance=67.5
//   EXECUTION_AUTHORITY: intent=85, reality=25, dissonance=60
//   GOVERNANCE_DISCIPLINE: intent=85, reality=(20+16)/2=18, dissonance=67
//   averageDissonance ≈ (67.5 + 60 + 67) / 3 = 64.83 → > 30 → DISORDERED
// HCD:
//   LEADERSHIP_EXHAUSTION: burnoutIndex=82 → delta=82 → CRITICAL riskScore
//   criticalCount=1 → overallRiskScore="CRITICAL" → also triggers DISORDERED

export const DISORDERED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "LEADERSHIP_TRUST", intent: 85, reality: 15 },
  { domain: "LEADERSHIP_TRUST", intent: 85, reality: 20 },
  { domain: "EXECUTION_AUTHORITY", intent: 85, reality: 25 },
  { domain: "GOVERNANCE_DISCIPLINE", intent: 85, reality: 20 },
  { domain: "GOVERNANCE_DISCIPLINE", intent: 85, reality: 16 },
];

export const DISORDERED_HCD: HCDMetrics[] = [
  {
    label: "LEADERSHIP_EXHAUSTION",
    intent: 90,
    reality: 30,
    burnoutIndex: 82,
    wellbeing: 35,
    headcount: 5,
    tenure: 42,
    attritionRisk: "HIGH",
  },
  {
    label: "ENGINEERING_VELOCITY",
    intent: 100,
    reality: 42,
    burnoutIndex: 58,
    wellbeing: 42,
    headcount: 12,
    tenure: 18,
    attritionRisk: "MODERATE",
  },
];

export const DISORDERED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 35,
  marketFriction: 55,
  targetRevenue: 600,
  // sovereignCertainty = (35*0.7) + ((100-55)*0.3) = 24.5 + 13.5 = 38 → not authorized
};

export const DISORDERED_INPUT: BuildExecutiveReportInput = {
  responses: DISORDERED_RESPONSES,
  hcdMetrics: DISORDERED_HCD,
  ogrMetrics: DISORDERED_OGR,
};

// ─── MISALIGNED ───────────────────────────────────────────────────────────────
// Moderate dissonance (12–30%) + not authorized to execute → MISALIGNED state.
// Resonance:
//   MARKET_RESONANCE: intent=80, reality=(60+65)/2=62.5, dissonance=17.5
//   STAKEHOLDER_ALIGNMENT: intent=75, reality=60, dissonance=15
//   averageDissonance = (17.5 + 15) / 2 = 16.25 → > 12, not > 30 → MISALIGNED
// OGR:
//   sovereignCertainty = (65*0.7) + ((100-28)*0.3) = 45.5 + 21.6 = 67.1 → not authorized

export const MISALIGNED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "MARKET_RESONANCE", intent: 80, reality: 60 },
  { domain: "MARKET_RESONANCE", intent: 80, reality: 65 },
  { domain: "STAKEHOLDER_ALIGNMENT", intent: 75, reality: 60 },
];

export const MISALIGNED_HCD: HCDMetrics[] = [
  {
    label: "WORKLOAD_DISTRIBUTION",
    intent: 80,
    reality: 60,
    burnoutIndex: 45,
    wellbeing: 62,
    headcount: 18,
    tenure: 24,
    attritionRisk: "MODERATE",
  },
];

export const MISALIGNED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 65,
  marketFriction: 28,
  targetRevenue: 350,
};

export const MISALIGNED_INPUT: BuildExecutiveReportInput = {
  responses: MISALIGNED_RESPONSES,
  hcdMetrics: MISALIGNED_HCD,
  ogrMetrics: MISALIGNED_OGR,
};

// ─── ORDERED ──────────────────────────────────────────────────────────────────
// Low dissonance (<12%) + authorized to execute → ORDERED state.
// Resonance:
//   MARKET_RESONANCE: intent=85, reality=82, dissonance=3
//   PURPOSE_ALIGNMENT: intent=88, reality=85, dissonance=3
//   averageDissonance = 3 → < 12 → not DISORDERED, not MISALIGNED
// OGR:
//   sovereignCertainty = (92*0.7) + ((100-8)*0.3) = 64.4 + 27.6 = 92 → authorized

export const ORDERED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "MARKET_RESONANCE", intent: 85, reality: 82 },
  { domain: "PURPOSE_ALIGNMENT", intent: 88, reality: 85 },
];

export const ORDERED_HCD: HCDMetrics[] = [
  {
    label: "ENGINEERING_VELOCITY",
    intent: 90,
    reality: 88,
    burnoutIndex: 18,
    wellbeing: 82,
    headcount: 14,
    tenure: 22,
    attritionRisk: "LOW",
  },
];

export const ORDERED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 92,
  marketFriction: 8,
  targetRevenue: 250,
};

export const ORDERED_INPUT: BuildExecutiveReportInput = {
  responses: ORDERED_RESPONSES,
  hcdMetrics: ORDERED_HCD,
  ogrMetrics: ORDERED_OGR,
};
