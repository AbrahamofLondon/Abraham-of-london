import { evaluateConstitutionalRoute, type ConstitutionInput } from "./rules";
import { inferTrajectory } from "./trajectory";
import { detectRiskSignals } from "./risk-signals";
import { estimateSeriousness } from "./seriousness";
import { synthesisePosture } from "./synthesis";
import { composeAdvisoryMemo } from "./advisory-memo";
import { runInstitutionalLearning } from "./institutional-learning";
import { runConstitutionalObservability } from "./run-observability";

export type AutonomousAdvisoryInput = ConstitutionInput & {
  trajectoryContext?: {
    urgency?: number;
    volatility?: number;
    deterioration?: number;
  };
  memoryContext?: {
    email?: string | null;
    name?: string | null;
    organisation?: string | null;
    problemStatement?: string | null;
  };
};

export function runAutonomousAdvisory(input: AutonomousAdvisoryInput) {
  const decision = evaluateConstitutionalRoute(input);

  const trajectory = inferTrajectory(
    input.narrativeCoherence,
    input.interventionReadiness,
    Array(input.failureModeCount).fill("failure"),
  );

  const risks = detectRiskSignals({
    posture: input.posture,
    authorityType: input.authorityType,
    readinessTier: input.readinessTier,
    failureModeCount: input.failureModeCount,
    failureModeSeverity: input.failureModeSeverity,
    narrativeCoherence: input.narrativeCoherence,
    interventionReadiness: input.interventionReadiness,
  });

  const seriousness = estimateSeriousness({
    seriousnessScore: input.seriousnessScore ?? 50,
    failureModeCount: input.failureModeCount,
    failureModeSeverity: input.failureModeSeverity,
    interventionReadiness: input.interventionReadiness,
    narrativeCoherence: input.narrativeCoherence,
  });

  const synthesis = synthesisePosture({
    trajectory,
    readiness: input.interventionReadiness,
    authority: input.authorityType,
  });

  const memo = composeAdvisoryMemo({
    decision,
    synthesis,
    trajectory,
    seriousness,
    readinessScore: input.interventionReadiness,
    authority: input.authorityType,
    risks: risks.map((r) => r.label),
  });

  const learning = runInstitutionalLearning({
    email: input.memoryContext?.email,
    name: input.memoryContext?.name,
    organisation: input.memoryContext?.organisation,
    problemStatement: input.memoryContext?.problemStatement,
    decision,
    memo,
    readinessScore: input.interventionReadiness,
    seriousness,
    trajectory,
  });

  const observability = runConstitutionalObservability({
    caseKey: learning.caseKey,
    operatorKey: learning.operatorKey,
    decision,
    readinessScore: input.interventionReadiness,
    seriousness,
    narrativeCoherence: input.narrativeCoherence,
    authorityType: input.authorityType,
  });

  return {
    decision,
    trajectory,
    risks,
    seriousness,
    synthesis,
    memo,
    learning,
    observability,
  };
}