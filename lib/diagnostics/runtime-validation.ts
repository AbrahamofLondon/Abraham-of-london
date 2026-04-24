import { createHash } from "crypto";
import { z } from "zod";

const diagnosticSeveritySchema = z.enum(["low", "moderate", "high", "critical"]);
const diagnosticBandSchema = z.enum(["stable", "watch", "fragile", "escalate"]);

export const diagnosticAnswerSchema = z.object({
  sectionId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  value: z.number().int().min(1).max(5),
});

export const diagnosticSectionScoreSchema = z.object({
  sectionId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  score: z.number().min(0),
  maxScore: z.number().positive(),
  pct: z.number().min(0).max(100),
});

export const diagnosticSubmissionSchema = z.object({
  kind: z.string().trim().min(1),
  version: z.string().trim().min(1),
  source: z.string().trim().min(1),
  entry: z.string().trim().min(1),
  intent: z.string().trim().min(1),
  title: z.string().trim().min(1),
  respondent: z.object({
    name: z.string().trim().min(1).optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    organisation: z.string().trim().min(1).optional().nullable(),
    role: z.string().trim().min(1).optional().nullable(),
  }).optional().nullable(),
  answers: z.array(diagnosticAnswerSchema).min(1),
  notes: z.string().trim().max(4000).optional().nullable(),
  summary: z.object({
    totalScore: z.number().min(0),
    maxScore: z.number().positive(),
    pct: z.number().min(0).max(100),
    severity: diagnosticSeveritySchema,
    band: diagnosticBandSchema,
    sectionScores: z.array(diagnosticSectionScoreSchema).min(1),
  }),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
}).superRefine((value, ctx) => {
  const answerTotal = value.answers.reduce((sum, answer) => sum + answer.value, 0);
  const sectionTotal = value.summary.sectionScores.reduce((sum, score) => sum + score.score, 0);

  if (value.summary.totalScore > value.summary.maxScore) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "summary.totalScore cannot exceed summary.maxScore",
      path: ["summary", "totalScore"],
    });
  }

  if (Math.abs(value.summary.totalScore - answerTotal) > value.answers.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "summary.totalScore does not align with submitted answers",
      path: ["summary", "totalScore"],
    });
  }

  if (Math.abs(sectionTotal - value.summary.totalScore) > value.summary.sectionScores.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "summary.sectionScores do not align with summary.totalScore",
      path: ["summary", "sectionScores"],
    });
  }
});

export const teamRowSchema = z.object({
  teamName: z.string().trim().min(1),
  respondents: z.number().int().min(1).max(500),
  authorityClarity: z.number().min(0).max(100),
  executionTrust: z.number().min(0).max(100),
  operatingFriction: z.number().min(0).max(100),
  strategicCoherence: z.number().min(0).max(100),
});

export const teamAssessmentRunSchema = z.object({
  email: z.string().trim().email(),
  organisation: z.string().trim().min(1).max(240),
  rows: z.array(teamRowSchema).min(2),
  sessionId: z.string().trim().min(1).optional().nullable(),
  journeyId: z.string().trim().min(1).optional().nullable(),
});

export const enterpriseDomainSchema = z.object({
  label: z.string().trim().min(1),
  authority: z.number().min(0).max(100),
  governance: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  execution: z.number().min(0).max(100),
  trust: z.number().min(0).max(100),
  exposure: z.number().min(0).max(100),
});

export const enterpriseAssessmentRunSchema = z.object({
  email: z.string().trim().email(),
  organisation: z.string().trim().min(1).max(240),
  domains: z.array(enterpriseDomainSchema).min(3),
  sessionId: z.string().trim().min(1).optional().nullable(),
  journeyId: z.string().trim().min(1).optional().nullable(),
});

export const evidenceSourceStageSchema = z.enum([
  "purpose_alignment",
  "constitutional",
  "team",
  "enterprise",
  "executive_reporting",
  "strategy_room",
  "instrument",
  "monitoring",
]);

export const evidenceNodeKindSchema = z.enum([
  "signal",
  "contradiction",
  "pattern",
  "evidence",
  "consequence",
  "action",
  "constraint",
  "failed_attempt",
  "escalation_trigger",
  "decision_object",
  "exposure_estimate",
  "historical_comparison",
  "pattern_recurrence",
  "delta_summary",
  "monitoring_signal",
  "respondent_divergence",
  "respondent_agreement",
  "leadership_gap",
  "stakeholder_conflict",
  "outcome_delta",
  "intervention_effectiveness",
  "resolved_condition",
  "partial_resolution",
  "persistent_root_cause",
  "behavior_pattern",
  "ai_capability_contradiction",
]);

export const evidenceSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const aiExposureSchema = z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]);

export const evidenceNodeSchema = z.object({
  sourceStage: evidenceSourceStageSchema,
  kind: evidenceNodeKindSchema,
  label: z.string().trim().min(1).max(240),
  summary: z.string().trim().min(1).max(1000),
  evidenceText: z.string().trim().max(4000).optional().nullable(),
  confidence: z.number().min(0).max(1),
  severity: evidenceSeveritySchema,
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const canonicalDecisionObjectSchema = z.object({
  sourceStage: evidenceSourceStageSchema,
  decisionKey: z.string().trim().min(1),
  decisionText: z.string().trim().min(1),
  constraintText: z.string().trim().max(1200).optional().nullable(),
  priorAttemptText: z.string().trim().max(1200).optional().nullable(),
  costOfDelayText: z.string().trim().max(1200).optional().nullable(),
  stakeholderText: z.string().trim().max(1200).optional().nullable(),
  affectedDomain: z.string().trim().max(240).optional().nullable(),
  confidence: z.number().min(0).max(1),
  aiExposureLevel: aiExposureSchema.optional(),
  aiDisplacementRisk: z.boolean().optional(),
  decisionVelocityScore: z.number().min(0).max(100).optional(),
  aiRiskClassification: z.string().trim().min(1).optional(),
  normalized: z.object({
    avoidedOrFaced: z.boolean(),
    hasConstraint: z.boolean(),
    hasPriorAttempt: z.boolean(),
    hasDelayCost: z.boolean(),
    hasStakeholder: z.boolean(),
    extractedAt: z.string().trim().min(1),
  }),
});

export const instrumentEvidenceSchema = z.object({
  source: z.literal("instrument"),
  type: z.enum(["CONTRADICTION", "ACTION"]),
  severity: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1).optional(),
  decisionId: z.string().trim().min(1),
  summary: z.string().trim().max(1000).optional(),
  evidenceText: z.string().trim().max(4000).optional(),
});

export function stableInputHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value, (_key, current) => {
      if (current && typeof current === "object" && !Array.isArray(current)) {
        return Object.keys(current)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = (current as Record<string, unknown>)[key];
            return acc;
          }, {});
      }
      return current;
    }))
    .digest("hex");
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
    .join("; ");
}
