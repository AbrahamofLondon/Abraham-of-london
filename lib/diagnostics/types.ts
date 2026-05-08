import type { AssessmentEvidenceCapture } from "@/lib/product/evidence-capture-contract";

/* ============================================================================
   FILE: lib/diagnostics/types.ts
   DIAGNOSTIC DOMAIN CONTRACTS
   Purpose:
   - unify client, API, storage, dashboard, and reporting contracts
   - preserve current diagnostics flow
   - support progression: initial -> team -> enterprise -> strategy room
   - remain stable as report issuance and paid artifacts expand
============================================================================ */

/* -----------------------------------------------------------------------------
   CORE SCALAR / ENUM-LIKE TYPES
----------------------------------------------------------------------------- */

export type DiagnosticKind =
  | "initial-assessment"
  | "directional-integrity"
  | "team-alignment"
  | "enterprise"
  | "executive-reporting"
  | "custom";

export type DiagnosticSource =
  | "diagnostics"
  | "homepage"
  | "strategy-room"
  | "dashboard"
  | "campaign"
  | "admin"
  | "api"
  | "other";

export type DiagnosticEntry =
  | "initial-assessment"
  | "directional-integrity"
  | "team-alignment"
  | "enterprise"
  | "executive-reporting"
  | "quick-diagnostic"
  | "custom"
  | string;

export type DiagnosticIntent =
  | "diagnostic"
  | "initial-assessment"
  | "directional-integrity"
  | "team-alignment-diagnostic"
  | "enterprise-diagnostic"
  | "executive-reporting"
  | "strategy-qualification"
  | string;

export type DiagnosticAnswerValue = 1 | 2 | 3 | 4 | 5;

export type DiagnosticSeverity = "negligible" | "low" | "moderate" | "high" | "critical" | "systemic";

export type DiagnosticScoreBand = "stable" | "watch" | "fragile" | "escalate";

export type DiagnosticLifecycleStatus =
  | "submitted"
  | "processing"
  | "completed"
  | "archived"
  | "revoked"
  | "failed";

export type DiagnosticReportStatus =
  | "none"
  | "queued"
  | "processing"
  | "ready"
  | "issued"
  | "revoked"
  | "failed";

export type DiagnosticRoute =
  | "FOUNDATION"
  | "TEAM"
  | "ENTERPRISE"
  | "STRATEGY_ROOM"
  | "EXECUTIVE_REPORTING"
  | "HOLD"
  | "REJECT";

export type DiagnosticActorTier =
  | "public"
  | "member"
  | "inner-circle"
  | "client"
  | "partner"
  | "executive"
  | "sovereign"
  | string;

/* -----------------------------------------------------------------------------
   SECTION / ANSWER / SUMMARY TYPES
----------------------------------------------------------------------------- */

export type DiagnosticAnswer = {
  sectionId: string;
  questionId: string;
  prompt: string;
  value: DiagnosticAnswerValue;
};

export type DiagnosticSectionScore = {
  sectionId: string;
  title: string;
  score: number;
  maxScore: number;
  pct: number;
};

export type DiagnosticSummary = {
  totalScore: number;
  maxScore: number;
  pct: number;
  severity: DiagnosticSeverity;
  band: DiagnosticScoreBand;
  sectionScores: DiagnosticSectionScore[];
};

export type DiagnosticRespondent = {
  name?: string | null;
  email?: string | null;
  organisation?: string | null;
  role?: string | null;
};

export type DiagnosticActorContext = {
  userId?: string | null;
  tier?: DiagnosticActorTier;
  authenticated?: boolean;
  name?: string | null;
  email?: string | null;
};

export type DiagnosticReportDescriptor = {
  id?: string | null;
  version?: string | null;
  status?: DiagnosticReportStatus | null;
  fileName?: string | null;
  downloadUrl?: string | null;
};

export type DiagnosticMetadata = Record<string, unknown> & {
  ui?: string;
  nextStepHref?: string | null;
  nextRoute?: DiagnosticRoute | null;
  dashboardTab?: string | null;
  reportTier?: string | null;
  reportRequested?: boolean | null;
  campaignId?: string | null;
  organisationId?: string | null;
  evidenceCapture?: AssessmentEvidenceCapture | null;
};

/* -----------------------------------------------------------------------------
   REQUEST PAYLOAD
----------------------------------------------------------------------------- */

export type DiagnosticSubmissionPayload = {
  kind: DiagnosticKind | string;
  version: string;
  source: DiagnosticSource | string;
  entry: DiagnosticEntry;
  intent: DiagnosticIntent;
  title: string;
  respondent?: DiagnosticRespondent;
  answers: DiagnosticAnswer[];
  notes?: string | null;
  summary: DiagnosticSummary;
  metadata?: DiagnosticMetadata;
};

/* -----------------------------------------------------------------------------
   API RESPONSE
----------------------------------------------------------------------------- */

export type DiagnosticSubmitSuccessResponse = {
  ok: true;
  diagnosticRef: string;
  submittedAt: string;
  dashboardHref: string | null;
  crmForwarded: boolean;
  reportReady: boolean;
  nextStepHref?: string | null;
  nextRoute?: DiagnosticRoute | null;
  report?: DiagnosticReportDescriptor | null;
};

