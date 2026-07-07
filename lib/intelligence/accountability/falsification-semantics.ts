/**
 * lib/intelligence/accountability/falsification-semantics.ts
 *
 * §6 — Proper falsification condition structure.
 *
 * A URL or scenario reference is NOT a falsification condition.
 * This module provides the canonical FalsificationCondition type and migration logic.
 */
export interface FalsificationCondition {
  conditionId: string;
  description: string;
  observable: string;
  threshold?: string;
  timeWindow?: string;
  evidenceSourceClass: string[];
  triggerLogic: string;
  status: "SPECIFIED" | "NOT_SPECIFIED_IN_SOURCE" | "REFERENCE_ONLY";
}

export function buildFalsificationCondition(source: {
  scenarioLink?: string | null;
  statement?: string;
  outcomeSummary?: string | null;
}): FalsificationCondition {
  // If there's a scenario link, preserve it as reference but don't manufacture condition text
  if (source.scenarioLink && source.scenarioLink.startsWith("http")) {
    return {
      conditionId: `fc_${Date.now()}`,
      description: "Referenced scenario — see source for details",
      observable: "Referenced scenario",
      evidenceSourceClass: ["external_reference"],
      triggerLogic: "See referenced scenario document",
      status: "REFERENCE_ONLY",
    };
  }

  // If there's descriptive text that looks like a condition, use it
  if (source.scenarioLink && !source.scenarioLink.startsWith("http") && source.scenarioLink.length > 10) {
    return {
      conditionId: `fc_${Date.now()}`,
      description: source.scenarioLink,
      observable: source.scenarioLink,
      evidenceSourceClass: ["stated_condition"],
      triggerLogic: "Monitor against stated condition",
      status: "SPECIFIED",
    };
  }

  // No condition available
  return {
    conditionId: `fc_${Date.now()}`,
    description: "No falsification condition specified in source",
    observable: "Not specified",
    evidenceSourceClass: [],
    triggerLogic: "Not specified",
    status: "NOT_SPECIFIED_IN_SOURCE",
  };
}

export function isConditionSpecified(condition: FalsificationCondition): boolean {
  return condition.status === "SPECIFIED";
}

export function isConditionReferenceOnly(condition: FalsificationCondition): boolean {
  return condition.status === "REFERENCE_ONLY";
}
