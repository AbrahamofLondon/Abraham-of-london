// lib/consulting/strategy-room.ts
export type StrategyRoomIntakePayload = {
  meta: {
    source: "web" | "inner-circle" | "referral";
    page: string;
    submittedAtIso: string;
  };
  contact: {
    fullName: string;
    email: string;
    organisation: string;
  };
  authority: {
    role: string;
    hasAuthority: "Yes, fully" | "Yes, with board approval" | "No";
    mandate: string;
  };
  decision: {
    statement: string;
    type:
      | "Irreversible"
      | "High-cost to reverse"
      | "Direction-setting"
      | "Personnel/authority-related"
      | "Capital allocation"
      | "Reputation/governance";
    stuckReasons: Array<
      | "Lack of clarity"
      | "Conflicting incentives"
      | "Political risk"
      | "Moral uncertainty"
      | "Incomplete information"
      | "Personal cost"
    >;
  };
  constraints: {
    nonRemovableConstraints: string | null;
    avoidedTradeOff: string;
    unacceptableOutcome: string;
  };
  timeCost: {
    costOfDelay: Array<
      "Financial" | "Reputational" | "Cultural" | "Personal authority" | "Opportunity loss"
    >;
    affected: string;
    breaksFirst: string;
  };
  readiness: {
    readyForUnpleasantDecision: "Yes" | "No";
    willingAccountability: "Yes" | "No";
    whyNow: string;
  };
  declarationAccepted: boolean;
  recaptchaToken: string;
};

export type StrategyRoomIntakeResult =
  | { ok: true; status: "accepted"; message: string; nextUrl: string }
  | { ok: false; status: "declined"; message: string };

type ScoreBreakdown = {
  authority: number;
  decisionGravity: number;
  constraints: number;
  costDelay: number;
  readiness: number;
  total: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function textLen(s: string | null | undefined) {
  return (s || "").trim().length;
}

function scoreTextSignal(s: string, minLen: number, maxScore: number) {
  const len = textLen(s);
  if (len <= minLen) return 0;
  if (len >= minLen * 3) return maxScore;
  const ratio = len / (minLen * 3);
  return Math.round(maxScore * ratio);
}

export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  // hard gates (protect the room)
  if (payload.authority.hasAuthority === "No") {
    return { ok: false, status: "declined", message: "This room requires decision authority." };
  }
  if (!payload.declarationAccepted) {
    return { ok: false, status: "declined", message: "Declaration is required." };
  }
  if (payload.readiness.readyForUnpleasantDecision === "No") {
    return {
      ok: false,
      status: "declined",
      message: "This room requires readiness to accept the decision outcome.",
    };
  }
  if (payload.readiness.willingAccountability === "No") {
    return {
      ok: false,
      status: "declined",
      message: "This room requires accountability to execution.",
    };
  }

  const b = computeScore(payload);

  // Board-grade threshold (signal > vibes)
  const threshold = 16; // out of 25
  if (b.total < threshold) {
    return {
      ok: false,
      status: "declined",
      message:
        "At this time, a Strategy Room would not be productive. Start with Strategic Frameworks, then return when the decision, constraints, and cost of delay are explicit.",
    };
  }

  return {
    ok: true,
    status: "accepted",
    message:
      "Accepted. You will receive pre-read materials and scheduling instructions by email. This room is designed to produce a decision and an execution cadence.",
    nextUrl: "/resources/strategic-frameworks",
  };
}

function computeScore(payload: StrategyRoomIntakePayload): ScoreBreakdown {
  const authorityScore =
    payload.authority.hasAuthority === "Yes, fully" ? 5 : payload.authority.hasAuthority === "Yes, with board approval" ? 3 : 0;

  const mandateScore = clamp(scoreTextSignal(payload.authority.mandate, 60, 5), 0, 5);

  const decisionScore = clamp(scoreTextSignal(payload.decision.statement, 60, 5), 0, 5);
  const reasonsScore = clamp(payload.decision.stuckReasons.length, 1, 5);

  const tradeOffScore = clamp(scoreTextSignal(payload.constraints.avoidedTradeOff, 45, 5), 0, 5);
  const unacceptableScore = clamp(scoreTextSignal(payload.constraints.unacceptableOutcome, 45, 5), 0, 5);

  const delayScore = clamp(payload.timeCost.costOfDelay.length, 1, 5);
  const breaksScore = clamp(scoreTextSignal(payload.timeCost.breaksFirst, 35, 5), 0, 5);

  const whyNowScore = clamp(scoreTextSignal(payload.readiness.whyNow, 45, 5), 0, 5);

  const authorityBucket = clamp(Math.round((authorityScore + mandateScore) / 2), 0, 5);
  const decisionGravityBucket = clamp(Math.round((decisionScore + reasonsScore) / 2), 0, 5);
  const constraintsBucket = clamp(Math.round((tradeOffScore + unacceptableScore) / 2), 0, 5);
  const costDelayBucket = clamp(Math.round((delayScore + breaksScore) / 2), 0, 5);
  const readinessBucket = clamp(whyNowScore, 0, 5);

  const total = authorityBucket + decisionGravityBucket + constraintsBucket + costDelayBucket + readinessBucket;

  return {
    authority: authorityBucket,
    decisionGravity: decisionGravityBucket,
    constraints: constraintsBucket,
    costDelay: costDelayBucket,
    readiness: readinessBucket,
    total,
  };
}