import { describe, expect, it } from "vitest";

import {
  getDimensionLabel,
  scoreReport,
  type MarketReportQualityInput,
} from "./market-intelligence-quality-gate";

const PASSING_INPUT: MarketReportQualityInput = {
  lifecycleState:                 "ACTIVE_UNTIL_SUPERSEDED",
  purchasable:                    true,
  copyDescribesAsArchived:        false,
  hasMetadata:                    true,
  hasSupersessionPlan:            true,
  hasSourceAppendix:              true,
  hasHardNumbersWithoutSource:    false,
  hasDecisionImplications:        true,
  hasBoardSummary:                true,
  hasScenarioFramework:           true,
  hasConfidencePosture:           true,
  paidEditionDifferentFromPublic: true,
  hasComplianceDisclaimer:        true,
  hasInvestmentAdviceLanguage:    false,
  deliveryRouteVerified:          true,
  freshnessMetadataComplete:      true,
  hasPriorQuarterCalls:           false, // first report — no prior calls
  priorQuarterCallsReviewed:      false, // N/A for first report
};

describe("scoreReport — passing report", () => {
  it("scores 10.0 overall for a fully compliant report", () => {
    const result = scoreReport(PASSING_INPUT);
    expect(result.overallScore).toBe(10);
  });

  it("is release-ready with no critical failures", () => {
    const result = scoreReport(PASSING_INPUT);
    expect(result.releaseReady).toBe(true);
    expect(result.criticalFailures).toHaveLength(0);
    expect(result.blockers).toHaveLength(0);
  });

  it("returns all 10 dimension scores", () => {
    const result = scoreReport(PASSING_INPUT);
    expect(result.scores).toHaveLength(10);
  });

  it("has no dimension below 8.0", () => {
    const result = scoreReport(PASSING_INPUT);
    for (const s of result.scores) {
      expect(s.score).toBeGreaterThanOrEqual(8.0);
    }
  });
});

describe("scoreReport — critical failure: PURCHASABLE_DRAFT", () => {
  it("flags draft as critical failure and blocks release", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      lifecycleState: "DRAFT",
      purchasable: true,
    });
    expect(result.criticalFailures).toContain("PURCHASABLE_DRAFT");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: ACTIVE_ARCHIVED_BY_COPY", () => {
  it("flags copy contradiction as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      copyDescribesAsArchived: true,
    });
    expect(result.criticalFailures).toContain("ACTIVE_ARCHIVED_BY_COPY");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: HARD_NUMBERS_NO_SOURCE", () => {
  it("flags sourcing gap as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasHardNumbersWithoutSource: true,
    });
    expect(result.criticalFailures).toContain("HARD_NUMBERS_NO_SOURCE");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: INVESTMENT_ADVICE_LANGUAGE", () => {
  it("flags investment advice language as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasInvestmentAdviceLanguage: true,
    });
    expect(result.criticalFailures).toContain("INVESTMENT_ADVICE_LANGUAGE");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: PAID_SAME_AS_PUBLIC", () => {
  it("flags undifferentiated editions as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      paidEditionDifferentFromPublic: false,
    });
    expect(result.criticalFailures).toContain("PAID_SAME_AS_PUBLIC");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: MISSING_LIFECYCLE_METADATA", () => {
  it("flags missing metadata as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasMetadata: false,
    });
    expect(result.criticalFailures).toContain("MISSING_LIFECYCLE_METADATA");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — critical failure: MISSING_SUPERSESSION_PLAN", () => {
  it("flags missing supersession plan as critical failure", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasSupersessionPlan: false,
    });
    expect(result.criticalFailures).toContain("MISSING_SUPERSESSION_PLAN");
    expect(result.releaseReady).toBe(false);
  });
});

