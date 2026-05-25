/**
 * lib/research/research-run-validation.ts
 *
 * Zod schemas for all ResearchRun inputs and outputs.
 * Used by API routes and the repository for safe boundary validation.
 */

import { z } from "zod";

export const RunSeveritySchema = z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RunStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "IN_PROGRESS",
  "COMPLETE",
  "RECORDED",
  "ACTION_REQUIRED",
  "OWNER_DECISION_REQUIRED",
  "REVIEWED",
  "IMPLEMENTED",
  "DEFERRED",
  "FAILED",
  "ARCHIVED",
]);

export const RunTypeSchema = z.enum([
  "RED_TEAM",
  "SCENARIO",
  "OUTBOUND",
  "SECURITY",
  "MARKET",
  "CONTENT",
  "SCHEDULED",
  "MANUAL",
  "ENGINE_TEST",
]);

export const FindingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: RunSeveritySchema,
  source: z.string().min(1, "Every finding must have a source (Law 3 of the Honesty Constitution)"),
  evidence: z.string().optional(),
  remediation: z.string().optional(),
  isDemo: z.boolean().optional(),
});

export const CreateResearchRunSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  runType: RunTypeSchema,
  module: z.string().min(1),
  moduleVersion: z.string().default("1.0.0"),
  actorId: z.string().optional(),
  actorEmail: z.string().email().optional(),
  inputJson: z.string().optional(),
  outputJson: z.string().optional(),
  baselineJson: z.string().optional(),
  findingsJson: z.string().optional(),
  blockingIssuesJson: z.string().optional(),
  dependenciesUnmetJson: z.string().optional(),
  recommendation: z.string().optional(),
  severity: RunSeveritySchema.default("INFO"),
  status: RunStatusSchema.default("PENDING"),
  estimatedEffort: z.string().optional(),
  requiresOwnerDecision: z.boolean().default(false),
  deferredReason: z.string().optional(),
  baselineId: z.string().optional(),
  driftDetected: z.boolean().default(false),
  driftSummary: z.string().optional(),
  exploitabilityScore: z.number().min(0).max(10).optional(),
  detectionLikelihood: z.number().min(0).max(1).optional(),
  assetAtRisk: z.string().optional(),
  attackVector: z.string().optional(),
  claimRisk: z.string().optional(),
  overclaims: z.string().optional(),
  forbiddenPhrases: z.string().optional(),
  humanReviewRequired: z.boolean().default(false),
  engineVersionJson: z.string().optional(),
  referenceVersionJson: z.string().optional(),
  schemaVersion: z.string().default("1.0.0"),
  contentFileHash: z.string().optional(),
  linkedRoute: z.string().optional(),
  linkedRouteExists: z.boolean().optional(),
  linkedProductId: z.string().optional(),
  linkedFileHash: z.string().optional(),
  runCostEstimate: z.number().optional(),
  durationMs: z.number().int().optional(),
  isDemo: z.boolean().default(false),
  resurrectedFromId: z.string().optional(),
});

// UpdateResearchRunSchema is intentionally restricted to non-lifecycle fields.
// Status, severity, archivedAt, implementedAt are NOT included here.
// Lifecycle mutations use dedicated repository methods (implement, defer, archive, etc.).
export const UpdateResearchRunSchema = z.object({
  recommendation: z.string().optional(),
  blockingIssuesJson: z.string().optional(),
  dependenciesUnmetJson: z.string().optional(),
  deferredReason: z.string().optional(),
});

export const ArchiveRunSchema = z.object({
  deferredReason: z.string().optional(),
  decisionOutcome: z.string().optional(),
});

export const DeferRunSchema = z.object({
  deferredReason: z.string().min(20, "Deferral requires a meaningful reason (minimum 20 characters)"),
});

export const ImplementRunSchema = z.object({
  implementedAt: z.string().datetime().optional(),
  decisionOutcome: z.string().optional(),
});

export const ResearchRunFiltersSchema = z.object({
  module: z.string().optional(),
  status: z.union([RunStatusSchema, z.array(RunStatusSchema)]).optional(),
  severity: z.union([RunSeveritySchema, z.array(RunSeveritySchema)]).optional(),
  isDemo: z.boolean().optional(),
  actorId: z.string().optional(),
  includeArchived: z.boolean().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreateResearchRunInput = z.infer<typeof CreateResearchRunSchema>;
export type UpdateResearchRunInput = z.infer<typeof UpdateResearchRunSchema>;
export type ResearchRunFilters = z.infer<typeof ResearchRunFiltersSchema>;
