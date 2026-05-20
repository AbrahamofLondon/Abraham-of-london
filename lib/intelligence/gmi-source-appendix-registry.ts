import type { MarketEvidenceClass } from "./market-intelligence-evidence-standard";

export type GmiSourceRowStatus =
  | "SOURCE_PENDING"
  | "EVIDENCE_COLLECTED"
  | "METHOD_NOTE_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "CARRIED_FORWARD";

export type GmiSourceConfidence = "HIGH" | "MEDIUM" | "LOW" | "MONITORING";

export type GmiSourceAppendixRow = {
  id: string;
  reportId: string;
  claim: string;
  evidenceClass: MarketEvidenceClass;
  sourceOrBasis: string;
  observationWindow: string;
  confidence: GmiSourceConfidence;
  reportSection: string;
  status: GmiSourceRowStatus;
  releaseBlocker: boolean;
};

export const GMI_Q2_2026_SOURCE_APPENDIX_ROWS: readonly GmiSourceAppendixRow[] = [
  {
    id: "GMI-Q2-SRC-001",
    reportId: "GMI-Q2-2026",
    claim: "Global growth institutional forecasts point around the low-3% area",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "IMF January 2026 forecast; IMF April 2026 update; bank forecasts where sourced",
    observationWindow: "Q1-Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Global Macro Snapshot",
    status: "METHOD_NOTE_REQUIRED",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-002",
    reportId: "GMI-Q2-2026",
    claim: "IMF January 2026 global growth projection",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "IMF World Economic Outlook Update, January 2026",
    observationWindow: "Q1 2026",
    confidence: "HIGH",
    reportSection: "Global Macro Snapshot",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-003",
    reportId: "GMI-Q2-2026",
    claim: "IMF April 2026 update",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "Source pending",
    observationWindow: "April 2026",
    confidence: "HIGH",
    reportSection: "Global Macro Snapshot",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-004",
    reportId: "GMI-Q2-2026",
    claim: "Tariff persistence and policy-friction evidence",
    evidenceClass: "PRIMARY_DATA",
    sourceOrBasis: "US Federal Register / USTR; Chinese Ministry of Commerce",
    observationWindow: "Q2 2026",
    confidence: "HIGH",
    reportSection: "Core Thesis",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-005",
    reportId: "GMI-Q2-2026",
    claim: "Treasury yield volatility",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "US Treasury market data - Q2 yield range and volatility",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Rates and Liquidity",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-006",
    reportId: "GMI-Q2-2026",
    claim: "USD stress behaviour",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "DXY market data and Q2 risk-off episode log",
    observationWindow: "Q2 2026",
    confidence: "MONITORING",
    reportSection: "FX Regime",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-007",
    reportId: "GMI-Q2-2026",
    claim: "Credit spread and liquidity stress",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "ICE BofA IG and HY spread data - Q2 range",
    observationWindow: "Q2 2026",
    confidence: "MONITORING",
    reportSection: "Rates and Liquidity",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-008",
    reportId: "GMI-Q2-2026",
    claim: "India supply-chain and capital-flow evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "RBI, Ministry of Commerce India, UNCTAD, World Bank, FDI announcements",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "India",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-009",
    reportId: "GMI-Q2-2026",
    claim: "ASEAN relocation and origin-compliance evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "ADB, trade body data, customs/origin enforcement data",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Southeast Asia",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-010",
    reportId: "GMI-Q2-2026",
    claim: "Africa minerals, infrastructure, and capital-flow evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "World Bank, African Development Bank, critical minerals and infrastructure announcements",
    observationWindow: "Q2-Q3 2026",
    confidence: "MONITORING",
    reportSection: "Africa",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-011",
    reportId: "GMI-Q2-2026",
    claim: "AI productivity offset evidence",
    evidenceClass: "OPERATOR_JUDGEMENT",
    sourceOrBasis: "AI capex data, productivity estimates, institutional research",
    observationWindow: "Q2-Q3 2026",
    confidence: "LOW",
    reportSection: "Growth Regime / Scenario Framework",
    status: "SOURCE_PENDING",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-012",
    reportId: "GMI-Q2-2026",
    claim: "Scenario probability method basis",
    evidenceClass: "SCENARIO_ASSUMPTION",
    sourceOrBasis: "Method note required: policy trajectory, tariff persistence, market stress, forecast dispersion, capital-flow and credit signals",
    observationWindow: "Q2 2026",
    confidence: "LOW",
    reportSection: "Scenario Framework",
    status: "METHOD_NOTE_REQUIRED",
    releaseBlocker: true,
  },
  {
    id: "GMI-Q2-SRC-013",
    reportId: "GMI-Q2-2026",
    claim: "Q1 call review evidence",
    evidenceClass: "OPERATOR_JUDGEMENT",
    sourceOrBasis: "Q1 call ledger and Q2 evidence package",
    observationWindow: "Q2 close",
    confidence: "HIGH",
    reportSection: "Prior Quarter Call Review",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
] as const;

export const GMI_SOURCE_APPENDIX_REGISTRY: readonly GmiSourceAppendixRow[] = [
  ...GMI_Q2_2026_SOURCE_APPENDIX_ROWS,
];

export function getSourceRowsForReport(reportId: string): GmiSourceAppendixRow[] {
  return GMI_SOURCE_APPENDIX_REGISTRY.filter((row) => row.reportId === reportId);
}

export function getReleaseBlockerRows(reportId: string): GmiSourceAppendixRow[] {
  return getSourceRowsForReport(reportId).filter((row) => row.releaseBlocker);
}

export function getPendingSourceRows(reportId: string): GmiSourceAppendixRow[] {
  return getSourceRowsForReport(reportId).filter((row) =>
    row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED",
  );
}

export function hasPendingReleaseBlockerRows(reportId: string): boolean {
  return getReleaseBlockerRows(reportId).some((row) =>
    row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED",
  );
}
