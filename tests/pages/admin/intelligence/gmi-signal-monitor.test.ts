import { describe, expect, it } from "vitest";

import { buildGmiSignalMonitorViewModel } from "@/pages/admin/intelligence/gmi-signal-monitor";

describe("buildGmiSignalMonitorViewModel", () => {
  const vm = buildGmiSignalMonitorViewModel();

  it("is scoped to GMI-Q2-2026", () => {
    expect(vm.reportId).toBe("GMI-Q2-2026");
  });

  it("returns signals for GMI-Q2-2026 only", () => {
    expect(vm.signals.length).toBeGreaterThan(0);
    expect(vm.signals.every((s) => s.linkedReportId === "GMI-Q2-2026")).toBe(true);
  });

  it("has exactly 2 ELEVATED signals — trade policy pivots", () => {
    expect(vm.bySeverity.ELEVATED.length).toBe(2);
    const ids = vm.bySeverity.ELEVATED.map((s) => s.id);
    expect(ids).toContain("GMI-MONITOR-USCN-TARIFF");
    expect(ids).toContain("GMI-MONITOR-PAUSE-STATUS");
  });

  it("has exactly 3 WATCH signals — market condition monitors", () => {
    expect(vm.bySeverity.WATCH.length).toBe(3);
    const ids = vm.bySeverity.WATCH.map((s) => s.id);
    expect(ids).toContain("GMI-MONITOR-US10Y");
    expect(ids).toContain("GMI-MONITOR-USD-STRESS");
    expect(ids).toContain("GMI-MONITOR-CREDIT");
  });

  it("has INFO signals for contextual inputs", () => {
    expect(vm.bySeverity.INFO.length).toBeGreaterThan(0);
  });

  it("has 1 DEFERRED signal (Africa — Q3 review window)", () => {
    expect(vm.byStatus.DEFERRED.length).toBe(1);
    expect(vm.byStatus.DEFERRED[0]?.id).toBe("GMI-MONITOR-AFRICA");
  });

  it("every signal has at least one evidence requirement", () => {
    expect(vm.signals.every((s) => s.evidenceRequired.length > 0)).toBe(true);
  });

  it("US10Y signal carries a threshold summary with numerical values", () => {
    const us10y = vm.signals.find((s) => s.id === "GMI-MONITOR-US10Y");
    expect(us10y?.thresholdSummary).toBeDefined();
    expect(us10y?.thresholdSummary).toContain("4.5");
    expect(us10y?.thresholdSummary).toContain("4.75");
    expect(us10y?.thresholdSummary).toContain("5.0");
  });

  it("US10Y threshold values match the configured thresholds model", () => {
    expect(vm.thresholds.us10y.watch).toBe("≥ 4.5%");
    expect(vm.thresholds.us10y.elevated).toBe("≥ 4.75%");
    expect(vm.thresholds.us10y.critical).toBe("≥ 5.0%");
  });

  it("growth comparison has an institutional range and midpoint", () => {
    expect(vm.growthComparison.institutionalRange.low).toBeGreaterThan(0);
    expect(vm.growthComparison.institutionalRange.high).toBeGreaterThan(
      vm.growthComparison.institutionalRange.low,
    );
    expect(vm.growthComparison.institutionalMidpoint).toBeGreaterThan(0);
  });

  it("AoL scenario sits below the institutional midpoint", () => {
    const aol = vm.growthComparison.aolScenario;
    expect(aol?.globalGrowthEstimate).not.toBeNull();
    expect(aol!.globalGrowthEstimate!).toBeLessThan(
      vm.growthComparison.institutionalMidpoint,
    );
  });

  it("AoL scenario is labelled SCENARIO_ASSUMPTION", () => {
    expect(vm.growthComparison.aolScenario?.evidenceClass).toBe("SCENARIO_ASSUMPTION");
  });

  it("growth input rows include all sources", () => {
    const sources = vm.growthInputRows.map((r) => r.source);
    expect(sources).toContain("IMF");
    expect(sources).toContain("GOLDMAN_SACHS");
    expect(sources).toContain("MORGAN_STANLEY");
    expect(sources).toContain("AOL_SCENARIO");
  });

  it("Goldman Sachs and Morgan Stanley rows are flagged as pending confirmation", () => {
    const gs = vm.growthInputRows.find((r) => r.source === "GOLDMAN_SACHS");
    const ms = vm.growthInputRows.find((r) => r.source === "MORGAN_STANLEY");
    expect(gs?.pendingConfirmation).toBe(true);
    expect(ms?.pendingConfirmation).toBe(true);
  });

  it("IMF row is not flagged as pending confirmation (confirmed source)", () => {
    const imf = vm.growthInputRows.find((r) => r.source === "IMF");
    expect(imf?.pendingConfirmation).toBe(false);
  });

  it("does not contain market-prediction language", () => {
    const text = JSON.stringify(vm);
    expect(text).not.toMatch(/predicts markets/i);
    expect(text).not.toMatch(/automatically learns from markets/i);
    expect(text).not.toMatch(/real-time prediction/i);
    expect(text).not.toMatch(/\b(buy|sell|hold)\b/i);
    expect(text).not.toMatch(/guaranteed return/i);
    expect(text).not.toMatch(/target price/i);
  });

  it("counts evidence items required across all signals", () => {
    const manualCount = vm.signals.reduce(
      (sum, s) => sum + s.evidenceRequired.length,
      0,
    );
    expect(vm.evidenceItemsRequired).toBe(manualCount);
  });

  it("totalActive and totalMonitoring match byStatus counts", () => {
    expect(vm.totalActive).toBe(vm.byStatus.ACTIVE.length);
    expect(vm.totalMonitoring).toBe(vm.byStatus.MONITORING.length);
    expect(vm.totalDeferred).toBe(vm.byStatus.DEFERRED.length);
  });
});
