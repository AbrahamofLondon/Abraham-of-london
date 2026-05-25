/**
 * tests/research/fixtures/executive-report-boardroom-bridge.ts
 *
 * Synthetic fixtures for the ER → Boardroom Bridge adapter tests.
 * No real customer data. No personally identifiable information.
 *
 * Fixtures:
 *   1. disordered-high-cost-qualifies — DISORDERED state, high financial exposure
 *   2. misaligned-borderline — MISALIGNED state, moderate exposure
 *   3. ordered-does-not-qualify — ORDERED state, low exposure
 *   4. mapping-gap-insufficient — Designed to produce mapping gaps
 *   5. malformed-report-safe-failure — Invalid report for safe failure testing
 */

import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";

const FIXTURE_TIMESTAMP = "2026-05-25T08:00:00.000Z";

// ─── 1. Disordered High Cost — Qualifies ──────────────────────────────────────
// DISORDERED state, high dissonance, high financial exposure
// Should produce QUALIFIES bridge decision

export const DISORDERED_HIGH_COST_REPORT: ExecutiveReport = {
  state: "DISORDERED",
  narrative: {
    headline: "Systemic Disorder Detected",
    summary: "Average dissonance has reached 64.8%. Burnout risk is CRITICAL. Execution authority is not credible under present conditions.",
    mandate: "Suspend acceleration. Contain drift in LEADERSHIP_TRUST, stabilize human capital exposure, and re-establish governable order.",
  },
  ogr: {
    integrationTax: 0.45,
    velocityMultiplier: 0.32,
    resonanceAlpha: 0.28,
    sovereignCertainty: 38.0,
    isAuthorizedToExecute: false,
  },
  resonance: {
    telemetry: {
      averageDissonance: 64.8,
      domainCount: 3,
      totalResponses: 5,
      weakestDomain: "LEADERSHIP_TRUST",
      strongestDomain: "GOVERNANCE_DISCIPLINE",
      isDisordered: true,
      metrics: [
        { label: "LEADERSHIP_TRUST", dissonance: 67.5, intent: 85, reality: 17.5, responseCount: 2 },
        { label: "EXECUTION_AUTHORITY", dissonance: 60, intent: 85, reality: 25, responseCount: 1 },
        { label: "GOVERNANCE_DISCIPLINE", dissonance: 67, intent: 85, reality: 18, responseCount: 2 },
      ],
    },
    metrics: [
      { label: "LEADERSHIP_TRUST", dissonance: 67.5, intent: 85, reality: 17.5, responseCount: 2 },
      { label: "EXECUTION_AUTHORITY", dissonance: 60, intent: 85, reality: 25, responseCount: 1 },
      { label: "GOVERNANCE_DISCIPLINE", dissonance: 67, intent: 85, reality: 18, responseCount: 2 },
    ],
  },
  hcd: [
    {
      label: "LEADERSHIP_EXHAUSTION",
      intent: 90,
      reality: 30,
      burnoutIndex: 82,
      wellbeing: 35,
      headcount: 5,
      tenure: 42,
      attritionRisk: "HIGH",
      delta: 60,
      replacementCost: 75000,
      recommendation: "Immediate leadership intervention required.",
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
      delta: 58,
      replacementCost: 96000,
      recommendation: "Reduce sprint pressure and address burnout.",
    },
  ],
  hcdAggregate: {
    averageDelta: 59.0,
    overallBurnoutIndex: 70,
    criticalCount: 1,
    elevatedCount: 1,
    criticalDomains: ["LEADERSHIP_EXHAUSTION"],
    totalReplacementCost: 171000,
    riskScore: "CRITICAL",
  },
  financialExposure: {
    replacementCost: 171000,
    executionLoss: 85000,
    totalExposure: 256000,
  },
  priorityStack: [
    "Suspend execution — alignment not verified",
    "Correct LEADERSHIP_TRUST (dissonance: 68%)",
    "Immediate leadership intervention required",
    "Reduce sprint pressure and address burnout",
  ],
  failureModes: [
    "Execution Stall",
    "Capacity Saturation",
    "Leadership Signal Erosion",
    "Unauthorized Expansion",
    "Systemic Governance Fracture",
  ],
};

