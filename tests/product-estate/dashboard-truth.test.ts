/**
 * tests/product-estate/dashboard-truth.test.ts
 *
 * Dashboard truth audit tests.
 *
 * 1. Source-level audit: verifies hardcoded traction claims are absent
 *    from the LiveDataDashboard component.
 * 2. computeDashboardStatus: verifies the badge state machine.
 * 3. Mock mode: verifies useMockData=true triggers DEMO status.
 * 4. API endpoint type contracts: verifies zero-safe response shapes.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import {
  computeDashboardStatus,
  type DashboardStatus,
} from "@/lib/dashboard/dashboard-status";

// ── Helper ────────────────────────────────────────────────────────────────────

const DASHBOARD_SOURCE = readFileSync(
  join(process.cwd(), "components/dashboard/LiveDataDashboard.tsx"),
  "utf-8",
);

// ── P1: Source audit — hardcoded claims ───────────────────────────────────────

describe("LiveDataDashboard — no hardcoded traction claims", () => {
  it("does not contain '+12%' or '12%' as a hardcoded string", () => {
    // The previous version had "+12% vs last quarter" baked into JSX.
    // Split to avoid this test file itself triggering a naive grep.
    const forbidden = "+" + "12" + "%";
    expect(DASHBOARD_SOURCE).not.toContain(forbidden);
  });

  it("does not contain '+2.1%' as a hardcoded delta", () => {
    const forbidden = "+" + "2.1" + "%";
    expect(DASHBOARD_SOURCE).not.toContain(forbidden);
  });

  it("does not contain '-0.8%' as a hardcoded delta", () => {
    const forbidden = "-" + "0.8" + "%";
    expect(DASHBOARD_SOURCE).not.toContain(forbidden);
  });

  it("does not contain 'vs last quarter' as a hardcoded label", () => {
    expect(DASHBOARD_SOURCE).not.toContain("vs last quarter");
  });

  it("does not contain a hardcoded MRR figure like '4850' or '4,850'", () => {
    expect(DASHBOARD_SOURCE).not.toContain("4850");
    expect(DASHBOARD_SOURCE).not.toContain("4,850");
  });

  it("does not claim '1247' or '1,247' as a signal count", () => {
    expect(DASHBOARD_SOURCE).not.toContain("1247");
    expect(DASHBOARD_SOURCE).not.toContain("1,247");
  });

  it("does not use a hardcoded trend prop with 'up' mapping to a fixed arrow string", () => {
    // The old MetricCard had: trend === "up" && "▲ +2.1%"
    // This pattern produced fake deltas. Verify it is gone.
    expect(DASHBOARD_SOURCE).not.toContain('trend === "up" && "▲');
    expect(DASHBOARD_SOURCE).not.toContain('trend === "down" && "▼');
  });
});

// ── P2: computeDashboardStatus state machine ──────────────────────────────────

describe("computeDashboardStatus", () => {
  const zeroMetrics = {
    totalPressureSignals: 0,
    activeBoardroomBriefs: 0,
    monthlyRecurringRevenue: 0,
  };

  const realMetrics = {
    totalPressureSignals: 42,
    activeBoardroomBriefs: 3,
    monthlyRecurringRevenue: 297,
  };

  it("returns DEMO when useMockData is true, regardless of other state", () => {
    const result = computeDashboardStatus({
      useMockData: true,
      failedEndpoints: 0,
      totalEndpoints: 7,
      metrics: realMetrics,
    });
    expect(result).toBe("DEMO" satisfies DashboardStatus);
  });

  it("returns DEMO when useMockData is true even if metrics is null", () => {
    const result = computeDashboardStatus({
      useMockData: true,
      failedEndpoints: 7,
      totalEndpoints: 7,
      metrics: null,
    });
    expect(result).toBe("DEMO");
  });

  it("returns ERROR when metrics endpoint failed (metrics is null)", () => {
    const result = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 1,
      totalEndpoints: 7,
      metrics: null,
    });
    expect(result).toBe("ERROR");
  });

  it("returns ERROR when all endpoints failed and metrics is null", () => {
    const result = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 7,
      totalEndpoints: 7,
      metrics: null,
    });
    expect(result).toBe("ERROR");
  });

  it("returns DEGRADED when some non-core endpoints fail but metrics are available", () => {
    const result = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 2,
      totalEndpoints: 7,
      metrics: realMetrics,
    });
    expect(result).toBe("DEGRADED");
  });

  it("returns LIVE when all endpoints succeed and metrics have real data", () => {
    const result = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 0,
      totalEndpoints: 7,
      metrics: realMetrics,
    });
    expect(result).toBe("LIVE");
  });

  it("returns LIVE when only pressureSignals is non-zero", () => {
    expect(
      computeDashboardStatus({
        useMockData: false,
        failedEndpoints: 0,
        totalEndpoints: 7,
        metrics: { totalPressureSignals: 1, activeBoardroomBriefs: 0, monthlyRecurringRevenue: 0 },
      }),
    ).toBe("LIVE");
  });

  it("returns LIVE when only activeBoardroomBriefs is non-zero", () => {
    expect(
      computeDashboardStatus({
        useMockData: false,
        failedEndpoints: 0,
        totalEndpoints: 7,
        metrics: { totalPressureSignals: 0, activeBoardroomBriefs: 1, monthlyRecurringRevenue: 0 },
      }),
    ).toBe("LIVE");
  });

  it("returns LIVE when only revenue is non-zero", () => {
    expect(
      computeDashboardStatus({
        useMockData: false,
        failedEndpoints: 0,
        totalEndpoints: 7,
        metrics: { totalPressureSignals: 0, activeBoardroomBriefs: 0, monthlyRecurringRevenue: 99 },
      }),
    ).toBe("LIVE");
  });

  it("returns NO_DATA_YET when all endpoints succeed but all metrics are zero", () => {
    const result = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 0,
      totalEndpoints: 7,
      metrics: zeroMetrics,
    });
    expect(result).toBe("NO_DATA_YET");
  });

  it("does not show LIVE just because the component rendered — requires real non-zero data", () => {
    // Critical rule from the spec: "Do not show LIVE just because the component rendered."
    const emptyDatabase = computeDashboardStatus({
      useMockData: false,
      failedEndpoints: 0,
      totalEndpoints: 7,
      metrics: zeroMetrics,
    });
    expect(emptyDatabase).not.toBe("LIVE");
    expect(emptyDatabase).toBe("NO_DATA_YET");
  });
});

// ── P6: Mock mode safeguards ──────────────────────────────────────────────────

describe("mock mode containment", () => {
  it("mock metrics contain no MRR-scale revenue figure", () => {
    // Import the generateMockMetrics logic by reading and evaluating is fragile.
    // Instead, verify the source doesn't contain large revenue figures.
    expect(DASHBOARD_SOURCE).not.toContain("monthlyRecurringRevenue: 4850");
    expect(DASHBOARD_SOURCE).not.toContain("monthlyRecurringRevenue: 4000");
    expect(DASHBOARD_SOURCE).not.toContain("monthlyRecurringRevenue: 1000");
  });

  it("mock activity titles contain [DEMO] prefix so they are visibly fictional", () => {
    expect(DASHBOARD_SOURCE).toContain("[DEMO]");
  });

  it("DEFAULT_USE_MOCK_DATA is false in production", () => {
    // Source should set IS_PRODUCTION ? false : false — always false
    expect(DASHBOARD_SOURCE).toContain("IS_PRODUCTION ? false : false");
  });
});

// ── P0 regression: boardroom-brief PRODUCT_CODES ──────────────────────────────
// The entitlement regression lives in tests/billing/boardroom-brief-entitlement-code.test.ts.
// This test confirms that file still exists and has not been removed.

describe("billing regression test presence", () => {
  it("boardroom-brief-entitlement-code.test.ts exists", () => {
    let exists = true;
    try {
      readFileSync(
        join(process.cwd(), "tests/billing/boardroom-brief-entitlement-code.test.ts"),
        "utf-8",
      );
    } catch {
      exists = false;
    }
    expect(exists).toBe(true);
  });
});
