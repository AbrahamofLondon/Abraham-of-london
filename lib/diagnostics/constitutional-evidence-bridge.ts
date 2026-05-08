/**
 * lib/diagnostics/constitutional-evidence-bridge.ts
 *
 * Evidence-bearing bridge contract for Constitutional Diagnostic.
 * Carries structured evidence, contradiction, recurrence, avoidance,
 * prior-attempt, and consequence context downstream — not just scores.
 *
 * This is additive. It does not replace the existing score-based bridge.
 * It enriches it with evidence context that downstream surfaces can use.
 *
 * No React. No database dependency. Pure transformation layer.
 */

import type {
  ConstitutionalMicroReport,
  DiagnosticAnswers,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { ConstitutionalDecision } from "@/lib/constitution/rules";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ConstitutionalEvidenceSignal = {
  questionId: string;
  domain: string;
  score: number;
  polarity: "STRENGTH" | "WEAKNESS" | "MIXED";
  interpretation: string;
  downstreamUse: Array<
    | "EXECUTIVE_REPORTING"
    | "STRATEGY_ROOM"
    | "RETURN_BRIEF"
    | "OVERSIGHT_BRIEF"
    | "CONTROL_ROOM"
  >;
};

export type ConstitutionalContradictionSignal = {
  type:
    | "AUTHORITY_WITHOUT_TRUST"
    | "URGENCY_WITHOUT_CAPACITY"
    | "OBJECTION_POLITICISED"
    | "RECURRING_FAILURE"
    | "EXTERNAL_PRESSURE"
    | "EXECUTION_DRIFT";
  severity: "LOW" | "MEDIUM" | "HIGH";
  basis: string;
  sourceQuestionIds: string[];
};

export type ConstitutionalEvidenceBridge = {
  source: "constitutional_diagnostic";
  route: "STRATEGY" | "DIAGNOSTIC" | "REJECT";
  readinessTier?: string;
  authorityType?: string;
  posture?: string;

  domainScores: Record<string, number>;

  evidenceSignals: {
    authority?: ConstitutionalEvidenceSignal;
    coherence?: ConstitutionalEvidenceSignal;
    trust?: ConstitutionalEvidenceSignal;
    execution?: ConstitutionalEvidenceSignal;
    escalation?: ConstitutionalEvidenceSignal;
    externalPressure?: ConstitutionalEvidenceSignal;
  };

  contradictionSignals: ConstitutionalContradictionSignal[];

  priorAttemptSignal?: {
    present: boolean;
    summary?: string;
    source?: "upstream" | "user_input" | "journey_history";
  };

  avoidanceSignal?: {
    present: boolean;
    pattern?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH";
    basis?: string;
  };

  costOfInactionSignal?: {
    present: boolean;
    text?: string;
    parsedAmount?: number | null;
    confidence?: "LOW" | "MEDIUM" | "HIGH";
  };

  recurrenceSignal?: {
    present: boolean;
    pattern?: string;
    priorOccurrences?: number;
    confidence?: "LOW" | "MEDIUM" | "HIGH";
  };

  verificationGap?: {
    present: boolean;
    reason: string;
  };

  immediateDecisionGap?: {
    present: boolean;
    reason: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPSTREAM CONTEXT (optional — provided when available)
// ─────────────────────────────────────────────────────────────────────────────

export type UpstreamEvidenceContext = {
  priorAttemptText?: string | null;
  costOfDelayText?: string | null;
  avoidedDecision?: string | null;
  patternRecurrenceCount?: number | null;
  resolvedPatternReappeared?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE SIGNAL BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function classifyPolarity(score: number): "STRENGTH" | "WEAKNESS" | "MIXED" {
  if (score >= 65) return "STRENGTH";
  if (score < 40) return "WEAKNESS";
  return "MIXED";
}

function buildAuthoritySignal(report: ConstitutionalMicroReport): ConstitutionalEvidenceSignal {
  return {
    questionId: "q2,q7",
    domain: "authority",
    score: report.authorityScore,
    polarity: classifyPolarity(report.authorityScore),
    interpretation: report.authorityScore >= 70
      ? "Decision authority is explicit and exercisable."
      : report.authorityScore >= 45
        ? "Authority exists but escalation boundaries are imperfect."
        : "Authority is weak or insufficiently explicit for governed intervention.",
    downstreamUse: ["EXECUTIVE_REPORTING", "STRATEGY_ROOM", "OVERSIGHT_BRIEF"],
  };
}

function buildCoherenceSignal(report: ConstitutionalMicroReport): ConstitutionalEvidenceSignal {
  return {
    questionId: "q1",
    domain: "coherence",
    score: report.coherenceScore,
    polarity: classifyPolarity(report.coherenceScore),
    interpretation: report.coherenceScore >= 65
      ? "Strategic coherence is comparatively strong."
      : report.coherenceScore >= 45
        ? "Coherence exists but execution and direction are not fully locked."
        : "Strategic coherence is materially compromised.",
    downstreamUse: ["EXECUTIVE_REPORTING", "STRATEGY_ROOM", "RETURN_BRIEF"],
  };
}

function buildTrustSignal(report: ConstitutionalMicroReport): ConstitutionalEvidenceSignal {
  return {
    questionId: "q5",
    domain: "trust",
    score: report.trustScore,
    polarity: classifyPolarity(report.trustScore),
    interpretation: report.trustScore >= 65
      ? "Trust condition supports safe intervention."
      : report.trustScore >= 45
        ? "Trust is present but may not withstand confrontational intervention."
        : "Trust condition is compromised. Objections may be punished rather than processed.",
    downstreamUse: ["EXECUTIVE_REPORTING", "STRATEGY_ROOM", "OVERSIGHT_BRIEF", "CONTROL_ROOM"],
  };
}

function buildExecutionSignal(report: ConstitutionalMicroReport): ConstitutionalEvidenceSignal {
  return {
    questionId: "q4,q6,q9",
    domain: "execution",
    score: report.frictionScore,
    polarity: report.frictionScore >= 60 ? "WEAKNESS" : report.frictionScore >= 40 ? "MIXED" : "STRENGTH",
    interpretation: report.frictionScore >= 70
      ? "Structural friction is high and likely compounding execution drag."
      : report.frictionScore >= 50
        ? "Friction is present and meaningful."
        : "Friction is present but currently governable.",
    downstreamUse: ["EXECUTIVE_REPORTING", "STRATEGY_ROOM", "RETURN_BRIEF", "OVERSIGHT_BRIEF"],
  };
}

function buildPressureSignal(report: ConstitutionalMicroReport): ConstitutionalEvidenceSignal {
  return {
    questionId: "q3,q8,q10",
    domain: "pressure",
    score: report.pressureScore,
    polarity: report.pressureScore >= 70 ? "WEAKNESS" : report.pressureScore >= 50 ? "MIXED" : "STRENGTH",
    interpretation: report.pressureScore >= 70
      ? "Material consequence and external pressure are actively present."
      : report.pressureScore >= 50
        ? "Pressure is real but not yet fully acute."
        : "Pressure exists but the signal is not yet severe.",
    downstreamUse: ["EXECUTIVE_REPORTING", "STRATEGY_ROOM"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRADICTION DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectContradictions(
  report: ConstitutionalMicroReport,
  answers: DiagnosticAnswers,
): ConstitutionalContradictionSignal[] {
  const contradictions: ConstitutionalContradictionSignal[] = [];

  // Authority without trust: authority is high but trust is low
  if (report.authorityScore >= 60 && report.trustScore < 40) {
    contradictions.push({
      type: "AUTHORITY_WITHOUT_TRUST",
      severity: "HIGH",
      basis: "Decision authority appears clear, but trust is insufficient for objections to be processed safely. Authority without trust produces compliance, not alignment.",
      sourceQuestionIds: ["q2", "q7", "q5"],
    });
  }

  // Urgency without capacity: pressure is high but intervention readiness is low
  if (report.pressureScore >= 65 && report.interventionReadiness < 40) {
    contradictions.push({
      type: "URGENCY_WITHOUT_CAPACITY",
      severity: "HIGH",
      basis: "External pressure demands action, but the organisation lacks the structural readiness to absorb intervention safely.",
      sourceQuestionIds: ["q3", "q8", "q10"],
    });
  }

  // Objection politicised: trust is very low (q5 resonance low, certainty high)
  const q5Answer = answers.q5;
  if (q5Answer && q5Answer.resonance <= 3 && q5Answer.certainty >= 7) {
    contradictions.push({
      type: "OBJECTION_POLITICISED",
      severity: "HIGH",
      basis: "The respondent is certain that objections are not processed safely. This indicates a structural trust failure, not uncertainty.",
      sourceQuestionIds: ["q5"],
    });
  }

  // Recurring failure: q9 resonance high (problems recur) with high certainty
  const q9Answer = answers.q9;
  if (q9Answer && q9Answer.resonance >= 7 && q9Answer.certainty >= 6) {
    contradictions.push({
      type: "RECURRING_FAILURE",
      severity: q9Answer.resonance >= 9 ? "HIGH" : "MEDIUM",
      basis: "The same problems keep resurfacing despite repeated correction attempts. The pattern is structural.",
      sourceQuestionIds: ["q9"],
    });
  }

  // External pressure forcing reactive decisions
  const q10Answer = answers.q10;
  if (q10Answer && q10Answer.resonance >= 7 && report.coherenceScore < 50) {
    contradictions.push({
      type: "EXTERNAL_PRESSURE",
      severity: "MEDIUM",
      basis: "External pressure is high while internal coherence is low. Decisions may be reactive rather than strategic.",
      sourceQuestionIds: ["q10", "q1"],
    });
  }

  // Execution drift: strategic drift (q4) high with strategic coherence (q1) claiming alignment
  const q4Answer = answers.q4;
  const q1Answer = answers.q1;
  if (q4Answer && q1Answer && q4Answer.resonance >= 7 && q1Answer.resonance >= 6) {
    contradictions.push({
      type: "EXECUTION_DRIFT",
      severity: "MEDIUM",
      basis: "Strategy appears aligned on paper but execution is drifting. The gap between stated direction and actual behaviour is a structural contradiction.",
      sourceQuestionIds: ["q1", "q4"],
    });
  }

  return contradictions;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPSTREAM SIGNAL BRIDGING
// ─────────────────────────────────────────────────────────────────────────────

function buildPriorAttemptSignal(
  upstream?: UpstreamEvidenceContext | null,
): ConstitutionalEvidenceBridge["priorAttemptSignal"] {
  if (!upstream?.priorAttemptText?.trim()) {
    return { present: false };
  }
  return {
    present: true,
    summary: upstream.priorAttemptText.trim(),
    source: "upstream",
  };
}

function buildCostOfInactionSignal(
  upstream?: UpstreamEvidenceContext | null,
): ConstitutionalEvidenceBridge["costOfInactionSignal"] {
  if (!upstream?.costOfDelayText?.trim()) {
    return { present: false };
  }
  const text = upstream.costOfDelayText.trim();
  const moneyMatch = text.match(/£\s?([\d,]+)/);
  const parsedAmount = moneyMatch?.[1] ? Number(moneyMatch[1].replace(/,/g, "")) : null;
  return {
    present: true,
    text,
    parsedAmount: parsedAmount && Number.isFinite(parsedAmount) ? parsedAmount : null,
    confidence: parsedAmount ? "MEDIUM" : "LOW",
  };
}

function buildAvoidanceSignal(
  upstream?: UpstreamEvidenceContext | null,
  answers?: DiagnosticAnswers,
): ConstitutionalEvidenceBridge["avoidanceSignal"] {
  const hasUpstreamAvoidance = Boolean(upstream?.avoidedDecision?.trim());
  const q9Answer = answers?.q9;
  const hasRecurrenceSignal = q9Answer ? q9Answer.resonance >= 7 : false;

  if (!hasUpstreamAvoidance && !hasRecurrenceSignal) {
    return { present: false };
  }

  const severity: "LOW" | "MEDIUM" | "HIGH" =
    hasUpstreamAvoidance && hasRecurrenceSignal ? "HIGH"
      : hasUpstreamAvoidance ? "MEDIUM"
        : "LOW";

  return {
    present: true,
    pattern: hasUpstreamAvoidance
      ? `Avoided decision identified: "${upstream!.avoidedDecision!.trim().slice(0, 200)}"`
      : "Possible avoidance pattern inferred from recurrence signal.",
    severity,
    basis: hasUpstreamAvoidance
      ? "Explicit avoidance reported in prior diagnostic stage."
      : "Recurrence without resolution suggests structural avoidance.",
  };
}

function buildRecurrenceSignal(
  upstream?: UpstreamEvidenceContext | null,
  answers?: DiagnosticAnswers,
): ConstitutionalEvidenceBridge["recurrenceSignal"] {
  const q9Answer = answers?.q9;
  const hasQ9Signal = q9Answer ? q9Answer.resonance >= 6 : false;
  const hasUpstreamRecurrence = upstream?.resolvedPatternReappeared === true;
  const priorCount = upstream?.patternRecurrenceCount ?? 0;

  if (!hasQ9Signal && !hasUpstreamRecurrence) {
    return { present: false };
  }

  return {
    present: true,
    pattern: hasUpstreamRecurrence
      ? "A previously resolved pattern has reappeared."
      : "Respondent reports recurring problems despite repeated correction.",
    priorOccurrences: priorCount > 0 ? priorCount : undefined,
    confidence: hasUpstreamRecurrence && hasQ9Signal ? "HIGH"
      : hasQ9Signal && q9Answer!.certainty >= 7 ? "HIGH"
        : "MEDIUM",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildConstitutionalEvidenceBridge(input: {
  report: ConstitutionalMicroReport;
  decision: ConstitutionalDecision;
  answers: DiagnosticAnswers;
  upstream?: UpstreamEvidenceContext | null;
}): ConstitutionalEvidenceBridge {
  const { report, decision, answers, upstream } = input;

  return {
    source: "constitutional_diagnostic",
    route: decision.route,
    readinessTier: report.readinessTier,
    authorityType: report.authorityType,
    posture: report.posture,

    domainScores: {
      authority: report.authorityScore,
      coherence: report.coherenceScore,
      trust: report.trustScore,
      pressure: report.pressureScore,
      friction: report.frictionScore,
      seriousness: report.seriousnessScore,
      governance: report.governanceDiscipline,
      interventionReadiness: report.interventionReadiness,
      narrativeCoherence: report.narrativeCoherence,
    },

    evidenceSignals: {
      authority: buildAuthoritySignal(report),
      coherence: buildCoherenceSignal(report),
      trust: buildTrustSignal(report),
      execution: buildExecutionSignal(report),
      externalPressure: buildPressureSignal(report),
    },

    contradictionSignals: detectContradictions(report, answers),

    priorAttemptSignal: buildPriorAttemptSignal(upstream),
    costOfInactionSignal: buildCostOfInactionSignal(upstream),
    avoidanceSignal: buildAvoidanceSignal(upstream, answers),
    recurrenceSignal: buildRecurrenceSignal(upstream, answers),

    verificationGap: {
      present: true,
      reason: "The Constitutional Diagnostic does not ask the user to define success evidence. Executive Reporting must establish verification criteria.",
    },

    immediateDecisionGap: {
      present: true,
      reason: "The Constitutional Diagnostic identifies posture and route but does not ask for the immediate decision to be made. Strategy Room or Executive Reporting must extract it.",
    },
  };
}
