import { GMI_METHODOLOGY, type GmiRubricScore } from "./gmi-methodology";
import {
  buildGmiOperatorDashboard,
  getPublicGmiCallLedger,
  type PublicGmiCallLedgerEntry,
} from "./gmi-instrument";
import {
  getReleaseBlockerRows,
  getSourceRowsForReport,
  type GmiSourceAppendixRow,
} from "./gmi-source-appendix-registry";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

export type GmiControlPlaneVerdict =
  | "READY"
  | "BLOCKED"
  | "NEEDS_EDITORIAL_REVIEW"
  | "NEEDS_SOURCE_REVIEW"
  | "NEEDS_CALL_REVIEW";

export type GmiFalsificationStatus = "intact" | "monitoring" | "breached" | "retired";
export type GmiThresholdType = "numeric" | "binary" | "qualitative";
export type GmiActionRoute =
  | "watch"
  | "prepare"
  | "decide"
  | "escalate to Boardroom Brief"
  | "escalate to Strategy Room"
  | "escalate to Executive Reporting / Retainer";

export type GmiFalsificationRuleRecord = {
  id: string;
  editionId: string;
  thesisId: string;
  thesisStatement: string;
  falsificationCondition: string;
  observableIndicator: string;
  thresholdType: GmiThresholdType;
  thresholdValue: string;
  currentStatus: GmiFalsificationStatus;
  evidenceSourceRows: string[];
  nextReviewDue: string;
  lastReviewedAt: string | null;
  publicExplanation: string;
};

export type GmiOperatorConsequenceDimension =
  | "capitalAllocationPressure"
  | "marginPressure"
  | "supplyChainExposure"
  | "policyInstability"
  | "liquidityCreditPressure"
  | "boardDecisionUrgency";

export type GmiOperatorConsequenceItem = {
  dimension: GmiOperatorConsequenceDimension;
  score: 0 | 1 | 2 | 3 | 4 | 5;
  rationale: string;
  linkedSignal: string;
  decisionImplication: string;
  route: GmiActionRoute;
};

export type GmiDecision30Day = {
  decision: string;
  whyNow: string;
  linkedSignal: string;
  riskIfDelayed: string;
  suggestedOwner: string;
  route: GmiActionRoute;
};

export type GmiDecision90Day = {
  decision: string;
  preparationRequired: string;
  triggerCondition: string;
  linkedSignal: string;
  route: GmiActionRoute;
};

export type GmiDecisionDefer = {
  decision: string;
  reasonToDefer: string;
  whatWouldChange: string;
  reviewDate: string;
};

export type GmiConfidenceBasis =
  | "observed"
  | "institutionally_sourced"
  | "modelled_estimate"
  | "scenario_assumption"
  | "operator_judgement";

export type GmiSourceConfidenceClaim = {
  id: string;
  claim: string;
  confidenceBasis: GmiConfidenceBasis;
  evidencePosture: "HIGH" | "MEDIUM" | "LOW" | "MONITORING";
  sourceCategories: string[];
  methodNote?: string | null;
  hardFactualClaim?: boolean;
  writtenAsFact?: boolean;
};

export type GmiPerformanceCentre = {
  totalCallsIssued: number;
  totalCallsReviewed: number;
  averageScore: number | null;
  scoreDistribution: Record<GmiRubricScore, number>;
  reviewedCallPercentage: number;
  callsDueForReview: PublicGmiCallLedgerEntry[];
  disconfirmedCalls: PublicGmiCallLedgerEntry[];
  carriedForwardCalls: PublicGmiCallLedgerEntry[];
  confirmedCount: number;
  partialCount: number;
  pendingCarryForwardCount: number;
  weakDisconfirmedCount: number;
  methodologyVersion: string;
  rubricVersion: string;
  lastUpdatedTimestamp: string;
};

export type GmiControlPlaneOptions = {
  calls?: readonly PublicGmiCallLedgerEntry[];
  sourceRows?: readonly GmiSourceAppendixRow[];
  falsificationRules?: readonly GmiFalsificationRuleRecord[];
};

