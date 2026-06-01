/**
 * lib/product/living-case-store.ts — Server-authoritative Living Case store.
 *
 * The Living Case is the atomic product object. Everything else is an interface into it.
 *
 * This module derives a server-authoritative Living Case view from existing Prisma models:
 * - DiagnosticJourney (case container, stages, tensions, route decisions)
 * - DiagnosticDecisionObject (canonical decision objects)
 * - DiagnosticEvidenceNode (evidence, contradictions, patterns, consequences)
 * - OutcomeVerificationRecord (outcome verification)
 * - StrategyRoomExecutionSession (execution state)
 * - DecisionLedger via getCreditProfile (trust score)
 *
 * No schema migration required. Uses existing models as persistence source.
 *
 * Rule: Server-side derived Living Case is authoritative. sessionStorage is a cache only.
 *       Any paid/deep route must use server-derived state.
 */

import { getDiagnosticJourney, type DiagnosticJourneyRecord } from "@/lib/diagnostics/journey-store";
import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { DiagnosticJourneyStage } from "@/lib/diagnostics/journey-store";
import type { EvidenceOrigin } from "@/lib/product/evidence-classification";
import type { SignalContinuity } from "@/lib/product/evidence-classification";
import { deriveEvidenceTierFromInputs } from "@/lib/product/evidence-tier-derivation";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LivingCaseDecision = {
  decisionKey: string;
  decisionText: string;
  sourceStage: string;
  confidence: number;
  constraintText: string | null;
  costOfDelayText: string | null;
  stakeholderText: string | null;
};

export type LivingCaseContradiction = {
  label: string;
  summary: string;
  severity: string;
  confidence: number;
  sourceStage: string;
};

export type LivingCaseEvidence = {
  kind: string;
  label: string;
  summary: string;
  severity: string;
  confidence: number;
  sourceStage: string;
};

export type LivingCase = {
  caseId: string;
  subjectKey: string;
  email: string | null;
  organisation: string | null;
  status: "open" | "active" | "under_intervention" | "monitoring" | "resolved" | "persistent";
  createdAt: string | null;

  // Evidence state
  evidenceTier: EvidenceTier;
  completedStages: DiagnosticJourneyStage[];
  stageCount: number;

  // Decisions
  decisions: LivingCaseDecision[];
  primaryDecision: LivingCaseDecision | null;

  // Contradictions
  contradictions: LivingCaseContradiction[];
  unresolvedTensions: string[];

  // Evidence
  evidenceNodes: LivingCaseEvidence[];
  evidenceNodeCount: number;

  // Route decisions
  routeDecisions: unknown[];
  latestDirective: string | null;

  // Escalation
  escalationHistory: unknown[];

  // Trust / credit
  decisionObjectCount: number;
};

