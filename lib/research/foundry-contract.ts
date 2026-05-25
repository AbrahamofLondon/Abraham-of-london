/**
 * lib/research/foundry-contract.ts
 *
 * Canonical TypeScript types for the Intelligence Foundry.
 * These types are the single source of truth — all modules, repositories,
 * and API routes derive from these definitions.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type RunSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RunStatus =
  | "PENDING"
  | "PROCESSING"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "RECORDED"
  | "ACTION_REQUIRED"
  | "OWNER_DECISION_REQUIRED"
  | "REVIEWED"
  | "IMPLEMENTED"
  | "DEFERRED"
  | "FAILED"
  | "ARCHIVED";

export type RunType =
  | "RED_TEAM"
  | "SCENARIO"
  | "OUTBOUND"
  | "SECURITY"
  | "MARKET"
  | "CONTENT"
  | "SCHEDULED"
  | "MANUAL";

export type EngineStatus =
  | "PRODUCTION_CALLABLE"
  | "PRODUCTION_NEEDS_WRAP"
  | "DOCUMENTATION_ONLY"
  | "HUMAN_PROCESS"
  | "DECOMMISSIONED";

export type ModuleStatus =
  | "WIRED"
  | "PARTIAL"
  | "ADAPTER_NEEDED"
  | "DEMO"
  | "PLANNED"
  | "DEGRADED"
  | "DECOMMISSIONED"
  | "DEPRECATED";

// ─── Formula Trace ───────────────────────────────────────────────────────────

/** One step in a formula trace — produced by an engine adapter's run() call. */
export type FormulaStep = {
  stepId: string;
  label: string;
  inputs: Record<string, number | string>;
  intermediate?: Record<string, number | string>;
  output: number | string;
  sourceRule: string;
  engineVersion: string;
};

export type FormulaInspectorMode = "finding-source" | "live-formula" | "hybrid";

// ─── Finding ─────────────────────────────────────────────────────────────────

export type Finding = {
  id: string;
  title: string;
  description: string;
  severity: RunSeverity;
  /** Formula, rule, or trigger that produced this finding — required by Law 3 */
  source: string;
  evidence?: string;
  remediation?: string;
  isDemo?: boolean;
};

// ─── ResearchRun ─────────────────────────────────────────────────────────────

export type ResearchRun = {
  // Identity
  id: string;
  title: string;
  slug: string;
  runType: RunType;
  module: string;
  moduleVersion: string;

  // Actor
  actorId?: string | null;
  actorEmail?: string | null;

  // Inputs / Outputs
  inputJson?: string | null;
  outputJson?: string | null;
  baselineJson?: string | null;
  findingsJson?: string | null;

  // Actionability
  blockingIssuesJson?: string | null;
  dependenciesUnmetJson?: string | null;
  recommendation?: string | null;
  severity: RunSeverity;
  status: RunStatus;
  estimatedEffort?: string | null;
  requiresOwnerDecision: boolean;
  decisionMadeAt?: Date | null;
  decisionOutcome?: string | null;
  deferredReason?: string | null;

  // Comparison / Drift
  baselineId?: string | null;
  driftDetected: boolean;
  driftSummary?: string | null;

  // Security
  exploitabilityScore?: number | null;
  detectionLikelihood?: number | null;
  assetAtRisk?: string | null;
  attackVector?: string | null;

  // Market Protection
  claimRisk?: string | null;
  overclaims?: string | null;
  forbiddenPhrases?: string | null;
  humanReviewRequired: boolean;

  // Versioning
  engineVersionJson?: string | null;
  referenceVersionJson?: string | null;
  schemaVersion: string;
  contentFileHash?: string | null;

  // Linkage
  linkedRoute?: string | null;
  linkedRouteExists?: boolean | null;
  linkedProductId?: string | null;
  linkedFileHash?: string | null;

  // Operations
  runCostEstimate?: number | null;
  durationMs?: number | null;
  isDemo: boolean;
  resurrectionCount: number;
  resurrectedFromId?: string | null;

  // Timestamps
  reviewedAt?: Date | null;
  implementedAt?: Date | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateResearchRunInput = Omit<
  ResearchRun,
  "id" | "createdAt" | "updatedAt" | "resurrectionCount"
> & {
  resurrectionCount?: number;
};

export type UpdateResearchRunInput = Partial<
  Omit<ResearchRun, "id" | "createdAt" | "updatedAt">
>;

/** Fields that may be mutated via PATCH without a lifecycle transition. */
export type UpdateMetadataInput = {
  recommendation?: string;
  blockingIssuesJson?: string;
  dependenciesUnmetJson?: string;
  deferredReason?: string;
};

export type ResearchRunFilters = {
  module?: string;
  status?: RunStatus | RunStatus[];
  severity?: RunSeverity | RunSeverity[];
  isDemo?: boolean;
  actorId?: string;
  includeArchived?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};

// ─── Audit Events ────────────────────────────────────────────────────────────

// Renamed from FoundryAuditEvent to avoid collision with the Prisma model of the same name.
export type FoundryAuditEventType =
  | "FOUNDRY_RUN_CREATED"
  | "FOUNDRY_RUN_REPLAYED"
  | "FOUNDRY_RUN_REVIEWED"
  | "FOUNDRY_RUN_STATUS_CHANGED"
  | "FOUNDRY_RUN_ACTION_REQUIRED"
  | "FOUNDRY_RUN_IMPLEMENTED"
  | "FOUNDRY_RUN_DEFERRED"
  | "FOUNDRY_RUN_ARCHIVED"
  | "FOUNDRY_RUN_RESURRECTED"
  | "FOUNDRY_RUN_METADATA_UPDATED"
  | "FOUNDRY_RED_TEAM_CRITICAL"
  | "FOUNDRY_HEALTH_WARNING"
  | "FOUNDRY_MODULE_STATUS_CHANGED"
  | "FOUNDRY_CI_GATE_BLOCKED";

/** @deprecated Use FoundryAuditEventType */
export type FoundryAuditEvent = FoundryAuditEventType;

// ─── Action Brief ────────────────────────────────────────────────────────────

export type ActionBrief = {
  runId: string;
  title: string;
  module: string;
  severity: RunSeverity;
  status: RunStatus;
  recommendation: string | null;
  findings: Finding[];
  blockingIssues: string[];
  estimatedEffort: string | null;
  deferredReason: string | null;
  decisionOutcome: string | null;
  exportedAt: string;
};
