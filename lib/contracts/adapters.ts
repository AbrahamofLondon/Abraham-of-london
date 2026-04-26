/**
 * Source Adapters — convert product outputs into contract drafts.
 */

import type { ContractDraft } from "./engine";

/**
 * Contract from Purpose Alignment result.
 */
export function contractFromPurposeAlignment(input: {
  commitment: string;
  weakestDomain: string;
  patternTitle: string;
  ownerName?: string;
  ownerEmail?: string;
  deadline: string;
  consequenceOfInaction: string;
}): ContractDraft {
  return {
    source: "purpose_alignment",
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    commitment: input.commitment,
    avoidedPattern: `${input.patternTitle} — weakest domain: ${input.weakestDomain}`,
    consequenceOfInaction: input.consequenceOfInaction,
    canonSignals: ["MISALIGNMENT"],
    canonDefinitions: ["Alignment", "Discipline", "Purpose"],
    dueAt: input.deadline,
  };
}

/**
 * Contract from Strategy Room decision.
 */
export function contractFromStrategyRoomDecision(input: {
  decision: string;
  owner: string;
  ownerEmail?: string;
  deadline: string;
  costExposure?: string;
  enforcementSignals?: string[];
}): ContractDraft {
  return {
    source: "strategy_room",
    ownerName: input.owner,
    ownerEmail: input.ownerEmail,
    commitment: input.decision,
    consequenceOfInaction: input.costExposure ?? "Consequence not quantified — default path applies.",
    canonSignals: input.enforcementSignals ?? [],
    canonDefinitions: ["Responsibility", "Order", "Sovereignty"],
    dueAt: input.deadline,
  };
}

/**
 * Contract from Executive Report recommendation.
 */
export function contractFromExecutiveReport(input: {
  reportId: string;
  topRisk: string;
  recommendedMove: string;
  ownerEmail?: string;
  deadline: string;
  consequenceOfInaction: string;
}): ContractDraft {
  return {
    source: "executive_reporting",
    sourceId: input.reportId,
    ownerEmail: input.ownerEmail,
    commitment: input.recommendedMove,
    avoidedPattern: input.topRisk,
    consequenceOfInaction: input.consequenceOfInaction,
    canonSignals: ["RISK_EXPOSURE"],
    canonDefinitions: ["Risk", "Strategy", "Pressure"],
    dueAt: input.deadline,
  };
}

/**
 * Contract from Decision Instrument result.
 */
export function contractFromDecisionInstrument(input: {
  instrumentSlug: string;
  recommendation: string;
  ownerEmail?: string;
  deadline: string;
  exposureBand?: string;
}): ContractDraft {
  return {
    source: "decision_instrument",
    sourceId: input.instrumentSlug,
    ownerEmail: input.ownerEmail,
    commitment: input.recommendation,
    consequenceOfInaction: input.exposureBand === "CRITICAL" ? "Exposure is critical — delay compounds structural damage." : "Condition persists without correction.",
    canonSignals: input.exposureBand === "CRITICAL" ? ["RISK_EXPOSURE"] : [],
    canonDefinitions: ["Risk", "Discipline"],
    dueAt: input.deadline,
  };
}

/**
 * Contract from Toolkit action.
 */
export function contractFromToolkitAction(input: {
  toolkitSlug: string;
  action: string;
  ownerName?: string;
  ownerEmail?: string;
  deadline: string;
}): ContractDraft {
  return {
    source: "toolkit",
    sourceId: input.toolkitSlug,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    commitment: input.action,
    // Toolkit contracts do not require consequence
    canonSignals: [],
    canonDefinitions: ["Discipline", "Structure"],
    dueAt: input.deadline,
  };
}
