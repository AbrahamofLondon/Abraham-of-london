/**
 * Signal Dictionary — deterministic language system.
 *
 * No generic output. No drift. No LLM feel.
 * Fixed language blocks per signal. Identical inputs = identical output.
 */

export type SignalKey =
  | "AUTHORITY_LEAKAGE"
  | "DEFINITION_FAILURE"
  | "EXECUTION_AVOIDANCE"
  | "LATENT_INSTABILITY";

export type SignalDefinition = {
  key: SignalKey;
  label: string;
  primaryStatement: string;
  decisionStatement: string;
  consequenceStatement: string;
  moveStatement: string;
  boundaryStatement: string;
};

export const SIGNALS: Record<SignalKey, SignalDefinition> = {
  AUTHORITY_LEAKAGE: {
    key: "AUTHORITY_LEAKAGE",
    label: "Authority is unclear under urgency",
    primaryStatement: "Authority is unclear at the point where the decision becomes urgent.",
    decisionStatement: "You must assign decision ownership or accept that this decision will be made without control.",
    consequenceStatement: "This pattern typically results in informal decisions driven by urgency rather than authority.",
    moveStatement: "Within 24 hours, name the person responsible for making this decision and what they can decide without escalation.",
    boundaryStatement: "This signal reflects a decision pattern based on your responses, not a full organisational diagnosis.",
  },
  DEFINITION_FAILURE: {
    key: "DEFINITION_FAILURE",
    label: "The decision is unclear even though ownership exists",
    primaryStatement: "The decision is not clearly defined even though someone is expected to own it.",
    decisionStatement: "You must define the decision outcome before assigning responsibility.",
    consequenceStatement: "Undefined decisions typically stall or produce inconsistent outcomes across stakeholders.",
    moveStatement: "Write the decision outcome in one sentence and confirm agreement from all stakeholders within 48 hours.",
    boundaryStatement: "This signal identifies a definition issue, not the full scope of execution risk.",
  },
  EXECUTION_AVOIDANCE: {
    key: "EXECUTION_AVOIDANCE",
    label: "The decision is known but not progressing",
    primaryStatement: "The decision is understood but is being deferred or avoided.",
    decisionStatement: "You must either act on this decision or explicitly deprioritise it.",
    consequenceStatement: "Deferred decisions typically reappear under increased pressure with reduced options.",
    moveStatement: "Set a decision deadline within 7 days and confirm the next concrete action immediately.",
    boundaryStatement: "This reflects behaviour around execution, not structural capability.",
  },
  LATENT_INSTABILITY: {
    key: "LATENT_INSTABILITY",
    label: "No immediate failure, but conditions are unstable",
    primaryStatement: "The decision appears stable but contains underlying inconsistencies.",
    decisionStatement: "You must validate whether current clarity holds under pressure.",
    consequenceStatement: "Latent instability often becomes visible only when urgency increases.",
    moveStatement: "Test this decision under a real constraint (time, cost, stakeholder pressure) within 7 days.",
    boundaryStatement: "This signal indicates potential instability, not immediate failure.",
  },
};
