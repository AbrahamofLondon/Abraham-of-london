import type { DecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-contract";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";
import {
  evaluateRetainerOversightReadiness,
  type RetainerOversightReadinessInput,
} from "@/lib/product/retainer-oversight-readiness";

/**
 * Build a retainer memory preview for the Decision Centre.
 *
 * Integrates the Retainer Oversight Readiness classifier to ensure:
 *   - Only allowedPreviewClaims are shown
 *   - prohibitedClaims are suppressed unless OVERSIGHT_READY
 *   - No raw case data is exposed
 *
 * @param memory - Optional retainer cycle memory summary
 * @param readinessInput - Optional readiness input for the classifier
 * @returns DecisionCentreRetainerMemoryPreview or null if no memory
 */
export function toDecisionCentreRetainerMemoryPreview(
  memory?: RetainerCycleMemorySummary | null,
  readinessInput?: RetainerOversightReadinessInput,
): DecisionCentreRetainerMemoryPreview | null {
  if (!memory) return null;

  // Evaluate readiness if input is provided
  let allowedPreviewClaims: string[] = [];
  let prohibitedClaims: string[] = [];
  let readinessStatus: string | undefined;

  if (readinessInput) {
    const readiness = evaluateRetainerOversightReadiness(readinessInput);
    allowedPreviewClaims = readiness.allowedPreviewClaims;
    prohibitedClaims = readiness.prohibitedClaims;
    readinessStatus = readiness.status;
  }

  // Build summary with readiness-aware language
  let summary = memory.summary;
  if (readinessStatus === "NOT_READY" || readinessStatus === "REVIEW_READY") {
    // Use only allowed preview claims
    if (allowedPreviewClaims.length > 0) {
      summary = allowedPreviewClaims[0] ?? summary;
    }
  }

  // Determine operator review CTA visibility
  const operatorReviewRecommended = readinessStatus === "REVIEW_READY" || readinessStatus === "OVERSIGHT_READY";

  // Filter findings to ensure no prohibited claims leak
  const safeFindings = memory.findings.slice(0, 3).map((finding) => ({
    status: finding.status,
    severity: finding.severity,
    signalKey: finding.signalKey,
    source: finding.source ?? null,
    sourceLabel: finding.sourceLabel ?? null,
    explanation: finding.explanation,
    recommendedAction: finding.recommendedAction,
  }));

  return {
    status: readinessStatus === "OVERSIGHT_READY" ? "available"
      : readinessStatus === "REVIEW_READY" ? "partial"
      : memory.status,
    readinessStatus: readinessStatus as "NOT_READY" | "REVIEW_READY" | "OVERSIGHT_READY" | undefined,
    operatorReviewRecommended,
    escalationLevel: memory.escalationLevel,
    escalationRequired: memory.escalationRequired,
    summary,
    findings: safeFindings,
  };
}
