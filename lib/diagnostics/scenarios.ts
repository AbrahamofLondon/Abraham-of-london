/**
 * Scenario Bank — deterministic behavioural simulation.
 *
 * Forces choice under constraint. No neutral answers.
 * Compares stated position vs actual response.
 */

import type { SignalKey } from "./signals";

export type ScenarioKey = "TIME_PRESSURE" | "STAKEHOLDER_CONFLICT" | "RESOURCE_CONSTRAINT";

export type ScenarioOption = {
  id: string;
  label: string;
  behaviourTag: string;
};

export type ScenarioDefinition = {
  key: ScenarioKey;
  trigger: (signal: SignalKey) => boolean;
  prompt: string;
  options: ScenarioOption[];
};

export const SCENARIOS: ScenarioDefinition[] = [
  {
    key: "TIME_PRESSURE",
    trigger: (signal) => signal === "AUTHORITY_LEAKAGE" || signal === "EXECUTION_AVOIDANCE",
    prompt: "The decision must be made within 24 hours. No further discussion is possible. What happens next?",
    options: [
      { id: "A", label: "The most senior person makes the decision immediately", behaviourTag: "authority_default" },
      { id: "B", label: "The team attempts to align quickly before acting", behaviourTag: "alignment_delay" },
      { id: "C", label: "The decision is postponed due to lack of clarity", behaviourTag: "avoidance" },
      { id: "D", label: "Responsibility is assigned and the decision proceeds", behaviourTag: "controlled_execution" },
    ],
  },
  {
    key: "STAKEHOLDER_CONFLICT",
    trigger: (signal) => signal === "DEFINITION_FAILURE" || signal === "LATENT_INSTABILITY",
    prompt: "Two senior stakeholders disagree on the outcome. Both expect the decision to go their way. What happens next?",
    options: [
      { id: "A", label: "The decision is escalated further", behaviourTag: "escalation" },
      { id: "B", label: "A compromise is attempted", behaviourTag: "compromise" },
      { id: "C", label: "The decision stalls", behaviourTag: "stall" },
      { id: "D", label: "One authority resolves the conflict decisively", behaviourTag: "decisive_authority" },
    ],
  },
];
