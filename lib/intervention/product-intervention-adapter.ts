/**
 * Product Intervention Adapter
 *
 * Recommends the next product or intervention for a case.
 * Strictly respects readiness governance—blocked products cannot be recommended.
 *
 * Rule: nextBestProductCode must be release-ready or future-ready with clear boundary.
 */

import { InterventionCalibration } from "./intervention-calibration-contract";
import { StrategicTwinState } from "../strategic-twin/strategic-twin-contract";
import { DecisionMemoryEvent } from "../decision-memory/decision-memory-contract";
import { ProductReadinessStatus } from "../product/product-release-readiness";
import interventionCalibrationEngine from "./intervention-calibration-engine";

export interface ProductInterventionContext {
  productCode: string;
  caseId: string;
  twinState: StrategicTwinState | null;
  memoryEvents: DecisionMemoryEvent[];
  currentReadiness: ProductReadinessStatus;
  releaseReadyProducts: string[];
  futureReadyProducts: string[];
  blockedProducts: string[];
}

export interface ProductInterventionRecommendation
  extends InterventionCalibration {
  nextBestProductCode?: string;
  nextProductReason?: string;
  nextProductReadiness?: ProductReadinessStatus;
  blockedProductsMentioned: string[];
}

/**
 * Get intervention recommendation for a case
 */
export function getProductInterventionRecommendation(
  context: ProductInterventionContext
): ProductInterventionRecommendation {
  // Base calibration
  const calibration = interventionCalibrationEngine.calibrate(
    {
      caseId: context.caseId,
      subjectType: context.twinState?.subjectType || "individual",
      decisionPressure: context.twinState?.currentDecisionPressure || "low",
      evidenceAvailability: getEvidenceAvailability(context.memoryEvents),
      patternRecurrenceCount: countRecurrences(context.memoryEvents),
      consequenceRisk: assessConsequenceRisk(context.twinState),
      interventionReadiness:
        context.twinState?.currentInterventionReadiness || "not_ready",
    },
    context.productCode
  );

  // Determine next best product
  const nextProduct = selectNextProduct(context, calibration);

  const recommendation: ProductInterventionRecommendation = {
    ...calibration,
    nextBestProductCode: nextProduct.productCode,
    nextProductReason: nextProduct.reason,
    nextProductReadiness: nextProduct.readiness,
    blockedProductsMentioned: context.blockedProducts,
  };

  return recommendation;
}

/**
 * Select the next best product for this case
 */
