/**
 * lib/benchmarks/benchmark-fact-writers.ts
 *
 * Product-surface benchmark fact write helpers.
 *
 * Each function extracts appropriate metrics and dimensions from a product
 * output and writes an anonymised BenchmarkFact via writeBenchmarkFact().
 *
 * Rules:
 * - All functions are fire-and-forget (never throw, never block product flow).
 * - subjectHash = SHA-256 of the sourceId (diagnosticRef, contributionId, etc.)
 *   The sourceId is not stored in the fact — only its hash.
 * - No PII enters the fact: no email, caseId, userId, orgName.
 * - Dimensions are typed classification tags only.
 * - Raw text is never included in metrics or dimensions.
 *
 * Opt-in note:
 * - Diagnostic submit (Fast Diagnostic, Team Assessment, Enterprise) facts are
 *   written only for authenticated users who have accepted terms.
 * - Outcome contribution facts are written when the user explicitly opts in via
 *   POST /api/cases/contribute-outcome.
 * - Executive Reporting and Return Brief facts are written at artifact generation
 *   time for authenticated paid users (terms already accepted).
 */

import { createHash } from "crypto";
import { writeBenchmarkFact } from "./benchmark-fact-service";

// ─── Hash helper ──────────────────────────────────────────────────────────────

/** Produces a 64-char SHA-256 hex hash of any string. Never reversible. */
function anonymousHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ─── Diagnostic submit (Fast Diagnostic, Team Assessment, Enterprise) ─────────

/**
 * Write a BenchmarkFact from a diagnostic submission.
 * Called after saveDiagnosticRecord succeeds, for authenticated submissions only.
 *
 * Never throws. Returns true if the write succeeded, false otherwise.
 */
export async function writeDiagnosticSubmitFact(params: {
  diagnosticRef: string;
  kind: string;
  /** Overall percentage score 0–100 */
  pct: number;
  /** Severity band (low/moderate/high/critical) */
  severity: string;
  /** Section-level scores — array of { sectionId, pct } */
  sectionScores?: Array<{ sectionId: string; pct: number }>;
  /** Decision-maker role (from respondent.role or metadata.respondentRole) */
  role?: string | null;
  /** Organisation size band (from metadata, if present) */
  headcountBand?: string | null;
  /** Industry sector tag (from metadata, if present) */
  sector?: string | null;
  /** Maturity stage (from metadata, if present) */
  maturity?: string | null;
}): Promise<boolean> {
  try {
    const {
      diagnosticRef, kind, pct, severity,
      sectionScores = [], role, headcountBand, sector, maturity,
    } = params;

    const metrics: Array<{ metric: string; value: number }> = [
      { metric: "overallPct", value: Math.round(pct) },
    ];

    // Map known section IDs to canonical benchmark metric keys
    const SECTION_METRIC_MAP: Record<string, string> = {
      authority:    "authorityClarity",
      direction:    "narrativeCoherence",
      execution:    "executionReadiness",
      trust:        "interventionReadiness",
      // Team assessment sections
      "team-authority": "authorityClarity",
      "team-execution": "executionReadiness",
      "team-trust":     "interventionReadiness",
    };

    for (const s of sectionScores) {
      const metricKey = SECTION_METRIC_MAP[s.sectionId];
      if (metricKey && Number.isFinite(s.pct)) {
        metrics.push({ metric: metricKey, value: Math.round(s.pct) });
      }
    }

    // Map severity string to numeric score for benchmarking
    const severityMap: Record<string, number> = {
      low: 1, moderate: 2, high: 3, critical: 4,
    };
    const severityNumeric = severityMap[severity.toLowerCase()] ?? 2;
    metrics.push({ metric: "severityScore", value: severityNumeric });

    const dimensions: Record<string, string> = {
      assessmentType: normaliseAssessmentType(kind),
    };
    if (role) dimensions.role = role;
    if (headcountBand) dimensions.headcountBand = headcountBand;
    if (sector) dimensions.sector = sector;
    if (maturity) dimensions.maturity = maturity;

    const result = await writeBenchmarkFact({
      sessionHash: anonymousHash(diagnosticRef),
      assessmentKind: normaliseAssessmentType(kind),
      metrics,
      dimensions,
      anonymized: true,
    });

    return result !== null;
  } catch {
    return false;
  }
}

