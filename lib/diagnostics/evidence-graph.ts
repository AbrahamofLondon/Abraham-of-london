import { createHash } from "crypto";

import type { PurposeAlignmentContext, PurposeProfileResult } from "@/lib/alignment/types";
import { classifyAIDecisionRisk, type AIExposureLevel } from "@/lib/diagnostics/ai-decision-risk";

export type EvidenceSourceStage =
  | "purpose_alignment"
  | "constitutional"
  | "team"
  | "enterprise"
  | "executive_reporting"
  | "strategy_room"
  | "instrument"
  | "monitoring";

export type EvidenceNodeKind =
  | "signal"
  | "contradiction"
  | "pattern"
  | "evidence"
  | "consequence"
  | "action"
  | "constraint"
  | "failed_attempt"
  | "escalation_trigger"
  | "decision_object"
  | "exposure_estimate"
  | "historical_comparison"
  | "pattern_recurrence"
  | "delta_summary"
  | "monitoring_signal"
  | "respondent_divergence"
  | "respondent_agreement"
  | "leadership_gap"
  | "stakeholder_conflict"
  | "outcome_delta"
  | "intervention_effectiveness"
  | "resolved_condition"
  | "partial_resolution"
  | "persistent_root_cause"
  | "behavior_pattern"
  | "ai_capability_contradiction";

export type EvidenceSeverity = "low" | "medium" | "high" | "critical";

export type DiagnosticEvidenceNodeInput = {
  sourceStage: EvidenceSourceStage;
  kind: EvidenceNodeKind;
  label: string;
  summary: string;
  evidenceText?: string | null;
  confidence: number;
  severity: EvidenceSeverity;
  payload?: Record<string, unknown> | null;
};

export type CanonicalDecisionObject = {
  sourceStage: EvidenceSourceStage;
  decisionKey: string;
  decisionText: string;
  constraintText?: string | null;
  priorAttemptText?: string | null;
  costOfDelayText?: string | null;
  stakeholderText?: string | null;
  affectedDomain?: string | null;
  confidence: number;
  aiExposureLevel: AIExposureLevel;
  aiDisplacementRisk: boolean;
  decisionVelocityScore: number;
  aiRiskClassification: string;
  normalized: {
    avoidedOrFaced: boolean;
    hasConstraint: boolean;
    hasPriorAttempt: boolean;
    hasDelayCost: boolean;
    hasStakeholder: boolean;
    extractedAt: string;
  };
};

export type ConsequenceEstimate = {
  label: string;
  value?: number | null;
  unit: "risk_points" | "days" | "gbp" | "percent" | "qualitative";
  formula: string;
  reasoning: string[];
  severity: EvidenceSeverity;
};

export type AuthorityAction = {
  requiredDecision: string;
  firstMove: string;
  skippedConsequence: string;
  escalationCondition: string;
};

export type DecisionAuthorityPacket = {
  stage: EvidenceSourceStage;
  condition: string;
  contradiction: string;
  decisionObject: CanonicalDecisionObject | null;
  consequence: ConsequenceEstimate;
  action: AuthorityAction;
  nodes: DiagnosticEvidenceNodeInput[];
};

