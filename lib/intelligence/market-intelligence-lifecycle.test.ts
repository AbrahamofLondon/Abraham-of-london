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
  it("records GMI Q1 2026 as superseded by GMI-Q2-2026 (released 2026-07-08)", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");

    expect(q1?.lifecycleState).toBe("SUPERSEDED");
    expect(q1?.supersededBy).toBe("GMI-Q2-2026");
    expect(q1?.decisionWindow).toBe("Q2 2026");
    expect(q1?.archiveVisible).toBe(true);
  });

  it("keeps superseded GMI Q1 2026 non-purchasable but historically accessible", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");

    expect(q1).not.toBeNull();
    expect(q1?.purchasable).toBe(false);
    expect(canPurchaseMarketIntelligenceReport(q1!)).toBe(false);
    expect(q1?.publicVisible).toBe(true);
  });

  it("records GMI Q2 2026 as the active, purchasable, published edition", () => {
    const q2 = getMarketIntelligenceRecord("GMI-Q2-2026");

    expect(q2?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q2?.purchasable).toBe(true);
    expect(canPurchaseMarketIntelligenceReport(q2!)).toBe(true);
    expect(q2?.publishedAt).toBe("2026-07-08");
    expect(q2?.dataLockedAt).toBeTruthy();
    expect(q2?.ownerAuthorizedAt).toBeTruthy();
    expect(q2?.version).toBe("1.0.0");
  });

  it("includes the released Q2 edition in the active list and excludes superseded Q1", () => {
    const activeIds = getActiveMarketIntelligenceReports().map((record) => record.id);
    expect(activeIds).toContain("GMI-Q2-2026");
    expect(activeIds).not.toContain("GMI-Q1-2026");
  });

  it("includes the released Q2 edition in the public list", () => {
    expect(getPublicMarketIntelligenceReports().map((record) => record.id)).toContain("GMI-Q2-2026");
  });

  it("renders lifecycle badge labels from state", () => {
    const q2 = getMarketIntelligenceRecord("GMI-Q2-2026");

    expect(getMarketIntelligenceLifecycleBadge(q2!)).toEqual({
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
