// ─────────────────────────────────────────────────────────────────────────────
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
  expectedReviewWindow: string;
  outcomeStatus?: MarketCallOutcomeStatus;
  score?: 0 | 1 | 2 | 3 | 4 | 5 | null;
  outcomeSummary?: string;
  learning?: string;
  futureWeightingChange?: string;
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
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Structural thesis requires Q2 market data to assess whether fragmentation pricing has deepened, stabilised, or reversed.",
  },
  {
    id: "GMI-Q1-2026-CALL-002",
    reportId: "GMI-Q1-2026",
    callType: "BOARD_INSTRUCTION",
    statement:
      "Map tariff exposure at supplier-node level, not country level. Country-level analysis understates operational exposure where intermediate goods cross multiple borders before final assembly.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Instruction validity depends on whether firms acting on it produced materially different risk assessments than country-level mapping. Q2 evidence needed.",
  },
  {
    id: "GMI-Q1-2026-CALL-003",
    reportId: "GMI-Q1-2026",
    callType: "BOARD_INSTRUCTION",
    statement:
      "Shift supply chain strategy from optimisation to optionality. Operational resilience is now a capital markets variable. Lean-optimised supply chains carry a structural risk premium that was not present before Q1 2026.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Implementation timelines vary. Q2 should assess whether equity markets are visibly rewarding operational flexibility disclosures.",
  },
  {
    id: "GMI-Q1-2026-CALL-004",
    reportId: "GMI-Q1-2026",
    callType: "PREDICTION",
    statement:
      "US tariff escalation (effective rate 145% on Chinese imports) adds 1–2pp inflation pressure over 2–4 quarters via consumer goods, intermediate inputs, and upstream cost transmission.",
    originalConfidence: "MEDIUM",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Q2 CPI data and PCE readings will provide first observable evidence of pass-through. Full transmission takes 2–4 quarters — partly assessable in Q2.",
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
    outcomeSummary:
      "Dollar trajectory through Q2 is the primary observable. Sustained weakness under continued risk-off would upgrade this from MONITORING to a structured risk.",
  },
  {
    id: "GMI-Q1-2026-CALL-006",
    reportId: "GMI-Q1-2026",
    callType: "SCENARIO_PROBABILITY",
    statement:
      "Managed Fragmentation (elevated tariffs persist, slow supply-chain restructuring, extended monetary constraint, markets reprice to new normal) is the Q1 2026 base case at 43% probability. Method: structured judgement across institutional median forecasts, market-implied pricing, and policy signal analysis.",
    originalConfidence: "MEDIUM",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Base-case confidence requires Q2 trade data, Fed posture confirmation, and credit spread behaviour to assess whether the managed fragmentation thesis is holding.",
  },
  {
    id: "GMI-Q1-2026-CALL-007",
    reportId: "GMI-Q1-2026",
    callType: "RISK_WARNING",
    statement:
      "China-to-US supply chains should be treated as structurally impaired, not temporarily disrupted. 145% effective US tariff rate and 125% Chinese retaliation represent a regime change, not a cyclical trade friction.",
    originalConfidence: "HIGH",
    expectedReviewWindow: "Q2 2026",
    outcomeStatus: "TOO_EARLY_TO_ASSESS",
    outcomeSummary:
      "Q2 tariff trajectory — maintained, reduced, or escalated — is the primary evidence variable. Any de-escalation below ~50% would require reassessment.",
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
    outcomeSummary:
      "Structural shift thesis. Q2 review premature — this call requires Q3 evidence on capital flows, infrastructure investment announcements, and trade rerouting patterns.",
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
    case 2:    return "Weakly supported";
    case 1:    return "Not confirmed";
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