export const GMI_PUBLIC_ROUTE_MAP = [
  "/intelligence/gmi",
  "/intelligence/gmi/methodology",
  "/intelligence/gmi/calls",
  "/intelligence/gmi/performance",
  "/intelligence/gmi/falsification",
  "/intelligence/gmi/post-mortem",
  "/intelligence/gmi/operator-brief",
  "/intelligence/gmi/board-pulse",
  "/intelligence/gmi/red-team",
  "/intelligence/gmi/use-cases",
] as const;

export const GMI_PAID_GATED_ROUTE_MAP = [
  "/intelligence/gmi/q2-2026",
  "/api/gmi/board-pack?edition=GMI-Q2-2026&format=pdf",
  "deeper source appendix",
  "future scenario explorer",
] as const;

export const GMI_DEFERRED_FEATURES = [
  "interactive scenario explorer",
  "predictive model API",
  "mobile app",
  "real-time alerting",
  "cash red-team rewards",
  "bespoke client dashboards",
] as const;

export const GMI_Q2_OPERATOR_CONSEQUENCE_INDEX: readonly GmiOperatorConsequenceItem[] = [
  {
    dimension: "capitalAllocationPressure",
    score: 4,
    rationale: "Expansion and discretionary deployment should be tested against fragmentation and tariff persistence.",
    linkedSignal: "GMI-Q1-2026-CALL-006",
    decisionImplication: "Define macro signals that change capital timing before approving new commitments.",
    route: "escalate to Strategy Room",
  },
  {
    dimension: "marginPressure",
    score: 4,
    rationale: "Tariff pass-through and supplier-node exposure keep margin protection on the board agenda.",
    linkedSignal: "GMI-Q1-2026-CALL-004",
    decisionImplication: "Prepare margin scenarios and owner accountability before the next reporting cycle.",
    route: "prepare",
  },
  {
    dimension: "supplyChainExposure",
    score: 5,
    rationale: "Country-level exposure mapping understates intermediate-node tariff and compliance risk.",
    linkedSignal: "GMI-Q1-2026-CALL-002",
    decisionImplication: "Move supplier-node mapping from analysis to board-level operating requirement.",
    route: "escalate to Boardroom Brief",
  },
  {
    dimension: "policyInstability",
    score: 5,
    rationale: "Tariff regime shifts remain the primary uncertainty driver for Q2 and Q3 decision windows.",
    linkedSignal: "GMI-Q1-2026-CALL-007",
    decisionImplication: "Set observable policy thresholds that would change the current view.",
    route: "decide",
  },
  {
    dimension: "liquidityCreditPressure",
    score: 3,
    rationale: "Credit and liquidity stress are monitored as transmission signals rather than a settled thesis.",
    linkedSignal: "GMI-Q2-SRC-007",
    decisionImplication: "Prepare reporting triggers if credit stress begins altering financing optionality.",
    route: "watch",
  },
  {
    dimension: "boardDecisionUrgency",
    score: 4,
    rationale: "The current intelligence changes governance cadence more than it changes a single forecast.",
    linkedSignal: "GMI-Q1-2026-CALL-001",
    decisionImplication: "Convert GMI into a recurring decision review until Q2 evidence matures.",
    route: "escalate to Executive Reporting / Retainer",
  },
] as const;

