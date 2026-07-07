/**
 * lib/decision-instruments/decision-signal-samples.ts
 *
 * §5 — versioned synthetic sample scenarios for the Decision Signal "View an example"
 * mode. These are ALWAYS clearly labelled as illustrative and never presented as a live
 * customer result. Kept here (versioned + tested) so the example output stays a real
 * computation of a synthetic input — not a hand-written fake.
 */

import type { SignalInput } from "./decision-signal-engine";

export const SAMPLE_LABEL = "Example scenario — illustrative, not based on your organisation.";
export const SAMPLES_VERSION = "1.0.0";

export interface SignalSample {
  id: string;
  title: string;
  input: SignalInput;
}

export const DECISION_SIGNAL_SAMPLES: SignalSample[] = [
  {
    id: "supplier-concentration",
    title: "Single-supplier dependency under time pressure",
    input: {
      decisionStatement: "Whether to keep sourcing a critical component from one supplier while their lead times slip, or qualify a second supplier now.",
      delayCostBand: "HIGH",
      confidenceLevel: 4,
      consequenceIfWrong: "STRUCTURAL",
      urgencyBand: "HIGH",
    },
  },
  {
    id: "overconfident-irreversible",
    title: "High confidence on an irreversible restructure",
    input: {
      decisionStatement: "Whether to consolidate two teams into one and remove a layer of management this quarter.",
      delayCostBand: "MODERATE",
      confidenceLevel: 9,
      consequenceIfWrong: "IRREVERSIBLE",
      urgencyBand: "IMMEDIATE",
    },
  },
  {
    id: "low-pressure-monitor",
    title: "A decision that does not yet warrant paid analysis",
    input: {
      decisionStatement: "Whether to refresh the brand's secondary colour palette ahead of next year.",
      delayCostBand: "LOW",
      confidenceLevel: 7,
      consequenceIfWrong: "REVERSIBLE",
      urgencyBand: "LOW",
    },
  },
];

export function getSample(id: string): SignalSample | null {
  return DECISION_SIGNAL_SAMPLES.find((s) => s.id === id) ?? null;
}
