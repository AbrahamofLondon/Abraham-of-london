/**
 * Institutional Case Summary — unified corridor intelligence aggregator.
 *
 * Assembles all engine outputs into a single IP-safe summary:
 * - Decision record summary (kernel safe projection)
 * - Stakeholder pressure summary
 * - Scenario pressure (simulation safe projection)
 * - Contradiction pressure metrics
 * - Irreversibility estimate
 * - Cost-of-inaction estimate
 * - Corridor surface status
 *
 * Consumers: Boardroom, Counsel, Oversight, Portfolio Memory, Strategy Room.
 *
 * Every field is source-labelled. No raw engine output reaches this contract.
 */

import type { KernelSafeSummary } from "@/lib/product/kernel-safe-summary";
import type { ContradictionGraphSafeMetrics } from "@/lib/analytics/contradiction-graph-presenter";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export type StakeholderPressureSummary = {
  decisionOwner: string | null;
  affectedGroups: string[];
  unresolvedAuthorityTension: string | null;
  potentialBlockers: string[];
  sourceLabel: string;
  evidencePosture: string;
  thinState: boolean;
};

export type SimulationSafeSummary = {
  likelyConsequence: string;
  bestControlledPath: string;
  worstAvoidablePath: string;
  uncertaintyCaveat: string;
  sourceLabel: string;
  evidencePosture: string;
  thinState: boolean;
};

export type IrreversibilityEstimate = {
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "IRREVERSIBLE";
  score: number;
  summary: string;
  sourceLabel: string;
  evidencePosture: string;
};

export type CostOfInactionEstimate = {
  accumulatedCost: number;
  daysElapsed: number;
  basis: string;
  explanation: string;
  sourceLabel: string;
  evidencePosture: string;
};

export type CorridorSurfaceStatus = {
  executiveReport: boolean;
  strategyRoom: boolean;
  counsel: boolean;
  boardroom: boolean;
  oversight: boolean;
  cadence: boolean;
  outcomeHistory: boolean;
  portfolioMemory: boolean;
};