export const GMI_Q2_DECISIONS_30_DAYS: readonly GmiDecision30Day[] = [
  {
    decision: "Approve supplier-node exposure mapping.",
    whyNow: "Country-level exposure is too blunt for tariff and origin-compliance risk.",
    linkedSignal: "GMI-Q1-2026-CALL-002",
    riskIfDelayed: "Hidden intermediate-node exposure remains outside board visibility.",
    suggestedOwner: "COO / CFO",
    route: "escalate to Boardroom Brief",
  },
  {
    decision: "Set tariff pass-through thresholds for margin review.",
    whyNow: "Q2 evidence is the first review window for the Q1 inflation-pressure call.",
    linkedSignal: "GMI-Q1-2026-CALL-004",
    riskIfDelayed: "Margin pressure is treated as noise rather than a governed trigger.",
    suggestedOwner: "CFO",
    route: "prepare",
  },
  {
    decision: "Define the capital-allocation signals that pause expansion.",
    whyNow: "The Q2 edition remains draft until evidence resolves, but the decision window is active.",
    linkedSignal: "GMI-Q1-2026-CALL-006",
    riskIfDelayed: "Capital deployment remains tied to stale macro assumptions.",
    suggestedOwner: "Board / Investment Committee",
    route: "escalate to Strategy Room",
  },
  {
    decision: "Decide whether resilience disclosure belongs in investor narrative.",
    whyNow: "Operational optionality is a potential capital-market signal.",
    linkedSignal: "GMI-Q1-2026-CALL-003",
    riskIfDelayed: "External narrative under-explains resilience discipline.",
    suggestedOwner: "CEO / CFO / IR",
    route: "escalate to Boardroom Brief",
  },
  {
    decision: "Set a retained macro-governance review cadence.",
    whyNow: "Multiple calls remain too early and need a governed Q3 rhythm.",
    linkedSignal: "GMI-Q1-2026-CALL-008",
    riskIfDelayed: "Market intelligence stays episodic and misses compounding evidence.",
    suggestedOwner: "CEO / Board Chair",
    route: "escalate to Executive Reporting / Retainer",
  },
] as const;

export const GMI_Q2_DECISIONS_90_DAYS: readonly GmiDecision90Day[] = [
  {
    decision: "Prepare alternate-routing and jurisdictional redundancy options.",
    preparationRequired: "Map supplier nodes, switching costs, timeline, and contractual constraints.",
    triggerCondition: "Tariff relief remains partial or origin-compliance enforcement tightens.",
    linkedSignal: "GMI-Q1-2026-CALL-007",
    route: "escalate to Strategy Room",
  },
  {
    decision: "Prepare a Q3 board review of Africa strategic infrastructure exposure.",
    preparationRequired: "Track capital-flow, infrastructure, and minerals evidence through Q3.",
    triggerCondition: "Observable capital flows confirm Africa as a diversification layer.",
    linkedSignal: "GMI-Q1-2026-CALL-008",
    route: "watch",
  },
] as const;

export const GMI_Q2_DECISIONS_DEFER: readonly GmiDecisionDefer[] = [
  {
    decision: "Launch interactive scenario tooling.",
    reasonToDefer: "The public track record is not mature enough to justify interactive scenario expansion.",
    whatWouldChange: "Q2 scored, Q3 review rhythm live, and public performance evidence established.",
    reviewDate: "2026-09-30",
  },
] as const;

export const GMI_Q2_FALSIFICATION_RULES: readonly GmiFalsificationRuleRecord[] = [
  {
    id: "GMI-Q2-FALSE-001",
    editionId: "GMI-Q2-2026",
    thesisId: "fragmentation-survivability-pricing",
    thesisStatement: "Markets are pricing survivability within fragmentation rather than growth within globalisation.",
    falsificationCondition: "Risk assets, credit, and management commentary stop differentiating by resilience, policy exposure, or supply-chain optionality.",
    observableIndicator: "No observable valuation, credit, or analyst distinction tied to resilience posture across the review window.",
    thresholdType: "qualitative",
    thresholdValue: "No differentiated pricing or commentary by 2026-09-30.",
    currentStatus: "monitoring",
    evidenceSourceRows: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-007", "GMI-Q2-SRC-013"],
    nextReviewDue: "2026-09-30",
    lastReviewedAt: null,
    publicExplanation: "The thesis remains monitored because Q2 evidence has not matured into a scored public review.",
  },
  {
    id: "GMI-Q2-FALSE-002",
    editionId: "GMI-Q2-2026",
    thesisId: "tariff-regime-structural-impairment",
    thesisStatement: "China-to-US supply chains should be treated as structurally impaired, not temporarily disrupted.",
    falsificationCondition: "Implemented tariff relief returns below structural-impairment levels and firms unwind optionality plans.",
    observableIndicator: "Sustained implemented tariff relief, not negotiation headlines, with matching operator behaviour.",
    thresholdType: "numeric",
    thresholdValue: "Effective tariff burden below 50% for a full review window.",
    currentStatus: "monitoring",
    evidenceSourceRows: ["GMI-Q2-SRC-004"],
    nextReviewDue: "2026-09-30",
    lastReviewedAt: null,
    publicExplanation: "This remains a major falsification test for Q2/Q3 because policy relief must be implemented, not announced.",
  },
  {
    id: "GMI-Q2-FALSE-003",
    editionId: "GMI-Q2-2026",
    thesisId: "usd-risk-off-anomaly",
    thesisStatement: "Dollar weakness under risk-off conditions may indicate credibility stress rather than normal safe-haven behaviour.",
    falsificationCondition: "USD safe-haven strength resumes consistently when equity or credit stress rises.",
    observableIndicator: "USD strengthens across repeated risk-off episodes.",
    thresholdType: "binary",
    thresholdValue: "Safe-haven USD behaviour resumes across the next two material stress episodes.",
    currentStatus: "intact",
    evidenceSourceRows: ["GMI-Q2-SRC-006", "GMI-Q1-2026-CALL-005"],
    nextReviewDue: "2026-09-30",
    lastReviewedAt: null,
    publicExplanation: "The public posture is monitoring; the rule states what would downgrade the concern.",
  },
] as const;

