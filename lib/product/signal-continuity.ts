/**
 * lib/product/signal-continuity.ts — Signal continuity derivation.
 *
 * Every result should answer: is this a new signal, repeated signal,
 * worsening signal, improving signal, resolved signal, or verified pattern?
 *
 * Uses available historical records from:
 * - diagnostic journey history (stages, evidence nodes, tensions)
 * - decision ledger (ledger entries with score impact)
 * - outcome verification records (classification)
 * - prior living case data (contradictions, route decisions)
 *
 * Does not invent unavailable history. Returns UNKNOWN or NEW_SIGNAL
 * when insufficient history exists.
 */

import type { SignalContinuity } from "@/lib/product/evidence-classification";
import type { DiagnosticJourneyRecord } from "@/lib/diagnostics/journey-store";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ContinuityInput = {
  /** The signal being classified (e.g., a contradiction label, pattern key, condition class) */
  signalKey: string;
  /** The current severity or score (0-1) */
  currentSeverity: number;
  /** The source stage generating this signal */
  sourceStage: string;
  /** The diagnostic journey for historical context */
  journey: DiagnosticJourneyRecord | null;
  /** Optional: outcome classification if available */
  outcomeClassification?: string | null;
};

export type ContinuityResult = {
  continuity: SignalContinuity;
  reason: string;
  priorOccurrences: number;
  trend: "stable" | "escalating" | "de-escalating" | "unknown";
};

// ─────────────────────────────────────────────────────────────────────────────
// DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive signal continuity from available historical records.
 *
 * Algorithm:
 * 1. Search journey evidence nodes for prior occurrences of signalKey
 * 2. If outcome verification exists and classified as resolved → RESOLVED
 * 3. If 3+ prior occurrences → VERIFIED_PATTERN
 * 4. If prior occurrence exists and current severity > prior → WORSENING
 * 5. If prior occurrence exists and current severity < prior → IMPROVING
 * 6. If prior occurrence exists and severity unchanged → REPEATED
 * 7. If no prior occurrence but journey has history → NEW_SIGNAL
 * 8. If no journey → UNKNOWN
 */
export function deriveSignalContinuity(input: ContinuityInput): ContinuityResult {
  const { signalKey, currentSeverity, journey, outcomeClassification } = input;
  const signalLower = signalKey.toLowerCase();

  // No journey = no history
  if (!journey || Object.keys(journey.stages).length === 0) {
    return {
      continuity: "NEW",
      reason: "No prior diagnostic history available.",
      priorOccurrences: 0,
      trend: "unknown",
    };
  }

  // Check outcome verification
  if (outcomeClassification) {
    const classification = outcomeClassification.toLowerCase();
    if (classification === "resolved" || classification === "resolved_condition") {
      return {
        continuity: "RESOLVED",
        reason: "Outcome verification classified this signal as resolved.",
        priorOccurrences: 0,
        trend: "de-escalating",
      };
    }
  }

  // Search evidence nodes for prior occurrences
  const priorNodes = journey.evidenceNodes.filter((node) => {
    const labelMatch = node.label.toLowerCase().includes(signalLower);
    const summaryMatch = node.summary.toLowerCase().includes(signalLower);
    const kindMatch = node.kind === signalLower;
    return labelMatch || summaryMatch || kindMatch;
  });

  // Search tension thread for prior mentions
  const tensionMatches = journey.mergedTensionThread.filter((t) =>
    t.toLowerCase().includes(signalLower),
  );

  const totalPrior = priorNodes.length + tensionMatches.length;

  if (totalPrior === 0) {
    return {
      continuity: "NEW",
      reason: "Signal not found in prior diagnostic history.",
      priorOccurrences: 0,
      trend: "unknown",
    };
  }

  // Verified pattern: 3+ prior occurrences
  if (totalPrior >= 3) {
    return {
      continuity: "VERIFIED_PATTERN",
      reason: `Signal has ${totalPrior} prior occurrences across diagnostic history. This is a structural pattern.`,
      priorOccurrences: totalPrior,
      trend: "stable",
    };
  }

  // Compare severity to prior nodes
  if (priorNodes.length > 0) {
    const priorSeverities = priorNodes.map((n) => severityToNumber(n.severity));
    const avgPriorSeverity = priorSeverities.reduce((a, b) => a + b, 0) / priorSeverities.length;

    if (currentSeverity > avgPriorSeverity + 0.15) {
      return {
        continuity: "WORSENING",
        reason: `Signal severity has increased from prior readings (${avgPriorSeverity.toFixed(2)} → ${currentSeverity.toFixed(2)}).`,
        priorOccurrences: totalPrior,
        trend: "escalating",
      };
    }

    if (currentSeverity < avgPriorSeverity - 0.15) {
      return {
        continuity: "IMPROVING",
        reason: `Signal severity has decreased from prior readings (${avgPriorSeverity.toFixed(2)} → ${currentSeverity.toFixed(2)}).`,
        priorOccurrences: totalPrior,
        trend: "de-escalating",
      };
    }

    return {
      continuity: "REPEATED",
      reason: `Signal has been observed ${totalPrior} time(s) previously at similar severity.`,
      priorOccurrences: totalPrior,
      trend: "stable",
    };
  }

  // Only tension thread matches
  return {
    continuity: "REPEATED",
    reason: `Signal matches ${tensionMatches.length} prior tension(s) in the diagnostic thread.`,
    priorOccurrences: totalPrior,
    trend: "stable",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function severityToNumber(severity: string): number {
  switch (severity) {
    case "critical": return 1.0;
    case "high": return 0.75;
    case "medium": return 0.5;
    case "low": return 0.25;
    default: return 0.5;
  }
}

/**
 * Batch derive continuity for all contradictions in a journey.
 * Useful for Return Brief and Living Intelligence Spine assembly.
 */
export function deriveContradictionContinuity(
  journey: DiagnosticJourneyRecord,
): Array<{ label: string; continuity: ContinuityResult }> {
  const contradictions = journey.evidenceNodes.filter((n) => n.kind === "contradiction");

  return contradictions.map((node) => ({
    label: node.label,
    continuity: deriveSignalContinuity({
      signalKey: node.label,
      currentSeverity: severityToNumber(node.severity),
      sourceStage: node.sourceStage,
      journey,
    }),
  }));
}