export type DiagnosticSubmitErrorResponse = {
  ok: false;
  error: string;
};

export type DiagnosticSubmitResponse =
  | DiagnosticSubmitSuccessResponse
  | DiagnosticSubmitErrorResponse;

/* -----------------------------------------------------------------------------
   PERSISTED RECORD SHAPE
----------------------------------------------------------------------------- */

export type DiagnosticStoredRecord = {
  diagnosticRef: string;
  submittedAt: string;
  updatedAt: string;
  kind: DiagnosticKind | string;
  title: string;
  source: DiagnosticSource | string;
  entry: DiagnosticEntry;
  intent: DiagnosticIntent;
  status: DiagnosticLifecycleStatus;
  reportStatus: DiagnosticReportStatus | "none";
  crmForwarded: boolean;
  actor?: DiagnosticActorContext;
  respondent?: DiagnosticRespondent;
  summary: DiagnosticSummary;
  notes?: string | null;
  answers: DiagnosticAnswer[];
  metadata?: DiagnosticMetadata;
  report?: DiagnosticReportDescriptor | null;
};

/* -----------------------------------------------------------------------------
   DASHBOARD / LISTING TYPES
----------------------------------------------------------------------------- */

export type DiagnosticListItem = {
  diagnosticRef: string;
  kind: string;
  title: string;
  submittedAt: string;
  status: DiagnosticLifecycleStatus | string;
  reportStatus: DiagnosticReportStatus | string;
  severity: DiagnosticSeverity;
  band: DiagnosticScoreBand;
  pct: number;
  respondent?: DiagnosticRespondent;
  dashboardHref?: string | null;
  nextStepHref?: string | null;
};

export type DiagnosticArtifactListItem = {
  id: string;
  diagnosticRef: string;
  fileName: string;
  version: string;
  createdAt: string;
  status: string;
  downloadUrl: string;
};

/* -----------------------------------------------------------------------------
   REPORT TIER
----------------------------------------------------------------------------- */

export type DiagnosticReportTier = "standard" | "premium";

/* -----------------------------------------------------------------------------
   DTO / RESULT TYPES (used by report-issuer and PDF renderer)
----------------------------------------------------------------------------- */

export type DiagnosticRecordDTO = {
  id: string;
  diagnosticRef?: string | null;
  reference?: string | null;
  diagnosticType: string;
  title: string;
  score?: number | null;
  severity?: string | null;
  verdict?: string | null;
  notes?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  status?: string | null;
  reportStatus?: string | null;
  reportTier?: string | null;
  summary?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  responses?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type IssueDiagnosticReportResult = {
  ok: boolean;
  diagnosticId?: string;
  diagnosticRef?: string;
  artifactId?: string;
  version?: string;
  objectKey?: string;
  fileName?: string;
  sha256?: string;
  byteLength?: number;
  storageProvider?: string;
  bucket?: string | null;
  publicPath?: string | null;
  error?: string;
};

/* -----------------------------------------------------------------------------
   REPORTING / ISSUANCE TYPES
----------------------------------------------------------------------------- */

export type DiagnosticReportIssueRequest = {
  diagnosticRef: string;
  requestedBy?: string | null;
  tier?: string | null;
  regenerate?: boolean;
  reportTemplate?: string | null;
  metadata?: Record<string, unknown>;
};

export type DiagnosticReportIssueResponse =
  | {
      ok: true;
      diagnosticRef: string;
      artifactId: string;
      fileName: string;
      version: string;
      status: string;
      downloadUrl?: string | null;
    }
  | {
      ok: false;
      error: string;
    };

/* -----------------------------------------------------------------------------
   TYPE GUARDS
----------------------------------------------------------------------------- */

export function isDiagnosticSeverity(value: unknown): value is DiagnosticSeverity {
  return (
    value === "negligible" ||
    value === "low" ||
    value === "moderate" ||
    value === "high" ||
    value === "critical" ||
    value === "systemic"
  );
}

export function isDiagnosticScoreBand(value: unknown): value is DiagnosticScoreBand {
  return (
    value === "stable" ||
    value === "watch" ||
    value === "fragile" ||
    value === "escalate"
  );
}

export function isDiagnosticAnswerValue(value: unknown): value is DiagnosticAnswerValue {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function isDiagnosticSubmitSuccessResponse(
  value: unknown,
): value is DiagnosticSubmitSuccessResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<DiagnosticSubmitSuccessResponse>;
  return (
    candidate.ok === true &&
    typeof candidate.diagnosticRef === "string" &&
    typeof candidate.submittedAt === "string" &&
    typeof candidate.crmForwarded === "boolean" &&
    typeof candidate.reportReady === "boolean"
  );
}

export function isDiagnosticSubmitErrorResponse(
  value: unknown,
): value is DiagnosticSubmitErrorResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<DiagnosticSubmitErrorResponse>;
  return candidate.ok === false && typeof candidate.error === "string";
}

export function isDiagnosticSubmitResponse(
  value: unknown,
): value is DiagnosticSubmitResponse {
  return (
    isDiagnosticSubmitSuccessResponse(value) ||
    isDiagnosticSubmitErrorResponse(value)
  );
}
