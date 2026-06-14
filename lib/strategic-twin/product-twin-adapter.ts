/**
 * Product Twin Adapter
 *
 * Updates Strategic Twin state from governed memory events.
 * Strictly respects authority governance—cannot modify ProductAuthorityContract.
 *
 * Can update:
 * - Decision pressure
 * - Contradictions
 * - Evidence gaps
 * - Commitments
 * - Patterns
 * - Intervention readiness
 * - Confidence
 *
 * Cannot update:
 * - ProductAuthorityContract
 * - Release lane
 * - Release mode
 * - Authority grants
 * - Public claim permissions
 */

import { DecisionMemoryEvent } from "../decision-memory/decision-memory-contract";
import { StrategicTwinState } from "./strategic-twin-contract";
import strategicTwinUpdater from "./strategic-twin-updater";
import strategicTwinLoader from "./strategic-twin-state-loader";

export interface ProductTwinUpdateContext {
  productCode: string;
  caseId: string;
  memory: DecisionMemoryEvent;
  currentAuthority: string;
  currentReadiness: string;
}

/**
 * Update Strategic Twin from a governed memory event
 */
export function updateTwinFromMemoryEvent(
  context: ProductTwinUpdateContext
): StrategicTwinState | null {
  const twin = strategicTwinLoader.loadTwinState(context.caseId);

  if (!twin) {
    // Initialize if doesn't exist
    const initialized = strategicTwinUpdater.initializeTwin(
      context.caseId,
      context.productCode.includes("individual") ? "individual" : "team"
    );
    return initialized;
  }

  // Apply updates based on memory event type
  switch (context.memory.eventType) {
    case "intake_submitted":
      return updateFromIntake(context, twin);

    case "evidence_gap_identified":
      return updateFromEvidenceGap(context, twin);

    case "contradiction_detected":
      return updateFromContradiction(context, twin);

    case "warning_issued":
      return updateFromWarning(context, twin);

    case "decision_path_recommended":
      return updateFromRecommendation(context, twin);

    case "commitment_recorded":
      return updateFromCommitment(context, twin);

    case "pattern_deteriorated":
      return updateFromPatternDeterioration(context, twin);

    default:
      // Neutral events don't update state
      return twin;
  }
}

/**
 * Update from intake event
 */
function updateFromIntake(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  // Signal that a case has been submitted; may increase decision pressure
  const newPressure: "low" | "medium" | "high" | "critical" =
    twin.currentDecisionPressure === "critical"
      ? "critical"
      : twin.currentDecisionPressure === "high"
        ? "high"
        : "medium";

  return strategicTwinUpdater.updateDecisionPressure(
    context.caseId,
    context.productCode,
    newPressure,
    `Intake submitted by ${context.productCode}`
  );
}

/**
 * Update from evidence gap event
 */
function updateFromEvidenceGap(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  // Add evidence gaps identified in memory
  const newGaps = context.memory.evidenceGapKeys.filter(
    (g) => !twin.activeEvidenceGaps.includes(g)
  );

  if (newGaps.length === 0) {
    return twin;
  }

  return strategicTwinUpdater.applyUpdate({
    caseId: context.caseId,
    updatingProductCode: context.productCode,
    updateAt: new Date().toISOString(),
    updateType: "evidence_collected",
    evidenceGapChanges: {
      added: newGaps,
      resolved: [],
    },
    summary: `Evidence gaps identified: ${newGaps.join(", ")}`,
    reasoning: `Product ${context.productCode} identified gaps requiring collection`,
  });
}

/**
 * Update from contradiction event
 */
function updateFromContradiction(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  const newContradictions = context.memory.contradictionKeys.filter(
    (c) => !twin.dominantContradictions.includes(c)
  );

  if (newContradictions.length === 0) {
    return twin;
  }

  return strategicTwinUpdater.applyUpdate({
    caseId: context.caseId,
    updatingProductCode: context.productCode,
    updateAt: new Date().toISOString(),
    updateType: "pattern_detected",
    contradictionChanges: {
      added: newContradictions,
      resolved: [],
    },
    summary: `Contradictions detected: ${newContradictions.join(", ")}`,
    reasoning: `Product ${context.productCode} detected organizational contradictions`,
  });
}

/**
 * Update from warning event
 */
function updateFromWarning(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  // Increase intervention readiness
  const newReadiness: "signal_detected" | "evidence_needed" | "intervention_ready" | "execution_governance_required" =
    twin.currentInterventionReadiness === "execution_governance_required"
      ? "execution_governance_required"
      : twin.currentInterventionReadiness === "intervention_ready"
        ? "intervention_ready"
        : "evidence_needed";

  return strategicTwinUpdater.updateInterventionReadiness(
    context.caseId,
    context.productCode,
    newReadiness,
    `Warning issued by ${context.productCode}`
  );
}

/**
 * Update from recommendation event
 */
function updateFromRecommendation(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  return strategicTwinUpdater.updateInterventionReadiness(
    context.caseId,
    context.productCode,
    "intervention_ready",
    `Decision path recommended by ${context.productCode}`
  );
}

/**
 * Update from commitment event
 */
function updateFromCommitment(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  const newCommitments = context.memory.commitmentKeys.filter(
    (cm) => !twin.unresolvedCommitments.includes(cm)
  );

  if (newCommitments.length === 0) {
    return twin;
  }

  return strategicTwinUpdater.applyUpdate({
    caseId: context.caseId,
    updatingProductCode: context.productCode,
    updateAt: new Date().toISOString(),
    updateType: "commitment_added",
    commitmentChanges: {
      added: newCommitments,
      completed: [],
      abandoned: [],
    },
    summary: `Commitments recorded: ${newCommitments.join(", ")}`,
    reasoning: `Product ${context.productCode} recorded decision commitments`,
  });
}

/**
 * Update from pattern deterioration event
 */
function updateFromPatternDeterioration(
  context: ProductTwinUpdateContext,
  twin: StrategicTwinState
): StrategicTwinState | null {
  const newPatterns = context.memory.contradictionKeys.filter(
    (p) => !twin.repeatedPatterns.includes(p)
  );

  if (newPatterns.length === 0) {
    return twin;
  }

  return strategicTwinUpdater.applyUpdate({
    caseId: context.caseId,
    updatingProductCode: context.productCode,
    updateAt: new Date().toISOString(),
    updateType: "pattern_detected",
    contradictionChanges: {
      added: newPatterns,
      resolved: [],
    },
    summary: `Pattern deterioration detected: ${newPatterns.join(", ")}`,
    reasoning: `Product ${context.productCode} detected recurring pattern; root cause requires investigation`,
  });
}

/**
 * HARD REQUIREMENT: Twin updates cannot modify authority governance
 */
export function validateTwinUpdateSafe(
  before: StrategicTwinState,
  after: StrategicTwinState
): { safe: boolean; violation?: string } {
  // These must never change through memory/twin updates
  // (They are controlled only by ProductAuthorityContract and ProductReleaseGovernance)

  if (before.caseId !== after.caseId) {
    return {
      safe: false,
      violation: "Cannot change caseId through twin update",
    };
  }

  if (before.subjectType !== after.subjectType) {
    return {
      safe: false,
      violation: "Cannot change subjectType through twin update",
    };
  }

  return { safe: true };
}
