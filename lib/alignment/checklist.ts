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
  { id: "identity_1", domain: "identity", statement: "If someone asked me right now what my actual job is — not my title, but my real function — I could answer in under ten seconds." },
  { id: "identity_2", domain: "identity", statement: "When I look at how I actually spent this week, I can see my mandate in it — not just my reactions." },
  { id: "identity_3", domain: "identity", statement: "I am not following someone else's direction because I lack my own." },

  { id: "decision_1", domain: "decision", statement: "The last decision I made under pressure — I can still explain why it was right, on principle, not just urgency." },
  { id: "decision_2", domain: "decision", statement: "I am not making reactive choices under pressure." },
  { id: "decision_3", domain: "decision", statement: "I can explain why I am doing what I am doing — and the people closest to me would agree with that explanation." },

  { id: "environment_1", domain: "environment", statement: "The five people I spend the most time with are making me sharper, not softer." },
  { id: "environment_2", domain: "environment", statement: "I am not tolerating environments that produce confusion." },
  { id: "environment_3", domain: "environment", statement: "What I read, watch, and listen to is chosen deliberately — not just whatever shows up." },

  { id: "behaviour_1", domain: "behaviour", statement: "If I opened my calendar from the last two weeks, more than half the time served what I say matters long-term." },
  { id: "behaviour_2", domain: "behaviour", statement: "My calendar reflects what I claim matters." },
  { id: "behaviour_3", domain: "behaviour", statement: "I am producing measurable outputs, not just activity." },

  { id: "emotional_order_1", domain: "emotional_order", statement: "When the pressure is real, I still think clearly — I do not collapse or numb out." },
  { id: "emotional_order_2", domain: "emotional_order", statement: "I am not driven by fear, comparison, or validation." },
  { id: "emotional_order_3", domain: "emotional_order", statement: "I recover quickly from disruption without losing direction." },

  { id: "legacy_1", domain: "legacy", statement: "I am building something that outlasts immediate comfort." },
  { id: "legacy_2", domain: "legacy", statement: "My current actions contribute to a long-term structure." },
  { id: "legacy_3", domain: "legacy", statement: "I am actively taking on harder things — not finding reasons to stay comfortable." },
];