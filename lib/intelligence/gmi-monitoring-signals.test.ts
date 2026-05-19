import { describe, expect, it } from "vitest";

import {
  GMI_MONITORING_SIGNALS,
  getActiveSignals,
  getSignalById,
  getSignalsByCategory,
  getSignalsBySeverity,
  getSignalsByStatus,
  getSignalsForReport,
  getSignalsLinkedToCall,
} from "./gmi-monitoring-signals";

describe("GMI_MONITORING_SIGNALS — structure", () => {
  it("seeds at least 9 monitoring signals", () => {
    expect(GMI_MONITORING_SIGNALS.length).toBeGreaterThanOrEqual(9);
  });

  it("every signal has a unique id", () => {
    const ids = GMI_MONITORING_SIGNALS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every signal has a non-empty label and description", () => {
    for (const signal of GMI_MONITORING_SIGNALS) {
      expect(signal.label.length).toBeGreaterThan(0);
      expect(signal.description.length).toBeGreaterThan(0);
    }
  });

  it("every signal has at least one evidenceRequired entry", () => {
    for (const signal of GMI_MONITORING_SIGNALS) {
      expect(signal.evidenceRequired.length).toBeGreaterThan(0);
    }
  });
});

describe("getSignalsForReport", () => {
  it("returns signals linked to GMI-Q2-2026", () => {
    const signals = getSignalsForReport("GMI-Q2-2026");
    expect(signals.length).toBeGreaterThan(0);
  });

  it("returns empty array for unknown report id", () => {
    expect(getSignalsForReport("GMI-UNKNOWN")).toHaveLength(0);
  });
});

describe("getSignalsByCategory", () => {
  it("returns TARIFF_ESCALATION signals", () => {
    const signals = getSignalsByCategory("TARIFF_ESCALATION");
    expect(signals.length).toBeGreaterThan(0);
  });

  it("returns FX_STRESS signals", () => {
    const signals = getSignalsByCategory("FX_STRESS");
    expect(signals.some((s) => s.id === "GMI-MONITOR-USD-STRESS")).toBe(true);
  });

  it("returns TREASURY_YIELD signals", () => {
    const signals = getSignalsByCategory("TREASURY_YIELD");
    expect(signals.some((s) => s.id === "GMI-MONITOR-US10Y")).toBe(true);
  });
});

describe("getSignalsByStatus", () => {
  it("returns ACTIVE signals", () => {
    const active = getSignalsByStatus("ACTIVE");
    expect(active.length).toBeGreaterThan(0);
    for (const s of active) {
      expect(s.status).toBe("ACTIVE");
    }
  });

  it("returns MONITORING signals", () => {
    const monitoring = getSignalsByStatus("MONITORING");
    expect(monitoring.length).toBeGreaterThan(0);
  });
});

describe("getSignalsBySeverity", () => {
  it("returns ELEVATED signals", () => {
    const elevated = getSignalsBySeverity("ELEVATED");
    expect(elevated.length).toBeGreaterThan(0);
    expect(elevated.every((s) => s.severity === "ELEVATED")).toBe(true);
  });
});

describe("getSignalById", () => {
  it("returns the correct signal by id", () => {
    const signal = getSignalById("GMI-MONITOR-USCN-TARIFF");
    expect(signal).not.toBeNull();
    expect(signal?.category).toBe("TARIFF_ESCALATION");
  });

  it("returns null for unknown id", () => {
    expect(getSignalById("GMI-MONITOR-UNKNOWN")).toBeNull();
  });
});

describe("getActiveSignals", () => {
  it("returns all ACTIVE and MONITORING signals", () => {
    const active = getActiveSignals();
    for (const s of active) {
      expect(["ACTIVE", "MONITORING"]).toContain(s.status);
    }
  });

  it("does not include DEFERRED signals", () => {
    const active = getActiveSignals();
    expect(active.some((s) => s.status === "DEFERRED")).toBe(false);
  });
});

describe("getSignalsLinkedToCall", () => {
  it("returns signals linked to CALL-007", () => {
    const signals = getSignalsLinkedToCall("CALL-007");
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some((s) => s.id === "GMI-MONITOR-USCN-TARIFF")).toBe(true);
  });

  it("returns signals linked to CALL-005", () => {
    const signals = getSignalsLinkedToCall("CALL-005");
    expect(signals.some((s) => s.id === "GMI-MONITOR-USD-STRESS")).toBe(true);
  });

  it("returns signals linked to CALL-008", () => {
    const signals = getSignalsLinkedToCall("CALL-008");
    expect(signals.some((s) => s.id === "GMI-MONITOR-AFRICA")).toBe(true);
  });

  it("returns empty array for call with no linked signals", () => {
    expect(getSignalsLinkedToCall("CALL-UNKNOWN")).toHaveLength(0);
  });
});
