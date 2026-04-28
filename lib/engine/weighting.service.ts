import { getDynamicWeightMultiplier } from "@/lib/security/dynamic-threshold";
import type {
  ClassifiedSignalSet,
  EngineContext,
  SignalPacket,
  WeightedSignalResult,
} from "@/lib/engine/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightSignals(
  classified: ClassifiedSignalSet,
  signals: SignalPacket,
  context: EngineContext,
): WeightedSignalResult {
  const hiddenWeightShare = 0.35;
  const visibleWeightShare = 1 - hiddenWeightShare;

  const hiddenComposite = average([
    signals.hidden.contradictionDensity,
    signals.hidden.hesitationIndex,
    signals.hidden.certaintyCompression,
    signals.hidden.narrativeDrift,
  ]);

  const trustDrift = getDynamicWeightMultiplier(1, `${context.sessionContext}:trust`, {
    driftPercent: 0.04,
  });
  const readinessDrift = getDynamicWeightMultiplier(
    1,
    `${context.sessionContext}:readiness`,
    { driftPercent: 0.05 },
  );

  const report = {
    ...classified.report,
    trustScore: clamp(
      Math.round(
        classified.report.trustScore * visibleWeightShare +
          classified.report.trustScore * trustDrift * hiddenWeightShare -
          hiddenComposite * 18,
      ),
      0,
      100,
    ),
    narrativeCoherence: clamp(
      Math.round(
        classified.report.narrativeCoherence * visibleWeightShare +
          classified.report.narrativeCoherence * hiddenWeightShare -
          signals.hidden.contradictionDensity * 20,
      ),
      0,
      100,
    ),
    interventionReadiness: clamp(
      Math.round(
        classified.report.interventionReadiness * visibleWeightShare +
          classified.report.interventionReadiness * readinessDrift * hiddenWeightShare -
          signals.hidden.hesitationIndex * 14,
      ),
      0,
      100,
    ),
    seriousnessScore: clamp(
      Math.round(
        classified.report.seriousnessScore * visibleWeightShare +
          classified.report.seriousnessScore * hiddenWeightShare +
          signals.hidden.narrativeDrift * 10,
      ),
      0,
      100,
    ),
  };

  return {
    report,
    constitutionalInput: {
      ...classified.constitutionalInput,
      trustCondition: report.trustScore,
      narrativeCoherence: report.narrativeCoherence,
      interventionReadiness: report.interventionReadiness,
      seriousnessScore: report.seriousnessScore,
    },
    hiddenWeightShare,
    narrativeOrderSeed: signals.orderSeed,
  };
}
