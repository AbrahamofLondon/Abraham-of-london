import { z } from "zod";

import type { ConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";

export const PublicConstitutionalReportSchema = z.object({
  authorityScore: z.number(),
  coherenceScore: z.number(),
  pressureScore: z.number(),
  frictionScore: z.number(),
  trustScore: z.number(),
  seriousnessScore: z.number(),
  governanceDiscipline: z.number(),
  interventionReadiness: z.number(),
  narrativeCoherence: z.number(),
  failureModeCount: z.number(),
  failureModeSeverity: z.number(),
  authorityType: z.string(),
  posture: z.string(),
  readinessTier: z.string(),
  mandateFit: z.boolean(),
  summary: z.string(),
  keyFindings: z.array(z.string()),
  answeredCount: z.number(),
  totalQuestions: z.number(),
  completionPercent: z.number(),
}).passthrough();

export const PublicConstitutionalDecisionSchema = z.object({
  route: z.enum(["REJECT", "DIAGNOSTIC", "STRATEGY"]),
  confidence: z.number(),
  disqualifiersTriggered: z.array(z.string()),
  recommendedInterventions: z.array(z.string()),
  rationale: z.array(z.string()),
  escalationAllowed: z.boolean(),
}).passthrough();

export const PublicRouteSummarySchema = z.object({
  route: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string(),
  cta: z.string(),
  tone: z.enum(["neutral", "amber", "emerald"]),
}).passthrough();

export const ConstitutionalPublicBundleSchema = z.object({
  report: PublicConstitutionalReportSchema,
  decision: PublicConstitutionalDecisionSchema,
  routeSummary: PublicRouteSummarySchema,
});

const ConstitutionalBridgeBundleSchema = z.custom<ConstitutionalBridgeBundle>(
  (value) => Boolean(value && typeof value === "object" && !Array.isArray(value)),
  "Constitutional bridge payload is required",
);

export const ConstitutionalPublicResponseSchema = z.object({
  ok: z.literal(true),
  reportId: z.string().min(1),
  stateToken: z.string().min(1),
  bundle: ConstitutionalPublicBundleSchema,
  bridge: ConstitutionalBridgeBundleSchema,
});

export const ConstitutionalPublicFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string().min(1),
  details: z.unknown().optional(),
});

export type PublicConstitutionalReport = z.infer<typeof PublicConstitutionalReportSchema>;
export type PublicConstitutionalDecision = z.infer<typeof PublicConstitutionalDecisionSchema>;
export type PublicRouteSummary = z.infer<typeof PublicRouteSummarySchema>;
export type ConstitutionalPublicBundle = z.infer<typeof ConstitutionalPublicBundleSchema>;
export type ConstitutionalPublicResponse = z.infer<typeof ConstitutionalPublicResponseSchema>;
export type ConstitutionalPublicFailure = z.infer<typeof ConstitutionalPublicFailureSchema>;