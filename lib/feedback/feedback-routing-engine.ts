import { prisma } from "@/lib/prisma.server";
import type {
  FeedbackActionStatus,
  FeedbackEventRecord,
  FeedbackRating,
} from "./feedback-types";

export type FeedbackCtaCandidate = {
  id: string;
  label: string;
  href: string;
  reason: string;
};

export type FeedbackAdminActionCandidate = {
  id: string;
  label: string;
  reason: string;
  actionType:
    | "admin_review"
    | "sales_followup"
    | "case_study_candidate"
    | "falsification_review"
    | "retainer_readiness"
    | "conversion_correlation";
};

export type FeedbackRoutingResult = {
  publicMessage: string;
  userCtas: FeedbackCtaCandidate[];
  adminActions: FeedbackAdminActionCandidate[];
  retainerReadinessSignal: boolean;
  caseStudyCandidateClass: string | null;
  conversionCorrelationTags: string[];
  reviewEscalationState: "none" | "review_required" | "risk_review";
  actionKind:
    | "no_action"
    | "user_next_step_prompt"
    | "admin_review"
    | "sales_followup"
    | "case_study_candidate"
    | "falsification_risk_review"
    | "retainer_readiness_signal"
    | "conversion_correlation_signal";
};

const FREE_ADOPTION_SURFACES = new Set([
  "pressure_signal_result",
  "fast_diagnostic_result",
  "boardroom_brief_sample",
  "case_study_public",
  "gmi_report",
  "playbook_download",
]);

const PAID_SURFACES = new Set([
  "boardroom_brief_delivered",
  "strategy_room_session",
  "return_brief_outcome",
  "retainer_review_cycle",
  "admin_delivery",
]);

const SERIOUS_NEGATIVE_CATEGORIES = new Set([
  "accuracy",
  "trust",
  "evidence_quality",
  "delivery_quality",
  "outcome_relevance",
]);

function isPaid(event: FeedbackEventRecord): boolean {
  if (event.linkedOrderId || event.linkedArtifactId) return true;
  if (PAID_SURFACES.has(event.surface)) return true;
  if (FREE_ADOPTION_SURFACES.has(event.surface)) return false;
  return Boolean(event.productCode);
}

function hasHighConfidence(event: FeedbackEventRecord): boolean {
  return event.confidence >= 4;
}

function baseMessage(event: FeedbackEventRecord): string {
  if (event.rating === "negative" && SERIOUS_NEGATIVE_CATEGORIES.has(event.category)) {
    return "Recorded for review. This type of feedback is used to check accuracy and evidence quality.";
  }
  return "Feedback received. Thank you.";
}

function adoptionCtas(event: FeedbackEventRecord): FeedbackCtaCandidate[] {
  if (event.rating !== "positive" || !hasHighConfidence(event)) return [];

  switch (event.surface) {
    case "pressure_signal_result":
      return [
        { id: "save-governed-case", label: "Save this as a governed case", href: "/decision-centre", reason: "High-confidence positive pressure signal." },
        { id: "boardroom-brief", label: "Get a Boardroom Brief", href: "/boardroom-brief", reason: "Pressure signal created trust in the next decision artifact." },
        { id: "compare-decision", label: "Compare this against your current decision", href: "/decision-centre", reason: "Comparison is the next governed action after signal clarity." },
      ];
    case "fast_diagnostic_result":
      return [
        { id: "create-governed-case", label: "Turn this into a governed case", href: "/decision-centre", reason: "Diagnostic feedback indicates readiness for continuity." },
        { id: "request-boardroom-brief", label: "Request a Boardroom Brief", href: "/boardroom-brief", reason: "Diagnostic result created enough confidence for a paid brief path." },
        { id: "continue-strategy-room", label: "Continue into Strategy Room", href: "/strategy-room", reason: "Actionable diagnostic feedback can route into execution planning." },
      ];
    case "boardroom_brief_sample":
      if (event.category !== "trust" && event.category !== "usefulness") return [];
      return [
        { id: "paid-brief-standard", label: "This is the standard the paid brief expands", href: "/boardroom-brief", reason: "Sample feedback created trust in paid-product depth." },
        { id: "get-full-boardroom-brief", label: "Get the full Boardroom Brief", href: "/boardroom-brief", reason: "Trust in sample is a direct adoption signal." },
      ];
    case "case_study_public":
      return [
        { id: "view-boardroom-brief", label: "See the Boardroom Brief path", href: "/boardroom-brief", reason: "Case-study trust can route to a comparable product path." },
      ];
    case "gmi_report":
    case "playbook_download":
      return [
        { id: "save-case", label: "Create a case from this", href: "/decision-centre", reason: "Content usefulness can become governed memory." },
      ];
    default:
      if (event.category === "actionability" && event.surface.includes("diagnostic")) {
        return [
          { id: "create-case", label: "Create a case from this", href: "/decision-centre", reason: "Actionability feedback should route to case creation." },
          { id: "send-to-self", label: "Send this to yourself", href: "/account", reason: "Actionable result may need retention." },
          { id: "continue-strategy-room", label: "Continue into Strategy Room", href: "/strategy-room", reason: "Actionable signal can become execution work." },
        ];
      }
      return [];
  }
}

