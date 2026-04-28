/**
 * COMPATIBILITY SHIM — do not add logic here.
 *
 * Canonical implementation lives at:
 *   lib/diagnostics/constitutional-diagnostic-derivation.ts
 *
 * This file exists solely so any legacy import path resolves.
 * All types and functions are re-exported from the canonical source.
 *
 * @deprecated Import from "@/lib/diagnostics/constitutional-diagnostic-derivation" instead.
 */

export {
  DEFAULT_DIAGNOSTIC_QUESTIONS,
  getAnsweredCount,
  getCompletionPercent,
  buildDomainMap,
  deriveConstitutionalMicroReport,
  deriveConstitutionInputFromMicroReport,
  deriveRouteSummary,
  deriveConstitutionalDiagnosticBundle,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";

export type {
  LikertValue,
  DiagnosticAnswerValue,
  DiagnosticQuestionDomain,
  DiagnosticQuestion,
  DiagnosticAnswers,
  DomainScoreSet,
  ConstitutionalMicroReport,
  ConstitutionalRouteSummary,
  ConstitutionalDiagnosticBundle,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";

// Legacy aliases for backward compatibility
/** @deprecated Use DiagnosticAnswerValue */
export type { DiagnosticAnswerValue as DiagnosticAnswer } from "@/lib/diagnostics/constitutional-diagnostic-derivation";

/** @deprecated Use ConstitutionalMicroReport */
export type { ConstitutionalMicroReport as ConstitutionalDiagnosticReport } from "@/lib/diagnostics/constitutional-diagnostic-derivation";