// ─── Outcome contribution (opt-in gate) ───────────────────────────────────────

/**
 * Write a BenchmarkFact from an opt-in outcome contribution.
 * Called in contribute-outcome.ts POST handler after AuditEvent creation.
 *
 * The contribution is the explicit opt-in consent gate.
 * The fact captures metrics from the original diagnostic session.
 *
 * Never throws. Returns true if the write succeeded, false otherwise.
 */
export async function writeOutcomeContributionFact(params: {
  contributionId: string;
  assessmentKind: string | null;
  /** Overall score from the original diagnostic (0–100), if available */
  overallPct?: number | null;
  /** Severity band from the original diagnostic, if available */
  assessmentBand?: string | null;
  /** Section scores extracted from the original stage payload */
  sectionScores?: Array<{ sectionId: string; pct: number }>;
  /** Role dimension from respondent data, if available */
  role?: string | null;
  /** Outcome state contributed (IMPROVED, RESOLVED, etc.) */
  outcomeState: string;
}): Promise<boolean> {
  try {
    const {
      contributionId, assessmentKind, overallPct,
      assessmentBand, sectionScores = [], role, outcomeState,
    } = params;

    if (!assessmentKind) return false;

    const metrics: Array<{ metric: string; value: number }> = [];

    if (Number.isFinite(overallPct) && overallPct !== null && overallPct !== undefined) {
      metrics.push({ metric: "overallPct", value: Math.round(overallPct) });
    }

    // Outcome state as a numeric score for benchmark position
    const outcomeMap: Record<string, number> = {
      IMPROVED: 4, RESOLVED: 5, UNCHANGED: 3, WORSENED: 2, ABANDONED: 1,
    };
    const outcomeNumeric = outcomeMap[outcomeState] ?? 3;
    metrics.push({ metric: "outcomeScore", value: outcomeNumeric });

    const SECTION_METRIC_MAP: Record<string, string> = {
      authority: "authorityClarity",
      direction: "narrativeCoherence",
      execution: "executionReadiness",
      trust:     "interventionReadiness",
    };

    for (const s of sectionScores) {
      const metricKey = SECTION_METRIC_MAP[s.sectionId];
      if (metricKey && Number.isFinite(s.pct)) {
        metrics.push({ metric: metricKey, value: Math.round(s.pct) });
      }
    }

    const dimensions: Record<string, string> = {
      assessmentType: normaliseAssessmentType(assessmentKind),
    };
    if (assessmentBand) dimensions.assessmentBand = assessmentBand;
    if (role) dimensions.role = role;

    const result = await writeBenchmarkFact({
      sessionHash: anonymousHash(`contribution:${contributionId}`),
      assessmentKind: normaliseAssessmentType(assessmentKind),
      metrics,
      dimensions,
      anonymized: true,
    });

    return result !== null;
  } catch {
    return false;
  }
}

// ─── Executive Reporting ──────────────────────────────────────────────────────

/**
 * Write a BenchmarkFact from an Executive Reporting artifact.
 * Called in the executive-reporting afterCreate hook.
 *
 * Never throws. Returns true if the write succeeded, false otherwise.
 */
