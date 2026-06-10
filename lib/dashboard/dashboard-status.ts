// lib/dashboard/dashboard-status.ts
// Pure utility — exported so component and tests can share the same logic.

export type DashboardStatus = "LIVE" | "NO_DATA_YET" | "DEGRADED" | "DEMO" | "ERROR";

export interface DashboardStatusInput {
  useMockData: boolean;
  failedEndpoints: number;
  totalEndpoints: number;
  /** null when the core /api/dashboard/metrics call itself failed */
  metrics: {
    totalPressureSignals: number;
    activeBoardroomBriefs: number;
    monthlyRecurringRevenue: number;
  } | null;
}

/**
 * Compute the dashboard truth badge from fetch state.
 *
 * Priority order:
 *   DEMO        — useMockData=true (design preview only)
 *   ERROR       — core metrics endpoint failed (nothing meaningful to show)
 *   DEGRADED    — some non-core endpoints failed but metrics are available
 *   LIVE        — all endpoints succeeded and at least one metric is non-zero
 *   NO_DATA_YET — all endpoints succeeded but every core metric is zero
 */
export function computeDashboardStatus(input: DashboardStatusInput): DashboardStatus {
  if (input.useMockData) return "DEMO";
  if (input.metrics === null) return "ERROR";
  if (input.failedEndpoints > 0) return "DEGRADED";

  const hasRealData =
    input.metrics.totalPressureSignals > 0 ||
    input.metrics.activeBoardroomBriefs > 0 ||
    input.metrics.monthlyRecurringRevenue > 0;

  return hasRealData ? "LIVE" : "NO_DATA_YET";
}
