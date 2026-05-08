/**
 * lib/product/oversight-brief-efficacy-scorer.ts — Oversight Brief quality scorer.
 *
 * Evaluates whether a generated brief is formidable, strong, adequate,
 * weak, or should be withheld. A brief that does not make non-action
 * harder to justify has failed.
 */

import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type {
  OversightBriefEfficacyScore,
  OversightBriefEfficacyGrade,
  EfficacyDimensionScore,
  BriefSuppression,
} from "@/lib/product/oversight-brief-efficacy-contract";
import { compareOversightCycles } from "@/lib/product/oversight-cycle-comparison";

// ─────────────────────────────────────────────────────────────────────────────
// SCORER
// ─────────────────────────────────────────────────────────────────────────────

export function scoreOversightBriefEfficacy(input: {
  brief: OversightBrief;
  previousBrief?: OversightBrief;
  warnings?: string[];
  suppressions?: BriefSuppression[];
}): OversightBriefEfficacyScore {
  const { brief, previousBrief, warnings = [], suppressions = [] } = input;
  const dimensions: EfficacyDimensionScore[] = [];
  const withholdReasons: string[] = [];
  const operatorNotes: string[] = [];
  const comparison = compareOversightCycles({
    current: brief,
    previous: previousBrief,
  });

  // ── 1. SIGNAL DENSITY ──
  let signalCount = 0;
  if (brief.costOfInaction && brief.costOfInaction.totalEstimated > 0) signalCount++;
  if (brief.verification.commitmentsDue > 0 || brief.verification.unresolvedBreaches > 0) signalCount++;
  if (brief.counsel.reviewsTriggered > 0) signalCount++;
  if (brief.boardroom.dossiersAvailable > 0) signalCount++;
  if (brief.decisionCredit?.score != null) signalCount++;
  if (brief.retainedEnforcement?.deteriorationSignals) signalCount++;
  if (brief.activeCases.length > 0) signalCount++;

  const signalDensityScore = Math.min(100, signalCount * 15);
  dimensions.push({
    dimension: "SIGNAL_DENSITY",
    score: signalDensityScore,
    reason: `${signalCount} live signal${signalCount !== 1 ? "s" : ""} present in brief.`,
    requiredImprovement: signalCount < 3 ? "Brief needs at least 3 live signals to be substantive." : undefined,
  });

  // ── 2. EVIDENCE STRENGTH ──
  const hasOutcomeVerified = brief.verification.commitmentsVerified > 0;
  const hasMultiCase = brief.activeCases.length >= 2;
  const evidenceScore = (hasOutcomeVerified ? 40 : 0) + (hasMultiCase ? 30 : 0) + (brief.activeCases.length > 0 ? 20 : 0);
  dimensions.push({
    dimension: "EVIDENCE_STRENGTH",
    score: Math.min(100, evidenceScore),
    reason: `${brief.activeCases.length} active case${brief.activeCases.length !== 1 ? "s" : ""}. ${brief.verification.commitmentsVerified} verified commitment${brief.verification.commitmentsVerified !== 1 ? "s" : ""}.`,
    requiredImprovement: evidenceScore < 50 ? "Strengthen evidence through multi-case or outcome-verified data." : undefined,
  });

  // ── 3. DECISION SPECIFICITY ──
  const casesWithActions = brief.activeCases.filter((c) => c.nextAction).length;
  const casesNamed = brief.activeCases.filter((c) => c.title && c.title.length > 10).length;
  const specificityScore = Math.min(100, (casesWithActions * 25) + (casesNamed * 15));
  dimensions.push({
    dimension: "DECISION_SPECIFICITY",
    score: specificityScore,
    reason: `${casesNamed} case${casesNamed !== 1 ? "s" : ""} specifically named. ${casesWithActions} with next action.`,
    requiredImprovement: specificityScore < 50 ? "Brief needs specific case names and actions, not generic language." : undefined,
  });

  // ── 4. ACTIONABILITY ──
  const actionCount = brief.requiredActions.length;
  const actionabilityScore = actionCount >= 3 ? 100 : actionCount >= 1 ? 60 : 0;
  dimensions.push({
    dimension: "ACTIONABILITY",
    score: actionabilityScore,
    reason: `${actionCount} required action${actionCount !== 1 ? "s" : ""} in brief.`,
    requiredImprovement: actionCount === 0 ? "CRITICAL: Brief has no required actions. Cannot be delivered." : undefined,
  });

  if (actionCount === 0) {
    withholdReasons.push("No required actions exist. A brief without actions wastes institutional credibility.");
  }

  // ── 5. CONSEQUENCE CLARITY ──
  const hasCost = brief.costOfInaction && brief.costOfInaction.totalEstimated > 0;
  const hasBreaches = brief.verification.unresolvedBreaches > 0;
  const hasCounselRequired = brief.counsel.requiredNow > 0;
  const consequenceScore = (hasCost ? 35 : 0) + (hasBreaches ? 25 : 0) + (hasCounselRequired ? 25 : 0) + (brief.activeCases.some((c) => c.primaryRisk) ? 15 : 0);
  dimensions.push({
    dimension: "CONSEQUENCE_CLARITY",
    score: Math.min(100, consequenceScore),
    reason: `Cost: ${hasCost ? "present" : "absent"}. Breaches: ${hasBreaches ? "yes" : "none"}. Counsel: ${hasCounselRequired ? "required" : "not required"}.`,
  });

  // ── 6. CONTINUITY VALUE ──
  const realDeltaCount = comparison.deltas.filter((delta) => delta.direction !== "UNCHANGED").length;
  const hasRetainedEnforcement = brief.retainedEnforcement && brief.retainedEnforcement.cyclesReviewed > 0;
  const continuityScore = comparison.available
    ? Math.min(100, realDeltaCount * 20 + (hasRetainedEnforcement ? 20 : 0))
    : (hasRetainedEnforcement ? 15 : 0);
  dimensions.push({
    dimension: "CONTINUITY_VALUE",
    score: Math.min(100, continuityScore),
    reason: comparison.available
      ? `${realDeltaCount} real cycle-to-cycle delta${realDeltaCount === 1 ? "" : "s"} detected.`
      : "No prior oversight cycle data. Brief lacks trend comparison.",
    requiredImprovement: !comparison.available
      ? "First-cycle briefs cannot be formidable without manual justification."
      : continuityScore < 30
        ? "Continuity exists but lacks specific movement across cycles."
        : undefined,
  });

  // ── 7. EXECUTIVE RELEVANCE ──
  const hasBoardroom = brief.boardroom.dossiersAvailable > 0;
  const hasCounsel = brief.counsel.reviewsTriggered > 0;
  const execScore = (hasBoardroom ? 40 : 0) + (hasCounsel ? 30 : 0) + (hasCost ? 20 : 0) + (actionCount >= 2 ? 10 : 0);
  dimensions.push({
    dimension: "EXECUTIVE_RELEVANCE",
    score: Math.min(100, execScore),
    reason: `Boardroom: ${hasBoardroom ? "qualified" : "not qualified"}. Counsel: ${hasCounsel ? "triggered" : "not triggered"}.`,
  });

  // ── 8. SUPPRESSION SAFETY ──
  const hasSensitiveSuppression = suppressions.some((s) =>
    s.reason.toLowerCase().includes("raw") || s.reason.toLowerCase().includes("identity") || s.reason.toLowerCase().includes("anonymous"),
  );
  const suppressionScore = suppressions.length === 0 ? 100 : hasSensitiveSuppression ? 0 : 70;
  dimensions.push({
    dimension: "SUPPRESSION_SAFETY",
    score: suppressionScore,
    reason: suppressions.length === 0
      ? "No sensitive data suppressions required."
      : `${suppressions.length} suppression${suppressions.length !== 1 ? "s" : ""} applied. ${hasSensitiveSuppression ? "CRITICAL: Sensitive data detected." : "Non-critical suppressions."}`,
  });

  if (hasSensitiveSuppression) {
    withholdReasons.push("Client-safe brief contains or nearly contains raw/anonymous/identity-sensitive data.");
  }

  // ── 9. RETAINER VALUE PROOF ──
  const hasCreditTrend = brief.decisionCredit?.trend && brief.decisionCredit.trend !== "stable";
  const clientWouldMiss = [
    hasCost ? "cost accumulation" : null,
    hasBreaches ? "commitment breaches" : null,
    hasBoardroom ? "boardroom threshold" : null,
    hasCounsel ? "counsel trigger" : null,
    hasCreditTrend ? "decision credit movement" : null,
  ].filter(Boolean);

  const retainerProofScore = Math.min(100, clientWouldMiss.length * 25);
  dimensions.push({
    dimension: "RETAINER_VALUE_PROOF",
    score: retainerProofScore,
    reason: clientWouldMiss.length > 0
      ? `Client would have missed: ${clientWouldMiss.join(", ")}.`
      : "Brief does not clearly demonstrate what the client would have missed without oversight.",
    requiredImprovement: retainerProofScore < 50 ? "Brief needs stronger proof of oversight value." : undefined,
  });

  // ── WARNINGS → OPERATOR NOTES ──
  for (const w of warnings) {
    operatorNotes.push(`Warning from composer: ${w}`);
  }
  for (const w of comparison.warnings) {
    operatorNotes.push(`Comparison warning: ${w}`);
  }

  const hasRequiredAction = actionCount >= 1;
  const hasConsequence = Boolean(hasCost || hasBreaches || hasCounselRequired || hasBoardroom || brief.retainedEnforcement?.deteriorationSignals);
  const hasEvidenceBasis = Boolean(brief.activeCases.length > 0 || brief.verification.commitmentsVerified > 0 || brief.retainedEnforcement?.cyclesReviewed);
  const hasContinuityOrVerification = Boolean(
    comparison.available
    || brief.verification.commitmentsDue > 0
    || brief.verification.commitmentsVerified > 0
    || brief.verification.unresolvedBreaches > 0
    || brief.retainedEnforcement?.cyclesReviewed,
  );

  const formidableSignals = [
    comparison.deltas.find((delta) => delta.dimension === "COST" && delta.direction !== "UNCHANGED") ? "cost movement" : null,
    comparison.deltas.find((delta) => delta.dimension === "COMMITMENT" && delta.direction !== "UNCHANGED") ? "commitment movement" : null,
    comparison.deltas.find((delta) => delta.dimension === "RECURRENCE" && delta.direction !== "UNCHANGED") ? "recurrence movement" : null,
    comparison.deltas.find((delta) => delta.dimension === "DECISION_CREDIT" && delta.direction !== "UNCHANGED") ? "decision credit movement" : null,
    brief.counsel.requiredNow > 0 ? "counsel trigger" : null,
    brief.boardroom.dossiersAvailable > 0 ? "boardroom threshold" : null,
    comparison.deltas.find((delta) => delta.dimension === "OUTCOME" && delta.direction !== "UNCHANGED")
      || ((brief.retainedEnforcement?.improvementSignals ?? 0) + (brief.retainedEnforcement?.deteriorationSignals ?? 0) > 0)
      ? "outcome movement"
      : null,
    comparison.deltas.find((delta) => delta.dimension === "IRREVERSIBILITY" && delta.direction !== "UNCHANGED") ? "irreversibility movement" : null,
  ].filter(Boolean);

  // ── TOTAL SCORE + GRADE ──
  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );

  let grade: OversightBriefEfficacyGrade;
  if (withholdReasons.length > 0) {
    grade = "WITHHOLD";
  } else if (!hasRequiredAction || !hasConsequence || !hasEvidenceBasis || !hasContinuityOrVerification) {
    grade = totalScore >= 40 ? "ADEQUATE" : "WEAK";
    operatorNotes.push("Brief cannot auto-deliver because it lacks one of: required action, consequence, evidence basis, or continuity/verification marker.");
  } else if (comparison.available && realDeltaCount > 0 && formidableSignals.length >= 4 && totalScore >= 75 && actionCount >= 2 && signalCount >= 4) {
    grade = "FORMIDABLE";
  } else if (totalScore >= 60 && actionCount >= 1) {
    grade = "STRONG";
  } else if (totalScore >= 40) {
    grade = "ADEQUATE";
  } else {
    grade = "WEAK";
  }

  if (!comparison.available) {
    operatorNotes.push("No previous cycle exists. FORMIDABLE grade requires manual justification and is therefore withheld from automatic scoring.");
  }
  if (grade !== "FORMIDABLE" && totalScore >= 75 && formidableSignals.length < 4) {
    operatorNotes.push("Brief score is high, but it lacks the four retainer-grade movement dimensions required for FORMIDABLE.");
  }

  return {
    grade,
    totalScore,
    dimensions,
    withholdReasons,
    operatorNotes,
  };
}
