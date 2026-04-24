/**
 * Output Composer — assembles the deterministic result.
 *
 * No dynamic sentence generation. No LLM phrasing.
 * Fixed language blocks. Contradiction injected only when true.
 */

import { SIGNALS, type SignalDefinition } from "./signals";
import { CONTRADICTIONS, type DiagnosticInput } from "./contradictions";
import { detectSignal } from "./signal-detector";

export type DiagnosticResult = {
  signal: SignalDefinition;
  contradiction?: string;
  evidence: string[];
  scenario?: {
    prompt: string;
    selectedOption: string;
    behaviourMessage: string;
  };
};

export function composeResult(input: DiagnosticInput): DiagnosticResult {
  const signalKey = detectSignal(input);
  const signal = SIGNALS[signalKey];

  const contradiction = CONTRADICTIONS.find((c) => c.condition(input));

  const evidence = [
    `urgency: ${input.urgency}`,
    `ownership: ${input.ownershipScore}`,
    `state: ${input.stateScore}`,
    `clarity: ${input.clarityScore}`,
    `accountability: ${input.accountabilityScore}`,
  ];

  return {
    signal,
    contradiction: contradiction ? contradiction.message(input) : undefined,
    evidence,
  };
}