export type LivingCaseQuery = {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  caseId?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE TIER DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map the canonical evidence level to the EvidenceTier type used by the Living Case.
 *
 * The canonical helper returns: none | single_source | multi_source | corroborated | verified
 * The EvidenceTier type expects: insufficient | single_source | multi_source | outcome_verified | human_reviewed
 *
 * Mapping is conservative: corroborated maps to multi_source (not outcome_verified),
 * and verified maps to outcome_verified (not human_reviewed).
 */
function mapCanonicalLevelToEvidenceTier(level: string): EvidenceTier {
  switch (level) {
    case "none":
      return "insufficient";
    case "single_source":
      return "single_source";
    case "multi_source":
      return "multi_source";
    case "corroborated":
      return "multi_source";
    case "verified":
      return "outcome_verified";
    default:
      return "insufficient";
  }
}

/**
 * Derive evidence tier using the canonical helper.
 *
 * Delegates to deriveEvidenceTierFromInputs() from lib/product/evidence-tier-derivation.ts
 * to ensure consistent evidence strength derivation across all surfaces.
 *
 * The canonical helper uses governed memory, completed stages, and session signals
 * to determine evidence level. This is more accurate than the previous stage-count-only
 * approach because it accounts for evidence origin quality and corroboration.
 */
function deriveEvidenceTier(stages: string[]): EvidenceTier {
  const result = deriveEvidenceTierFromInputs({
    completedStages: stages,
    // governedMemory is not available in this context (server-side journey data).
    // The canonical helper will derive from completed stages alone, which is safe
    // and conservative. When governedMemory is available (e.g., via the Decision Centre
    // adapter), it will produce a more accurate tier.
    currentSessionSignals: stages.map((s) => ({ signal: s })),
  });
  return mapCanonicalLevelToEvidenceTier(result.level);
}

function deriveCaseStatus(
  journey: DiagnosticJourneyRecord,
): LivingCase["status"] {
  const stages = Object.keys(journey.stages);
  if (stages.includes("strategy_room")) return "under_intervention";
  if (stages.includes("monitoring")) return "monitoring";
  if (stages.includes("executive_reporting")) return "active";
  if (stages.length > 0) return "open";
  return "open";
}

function extractLatestDirective(routeDecisions: unknown[]): string | null {
  for (let i = routeDecisions.length - 1; i >= 0; i--) {
    const d = routeDecisions[i];
    if (d && typeof d === "object") {
      const route = String((d as Record<string, unknown>).route || "");
      if (route) return route.toUpperCase();
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a server-authoritative Living Case from the diagnostic journey.
 * Uses existing Prisma-backed journey data. No new schema required.
 */
export async function deriveLivingCase(
  query: LivingCaseQuery,
): Promise<LivingCase | null> {
  const journey = await getDiagnosticJourney({
    email: query.email,
    subjectId: query.subjectId,
    campaignId: query.campaignId,
  });

  // If no meaningful data, return null
  const completedStages = Object.keys(journey.stages) as DiagnosticJourneyStage[];
  if (completedStages.length === 0 && journey.decisionObjects.length === 0) {
    return null;
  }

  const decisions: LivingCaseDecision[] = journey.decisionObjects.map((obj) => {
    const d = obj as Record<string, unknown>;
    return {
      decisionKey: String(d.decisionKey || ""),
      decisionText: String(d.decisionText || ""),
      sourceStage: String(d.sourceStage || ""),
      confidence: Number(d.confidence || 0),
      constraintText: d.constraintText ? String(d.constraintText) : null,
      costOfDelayText: d.costOfDelayText ? String(d.costOfDelayText) : null,
      stakeholderText: d.stakeholderText ? String(d.stakeholderText) : null,
    };
  });

  const contradictions: LivingCaseContradiction[] = journey.evidenceNodes
    .filter((n) => n.kind === "contradiction")
    .map((n) => ({
      label: n.label,
      summary: n.summary,
      severity: n.severity,
      confidence: n.confidence,
      sourceStage: n.sourceStage,
    }));

  const evidenceNodes: LivingCaseEvidence[] = journey.evidenceNodes.map((n) => ({
    kind: n.kind,
    label: n.label,
    summary: n.summary,
    severity: n.severity,
    confidence: n.confidence,
    sourceStage: n.sourceStage,
  }));

  return {
    caseId: journey.journeyKey,
    subjectKey: journey.subjectKey,
    email: journey.email || null,
    organisation: journey.organisation || null,
    status: deriveCaseStatus(journey),
    createdAt: journey.startedAt || null,
    evidenceTier: deriveEvidenceTier(completedStages),
    completedStages,
    stageCount: completedStages.length,
    decisions,
    primaryDecision: decisions[decisions.length - 1] || null,
    contradictions,
    unresolvedTensions: journey.mergedTensionThread,
    evidenceNodes,
    evidenceNodeCount: evidenceNodes.length,
    routeDecisions: journey.routeDecisions,
    latestDirective: extractLatestDirective(journey.routeDecisions),
    escalationHistory: journey.escalationHistory,
    decisionObjectCount: journey.decisionObjects.length,
  };
}

/**
 * Get the latest Living Case for an actor (by email).
 * Convenience wrapper for the most common lookup pattern.
 */
export async function getLatestLivingCaseForActor(
  email: string,
): Promise<LivingCase | null> {
  return deriveLivingCase({ email });
}

/**
 * Check whether a Living Case has sufficient evidence for a given surface.
 */
export function isAdmissibleFor(
  livingCase: LivingCase | null,
  surface: "executive_reporting" | "strategy_room",
): { admissible: boolean; reason: string } {
  if (!livingCase) {
    return { admissible: false, reason: "No Living Case exists for this identity." };
  }

  if (surface === "strategy_room") {
    if (!livingCase.completedStages.includes("constitutional")) {
      return { admissible: false, reason: "Constitutional Diagnostic not completed." };
    }
    if (livingCase.evidenceTier === "insufficient") {
      return { admissible: false, reason: "Evidence tier is insufficient." };
    }
    if (livingCase.decisions.length === 0) {
      return { admissible: false, reason: "No canonical decision object exists." };
    }
    return { admissible: true, reason: "Living Case meets Strategy Room admission requirements." };
  }

  if (surface === "executive_reporting") {
    if (livingCase.evidenceTier === "insufficient") {
      return { admissible: false, reason: "Evidence tier is insufficient." };
    }
    const hasUpstream = livingCase.completedStages.includes("enterprise") ||
      livingCase.completedStages.includes("executive_reporting");
    if (!hasUpstream) {
      return { admissible: false, reason: "Required upstream diagnostic not completed." };
    }
    return { admissible: true, reason: "Living Case meets Executive Reporting admission requirements." };
  }

  return { admissible: false, reason: `Unknown surface: ${surface}` };
}
