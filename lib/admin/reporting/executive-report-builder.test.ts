// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildExecutiveReport } from "./executive-report-builder";

const baseResponses = [
  { domain: "STRATEGIC_INTENT", intent: 95, score: 72 },
  { domain: "STRATEGIC_INTENT", intent: 95, score: 70 },
  { domain: "OPERATIONAL_CLARITY", intent: 88, score: 45 },
  { domain: "OPERATIONAL_CLARITY", intent: 88, score: 50 },
  { domain: "LEADERSHIP_TRUST", intent: 92, score: 58 },
  { domain: "CULTURAL_COHESION", intent: 85, score: 79 },
];

const baseHcdMetrics = [
  {
    label: "ENGINEERING_VELOCITY",
    potential: 100,
    extraction: 94,
    wellbeing: 42,
    headcount: 12,
    tenure: 18,
  },
  {
    label: "LEADERSHIP_EXHAUSTION",
    potential: 90,
    extraction: 95,
    wellbeing: 35,
    headcount: 5,
    tenure: 42,
  },
  {
    label: "ROLE_VACANCY",
    potential: 95,
    extraction: 82,
    wellbeing: 71,
    headcount: 15,
    tenure: 12,
    openRoles: 3,
  },
];

describe("buildExecutiveReport", () => {
  it("builds a complete executive report object", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 78,
        marketFriction: 35,
        targetRevenue: 100,
      },
    });

    expect(report).toBeTruthy();
    expect(report.state).toBeTypeOf("string");
    expect(report.narrative).toBeTruthy();
    expect(report.ogr).toBeTruthy();
    expect(report.resonance).toBeTruthy();
    expect(report.hcd).toBeTruthy();
    expect(report.hcdAggregate).toBeTruthy();
    expect(report.financialExposure).toBeTruthy();
    expect(Array.isArray(report.priorityStack)).toBe(true);
    expect(Array.isArray(report.failureModes)).toBe(true);
  });

  it("derives resonance telemetry and keeps metrics sorted by worst dissonance first", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 78,
        marketFriction: 35,
        targetRevenue: 100,
      },
    });

    expect(report.resonance.metrics.length).toBeGreaterThan(0);
    expect(report.resonance.metrics[0].label).toBe("OPERATIONAL_CLARITY");
    expect(report.resonance.telemetry.weakestDomain).toBe("OPERATIONAL_CLARITY");
  });

  it("returns DISORDERED when average dissonance breaches threshold", () => {
    const disorderResponses = [
      { domain: "STRATEGIC_INTENT", intent: 95, score: 40 },
      { domain: "OPERATIONAL_CLARITY", intent: 90, score: 35 },
      { domain: "LEADERSHIP_TRUST", intent: 92, score: 30 },
    ];

    const report = buildExecutiveReport({
      responses: disorderResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 60,
        marketFriction: 60,
        targetRevenue: 100,
      },
    });

    expect(report.state).toBe("DISORDERED");
    expect(report.resonance.telemetry.averageDissonance).toBeGreaterThan(30);
  });

  it("returns MISALIGNED when system is not disordered but OGR is not authorized", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 80,
        marketFriction: 40,
        targetRevenue: 100,
      },
    });

    expect(report.ogr.isAuthorizedToExecute).toBe(false);
    expect(report.state).toBe("MISALIGNED");
  });

  it("returns ORDERED when dissonance is low, HCD risk is controlled, and OGR is authorized", () => {
    const orderedResponses = [
      { domain: "STRATEGIC_INTENT", intent: 90, score: 88 },
      { domain: "OPERATIONAL_CLARITY", intent: 88, score: 86 },
      { domain: "LEADERSHIP_TRUST", intent: 92, score: 90 },
      { domain: "CULTURAL_COHESION", intent: 85, score: 84 },
      { domain: "STRATEGIC_INTENT", intent: 90, score: 87 },
      { domain: "OPERATIONAL_CLARITY", intent: 88, score: 85 },
    ];

    const lowRiskHcd = [
      {
        label: "ENGINEERING_VELOCITY",
        potential: 100,
        extraction: 68,
        wellbeing: 86,
        headcount: 12,
        tenure: 18,
      },
      {
        label: "LEADERSHIP_EXHAUSTION",
        potential: 90,
        extraction: 62,
        wellbeing: 84,
        headcount: 5,
        tenure: 42,
      },
    ];

    const report = buildExecutiveReport({
      responses: orderedResponses,
      hcdMetrics: lowRiskHcd,
      ogrMetrics: {
        resonanceScore: 96,
        marketFriction: 8,
        targetRevenue: 100,
      },
    });

    expect(report.ogr.isAuthorizedToExecute).toBe(true);
    expect(report.resonance.telemetry.averageDissonance).toBeLessThanOrEqual(12);
    expect(["LOW", "MEDIUM"]).toContain(report.hcdAggregate.riskScore);
    expect(report.state).toBe("ORDERED");
  });

  it("builds financial exposure as replacement cost plus execution loss", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 78,
        marketFriction: 35,
        targetRevenue: 100,
      },
    });

    expect(report.financialExposure.replacementCost).toBe(
      report.hcdAggregate.totalReplacementCost
    );
    expect(report.financialExposure.executionLoss).toBeGreaterThanOrEqual(0);
    expect(report.financialExposure.totalExposure).toBe(
      report.financialExposure.replacementCost +
        report.financialExposure.executionLoss
    );
  });

  it("includes execution suspension priority when OGR is not authorized", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 75,
        marketFriction: 45,
        targetRevenue: 100,
      },
    });

    expect(report.priorityStack).toContain(
      "Suspend execution — alignment not verified"
    );
  });

  it("includes weakest domain correction in priority stack", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 78,
        marketFriction: 35,
        targetRevenue: 100,
      },
    });

    expect(
      report.priorityStack.some((item) =>
        item.includes("Correct OPERATIONAL_CLARITY")
      )
    ).toBe(true);
  });

  it("derives failure modes from report conditions", () => {
    const report = buildExecutiveReport({
      responses: baseResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 78,
        marketFriction: 35,
        targetRevenue: 100,
      },
    });

    expect(report.failureModes.length).toBeGreaterThan(0);
    expect(report.failureModes).toContain("Execution Stall");
    expect(report.failureModes).toContain("Unauthorized Expansion");
  });

  it("produces DISORDERED narrative when state is disordered", () => {
    const disorderResponses = [
      { domain: "STRATEGIC_INTENT", intent: 95, score: 40 },
      { domain: "OPERATIONAL_CLARITY", intent: 90, score: 35 },
      { domain: "LEADERSHIP_TRUST", intent: 92, score: 30 },
    ];

    const report = buildExecutiveReport({
      responses: disorderResponses,
      hcdMetrics: baseHcdMetrics,
      ogrMetrics: {
        resonanceScore: 60,
        marketFriction: 60,
        targetRevenue: 100,
      },
    });

    expect(report.narrative.headline).toBe("Systemic Disorder Detected");
    expect(report.narrative.mandate).toContain("Suspend acceleration");
  });

  it("produces ORDERED narrative when state is ordered", () => {
    const orderedResponses = [
      { domain: "STRATEGIC_INTENT", intent: 90, score: 88 },
      { domain: "OPERATIONAL_CLARITY", intent: 88, score: 86 },
      { domain: "LEADERSHIP_TRUST", intent: 92, score: 90 },
      { domain: "CULTURAL_COHESION", intent: 85, score: 84 },
    ];

    const lowRiskHcd = [
      {
        label: "ENGINEERING_VELOCITY",
        potential: 100,
        extraction: 68,
        wellbeing: 86,
        headcount: 12,
        tenure: 18,
      },
    ];

    const report = buildExecutiveReport({
      responses: orderedResponses,
      hcdMetrics: lowRiskHcd,
      ogrMetrics: {
        resonanceScore: 97,
        marketFriction: 5,
        targetRevenue: 100,
      },
    });

    expect(report.narrative.headline).toBe("Institutional Order Verified");
    expect(report.narrative.mandate).toContain("Proceed with controlled execution");
  });
});