function chooseActionKind(input: {
  event: FeedbackEventRecord;
  userCtas: FeedbackCtaCandidate[];
  adminActions: FeedbackAdminActionCandidate[];
  retainerReadinessSignal: boolean;
  paid: boolean;
}): FeedbackRoutingResult["actionKind"] {
  const { event, userCtas, adminActions, retainerReadinessSignal, paid } = input;
  if (event.rating === "negative" && SERIOUS_NEGATIVE_CATEGORIES.has(event.category) && paid) return "falsification_risk_review";
  if (event.rating === "negative" && adminActions.some((item) => item.actionType === "admin_review")) return "admin_review";
  if (retainerReadinessSignal) return "retainer_readiness_signal";
  if (event.rating === "positive" && paid) return "case_study_candidate";
  if (event.rating === "positive" && event.followupRequested) return "sales_followup";
  if (userCtas.length > 0) return "user_next_step_prompt";
  if (event.rating === "positive" && FREE_ADOPTION_SURFACES.has(event.surface)) return "conversion_correlation_signal";
  return "no_action";
}

async function countRecentFeedback(event: FeedbackEventRecord, rating?: FeedbackRating): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return (prisma as any).feedbackEvent.count({
    where: {
      ...(event.email ? { email: event.email } : event.userId ? { userId: event.userId } : { sessionId: event.sessionId ?? "__none__" }),
      ...(rating ? { rating } : {}),
      createdAt: { gte: since },
    },
  }).catch(() => 0);
}

export async function evaluateFeedbackRouting(event: FeedbackEventRecord): Promise<FeedbackRoutingResult> {
  const paid = isPaid(event);
  const userCtas = adoptionCtas(event);
  const adminActions: FeedbackAdminActionCandidate[] = [];
  const conversionCorrelationTags: string[] = [];
  let retainerReadinessSignal = false;
  let reviewEscalationState: FeedbackRoutingResult["reviewEscalationState"] = "none";
  let caseStudyCandidateClass: string | null = null;

  if (event.rating === "negative" && SERIOUS_NEGATIVE_CATEGORIES.has(event.category)) {
    reviewEscalationState = paid ? "risk_review" : "review_required";
    adminActions.push({
      id: "quality-review",
      label: "Review quality concern",
      reason: "High-value negative feedback should be checked by a human operator.",
      actionType: paid ? "falsification_review" : "admin_review",
    });
  }

  if (event.rating === "positive" && event.followupRequested) {
    adminActions.push({
      id: "sales-followup",
      label: "Review requested follow-up",
      reason: "User asked for contact. Do not auto-email without consent and commercial rule.",
      actionType: "sales_followup",
    });
  }

  if (event.rating === "positive" && paid) {
    caseStudyCandidateClass = event.linkedOutcomeHypothesisId
      ? "proof_candidate_pending_outcome"
      : event.linkedArtifactId || event.linkedOrderId
        ? "anonymised_case_study_candidate"
        : "private_reference_only";
    adminActions.push({
      id: "case-study-classification",
      label: "Review case-study candidate",
      reason: "Positive paid-product feedback may support private proof review, subject to consent and evidence.",
      actionType: "case_study_candidate",
    });
  }

  if (event.rating === "positive" && FREE_ADOPTION_SURFACES.has(event.surface)) {
    conversionCorrelationTags.push(`free_surface:${event.surface}`, `category:${event.category}`);
    adminActions.push({
      id: "conversion-correlation",
      label: "Track subsequent conversion",
      reason: "Positive free-surface feedback is an adoption signal, not attribution proof.",
      actionType: "conversion_correlation",
    });
  }

  const recentPositive = await countRecentFeedback(event, "positive");
  const recentNegative = await countRecentFeedback(event, "negative");
  if (
    event.surface === "retainer_review_cycle" ||
    event.surface === "decision_centre_case" ||
    (paid && hasHighConfidence(event) && recentPositive >= 2) ||
    (recentNegative >= 2 && ["trust", "accuracy", "outcome_relevance"].includes(event.category))
  ) {
    retainerReadinessSignal = true;
    adminActions.push({
      id: "retainer-readiness",
      label: "Assess retained oversight readiness",
      reason: "Repeated or governance-linked feedback indicates a possible continuity need.",
      actionType: "retainer_readiness",
    });
  }

  return {
    publicMessage: baseMessage(event),
    userCtas,
    adminActions,
    retainerReadinessSignal,
    caseStudyCandidateClass,
    conversionCorrelationTags,
    reviewEscalationState,
    actionKind: chooseActionKind({ event, userCtas, adminActions, retainerReadinessSignal, paid }),
  };
}

export function actionStatusFromRouting(
  current: FeedbackActionStatus,
  routing: FeedbackRoutingResult,
): FeedbackActionStatus {
  if (current !== "logged") return current;
  if (routing.reviewEscalationState !== "none") return "triage_required";
  if (routing.caseStudyCandidateClass) return "linked_to_case_study_candidate";
  if (routing.adminActions.some((item) => item.actionType === "sales_followup")) return "linked_to_sales_followup";
  return current;
}