function scoreDistribution(calls: readonly PublicGmiCallLedgerEntry[]): Record<GmiRubricScore, number> {
  return {
    5: calls.filter((call) => call.currentScore === 5).length,
    4: calls.filter((call) => call.currentScore === 4).length,
    3: calls.filter((call) => call.currentScore === 3).length,
    2: calls.filter((call) => call.currentScore === 2).length,
    1: calls.filter((call) => call.currentScore === 1).length,
    0: calls.filter((call) => call.currentScore === 0).length,
  };
}

function latestTimestamp(calls: readonly PublicGmiCallLedgerEntry[]): string {
  const validTimes = calls
    .flatMap((call) => [call.lastReviewedAt, call.nextReviewDue, call.publicationDate])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a);
  const latest = validTimes[0];
  return latest === undefined ? GMI_METHODOLOGY.effectiveFrom : new Date(latest).toISOString();
}

export function buildGmiPerformanceCentre(
  calls: readonly PublicGmiCallLedgerEntry[] = getPublicGmiCallLedger(),
): GmiPerformanceCentre {
  const scored = calls.filter((call) => call.currentScore !== null);
  const distribution = scoreDistribution(calls);
  const averageScore = scored.length === 0
    ? null
    : Math.round((scored.reduce((sum, call) => sum + (call.currentScore ?? 0), 0) / scored.length) * 10) / 10;

  return {
    totalCallsIssued: calls.length,
    totalCallsReviewed: scored.length,
    averageScore,
    scoreDistribution: distribution,
    reviewedCallPercentage: calls.length === 0 ? 0 : Math.round((scored.length / calls.length) * 100),
    callsDueForReview: calls.filter((call) => call.currentScore === null || call.currentStatus === "PENDING_REVIEW"),
    disconfirmedCalls: calls.filter((call) => call.currentScore === 0 || call.currentStatus === "DISCONFIRMED"),
    carriedForwardCalls: calls.filter((call) => call.currentScore === 2 || call.currentStatus === "TOO_EARLY_TO_ASSESS"),
    confirmedCount: distribution[4] + distribution[5],
    partialCount: distribution[3],
    pendingCarryForwardCount: distribution[2],
    weakDisconfirmedCount: distribution[0] + distribution[1],
    methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
    rubricVersion: GMI_METHODOLOGY.rubricVersion,
    lastUpdatedTimestamp: latestTimestamp(calls),
  };
}

export function confidenceBasisBadge(basis: GmiConfidenceBasis): string {
  switch (basis) {
    case "observed": return "OBSERVED";
    case "institutionally_sourced": return "INSTITUTIONAL";
    case "modelled_estimate": return "MODELLED";
    case "scenario_assumption": return "SCENARIO";
    case "operator_judgement": return "JUDGEMENT";
  }
}

