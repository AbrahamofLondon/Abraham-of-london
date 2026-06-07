// SEED ONLY / LEGACY COMPATIBILITY.
// NOT RUNTIME SOURCE OF TRUTH. DO NOT IMPORT IN PUBLIC/API/ADMIN GMI RUNTIME.
// Public and admin GMI operational state must read persisted database rows via
// lib/intelligence/gmi-data-service.server.ts. These records are retained as
// bootstrap seed inputs and historical test fixtures only.

import type { MarketEvidenceClass } from "./market-intelligence-evidence-standard";

export type GmiSourceRowStatus =
  | "SOURCE_PENDING"
  | "EVIDENCE_COLLECTED"
  | "METHOD_NOTE_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "CARRIED_FORWARD";

export type GmiSourceConfidence = "HIGH" | "MEDIUM" | "LOW" | "MONITORING";
export type GmiSourceConfidenceBasis =
  | "observed"
  | "institutionally_sourced"
  | "modelled_estimate"
  | "scenario_assumption"
  | "operator_judgement";

export type GmiSourceAppendixRow = {
  id: string;
  reportId: string;
  claim: string;
  evidenceClass: MarketEvidenceClass;
  confidenceBasis?: GmiSourceConfidenceBasis;
  sourceOrBasis: string;
  observationWindow: string;
  confidence: GmiSourceConfidence;
  reportSection: string;
  status: GmiSourceRowStatus;
  releaseBlocker: boolean;
  methodNote?: string;
  adminJustification?: string;
};

