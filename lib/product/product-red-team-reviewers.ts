/**
 * Adversarial Reviewer Personas.
 *
 * Every product must survive five reviewers, each asking the question a
 * real customer would ask. Scores are computed from measured features of
 * the actual rendered output — not asserted. If any critical reviewer
 * rejects the product, it cannot be gold.
 */

import {
  extractOutputFeatures,
  type AnalyzableSample,
  type OutputFeatureAnalysis,
} from "@/lib/product/anti-toy-product-test";

export type RedTeamReviewerId =
  | "skeptical_executive"
  | "busy_operator"
  | "commercial_buyer"
  | "experienced_consultant"
  | "returning_user";

export interface RedTeamScores {
  usefulness: number;
  specificity: number;
  credibility: number;
  actionability: number;
  distinctiveness: number;
  reuse_value: number;
}

export interface RedTeamReview {
  reviewerId: RedTeamReviewerId;
  reviewerQuestion: string;
  scores: RedTeamScores;
  verdict: "accept" | "reject";
  reasons: string[];
}

export interface RedTeamPanelResult {
  productCode: string;
  testedOutputSource: string;
  scores: RedTeamScores;
  reviews: RedTeamReview[];
  criticalRejections: RedTeamReviewerId[];
  survives: boolean;
}

const ACCEPTANCE_THRESHOLD = 7;

export function runRedTeamPanel(
  productCode: string,
  testedOutputSource: string,
  primary: AnalyzableSample,
  variant: AnalyzableSample,
): RedTeamPanelResult {
  const features = extractOutputFeatures(primary, variant);
  const scores = deriveScores(features);

  const reviews: RedTeamReview[] = [
    reviewSkepticalExecutive(scores, features),
    reviewBusyOperator(scores, features),
    reviewCommercialBuyer(scores, features),
    reviewExperiencedConsultant(scores, features),
    reviewReturningUser(scores, features),
  ];

  const criticalRejections = reviews
    .filter((review) => review.verdict === "reject")
    .map((review) => review.reviewerId);

  return {
    productCode,
    testedOutputSource,
    scores,
    reviews,
    criticalRejections,
    survives: criticalRejections.length === 0,
  };
}

function deriveScores(features: OutputFeatureAnalysis): RedTeamScores {
  const distinctiveness = round1(clamp(10 * (1 - features.crossInputSimilarity), 0, 10));
  const specificity = round1(clamp(
    10 - features.crossInputSimilarity * 8 + (features.nextActionGroundedInInput ? 1 : 0) - features.inputEchoRatio * 4,
    0,
    10,
  ));
  const credibility = round1(clamp(
    5 + (features.citesEvidence ? 2 : 0) + (features.statesLimits ? 2 : 0) - Math.min(features.genericPhraseHits.length, 2),
    0,
    10,
  ));
  const actionability = round1(clamp(
    (features.hasOwnerAndTimeframe ? 4 : 0) +
    (features.nextActionGroundedInInput ? 3 : 0) +
    (features.nextActionIdenticalAcrossInputs ? 0 : 3),
    0,
    10,
  ));
  const usefulness = round1(clamp(
    (specificity + actionability) / 2 + (features.consequenceGroundedInInput ? 1 : 0),
    0,
    10,
  ));
  const reuse_value = round1(clamp(
    (features.hasReuseMarkers ? 8 : 4) + (features.statesLimits ? 1 : 0),
    0,
    10,
  ));
  return { usefulness, specificity, credibility, actionability, distinctiveness, reuse_value };
}

function reviewSkepticalExecutive(scores: RedTeamScores, features: OutputFeatureAnalysis): RedTeamReview {
  const reject = scores.credibility < ACCEPTANCE_THRESHOLD || !features.citesEvidence || !features.statesLimits;
  return {
    reviewerId: "skeptical_executive",
    reviewerQuestion: "Why should I trust this?",
    scores,
    verdict: reject ? "reject" : "accept",
    reasons: reject
      ? ["The output does not show enough evidence basis or honest limits to earn executive trust."]
      : ["The output cites its evidence basis and states what it does not prove — that earns provisional trust."],
  };
}

function reviewBusyOperator(scores: RedTeamScores, features: OutputFeatureAnalysis): RedTeamReview {
  const reject = scores.actionability < ACCEPTANCE_THRESHOLD;
  return {
    reviewerId: "busy_operator",
    reviewerQuestion: "What do I do next?",
    scores,
    verdict: reject ? "reject" : "accept",
    reasons: reject
      ? ["No clear, owned, time-bound next action — I would close this and move on."]
      : [features.hasOwnerAndTimeframe
        ? "The next action names an owner and a timeframe; I can act on it immediately."
        : "The next action is usable but could bind owner and timeframe more tightly."],
  };
}

function reviewCommercialBuyer(scores: RedTeamScores, features: OutputFeatureAnalysis): RedTeamReview {
  const reject = scores.usefulness < ACCEPTANCE_THRESHOLD || scores.specificity < 6;
  return {
    reviewerId: "commercial_buyer",
    reviewerQuestion: "Why is this worth the time or money?",
    scores,
    verdict: reject ? "reject" : "accept",
    reasons: reject
      ? ["The judgement is not specific enough to my case to justify the time or money over an ordinary alternative."]
      : ["The result repays the time spent with case-specific clarity I would otherwise have to assemble myself."],
  };
}

function reviewExperiencedConsultant(scores: RedTeamScores, features: OutputFeatureAnalysis): RedTeamReview {
  const reject = scores.distinctiveness < ACCEPTANCE_THRESHOLD || scores.specificity < ACCEPTANCE_THRESHOLD;
  return {
    reviewerId: "experienced_consultant",
    reviewerQuestion: "Is this just dressed-up common sense?",
    scores,
    verdict: reject ? "reject" : "accept",
    reasons: reject
      ? [features.couldBeGenericAiOutput
        ? "Run against two different situations, the product gives nearly the same answer — this is dressed-up common sense a generic AI prompt could produce."
        : "The judgement does not vary enough with the case to demonstrate real analytical method."]
      : ["The judgement varies materially with the case — there is method here, not just framing."],
  };
}

function reviewReturningUser(scores: RedTeamScores, features: OutputFeatureAnalysis): RedTeamReview {
  const reject = scores.reuse_value < ACCEPTANCE_THRESHOLD;
  return {
    reviewerId: "returning_user",
    reviewerQuestion: "Would I come back to this?",
    scores,
    verdict: reject ? "reject" : "accept",
    reasons: reject
      ? ["Nothing here gives me a reason to reopen the result later."]
      : ["The checkpoint and record structure give me a concrete reason to return."],
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
