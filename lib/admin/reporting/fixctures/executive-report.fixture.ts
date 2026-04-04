/* lib/admin/reporting/fixtures/executive-report.fixture.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT FIXTURE
   Stable fixture for:
   - serializer tests
   - route contract tests
   - product demos
   - PDF rendering development
   --------------------------------------------------------------------------- */

import type { ExecutiveReport } from "../executive-report-builder";

export const EXECUTIVE_REPORT_FIXTURE: ExecutiveReport = {
  state: "MISALIGNED",
  narrative: {
    headline: "Structural Misalignment Identified",
    summary:
      "Execution remains active, but certainty is below sovereign threshold and talent pressure is compounding drag across the weakest operational domains.",
    mandate:
      "Suspend acceleration, correct the weakest domain, reduce leadership load concentration, and restore execution authority before scaling further.",
  },

  ogr: {
    integrationTax: 29.4,
    velocityMultiplier: 1.52,
    resonanceAlpha: 14.8,
    sovereignCertainty: 82.35,
    isAuthorizedToExecute: false,
  },

  resonance: {
    telemetry: {
      metrics: [
        {
          label: "OPERATIONAL_CLARITY",
          intent: 88,
          reality: 47,
          dissonance: 41,
          coverage: "HIGH",
          responseCount: 6,
        },
        {
          label: "LEADERSHIP_TRUST",
          intent: 92,
          reality: 61,
          dissonance: 31,
          coverage: "MEDIUM",
          responseCount: 4,
        },
        {
          label: "STRATEGIC_INTENT",
          intent: 95,
          reality: 74,
          dissonance: 21,
          coverage: "HIGH",
          responseCount: 5,
        },
        {
          label: "CULTURAL_COHESION",
          intent: 85,
          reality: 76,
          dissonance: 9,
          coverage: "MEDIUM",
          responseCount: 3,
        },
      ],
      averageDissonance: 25.5,
      strongestDomain: "CULTURAL_COHESION",
      weakestDomain: "OPERATIONAL_CLARITY",
      domainCount: 4,
      totalResponses: 18,
      isDisordered: false,
    },
    metrics: [
      {
        label: "OPERATIONAL_CLARITY",
        intent: 88,
        reality: 47,
        dissonance: 41,
        coverage: "HIGH",
        responseCount: 6,
      },
      {
        label: "LEADERSHIP_TRUST",
        intent: 92,
        reality: 61,
        dissonance: 31,
        coverage: "MEDIUM",
        responseCount: 4,
      },
      {
        label: "STRATEGIC_INTENT",
        intent: 95,
        reality: 74,
        dissonance: 21,
        coverage: "HIGH",
        responseCount: 5,
      },
      {
        label: "CULTURAL_COHESION",
        intent: 85,
        reality: 76,
        dissonance: 9,
        coverage: "MEDIUM",
        responseCount: 3,
      },
    ],
  },

  hcd: [
    {
      label: "LEADERSHIP_EXHAUSTION",
      potential: 95,
      extraction: 91,
      wellbeing: 43,
      headcount: 5,
      tenure: 24,
      openRoles: 0,
      delta: 4,
      attritionRisk: "ELEVATED",
      replacementCost: 124500,
      burnoutIndex: 77,
      utilizationEfficiency: 96,
      healthStatus: "FRAGILE",
      recommendations: [
        "Reduce leadership load concentration",
        "Introduce protected decision windows",
        "Stabilize executive operating cadence",
      ],
    },
    {
      label: "ENGINEERING_VELOCITY",
      potential: 100,
      extraction: 86,
      wellbeing: 58,
      headcount: 16,
      tenure: 18,
      openRoles: 2,
      delta: 14,
      attritionRisk: "STABLE",
      replacementCost: 98000,
      burnoutIndex: 73,
      utilizationEfficiency: 86,
      healthStatus: "STRAINED",
      recommendations: [
        "Rebalance delivery load",
        "Tighten dependency management",
        "Preserve capacity for core execution",
      ],
    },
    {
      label: "ROLE_VACANCY",
      potential: 88,
      extraction: 74,
      wellbeing: 66,
      headcount: 21,
      tenure: 12,
      openRoles: 3,
      delta: 14,
      attritionRisk: "STABLE",
      replacementCost: 54000,
      burnoutIndex: 62,
      utilizationEfficiency: 84,
      healthStatus: "STRAINED",
      recommendations: [
        "Prioritize critical role closure",
        "Protect strategic teams from vacancy drag",
      ],
    },
  ],

  hcdAggregate: {
    overallBurnoutIndex: 71,
    criticalDomains: [],
    elevatedDomains: ["LEADERSHIP_EXHAUSTION"],
    stableDomains: ["ENGINEERING_VELOCITY", "ROLE_VACANCY"],
    totalReplacementCost: 276500,
    averageUtilization: 89,
    riskScore: "HIGH",
  },

  financialExposure: {
    replacementCost: 276500,
    executionLoss: 38250,
    totalExposure: 314750,
  },

  priorityStack: [
    "Suspend execution — alignment not verified",
    "Correct OPERATIONAL_CLARITY (dissonance: 41%)",
    "Reduce leadership load concentration",
    "Close role vacancies in critical functions",
  ],

  failureModes: [
    "Execution Stall",
    "Capacity Saturation",
    "Leadership Signal Erosion",
    "Unauthorized Expansion",
  ],
};