describe("scoreReport — dimension scoring", () => {
  it("scores LIFECYCLE_CORRECTNESS 0 when active report is not purchasable", () => {
    const result = scoreReport({ ...PASSING_INPUT, purchasable: false });
    const dim = result.scores.find(
      (s) => s.dimension === "LIFECYCLE_CORRECTNESS",
    );
    expect(dim?.score).toBe(0);
  });

  it("scores SOURCE_TRACEABILITY 0 when hard numbers lack source", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasHardNumbersWithoutSource: true,
    });
    const dim = result.scores.find(
      (s) => s.dimension === "SOURCE_TRACEABILITY",
    );
    expect(dim?.score).toBe(0);
  });

  it("scores PAID_PUBLIC_SEPARATION 0 when editions are the same", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      paidEditionDifferentFromPublic: false,
    });
    const dim = result.scores.find(
      (s) => s.dimension === "PAID_PUBLIC_SEPARATION",
    );
    expect(dim?.score).toBe(0);
  });

  it("scores COMPLIANCE_BOUNDARY 0 for investment advice language", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasInvestmentAdviceLanguage: true,
    });
    const dim = result.scores.find(
      (s) => s.dimension === "COMPLIANCE_BOUNDARY",
    );
    expect(dim?.score).toBe(0);
  });
});

describe("scoreReport — overall gating", () => {
  it("is not release-ready if overall < 9.0", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasDecisionImplications: false,
      hasBoardSummary: false,
      hasScenarioFramework: false,
      hasConfidencePosture: false,
      hasSourceAppendix: false,
      freshnessMetadataComplete: false,
    });
    expect(result.overallScore).toBeLessThan(9.0);
    expect(result.releaseReady).toBe(false);
  });

  it("blockers list is non-empty when release is blocked", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasSupersessionPlan: false,
    });
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});

describe("getDimensionLabel", () => {
  it("returns a readable label for every dimension", () => {
    const result = scoreReport(PASSING_INPUT);
    for (const s of result.scores) {
      const label = getDimensionLabel(s.dimension);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Prior quarter call review gate
// ─────────────────────────────────────────────────────────────────────────────

describe("scoreReport — critical failure: PRIOR_QUARTER_CALLS_UNREVIEWED", () => {
  it("Q1 report passes because it has no prior quarter calls", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasPriorQuarterCalls: false,
      priorQuarterCallsReviewed: false,
    });
    expect(result.criticalFailures).not.toContain("PRIOR_QUARTER_CALLS_UNREVIEWED");
    expect(result.releaseReady).toBe(true);
  });

  it("Q2 report fails when Q1 calls are unreviewed", () => {
    const q2Input: MarketReportQualityInput = {
      ...PASSING_INPUT,
      hasPriorQuarterCalls: true,
      priorQuarterCallsReviewed: false,
    };
    const result = scoreReport(q2Input);
    expect(result.criticalFailures).toContain("PRIOR_QUARTER_CALLS_UNREVIEWED");
    expect(result.releaseReady).toBe(false);
  });

  it("Q2 report can pass once prior calls are reviewed", () => {
    const q2InputReviewed: MarketReportQualityInput = {
      ...PASSING_INPUT,
      hasPriorQuarterCalls: true,
      priorQuarterCallsReviewed: true,
    };
    const result = scoreReport(q2InputReviewed);
    expect(result.criticalFailures).not.toContain("PRIOR_QUARTER_CALLS_UNREVIEWED");
    expect(result.releaseReady).toBe(true);
  });

  it("unreviewed prior calls appear in blockers list", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasPriorQuarterCalls: true,
      priorQuarterCallsReviewed: false,
    });
    expect(
      result.blockers.some((b) => b.includes("PRIOR_QUARTER_CALLS_UNREVIEWED")),
    ).toBe(true);
  });

  it("having prior calls but reviewing them does not lower LIFECYCLE_CORRECTNESS score", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasPriorQuarterCalls: true,
      priorQuarterCallsReviewed: true,
    });
    const dim = result.scores.find(
      (s) => s.dimension === "LIFECYCLE_CORRECTNESS",
    );
    expect(dim?.score).toBe(10);
  });

  it("unreviewed prior calls reduce LIFECYCLE_CORRECTNESS to 8", () => {
    const result = scoreReport({
      ...PASSING_INPUT,
      hasPriorQuarterCalls: true,
      priorQuarterCallsReviewed: false,
    });
    const dim = result.scores.find(
      (s) => s.dimension === "LIFECYCLE_CORRECTNESS",
    );
    expect(dim?.score).toBe(8);
  });
});