function clean(value: unknown, max = 420): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function severityFromScore(score: number): EvidenceSeverity {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function hashDecision(parts: string[]): string {
  return createHash("sha256")
    .update(parts.map((part) => clean(part, 500)).filter(Boolean).join("|").toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

export function extractCanonicalDecisionObject(input: {
  sourceStage: EvidenceSourceStage;
  decisionText?: string | null;
  constraintText?: string | null;
  priorAttemptText?: string | null;
  costOfDelayText?: string | null;
  stakeholderText?: string | null;
  affectedDomain?: string | null;
  fallbackDecision?: string;
}): CanonicalDecisionObject | null {
  const decisionText = clean(input.decisionText || input.fallbackDecision || "");
  const constraintText = clean(input.constraintText || "");
  const priorAttemptText = clean(input.priorAttemptText || "");
  const costOfDelayText = clean(input.costOfDelayText || "");
  const stakeholderText = clean(input.stakeholderText || "");
  const affectedDomain = clean(input.affectedDomain || "", 120);

  if (!decisionText && !constraintText && !priorAttemptText && !costOfDelayText) {
    return null;
  }

  const completeness = [
    Boolean(decisionText),
    Boolean(constraintText),
    Boolean(priorAttemptText),
    Boolean(costOfDelayText),
    Boolean(stakeholderText || affectedDomain),
  ].filter(Boolean).length;
  const preliminary = {
    decisionText: decisionText || input.fallbackDecision || "",
    constraintText,
    priorAttemptText,
    costOfDelayText,
    affectedDomain,
  };
  const aiRisk = classifyAIDecisionRisk({
    ...preliminary,
    decisionVelocityScore: Math.max(10, Math.min(95, 72 - (costOfDelayText ? 12 : 0) - (priorAttemptText ? 8 : 0) - (constraintText ? 6 : 0))),
  });

  return {
    sourceStage: input.sourceStage,
    decisionKey: hashDecision([
      input.sourceStage,
      decisionText,
      constraintText,
      priorAttemptText,
      costOfDelayText,
      stakeholderText,
      affectedDomain,
    ]),
    decisionText: decisionText || "Decision not yet named; the missing decision is itself evidence.",
    constraintText: constraintText || null,
    priorAttemptText: priorAttemptText || null,
    costOfDelayText: costOfDelayText || null,
    stakeholderText: stakeholderText || null,
    affectedDomain: affectedDomain || null,
    confidence: clampConfidence(0.25 + completeness * 0.14),
    aiExposureLevel: aiRisk.aiExposureLevel,
    aiDisplacementRisk: aiRisk.aiDisplacementRisk,
    decisionVelocityScore: aiRisk.decisionVelocityScore,
    aiRiskClassification: aiRisk.classification,
    normalized: {
      avoidedOrFaced: Boolean(decisionText),
      hasConstraint: Boolean(constraintText),
      hasPriorAttempt: Boolean(priorAttemptText),
      hasDelayCost: Boolean(costOfDelayText),
      hasStakeholder: Boolean(stakeholderText || affectedDomain),
      extractedAt: new Date().toISOString(),
    },
  };
}

export function buildPurposeAuthorityPacket(
  result: PurposeProfileResult,
  context?: PurposeAlignmentContext | null,
): DecisionAuthorityPacket {
  const reflections = context?.reflections ?? null;
  const avoidedDecision = clean(reflections?.avoidedDecision);
  const livedWeek = clean(reflections?.lastSevenDays);
  const dissenter = clean(reflections?.dissenter);
  const primary = result.primaryPattern;
  const contradiction = result.contradictions?.[0];
  const weak = result.evidence?.sharpestWeakSignal;
  const severityScore =
    (100 - result.percent) +
    (result.contradictions?.length ?? 0) * 8 +
    (avoidedDecision ? 8 : 0) +
    (dissenter ? 5 : 0);

  const decisionObject = extractCanonicalDecisionObject({
    sourceStage: "purpose_alignment",
    decisionText: avoidedDecision,
    constraintText: dissenter,
    costOfDelayText: livedWeek,
    affectedDomain: weak?.domain ?? result.weakestDomains[0],
    fallbackDecision: result.firstAction,
  });

  const consequence: ConsequenceEstimate = {
    label: "Decision degradation risk",
    value: Math.min(100, Math.max(0, Math.round(severityScore))),
    unit: "risk_points",
    formula: "(100 - alignment percent) + contradiction count x 8 + avoided decision evidence + dissent evidence",
    reasoning: [
      `Alignment percent: ${result.percent}`,
      `Contradictions: ${result.contradictions?.length ?? 0}`,
      avoidedDecision ? "Avoided decision named by user" : "Avoided decision not named",
      dissenter ? "Dissenting evidence supplied" : "No dissenting evidence supplied",
    ],
    severity: severityFromScore(severityScore),
  };

  const condition = primary?.label ?? result.coherenceBand;
  const contradictionSummary = contradiction
    ? `${contradiction.type.replace(/_/g, " ")}: ${contradiction.evidence}`
    : avoidedDecision
      ? `User named an avoided decision; the system treats non-decision as the contradiction.`
      : `No dominant contradiction was evidenced; pattern competition governs the reading.`;

  const action: AuthorityAction = {
    requiredDecision: decisionObject?.decisionText ?? "Name the decision being avoided.",
    firstMove: result.firstAction ?? primary?.firstAction ?? "Write the decision as a binary choice today.",
    skippedConsequence: "The same pattern will keep entering decisions as unpriced drift.",
    escalationCondition: result.routingRecommendation?.reason ?? "Escalate if the same contradiction appears outside the individual layer.",
  };

  const nodes: DiagnosticEvidenceNodeInput[] = [
    {
      sourceStage: "purpose_alignment",
      kind: "pattern",
      label: condition,
      summary: primary?.consequence ?? result.narrative,
      evidenceText: primary?.reasons.join(" "),
      confidence: clampConfidence((primary?.score ?? result.percent) / 100),
      severity: consequence.severity,
      payload: { pattern: primary, band: result.coherenceBand, percent: result.percent },
    },
    {
      sourceStage: "purpose_alignment",
      kind: "contradiction",
      label: contradiction?.type ?? "decision_avoidance",
      summary: contradictionSummary,
      evidenceText: [weak?.statement, avoidedDecision, livedWeek, dissenter].filter(Boolean).join(" "),
      confidence: clampConfidence(0.52 + (result.contradictions?.length ?? 0) * 0.09 + (avoidedDecision ? 0.16 : 0)),
      severity: contradiction?.severity ?? consequence.severity,
      payload: { contradiction, weak },
    },
    {
      sourceStage: "purpose_alignment",
      kind: "consequence",
      label: consequence.label,
      summary: `${consequence.value} ${consequence.unit}`,
      evidenceText: consequence.reasoning.join("; "),
      confidence: 0.74,
      severity: consequence.severity,
      payload: { consequence },
    },
    {
      sourceStage: "purpose_alignment",
      kind: "action",
      label: "Required first move",
      summary: action.firstMove,
      evidenceText: action.requiredDecision,
      confidence: 0.76,
      severity: consequence.severity,
      payload: { action },
    },
  ];

  if (decisionObject) {
    const aiRisk = classifyAIDecisionRisk(decisionObject);
    if (aiRisk.contradiction) {
      nodes.push({
        sourceStage: "purpose_alignment",
        kind: "ai_capability_contradiction",
        label: aiRisk.contradiction.label,
        summary: aiRisk.contradiction.summary,
        evidenceText: `Velocity ${aiRisk.decisionVelocityScore}/100 vs inferred AI baseline ${aiRisk.competitorBaselineScore}/100.`,
        confidence: 0.72,
        severity: severityFromScore((consequence.value ?? 50) * aiRisk.contradiction.severityMultiplier),
        payload: { type: aiRisk.contradiction.type, aiRisk },
      });
    }
    nodes.push({
      sourceStage: "purpose_alignment",
      kind: "decision_object",
      label: "Canonical decision object",
      summary: decisionObject.decisionText,
      evidenceText: [
        decisionObject.constraintText,
        decisionObject.costOfDelayText,
        decisionObject.priorAttemptText,
      ].filter(Boolean).join(" "),
      confidence: decisionObject.confidence,
      severity: consequence.severity,
      payload: { decisionObject },
    });
  }

  return {
    stage: "purpose_alignment",
    condition,
    contradiction: contradictionSummary,
    decisionObject,
    consequence,
    action,
    nodes,
  };
}

export function buildGenericAuthorityPacket(input: {
  stage: EvidenceSourceStage;
  condition: string;
  contradiction: string;
  decisionText?: string | null;
  constraintText?: string | null;
  priorAttemptText?: string | null;
  costOfDelayText?: string | null;
  stakeholderText?: string | null;
  affectedDomain?: string | null;
  firstMove: string;
  skippedConsequence: string;
  escalationCondition: string;
  riskScore: number;
  formula: string;
  reasoning: string[];
  confidence?: number;
  payload?: Record<string, unknown>;
}): DecisionAuthorityPacket {
  const decisionObject = extractCanonicalDecisionObject({
    sourceStage: input.stage,
    decisionText: input.decisionText,
    constraintText: input.constraintText,
    priorAttemptText: input.priorAttemptText,
    costOfDelayText: input.costOfDelayText,
    stakeholderText: input.stakeholderText,
    affectedDomain: input.affectedDomain,
    fallbackDecision: input.firstMove,
  });
  const consequence: ConsequenceEstimate = {
    label: "Consequence exposure",
    value: Math.max(0, Math.min(100, Math.round(input.riskScore))),
    unit: "risk_points",
    formula: input.formula,
    reasoning: input.reasoning,
    severity: severityFromScore(input.riskScore),
  };
  const confidence = clampConfidence(input.confidence ?? 0.65);
  const action: AuthorityAction = {
    requiredDecision: decisionObject?.decisionText ?? input.firstMove,
    firstMove: input.firstMove,
    skippedConsequence: input.skippedConsequence,
    escalationCondition: input.escalationCondition,
  };
  const nodes: DiagnosticEvidenceNodeInput[] = [
    {
      sourceStage: input.stage,
      kind: "contradiction",
      label: input.condition,
      summary: input.contradiction,
      evidenceText: [
        input.decisionText,
        input.constraintText,
        input.priorAttemptText,
        input.costOfDelayText,
      ].filter(Boolean).join(" "),
      confidence,
      severity: consequence.severity,
      payload: input.payload ?? null,
    },
    {
      sourceStage: input.stage,
      kind: "consequence",
      label: consequence.label,
      summary: `${consequence.value} ${consequence.unit}`,
      evidenceText: consequence.reasoning.join("; "),
      confidence,
      severity: consequence.severity,
      payload: { consequence },
    },
    {
      sourceStage: input.stage,
      kind: "action",
      label: "Required first move",
      summary: input.firstMove,
      evidenceText: action.requiredDecision,
      confidence,
      severity: consequence.severity,
      payload: { action },
    },
  ];

  if (decisionObject) {
    const aiRisk = classifyAIDecisionRisk(decisionObject);
    if (aiRisk.contradiction) {
      nodes.push({
        sourceStage: input.stage,
        kind: "ai_capability_contradiction",
        label: aiRisk.contradiction.label,
        summary: aiRisk.contradiction.summary,
        evidenceText: `Velocity ${aiRisk.decisionVelocityScore}/100 vs inferred AI baseline ${aiRisk.competitorBaselineScore}/100.`,
        confidence: 0.72,
        severity: severityFromScore((consequence.value ?? 50) * aiRisk.contradiction.severityMultiplier),
        payload: { type: aiRisk.contradiction.type, aiRisk },
      });
    }
    nodes.push({
      sourceStage: input.stage,
      kind: "decision_object",
      label: "Canonical decision object",
      summary: decisionObject.decisionText,
      evidenceText: [
        decisionObject.constraintText,
        decisionObject.priorAttemptText,
        decisionObject.costOfDelayText,
        decisionObject.stakeholderText,
      ].filter(Boolean).join(" "),
      confidence: decisionObject.confidence,
      severity: consequence.severity,
      payload: { decisionObject },
    });
  }

  return {
    stage: input.stage,
    condition: input.condition,
    contradiction: input.contradiction,
    decisionObject,
    consequence,
    action,
    nodes,
  };
}