// ─── 2. Misaligned Borderline ─────────────────────────────────────────────────
// MISALIGNED state, moderate exposure (~£125k)
// Should produce BORDERLINE bridge decision

export const MISALIGNED_BORDERLINE_REPORT: ExecutiveReport = {
  state: "MISALIGNED",
  narrative: {
    headline: "Structural Misalignment Identified",
    summary: "Average dissonance is 16.25%. Sovereign certainty stands at 67.1%. The system remains operational, but not clean.",
    mandate: "Correct MARKET_RESONANCE, reduce avoidable drag, and withhold full execution until the certainty threshold is restored.",
  },
  ogr: {
    integrationTax: 0.28,
    velocityMultiplier: 0.55,
    resonanceAlpha: 0.42,
    sovereignCertainty: 67.1,
    isAuthorizedToExecute: false,
  },
  resonance: {
    telemetry: {
      averageDissonance: 16.25,
      domainCount: 2,
      totalResponses: 3,
      weakestDomain: "MARKET_RESONANCE",
      strongestDomain: "STAKEHOLDER_ALIGNMENT",
      isDisordered: false,
      metrics: [
        { label: "MARKET_RESONANCE", dissonance: 17.5, intent: 80, reality: 62.5, responseCount: 2 },
        { label: "STAKEHOLDER_ALIGNMENT", dissonance: 15, intent: 75, reality: 60, responseCount: 1 },
      ],
    },
    metrics: [
      { label: "MARKET_RESONANCE", dissonance: 17.5, intent: 80, reality: 62.5, responseCount: 2 },
      { label: "STAKEHOLDER_ALIGNMENT", dissonance: 15, intent: 75, reality: 60, responseCount: 1 },
    ],
  },
  hcd: [
    {
      label: "WORKLOAD_DISTRIBUTION",
      intent: 80,
      reality: 60,
      burnoutIndex: 45,
      wellbeing: 62,
      headcount: 18,
      tenure: 24,
      attritionRisk: "MODERATE",
      delta: 20,
      replacementCost: 54000,
      recommendation: "Review workload distribution across teams.",
    },
  ],
  hcdAggregate: {
    averageDelta: 20.0,
    overallBurnoutIndex: 45,
    criticalCount: 0,
    elevatedCount: 1,
    criticalDomains: [],
    totalReplacementCost: 54000,
    riskScore: "MODERATE",
  },
  financialExposure: {
    replacementCost: 54000,
    executionLoss: 71250,
    totalExposure: 125250,
  },
  priorityStack: [
    "Correct MARKET_RESONANCE (dissonance: 18%)",
    "Review workload distribution across teams",
  ],
  failureModes: [
    "Execution Stall",
  ],
};

// ─── 3. Ordered Does Not Qualify ──────────────────────────────────────────────
// ORDERED state, low exposure (~£15k)
// Should produce DOES_NOT_QUALIFY bridge decision