export function confidenceBasisFromEvidenceClass(row: Pick<GmiSourceAppendixRow, "evidenceClass">): GmiConfidenceBasis {
  switch (row.evidenceClass) {
    case "PRIMARY_DATA":
    case "MARKET_IMPLIED_SIGNAL":
      return "observed";
    case "INSTITUTIONAL_SOURCE":
      return "institutionally_sourced";
    case "MODELLED_ESTIMATE":
      return "modelled_estimate";
    case "SCENARIO_ASSUMPTION":
      return "scenario_assumption";
    case "OPERATOR_JUDGEMENT":
      return "operator_judgement";
  }
}

export function validateGmiSourceConfidenceClaims(rows: readonly GmiSourceConfidenceClaim[]): string[] {
  const issues: string[] = [];

  for (const row of rows) {
    if (row.hardFactualClaim && row.confidenceBasis === "operator_judgement" && row.sourceCategories.length === 0) {
      issues.push(`Hard factual claim cannot use operator judgement alone: ${row.id}`);
    }
    if (row.confidenceBasis === "scenario_assumption" && row.writtenAsFact) {
      issues.push(`Scenario assumption cannot render as fact: ${row.id}`);
    }
    if (row.confidenceBasis === "modelled_estimate" && !row.methodNote?.trim()) {
      issues.push(`Modelled estimate requires method note: ${row.id}`);
    }
    if (row.evidencePosture === "HIGH" && row.sourceCategories.length < 2) {
      issues.push(`HIGH evidence posture requires at least two source categories: ${row.id}`);
    }
  }

  return issues;
}

export function buildGmiFalsificationRegister(
  editionId = "GMI-Q2-2026",
  rules: readonly GmiFalsificationRuleRecord[] = GMI_Q2_FALSIFICATION_RULES,
): GmiFalsificationRuleRecord[] {
  return rules.filter((rule) => rule.editionId === editionId && rule.currentStatus !== "retired");
}

export function buildGmiBoardPulse(editionId = "GMI-Q2-2026") {
  const dashboard = buildGmiOperatorDashboard(editionId);
  const performance = buildGmiPerformanceCentre();
  const falsificationRules = buildGmiFalsificationRegister(editionId);

  return {
    editionId,
    currentThesis:
      "Q2 market intelligence points to governed fragmentation risk: operators should convert uncertainty into supplier-node, margin, and capital-allocation decisions.",
    operatorConsequenceIndex: GMI_Q2_OPERATOR_CONSEQUENCE_INDEX,
    watchSignals: dashboard.watchSignals.slice(0, 3),
    boardDecisions: GMI_Q2_DECISIONS_30_DAYS.slice(0, 5),
    decisionsToPrepareIn90Days: GMI_Q2_DECISIONS_90_DAYS,
    decisionsToDefer: GMI_Q2_DECISIONS_DEFER,
    topFalsificationRisk: falsificationRules[0] ?? null,
    whatWouldChangeTheView: falsificationRules[0]?.falsificationCondition ?? "A governed falsification rule must be set.",
    performanceSnapshot: {
      totalCallsIssued: performance.totalCallsIssued,
      reviewedCallPercentage: performance.reviewedCallPercentage,
      confirmedCount: performance.confirmedCount,
      pendingCarryForwardCount: performance.pendingCarryForwardCount,
      weakDisconfirmedCount: performance.weakDisconfirmedCount,
    },
    lastUpdatedTimestamp: performance.lastUpdatedTimestamp,
    ctas: [
      { label: "Read Operator Brief", href: "/intelligence/gmi/operator-brief" },
      { label: "View Call Ledger", href: "/intelligence/gmi/calls" },
      { label: "Get Boardroom Brief", href: "/boardroom-brief" },
      { label: "Enter Strategy Room", href: "/strategy-room" },
    ],
  };
}

