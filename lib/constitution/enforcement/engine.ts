/**
 * Enforcement Engine — definitions → signals → thresholds → directives.
 *
 * This is where the Canon stops being vocabulary and starts governing.
 * No interpretation layer. Deterministic enforcement.
 */

import type { EnforcementSignal, SignalType } from "./signals";
import {
  detectDrift,
  detectAuthorityVacuum,
  detectRiskExposure,
  detectPressureOverload,
  detectMisalignment,
  detectStructuralFailure,
} from "./signals";

// ── ESCALATION CLASSIFICATION ───────────────────────────────────────────────

export type EscalationLevel = "CLEAR" | "PATTERN_DETECTED" | "STRUCTURAL_RISK" | "INTERVENTION_REQUIRED";

export function classifyEscalation(signals: EnforcementSignal[]): EscalationLevel {
  const critical = signals.filter((s) => s.severity === "CRITICAL").length;
  const high = signals.filter((s) => s.severity === "HIGH").length;

  if (critical >= 1 || high >= 2) return "INTERVENTION_REQUIRED";
  if (high >= 1) return "STRUCTURAL_RISK";
  if (signals.length > 0) return "PATTERN_DETECTED";
  return "CLEAR";
}

// ── DECISION DIRECTIVES ─────────────────────────────────────────────────────

export type DirectiveAction = "ALLOW" | "WARN" | "RESTRICT" | "MANDATE_INTERVENTION" | "BLOCK";

export type Directive = {
  action: DirectiveAction;
  reason: string;
  signals: EnforcementSignal[];
  escalation: EscalationLevel;
  recommendedToolkit: string | null;
};

const SIGNAL_TOOLKIT_MAP: Record<SignalType, string> = {
  DRIFT: "institutional-diagnostics",
  AUTHORITY_VACUUM: "board-governance",
  RISK_EXPOSURE: "crisis-leadership",
  MISALIGNMENT: "leadership-formation",
  PRESSURE_OVERLOAD: "crisis-leadership",
  STRUCTURAL_FAILURE: "renewal-reform",
};

export function computeDirective(signals: EnforcementSignal[]): Directive {
  const escalation = classifyEscalation(signals);

  // BLOCK: structural failure detected
  if (signals.some((s) => s.type === "STRUCTURAL_FAILURE")) {
    return {
      action: "BLOCK",
      reason: "Structural failure detected — execution prohibited until order is restored",
      signals,
      escalation,
      recommendedToolkit: "renewal-reform",
    };
  }

  // RESTRICT: authority vacuum
  if (signals.some((s) => s.type === "AUTHORITY_VACUUM")) {
    return {
      action: "RESTRICT",
      reason: "Authority not established — decision cannot proceed without enforceable ownership",
      signals,
      escalation,
      recommendedToolkit: "board-governance",
    };
  }

  // MANDATE: intervention required
  if (escalation === "INTERVENTION_REQUIRED") {
    const primary = signals.sort((a, b) => b.score - a.score)[0];
    return {
      action: "MANDATE_INTERVENTION",
      reason: `Critical signals detected — intervention mandatory before execution`,
      signals,
      escalation,
      recommendedToolkit: primary ? SIGNAL_TOOLKIT_MAP[primary.type] : "institutional-diagnostics",
    };
  }

  // WARN: structural risk
  if (escalation === "STRUCTURAL_RISK") {
    return {
      action: "WARN",
      reason: "Structural risk detected — proceed with caution and monitoring",
      signals,
      escalation,
      recommendedToolkit: signals[0] ? SIGNAL_TOOLKIT_MAP[signals[0].type] : null,
    };
  }

  // ALLOW
  return { action: "ALLOW", reason: "No blocking signals detected", signals, escalation, recommendedToolkit: null };
}

// ── FULL ASSESSMENT ─────────────────────────────────────────────────────────

export type EnforcementAssessment = {
  signals: EnforcementSignal[];
  directive: Directive;
  dominantPattern: string | null;
  canonReference: string | null;
};

/**
 * Run full enforcement assessment from available data.
 * Call this at Strategy Room entry, ER generation, or any governance gate.
 */
export function runEnforcementAssessment(input: {
  domainScores?: number[];
  authorityClarity?: number;
  exposureScore?: number;
  pressure?: number;
  coherence?: number;
  resonance?: number;
  certainty?: number;
  constitutionalRoute?: string;
}): EnforcementAssessment {
  const signals: EnforcementSignal[] = [];

  if (input.domainScores) {
    const s = detectDrift(input.domainScores);
    if (s) signals.push(s);
  }
  if (input.authorityClarity !== undefined) {
    const s = detectAuthorityVacuum(input.authorityClarity);
    if (s) signals.push(s);
  }
  if (input.exposureScore !== undefined) {
    const s = detectRiskExposure(input.exposureScore);
    if (s) signals.push(s);
  }
  if (input.pressure !== undefined && input.coherence !== undefined) {
    const s = detectPressureOverload(input.pressure, input.coherence);
    if (s) signals.push(s);
  }
  if (input.resonance !== undefined && input.certainty !== undefined) {
    const s = detectMisalignment(input.resonance, input.certainty);
    if (s) signals.push(s);
  }
  if (input.constitutionalRoute) {
    const s = detectStructuralFailure(input.constitutionalRoute);
    if (s) signals.push(s);
  }

  const directive = computeDirective(signals);

  const dominant = signals.sort((a, b) => b.score - a.score)[0] ?? null;

  return {
    signals,
    directive,
    dominantPattern: dominant ? `${dominant.type} (severity: ${dominant.severity}, score: ${dominant.score})` : null,
    canonReference: dominant?.canonDefinition ?? null,
  };
}
