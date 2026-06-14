/**
 * Strategic Twin Simulation Engine
 *
 * Runs bounded predictive simulations that learn from:
 * - Decision Debt Ledger
 * - Consequence Verification history
 * - Falsification Registry
 * - Product Moat Capability rules
 *
 * Never claims certainty. Always discloses limits.
 * Never grants authority. Always preserves positive authority = 0.
 */

import { EstateProductCode, isEstateProductCode } from "../product-moat/estate-product-registry";
import type { StrategicTwinState } from "./strategic-twin-contract";
import type { StrategicTwinSimulation, CounterfactualScenarioComparison, ProbabilityBand, SimulationConfidence } from "./strategic-twin-simulation-contract";
import decisionDebtLedger from "../decision-debt/decision-debt-ledger";

export interface SimulationRequest {
  caseId: string;
  productCode: string;
  twinState: StrategicTwinState;
  memoryEvents: any[];
  horizonDays?: number;
}

export class StrategicTwinSimulationEngine {
  /**
   * Run simulation for a single scenario
   */
  runSimulation(
    request: SimulationRequest,
    scenario: string
  ): StrategicTwinSimulation {
    const productCode = request.productCode as EstateProductCode;
    const now = new Date().toISOString();

    // Load decision debt for this case
    const debtRecords = decisionDebtLedger.getDecisionDebtByCase(request.caseId);
    const debtSummary = decisionDebtLedger.summariseDecisionDebt(request.caseId);

    // Determine recurrence risk band
    const recurrenceCount = request.twinState?.repeatedPatterns?.length || 0;
    const recurrenceRiskBand = this.calculateRecurrenceRiskBand(
      recurrenceCount,
      debtRecords.length
    );

    // Determine debt movement direction
    const debtMovement = this.determineDebtMovement(
      debtRecords,
      request.twinState
    );

    // Evaluate evidence gaps
    const evidenceGaps = this.identifyEvidenceGaps(
      request.memoryEvents,
      request.twinState
    );

    // Build simulation basis
    const evidenceBasis = this.extractEvidenceBasis(
      request.memoryEvents,
      debtRecords
    );

    // Determine confidence
    const { confidence, basis: confidenceBasis } = this.assessConfidence(
      debtRecords,
      evidenceGaps,
      request.twinState,
      scenario
    );

    // Determine limitations
    const limitations = this.buildLimitationsStatement(
      evidenceGaps,
      debtSummary,
      recurrenceCount
    );

    // Recommended move
    const { move, basis: moveBasis, unsuitable } = this.determineRecommendedMove(
      scenario,
      debtMovement,
      recurrenceRiskBand,
      request.twinState,
      productCode,
      request.caseId
    );

    const simulationId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      simulationId,
      caseId: request.caseId,
      productCode,
      simulatedAt: now,
      horizonDays: request.horizonDays || 30,
      scenario: scenario as any,

      recurrenceRiskBand,
      decisionDebtMovement: debtMovement,

      expectedConsequencePath: this.buildConsequencePath(
        scenario,
        debtMovement,
        recurrenceRiskBand
      ),
      evidenceBasis,
      activeEvidenceGaps: evidenceGaps,
      contradictionKeys: request.twinState?.dominantContradictions || [],

      debtRecordIds: debtRecords.map((d) => d.debtId),
      verificationTargetIds: [],
      falsificationIds: [],

      confidence,
      confidenceBasis: confidenceBasis,
      limitations,

      recommendedMove: move,
      recommendedMoveBasis: moveBasis,
      unsuitableMoves: unsuitable,

      authorityBoundary: {
        positiveAuthorityGranted: false,
        authorityRestorationPerformed: false,
        simulationGrantsAuthority: false,
        requiresHumanDecision: true,
      },
    };
  }

  /**
   * Run all scenarios and compare
   */
  compareScenarios(
    request: SimulationRequest,
    scenarios: string[] = [
      "no_action",
      "evidence_deepening",
      "governance_intervention",
      "execution_review",
    ]
  ): CounterfactualScenarioComparison {
    const simulations = scenarios.map((scenario) =>
      this.runSimulation(request, scenario)
    );

    const { preferred, reason, basis } = this.selectPreferredScenario(
      simulations,
      request
    );

    const noActionSim = simulations.find((s) => s.scenario === "no_action");
    const firstSim = simulations[0];
    const evidenceNeeded = firstSim
      ? this.identifyEvidenceForConfidenceBoost(firstSim)
      : [];

    return {
      caseId: request.caseId,
      comparedAt: new Date().toISOString(),
      horizonDays: request.horizonDays || 30,

      scenarios: simulations,
      preferredScenario: preferred,
      preferredScenarioReason: reason,
      preferredScenarioBasis: basis,

      noActionRiskSummary: noActionSim ? this.summarizeNoActionRisk(noActionSim) : "No action scenario not available",
      evidenceNeededBeforeHigherConfidence: evidenceNeeded,

      authorityBoundary: {
        comparisonGrantsAuthority: false,
        requiresHumanDecision: true,
      },
    };
  }

  /**
   * Calculate recurrence risk band from pattern history
   */
  private calculateRecurrenceRiskBand(
    patternCount: number,
    debtCount: number
  ): ProbabilityBand {
    if (patternCount === 0 && debtCount === 0) {
      return "not_enough_evidence";
    }

    if (patternCount >= 3) {
      return "high";
    }

    if (patternCount === 2) {
      return "medium";
    }

    if (patternCount === 1 && debtCount > 0) {
      return "medium";
    }

    return "low";
  }

  /**
   * Determine debt movement direction
   */
  private determineDebtMovement(
    debtRecords: any[],
    twinState: StrategicTwinState
  ): "unknown" | "likely_reduced" | "likely_flat" | "likely_increased" {
    if (debtRecords.length === 0) {
      return "unknown";
    }

    const criticalCount = debtRecords.filter(
      (d) => d.operationalSeverity === "critical"
    ).length;

    if (criticalCount > 0 && !twinState?.currentInterventionReadiness) {
      return "likely_increased";
    }

    if (twinState?.currentInterventionReadiness && criticalCount > 0) {
      return "likely_reduced";
    }

    return "likely_flat";
  }

  /**
   * Identify active evidence gaps
   */
  private identifyEvidenceGaps(memoryEvents: any[], twinState: StrategicTwinState): string[] {
    const gaps: string[] = [];

    if (!twinState?.subjectType) {
      gaps.push("Subject type not determined");
    }

    if (!twinState?.currentDecisionPressure) {
      gaps.push("Decision pressure level unknown");
    }

    if (!memoryEvents || memoryEvents.length < 3) {
      gaps.push("Insufficient memory events for pattern confidence");
    }

    const eventGapCount = memoryEvents?.reduce(
      (sum: number, e: any) => sum + (e.evidenceGapKeys?.length || 0),
      0
    ) || 0;

    if (eventGapCount > 0) {
      gaps.push(`${eventGapCount} specific evidence gaps in memory events`);
    }

    return gaps;
  }

  /**
   * Extract evidence basis from memory and debt
   */
  private extractEvidenceBasis(memoryEvents: any[], debtRecords: any[]): string[] {
    const basis: string[] = [];

    if (debtRecords.length > 0) {
      debtRecords.forEach((d) => {
        d.calculationBasis?.forEach((b: string) => {
          basis.push(`Debt: ${b}`);
        });
      });
    }

    if (memoryEvents && memoryEvents.length > 0) {
      memoryEvents.slice(0, 3).forEach((e: any) => {
        if (e.summary) {
          basis.push(`Memory: ${e.summary}`);
        }
      });
    }

    return basis.length > 0 ? basis : ["Minimal evidence basis"];
  }

  /**
   * Assess confidence in simulation
   */
  private assessConfidence(
    debtRecords: any[],
    evidenceGaps: string[],
    twinState: StrategicTwinState,
    scenario: string
  ): { confidence: SimulationConfidence; basis: string[] } {
    const basis: string[] = [];

    // Start high, reduce by gaps
    let confidence: SimulationConfidence = "medium";

    if (evidenceGaps.length > 3) {
      confidence = "low";
      basis.push("Multiple evidence gaps reduce confidence");
    }

    if (debtRecords.some((d) => d.confidence === "low")) {
      confidence = "low";
      basis.push("Underlying decision debt has low confidence");
    }

    if (debtRecords.length > 5) {
      confidence = "low";
      basis.push("High debt count indicates complex unresolved state");
    }

    if (scenario === "no_action" && debtRecords.length > 0) {
      // No-action with unresolved debt is inherently uncertain
      confidence = "low";
      basis.push("No-action scenario with active decision debt is inherently uncertain");
    }

    return { confidence, basis };
  }

  /**
   * Build limitations statement
   */
  private buildLimitationsStatement(
    evidenceGaps: string[],
    debtSummary: any,
    patternCount: number
  ): string[] {
    const limitations: string[] = [
      "This simulation shows plausible consequence paths, not guaranteed outcomes",
      "Simulation is advice for human decision-making, not autonomous authority",
    ];

    if (evidenceGaps.length > 0) {
      limitations.push(`Active evidence gaps: ${evidenceGaps.join("; ")}`);
    }

    if (debtSummary?.criticalCount > 0) {
      limitations.push(
        `${debtSummary.criticalCount} critical decision debt items complicate prediction`
      );
    }

    if (patternCount === 0) {
      limitations.push("No prior pattern history; simulation is speculative");
    }

    limitations.push(
      "Falsification history not shown here; check registry for prior errors"
    );

    return limitations;
  }

  /**
   * Build consequence path description
   */
  private buildConsequencePath(
    scenario: string,
    debtMovement: string,
    riskBand: ProbabilityBand
  ): string[] {
    const path: string[] = [];

    path.push(`Scenario: ${scenario}`);

    if (scenario === "no_action") {
      if (debtMovement === "likely_increased") {
        path.push("Decision debt likely accumulates");
        path.push("Unresolved contradictions persist");
        path.push("Risk escalates");
      } else if (debtMovement === "likely_flat") {
        path.push("Situation remains unresolved");
        path.push("No mechanism for change");
        path.push("Entropy increases over time");
      } else {
        path.push("Some debt may naturally reduce");
        path.push("But core contradictions unaddressed");
        path.push("Recurrence likely");
      }
    } else if (scenario === "evidence_deepening") {
      path.push("Collect additional evidence");
      path.push("Reduce active evidence gaps");
      path.push("Prepare for higher-confidence decision");
    } else if (scenario === "governance_intervention") {
      path.push("Escalate to governance layer");
      path.push("Apply policy or precedent");
      path.push("Establish decision boundary");
    } else if (scenario === "execution_review") {
      path.push("Examine execution readiness");
      path.push("Identify capability gaps");
      path.push("Strengthen execution path");
    }

    return path;
  }

  /**
   * Determine recommended move
   */
  private determineRecommendedMove(
    scenario: string,
    debtMovement: string,
    riskBand: ProbabilityBand,
    twinState: StrategicTwinState,
    productCode: EstateProductCode,
    caseId: string
  ): { move: string; basis: string[]; unsuitable: string[] } {
    const basis: string[] = [];
    const unsuitable: string[] = [];
    let move = scenario;

    // Priority: evidence gaps
    if (riskBand === "not_enough_evidence") {
      move = "evidence_deepening";
      basis.push("Insufficient evidence for confident decision");
      unsuitable.push("board_escalation");
      return { move, basis, unsuitable };
    }

    // Priority: rising debt
    if (debtMovement === "likely_increased") {
      move = "governance_intervention";
      basis.push("Rising decision debt requires governance attention");
      unsuitable.push("no_action");
      return { move, basis, unsuitable };
    }

    // Default: match scenario
    basis.push(`Based on scenario analysis: ${scenario}`);

    return { move, basis, unsuitable };
  }

  /**
   * Select preferred scenario
   */
  private selectPreferredScenario(
    simulations: StrategicTwinSimulation[],
    request: SimulationRequest
  ): { preferred: string; reason: string; basis: string[] } {
    const debtSummary = decisionDebtLedger.summariseDecisionDebt(
      request.caseId
    );

    // If evidence gaps, prioritize deepening
    const evidenceDeepening = simulations.find((s) => s.scenario === "evidence_deepening");
    if (
      evidenceDeepening &&
      evidenceDeepening.activeEvidenceGaps.length > 0
    ) {
      return {
        preferred: "evidence_deepening",
        reason: "Active evidence gaps block higher-confidence decisions",
        basis: evidenceDeepening.activeEvidenceGaps,
      };
    }

    // If rising debt, prioritize intervention
    if (debtSummary?.criticalCount > 0) {
      return {
        preferred: "governance_intervention",
        reason: "Critical decision debt requires governance review",
        basis: [
          `${debtSummary.criticalCount} critical debt items`,
          "Governance intervention needed to establish decision boundary",
        ],
      };
    }

    // Default: execution review
    return {
      preferred: "execution_review",
      reason: "Assess execution readiness and capability alignment",
      basis: ["No urgent escalation needed", "Strengthen execution foundation"],
    };
  }

  /**
   * Summarize no-action risk
   */
  private summarizeNoActionRisk(noActionSim?: StrategicTwinSimulation): string {
    if (!noActionSim) {
      return "No-action scenario not simulated";
    }

    if (
      noActionSim.decisionDebtMovement === "likely_increased" ||
      noActionSim.recurrenceRiskBand === "high"
    ) {
      return "No-action trajectory shows escalating risk. Contradiction unresolved. Debt accumulates.";
    }

    if (noActionSim.recurrenceRiskBand === "medium") {
      return "No-action allows issue to persist. Moderate risk of recurrence without intervention.";
    }

    return "No-action scenario shows acceptable risk profile with low recurrence likelihood.";
  }

  /**
   * Identify what evidence would boost confidence
   */
  private identifyEvidenceForConfidenceBoost(
    sim: StrategicTwinSimulation
  ): string[] {
    const needed: string[] = [];

    if (sim.activeEvidenceGaps.length > 0) {
      needed.push(`Resolve: ${sim.activeEvidenceGaps[0]}`);
    }

    if (sim.verificationTargetIds.length > 0) {
      needed.push("Complete scheduled consequence verification");
    }

    if (sim.confidence === "low") {
      needed.push("Collect additional corroborating memory events");
    }

    if (sim.falsificationIds.length > 0) {
      needed.push("Review falsification history for pattern adjustment");
    }

    return needed.length > 0
      ? needed
      : [
          "Current evidence basis supports stated confidence level",
        ];
  }
}

export default new StrategicTwinSimulationEngine();
