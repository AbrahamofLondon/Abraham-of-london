/**
 * lib/diagnostics/decision-authority.ts — Decision directive engine
 *
 * Translates accumulated tension-thread state into a decision directive.
 * Determines whether the system allows, warns, restricts, or blocks
 * escalation to higher-order surfaces (Strategy Room, Executive Reporting).
 *
 * Deterministic. Auditable. No probabilistic behaviour.
 */

import type { TensionThread } from "./tension-thread";

export type DecisionDirectiveLevel = "allow" | "warn" | "restrict" | "block";

export type DecisionDirective = {
  level: DecisionDirectiveLevel;
  reason: string;
  requiredAction?: string;
  recommendedPath?: string;
  summary?: string;
};

/**
 * Derive a decision directive from the current tension thread.
 * Returns "allow" if no thread exists or tensions are minimal.
 */
export function deriveDecisionDirective(
  thread: TensionThread | null,
): DecisionDirective {
  if (!thread || thread.tensions.length === 0) {
    return { level: "allow", reason: "No prior diagnostic signals." };
  }

  const signals = new Set(thread.tensions.map(t => t.signal));
  const severities = thread.tensions.map(t => t.severity);
  const hasHigh = severities.includes("high");
  const mediumCount = severities.filter(s => s === "medium").length;
  const escalation = thread.escalationLevel;

  // ── BLOCK — intervention_required with structural failure ──
  if (
    escalation === "intervention_required" &&
    (signals.has("structural_failure") || signals.has("unmanaged_risk"))
  ) {
    return {
      level: "block",
      reason:
        "The diagnostic system has identified structural failure or unmanaged high-consequence risk across your assessments. Escalation in this condition would compound the problem, not clarify it.",
      requiredAction:
        "Address the structural instability identified in prior diagnostics before proceeding to strategic intervention.",
      recommendedPath: "/diagnostics/constitutional-diagnostic",
      summary: "Escalation blocked: structural condition does not support strategic intervention.",
    };
  }

  // ── RESTRICT — mandate vacuum + structural inconsistency ──
  if (signals.has("mandate_vacuum") && signals.has("structural_inconsistency")) {
    return {
      level: "restrict",
      reason:
        "You are operating without a stable mandate, and alignment varies significantly across domains. Strategic escalation in this condition would produce more drift, not clarity.",
      requiredAction:
        "Stabilise your mandate and establish consistent alignment before strategic work can hold.",
      recommendedPath: "/diagnostics/purpose-alignment",
      summary: "Escalation restricted: mandate and alignment instability detected.",
    };
  }

  // ── RESTRICT — mandate vacuum alone at medium+ severity ──
  if (signals.has("mandate_vacuum") && hasHigh) {
    return {
      level: "restrict",
      reason:
        "The diagnostic system has identified a severe mandate vacuum. Without clarity on what you are actually trying to do, strategic intervention has no stable foundation to build on.",
      requiredAction:
        "Complete or repeat the Purpose Alignment diagnostic to establish a clear mandate before proceeding.",
      recommendedPath: "/diagnostics/purpose-alignment",
      summary: "Escalation restricted: severe mandate vacuum.",
    };
  }

  // ── RESTRICT — intervention_required escalation ──
  if (escalation === "intervention_required") {
    return {
      level: "restrict",
      reason:
        "Multiple high-severity signals have accumulated across your diagnostic stages. The system's position is that escalation should pause until the identified structural conditions are addressed.",
      requiredAction:
        "Review the dominant tension patterns from your prior diagnostics and address the highest-severity condition first.",
      recommendedPath: "/diagnostics",
      summary: "Escalation restricted: accumulated structural severity requires prior correction.",
    };
  }

  // ── WARN — structural_risk with specific tensions ──
  if (escalation === "structural_risk") {
    const tensionNames = thread.dominantPatterns.slice(0, 2);
    const labels: Record<string, string> = {
      trust_asymmetry: "trust is being asserted at leadership level but contradicted at execution level",
      execution_drift: "governance intent is present but execution is drifting from it",
      reactive_decision_pattern: "decisions are being driven by pressure rather than principle",
      environmental_drag: "the operating environment is working against stated direction",
      recursive_failure: "previous correction attempts have failed for structural reasons",
    };
    const named = tensionNames
      .map(s => labels[s] || s.replace(/_/g, " "))
      .join(", and ");

    return {
      level: "warn",
      reason: named
        ? `The system is allowing continuation, but with warning: ${named}. This may distort the quality of strategic output.`
        : "Structural risk has been detected across prior diagnostics. Proceed with awareness that the reading may be distorted by unresolved conditions.",
      summary: "Proceeding with structural risk warning.",
    };
  }

  // ── WARN — pattern_detected with medium signals ──
  if (escalation === "pattern_detected" && mediumCount >= 1) {
    return {
      level: "warn",
      reason:
        "The diagnostic system has detected an emerging pattern. It is not yet severe enough to restrict progression, but the signal should be monitored.",
      summary: "Proceeding with early pattern warning.",
    };
  }

  // ── ALLOW — low-friction ──
  return {
    level: "allow",
    reason: "No significant structural instability detected. Proceeding normally.",
  };
}
