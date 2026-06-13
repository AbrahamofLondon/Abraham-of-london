/**
 * lib/validation/frozen-scenario-sets-v2.ts
 *
 * Frozen scenario sets for v2 revalidation.
 *
 * Scenarios are frozen BEFORE product testing begins.
 * Scenarios cannot change during product improvement or scorer changes.
 * If scenarios change, prior validation results are invalidated.
 */

import crypto from "crypto";

export interface ScenarioDefinition {
  scenarioId: string;
  version: string;
  input: Record<string, any>;
  expectedOutputDimensions: string[];
  description: string;
  createdAt: string;
  frozenAt: string;
}

export interface FrozenScenarioSet {
  scenarioSetId: string;
  productCode: string;
  version: string;
  frozenAt: string;
  scenarioCount: number;
  scenarios: ScenarioDefinition[];
  setHash: string;
  scenarioHashes: Record<string, string>;
  frozenReason: string;
  cannotChangeDuring: string[];
}

/**
 * fast_diagnostic v2 scenario set
 */
export const FAST_DIAGNOSTIC_V2_SCENARIO_SET: FrozenScenarioSet = {
  scenarioSetId: "fast_diagnostic_v2_scenario_set",
  productCode: "fast_diagnostic",
  version: "v2",
  frozenAt: new Date().toISOString(),
  scenarioCount: 2,
  scenarios: [
    {
      scenarioId: "fast_diagnostic_career_pressure_v2",
      version: "v2",
      description: "Decision maker faces career advancement (high salary, capped growth) vs startup equity (lower salary, unlimited upside)",
      input: {
        situation: "Career advancement decision",
        currentRole: "Senior manager at established firm",
        currentSalary: 110000,
        currentGrowthCeiling: 120000,
        opportunityRole: "Co-founder role",
        opportunitySalary: 100000,
        opportunityEquityPercent: 5,
        timeToDecision: "48 hours",
        familyDependents: 2,
        riskTolerance: "moderate"
      },
      expectedOutputDimensions: [
        "tradeOffSharpness",
        "consequenceSpecificity",
        "falsificationStrength",
        "assumptionSpecificity",
        "accountabilityStrength",
        "actionPressure",
        "reusableValue"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    },
    {
      scenarioId: "fast_diagnostic_partnership_decision_v2",
      version: "v2",
      description: "Partnership dissolution decision under time pressure with custody and asset implications",
      input: {
        situation: "Partnership dissolution decision",
        relationshipStatus: "married 8 years",
        childrenCount: 1,
        jointAssets: 500000,
        legalAdvice: "inconclusive",
        timeToDecision: "14 days",
        attemptedReconciliation: true,
        reconciliationOutcome: "unsuccessful",
        newPartnerRelationship: "possible but unformed"
      },
      expectedOutputDimensions: [
        "tradeOffSharpness",
        "consequenceSpecificity",
        "falsificationStrength",
        "assumptionSpecificity",
        "accountabilityStrength",
        "nonGenericity",
        "actionPressure"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    }
  ],
  setHash: "", // Will be computed
  scenarioHashes: {}, // Will be computed
  frozenReason: "v2 evidence baseline for fast_diagnostic revalidation",
  cannotChangeDuring: [
    "product_improvement",
    "scorer_changes",
    "benchmark_logic_changes"
  ]
};

/**
 * team_assessment v2 scenario set
 */
export const TEAM_ASSESSMENT_V2_SCENARIO_SET: FrozenScenarioSet = {
  scenarioSetId: "team_assessment_v2_scenario_set",
  productCode: "team_assessment",
  version: "v2",
  frozenAt: new Date().toISOString(),
  scenarioCount: 2,
  scenarios: [
    {
      scenarioId: "team_assessment_cross_functional_v2",
      version: "v2",
      description: "Cross-functional team (engineering, product, sales) alignment on new market entry strategy",
      input: {
        teamComposition: ["engineering_lead", "product_manager", "sales_director"],
        teamSize: 12,
        decisionType: "strategic_market_entry",
        targetMarket: "enterprise_saas",
        investmentRequired: 2000000,
        timeToMarket: "6 months",
        internalConflict: "sales_vs_engineering_timeline",
        conflictIntensity: "moderate"
      },
      expectedOutputDimensions: [
        "groupDecisionQuality",
        "dissent_handling",
        "assumptionSpecificity",
        "consequenceSpecificity",
        "actionPressure",
        "team_alignment_measurement"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    },
    {
      scenarioId: "team_assessment_conflict_resolution_v2",
      version: "v2",
      description: "Team decision-making with internal conflict on resource allocation",
      input: {
        teamComposition: ["product_manager", "ops_manager", "customer_success_manager"],
        teamSize: 8,
        decisionType: "resource_allocation",
        budgetConstraint: 500000,
        competingInitiatives: 3,
        stakeholder_pressure: true,
        timeToDecision: "30 days",
        conflictHistory: "ongoing"
      },
      expectedOutputDimensions: [
        "groupDecisionQuality",
        "dissent_handling",
        "tradeOffSharpness",
        "consequenceSpecificity",
        "actionPressure",
        "team_alignment_measurement"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    }
  ],
  setHash: "", // Will be computed
  scenarioHashes: {}, // Will be computed
  frozenReason: "v2 evidence baseline for team_assessment revalidation",
  cannotChangeDuring: [
    "product_improvement",
    "scorer_changes",
    "benchmark_logic_changes"
  ]
};

/**
 * enterprise_assessment v2 scenario set
 */
export const ENTERPRISE_ASSESSMENT_V2_SCENARIO_SET: FrozenScenarioSet = {
  scenarioSetId: "enterprise_assessment_v2_scenario_set",
  productCode: "enterprise_assessment",
  version: "v2",
  frozenAt: new Date().toISOString(),
  scenarioCount: 2,
  scenarios: [
    {
      scenarioId: "enterprise_assessment_strategic_pivot_v2",
      version: "v2",
      description: "Enterprise-scale strategic pivot decision with board implications",
      input: {
        organisationSize: "500+ employees",
        currentMarket: "b2b_services",
        proposedMarket: "b2b_software",
        revenueAtRisk: 50000000,
        investmentRequired: 25000000,
        executionTimeline: "18 months",
        boardApprovalRequired: true,
        competitiveThreats: "increasing",
        internalCapability: "partial"
      },
      expectedOutputDimensions: [
        "strategicClarity",
        "riskAssessment",
        "consequenceSpecificity",
        "assumptionSpecificity",
        "falsificationStrength",
        "executionReadiness",
        "boardLevelJustification"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    },
    {
      scenarioId: "enterprise_assessment_acquisition_decision_v2",
      version: "v2",
      description: "Enterprise acquisition decision evaluation at scale",
      input: {
        targetAcquisition: "series_b_startup",
        targetValuation: 200000000,
        strategicFit: "adjacent_market",
        customerSynergy: "high",
        technicalSynergy: "moderate",
        integrationComplexity: "high",
        boardAlignment: "partial",
        regulatoryApproval: "required"
      },
      expectedOutputDimensions: [
        "strategicClarity",
        "riskAssessment",
        "consequenceSpecificity",
        "assumptionSpecificity",
        "falsificationStrength",
        "integrationReadiness",
        "boardLevelJustification"
      ],
      createdAt: "2026-06-01T00:00:00Z",
      frozenAt: new Date().toISOString()
    }
  ],
  setHash: "", // Will be computed
  scenarioHashes: {}, // Will be computed
  frozenReason: "v2 evidence baseline for enterprise_assessment revalidation",
  cannotChangeDuring: [
    "product_improvement",
    "scorer_changes",
    "benchmark_logic_changes"
  ]
};

/**
 * Compute scenario hashes
 */
export function computeScenarioHash(scenario: ScenarioDefinition): string {
  const content = JSON.stringify(scenario, Object.keys(scenario).sort());
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Compute scenario set hash
 */
export function computeScenarioSetHash(scenarioSet: FrozenScenarioSet): string {
  const scenarioHashes: Record<string, string> = {};
  scenarioSet.scenarios.forEach((scenario) => {
    scenarioHashes[scenario.scenarioId] = computeScenarioHash(scenario);
  });

  const setContent = JSON.stringify(
    {
      setId: scenarioSet.scenarioSetId,
      productCode: scenarioSet.productCode,
      version: scenarioSet.version,
      scenarioCount: scenarioSet.scenarioCount,
      scenarioHashes
    },
    Object.keys(scenarioSet).sort()
  );

  return crypto.createHash("sha256").update(setContent).digest("hex");
}

/**
 * Freeze a scenario set (compute hashes)
 */
export function freezeScenarioSet(
  scenarioSet: FrozenScenarioSet
): FrozenScenarioSet {
  const scenarioHashes: Record<string, string> = {};

  scenarioSet.scenarios.forEach((scenario) => {
    scenarioHashes[scenario.scenarioId] = computeScenarioHash(scenario);
  });

  const setHash = computeScenarioSetHash(scenarioSet);

  return {
    ...scenarioSet,
    scenarioHashes,
    setHash
  };
}

export default {
  FAST_DIAGNOSTIC_V2_SCENARIO_SET,
  TEAM_ASSESSMENT_V2_SCENARIO_SET,
  ENTERPRISE_ASSESSMENT_V2_SCENARIO_SET,
  computeScenarioHash,
  computeScenarioSetHash,
  freezeScenarioSet
};
