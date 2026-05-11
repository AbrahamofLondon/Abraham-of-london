/**
 * lib/alignment/purpose-alignment-corridor-bridge.ts
 *
 * CORRIDOR BRIDGE — Purpose Alignment → Executive Reporting / Strategy Room
 *
 * When the Purpose Alignment paid result justifies escalation, this module
 * builds the bridge payload that Executive Reporting and Strategy Room
 * consume. It ensures the corridor is:
 *
 *   Purpose Alignment → Decision Centre → Executive Reporting → Strategy Room → Boardroom
 *
 * And also supports the future standalone corridor:
 *
 *   Personal Mandate → Decision Pattern → Obligation Conflict → Alignment Drift →
 *   Execution Integrity → Life/Work Governance
 */

import type { PurposeAlignmentPaidResult } from "./purpose-alignment-paid-contract";
import type { PurposeAlignmentEvidenceCarryForward } from "./evidence-loader";

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE PAYLOAD — what gets carried forward
// ─────────────────────────────────────────────────────────────────────────────

export type PurposeAlignmentCorridorBridgePayload = {
  /** Source surface identifier */
  sourceSurface: "PURPOSE_ALIGNMENT";
  /** When the assessment was completed */
  assessedAt: string;
  /** The paid result ID */
  resultId: string;
  /** Coherence band */
  coherenceBand: string;
  /** Severity */
  severity: string;
  /** Whether escalation is justified */
  escalationJustified: boolean;
  /** Target surface for escalation */
  escalationTarget: "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "BOARDROOM" | "NONE";

  // ── MANDATE ──
  mandate: {
    declared: string;
    operatingSentence: string;
    alignmentBand: string;
    viability: string;
  };

  // ── OBLIGATION CONFLICT ──
  obligationConflict: {
    primary: string;
    consequence: string;
    nature: string;
  };

  // ── PATTERN ──
  pattern: {
    primaryLabel: string;
    primaryId: string;
    recurrenceRisk: string;
    triggerConditions: string[];
  };

  // ── DRIFT ──
  drift: {
    active: boolean;
    direction: string;
    epicentre: string[];
    correctiveVector: string;
  };

  // ── EXECUTION ──
  execution: {
    integrityScore: number;
    integrityImpacted: boolean;
    mustProtect: string[];
    mustStop: string[];
  };

  // ── CONSTITUTION ──
  constitution: {
    governingPrinciple: string;
    decisionRules: string[];
    escalationTriggers: string[];
  };

  // ── NEXT MOVE ──
  nextMove: {
    move: string;
    timeSensitivity: string;
    costOfDelay: string;
  };

  // ── DOMAIN SCORES ──
  domainScores: Array<{
    domain: string;
    label: string;
    percent: number;
  }>;

  // ── CONTRADICTIONS ──
  contradictions: Array<{
    type: string;
    severity: string;
    evidence: string;
  }>;

  // ── CORRECTIONS ──
  corrections: string[];
  firstAction: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILD BRIDGE PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export function buildCorridorBridgePayload(
  paidResult: PurposeAlignmentPaidResult,
): PurposeAlignmentCorridorBridgePayload {
  return {
    sourceSurface: "PURPOSE_ALIGNMENT",
    assessedAt: paidResult.createdAt,
    resultId: paidResult.resultId,
    coherenceBand: paidResult.coherenceBand,
    severity: paidResult.severity,
    escalationJustified: paidResult.corridorBridge.bridgeJustified,
    escalationTarget: paidResult.corridorBridge.targetSurface,

    mandate: {
      declared: paidResult.mandateReading.declaredMandate,
      operatingSentence: paidResult.mandateReading.operatingMandateSentence,
      alignmentBand: paidResult.mandateReading.alignmentBand,
      viability: paidResult.mandateReading.mandateViability,
    },

    obligationConflict: {
      primary: paidResult.obligationConflictMap.primaryCompetingObligation,
      consequence: paidResult.obligationConflictMap.consequenceIfUnresolved,
      nature: paidResult.obligationConflictMap.obligationNature,
    },

    pattern: {
      primaryLabel: paidResult.decisionBehaviourPattern.primaryPattern.label,
      primaryId: paidResult.decisionBehaviourPattern.primaryPattern.id,
      recurrenceRisk: paidResult.decisionBehaviourPattern.recurrenceRisk,
      triggerConditions: paidResult.decisionBehaviourPattern.triggerConditions,
    },

    drift: {
      active: paidResult.alignmentDriftWarning.driftActive,
      direction: paidResult.alignmentDriftWarning.driftDirection,
      epicentre: paidResult.alignmentDriftWarning.driftEpicentre,
      correctiveVector: paidResult.alignmentDriftWarning.correctiveVector,
    },

    execution: {
      integrityScore: paidResult.executionIntegrityImplication.integrityScore,
      integrityImpacted: paidResult.executionIntegrityImplication.integrityImpacted,
      mustProtect: paidResult.executionIntegrityImplication.mustProtect,
      mustStop: paidResult.executionIntegrityImplication.mustStop,
    },

    constitution: {
      governingPrinciple: paidResult.personalDecisionConstitution.governingPrinciple,
      decisionRules: paidResult.personalDecisionConstitution.decisionRules,
      escalationTriggers: paidResult.personalDecisionConstitution.escalationTriggers,
    },

    nextMove: {
      move: paidResult.nextAdmissibleMove.move,
      timeSensitivity: paidResult.nextAdmissibleMove.timeSensitivity,
      costOfDelay: paidResult.nextAdmissibleMove.costOfDelay,
    },

    domainScores: paidResult.domainProfiles.map((d) => ({
      domain: d.domain,
      label: d.label,
      percent: d.percent,
    })),

    contradictions: paidResult.contradictions.map((c) => ({
      type: c.type,
      severity: c.severity,
      evidence: c.evidence,
    })),

    corrections: paidResult.corrections,
    firstAction: paidResult.freeResult.firstAction ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE TO EVIDENCE CARRY FORWARD — converts paid result to the existing
// PurposeAlignmentEvidenceCarryForward format that ER already consumes
// ─────────────────────────────────────────────────────────────────────────────

export function paidResultToEvidenceCarryForward(
  paidResult: PurposeAlignmentPaidResult,
): PurposeAlignmentEvidenceCarryForward {
  return {
    available: true,
    sourceSurface: "PURPOSE_ALIGNMENT",
    assessedAt: paidResult.createdAt,
    schemaVersion: "2.0.0",
    profile: paidResult.coherenceBand,
    compositeScore: paidResult.freeResult.percent,
    strongestDomain: paidResult.domainProfiles.reduce((best, current) =>
      current.percent > (best?.percent ?? 0) ? current : best,
    )?.domain ?? null,
    weakestDomain: paidResult.weakestDomains[0] ?? null,
    competingObligation: paidResult.obligationConflictMap.primaryCompetingObligation,
    consequence: paidResult.obligationConflictMap.consequenceIfUnresolved,
    institutionalConsequence: null,
    primaryPattern: paidResult.decisionBehaviourPattern.primaryPattern.label,
    patternConsequence: paidResult.decisionBehaviourPattern.primaryPattern.consequence,
    contradictions: paidResult.contradictions.map((c) => ({
      type: c.type,
      severity: c.severity,
      evidence: c.evidence,
    })),
    domainScores: paidResult.domainProfiles.map((d) => ({
      domain: d.domain,
      label: d.label,
      percent: d.percent,
    })),
    firstAction: paidResult.nextAdmissibleMove.move,
    corrections: paidResult.corrections,
    assessmentId: paidResult.resultId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE TO DECISION CENTRE — builds the memory items for DC display
// ─────────────────────────────────────────────────────────────────────────────

export function buildPaidResultDecisionCentreMemory(
  paidResult: PurposeAlignmentPaidResult,
): Array<{
  id: string;
  label: string;
  summary: string;
  status: "ACTIVE" | "UNRESOLVED";
  sourceSurface: string;
  capturedAt: string;
}> {
  const items: Array<{
    id: string;
    label: string;
    summary: string;
    status: "ACTIVE" | "UNRESOLVED";
    sourceSurface: string;
    capturedAt: string;
  }> = [];

  items.push({
    id: "paid_pa_mandate",
    label: "Mandate clarity reading",
    summary: paidResult.mandateReading.operatingMandateSentence,
    status: "ACTIVE",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  items.push({
    id: "paid_pa_obligation",
    label: "Obligation conflict",
    summary: `Primary competing obligation: ${paidResult.obligationConflictMap.primaryCompetingObligation}. Nature: ${paidResult.obligationConflictMap.obligationNature}.`,
    status: "UNRESOLVED",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  items.push({
    id: "paid_pa_pattern",
    label: "Decision behaviour pattern",
    summary: `${paidResult.decisionBehaviourPattern.primaryPattern.label}. Recurrence risk: ${paidResult.decisionBehaviourPattern.recurrenceRisk}.`,
    status: "ACTIVE",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  if (paidResult.alignmentDriftWarning.driftActive) {
    items.push({
      id: "paid_pa_drift",
      label: "Alignment drift warning",
      summary: paidResult.alignmentDriftWarning.driftDirection,
      status: "UNRESOLVED",
      sourceSurface: "PURPOSE_ALIGNMENT",
      capturedAt: paidResult.createdAt,
    });
  }

  items.push({
    id: "paid_pa_execution",
    label: "Execution integrity implication",
    summary: `Integrity score: ${paidResult.executionIntegrityImplication.integrityScore}/100. Impacted: ${paidResult.executionIntegrityImplication.integrityImpacted}.`,
    status: paidResult.executionIntegrityImplication.integrityImpacted ? "UNRESOLVED" : "ACTIVE",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  items.push({
    id: "paid_pa_constitution",
    label: "Personal decision constitution",
    summary: paidResult.personalDecisionConstitution.governingPrinciple,
    status: "ACTIVE",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  items.push({
    id: "paid_pa_next_move",
    label: "Next admissible move",
    summary: paidResult.nextAdmissibleMove.move,
    status: "UNRESOLVED",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: paidResult.createdAt,
  });

  if (paidResult.corridorBridge.bridgeJustified) {
    items.push({
      id: "paid_pa_bridge",
      label: "Corridor bridge",
      summary: `Escalation justified to ${paidResult.corridorBridge.targetSurface}. Evidence: ${paidResult.corridorBridge.bridgeEvidence.join("; ")}.`,
      status: "ACTIVE",
      sourceSurface: "PURPOSE_ALIGNMENT",
      capturedAt: paidResult.createdAt,
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUTURE CORRIDOR — standalone Purpose Alignment Corridor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The future standalone corridor structure.
 * This is not yet implemented but is defined here so the paid result
 * contract is architected for it from day one.
 *
 * Purpose Alignment Corridor:
 *   Personal Mandate → Decision Pattern → Obligation Conflict →
 *   Alignment Drift → Execution Integrity → Life/Work Governance
 */
export const FUTURE_CORRIDOR_DEFINITION = {
  name: "Purpose Alignment Corridor",
  stages: [
    {
      id: "personal_mandate",
      label: "Personal Mandate",
      description: "What does the user say their mandate is, and what does their behaviour reveal?",
      paidResultField: "mandateReading",
    },
    {
      id: "decision_pattern",
      label: "Decision Pattern",
      description: "What decision pattern keeps recurring under pressure?",
      paidResultField: "decisionBehaviourPattern",
    },
    {
      id: "obligation_conflict",
      label: "Obligation Conflict",
      description: "Where are stated values and actual obligations in conflict?",
      paidResultField: "obligationConflictMap",
    },
    {
      id: "alignment_drift",
      label: "Alignment Drift",
      description: "Where is the user drifting from their declared direction?",
      paidResultField: "alignmentDriftWarning",
    },
    {
      id: "execution_integrity",
      label: "Execution Integrity",
      description: "What is the execution integrity implication of the current pattern?",
      paidResultField: "executionIntegrityImplication",
    },
    {
      id: "life_work_governance",
      label: "Life/Work Governance",
      description: "What constitution should govern future decisions?",
      paidResultField: "personalDecisionConstitution",
    },
  ],
} as const;
