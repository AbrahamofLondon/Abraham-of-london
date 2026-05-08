import { buildConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";
import { buildConstitutionalEvidenceBridge, type UpstreamEvidenceContext } from "@/lib/diagnostics/constitutional-evidence-bridge";
import { classifyConstitutionalSignals } from "@/lib/engine/classifier.service";
import { extractSignalPacket } from "@/lib/engine/signal.service";
import { weightSignals } from "@/lib/engine/weighting.service";
import { arbitrateConstitutionalRoute } from "@/lib/engine/arbitration.service";
import { composeNarrativeResult } from "@/lib/engine/narrative.service";
import type { DiagnosticAnswers } from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { EngineContext, EngineTelemetry } from "@/lib/engine/types";

export function runConstitutionalOrchestration(input: {
  answers: DiagnosticAnswers;
  context: EngineContext;
  telemetry?: EngineTelemetry;
  upstream?: UpstreamEvidenceContext | null;
}) {
  const classified = classifyConstitutionalSignals(input.answers, input.context.operatorKey);
  const signals = extractSignalPacket(classified, input.context, input.telemetry);
  const weighted = weightSignals(classified, signals, input.context);
  const arbitration = arbitrateConstitutionalRoute(weighted, input.context);
  const narrative = composeNarrativeResult(weighted, arbitration);

  const bundle = {
    report: narrative.report,
    constitutionalInput: weighted.constitutionalInput,
    decision: arbitration.clientDecision,
    routeSummary: narrative.routeSummary,
  };

  return {
    bundle,
    bridge: buildConstitutionalBridgeBundle({
      report: narrative.report,
      constitutionalInput: weighted.constitutionalInput,
      decision: arbitration.internalDecision,
      routeSummary: narrative.routeSummary,
    }),
    evidenceBridge: buildConstitutionalEvidenceBridge({
      report: narrative.report,
      decision: arbitration.internalDecision,
      answers: input.answers,
      upstream: input.upstream,
    }),
    internal: {
      decision: arbitration.internalDecision,
    },
  };
}
