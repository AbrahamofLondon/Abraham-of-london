/**
 * lib/product/stale-governed-case-detector.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  detectStaleCases,
  staleCaseSummary,
  STALE_THRESHOLDS_DAYS,
  type StaleCaseInput,
} from "./stale-governed-case-detector";

function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

const NOW = new Date("2026-01-01T12:00:00.000Z");

function makeCase(overrides: Partial<StaleCaseInput> & { daysAgo: number }): StaleCaseInput {
  return {
    caseId: overrides.caseId ?? "case-001",
    title: overrides.title ?? "Test case",
    lastActivityAt: daysAgo(overrides.daysAgo, NOW),
    status: overrides.status ?? "active",
    returnBriefTriggered: overrides.returnBriefTriggered ?? false,
    counselWarranted: overrides.counselWarranted ?? false,
  };
}

// ─── detectStaleCases ─────────────────────────────────────────────────────────

describe("detectStaleCases", () => {
  it("returns empty array when no cases", () => {
    expect(detectStaleCases([], NOW)).toEqual([]);
  });

  it("ignores cases with status != active", () => {
    const result = detectStaleCases(
      [makeCase({ daysAgo: 90, status: "closed" })],
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it("ignores fresh active cases (< 30 days)", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 29 })], NOW);
    expect(result).toHaveLength(0);
  });

  it("classifies 30-day cases as WATCH", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 30 })], NOW);
    expect(result).toHaveLength(1);
    expect(result[0]!.band).toBe("WATCH");
  });

  it("classifies 60-day cases as ALERT", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 60 })], NOW);
    expect(result[0]!.band).toBe("ALERT");
  });

  it("classifies 90-day cases as CRITICAL", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 90 })], NOW);
    expect(result[0]!.band).toBe("CRITICAL");
  });

  it("classifies 91-day cases as CRITICAL", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 91 })], NOW);
    expect(result[0]!.band).toBe("CRITICAL");
  });

  it("sorts by daysInactive descending", () => {
    const results = detectStaleCases(
      [
        makeCase({ caseId: "a", daysAgo: 30 }),
        makeCase({ caseId: "b", daysAgo: 90 }),
        makeCase({ caseId: "c", daysAgo: 60 }),
      ],
      NOW,
    );
    expect(results.map((r) => r.caseId)).toEqual(["b", "c", "a"]);
  });

  it("returns correct daysInactive value", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 45 })], NOW);
    expect(result[0]!.daysInactive).toBe(45);
  });

  it("includes headline and consequence for all bands", () => {
    for (const days of [30, 60, 90]) {
      const result = detectStaleCases([makeCase({ daysAgo: days })], NOW);
      expect(result[0]!.headline).toBeTruthy();
      expect(result[0]!.consequence).toBeTruthy();
    }
  });

  it("headline includes days for CRITICAL", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 90 })], NOW);
    expect(result[0]!.headline).toContain("90");
  });

  it("WATCH cases have at least 1 action", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 30 })], NOW);
    expect(result[0]!.actions.length).toBeGreaterThanOrEqual(1);
  });

  it("CRITICAL cases have CLOSE_CASE action", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 90 })], NOW);
    const kinds = result[0]!.actions.map((a) => a.kind);
    expect(kinds).toContain("CLOSE_CASE");
  });

  it("WATCH cases do not have CLOSE_CASE action", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 30 })], NOW);
    const kinds = result[0]!.actions.map((a) => a.kind);
    expect(kinds).not.toContain("CLOSE_CASE");
  });

  it("CRITICAL cases include ESCALATE_TO_COUNSEL when no return brief", () => {
    const result = detectStaleCases(
      [makeCase({ daysAgo: 90, returnBriefTriggered: false })],
      NOW,
    );
    const kinds = result[0]!.actions.map((a) => a.kind);
    expect(kinds).toContain("ESCALATE_TO_COUNSEL");
  });

  it("CRITICAL cases do not include ESCALATE_TO_COUNSEL when return brief already triggered", () => {
    const result = detectStaleCases(
      [makeCase({ daysAgo: 90, returnBriefTriggered: true })],
      NOW,
    );
    const kinds = result[0]!.actions.map((a) => a.kind);
    expect(kinds).not.toContain("ESCALATE_TO_COUNSEL");
  });

  it("always marks RUN_NEXT_ASSESSMENT as primary", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 30 })], NOW);
    const primary = result[0]!.actions.find((a) => a.primary);
    expect(primary?.kind).toBe("RUN_NEXT_ASSESSMENT");
  });

  it("actions all have non-empty labels, descriptions, and hrefs", () => {
    const result = detectStaleCases([makeCase({ daysAgo: 90 })], NOW);
    for (const action of result[0]!.actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.description.length).toBeGreaterThan(0);
      expect(action.href.length).toBeGreaterThan(0);
    }
  });

  it("uses injectable now date", () => {
    const customNow = new Date("2025-06-01T00:00:00Z");
    const cases = [
      {
        caseId: "x",
        title: "X",
        lastActivityAt: new Date("2025-04-01T00:00:00Z"), // 61 days before Jun 1
        status: "active" as const,
      },
    ];
    const result = detectStaleCases(cases, customNow);
    expect(result[0]!.band).toBe("ALERT");
  });
});

// ─── staleCaseSummary ─────────────────────────────────────────────────────────

describe("staleCaseSummary", () => {
  it("returns zeros for empty array", () => {
    expect(staleCaseSummary([])).toEqual({ total: 0, watch: 0, alert: 0, critical: 0 });
  });

  it("counts by band", () => {
    const results = detectStaleCases(
      [
        makeCase({ caseId: "a", daysAgo: 30 }),
        makeCase({ caseId: "b", daysAgo: 30 }),
        makeCase({ caseId: "c", daysAgo: 60 }),
        makeCase({ caseId: "d", daysAgo: 90 }),
      ],
      NOW,
    );
    const summary = staleCaseSummary(results);
    expect(summary.total).toBe(4);
    expect(summary.watch).toBe(2);
    expect(summary.alert).toBe(1);
    expect(summary.critical).toBe(1);
  });
});

// ─── Threshold constants ──────────────────────────────────────────────────────

describe("STALE_THRESHOLDS_DAYS", () => {
  it("WATCH is 30 days", () => {
    expect(STALE_THRESHOLDS_DAYS.WATCH).toBe(30);
  });
  it("ALERT is 60 days", () => {
    expect(STALE_THRESHOLDS_DAYS.ALERT).toBe(60);
  });
  it("CRITICAL is 90 days", () => {
    expect(STALE_THRESHOLDS_DAYS.CRITICAL).toBe(90);
  });
});
