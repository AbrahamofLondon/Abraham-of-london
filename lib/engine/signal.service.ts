import type {
  ClassifiedSignalSet,
  EngineContext,
  EngineTelemetry,
  SignalPacket,
} from "@/lib/engine/types";
import { deriveHiddenSignals } from "@/lib/engine/hidden-signals";

export function extractSignalPacket(
  classified: ClassifiedSignalSet,
  context: EngineContext,
  telemetry?: EngineTelemetry,
): SignalPacket {
  const hidden = deriveHiddenSignals(classified.answers, telemetry);
  const visibleSeed = Math.round(
    (classified.report.authorityScore +
      classified.report.coherenceScore +
      classified.report.trustScore) /
      3,
  );

  const orderSeed =
    [...context.sessionContext].reduce((sum, char) => sum + char.charCodeAt(0), 0) +
    visibleSeed;

  return {
    visibleSeed,
    hidden,
    orderSeed,
  };
}
