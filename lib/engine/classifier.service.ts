import {
  deriveConstitutionalMicroReport,
  deriveConstitutionInputFromMicroReport,
  type DiagnosticAnswers,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { ClassifiedSignalSet } from "@/lib/engine/types";

export function classifyConstitutionalSignals(
  answers: DiagnosticAnswers,
  operatorKey: string,
): ClassifiedSignalSet {
  const report = deriveConstitutionalMicroReport(answers);
  const constitutionalInput = deriveConstitutionInputFromMicroReport(report, {
    operatorKey,
    operatorOverrideRequested: false,
  });

  return {
    report,
    constitutionalInput,
    answers,
  };
}
