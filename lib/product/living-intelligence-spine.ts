/**
 * Canonical living spine assembler.
 *
 * This file does not invent intelligence.
 * It consolidates outputs from the engines that already exist.
 */

import type { ConstitutionalAssessment } from "@/lib/constitution/assessment-types";
import type { DecisionKernelOutput } from "@/lib/decision/kernel";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { GovernedSynthesis } from "@/lib/decision/synthesis-engine";
import type { C3Score } from "@/lib/decision/c3-fidelity-scorer";
import type { SessionExecutionState } from "@/lib/execution/decision-state-engine";
import { computeDynamicConsequence } from "@/lib/execution/decision-state-engine";
import type { CostOfDelayResult } from "@/lib/diagnostics/cost-of-delay-engine";
import type { EconomicExposure } from "@/lib/constitution/economic";
import type { ConsequenceInput, ConsequenceNode } from "@/lib/constitution/consequence";
import { buildConsequenceTree } from "@/lib/constitution/consequence";
import type { CrossRespondentPayload } from "@/lib/diagnostics/cross-respondent-engine";
import type { OutcomeEvidenceSummary } from "@/lib/outcomes/evidence";
import type { CreditProfile, LedgerSummary, LedgerEntry } from "@/lib/decision-ledger/ledger-service";
import type { SimulationResult } from "@/lib/decision/simulation-engine";
import type { ImpactSimulation } from "@/lib/alignment/governance-logic";
import type { EscalationResult } from "@/lib/constitution/escalation-engine";

export type EvidenceTier =
  | "insufficient"
  | "single_source"
  | "multi_source"
  | "outcome_verified"
  | "human_reviewed";

export type LivingIntelligenceSpine = {
  subjectId: string | null;
  journeyId: string | null;
  stagesCompleted: string[];
  decision: {
    id: string | null;
    text: string | null;
    conditionClass: string | null;
    requiredAction: string | null;
    blocked: boolean;
    blockReason: string | null;
    authorityType: string | null;
  };
  contradictionGraph: DecisionKernelOutput["contradictionGraph"] | null;
  unresolvedTensions: string[];
  executionState: {
    systemState: SessionExecutionState["systemState"] | null;
    consequenceScore: number | null;
    consequenceTrend: "STABLE" | "ESCALATING" | "CRITICAL" | null;
    pendingActions: number;
    executedActions: number;
    blockedActions: number;
    escalationTriggers: string[];
    avoidancePatterns: string[];
  } | null;
  exposureModel: {
    costOfDelay: CostOfDelayResult | null;
    economic: EconomicExposure | null;
    consequence: ConsequenceNode[];
    governanceImpact: {
      contagionRisk: "LOW" | "MEDIUM" | "HIGH" | null;
      affectedDomains: string[];
      interventionUrgency: "LOW" | "MEDIUM" | "HIGH" | null;
      simulation: ImpactSimulation | null;
    } | null;
  };
  interventionStack: Array<{
    label: string;
    rationale: string | null;
    expectedEffect: string | null;
    confidence: number | null;
  }>;
  confidenceBand: "low" | "medium" | "high" | null;
  nextBestAction: string | null;
  outcomeMemory: {
    latestEntry: LedgerEntry | null;
    summary: LedgerSummary | null;
    evidence: OutcomeEvidenceSummary | null;
  };
  evidenceTier: EvidenceTier;
  calibrationConfidence: number | null;
  decisionCreditScore: CreditProfile | null;
  crossRespondent: CrossRespondentPayload | null;
  synthesis: GovernedSynthesis | null;
  c3: C3Score | null;
  assessment: ConstitutionalAssessment | null;
  escalationRoute: {
    currentRoute: string | null;
    escalationPermitted: boolean;
    escalationReason: string | null;
  } | null;
  actionSimulations: Array<{
    action: string;
    simulation: SimulationResult;
  }>;
};

export type AssemblyInput = {
  assessment?: ConstitutionalAssessment | null;
  decisionKernel?: DecisionKernelOutput | null;
  spine?: IntelligenceSpine | null;
  synthesis?: GovernedSynthesis | null;
  c3?: C3Score | null;
  executionState?: SessionExecutionState | null;
  costOfDelay?: CostOfDelayResult | null;
  economicExposure?: EconomicExposure | null;
  consequenceInput?: ConsequenceInput | null;
  crossRespondent?: CrossRespondentPayload | null;
  outcomeEvidence?: OutcomeEvidenceSummary | null;
  calibrationAccuracy?: number | null;
  decisionCreditScore?: CreditProfile | null;
  ledgerSummary?: LedgerSummary | null;
  governanceImpact?: {
    contagionRisk: "LOW" | "MEDIUM" | "HIGH" | null;
    affectedDomains: string[];
    interventionUrgency: "LOW" | "MEDIUM" | "HIGH" | null;
    simulation: ImpactSimulation | null;
  } | null;
  actionSimulations?: Array<{
    action: string;
    simulation: SimulationResult;
  }> | null;
  escalationResults?: EscalationResult[] | null;
};

