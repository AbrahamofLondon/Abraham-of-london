// ─────────────────────────────────────────────────────────────────────────────
// SEED ONLY / LEGACY COMPATIBILITY.
// NOT RUNTIME SOURCE OF TRUTH. DO NOT IMPORT IN PUBLIC/API/ADMIN GMI RUNTIME.
// Public and admin GMI operational state must read persisted database rows via
// lib/intelligence/gmi-data-service.server.ts. These records are retained as
// bootstrap seed inputs and historical test fixtures only.
//
// Market Intelligence Call Verification Ledger
//
// Structured record of material calls, instructions, risks, and scenario
// assumptions made in each quarterly report. Future reports review these
// before issuing new calls. The intelligence line compounds through
// verification rather than resetting every quarter.
// ─────────────────────────────────────────────────────────────────────────────

export type MarketCallType =
  | "PREDICTION"
  | "SCENARIO_PROBABILITY"
  | "BOARD_INSTRUCTION"
  | "RISK_WARNING"
  | "OPPORTUNITY_SIGNAL"
  | "WATCH_SIGNAL"
  | "STRUCTURAL_THESIS";

export type MarketCallOutcomeStatus =
  | "CONFIRMED_STRONGLY"
  | "DIRECTIONALLY_CONFIRMED"
  | "PARTIALLY_CONFIRMED"
  | "TOO_EARLY_TO_ASSESS"
  | "WEAKLY_SUPPORTED"
  | "NOT_CONFIRMED"
  | "DISCONFIRMED"
  | "PENDING_REVIEW";

export type MarketCallRecord = {
  id: string;
  reportId: string;
  callType: MarketCallType;
  statement: string;
  originalConfidence: "HIGH" | "MEDIUM" | "LOW" | "MONITORING";
  assetClass?: string;
  region?: string;
  theme?: string;
  scenarioLink?: string;
  expectedReviewWindow: string;
  outcomeStatus?: MarketCallOutcomeStatus;
  score?: 0 | 1 | 2 | 3 | 4 | 5 | null;
  evidenceSources?: string[];
  lastReviewedAt?: string;
  nextReviewDue?: string;
  outcomeSummary?: string;
  carryForwardJustification?: string;
  learning?: string;
  futureWeightingChange?: string;
  versionHistory?: Array<{
    version: string;
    changedAt: string;
    note: string;
  }>;
};

