import type { ConstitutionalResult } from "./engine";

export function decideRoute(
  input: ConstitutionalResult,
): ConstitutionalResult {
  const disqualifiers: string[] = [];

  // LAW — clarity floor
  if (input.clarity < 35) {
    disqualifiers.push("Clarity below constitutional minimum");
  }

  // LAW — coherence
  if (input.coherence < 25) {
    disqualifiers.push("Critical narrative incoherence");
  }

  // LAW — authority
  if (input.authority === "UNCLEAR") {
    disqualifiers.push("Authority not established");
  }

  let route: ConstitutionalResult["route"] = "DIAGNOSTIC";

  // STRATEGY FLOOR (strict)
  if (
    input.clarity >= 65 &&
    input.coherence >= 50 &&
    input.readinessTier === "EXECUTION_READY" &&
    input.authority === "DIRECT" &&
    input.failureModes.length <= 2 &&
    input.posture !== "DISORDERED"
  ) {
    route = "STRATEGY";
  }

  // REJECTION CONDITIONS
  if (
    input.clarity < 20 ||
    input.failureModes.length >= 4 ||
    input.coherence < 25
  ) {
    route = "REJECT";
  }

  return {
    ...input,
    route,
    disqualifiers,
    confidence: calculateConfidence(input),
  };
}

function calculateConfidence(input: ConstitutionalResult): number {
  let base =
    (input.clarity * 0.4 +
      input.coherence * 0.3 +
      input.readinessScore * 0.3) /
    100;

  if (input.failureModes.length > 2) base -= 0.15;

  return Math.max(0.2, Math.min(0.95, base));
}