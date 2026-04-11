// lib/constitution/risk-signals.ts

export type RiskSignal = {
  id: string;
  label: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
};

export function detectRiskSignals(input: {
  posture: string;
  authorityType: string;
  readinessTier: string;
  failureModeCount: number;
  failureModeSeverity: number;
  narrativeCoherence: number;
  interventionReadiness: number;
}): RiskSignal[] {
  const signals: RiskSignal[] = [];

  if (input.posture === "DISORDERED") {
    signals.push({ id: "posture-disordered", label: "Organisational disorder detected", severity: "CRITICAL" });
  } else if (input.posture === "MISALIGNED") {
    signals.push({ id: "posture-misaligned", label: "Strategic misalignment present", severity: "HIGH" });
  }

  if (input.authorityType === "UNCLEAR") {
    signals.push({ id: "authority-unclear", label: "Decision authority ambiguous", severity: "HIGH" });
  }

  if (input.readinessTier === "FRAGILE") {
    signals.push({ id: "readiness-fragile", label: "Execution readiness is fragile", severity: "HIGH" });
  }

  if (input.failureModeCount >= 4) {
    signals.push({ id: "failure-modes-high", label: `${input.failureModeCount} failure modes active`, severity: "CRITICAL" });
  } else if (input.failureModeCount >= 2) {
    signals.push({ id: "failure-modes-moderate", label: `${input.failureModeCount} failure modes detected`, severity: "MODERATE" });
  }

  if (input.narrativeCoherence < 40) {
    signals.push({ id: "narrative-incoherent", label: "Narrative coherence below threshold", severity: "HIGH" });
  }

  if (input.interventionReadiness < 30) {
    signals.push({ id: "intervention-blocked", label: "Intervention readiness critically low", severity: "CRITICAL" });
  }

  return signals;
}
