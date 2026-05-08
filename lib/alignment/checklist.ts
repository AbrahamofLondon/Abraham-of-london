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
  { id: "decision_2", domain: "decision", statement: "The last time I acted under pressure, I chose deliberately — not because the situation cornered me." },
  { id: "decision_3", domain: "decision", statement: "I can explain why I am doing what I am doing — and the people closest to me would agree with that explanation." },

  { id: "environment_1", domain: "environment", statement: "The five people I spend the most time with are making me sharper, not softer." },
  { id: "environment_2", domain: "environment", statement: "I have removed or restructured at least one source of recurring confusion in the past 90 days." },
  { id: "environment_3", domain: "environment", statement: "The environments I operate in were chosen — not inherited and never questioned." },

  { id: "behaviour_1", domain: "behaviour", statement: "If I opened my calendar from the last two weeks, more than half the time served what I say matters long-term." },
  { id: "behaviour_2", domain: "behaviour", statement: "The last commitment I made to someone else — I kept it without reminder or renegotiation." },
  { id: "behaviour_3", domain: "behaviour", statement: "In the last 30 days, I can name one output that moved the condition I say matters." },

  { id: "emotional_order_1", domain: "emotional_order", statement: "When the pressure is real, I still think clearly — I do not collapse or numb out." },
  { id: "emotional_order_2", domain: "emotional_order", statement: "I am not driven by fear, comparison, or validation." },
  { id: "emotional_order_3", domain: "emotional_order", statement: "After the last major disruption, my direction held — I did not start a new plan to avoid finishing the old one." },

  { id: "legacy_1", domain: "legacy", statement: "Something I have built in the past year would still matter if I stepped away from it." },
  { id: "legacy_2", domain: "legacy", statement: "I have made at least one decision this quarter that prioritised long-term structure over short-term comfort." },
  { id: "legacy_3", domain: "legacy", statement: "I am actively taking on harder things — not finding reasons to stay comfortable." },
];