export const ORDERED_DOES_NOT_QUALIFY_REPORT: ExecutiveReport = {
  state: "ORDERED",
  narrative: {
    headline: "Institutional Order Verified",
    summary: "Average dissonance is 3%. Burnout remains within controlled limits and the execution environment is governable.",
    mandate: "Proceed with controlled execution. Maintain present discipline and monitor PURPOSE_ALIGNMENT for signal decay.",
  },
  ogr: {
    integrationTax: 0.08,
    velocityMultiplier: 0.92,
    resonanceAlpha: 0.88,
    sovereignCertainty: 92.0,
    isAuthorizedToExecute: true,
  },
  resonance: {
    telemetry: {
      averageDissonance: 3,
      domainCount: 2,
      totalResponses: 2,
      weakestDomain: null,
      strongestDomain: "PURPOSE_ALIGNMENT",
      isDisordered: false,
      metrics: [
        { label: "MARKET_RESONANCE", dissonance: 3, intent: 85, reality: 82, responseCount: 1 },
        { label: "PURPOSE_ALIGNMENT", dissonance: 3, intent: 88, reality: 85, responseCount: 1 },
      ],
    },
    metrics: [
      { label: "MARKET_RESONANCE", dissonance: 3, intent: 85, reality: 82, responseCount: 1 },
      { label: "PURPOSE_ALIGNMENT", dissonance: 3, intent: 88, reality: 85, responseCount: 1 },
    ],
  },
  hcd: [
    {
      label: "ENGINEERING_VELOCITY",
      intent: 90,
      reality: 88,
      burnoutIndex: 18,
      wellbeing: 82,
      headcount: 14,
      tenure: 22,
      attritionRisk: "LOW",
      delta: 2,
      replacementCost: 12000,
      recommendation: "Maintain current operating discipline.",
    },
  ],
  hcdAggregate: {
    averageDelta: 2.0,
    overallBurnoutIndex: 18,
    criticalCount: 0,
    elevatedCount: 0,
    criticalDomains: [],
    totalReplacementCost: 12000,
    riskScore: "LOW",
  },
  financialExposure: {
    replacementCost: 12000,
    executionLoss: 3750,
    totalExposure: 15750,
  },
  priorityStack: [
    "Maintain operating discipline and preserve signal integrity",
  ],
  failureModes: [],
};

// ─── 4. Mapping Gap Insufficient ──────────────────────────────────────────────
// Minimal report with missing fields to trigger mapping gaps
// Should produce MAPPING_INSUFFICIENT bridge decision

export const MAPPING_GAP_INSUFFICIENT_REPORT: ExecutiveReport = {
  state: "DISORDERED",
  narrative: {
    headline: "Systemic Disorder Detected",
    summary: "Critical failure detected across multiple domains.",
    mandate: "Immediate intervention required.",
  },
  ogr: {
    integrationTax: 0,
    velocityMultiplier: 0,
    resonanceAlpha: 0,
    sovereignCertainty: 0,
    isAuthorizedToExecute: false,
  },
  resonance: {
    telemetry: {
      averageDissonance: 0,
      domainCount: 0,
      totalResponses: 0,
      weakestDomain: null,
      strongestDomain: null,
      isDisordered: false,
      metrics: [],
    },
    metrics: [],
  },
  hcd: [],
  hcdAggregate: {
    averageDelta: 0,
    overallBurnoutIndex: 0,
    criticalCount: 0,
    elevatedCount: 0,
    criticalDomains: [],
    totalReplacementCost: 0,
    riskScore: "LOW",
  },
  financialExposure: {
    replacementCost: 0,
    executionLoss: 0,
    totalExposure: 0,
  },
  priorityStack: [],
  failureModes: [],
};

// ─── 5. Malformed Report Safe Failure ─────────────────────────────────────────
// Intentionally invalid/malformed to test safe failure handling
// This is a partial object that will be caught by the bridge adapter

export const MALFORMED_REPORT_SAFE_FAILURE = {
  // Intentionally missing state and other required fields
  narrative: {
    headline: "",
    summary: "",
    mandate: "",
  },
  ogr: undefined,
  resonance: undefined,
  hcd: undefined,
  hcdAggregate: undefined,
  financialExposure: undefined,
  priorityStack: undefined,
  failureModes: undefined,
} as unknown as ExecutiveReport;

// ─── Fixture Map ──────────────────────────────────────────────────────────────

export const BRIDGE_FIXTURES: Record<string, ExecutiveReport> = {
  "disordered-high-cost-qualifies": DISORDERED_HIGH_COST_REPORT,
  "misaligned-borderline": MISALIGNED_BORDERLINE_REPORT,
  "ordered-does-not-qualify": ORDERED_DOES_NOT_QUALIFY_REPORT,
  "mapping-gap-insufficient": MAPPING_GAP_INSUFFICIENT_REPORT,
};

export const BRIDGE_FIXTURE_KEYS = Object.keys(BRIDGE_FIXTURES);
