import type { BoardSummaryData } from "@/lib/diagnostics/board-summary";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import type {
  EstimateConfidence,
  ExposureType,
} from "@/lib/tools/decision-delay-exposure-calculator";

export const SAVE_CASE_CARRY_FORWARD_KEY = "aol_pending_session_case_v1";

export type SaveCaseSource =
  | "DECISION_DELAY_CALCULATOR"
  | "FAST_DIAGNOSTIC"
  | "BOARD_SUMMARY";

export type SaveCasePayload = {
  source: SaveCaseSource;
  caseRef?: string | null;
  decisionLabel?: string | null;
  condition?: string | null;
  nextGovernanceMove?: string | null;
  comparisonBand?: string | null;
  comparisonMaturityLevel?: string | null;
  weeklyCost?: number | null;
  delayWeeks?: number | null;
  exposureType?: ExposureType | null;
  estimateConfidence?: EstimateConfidence | null;
  createdAt?: string | null;
};

export type SaveCaseContinuityResult =
  | { status: "SAVED"; caseRef: string; decisionCentreHref: string }
  | { status: "AUTH_REQUIRED"; returnTo: string; carryForwardKey: string }
  | { status: "UNAVAILABLE"; reason: string };

export function buildFastDiagnosticSaveCasePayload(input: {
  result: FastDiagnosticResult;
  decisionLabel?: string | null;
}): SaveCasePayload {
  return {
    source: "FAST_DIAGNOSTIC",
    caseRef: clean(input.result.caseRef),
    decisionLabel:
      clean(input.decisionLabel) ||
      clean(input.result.synthesis?.avoidedDecision),
    condition: clean(input.result.conditionLabel || input.result.condition),
    nextGovernanceMove:
      clean(input.result.authorityIndex?.nextGovernanceMove) ||
      clean(input.result.anchorNarrative?.requiredMove) ||
      clean(input.result.synthesis?.concreteMove),
    comparisonBand: clean(input.result.comparisonBand),
    comparisonMaturityLevel:
      input.result.comparisonMaturityLevel == null
        ? null
        : String(input.result.comparisonMaturityLevel),
    createdAt: new Date().toISOString(),
  };
}

export function buildBoardSummarySaveCasePayload(
  data: BoardSummaryData,
): SaveCasePayload {
  return {
    source: "BOARD_SUMMARY",
    decisionLabel: clean(data.title),
    condition: clean(data.conditionLabel),
    nextGovernanceMove: clean(data.requiredMove),
    comparisonBand: clean(data.comparisonBand),
    createdAt: new Date().toISOString(),
  };
}

export function buildDecisionDelaySaveCasePayload(input: {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
  calculatedAt?: string | null;
}): SaveCasePayload {
  return {
    source: "DECISION_DELAY_CALCULATOR",
    // Deliberately no decisionLabel here. Calculator free text is display-only.
    weeklyCost: finiteOrNull(input.weeklyCost),
    delayWeeks: finiteOrNull(input.delayWeeks),
    exposureType: input.exposureType,
    estimateConfidence: input.estimateConfidence,
    createdAt: input.calculatedAt ?? new Date().toISOString(),
  };
}

export function storePendingSaveCase(payload: SaveCasePayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SAVE_CASE_CARRY_FORWARD_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // sessionStorage may be unavailable; manual continuation still works.
  }
}

export function readPendingSaveCase(): SaveCasePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SAVE_CASE_CARRY_FORWARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveCasePayload;
  } catch {
    return null;
  }
}

export function clearPendingSaveCase(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SAVE_CASE_CARRY_FORWARD_KEY);
  } catch {
    // ignore
  }
}

function clean(value: unknown, max = 420): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, max) : null;
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
