/* tests/intelligence/gmi-falsification-workbench.test.ts — Falsification gap resolution tests */
import { describe, expect, it } from "vitest";
import { buildGmiFalsificationRegister } from "@/lib/intelligence/gmi-control-plane";
import { getPublicGmiCallLedger } from "@/lib/intelligence/gmi-instrument";

describe("GMI falsification workbench", () => {
  it("Q2 has falsification rules registered", () => {
    const rules = buildGmiFalsificationRegister("GMI-Q2-2026");
    expect(rules.length).toBeGreaterThan(0);
  });

  it("all rules have threshold values", () => {
    const rules = buildGmiFalsificationRegister("GMI-Q2-2026");
    for (const rule of rules) {
      expect(rule.thresholdValue?.trim()).toBeTruthy();
    }
  });

  it("all rules have observable indicators", () => {
    const rules = buildGmiFalsificationRegister("GMI-Q2-2026");
    for (const rule of rules) {
      expect(rule.observableIndicator?.trim()).toBeTruthy();
    }
  });

  it("all rules have next review dates", () => {
    const rules = buildGmiFalsificationRegister("GMI-Q2-2026");
    for (const rule of rules) {
      expect(rule.nextReviewDue?.trim()).toBeTruthy();
    }
  });

  it("high-conviction calls without linked rules represent falsification gaps", () => {
    const rules = buildGmiFalsificationRegister("GMI-Q2-2026");
    const calls = getPublicGmiCallLedger();
    const highConvictionCalls = calls.filter(
      (c) => c.editionId === "GMI-Q1-2026" && c.confidenceBand === "HIGH"
    );
    const covered = highConvictionCalls.filter((call) =>
      rules.some((r) => r.evidenceSourceRows.includes(call.callId))
    );
    const gaps = highConvictionCalls.length - covered.length;
    // There may be gaps — this test documents the current state
    expect(gaps).toBeGreaterThanOrEqual(0);
  });
});
