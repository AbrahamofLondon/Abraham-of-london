// lib/dashboard/drilldowns.ts
// Central mapping of dashboard sections to their detail endpoints.
// Snapshot is the primary command-centre source.
// These endpoints are on-demand drill-downs — never fetched on initial load.

export const DASHBOARD_DRILLDOWNS = {
  boardroomFunnel:      "/api/dashboard/boardroom-funnel",
  fulfilmentState:      "/api/dashboard/fulfilment-state",
  retainerHealth:       "/api/dashboard/retainer-health",
  operationalSummary:   "/api/dashboard/operational-summary",
  oversightReviews:     "/api/dashboard/oversight-reviews",
  riskSuppression:      "/api/dashboard/risk-suppression",
  pressureTrend:        "/api/dashboard/pressure-trend?days=30",
  outcomeDistribution:  "/api/dashboard/outcome-distribution",
  recentActivity:       "/api/dashboard/recent-activity?limit=20",
} as const;

export type DrilldownKey = keyof typeof DASHBOARD_DRILLDOWNS;

export type DrilldownAccess = "public_safe" | "operator_only";

// Classify each drill-down by data sensitivity.
// PUBLIC_SAFE: aggregate counts, anonymised activity, no PII.
// OPERATOR_ONLY: operational queues, suppression ledger, review cycles, internal data.
export const DRILLDOWN_ACCESS: Record<DrilldownKey, DrilldownAccess> = {
  boardroomFunnel:      "public_safe",
  fulfilmentState:      "operator_only",
  retainerHealth:       "operator_only",
  operationalSummary:   "operator_only",
  oversightReviews:     "operator_only",
  riskSuppression:      "operator_only",
  pressureTrend:        "public_safe",
  outcomeDistribution:  "public_safe",
  recentActivity:       "public_safe",
};

// Human-readable labels for drill-down targets.
export const DRILLDOWN_LABELS: Record<DrilldownKey, string> = {
  boardroomFunnel:      "Boardroom Brief Funnel",
  fulfilmentState:      "Fulfilment Pipeline",
  retainerHealth:       "Retainer Contract Health",
  operationalSummary:   "Operational Queue Summary",
  oversightReviews:     "Oversight Review Cycles",
  riskSuppression:      "Risk Suppression Ledger",
  pressureTrend:        "30-Day Pressure Trend",
  outcomeDistribution:  "Outcome Distribution Detail",
  recentActivity:       "Full Activity Log",
};