function selectNextProduct(
  context: ProductInterventionContext,
  calibration: InterventionCalibration
): {
  productCode?: string;
  reason: string;
  readiness: ProductReadinessStatus;
} {
  // Intervention level determines which products are suitable
  switch (calibration.recommendedLevel) {
    case "free_signal":
      // Any release-ready product can provide signal
      if (context.releaseReadyProducts.length > 0) {
        return {
          productCode: context.releaseReadyProducts[0],
          reason: "Free signal; any release-ready product suitable",
          readiness: "release_ready_now",
        };
      }
      return {
        reason: "Signal available but no release-ready product; defer escalation",
        readiness: "blocked",
      };

    case "evidence_limited_review":
      // Evidence-limited products: market_intelligence, reporting output
      const reviewProducts = filterByProduct(
        context.releaseReadyProducts,
        ["market_intelligence_q2", "reporting_custom", "reporting_monthly"]
      );
      if (reviewProducts.length > 0) {
        return {
          productCode: reviewProducts[0],
          reason: "Evidence-limited review; recommend analytical product",
          readiness: "release_ready_now",
        };
      }
      return {
        reason: "Evidence-limited review needed but no suitable product",
        readiness: "blocked",
      };

    case "diagnostic_deepening":
      // Diagnostic: fast_diagnostic
      if (context.releaseReadyProducts.includes("fast_diagnostic")) {
        return {
          productCode: "fast_diagnostic",
          reason: "Diagnostic deepening; fast_diagnostic suitable",
          readiness: "release_ready_now",
        };
      }
      if (context.futureReadyProducts.includes("fast_diagnostic")) {
        return {
          productCode: "fast_diagnostic",
          reason: "Diagnostic deepening; fast_diagnostic future-ready",
          readiness: "future_ready_for_evidence_path",
        };
      }
      return {
        reason: "Diagnostic deepening needed but fast_diagnostic not ready",
        readiness: "blocked",
      };

    case "reporting_output":
      // Reporting: reporting_custom, reporting_monthly
      const reportProducts = filterByProduct(
        context.releaseReadyProducts,
        ["reporting_custom", "reporting_monthly"]
      );
      if (reportProducts.length > 0) {
        return {
          productCode: reportProducts[0],
          reason: "Structured reporting output; reporting product suitable",
          readiness: "release_ready_now",
        };
      }
      return {
        reason: "Reporting output recommended but no release-ready reporting product",
        readiness: "blocked",
      };

    case "execution_governance":
      // Execution: enterprise_assessment
      if (context.releaseReadyProducts.includes("enterprise_assessment")) {
        return {
          productCode: "enterprise_assessment",
          reason: "Execution governance; enterprise_assessment suitable",
          readiness: "release_ready_now",
        };
      }
      return {
        reason: "Execution governance needed but enterprise_assessment not ready",
        readiness: "blocked",
      };

    case "retainer_oversight":
    case "board_facing_draft":
      // Escalated: enterprise_assessment
      if (context.releaseReadyProducts.includes("enterprise_assessment")) {
        return {
          productCode: "enterprise_assessment",
          reason: "Strategic oversight; enterprise_assessment suitable",
          readiness: "release_ready_now",
        };
      }
      if (context.futureReadyProducts.includes("enterprise_assessment")) {
        return {
          productCode: "enterprise_assessment",
          reason: "Strategic oversight; enterprise_assessment future-ready",
          readiness: "future_ready_for_evidence_path",
        };
      }
      return {
        reason: "Strategic oversight needed but enterprise_assessment not ready",
        readiness: "blocked",
      };

    case "blocked_until_evidence":
      return {
        reason: "No intervention suitable until evidence available",
        readiness: "blocked",
      };

    default:
      return {
        reason: "No suitable product for this intervention level",
        readiness: "blocked",
      };
  }
}

/**
 * Filter products by name
 */
function filterByProduct(
  products: string[],
  names: string[]
): string[] {
  return products.filter((p) => names.some((n) => p.includes(n)));
}

/**
 * Calculate evidence availability from memory
 */
function getEvidenceAvailability(events: DecisionMemoryEvent[]): number {
  if (events.length === 0) {
    return 0;
  }

  const gapCount = events.reduce((sum, e) => sum + e.evidenceGapKeys.length, 0);
  const totalReferences = events.length * 3; // Rough estimate of expected evidence

  return Math.min(1.0, Math.max(0, 1.0 - gapCount / totalReferences));
}

/**
 * Count pattern recurrences
 */
function countRecurrences(events: DecisionMemoryEvent[]): number {
  const contradictions = new Map<string, number>();

  events.forEach((e) => {
    e.contradictionKeys.forEach((c) => {
      contradictions.set(c, (contradictions.get(c) || 0) + 1);
    });
  });

  let recurrenceCount = 0;
  contradictions.forEach((count) => {
    if (count > 1) {
      recurrenceCount++;
    }
  });

  return recurrenceCount;
}

/**
 * Assess consequence risk from twin state
 */
function assessConsequenceRisk(
  twin: StrategicTwinState | null
): "low" | "medium" | "high" | "critical" {
  if (!twin) {
    return "medium";
  }

  if (twin.currentDecisionPressure === "critical") {
    return "critical";
  }

  if (
    twin.unresolvedCommitments.length > 2 ||
    twin.repeatedPatterns.length > 0
  ) {
    return "high";
  }

  if (twin.activeEvidenceGaps.length > 1) {
    return "medium";
  }

  return "low";
}

/**
 * HARD REQUIREMENT: Never recommend blocked products
 */
export function validateRecommendationSafe(
  recommendation: ProductInterventionRecommendation,
  blockedProducts: string[]
): { safe: boolean; violation?: string } {
  if (
    recommendation.nextBestProductCode &&
    blockedProducts.includes(recommendation.nextBestProductCode)
  ) {
    return {
      safe: false,
      violation: `Cannot recommend blocked product ${recommendation.nextBestProductCode}`,
    };
  }

  return { safe: true };
}