function deriveEvidenceTier(input: AssemblyInput, stagesCompleted: string[]): EvidenceTier {
  if (input.outcomeEvidence?.confidence === "governed") return "outcome_verified";
  if (input.outcomeEvidence?.confidence === "directional") return "multi_source";
  if ((input.crossRespondent?.divergenceZones.length ?? 0) > 0 || stagesCompleted.length >= 3) {
    return "multi_source";
  }
  if (stagesCompleted.length >= 2) return "single_source";
  return "insufficient";
}

function deriveUnresolvedTensions(input: AssemblyInput): string[] {
  const tensions = new Set<string>();
  input.decisionKernel?.contradictionGraph.nodes
    .filter((node) => node.kind === "contradiction" && node.status === "active")
    .forEach((node) => tensions.add(node.summary || node.label));
  input.assessment?.profile.failureModes
    .filter((mode) => mode.triggered)
    .forEach((mode) => tensions.add(mode.label));
  input.crossRespondent?.divergenceZones
    .forEach((zone) => tensions.add(`${zone.domain} divergence (${zone.spread})`));
  return [...tensions];
}

function deriveInterventionStack(input: AssemblyInput): LivingIntelligenceSpine["interventionStack"] {
  const fromSims = (input.actionSimulations ?? []).map((entry) => ({
    label: entry.action,
    rationale: entry.simulation.recommendation,
    expectedEffect: entry.simulation.immediateEffect,
    confidence: entry.simulation.confidence,
  }));
  const fromAssessment = input.assessment?.readout.requiredNextMoves.map((move) => ({
    label: move,
    rationale: input.assessment?.readout.summary ?? null,
    expectedEffect: input.assessment?.readout.headline ?? null,
    confidence: null,
  })) ?? [];
  return [...fromSims, ...fromAssessment].slice(0, 12);
}

export function assembleLivingSpine(input: AssemblyInput): LivingIntelligenceSpine {
  const spine = input.spine ?? null;
  const kernel = input.decisionKernel ?? spine?.kernelOutput ?? null;
  const c3 = input.c3 ?? spine?.c3 ?? null;
  const synthesis = input.synthesis ?? spine?.synthesis ?? null;
  const stagesCompleted = [...new Set(spine?.history?.map((event) => event.stage) ?? [])];
  const evidenceTier = deriveEvidenceTier(input, stagesCompleted);
  const consequence = input.consequenceInput ? buildConsequenceTree(input.consequenceInput) : [];
  const consequenceState = input.executionState ? computeDynamicConsequence(input.executionState) : null;
  const nextBestAction =
    synthesis?.concreteMove
    ?? kernel?.decision.required
    ?? input.assessment?.readout.requiredNextMoves[0]
    ?? input.actionSimulations?.[0]?.simulation.recommendation
    ?? null;

  return {
    subjectId: spine?.email ?? null,
    journeyId: spine?.id ?? null,
    stagesCompleted,
    decision: {
      id: kernel?.id ?? spine?.case.id ?? null,
      text: spine?.case.decision ?? null,
      conditionClass: spine?.deterministic.conditionClass ?? null,
      requiredAction: kernel?.decision.required ?? synthesis?.concreteMove ?? null,
      blocked: kernel?.decision.blocked ?? false,
      blockReason: kernel?.decision.reason ?? null,
      authorityType: input.assessment?.profile.authorityType ?? null,
    },
    contradictionGraph: kernel?.contradictionGraph ?? null,
    unresolvedTensions: deriveUnresolvedTensions(input),
    executionState: input.executionState ? {
      systemState: input.executionState.systemState,
      consequenceScore: consequenceState?.score ?? input.executionState.consequenceScore,
      consequenceTrend: consequenceState?.trend ?? null,
      pendingActions: input.executionState.actions.filter((action) => action.status === "PENDING").length,
      executedActions: input.executionState.actions.filter((action) => action.status === "EXECUTED").length,
      blockedActions: input.executionState.actions.filter((action) => action.status === "BLOCKED").length,
      escalationTriggers: input.executionState.escalationTriggers,
      avoidancePatterns: input.executionState.avoidancePatterns,
    } : null,
    exposureModel: {
      costOfDelay: input.costOfDelay ?? null,
      economic: input.economicExposure ?? null,
      consequence,
      governanceImpact: input.governanceImpact ?? null,
    },
    interventionStack: deriveInterventionStack(input),
    confidenceBand: c3?.confidenceBand ?? null,
    nextBestAction,
    outcomeMemory: {
      latestEntry: input.ledgerSummary?.latestEntry ?? null,
      summary: input.ledgerSummary ?? null,
      evidence: input.outcomeEvidence ?? null,
    },
    evidenceTier,
    calibrationConfidence: input.calibrationAccuracy ?? null,
    decisionCreditScore: input.decisionCreditScore ?? null,
    crossRespondent: input.crossRespondent ?? null,
    synthesis,
    c3,
    assessment: input.assessment ?? null,
    escalationRoute: input.escalationResults && input.escalationResults.length > 0 ? {
      currentRoute: input.assessment?.decision.route ?? null,
      escalationPermitted: input.escalationResults.some((result) => result.permitted),
      escalationReason: input.escalationResults.find((result) => result.permitted)?.reason ?? input.escalationResults[0]?.reason ?? null,
    } : null,
    actionSimulations: input.actionSimulations ?? [],
  };
}