export type InstitutionalCaseSummary = {
  caseId: string;
  generatedAt: string;

  decisionRecordSummary: KernelSafeSummary | null;
  stakeholderPressure: StakeholderPressureSummary | null;
  scenarioPressure: SimulationSafeSummary | null;
  contradictionPressure: ContradictionGraphSafeMetrics | null;
  irreversibilityEstimate: IrreversibilityEstimate | null;
  costOfInactionEstimate: CostOfInactionEstimate | null;

  corridorStatus: CorridorSurfaceStatus;

  sourceLabels: string[];
  limitations: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildInstitutionalCaseSummary(input: {
  caseId: string;
  kernelSafe?: KernelSafeSummary | null;
  stakeholder?: StakeholderPressureSummary | null;
  simulation?: SimulationSafeSummary | null;
  contradictions?: ContradictionGraphSafeMetrics | null;
  irreversibility?: IrreversibilityEstimate | null;
  costOfInaction?: CostOfInactionEstimate | null;
  corridorStatus: CorridorSurfaceStatus;
}): InstitutionalCaseSummary {
  const sourceLabels: string[] = [];
  const limitations: string[] = [];

  if (input.kernelSafe) {
    sourceLabels.push(...input.kernelSafe.sourceSurfaces);
    limitations.push(...input.kernelSafe.limitations);
  }
  if (input.stakeholder) {
    sourceLabels.push(input.stakeholder.sourceLabel);
    if (input.stakeholder.thinState) {
      limitations.push("Stakeholder pressure is based on limited evidence.");
    }
  }
  if (input.simulation) {
    sourceLabels.push(input.simulation.sourceLabel);
    if (input.simulation.thinState) {
      limitations.push("Scenario estimates are based on limited evidence.");
    }
  }
  if (input.contradictions) {
    sourceLabels.push(input.contradictions.sourceLabel);
    limitations.push(...input.contradictions.limitations);
  }
  if (input.irreversibility) {
    sourceLabels.push(input.irreversibility.sourceLabel);
  }
  if (input.costOfInaction) {
    sourceLabels.push(input.costOfInaction.sourceLabel);
  }

  // Deduplicate
  const uniqueSourceLabels = [...new Set(sourceLabels)];
  const uniqueLimitations = [...new Set(limitations)];

  return {
    caseId: input.caseId,
    generatedAt: new Date().toISOString(),
    decisionRecordSummary: input.kernelSafe ?? null,
    stakeholderPressure: input.stakeholder ?? null,
    scenarioPressure: input.simulation ?? null,
    contradictionPressure: input.contradictions ?? null,
    irreversibilityEstimate: input.irreversibility ?? null,
    costOfInactionEstimate: input.costOfInaction ?? null,
    corridorStatus: input.corridorStatus,
    sourceLabels: uniqueSourceLabels,
    limitations: uniqueLimitations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE PRESENTERS — convert raw engine outputs to summary-safe shapes
// ─────────────────────────────────────────────────────────────────────────────

import type { StakeholderMap } from "@/lib/decision/intelligence-spine";
import type { SimulationResult } from "@/lib/decision/simulation-engine";
import type { IrreversibilityIndex } from "@/lib/product/irreversibility-index";
import type { CostOfInactionClockResult } from "@/lib/product/cost-of-inaction-clock";

/**
 * Convert stakeholder map to sponsor-safe pressure summary.
 * No raw inference algorithms or hidden inferred identities are exposed.
 */
export function buildStakeholderPressureSummary(
  map: StakeholderMap,
  displayLabels?: string[],
): StakeholderPressureSummary {
  const hasData = !!(map.formalOwner || map.realOwner || map.blockers.length > 0);

  const unresolvedTension =
    map.realOwner && map.formalOwner && map.realOwner !== map.formalOwner
      ? `The stated owner (${map.formalOwner}) may not be the actual decision-maker. Evidence suggests a different authority structure.`
      : map.misalignedParties.length > 0
        ? map.misalignedParties[0]!
        : null;

  return {
    decisionOwner: map.formalOwner,
    affectedGroups: [
      ...(map.blockers.length > 0 ? [`Blocking: ${map.blockers.slice(0, 3).join(", ")}`] : []),
      ...(map.silentInfluencers.length > 0 ? ["Unnamed influence detected in prior attempts"] : []),
      ...(displayLabels ?? []),
    ],
    unresolvedAuthorityTension: unresolvedTension,
    potentialBlockers: map.blockers.slice(0, 5),
    sourceLabel: "Stakeholder pressure summary",
    evidencePosture: map.formalOwner ? "USER_REPORTED" : "SYSTEM_INFERRED",
    thinState: !hasData,
  };
}

/**
 * Convert simulation result to sponsor-safe scenario summary.
 * No simulation formula, probability model, or thresholds are exposed.
 */
export function buildSimulationSafeSummary(
  result: SimulationResult,
): SimulationSafeSummary {
  return {
    likelyConsequence: result.immediateEffect,
    bestControlledPath: result.recommendation,
    worstAvoidablePath: result.secondOrderEffect,
    uncertaintyCaveat: result.confidence < 0.5
      ? "This scenario estimate has low confidence. It is based on current evidence and has not been independently verified. Requires review if used for board decision-making."
      : "This is a scenario estimate based on current record. It has not been independently verified.",
    sourceLabel: "Scenario pressure estimate",
    evidencePosture: result.confidence >= 0.7 ? "MEASURED" : "SYSTEM_INFERRED",
    thinState: result.confidence < 0.3,
  };
}

/**
 * Convert irreversibility index to sponsor-safe estimate.
 */
export function buildIrreversibilityEstimate(
  index: IrreversibilityIndex,
): IrreversibilityEstimate {
  return {
    level: index.level,
    score: index.score,
    summary: `Irreversibility estimate: ${index.level.toLowerCase()} (${index.score}/100). ${index.summary}`,
    sourceLabel: "Irreversibility estimate — based on stated evidence, not independently verified",
    evidencePosture: "SYSTEM_INFERRED",
  };
}

/**
 * Convert cost-of-inaction result to sponsor-safe estimate.
 */
export function buildCostOfInactionEstimate(
  result: CostOfInactionClockResult,
): CostOfInactionEstimate {
  return {
    accumulatedCost: result.accumulatedCost,
    daysElapsed: result.daysElapsed,
    basis: result.basis,
    explanation: `Cost-of-inaction estimate: ${result.explanation}`,
    sourceLabel: "Cost-of-inaction estimate — based on stated evidence, not independently verified",
    evidencePosture: result.basis === "UNAVAILABLE" ? "INSUFFICIENT_DATA" : "SYSTEM_INFERRED",
  };
}
