import { deriveRouteSummary } from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import { selectNarrativeVariant } from "@/lib/engine/narrative-variants";
import type { ArbitrationResult, NarrativeResult, WeightedSignalResult } from "@/lib/engine/types";

export function composeNarrativeResult(
  weighted: WeightedSignalResult,
  arbitration: ArbitrationResult,
): NarrativeResult {
  const routeSummary = deriveRouteSummary(arbitration.internalDecision);
  const variant = selectNarrativeVariant({
    route: routeSummary.route,
    posture: weighted.report.posture,
    seed: weighted.narrativeOrderSeed,
  });

  return {
    report: {
      ...weighted.report,
      summary: `${variant.summaryPrefix} ${weighted.report.summary}`,
      keyFindings:
        weighted.narrativeOrderSeed % 2 === 0
          ? [...weighted.report.keyFindings]
          : [...weighted.report.keyFindings].reverse(),
    },
    routeSummary: {
      ...routeSummary,
      title: variant.routeTitle ?? routeSummary.title,
      description: variant.routeDescription ?? routeSummary.description,
    },
  };
}
