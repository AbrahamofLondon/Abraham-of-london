/**
 * lib/diagnostics/board-summary.ts
 *
 * Canonical shared types and builder functions for the Board Summary system.
 * Consumed by:
 *   - components/diagnostics/BoardSummaryPreview.tsx (rendering)
 *   - pages/diagnostics/board-summary.tsx (standalone page)
 *   - pages/diagnostics/fast.tsx (inline in result screen)
 *
 * No rendering logic lives here.
 * No server-only imports. Safe for client-side use.
 */

import type { FastDiagnosticResult } from "./fast-diagnostic-dto";
import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-contract";

// ─── Canonical type ───────────────────────────────────────────────────────────

export type BoardSummaryData = {
  title: string;
  conditionLabel: string;
  severityBand: string;
  signalStrength: string;
  primaryContradiction: string;
  costOfInaction: {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  requiredMove: string;
  comparisonBand?: string | null;
  provenanceHash?: string | null;
  detectedSignals?: Array<{
    signalName: string;
    severityBand: string;
    narrativeSummary: string;
  }>;
  /** Surfaces that contributed evidence (shown as a ladder in the standalone page) */
  completedSurfaces?: string[];
  sourceLabel: string;
  scenarioOnly: true;
};

// ─── Builder: Fast Diagnostic ─────────────────────────────────────────────────

export function buildBoardSummaryFromFastDiagnostic(
  result: FastDiagnosticResult,
  answers: Record<string, string> = {},
): BoardSummaryData {
  const an = result.anchorNarrative;
  const coi = result.costOfInaction;

  return {
    title: answers.decision ?? result.synthesis?.avoidedDecision ?? "Unresolved decision",
    conditionLabel: result.conditionLabel || result.condition,
    severityBand:
      result.highestSignalSeverity ??
      (result.signalStrength === "high" ? "ALERT" : "CONCERN"),
    signalStrength: result.signalStrength,
    primaryContradiction:
      result.synthesis?.primaryContradiction ??
      an?.whyItExists ??
      "Decision structure problem identified.",
    costOfInaction: {
      thirtyDays:
        an?.costOfInaction.thirtyDays ?? coi?.horizon30 ?? "Delay becomes normalised.",
      sixtyDays:
        an?.costOfInaction.sixtyDays ?? coi?.horizon60 ?? "Resources spent without movement.",
      ninetyDays:
        an?.costOfInaction.ninetyDays ?? coi?.horizon90 ?? "Cost of reversing exceeds cost of deciding.",
    },
    requiredMove:
      an?.requiredMove ?? result.synthesis?.concreteMove ?? "Assign one accountable owner.",
    comparisonBand: result.comparisonBand ?? null,
    provenanceHash: null, // Fast result does not carry a provenanceHash — never fake one
    detectedSignals: result.detectedSignals?.map((s) => ({
      signalName: s.signalName,
      severityBand: s.severityBand,
      narrativeSummary: s.narrativeSummary,
    })),
    sourceLabel: "Fast Diagnostic",
    scenarioOnly: true,
  };
}

// ─── Builder: Executive Report ────────────────────────────────────────────────

export function buildBoardSummaryFromExecutiveReport(
  report: ExecutiveReport,
): BoardSummaryData {
  return {
    title: report.headline,
    conditionLabel: report.route,
    severityBand: report.seriousness,
    signalStrength:
      report.seriousness === "CRITICAL" || report.seriousness === "HIGH"
        ? "high"
        : "moderate",
    primaryContradiction:
      report.topPressurePoints[0] ?? "Governance pressure identified.",
    costOfInaction: {
      thirtyDays: report.executionSequence.next7Days[0] ?? "Review required.",
      sixtyDays: report.executionSequence.next30Days[0] ?? "Intervention needed.",
      ninetyDays: report.executionSequence.next90Days[0] ?? "Structural correction required.",
    },
    requiredMove:
      report.correctionPriorities[0] ?? report.escalationRecommendation,
    comparisonBand: null,
    provenanceHash: null, // Executive Report does not carry a provenanceHash
    sourceLabel: "Executive Reporting",
    scenarioOnly: true,
  };
}

// ─── Builder: Session Storage (cross-diagnostic) ──────────────────────────────

/**
 * Reads all completed diagnostic surfaces from sessionStorage and builds
 * a BoardSummaryData. Returns null when no usable evidence is found.
 *
 * Call only from client-side code (useEffect / event handlers).
 * Never call during SSR.
 */
export function buildBoardSummaryFromSessionStorage(): BoardSummaryData | null {
  const surfaceMap: Array<{ key: string; label: string }> = [
    { key: "aol_fast_result",              label: "Fast Diagnostic" },
    { key: "purpose-alignment-result",     label: "Purpose Alignment" },
    { key: "team-assessment-result",       label: "Team Assessment" },
    { key: "enterprise-assessment-result", label: "Enterprise Assessment" },
  ];

  const completedSurfaces: string[] = [];

  try {
    for (const { key, label } of surfaceMap) {
      if (sessionStorage.getItem(key)) completedSurfaces.push(label);
    }

    // Primary: use Fast result (typed path)
    const fastRaw = sessionStorage.getItem("aol_fast_result");
    if (fastRaw) {
      const fastResult = JSON.parse(fastRaw) as FastDiagnosticResult;
      const stateRaw = localStorage.getItem("aol-fast-assessment-state");
      const answers: Record<string, string> =
        stateRaw
          ? ((JSON.parse(stateRaw) as Record<string, unknown>)?.data as Record<string, unknown>)?.answers as Record<string, string> ?? {}
          : {};

      const data = buildBoardSummaryFromFastDiagnostic(fastResult, answers);
      return { ...data, completedSurfaces };
    }

    // Fallback: Enterprise Assessment
    const entRaw = sessionStorage.getItem("enterprise-assessment-result");
    if (entRaw) {
      const parsed = JSON.parse(entRaw) as Record<string, unknown>;
      const safeStr = (v: unknown): string | null =>
        typeof v === "string" && v.trim() ? v.trim() : null;

      const decision = safeStr(parsed.recentDecision);
      const band = safeStr(parsed.band);
      const reading = safeStr(parsed.primaryReading) ?? safeStr(parsed.dominantFailure);
      const provenanceHash = safeStr(parsed.provenanceHash);

      if (!decision && !band && !reading) return null;

      return {
        title: decision ?? "Deferred decision",
        conditionLabel: band ?? "UNKNOWN",
        severityBand: "CONCERN",
        signalStrength: "moderate",
        primaryContradiction: reading ?? "Structural pressure detected.",
        costOfInaction: {
          thirtyDays: "The constraint remains active. Workarounds are replacing structure.",
          sixtyDays: reading ?? "Cost shifts from operational delay to structural damage.",
          ninetyDays: "The decision will be forced under worse conditions.",
        },
        requiredMove: "Name the decision, assign one owner, and set a resolution date.",
        provenanceHash,
        completedSurfaces,
        sourceLabel: "Enterprise Assessment",
        scenarioOnly: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}
