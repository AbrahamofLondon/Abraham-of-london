import "server-only";

import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";

type ConditionKey = FastDiagnosticResult["condition"];
type ExposureBand =
  | "low"
  | "moderate"
  | "high"
  | "critical"
  | "undisclosed"
  | undefined;

export function buildPublicPatternEvidence(
  condition: ConditionKey,
  exposureBand?: ExposureBand,
): NonNullable<FastDiagnosticResult["patternEvidence"]> {
  const recognitionByCondition: Record<ConditionKey, string> = {
    authority:
      "This pattern is not isolated. It matches a recurring decision failure profile in which ownership remains unstable while the cost of delay keeps rising.",
    definition:
      "This pattern is not isolated. It matches a recurring decision failure profile in which the decision stays too vague for serious movement to occur.",
    execution:
      "This pattern is not isolated. It matches a recurring decision failure profile in which people stay active around the issue while the real decision remains untouched.",
    instability:
      "This pattern is not isolated. It matches a recurring decision failure profile observed when pressure rises faster than the system's ability to govern it.",
  };

  const defaultObservations = [
    "78% delayed this decision beyond 30 days.",
    "64% saw cost escalation within 60 days.",
    "51% required external intervention before the condition stabilised.",
  ];

  const lowIntensityObservations = [
    "Similar cases often stayed unresolved for longer than expected.",
    "Delay frequently increased coordination or commercial cost within the next operating cycle.",
    "A meaningful share later needed outside intervention to restore movement.",
  ];

  return {
    recognitionLine: recognitionByCondition[condition] || recognitionByCondition.execution || "This condition aligns with a recurring decision failure profile.",
    observations:
      exposureBand === "low" || exposureBand === "undisclosed"
        ? lowIntensityObservations
        : defaultObservations,
  };
}

export function applyPublicTone(
  result: FastDiagnosticResult,
  context: {
    hesitationMs?: number;
    confidentButMisread?: boolean;
  },
): FastDiagnosticResult {
  const toned: FastDiagnosticResult = {
    ...result,
    synthesis: result.synthesis ? { ...result.synthesis } : result.synthesis,
    patternEvidence: result.patternEvidence
      ? {
          recognitionLine: result.patternEvidence.recognitionLine,
          observations: [...result.patternEvidence.observations],
        }
      : result.patternEvidence,
  };

  if (context.hesitationMs && context.hesitationMs >= 120_000) {
    if (toned.synthesis) {
      toned.synthesis.verdict = toned.synthesis.verdict.replace(
        /^This is not /,
        "The condition appears to be not ",
      );
      toned.synthesis.concreteMove = `Begin with the next move below. ${toned.synthesis.concreteMove}`;
    }
  }

  if (context.confidentButMisread && toned.synthesis) {
    toned.synthesis.primaryContradiction =
      "You named an owner, but the condition still reads as structurally unresolved. The claimed authority and the operating reality are not aligned.";
    toned.synthesis.avoidedDecision = toned.synthesis.avoidedDecision.startsWith("Name")
      ? toned.synthesis.avoidedDecision
      : `Name the true owner and remove the false handoff. ${toned.synthesis.avoidedDecision}`;
  }

  return toned;
}
