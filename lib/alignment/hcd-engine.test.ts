// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  calculateHCDelta,
  aggregateHCDMetrics,
  calculateHCDContagion,
  generateHCDBriefingSection,
  getHCDStatusColor,
  getHCDRiskColor,
  SAMPLE_HCD_METRICS,
  type HCDMetrics,
} from "./hcd-engine-calculations";

describe("HCD ENGINE: HUMAN CAPITAL DELTA AUDIT", () => {
  describe("core calculation integrity", () => {
    it("should calculate positive delta for overload correctly", () => {
      const results = calculateHCDelta([
        {
          label: "ENGINEERING_VELOCITY",
          potential: 80,
          extraction: 95,
          wellbeing: 50,
        },
      ]);

      expect(results[0].delta).toBe(15);
      expect(results[0].utilizationEfficiency).toBeCloseTo(118.8, 0);
    });

    it("should calculate negative delta for underutilization correctly", () => {
      const results = calculateHCDelta([
        {
          label: "ROLE_VACANCY",
          potential: 90,
          extraction: 60,
          wellbeing: 75,
        },
      ]);

      expect(results[0].delta).toBe(-30);
      expect(results[0].utilizationEfficiency).toBeCloseTo(66.7, 0);
    });

    it("should keep burnout index within 0..100", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 100,
          extraction: 140,
          wellbeing: 0,
        },
      ]);

      expect(results[0].burnoutIndex).toBeGreaterThanOrEqual(0);
      expect(results[0].burnoutIndex).toBeLessThanOrEqual(100);
    });

    it("should keep fragility index within 0..100", () => {
      const results = calculateHCDelta([
        {
          label: "TALENT_ATTRITION",
          potential: 100,
          extraction: 140,
          wellbeing: 0,
          headcount: 1,
          tenure: 0,
          openRoles: 100,
        },
      ]);

      expect(results[0].fragilityIndex).toBeGreaterThanOrEqual(0);
      expect(results[0].fragilityIndex).toBeLessThanOrEqual(100);
    });

    it("should sanitize poisoned inputs safely", () => {
      const results = calculateHCDelta([
        {
          label: null as unknown as string,
          potential: "bad" as unknown as number,
          extraction: undefined as unknown as number,
          wellbeing: "20" as unknown as number,
          headcount: -5 as unknown as number,
          tenure: "abc" as unknown as number,
          openRoles: -2 as unknown as number,
        },
      ]);

      expect(results[0].label).toBe("UNSPECIFIED_DOMAIN");
      expect(results[0].potential).toBe(0);
      expect(results[0].extraction).toBe(0);
      expect(results[0].wellbeing).toBe(20);
      expect(results[0].headcount).toBe(1);
      expect(results[0].openRoles).toBe(0);
    });
  });

  describe("risk classification", () => {
    it("should classify collapsing domains as CRITICAL", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 85,
          extraction: 120,
          wellbeing: 20,
          headcount: 4,
          tenure: 24,
          openRoles: 2,
        },
      ]);

      expect(results[0].attritionRisk).toBe("CRITICAL");
      expect(results[0].healthStatus).toBe("COLLAPSING");
    });

    it("should classify healthy domains as LOW / OPTIMAL", () => {
      const results = calculateHCDelta([
        {
          label: "ROLE_VACANCY",
          potential: 90,
          extraction: 60,
          wellbeing: 88,
          headcount: 10,
          tenure: 30,
          openRoles: 0,
        },
      ]);

      expect(results[0].attritionRisk).toBe("LOW");
      expect(results[0].healthStatus).toBe("OPTIMAL");
    });

    it("should produce replacement cost greater than zero for viable domains", () => {
      const results = calculateHCDelta([
        {
          label: "ENGINEERING_VELOCITY",
          potential: 90,
          extraction: 85,
          wellbeing: 60,
          headcount: 12,
          tenure: 18,
          openRoles: 1,
        },
      ]);

      expect(results[0].replacementCost).toBeGreaterThan(0);
    });

    it("should include overload guidance when delta is positive and high", () => {
      const results = calculateHCDelta([
        {
          label: "ENGINEERING_VELOCITY",
          potential: 70,
          extraction: 100,
          wellbeing: 45,
          headcount: 8,
          tenure: 12,
          openRoles: 1,
        },
      ]);

      expect(
        results[0].recommendations.some((r) =>
          r.toLowerCase().includes("over-extraction")
        )
      ).toBe(true);
    });

    it("should include latent capacity guidance when delta is strongly negative", () => {
      const results = calculateHCDelta([
        {
          label: "ROLE_VACANCY",
          potential: 95,
          extraction: 60,
          wellbeing: 82,
          headcount: 15,
          tenure: 24,
          openRoles: 0,
        },
      ]);

      expect(
        results[0].recommendations.some((r) =>
          r.toLowerCase().includes("latent capacity")
        )
      ).toBe(true);
    });
  });

  describe("aggregate scoring", () => {
    it("should aggregate burnout, fragility, and total replacement cost correctly", () => {
      const results = calculateHCDelta(SAMPLE_HCD_METRICS);
      const aggregate = aggregateHCDMetrics(results);

      expect(aggregate.overallBurnoutIndex).toBeGreaterThan(0);
      expect(aggregate.overallFragilityIndex).toBeGreaterThan(0);
      expect(aggregate.totalReplacementCost).toBeGreaterThan(0);
      expect(aggregate.averageUtilization).toBeGreaterThan(0);
    });

    it("should classify aggregate risk as CRITICAL when at least one critical domain exists", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 80,
          extraction: 130,
          wellbeing: 15,
          headcount: 3,
          tenure: 24,
          openRoles: 1,
        },
        {
          label: "ROLE_VACANCY",
          potential: 90,
          extraction: 50,
          wellbeing: 85,
          headcount: 10,
          tenure: 24,
          openRoles: 0,
        },
      ]);

      const aggregate = aggregateHCDMetrics(results);
      expect(aggregate.riskScore).toBe("CRITICAL");
      expect(aggregate.criticalDomains).toContain("LEADERSHIP_EXHAUSTION");
    });

    it("should detect overloaded and underutilized domains separately", () => {
      const results = calculateHCDelta([
        {
          label: "ENGINEERING_VELOCITY",
          potential: 80,
          extraction: 100,
          wellbeing: 50,
        },
        {
          label: "ROLE_VACANCY",
          potential: 90,
          extraction: 60,
          wellbeing: 80,
        },
      ]);

      const aggregate = aggregateHCDMetrics(results);

      expect(aggregate.overloadedDomains).toContain("ENGINEERING_VELOCITY");
      expect(aggregate.underutilizedDomains).toContain("ROLE_VACANCY");
    });

    it("should return a safe empty aggregate when no results are provided", () => {
      const aggregate = aggregateHCDMetrics([]);

      expect(aggregate).toEqual({
        overallBurnoutIndex: 0,
        overallFragilityIndex: 0,
        criticalDomains: [],
        elevatedDomains: [],
        stableDomains: [],
        totalReplacementCost: 0,
        averageUtilization: 0,
        overloadedDomains: [],
        underutilizedDomains: [],
        riskScore: "LOW",
      });
    });
  });

  describe("contagion logic", () => {
    it("should calculate contagion only for requested target domains", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 80,
          extraction: 120,
          wellbeing: 25,
          headcount: 3,
          tenure: 24,
        },
      ]);

      const contagion = calculateHCDContagion(results, [
        "TRUST_INDEX",
        "OPERATIONAL_CLARITY",
      ]);

      expect(contagion.length).toBeGreaterThan(0);
      expect(contagion.every((c) => ["TRUST_INDEX", "OPERATIONAL_CLARITY"].includes(c.target))).toBe(true);
    });

    it("should rank higher contagion impacts first", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 80,
          extraction: 120,
          wellbeing: 25,
        },
      ]);

      const contagion = calculateHCDContagion(results, [
        "TRUST_INDEX",
        "OPERATIONAL_CLARITY",
        "STRATEGIC_INTENT",
      ]);

      for (let i = 1; i < contagion.length; i++) {
        expect(contagion[i - 1].impact).toBeGreaterThanOrEqual(contagion[i].impact);
      }
    });

    it("should assign HIGH severity to strong contagion links", () => {
      const results = calculateHCDelta([
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 85,
          extraction: 130,
          wellbeing: 10,
          headcount: 4,
          tenure: 18,
        },
      ]);

      const contagion = calculateHCDContagion(results, ["TRUST_INDEX"]);
      expect(contagion[0].severity).toBe("HIGH");
    });
  });

  describe("briefing generation", () => {
    it("should generate an executive-readable HCD briefing", () => {
      const results = calculateHCDelta(SAMPLE_HCD_METRICS);
      const aggregate = aggregateHCDMetrics(results);
      const briefing = generateHCDBriefingSection(results, aggregate);

      expect(typeof briefing.summary).toBe("string");
      expect(briefing.summary.length).toBeGreaterThan(20);
      expect(Array.isArray(briefing.keyRisks)).toBe(true);
      expect(Array.isArray(briefing.recommendations)).toBe(true);
      expect(briefing.financialImpact).toContain("$");
    });

    it("should reference highest fragility domain in recommendations where available", () => {
      const metrics: HCDMetrics[] = [
        {
          label: "LEADERSHIP_EXHAUSTION",
          potential: 80,
          extraction: 125,
          wellbeing: 15,
          headcount: 4,
          tenure: 18,
          openRoles: 1,
        },
        {
          label: "ROLE_VACANCY",
          potential: 95,
          extraction: 70,
          wellbeing: 70,
          headcount: 12,
          tenure: 24,
          openRoles: 0,
        },
      ];

      const results = calculateHCDelta(metrics);
      const aggregate = aggregateHCDMetrics(results);
      const briefing = generateHCDBriefingSection(results, aggregate);

      expect(
        briefing.recommendations.some((r) =>
          r.includes("LEADERSHIP_EXHAUSTION")
        )
      ).toBe(true);
    });
  });

  describe("UI status helpers", () => {
    it("should return stable class values for health status", () => {
      expect(getHCDStatusColor("OPTIMAL")).toContain("text-green-600");
      expect(getHCDStatusColor("STRAINED")).toContain("text-amber-600");
      expect(getHCDStatusColor("FRAGILE")).toContain("text-orange-600");
      expect(getHCDStatusColor("COLLAPSING")).toContain("text-red-600");
    });

    it("should return stable class values for aggregate risk", () => {
      expect(getHCDRiskColor("LOW")).toContain("text-green-600");
      expect(getHCDRiskColor("MEDIUM")).toContain("text-amber-600");
      expect(getHCDRiskColor("HIGH")).toContain("text-orange-600");
      expect(getHCDRiskColor("CRITICAL")).toContain("text-red-600");
    });
  });
});