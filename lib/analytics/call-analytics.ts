/**
 * Call Analytics Engine — conversation → data → diagnosis → correction.
 *
 * Captures structure, not just outcome. Every call mapped to a funnel:
 * Open → Qualify → Diagnose → Anchor → Authority → Offer → Close
 *
 * Auto-diagnosis: tells you WHERE deals die and WHY.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AuthorityLevel = "owner" | "influencer" | "observer";
export type ObjectionType = "time" | "cost" | "data" | "internal" | "none";
export type CallResult = "won" | "lost" | "follow_up" | "disqualified";

export type CallRecord = {
  callId: string;
  date: string;
  company: string;
  role: string;
  industry: string;
  revenueBand: string;

  // Qualification signals
  decisionClarity: number; // 0-1
  costEstimate: number;
  urgency: number; // 0-1
  authorityLevel: AuthorityLevel;

  // Stage outcomes
  stages: {
    open_clear: boolean;
    cost_defined: boolean;
    pattern_accepted: boolean;
    cost_acknowledged: boolean;
    owner_confirmed: boolean;
    offer_understood: boolean;
    decision_made: boolean;
  };

  // Objections
  objectionType: ObjectionType;
  objectionCount: number;

  // Outcome
  result: CallResult;
  dealValue: number;
  nextStep: string;

  // Replay (lightweight)
  replay?: {
    whatTheySaid: string;
    whatYouSaid: string;
    whereItBroke: string;
  };
};

export type CallFunnelMetrics = {
  totalCalls: number;
  costDefinedRate: number;
  patternAcceptanceRate: number;
  authorityRate: number;
  closeAttemptRate: number;
  closeRate: number;
  avgDealValue: number;
  totalRevenue: number;
};

export type DropOffAnalysis = {
  stage: string;
  count: number;
  rate: number;
};

export type ObjectionAnalysis = {
  objection: ObjectionType;
  frequency: number;
  conversionRate: number;
};

export type CallDiagnosis = {
  weakestStage: string;
  message: string;
  severity: "fix_now" | "monitor" | "healthy";
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

export function computeCallFunnel(calls: CallRecord[]): CallFunnelMetrics {
  const n = calls.length;
  if (n === 0) return { totalCalls: 0, costDefinedRate: 0, patternAcceptanceRate: 0, authorityRate: 0, closeAttemptRate: 0, closeRate: 0, avgDealValue: 0, totalRevenue: 0 };

  const costDefined = calls.filter((c) => c.stages.cost_defined).length;
  const patternAccepted = calls.filter((c) => c.stages.pattern_accepted).length;
  const ownerConfirmed = calls.filter((c) => c.stages.owner_confirmed).length;
  const offerUnderstood = calls.filter((c) => c.stages.offer_understood).length;
  const won = calls.filter((c) => c.result === "won");
  const totalRev = won.reduce((s, c) => s + c.dealValue, 0);

  return {
    totalCalls: n,
    costDefinedRate: costDefined / n,
    patternAcceptanceRate: patternAccepted / n,
    authorityRate: ownerConfirmed / n,
    closeAttemptRate: offerUnderstood / n,
    closeRate: won.length / n,
    avgDealValue: won.length > 0 ? totalRev / won.length : 0,
    totalRevenue: totalRev,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DROP-OFF ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function detectDropOff(call: CallRecord): string {
  if (!call.stages.cost_defined) return "qualify";
  if (!call.stages.pattern_accepted) return "diagnosis";
  if (!call.stages.owner_confirmed) return "authority";
  if (!call.stages.offer_understood) return "offer";
  if (!call.stages.decision_made) return "close";
  return "none";
}

export function aggregateDropOffs(calls: CallRecord[]): DropOffAnalysis[] {
  const counts: Record<string, number> = {};
  const lost = calls.filter((c) => c.result !== "won");

  for (const call of lost) {
    const stage = detectDropOff(call);
    counts[stage] = (counts[stage] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([stage, count]) => ({ stage, count, rate: lost.length > 0 ? count / lost.length : 0 }))
    .sort((a, b) => b.rate - a.rate);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTION INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

export function analyseObjections(calls: CallRecord[]): ObjectionAnalysis[] {
  const types: ObjectionType[] = ["time", "cost", "data", "internal", "none"];
  return types.map((obj) => {
    const matching = calls.filter((c) => c.objectionType === obj);
    const won = matching.filter((c) => c.result === "won").length;
    return {
      objection: obj,
      frequency: calls.length > 0 ? matching.length / calls.length : 0,
      conversionRate: matching.length > 0 ? won / matching.length : 0,
    };
  }).filter((a) => a.frequency > 0).sort((a, b) => b.frequency - a.frequency);
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-CALL SCORE
// ─────────────────────────────────────────────────────────────────────────────

export function scoreCall(call: CallRecord): number {
  return (
    (call.stages.cost_defined ? 1 : 0) +
    (call.stages.pattern_accepted ? 1 : 0) +
    (call.stages.owner_confirmed ? 1 : 0) +
    (call.stages.decision_made ? 1 : 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-DIAGNOSIS
// ─────────────────────────────────────────────────────────────────────────────

export function diagnoseCallPerformance(funnel: CallFunnelMetrics): CallDiagnosis[] {
  const diagnoses: CallDiagnosis[] = [];

  if (funnel.costDefinedRate < 0.7) {
    diagnoses.push({
      weakestStage: "qualify",
      message: "You are not forcing economic clarity early enough. Cost must be defined before diagnosis.",
      severity: "fix_now",
    });
  }

  if (funnel.authorityRate < 0.5) {
    diagnoses.push({
      weakestStage: "authority",
      message: "You are speaking to non-decision-makers. Qualify authority before investing time.",
      severity: "fix_now",
    });
  }

  if (funnel.patternAcceptanceRate < 0.6) {
    diagnoses.push({
      weakestStage: "diagnosis",
      message: "Your diagnosis is not landing. The contradiction must be sharper or more specific.",
      severity: "fix_now",
    });
  }

  if (funnel.closeRate < 0.1 && funnel.authorityRate > 0.5 && funnel.patternAcceptanceRate > 0.6) {
    diagnoses.push({
      weakestStage: "close",
      message: "Pricing not anchored strongly enough. Cost must feel trivial against delay cost.",
      severity: "fix_now",
    });
  }

  if (diagnoses.length === 0) {
    diagnoses.push({ weakestStage: "none", message: "Call funnel is performing within targets.", severity: "healthy" });
  }

  return diagnoses;
}
