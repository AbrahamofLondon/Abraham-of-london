import type { AlignmentDomain, AlignmentQuestion } from "./types";
export type { AlignmentDomain, AlignmentQuestion };

export const PURPOSE_ALIGNMENT_INSTRUMENT_ID = "IA-PAC-001";
export const PURPOSE_ALIGNMENT_REPORT_VERSION = "1.0.0";

export const ALIGNMENT_DOMAIN_ORDER: AlignmentDomain[] = [
  "identity",
  "decision",
  "environment",
  "behaviour",
  "emotional_order",
  "legacy",
];

export const ALIGNMENT_DOMAIN_LABELS: Record<AlignmentDomain, string> = {
  identity: "Identity & Mandate",
  decision: "Decision Integrity",
  environment: "Environmental Alignment",
  behaviour: "Operational Behaviour",
  emotional_order: "Emotional & Internal Order",
  legacy: "Legacy Orientation",
};

export const PURPOSE_ALIGNMENT_QUESTIONS: AlignmentQuestion[] = [
  { id: "identity_1", domain: "identity", statement: "I can clearly state my current mandate in one sentence." },
  { id: "identity_2", domain: "identity", statement: "My priorities reflect that mandate, not my mood." },
  { id: "identity_3", domain: "identity", statement: "I am not following someone else's direction because I lack my own." },

  { id: "decision_1", domain: "decision", statement: "My recent major decisions align with my stated values." },
  { id: "decision_2", domain: "decision", statement: "I am not making reactive choices under pressure." },
  { id: "decision_3", domain: "decision", statement: "I can explain why I am doing what I am doing." },

  { id: "environment_1", domain: "environment", statement: "My relationships reinforce my direction, not dilute it." },
  { id: "environment_2", domain: "environment", statement: "I am not tolerating environments that produce confusion." },
  { id: "environment_3", domain: "environment", statement: "What I read, watch, and listen to is chosen deliberately — not just whatever shows up." },

  { id: "behaviour_1", domain: "behaviour", statement: "My daily habits move me toward long-term outcomes." },
  { id: "behaviour_2", domain: "behaviour", statement: "My calendar reflects what I claim matters." },
  { id: "behaviour_3", domain: "behaviour", statement: "I am producing measurable outputs, not just activity." },

  { id: "emotional_order_1", domain: "emotional_order", statement: "My emotional state is regulated under pressure." },
  { id: "emotional_order_2", domain: "emotional_order", statement: "I am not driven by fear, comparison, or validation." },
  { id: "emotional_order_3", domain: "emotional_order", statement: "I recover quickly from disruption without losing direction." },

  { id: "legacy_1", domain: "legacy", statement: "I am building something that outlasts immediate comfort." },
  { id: "legacy_2", domain: "legacy", statement: "My current actions contribute to a long-term structure." },
  { id: "legacy_3", domain: "legacy", statement: "I am increasing responsibility, not retreating into ease." },
];