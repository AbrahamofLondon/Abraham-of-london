/**
 * Kernel Safe Summary — IP-safe projection of decision record state.
 *
 * Converts raw kernel output into a public-safe summary that can be
 * consumed by Boardroom, Counsel, Oversight, Portfolio Memory, and
 * Strategy Room without exposing kernel internals.
 *
 * Public label: "Decision record summary" (never "kernel output").
 *
 * Forbidden in any output:
 * - "kernel", "graph", "nodes", "edges"
 * - weights, correction logic, decay formulas
 * - raw contradiction graph structures
 */

import type { DecisionKernelOutput } from "@/lib/decision/kernel";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export type KernelSafePosture =
  | "CLEAR"
  | "WATCH"
  | "RESTRICT"
  | "BLOCKED"
  | "INSUFFICIENT_EVIDENCE";

export type KernelSafeEvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "MEASURED"
  | "VERIFIED";

export type KernelSafeSummary = {
  posture: KernelSafePosture;
  headline: string;
  evidencePosture: KernelSafeEvidencePosture;
  sourceSurfaces: string[];
  contradictionPressure?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  unresolvedDependencies?: string[];
  crossAssessmentSignal?: string | null;
  limitations: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a safe summary from kernel output.
 * No raw kernel DTO fields are forwarded — only derived, labelled summaries.
 */
export function buildKernelSafeSummary(
  output: DecisionKernelOutput,
): KernelSafeSummary {
  const posture = derivePosture(output);
  const headline = deriveHeadline(output, posture);
  const evidencePosture = deriveEvidencePosture(output);
  const sourceSurfaces = deriveSources(output);
  const contradictionPressure = deriveContradictionPressure(output);
  const unresolvedDependencies = deriveUnresolvedDependencies(output);
  const crossAssessmentSignal = deriveCrossAssessmentSignal(output);
  const limitations = deriveLimitations(output);

  return {
    posture,
    headline,
    evidencePosture,
    sourceSurfaces,
    contradictionPressure: contradictionPressure !== "NONE" ? contradictionPressure : undefined,
    unresolvedDependencies: unresolvedDependencies.length > 0 ? unresolvedDependencies : undefined,
    crossAssessmentSignal,
    limitations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function derivePosture(output: DecisionKernelOutput): KernelSafePosture {
  if (output.decision.blocked) return "BLOCKED";
  if (!output.constraint.allowed) return "RESTRICT";

  const activeConflicts = output.graphMetrics.activeContradictions;
  const severity = output.simulation.decayAdjustedSeverity;

  if (activeConflicts === 0 && severity < 3) return "CLEAR";
  if (activeConflicts >= 3 || severity >= 7) return "RESTRICT";
  return "WATCH";
}

function deriveHeadline(output: DecisionKernelOutput, posture: KernelSafePosture): string {
  switch (posture) {
    case "BLOCKED":
      return output.decision.reason
        ? sanitiseHeadline(output.decision.reason)
        : "This decision record is currently blocked. Review is required before proceeding.";
    case "RESTRICT":
      return `This decision record has ${output.graphMetrics.activeContradictions} unresolved contradiction${output.graphMetrics.activeContradictions !== 1 ? "s" : ""}. Proceeding without review is not recommended.`;
    case "WATCH":
      return "This decision record shows signals that warrant monitoring. No immediate action is required.";
    case "CLEAR":
      return "This decision record does not show material contradictions at this time.";
    case "INSUFFICIENT_EVIDENCE":
      return "Insufficient evidence to assess this decision record.";
  }
}

function sanitiseHeadline(reason: string): string {
  // Strip internal labels
  return reason
    .replace(/\bkernel\b/gi, "system")
    .replace(/\bgraph\b/gi, "record")
    .replace(/\bnode[s]?\b/gi, "signal")
    .replace(/\bedge[s]?\b/gi, "relationship")
    .slice(0, 200);
}

function deriveEvidencePosture(output: DecisionKernelOutput): KernelSafeEvidencePosture {
  if (output.signal.basis === "validated") return "VERIFIED";
  if (output.signal.basis === "multi_source") return "MEASURED";
  if (output.graphMetrics.stagesCovered >= 2) return "SYSTEM_INFERRED";
  return "USER_REPORTED";
}

function deriveSources(output: DecisionKernelOutput): string[] {
  const sources = new Set<string>();
  // Derive from graph metrics stage coverage without exposing graph nodes
  if (output.graphMetrics.stagesCovered >= 1) sources.add("Diagnostic record");
  if (output.graphMetrics.stagesCovered >= 2) sources.add("Strategy Room");
  if (output.graphMetrics.stagesCovered >= 3) sources.add("Executive Reporting");
  if (output.graphMetrics.stagesCovered >= 4) sources.add("Constitutional Assessment");
  if (output.graphMetrics.stagesCovered >= 5) sources.add("Multi-stage assessment");
  return [...sources];
}

function deriveContradictionPressure(
  output: DecisionKernelOutput,
): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "NONE" {
  const active = output.graphMetrics.activeContradictions;
  const severity = output.simulation.decayAdjustedSeverity;

  if (active === 0) return "NONE";
  if (severity >= 8 || active >= 5) return "CRITICAL";
  if (severity >= 6 || active >= 3) return "HIGH";
  if (severity >= 4 || active >= 2) return "MODERATE";
  return "LOW";
}

function deriveUnresolvedDependencies(output: DecisionKernelOutput): string[] {
  if (output.constraint.violations.length === 0) return [];
  // Sanitise constraint violation messages
  return output.constraint.violations
    .map((v) => v.replace(/\bkernel\b/gi, "system").replace(/\bgraph\b/gi, "record"))
    .slice(0, 5);
}

function deriveCrossAssessmentSignal(output: DecisionKernelOutput): string | null {
  if (output.crossAssessmentInterference.length === 0) return null;
  const top = output.crossAssessmentInterference[0]!;
  return `Signals from ${top.stageA} and ${top.stageB} show material tension. This pattern has been detected and requires review if used for decision-making.`;
}

function deriveLimitations(output: DecisionKernelOutput): string[] {
  const limitations: string[] = [];

  if (output.graphMetrics.accumulatedDepth === "shallow") {
    limitations.push("Based on limited assessment depth. Conclusions may change with additional evidence.");
  }

  if (output.signal.strength === "WEAK") {
    limitations.push("Signal strength is low. Independent verification recommended.");
  }

  if (output.simulation.simulationConfidence < 0.5) {
    limitations.push("Scenario estimates have low confidence. Not suitable for board decision-making without review.");
  }

  limitations.push("This is a decision record summary, not independently verified analysis.");

  return limitations;
}

// ─────────────────────────────────────────────────────────────────────────────
// THIN STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a thin-state safe summary when no kernel output is available.
 */
export function buildThinKernelSafeSummary(): KernelSafeSummary {
  return {
    posture: "INSUFFICIENT_EVIDENCE",
    headline: "Insufficient evidence to produce a decision record summary.",
    evidencePosture: "USER_REPORTED",
    sourceSurfaces: [],
    limitations: [
      "No decision record data is available for this case.",
      "Complete a diagnostic or executive report to begin building the decision record.",
    ],
  };
}