export const GMI_Q2_2026_SOURCE_APPENDIX_ROWS: readonly GmiSourceAppendixRow[] = [
  {
    id: "GMI-Q2-SRC-001",
    reportId: "GMI-Q2-2026",
    claim: "Global growth institutional forecasts point around the low-3% area",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    confidenceBasis: "institutionally_sourced",
    sourceOrBasis: "IMF World Economic Outlook Update, January 2026 (3.3% projection); IMF World Economic Outlook, April 2026 (3.2% projection); cross-referenced against Bloomberg consensus survey (median 3.15–3.3%)",
    observationWindow: "Q1-Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Global Macro Snapshot",
    status: "VERIFIED",
    releaseBlocker: false,
    methodNote: "Forecast range derived from IMF WEO January 2026 (3.3%) and April 2026 update (3.2%), cross-referenced against Bloomberg consensus and major bank forecasts. Range reflects institutional consensus, not modelled estimate.",
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
    sourceOrBasis: "IMF World Economic Outlook, April 2026",
    observationWindow: "April 2026",
    confidence: "HIGH",
    reportSection: "Global Macro Snapshot",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-004",
    reportId: "GMI-Q2-2026",
    claim: "Tariff persistence and policy-friction evidence",
    evidenceClass: "PRIMARY_DATA",
    sourceOrBasis: "US Federal Register tariff proclamations (2026); USTR Notice of Modification, Section 301 tariffs; Chinese Ministry of Commerce tariff adjustment announcements, Q1–Q2 2026",
    observationWindow: "Q2 2026",
    confidence: "HIGH",
    reportSection: "Core Thesis",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-005",
    reportId: "GMI-Q2-2026",
    claim: "Treasury yield volatility",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "Bloomberg US Treasury yield data (2yr, 10yr, 30yr), Q2 2026 range and volatility calculation; FRED H15 selected interest rates",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Rates and Liquidity",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-006",
    reportId: "GMI-Q2-2026",
    claim: "USD stress behaviour",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "Bloomberg DXY index data, Q2 2026 daily close and risk-off episode correlation log; FRED trade-weighted USD index",
    observationWindow: "Q2 2026",
    confidence: "MONITORING",
    reportSection: "FX Regime",
    status: "CARRIED_FORWARD",
    releaseBlocker: false,
    adminJustification: "USD stress signal remains ambiguous. Carried forward to Q3 for additional risk-off episodes to confirm or reject the anomaly thesis.",
  },
  {
    id: "GMI-Q2-SRC-007",
    reportId: "GMI-Q2-2026",
    claim: "Credit spread and liquidity stress",
    evidenceClass: "MARKET_IMPLIED_SIGNAL",
    sourceOrBasis: "ICE BofA US Corporate Index (IG) and US High Yield Index spread data, Q2 2026 (April–June 2026 daily range)",
    observationWindow: "Q2 2026",
    confidence: "MONITORING",
    reportSection: "Rates and Liquidity",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-008",
    reportId: "GMI-Q2-2026",
    claim: "India supply-chain and capital-flow evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "RBI Monetary Policy Report, April 2026; Ministry of Commerce India trade statistics, Q1–Q2 2026; UNCTAD Global Trade Update, May 2026; World Bank India Development Update, 2026; FDI announcement log compiled from Indian investment promotion agency data",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "India",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-009",
    reportId: "GMI-Q2-2026",
    claim: "ASEAN relocation and origin-compliance evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "ADB Asian Development Outlook, April 2026; ASEAN Secretariat trade statistics, Q1–Q2 2026; customs and origin-compliance enforcement data from US CBP and EU customs authority trade enforcement reports",
    observationWindow: "Q2 2026",
    confidence: "MEDIUM",
    reportSection: "Southeast Asia",
    status: "VERIFIED",
    releaseBlocker: false,
  },
  {
    id: "GMI-Q2-SRC-010",
    reportId: "GMI-Q2-2026",
    claim: "Africa minerals, infrastructure, and capital-flow evidence",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    sourceOrBasis: "World Bank Africa Pulse Report, Spring 2026; African Development Bank African Economic Outlook 2026; critical minerals investment announcement log compiled from S&P Global and Africa-focused investment promotion agencies; infrastructure finance data from African Development Fund",
    observationWindow: "Q2-Q3 2026",
    confidence: "MONITORING",
    reportSection: "Africa",
    status: "CARRIED_FORWARD",
    releaseBlocker: false,
    adminJustification: "Africa structural shift thesis requires Q3 evidence. Source row carried forward to align with CALL-008 review window.",
  },
  {
    id: "GMI-Q2-SRC-011",
    reportId: "GMI-Q2-2026",
    claim: "AI productivity offset evidence",
    evidenceClass: "OPERATOR_JUDGEMENT",
    sourceOrBasis: "Bloomberg AI capex expenditure data, Q1–Q2 2026; McKinsey Global Institute productivity estimates, 2026 edition; Stanford AI Index Report 2026; institutional research notes from GS, MS, and JPM AI productivity analysis, Q1–Q2 2026",
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
    sourceOrBasis: "Policy trajectory, tariff persistence, market stress, forecast dispersion, capital-flow and credit signals",
    observationWindow: "Q2 2026",
    confidence: "LOW",
    reportSection: "Scenario Framework",
    status: "VERIFIED",
    releaseBlocker: false,
    methodNote: "Scenario probabilities are derived from structured judgement across institutional median forecasts, market-implied pricing, and policy signal analysis. Each scenario is assigned a probability based on the convergence or divergence of these three input classes. Scenario assumptions are explicitly labelled and not rendered as factual projections.",
  },
  {
    id: "GMI-Q2-SRC-013",
    reportId: "GMI-Q2-2026",
    claim: "Q1 call review evidence",
    evidenceClass: "OPERATOR_JUDGEMENT",
    sourceOrBasis: "GMI Q1 2026 call ledger (8 registered calls); Q2 2026 evidence package comprising SRC-001 through SRC-012; market data from Bloomberg, FRED, ICE BofA, and institutional sources as referenced in individual source rows",
    observationWindow: "Q2 close",
    confidence: "HIGH",
    reportSection: "Prior Quarter Call Review",
    status: "VERIFIED",
    releaseBlocker: false,
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
