/**
 * Signal Detector — deterministic signal classification.
 */

import type { SignalKey } from "./signals";
import type { DiagnosticInput } from "./contradictions";

export function detectSignal(input: DiagnosticInput): SignalKey {
  if (input.urgency >= 3 && input.ownershipScore >= 3) {
    return "AUTHORITY_LEAKAGE";
  }
  if (input.clarityScore >= 3 && input.accountabilityScore >= 3) {
    return "DEFINITION_FAILURE";
  }
  if (input.stateScore >= 3) {
    return "EXECUTION_AVOIDANCE";
  }
  return "LATENT_INSTABILITY";
}
