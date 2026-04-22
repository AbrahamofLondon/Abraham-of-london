/**
 * lib/diagnostics/narrative-engine.ts — Cross-stage narrative synthesis
 *
 * Builds a system-level narrative from accumulated tension signals.
 * Deterministic: pattern-keyed block assembly, no AI generation.
 * Used by result surfaces, Strategy Room, and Executive Reporting.
 */

import type { TensionThread, TensionSignal } from "./tension-thread";

const SIGNAL_LABELS: Record<string, string> = {
  mandate_vacuum: "an unclear or absent mandate",
  reactive_decision_pattern: "reactive decision-making under pressure",
  environmental_drag: "an environment working against stated direction",
  structural_inconsistency: "situational alignment that is not structural",
  false_alignment: "stated clarity that is not matched by confidence",
  acknowledged_failure: "a clearly known weakness that remains uncorrected",
  structural_failure: "structural failure across multiple constitutional dimensions",
  trust_asymmetry: "trust in the mission without clarity on who decides",
  execution_drift: "coherent governance intent contradicted by execution reality",
  recursive_failure: "repeated correction attempts that fail for the same structural reasons",
  unmanaged_risk: "high-consequence exposure without adequate clarity to manage it",
};

function labelSignal(signal: string): string {
  return SIGNAL_LABELS[signal] || signal.replace(/_/g, " ");
}

/**
 * Build a system-level narrative from the tension thread.
 * Returns null if no meaningful tensions exist.
 */
export function buildThreadNarrative(thread: TensionThread): string | null {
  if (!thread.tensions.length) return null;

  const parts: string[] = [];
  const stages = thread.stagesCompleted.length;

  // 1. OPENING — system-level diagnosis
  if (stages >= 2) {
    parts.push(
      `Across ${stages} diagnostic stages, a consistent structural pattern is emerging. This is not an isolated finding in one assessment — it is a system-level condition that has been confirmed from multiple angles.`,
    );
  } else {
    parts.push(
      "The diagnostic has identified a structural pattern worth tracking. As additional stages are completed, this signal will either confirm or resolve.",
    );
  }

  // 2. PATTERN NAMING — the dominant tensions
  const dominant = thread.dominantPatterns.slice(0, 3);
  if (dominant.length > 0) {
    const named = dominant.map(labelSignal);
    if (named.length === 1) {
      parts.push(`The strongest signal is ${named[0]}.`);
    } else {
      const last = named.pop();
      parts.push(`The dominant signals are ${named.join(", ")} and ${last}.`);
    }
  }

  // 3. EVIDENCE — pull from the highest-severity tensions
  const evidenceSources = [...thread.tensions]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 2);

  if (evidenceSources.length > 0) {
    const evidenceLines = evidenceSources
      .map(s => s.evidence)
      .filter(Boolean)
      .join(" Additionally, ");
    if (evidenceLines) {
      parts.push(evidenceLines);
    }
  }

  // 4. IMPLICATION — what this combination produces
  const escalation = thread.escalationLevel;
  if (escalation === "intervention_required") {
    parts.push(
      "This combination produces a predictable outcome: structural degradation under pressure, even when intent and effort are present. This is not resolved by trying harder. It requires structural correction.",
    );
  } else if (escalation === "structural_risk") {
    parts.push(
      "This pattern, if left unaddressed, will compound under pressure. The system is not yet in crisis — but the conditions for crisis are forming.",
    );
  } else if (escalation === "pattern_detected") {
    parts.push(
      "This is an early signal. It may resolve with targeted correction, or it may deepen as the diagnostic continues. The next stage will clarify.",
    );
  }

  return parts.join(" ");
}

/**
 * Build a brief one-line summary for use in Strategy Room / report headers.
 */
export function buildThreadSummaryLine(thread: TensionThread): string | null {
  if (!thread.tensions.length) return null;

  const dominant = thread.dominantPatterns.slice(0, 2).map(labelSignal);
  if (dominant.length === 0) {
    return `${thread.tensions.length} diagnostic signal${thread.tensions.length > 1 ? "s" : ""} detected across ${thread.stagesCompleted.length} stage${thread.stagesCompleted.length > 1 ? "s" : ""}.`;
  }

  return `Previous diagnostics indicate: ${dominant.join(" and ")}.`;
}

function severityRank(s: string): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

/* ─── DIRECTIVE NARRATIVE — states the system's position ─── */

import type { DecisionDirective } from "./decision-authority";

/**
 * Build a narrative that states the system's decision position.
 * This is the "what happens next" layer — not observation, but direction.
 */
export function buildDirectiveNarrative(
  directive: DecisionDirective,
  thread: TensionThread,
): string {
  const parts: string[] = [];

  switch (directive.level) {
    case "block":
      parts.push(
        `The system's position is clear: escalation is not justified in the current condition.`,
      );
      parts.push(directive.reason);
      if (directive.requiredAction) {
        parts.push(`Required action: ${directive.requiredAction}`);
      }
      break;

    case "restrict":
      parts.push(
        `The system is restricting progression until a prerequisite condition is addressed.`,
      );
      parts.push(directive.reason);
      if (directive.requiredAction) {
        parts.push(`What must happen first: ${directive.requiredAction}`);
      }
      break;

    case "warn":
      parts.push(directive.reason);
      parts.push(
        `The system is not blocking this path. But the output quality may be compromised by unresolved structural conditions.`,
      );
      break;

    default:
      return "";
  }

  // Add escalation context if relevant
  if (thread.stagesCompleted.length >= 2) {
    parts.push(
      `This position is based on ${thread.tensions.length} signal${thread.tensions.length > 1 ? "s" : ""} accumulated across ${thread.stagesCompleted.length} diagnostic stages.`,
    );
  }

  return parts.join(" ");
}
