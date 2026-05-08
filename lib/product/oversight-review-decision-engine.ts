import type { ClientSafeOversightBrief, OversightSuppression } from "@/lib/product/client-safe-oversight-brief";
import type { OversightBriefEfficacyScore } from "@/lib/product/oversight-brief-efficacy-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import type {
  OversightReviewDecision,
  OversightReviewDecisionReason,
} from "@/lib/product/oversight-review-decision-contract";

function hasUnresolvedSensitiveSuppression(suppressions: OversightSuppression[]): boolean {
  return suppressions.some((item) =>
    item.reason === "CLIENT_VISIBILITY_RESTRICTED"
    || item.reason === "RAW_RESPONSE_PROTECTED"
    || item.reason === "LEGAL_OR_REPUTATION_RISK"
  );
}

function hasInsufficientEvidenceWarning(warnings: string[]): boolean {
  return warnings.some((warning) => {
    const text = warning.toLowerCase();
    return text.includes("insufficient")
      || text.includes("no prior")
      || text.includes("no verified")
      || text.includes("no canonical")
      || text.includes("not enough")
      || text.includes("no active cases")
      || text.includes("no material oversight signals");
  });
}

export function recommendOversightReviewDecision(input: {
  efficacy: OversightBriefEfficacyScore;
  suppressions: OversightSuppression[];
  warnings: string[];
  cycleComparison?: OversightCycleComparison | null;
  clientSafeBrief?: ClientSafeOversightBrief | null;
  hasCounselTrigger?: boolean;
  hasBoardroomTrigger?: boolean;
}): {
  recommendedDecision: OversightReviewDecision;
  reasons: OversightReviewDecisionReason[];
  deliveryAllowed: boolean;
  operatorNoteRequired: boolean;
  explanation: string;
} {
  const unresolvedSensitive = hasUnresolvedSensitiveSuppression(input.suppressions);
  const insufficientEvidence = hasInsufficientEvidenceWarning(input.warnings)
    || input.efficacy.operatorNotes.some((note) => note.toLowerCase().includes("lacks one of"));
  const hasClientSafeBrief = Boolean(input.clientSafeBrief?.brief);
  const noRequiredActions = input.clientSafeBrief?.brief.requiredActions.length === 0;
  const noVerifiedEvidence = input.clientSafeBrief?.brief.verification.commitmentsVerified === 0
    && input.clientSafeBrief?.brief.activeCases.length === 0;
  const firstCycleNoComparison = input.cycleComparison?.available === false;

  if (input.hasBoardroomTrigger) {
    return {
      recommendedDecision: "ESCALATE_TO_BOARDROOM",
      reasons: ["BOARDROOM_THRESHOLD_MET", "DELIVERY_NOT_READY"],
      deliveryAllowed: false,
      operatorNoteRequired: true,
      explanation: "Boardroom threshold is already met, so this cycle should be escalated rather than delivered as a routine client brief.",
    };
  }

  if (input.hasCounselTrigger && (!hasClientSafeBrief || unresolvedSensitive || input.efficacy.grade === "WITHHOLD")) {
    return {
      recommendedDecision: "ESCALATE_TO_COUNSEL",
      reasons: ["COUNSEL_REQUIRED", "DELIVERY_NOT_READY"],
      deliveryAllowed: false,
      operatorNoteRequired: true,
      explanation: "Counsel review is required and the current client-safe output does not resolve that escalation boundary cleanly.",
    };
  }

  if (input.efficacy.grade === "WITHHOLD" || unresolvedSensitive) {
    return {
      recommendedDecision: "WITHHOLD_FROM_CLIENT",
      reasons: unresolvedSensitive
        ? ["SENSITIVE_DATA_SUPPRESSED", "DELIVERY_NOT_READY"]
        : ["EFFICACY_TOO_LOW", "DELIVERY_NOT_READY"],
      deliveryAllowed: false,
      operatorNoteRequired: true,
      explanation: unresolvedSensitive
        ? "Sensitive material remains unresolved for client delivery."
        : "The brief is not strong enough to deliver safely to the client.",
    };
  }

  if (insufficientEvidence || noRequiredActions || noVerifiedEvidence || (!input.cycleComparison?.available && firstCycleNoComparison && input.efficacy.grade !== "STRONG")) {
    return {
      recommendedDecision: "WAIT_FOR_MORE_EVIDENCE",
      reasons: ["INSUFFICIENT_EVIDENCE", "DELIVERY_NOT_READY"],
      deliveryAllowed: false,
      operatorNoteRequired: false,
      explanation: "The brief lacks enough verified continuity, actionability, or evidence to move into client delivery.",
    };
  }

  if (input.efficacy.grade === "WEAK" || input.efficacy.grade === "ADEQUATE") {
    return {
      recommendedDecision: "REVISE_BEFORE_DELIVERY",
      reasons: ["EFFICACY_TOO_LOW", "DELIVERY_NOT_READY"],
      deliveryAllowed: false,
      operatorNoteRequired: false,
      explanation: "The brief is materially usable but still requires revision before delivery.",
    };
  }

  if ((input.efficacy.grade === "STRONG" || input.efficacy.grade === "FORMIDABLE") && hasClientSafeBrief) {
    return {
      recommendedDecision: "APPROVE_FOR_CLIENT",
      reasons: ["CLIENT_SAFE", "OPERATOR_APPROVED"],
      deliveryAllowed: true,
      operatorNoteRequired: false,
      explanation: "The brief is strong, client-safe, and ready for governed operator approval.",
    };
  }

  return {
    recommendedDecision: "WAIT_FOR_MORE_EVIDENCE",
    reasons: ["INSUFFICIENT_EVIDENCE", "DELIVERY_NOT_READY"],
    deliveryAllowed: false,
    operatorNoteRequired: false,
    explanation: "The brief does not yet meet the threshold for a confident delivery recommendation.",
  };
}