export async function writeExecutiveReportFact(params: {
  reference: string;
  score: number;
  severity: string;
  /** Buyer type (individual / team / organisation) from report payload */
  buyerType?: string | null;
  /** Organisation size (from report payload) */
  headcountBand?: string | null;
  sector?: string | null;
}): Promise<boolean> {
  try {
    const { reference, score, severity, buyerType, headcountBand, sector } = params;

    const severityMap: Record<string, number> = {
      low: 1, moderate: 2, high: 3, critical: 4,
    };
    const severityNumeric = severityMap[severity.toLowerCase()] ?? 2;

    const metrics: Array<{ metric: string; value: number }> = [
      { metric: "overallPct", value: Math.round(score) },
      { metric: "severityScore", value: severityNumeric },
    ];

    const dimensions: Record<string, string> = {
      assessmentType: "EXECUTIVE_REPORT",
    };
    if (buyerType) dimensions.buyerType = buyerType;
    if (headcountBand) dimensions.headcountBand = headcountBand;
    if (sector) dimensions.sector = sector;

    const result = await writeBenchmarkFact({
      sessionHash: anonymousHash(`exec-report:${reference}`),
      assessmentKind: "EXECUTIVE_REPORT",
      metrics,
      dimensions,
      anonymized: true,
    });

    return result !== null;
  } catch {
    return false;
  }
}

// ─── Return Brief ─────────────────────────────────────────────────────────────

/**
 * Write a BenchmarkFact from a Return Brief generation.
 * Called in return-brief.ts POST handler after composeReturnBriefV1 succeeds.
 *
 * Never throws. Returns true if the write succeeded, false otherwise.
 */
export async function writeReturnBriefFact(params: {
  caseId: string;
  diagnosticType: string | null;
  /** Days since the original case was governed (for reEngagementLag metric) */
  daysSinceCase: number;
  /** Number of decision objects (continuity score proxy) */
  decisionObjectCount: number;
  /** Whether the case had a prior outcome contribution */
  hadPriorOutcome: boolean;
}): Promise<boolean> {
  try {
    const {
      caseId, diagnosticType, daysSinceCase,
      decisionObjectCount, hadPriorOutcome,
    } = params;

    const metrics: Array<{ metric: string; value: number }> = [
      { metric: "reEngagementLag", value: Math.max(0, daysSinceCase) },
      { metric: "continuityScore", value: Math.min(100, decisionObjectCount * 20) },
      { metric: "hadPriorOutcome", value: hadPriorOutcome ? 1 : 0 },
    ];

    const dimensions: Record<string, string> = {
      assessmentType: "RETURN_BRIEF",
    };
    if (diagnosticType) dimensions.originalAssessmentType = normaliseAssessmentType(diagnosticType);

    const result = await writeBenchmarkFact({
      sessionHash: anonymousHash(`return-brief:${caseId}`),
      assessmentKind: "RETURN_BRIEF",
      metrics,
      dimensions,
      anonymized: true,
    });

    return result !== null;
  } catch {
    return false;
  }
}

// ─── Normalise assessment type ────────────────────────────────────────────────

/** Normalise the diagnostic kind string to a stable assessmentType key. */
function normaliseAssessmentType(kind: string): string {
  const k = kind.toLowerCase().replace(/[-_\s]+/g, "_");
  const MAP: Record<string, string> = {
    fast_diagnostic:         "FAST_DIAGNOSTIC",
    initial_assessment:      "FAST_DIAGNOSTIC",
    directional_integrity:   "FAST_DIAGNOSTIC",
    team_assessment:         "TEAM_ASSESSMENT",
    team_alignment:          "TEAM_ASSESSMENT",
    enterprise_assessment:   "ENTERPRISE_ASSESSMENT",
    enterprise:              "ENTERPRISE_ASSESSMENT",
    executive_reporting:     "EXECUTIVE_REPORT",
    executive_report:        "EXECUTIVE_REPORT",
    purpose_alignment:       "PURPOSE_ALIGNMENT",
    constitutional_diagnostic: "CONSTITUTIONAL_DIAGNOSTIC",
    constitutional:          "CONSTITUTIONAL_DIAGNOSTIC",
    return_brief:            "RETURN_BRIEF",
  };
  return MAP[k] ?? kind.toUpperCase().replace(/[-\s]+/g, "_");
}
