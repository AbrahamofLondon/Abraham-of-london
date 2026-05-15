import type { BoardSummaryData } from "@/lib/diagnostics/board-summary";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import type {
  DecisionDelayExposureResult,
  EstimateConfidence,
  ExposureType,
} from "@/lib/tools/decision-delay-exposure-calculator";

export const SESSION_CASE_CARRY_FORWARD_KEY = "aol_pending_session_case_v1";

export type SessionCaseCarryForwardSource =
  | "FAST_DIAGNOSTIC"
  | "BOARD_SUMMARY"
  | "DELAY_CALCULATOR";

export type SessionCaseAuthorityIndex = {
  band: string;
  label: string;
  boardMeaning: string;
  nextGovernanceMove: string;
};

export type SessionCaseCostOfDelay = {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
  sevenDayExposure: number;
  thirtyDayExposure: number;
  ninetyDayExposure: number;
};

export type SessionCaseCarryForwardPayload = {
  source: SessionCaseCarryForwardSource;
  caseRef?: string;
  decisionLabel?: string;
  condition?: string;
  authorityIndex?: SessionCaseAuthorityIndex;
  comparisonBand?: string;
  costOfDelay?: SessionCaseCostOfDelay;
  nextGovernanceMove?: string;
  createdAt?: string;
};

export function buildFastDiagnosticCarryForwardPayload(input: {
  result: FastDiagnosticResult;
  decisionLabel?: string | null;
}): SessionCaseCarryForwardPayload {
  const decisionLabel =
    clean(input.decisionLabel) ||
    clean(input.result.synthesis?.avoidedDecision) ||
    undefined;
  const nextGovernanceMove =
    clean(input.result.authorityIndex?.nextGovernanceMove) ||
    clean(input.result.anchorNarrative?.requiredMove) ||
    clean(input.result.synthesis?.concreteMove) ||
    undefined;

  return {
    source: "FAST_DIAGNOSTIC",
    caseRef: clean(input.result.caseRef) || undefined,
    decisionLabel,
    condition: clean(input.result.conditionLabel || input.result.condition) || undefined,
    authorityIndex: input.result.authorityIndex
      ? {
          band: input.result.authorityIndex.band,
          label: input.result.authorityIndex.label,
          boardMeaning: input.result.authorityIndex.boardMeaning,
          nextGovernanceMove: input.result.authorityIndex.nextGovernanceMove,
        }
      : undefined,
    comparisonBand: clean(input.result.comparisonBand) || undefined,
    nextGovernanceMove,
    createdAt: new Date().toISOString(),
  };
}

export function buildBoardSummaryCarryForwardPayload(
  data: BoardSummaryData,
): SessionCaseCarryForwardPayload {
  return {
    source: "BOARD_SUMMARY",
    decisionLabel: clean(data.title) || undefined,
    condition: clean(data.conditionLabel) || undefined,
    comparisonBand: clean(data.comparisonBand) || undefined,
    nextGovernanceMove: clean(data.requiredMove) || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function buildDelayCalculatorCarryForwardPayload(input: {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
  result: DecisionDelayExposureResult;
}): SessionCaseCarryForwardPayload {
  return {
    source: "DELAY_CALCULATOR",
    // Deliberately no decisionLabel here. The calculator promises that the
    // optional free-text label is display-only and is not carried forward.
    costOfDelay: {
      weeklyCost: input.weeklyCost,
      delayWeeks: input.delayWeeks,
      exposureType: input.exposureType,
      estimateConfidence: input.estimateConfidence,
      sevenDayExposure: input.result.sevenDayExposure,
      thirtyDayExposure: input.result.thirtyDayExposure,
      ninetyDayExposure: input.result.ninetyDayExposure,
    },
    nextGovernanceMove: clean(input.result.recommendedNextMove) || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function storePendingSessionCase(payload: SessionCaseCarryForwardPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SESSION_CASE_CARRY_FORWARD_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // sessionStorage may be unavailable; the caller can still continue manually.
  }
}

export function readPendingSessionCase(): SessionCaseCarryForwardPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CASE_CARRY_FORWARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionCaseCarryForwardPayload;
  } catch {
    return null;
  }
}

export function clearPendingSessionCase(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_CASE_CARRY_FORWARD_KEY);
  } catch {
    // ignore
  }
}

function clean(value: unknown, max = 420): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, max) : null;
}
