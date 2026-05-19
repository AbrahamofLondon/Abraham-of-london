export type GmiSignalCategory =
  | "TRADE_POLICY"
  | "TARIFF_ESCALATION"
  | "TREASURY_YIELD"
  | "FX_STRESS"
  | "CREDIT_STRESS"
  | "AI_PRODUCTIVITY"
  | "GROWTH_FORECAST"
  | "CAPITAL_FLOW"
  | "COMMODITY_STRESS";

export type GmiSignalSeverity =
  | "INFO"
  | "WATCH"
  | "ELEVATED"
  | "CRITICAL";

export type GmiSignalStatus =
  | "ACTIVE"
  | "MONITORING"
  | "RESOLVED"
  | "DEFERRED";

export type GmiMonitoringSignal = {
  id: string;
  category: GmiSignalCategory;
  label: string;
  description: string;
  observationWindow: string;
  evidenceRequired: string[];
  linkedReportId?: string;
  linkedCallIds?: string[];
  severity: GmiSignalSeverity;
  status: GmiSignalStatus;
};

export const GMI_MONITORING_SIGNALS: readonly GmiMonitoringSignal[] = [
  {
    id: "GMI-MONITOR-USCN-TARIFF",
    category: "TARIFF_ESCALATION",
    label: "US-China tariff escalation",
    description:
      "Track effective US tariff rate on China and Chinese retaliatory rate. Maintained at 145%/125% supports structural impairment thesis; material reduction below ~50% shifts base case toward de-escalation.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "US Federal Register tariff schedule Q2 status",
      "USTR press releases",
      "Chinese Ministry of Commerce announcements",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-007", "CALL-006"],
    severity: "ELEVATED",
    status: "ACTIVE",
  },
  {
    id: "GMI-MONITOR-PAUSE-STATUS",
    category: "TRADE_POLICY",
    label: "90-day tariff pause — expiry / extension / modification",
    description:
      "US 90-day tariff pause status. Extension or modification materially shifts base-case probability distribution. Expiry without extension confirms escalation trajectory.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "US Executive Order or USTR announcement",
      "Confirmation of pause status at quarter end",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-006"],
    severity: "ELEVATED",
    status: "ACTIVE",
  },
  {
    id: "GMI-MONITOR-US10Y",
    category: "TREASURY_YIELD",
    label: "US 10-year Treasury yield spike",
    description:
      "Track US 10-year yield relative to configured thresholds. Sustained spike above 4.75% indicates financial-condition tightening beyond policy rates; above 5.0% is critical for credit and equity repricing.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "US Treasury market data — Q2 range and volatility",
      "Fed comments on yield behaviour",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-005"],
    severity: "WATCH",
    status: "MONITORING",
  },
  {
    id: "GMI-MONITOR-USD-STRESS",
    category: "FX_STRESS",
    label: "USD weakness during risk-off window",
    description:
      "Track dollar behaviour in risk-off episodes. Persistent weakness during equity stress would indicate reserve-demand dynamics shifting — a structural signal distinct from normal safe-haven behaviour. Not yet a confirmed regime break.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "DXY Q2 range and risk-off episode behaviour",
      "Bloomberg / Refinitiv FX data",
      "Institutional commentary on reserve demand",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-005"],
    severity: "WATCH",
    status: "MONITORING",
  },
  {
    id: "GMI-MONITOR-CREDIT",
    category: "CREDIT_STRESS",
    label: "Credit spread widening",
    description:
      "Track IG and HY credit spread movement. Widening beyond Q1 levels indicates financial stress beginning to compound the trade shock. Required to confirm or revise the credit-tightening claim in the Q2 report.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "ICE BofA IG and HY spread data — Q2 range",
      "Credit market commentary from institutional sources",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: [],
    severity: "WATCH",
    status: "MONITORING",
  },
  {
    id: "GMI-MONITOR-AI-OFFSET",
    category: "AI_PRODUCTIVITY",
    label: "AI capex / productivity offset to trade headwinds",
    description:
      "Track AI infrastructure investment and productivity signals as a potential offset to trade-friction headwinds. JPMorgan and others have framed AI-driven resilience as a counterweight to tariff drag. Evidence quality is currently qualitative.",
    observationWindow: "Q2–Q3 2026",
    evidenceRequired: [
      "AI capex data from major technology companies",
      "IMF or Fed productivity estimates",
      "Institutional research framing AI as growth offset",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: [],
    severity: "INFO",
    status: "MONITORING",
  },
  {
    id: "GMI-MONITOR-INDIA-ASEAN",
    category: "CAPITAL_FLOW",
    label: "India / ASEAN supply-chain reallocation",
    description:
      "Track capital inflow and manufacturing investment signals into India and Southeast Asia as supply chain reallocation beneficiaries. Currently directional signals only — hard Q2 evidence required before strengthening claim.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "UNCTAD investment flow data Q2",
      "World Bank / ADB capital flow reports",
      "Manufacturing FDI announcements in India and ASEAN markets",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: [],
    severity: "INFO",
    status: "MONITORING",
  },
  {
    id: "GMI-MONITOR-AFRICA",
    category: "CAPITAL_FLOW",
    label: "Africa infrastructure / critical minerals signal",
    description:
      "Track Africa strategic importance signals via minerals, infrastructure investment, and geopolitical positioning. CALL-008 review window is Q3 2026. Q2 evidence should be collected to inform Q3 assessment.",
    observationWindow: "Q2–Q3 2026",
    evidenceRequired: [
      "World Bank and African Development Bank capital flow reports",
      "Critical minerals investment announcements",
      "G7 / Western infrastructure commitment data",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-008"],
    severity: "INFO",
    status: "DEFERRED",
  },
  {
    id: "GMI-MONITOR-OIL",
    category: "COMMODITY_STRESS",
    label: "Oil / commodity repricing",
    description:
      "Track Brent crude, copper, and gold behaviour. Oil trajectory indicates global demand sentiment and OPEC+ response. Copper as global growth proxy. Gold behaviour in risk-off episodes correlated with dollar signal.",
    observationWindow: "Q2 2026",
    evidenceRequired: [
      "ICE Brent crude Q2 average and range",
      "LME copper data",
      "Gold price Q2 behaviour",
    ],
    linkedReportId: "GMI-Q2-2026",
    linkedCallIds: ["CALL-005"],
    severity: "INFO",
    status: "MONITORING",
  },
];

export function getSignalsForReport(reportId: string): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter(
    (s) => s.linkedReportId === reportId,
  );
}

export function getSignalsByCategory(category: GmiSignalCategory): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter((s) => s.category === category);
}

export function getSignalsByStatus(status: GmiSignalStatus): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter((s) => s.status === status);
}

export function getSignalsBySeverity(severity: GmiSignalSeverity): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter((s) => s.severity === severity);
}

export function getSignalById(id: string): GmiMonitoringSignal | null {
  return GMI_MONITORING_SIGNALS.find((s) => s.id === id) ?? null;
}

export function getActiveSignals(): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter(
    (s) => s.status === "ACTIVE" || s.status === "MONITORING",
  );
}

export function getSignalsLinkedToCall(callId: string): GmiMonitoringSignal[] {
  return GMI_MONITORING_SIGNALS.filter(
    (s) => s.linkedCallIds?.includes(callId) ?? false,
  );
}