export type CallReviewSummary = {
  totalCalls: number;
  reviewed: number;
  pending: number;
  averageScore: number | null;
  confirmed: number;
  partiallyConfirmed: number;
  notConfirmed: number;
  tooEarly: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Q1 2026 call registry
// ─────────────────────────────────────────────────────────────────────────────

export const GMI_Q1_2026_CALLS: readonly MarketCallRecord[] = [
  {
    id: "GMI-Q1-2026-CALL-001",
    reportId: "GMI-Q1-2026",
    callType: "STRUCTURAL_THESIS",
    statement:
      "Markets are no longer pricing growth within globalisation. They are pricing survivability within fragmentation. Capital is now pricing survivability under supply chain disruption, strategic optionality across jurisdictions, policy credibility of host economies, and durability of revenue models under trade friction simultaneously.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "DIRECTIONALLY_CONFIRMED",
    score: 4,
    evidenceSources: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-007", "GMI-Q2-SRC-013"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 market data confirms fragmentation pricing has deepened. Credit spreads remain elevated, supply-chain optionality is being priced, and management commentary increasingly references resilience over growth. Thesis directionally confirmed; full confirmation requires Q3 evidence on whether this repricing stabilises or accelerates.",
    learning: "Fragmentation pricing is real but the velocity of repricing may slow as markets adapt. Future editions should track whether fragmentation becomes the new baseline or continues to deepen.",
    futureWeightingChange: "Maintain HIGH conviction. Consider upgrading to structural baseline if Q3 evidence confirms persistence.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 4 — Directionally confirmed. Q2 evidence supports fragmentation pricing thesis. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-002",
    reportId: "GMI-Q1-2026",
    callType: "BOARD_INSTRUCTION",
    statement:
      "Map tariff exposure at supplier-node level, not country level. Country-level analysis understates operational exposure where intermediate goods cross multiple borders before final assembly.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "DIRECTIONALLY_CONFIRMED",
    score: 4,
    evidenceSources: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-008", "GMI-Q2-SRC-009"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 evidence confirms that firms conducting supplier-node mapping are identifying materially higher exposure than country-level analysis suggested. Multiple institutional sources confirm origin-compliance enforcement is tightening. Instruction directionally confirmed; adoption rate still uneven.",
    learning: "Board-level adoption of supplier-node mapping is accelerating but remains uneven across sectors. The gap between early adopters and laggards is itself a competitive signal.",
    futureWeightingChange: "Maintain HIGH conviction. Upgrade to confirmed strongly if Q3 shows majority of exposed firms have adopted node-level mapping.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 4 — Directionally confirmed. Firms adopting node-level mapping are finding materially higher exposure. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-003",
    reportId: "GMI-Q1-2026",
    callType: "BOARD_INSTRUCTION",
    statement:
      "Shift supply chain strategy from optimisation to optionality. Operational resilience is now a capital markets variable. Lean-optimised supply chains carry a structural risk premium that was not present before Q1 2026.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "PARTIALLY_CONFIRMED",
    score: 3,
    evidenceSources: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-007"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 evidence shows early signs that equity markets are beginning to differentiate by supply chain resilience, but the signal is not yet strong enough for full confirmation. Some sectors (automotive, electronics) show visible optionality pricing; others remain opaque.",
    learning: "The optionality premium is emerging unevenly by sector. The thesis is correct directionally but the market's pricing mechanism is still developing.",
    futureWeightingChange: "Maintain HIGH conviction. Monitor sector-level dispersion in Q3.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 3 — Partially confirmed. Early signals of optionality pricing but uneven across sectors. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-004",
    reportId: "GMI-Q1-2026",
    callType: "PREDICTION",
    statement:
      "US tariff escalation (effective rate 145% on Chinese imports) adds 1–2pp inflation pressure over 2–4 quarters via consumer goods, intermediate inputs, and upstream cost transmission.",
    originalConfidence: "MEDIUM",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "PARTIALLY_CONFIRMED",
    score: 3,
    evidenceSources: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-005"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 CPI data shows early pass-through in consumer goods categories directly exposed to tariff increases. Intermediate input transmission is still developing. The lower bound of the 1–2pp range appears plausible; the upper bound requires more time for full transmission through supply chains.",
    learning: "Inflation pass-through is occurring at the lower end of the predicted range. Full transmission takes 2–4 quarters as stated — Q3 will be the definitive test.",
    futureWeightingChange: "Maintain MEDIUM conviction. Reassess when Q3 CPI data captures full transmission cycle.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 3 — Partially confirmed. Early pass-through observed at lower bound. Full transmission requires Q3 data. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-005",
    reportId: "GMI-Q1-2026",
    callType: "WATCH_SIGNAL",
    statement:
      "Dollar weakness under risk-off conditions is anomalous and warrants monitoring as a potential signal of reserve currency credibility stress rather than normal safe-haven behaviour reversal.",
    originalConfidence: "MONITORING",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    score: 2,
    evidenceSources: ["GMI-Q2-SRC-006"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Dollar behaviour through Q2 has been mixed — some risk-off episodes showed continued weakness, others showed partial safe-haven recovery. The signal remains ambiguous. Requires Q3 evidence to determine whether this is a structural shift or a temporary anomaly.",
    learning: "The dollar signal requires a full cycle of risk-off episodes to assess. Q2 provided partial data but not enough for a confident reading.",
    futureWeightingChange: "Maintain MONITORING. Upgrade to structured risk if Q3 shows consistent dollar weakness under risk-off.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 2 — Too early to assess. Mixed dollar signals in Q2 require Q3 evidence. Carry-forward with Q3 review date." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-006",
    reportId: "GMI-Q1-2026",
    callType: "SCENARIO_PROBABILITY",
    statement:
      "Managed Fragmentation (elevated tariffs persist, slow supply-chain restructuring, extended monetary constraint, markets reprice to new normal) is the Q1 2026 base case at 43% probability. Method: structured judgement across institutional median forecasts, market-implied pricing, and policy signal analysis.",
    originalConfidence: "MEDIUM",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "PARTIALLY_CONFIRMED",
    score: 3,
    evidenceSources: ["GMI-Q2-SRC-001", "GMI-Q2-SRC-004", "GMI-Q2-SRC-012"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 evidence broadly supports the Managed Fragmentation scenario. Tariffs remain elevated, supply-chain restructuring is proceeding slowly, and monetary policy remains constrained. The base case probability appears appropriate; no material deviation detected.",
    learning: "The scenario framework is holding. The 43% probability was a reasonable central estimate. Future editions should refine probability bands as evidence accumulates.",
    futureWeightingChange: "Maintain MEDIUM conviction. Consider narrowing probability range if Q3 evidence reduces uncertainty.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 3 — Partially confirmed. Managed Fragmentation scenario holding. Base case probability appropriate. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-007",
    reportId: "GMI-Q1-2026",
    callType: "RISK_WARNING",
    statement:
      "China-to-US supply chains should be treated as structurally impaired, not temporarily disrupted. 145% effective US tariff rate and 125% Chinese retaliation represent a regime change, not a cyclical trade friction.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "DIRECTIONALLY_CONFIRMED",
    score: 4,
    evidenceSources: ["GMI-Q2-SRC-004", "GMI-Q2-SRC-008", "GMI-Q2-SRC-009"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 evidence confirms structural impairment. Tariff rates remain elevated with no material de-escalation. Supply chain rerouting is accelerating but at a pace consistent with structural adjustment, not temporary disruption. Firms are treating the regime change as permanent in their planning.",
    learning: "The structural impairment thesis is holding. The key risk is that markets may be underpricing the permanence of the shift — this should be monitored in Q3.",
    futureWeightingChange: "Maintain HIGH conviction. Upgrade to confirmed strongly if Q3 shows no material tariff de-escalation.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 4 — Directionally confirmed. Structural impairment thesis holding. No material de-escalation. Next review: Q3 2026." },
    ],
  },
  {
    id: "GMI-Q1-2026-CALL-008",
    reportId: "GMI-Q1-2026",
    callType: "OPPORTUNITY_SIGNAL",
    statement:
      "Africa is evolving from peripheral exposure to a strategic infrastructure layer for supply chain diversification, resource access, and alternative market development as Western-China bilateral trade fragments.",
    originalConfidence: "LOW",
    expectedReviewWindow: "Q3 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    score: 2,
    evidenceSources: ["GMI-Q2-SRC-010"],
    lastReviewedAt: "2026-06-05",
    nextReviewDue: "2026-09-30",
    outcomeSummary:
      "Q2 review confirms this remains genuinely too early to assess. The structural shift thesis requires Q3 evidence on capital flows, infrastructure investment announcements, and trade rerouting patterns. No material new evidence that would change the assessment.",
    learning: "Africa thesis remains premature for Q2 assessment. The original Q3 review window was correct.",
    futureWeightingChange: "Maintain LOW conviction. Reassess in Q3 as planned.",
    carryForwardJustification: "The Africa opportunity signal was correctly assigned a Q3 review window in the original call. Q2 evidence does not yet provide sufficient data for assessment. Carrying forward to Q3 as planned.",
    versionHistory: [
      { version: "1.0.0", changedAt: "2026-04-08", note: "Initial call registered in the GMI verification ledger." },
      { version: "2.0.0", changedAt: "2026-06-05", note: "Scored 2 — Too early to assess. Q3 review window was correct. Carrying forward with Q3 review date." },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const MARKET_CALL_LEDGER: readonly MarketCallRecord[] = [
  ...GMI_Q1_2026_CALLS,
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getCallsForReport(reportId: string): MarketCallRecord[] {
  return (MARKET_CALL_LEDGER as MarketCallRecord[]).filter((c) => c.reportId === reportId);
}

export function getCallsPendingReview(currentWindow: string): MarketCallRecord[] {
  return (MARKET_CALL_LEDGER as MarketCallRecord[]).filter(
    (c) =>
      c.expectedReviewWindow === currentWindow &&
      (!c.outcomeStatus ||
        c.outcomeStatus === "PENDING_REVIEW" ||
        c.outcomeStatus === "TOO_EARLY_TO_ASSESS"),
  );
}

export function getCallScoreLabel(
  score: 0 | 1 | 2 | 3 | 4 | 5 | null | undefined,
): string {
  switch (score) {
    case 5:    return "Confirmed strongly";
    case 4:    return "Directionally confirmed";
    case 3:    return "Partially confirmed";
    case 2:    return "Too early to assess";
    case 1:    return "Weakly supported";
    case 0:    return "Disconfirmed";
    default:   return "Not yet assessable";
  }
}

function isPendingStatus(status: MarketCallOutcomeStatus | undefined): boolean {
  return (
    status === undefined ||
    status === "PENDING_REVIEW" ||
    status === "TOO_EARLY_TO_ASSESS"
  );
}

export function summariseCallReview(
  records: readonly MarketCallRecord[],
): CallReviewSummary {
  const reviewed = records.filter((r) => !isPendingStatus(r.outcomeStatus));
  const pending = records.filter((r) => isPendingStatus(r.outcomeStatus));

  const scoredRecords = reviewed.filter(
    (r) => r.score !== null && r.score !== undefined,
  );
  const averageScore =
    scoredRecords.length > 0
      ? Math.round(
          (scoredRecords.reduce((sum, r) => sum + (r.score as number), 0) /
            scoredRecords.length) *
            10,
        ) / 10
      : null;

  return {
    totalCalls: records.length,
    reviewed: reviewed.length,
    pending: pending.length,
    averageScore,
    confirmed: reviewed.filter(
      (r) =>
        r.outcomeStatus === "CONFIRMED_STRONGLY" ||
        r.outcomeStatus === "DIRECTIONALLY_CONFIRMED",
    ).length,
    partiallyConfirmed: reviewed.filter(
      (r) => r.outcomeStatus === "PARTIALLY_CONFIRMED",
    ).length,
    notConfirmed: reviewed.filter(
      (r) =>
        r.outcomeStatus === "NOT_CONFIRMED" ||
        r.outcomeStatus === "DISCONFIRMED" ||
        r.outcomeStatus === "WEAKLY_SUPPORTED",
    ).length,
    tooEarly: pending.filter(
      (r) => r.outcomeStatus === "TOO_EARLY_TO_ASSESS",
    ).length,
  };
}

export function getMarketLearningSignals(records: readonly MarketCallRecord[]): string[] {
  return records
    .filter((r) => !isPendingStatus(r.outcomeStatus) && r.learning)
    .map((r) => r.learning as string);
}