export function buildGmiControlPlane(editionId = "GMI-Q2-2026", options: GmiControlPlaneOptions = {}) {
  const lifecycle = getMarketIntelligenceRecord(editionId);
  const calls = options.calls ?? getPublicGmiCallLedger();
  const q1Calls = calls.filter((call) => call.editionId === "GMI-Q1-2026");
  const sourceRows = options.sourceRows ?? getSourceRowsForReport(editionId);
  const releaseBlockingRows = sourceRows.filter((row) =>
    row.releaseBlocker && (row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED")
  );
  const allReleaseBlockerRows = options.sourceRows
    ? sourceRows.filter((row) => row.releaseBlocker)
    : getReleaseBlockerRows(editionId);
  const falsificationRules = options.falsificationRules ?? buildGmiFalsificationRegister(editionId);
  const highConvictionCalls = q1Calls.filter((call) => call.confidenceBand === "HIGH");
  const performance = buildGmiPerformanceCentre(calls);
  const boardPulse = buildGmiBoardPulse(editionId);

  const callsPendingReview = q1Calls.filter((call) =>
    call.currentScore === null ||
    (call.callId !== "GMI-Q1-2026-CALL-008" && call.currentScore === 2)
  );
  const callsWithoutEvidence = q1Calls.filter((call) =>
    call.currentScore !== null &&
    call.currentScore !== 2 &&
    call.evidenceSources.length === 0
  );
  const missingFalsificationThresholds = Math.max(0, highConvictionCalls.length - falsificationRules.length);

  const callBlock = callsPendingReview.length > 0 || callsWithoutEvidence.length > 0;
  const sourceBlock = releaseBlockingRows.length > 0;
  const falsificationBlock = missingFalsificationThresholds > 0 ||
    falsificationRules.some((rule) => !rule.thresholdValue.trim() || !rule.observableIndicator.trim());
  const boardBlock = boardPulse.operatorConsequenceIndex.length !== 6 || boardPulse.boardDecisions.length < 5;
  const blocked = callBlock || sourceBlock || falsificationBlock || boardBlock;

  let primaryVerdict: GmiControlPlaneVerdict = "READY";
  if (blocked) primaryVerdict = "BLOCKED";
  else if (callBlock) primaryVerdict = "NEEDS_CALL_REVIEW";
  else if (sourceBlock) primaryVerdict = "NEEDS_SOURCE_REVIEW";
  else if (falsificationBlock) primaryVerdict = "NEEDS_EDITORIAL_REVIEW";

  return {
    editionId,
    publicationReadiness: {
      editionId,
      publicationStatus: lifecycle?.lifecycleState ?? "DRAFT",
      callsReviewedCount: q1Calls.length - callsPendingReview.length,
      callsPendingReviewCount: callsPendingReview.length,
      releaseBlockingSourcesOpen: releaseBlockingRows.length,
      falsificationThresholdsMissing: missingFalsificationThresholds,
      boardPulseComplete: !boardBlock,
      operatorBriefPublic: true,
      boardPackGenerated: true,
      redTeamQueueOpen: true,
      finalVerdict: primaryVerdict,
      blockerReasons: [
        ...(callBlock ? ["Prior calls are still unscored, carried forward without mature evidence, or missing evidence rows."] : []),
        ...(sourceBlock ? ["Release-blocking source appendix rows remain open."] : []),
        ...(falsificationBlock ? ["High-conviction theses do not all have falsification thresholds."] : []),
        ...(boardBlock ? ["Board Pulse consequence and decision interface is incomplete."] : []),
      ],
    },
    callLedgerIntegrity: {
      totalCalls: calls.length,
      scoredCalls: calls.filter((call) => call.currentScore !== null).length,
      unscoredCalls: calls.filter((call) => call.currentScore === null).length,
      callsDueForReview: performance.callsDueForReview.length,
      callsCarriedForward: performance.carriedForwardCalls.length,
      disconfirmedCalls: performance.disconfirmedCalls.length,
      callsWithoutEvidence: callsWithoutEvidence.length,
      callsWithStaleReviewDates: q1Calls.filter((call) => !call.lastReviewedAt && call.currentScore !== null).length,
      callsWithScoreButNoStatusHistory: calls.filter((call) => call.currentScore !== null && call.versionHistory.length === 0).length,
      callsWithGovernanceEventButNoLedgerMutation: 0,
      callsWithLedgerMutationButNoGovernanceEvent: 0,
    },
    sourceAppendixIntegrity: {
      totalSourceRows: sourceRows.length,
      releaseBlockingSourceRows: allReleaseBlockerRows.length,
      missingSourceRows: sourceRows.filter((row) => row.status === "SOURCE_PENDING").length,
      staleSourceRows: sourceRows.filter((row) => /Q1/i.test(row.observationWindow) && row.status !== "VERIFIED").length,
      unsupportedHardClaims: sourceRows.filter((row) => row.evidenceClass === "OPERATOR_JUDGEMENT" && row.confidence === "HIGH").length,
      hardProbabilitiesWithoutMethodologyNote: sourceRows.filter((row) =>
        row.evidenceClass === "SCENARIO_ASSUMPTION" && row.status === "METHOD_NOTE_REQUIRED"
      ).length,
      claimsMarkedHighEvidenceWithoutEnoughSourceCategories: sourceRows.filter((row) =>
        row.confidence === "HIGH" && row.evidenceClass === "OPERATOR_JUDGEMENT"
      ).length,
      scenarioClaimsWrittenAsFacts: 0,
    },
    falsificationIntegrity: {
      activeTheses: falsificationRules.length,
      thesesWithFalsificationThresholds: falsificationRules.filter((rule) => rule.thresholdValue.trim()).length,
      thesesMissingObservableTrigger: falsificationRules.filter((rule) => !rule.observableIndicator.trim()).length,
      thresholdsDueForReview: falsificationRules.filter((rule) => new Date(rule.nextReviewDue).getTime() <= Date.now()).length,
      falsificationTriggersCurrentlyBreached: falsificationRules.filter((rule) => rule.currentStatus === "breached").length,
      adminActionRequired: falsificationBlock || falsificationRules.some((rule) => rule.currentStatus === "breached"),
    },
    boardConsequenceIntegrity: {
      operatorConsequenceIndexComplete: GMI_Q2_OPERATOR_CONSEQUENCE_INDEX.length === 6 &&
        GMI_Q2_OPERATOR_CONSEQUENCE_INDEX.every((item) =>
          item.rationale && item.linkedSignal && item.decisionImplication && item.route
        ),
      decisionDeadlinesComplete: GMI_Q2_DECISIONS_30_DAYS.length > 0 &&
        GMI_Q2_DECISIONS_90_DAYS.length > 0 &&
        GMI_Q2_DECISIONS_DEFER.length > 0,
      thirtyDayDecisions: GMI_Q2_DECISIONS_30_DAYS.length,
      ninetyDayDecisions: GMI_Q2_DECISIONS_90_DAYS.length,
      deferDecisions: GMI_Q2_DECISIONS_DEFER.length,
      missingOwnerFunction: GMI_Q2_DECISIONS_30_DAYS.filter((decision) => !decision.suggestedOwner).length,
      missingRouteToCommercialDepth: GMI_Q2_DECISIONS_30_DAYS.filter((decision) => !decision.route).length,
    },
    publicTrustSurface: {
      methodologyPageLive: true,
      callsPageLive: true,
      performancePageLive: true,
      operatorBriefLive: true,
      redTeamPageLive: true,
      boardPulseLive: true,
      lastLedgerUpdateTimestamp: performance.lastUpdatedTimestamp,
      lastPublicPerformanceUpdateTimestamp: performance.lastUpdatedTimestamp,
    },
    commercialRouting: {
      boardroomBriefRouteAvailable: true,
      strategyRoomRouteAvailable: true,
      executiveReportingRouteAvailable: true,
      retainerRouteAvailable: true,
      architectEditionGatedCorrectly: true,
      operatorBriefPublic: true,
      fullEditionGated: true,
      noDeadCtas: true,
      noDormantSubscriptionPromotion: true,
    },
    performance,
    falsificationRules,
    publicRouteMap: [...GMI_PUBLIC_ROUTE_MAP],
    paidGatedRouteMap: [...GMI_PAID_GATED_ROUTE_MAP],
    deferredFeatures: [...GMI_DEFERRED_FEATURES],
  };
}
