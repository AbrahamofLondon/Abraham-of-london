/**
 * lib/product/oversight-brief-efficacy-scorer.ts — Oversight Brief quality scorer.
 *
 * A retainer-grade brief must justify action, consequence, continuity,
 * delivery readiness, and what visibility would be lost without oversight.
 */

import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type {
  OversightBriefEfficacyScore,
  OversightBriefEfficacyGrade,
  EfficacyDimensionScore,
  BriefSuppression,
} from "@/lib/product/oversight-brief-efficacy-contract";
import { compareOversightCycles } from "@/lib/product/oversight-cycle-comparison";

function countHighValueSignals(brief: OversightBrief): number {
  return [
    brief.costOfInaction && brief.costOfInaction.totalEstimated > 0,
    brief.verification.unresolvedBreaches > 0,
    brief.verification.commitmentsVerified > 0,
    brief.counsel.requiredNow > 0,
    brief.boardroom.dossiersAvailable > 0,
    brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN",
    (brief.retainedEnforcement?.deteriorationSignals ?? 0) > 0,
    (brief.retainedEnforcement?.improvementSignals ?? 0) > 0,
    (brief.decisionLosses?.entries.length ?? 0) > 0,
    brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED"),
    (brief.decisionDependencies?.conflicts.length ?? 0) > 0,
    (brief.irreversibility?.score ?? 0) >= 45,
    Boolean(brief.cycleConsequenceProjection),
    (brief.counselHistory?.totalEvents ?? 0) > 0,
    (brief.boardroomArchive?.totalDossiers ?? 0) > 0,
    (brief.organisationDivergence?.count ?? 0) > 0,
  ].filter(Boolean).length;
}

function hasUnresolvedSensitiveSuppression(suppressions: BriefSuppression[]): boolean {
  return suppressions.some((item) =>
    item.reason === "CLIENT_VISIBILITY_RESTRICTED"
    || item.reason === "RAW_RESPONSE_PROTECTED"
    || item.reason === "LEGAL_OR_REPUTATION_RISK"
  );
}

