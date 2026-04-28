/**
 * Enforcement Signals — Canon definitions converted to deterministic triggers.
 *
 * Drift (Def 12) → DRIFT signal
 * Sovereignty/Responsibility (Def 27/23) → AUTHORITY_VACUUM
 * Risk (Def 25) → RISK_EXPOSURE
 * Pressure (Def 22) → PRESSURE_OVERLOAD
 * Alignment (Def 1) → MISALIGNMENT
 * Order vs Chaos (Def 40) → STRUCTURAL_FAILURE
 */

export type SignalType =
  | "DRIFT"
  | "AUTHORITY_VACUUM"
  | "RISK_EXPOSURE"
  | "MISALIGNMENT"
  | "PRESSURE_OVERLOAD"
  | "STRUCTURAL_FAILURE";

export type SignalSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EnforcementSignal = {
  type: SignalType;
  severity: SignalSeverity;
  score: number;
  source: string;
  evidence: string[];
  canonDefinition: string;
};

// ── DETECTORS ───────────────────────────────────────────────────────────────

export function detectDrift(domainScores: number[]): EnforcementSignal | null {
  if (domainScores.length < 2) return null;
  const variance = Math.max(...domainScores) - Math.min(...domainScores);
  if (variance <= 25) return null;

  return {
    type: "DRIFT",
    severity: variance > 45 ? "CRITICAL" : variance > 35 ? "HIGH" : "MEDIUM",
    score: variance,
    source: "diagnostics",
    evidence: ["Domain variance exceeds enforceable threshold — structural drift detected"],
    canonDefinition: "Drift (Def 12): Incremental deviation from mission leading to decay",
  };
}

export function detectAuthorityVacuum(authorityClarity: number): EnforcementSignal | null {
  if (authorityClarity >= 45) return null;

  return {
    type: "AUTHORITY_VACUUM",
    severity: authorityClarity < 25 ? "CRITICAL" : "HIGH",
    score: authorityClarity,
    source: "mandate",
    evidence: ["Authority clarity below enforceable threshold — governance vacuum detected"],
    canonDefinition: "Sovereignty (Def 27): The highest authority within a defined domain",
  };
}

export function detectRiskExposure(exposureScore: number): EnforcementSignal | null {
  if (exposureScore <= 50) return null;

  return {
    type: "RISK_EXPOSURE",
    severity: exposureScore > 75 ? "CRITICAL" : "HIGH",
    score: exposureScore,
    source: "exposure",
    evidence: ["Exposure exceeds risk threshold — institutional exposure detected"],
    canonDefinition: "Risk (Def 25): Misalignment quantified under uncertainty",
  };
}

export function detectPressureOverload(pressure: number, coherence: number): EnforcementSignal | null {
  if (pressure <= 70 || coherence >= 50) return null;

  return {
    type: "PRESSURE_OVERLOAD",
    severity: pressure > 85 ? "CRITICAL" : "HIGH",
    score: pressure,
    source: "intake",
    evidence: ["Pressure exceeds structural coherence capacity — overload condition"],
    canonDefinition: "Pressure (Def 22): Forces that reveal structural integrity or weakness",
  };
}

export function detectMisalignment(resonance: number, certainty: number): EnforcementSignal | null {
  if (resonance < 7 || certainty > 3) return null;
  const gap = resonance - certainty;

  return {
    type: "MISALIGNMENT",
    severity: gap > 6 ? "HIGH" : "MEDIUM",
    score: gap * 10,
    source: "purpose",
    evidence: ["Structural coherence gap detected — false alignment condition"],
    canonDefinition: "Alignment (Def 1): Structural harmony between identity, purpose, values, behaviour",
  };
}

export function detectStructuralFailure(route: string): EnforcementSignal | null {
  if (route !== "REJECT") return null;

  return {
    type: "STRUCTURAL_FAILURE",
    severity: "CRITICAL",
    score: 100,
    source: "constitutional",
    evidence: ["Constitutional route classified as REJECT — structural order has failed"],
    canonDefinition: "Order vs Chaos (Def 40): Every system trends toward chaos unless actively governed",
  };
}
