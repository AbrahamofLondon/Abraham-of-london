export type DecisionCreditBand =
  | "TRUSTED"
  | "STABLE"
  | "WATCH"
  | "RESTRICTED";

export type DecisionCreditGovernanceEffect = {
  band: DecisionCreditBand;
  admissionEffect:
    | "STANDARD"
    | "FAST_TRACK_REVIEW"
    | "ADDITIONAL_EVIDENCE_REQUIRED"
    | "COUNSEL_REVIEW_RECOMMENDED";
  explanation: string;
};

export function deriveDecisionCreditGovernanceEffect(input: {
  score?: number | null;
  trend?: string | null;
  breached?: number | null;
}): DecisionCreditGovernanceEffect {
  const score = input.score ?? null;
  const breached = input.breached ?? 0;
  const trend = (input.trend || "").toLowerCase();

  if (score == null) {
    return {
      band: "STABLE",
      admissionEffect: "STANDARD",
      explanation: "Decision credit is unavailable. Standard governance applies and evidence requirements remain unchanged.",
    };
  }

  if (score < 40 || breached >= 3) {
    return {
      band: "RESTRICTED",
      admissionEffect: "COUNSEL_REVIEW_RECOMMENDED",
      explanation: "Decision credit indicates repeated breach or fragile follow-through. Governance should increase scrutiny, but evidence and privacy rules still govern progression.",
    };
  }

  if (score < 60 || trend === "declining") {
    return {
      band: "WATCH",
      admissionEffect: "ADDITIONAL_EVIDENCE_REQUIRED",
      explanation: "Decision credit is weakening. Review intensity should increase and additional evidence may be required before deeper progression.",
    };
  }

  if (score >= 80 && trend !== "declining") {
    return {
      band: "TRUSTED",
      admissionEffect: "FAST_TRACK_REVIEW",
      explanation: "Decision credit is strong. Review friction may be reduced where evidence is already sufficient, but no evidence or privacy gate is bypassed.",
    };
  }

  return {
    band: "STABLE",
    admissionEffect: "STANDARD",
    explanation: "Decision credit is stable. Standard governance applies with no bypass of evidence or privacy controls.",
  };
}
