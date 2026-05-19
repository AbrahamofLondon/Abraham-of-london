import { describe, expect, it } from "vitest";

import {
  canPurchaseMarketIntelligenceReport,
  getActiveMarketIntelligenceReports,
  getMarketIntelligenceFreshnessLabel,
  getMarketIntelligenceLifecycleBadge,
  getMarketIntelligenceRecord,
  getPublicMarketIntelligenceReports,
} from "./market-intelligence-lifecycle";

describe("market intelligence lifecycle registry", () => {
  it("keeps GMI Q1 2026 active until superseded", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");

    expect(q1?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q1?.decisionWindow).toBe("Q2 2026");
    expect(q1?.lifecycleState).not.toBe("RETIRED");
    expect(q1?.lifecycleState).not.toBe("ARCHIVED");
    expect(q1?.lifecycleState).not.toBe("SUPERSEDED");
  });

  it("keeps GMI Q1 2026 purchasable", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");

    expect(q1).not.toBeNull();
    expect(q1?.purchasable).toBe(true);
    expect(canPurchaseMarketIntelligenceReport(q1!)).toBe(true);
  });

  it("keeps GMI Q2 2026 as a non-purchasable draft", () => {
    const q2 = getMarketIntelligenceRecord("GMI-Q2-2026");

    expect(q2?.lifecycleState).toBe("DRAFT");
    expect(q2?.purchasable).toBe(false);
    expect(canPurchaseMarketIntelligenceReport(q2!)).toBe(false);
  });

  it("includes active reports in the active list", () => {
    expect(getActiveMarketIntelligenceReports().map((record) => record.id)).toContain("GMI-Q1-2026");
  });

  it("does not include draft reports in the public list", () => {
    expect(getPublicMarketIntelligenceReports().map((record) => record.id)).not.toContain("GMI-Q2-2026");
  });

  it("renders lifecycle badge labels from state", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");

    expect(getMarketIntelligenceLifecycleBadge(q1!)).toEqual({
      label: "Active until superseded",
      tone: "active",
    });
  });

  it("renders freshness labels with coverage and current decision window", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");
    const label = getMarketIntelligenceFreshnessLabel(q1!);

    expect(label).toContain("Coverage period: Q1 2026");
    expect(label).toContain("Current decision window: Q2 2026");
  });
});