export function scoreOversightBriefEfficacy(input: {
  brief: OversightBrief;
  previousBrief?: OversightBrief;
  warnings?: string[];
  suppressions?: BriefSuppression[];
  firstCycleException?: boolean;
  clientSafeAvailable?: boolean;
  deliveryState?: string;
}): OversightBriefEfficacyScore {
  const {
    brief,
    previousBrief,
    warnings = [],
    suppressions = [],
    firstCycleException = false,
    clientSafeAvailable = false,
    deliveryState,
  } = input;

  const dimensions: EfficacyDimensionScore[] = [];
  const withholdReasons: string[] = [];
  const operatorNotes: string[] = [];
  const comparison = compareOversightCycles({
    current: brief,
    previous: previousBrief,
  });

  let signalCount = 0;
  if (brief.costOfInaction && brief.costOfInaction.totalEstimated > 0) signalCount++;
  if (brief.verification.commitmentsDue > 0 || brief.verification.unresolvedBreaches > 0) signalCount++;
  if (brief.counsel.reviewsTriggered > 0) signalCount++;
  if (brief.boardroom.dossiersAvailable > 0) signalCount++;
  if (brief.decisionCredit?.score != null) signalCount++;
  if ((brief.retainedEnforcement?.deteriorationSignals ?? 0) > 0 || (brief.retainedEnforcement?.improvementSignals ?? 0) > 0) signalCount++;
  if (brief.activeCases.length > 0) signalCount++;
  if (brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN") signalCount++;
  if ((brief.decisionLosses?.entries.length ?? 0) > 0) signalCount++;
  if (brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED")) signalCount++;
  if ((brief.irreversibility?.score ?? 0) >= 45) signalCount++;
  if ((brief.decisionDependencies?.conflicts.length ?? 0) > 0) signalCount++;
  if (brief.cycleConsequenceProjection) signalCount++;
  if ((brief.counselHistory?.totalEvents ?? 0) > 0) signalCount++;
  if ((brief.boardroomArchive?.totalDossiers ?? 0) > 0) signalCount++;
  if ((brief.organisationDivergence?.count ?? 0) > 0) signalCount++;

  const highValueSignalCount = countHighValueSignals(brief);
  const hasCost = Boolean(brief.costOfInaction && brief.costOfInaction.totalEstimated > 0);
  const hasBreaches = brief.verification.unresolvedBreaches > 0;
  const hasCounselRequired = brief.counsel.requiredNow > 0;
  const hasBoardroom = brief.boardroom.dossiersAvailable > 0;
  const hasOutcomeVerified = brief.verification.commitmentsVerified > 0;
  const hasRetainedEnforcement = Boolean(brief.retainedEnforcement?.cyclesReviewed);
  const hasConsequenceProjection = Boolean(brief.cycleConsequenceProjection);
  const unresolvedSensitiveSuppression = hasUnresolvedSensitiveSuppression(suppressions);
  const actionCount = brief.requiredActions.length;
  const realDeltaCount = comparison.deltas.filter((delta) => delta.direction !== "UNCHANGED").length;
  const hasLossWithoutEvidence = brief.decisionLosses?.entries.some((item) => item.evidenceBasis.length === 0) ?? false;
  const hasIrreversibilityWithoutDrivers = Boolean(brief.irreversibility && brief.irreversibility.score > 0 && brief.irreversibility.drivers.length === 0);
  const hasCadenceStatus = Boolean(brief.cadence?.status);
  const hasBoardroomArchive = (brief.boardroomArchive?.totalDossiers ?? 0) > 0;
  const hasCounselHistory = (brief.counselHistory?.totalEvents ?? 0) > 0;
  const hasOrganisationDivergence = (brief.organisationDivergence?.count ?? 0) > 0;
  const hasCancellationLoss = (brief.cancellationLoss?.lostVisibility.length ?? 0) > 0;
  const hasIndispensability = (brief.indispensability?.wouldLose.length ?? 0) > 0;
  const deliveryReady = clientSafeAvailable && deliveryState && deliveryState !== "NOT_READY" && deliveryState !== "WITHHELD";

  dimensions.push({
    dimension: "SIGNAL_DENSITY",
    score: Math.min(100, signalCount * 12),
    reason: `${signalCount} live signal${signalCount !== 1 ? "s" : ""} present in brief.`,
    requiredImprovement: signalCount < 3 ? "Brief needs at least 3 live signals to be substantive." : undefined,
  });

  const evidenceScore = (hasOutcomeVerified ? 30 : 0) + (brief.activeCases.length >= 2 ? 25 : 0) + (brief.activeCases.length > 0 ? 20 : 0) + (hasRetainedEnforcement ? 20 : 0);
  dimensions.push({
    dimension: "EVIDENCE_STRENGTH",
    score: Math.min(100, evidenceScore),
    reason: `${brief.activeCases.length} active case${brief.activeCases.length !== 1 ? "s" : ""}. ${brief.verification.commitmentsVerified} verified commitment${brief.verification.commitmentsVerified !== 1 ? "s" : ""}.`,
    requiredImprovement: evidenceScore < 50 ? "Strengthen evidence through multi-case or outcome-verified data." : undefined,
  });

  const casesWithActions = brief.activeCases.filter((item) => item.nextAction).length;
  const casesNamed = brief.activeCases.filter((item) => item.title && item.title.length > 10).length;
  dimensions.push({
    dimension: "DECISION_SPECIFICITY",
    score: Math.min(100, (casesWithActions * 22) + (casesNamed * 12) + (brief.structuredActions?.length ? 18 : 0)),
    reason: `${casesNamed} case${casesNamed !== 1 ? "s" : ""} specifically named. ${casesWithActions} with next action.`,
    requiredImprovement: casesWithActions === 0 ? "Brief needs more case-specific action logic." : undefined,
  });

  const actionabilityScore = actionCount >= 3 ? 100 : actionCount >= 2 ? 80 : actionCount >= 1 ? 55 : 0;
  dimensions.push({
    dimension: "ACTIONABILITY",
    score: actionabilityScore,
    reason: `${actionCount} required action${actionCount !== 1 ? "s" : ""} in brief.`,
    requiredImprovement: actionCount === 0 ? "CRITICAL: Brief has no required actions. Cannot be delivered." : undefined,
  });
  if (actionCount === 0) {
    withholdReasons.push("No required actions exist. A brief without actions wastes institutional credibility.");
  }

  dimensions.push({
    dimension: "CONSEQUENCE_CLARITY",
    score: Math.min(
      100,
      (hasCost ? 24 : 0)
        + (hasBreaches ? 18 : 0)
        + (hasCounselRequired ? 18 : 0)
        + (brief.activeCases.some((item) => item.primaryRisk) ? 14 : 0)
        + (brief.irreversibility ? 14 : 0)
        + (brief.decisionLosses?.entries.length ? 12 : 0),
    ),
    reason: `Cost: ${hasCost ? "present" : "absent"}. Breaches: ${hasBreaches ? "yes" : "none"}. Counsel: ${hasCounselRequired ? "required" : "not required"}.`,
  });

  const continuityScore = comparison.available
    ? Math.min(
        100,
        realDeltaCount * 16
          + (hasRetainedEnforcement ? 14 : 0)
          + (hasCadenceStatus ? 14 : 0)
          + (hasBoardroomArchive ? 12 : 0)
          + (hasCounselHistory ? 12 : 0),
      )
    : (hasRetainedEnforcement ? 15 : 0) + (hasCadenceStatus ? 10 : 0);
  dimensions.push({
    dimension: "CONTINUITY_VALUE",
    score: Math.min(100, continuityScore),
    reason: comparison.available
      ? `${realDeltaCount} real cycle-to-cycle delta${realDeltaCount === 1 ? "" : "s"} detected.`
      : "No prior oversight cycle data. Brief lacks trend comparison.",
    requiredImprovement: !comparison.available
      ? "First-cycle briefs cannot be formidable without manual justification."
      : continuityScore < 35
        ? "Continuity exists but lacks specific movement across cycles."
        : undefined,
  });

  dimensions.push({
    dimension: "EXECUTIVE_RELEVANCE",
    score: Math.min(
      100,
      (hasBoardroom ? 22 : 0)
        + (brief.counsel.reviewsTriggered > 0 ? 14 : 0)
        + (hasCost ? 12 : 0)
        + (actionCount >= 2 ? 8 : 0)
        + (hasBoardroomArchive ? 14 : 0)
        + (hasCounselHistory ? 10 : 0)
        + (hasOrganisationDivergence ? 14 : 0),
    ),
    reason: `Boardroom: ${hasBoardroom ? "qualified" : "not qualified"}. Counsel: ${brief.counsel.reviewsTriggered > 0 ? "triggered" : "not triggered"}.`,
  });

  dimensions.push({
    dimension: "SUPPRESSION_SAFETY",
    score: suppressions.length === 0 ? 100 : unresolvedSensitiveSuppression ? 0 : 70,
    reason: suppressions.length === 0
      ? "No sensitive data suppressions required."
      : `${suppressions.length} suppression${suppressions.length !== 1 ? "s" : ""} applied. ${unresolvedSensitiveSuppression ? "Blocking sensitivity remains." : "Suppressions are bounded and transparent."}`,
  });

  const clientWouldMiss = [
    hasCost ? "cost accumulation" : null,
    hasBreaches ? "commitment breaches" : null,
    hasBoardroom ? "boardroom threshold" : null,
    brief.counsel.reviewsTriggered > 0 ? "counsel trigger" : null,
    brief.decisionCredit?.trend && brief.decisionCredit.trend !== "stable" ? "decision credit movement" : null,
    (brief.decisionLosses?.entries.length ?? 0) > 0 ? "realised decision losses" : null,
    brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED") ? "strategic option decay" : null,
    (brief.irreversibility?.score ?? 0) >= 45 ? "irreversibility movement" : null,
    (brief.decisionDependencies?.conflicts.length ?? 0) > 0 ? "decision dependency conflict" : null,
    brief.patternRecurrence && (brief.patternRecurrence.status === "POSSIBLE_RECURRENCE" || brief.patternRecurrence.status === "VERIFIED_RECURRENCE")
      ? "pattern recurrence"
      : null,
    hasOrganisationDivergence ? "organisation divergence" : null,
    hasBoardroomArchive ? "boardroom memory" : null,
    hasCounselHistory ? "counsel history" : null,
  ].filter(Boolean);

  dimensions.push({
    dimension: "RETAINER_VALUE_PROOF",
    score: Math.min(
      100,
      clientWouldMiss.length * 10
        + (hasCancellationLoss ? 24 : 0)
        + (hasIndispensability ? 24 : 0)
        + (deliveryReady ? 12 : 0),
    ),
    reason: clientWouldMiss.length > 0
      ? `Client would have missed: ${clientWouldMiss.join(", ")}.`
      : "Brief does not clearly demonstrate what the client would have missed without oversight.",
    requiredImprovement: !hasCancellationLoss || !hasIndispensability
      ? "Brief needs clearer proof of what visibility would be lost if oversight stopped."
      : undefined,
  });

  for (const warning of warnings) operatorNotes.push(`Warning from composer: ${warning}`);
  for (const warning of comparison.warnings) operatorNotes.push(`Comparison warning: ${warning}`);

  const hasRequiredAction = actionCount >= 1;
  const hasConsequence = Boolean(hasCost || hasBreaches || hasCounselRequired || hasBoardroom || (brief.retainedEnforcement?.deteriorationSignals ?? 0) > 0);
  const hasEvidenceBasis = Boolean(brief.activeCases.length > 0 || brief.verification.commitmentsVerified > 0 || brief.retainedEnforcement?.cyclesReviewed);
  const hasContinuityOrVerification = Boolean(
    comparison.available
    || brief.verification.commitmentsDue > 0
    || brief.verification.commitmentsVerified > 0
    || brief.verification.unresolvedBreaches > 0
    || brief.retainedEnforcement?.cyclesReviewed,
  );

  if (unresolvedSensitiveSuppression) withholdReasons.push("Client-safe rendering still carries unresolved sensitive material.");
  if (!clientSafeAvailable) withholdReasons.push("No client-safe brief has been produced for delivery review.");
  if (!hasConsequenceProjection && highValueSignalCount < 2) withholdReasons.push("No consequence projection exists and there are not enough other high-value signals to justify delivery.");
  if (hasLossWithoutEvidence) withholdReasons.push("The brief claims decision loss without evidence basis.");
  if (hasIrreversibilityWithoutDrivers) withholdReasons.push("The brief claims irreversibility without evidential drivers.");
  if (!hasCancellationLoss) operatorNotes.push("Cancellation-loss clarity is absent. The client-facing value of continuity is under-proven.");
  if (!hasIndispensability) operatorNotes.push("Indispensability summary is absent. The brief does not fully express what visibility would be lost if oversight stopped.");
  if (!hasCadenceStatus) operatorNotes.push("Cadence status is unavailable. Retainer operating rhythm is not yet visible in the brief.");
  if (!deliveryReady) operatorNotes.push("Delivery readiness is not yet established. Review may continue, but the brief is not client-deliverable.");

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
    brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED") ? "option decay" : null,
    (brief.decisionDependencies?.conflicts.length ?? 0) > 0 ? "dependency conflict" : null,
    hasOrganisationDivergence ? "organisation divergence" : null,
  ].filter(Boolean);

  const totalScore = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length);
  const formidableCandidate = totalScore >= 75 && actionCount >= 2 && signalCount >= 4 && formidableSignals.length >= 4;
  const comparisonRequiredButUnavailable = formidableCandidate && !comparison.available && !firstCycleException;
  if (comparisonRequiredButUnavailable) {
    withholdReasons.push("Historical comparison would be required to justify this grade, but no prior cycle exists and no first-cycle exception is recorded.");
  }

  let grade: OversightBriefEfficacyGrade;
  if (withholdReasons.length > 0) {
    grade = "WITHHOLD";
  } else if (!hasRequiredAction || !hasConsequence || !hasEvidenceBasis || !hasContinuityOrVerification) {
    grade = totalScore >= 40 ? "ADEQUATE" : "WEAK";
    operatorNotes.push("Brief cannot auto-deliver because it lacks one of: required action, consequence, evidence basis, or continuity/verification marker.");
  } else if (
    (comparison.available || firstCycleException)
    && formidableCandidate
    && clientSafeAvailable
    && deliveryReady
    && hasCancellationLoss
    && !unresolvedSensitiveSuppression
  ) {
    grade = "FORMIDABLE";
  } else if (totalScore >= 60 && actionCount >= 1 && !unresolvedSensitiveSuppression && highValueSignalCount >= 3 && clientSafeAvailable) {
    grade = "STRONG";
  } else if (totalScore >= 40) {
    grade = "ADEQUATE";
  } else {
    grade = "WEAK";
  }

  if (!comparison.available) {
    operatorNotes.push("No previous cycle exists. FORMIDABLE grade requires manual justification and is therefore withheld from automatic scoring.");
  }
  if (firstCycleException) {
    operatorNotes.push("A first-cycle exception was supplied. Operator justification is still required before delivery.");
  }
  if (grade !== "FORMIDABLE" && totalScore >= 75 && formidableSignals.length < 4) {
    operatorNotes.push("Brief score is high, but it lacks the four retainer-grade movement dimensions required for FORMIDABLE.");
  }
  if (grade === "STRONG" && !deliveryReady) {
    operatorNotes.push("Brief quality may be strong, but delivery readiness is not yet established.");
  }

  return {
    grade,
    totalScore,
    dimensions,
    withholdReasons,
    operatorNotes,
  };
}
