export type ConversionTriggerCategory =
  | "diagnostic_escalation"
  | "executive_urgency"
  | "dropoff_reentry";

export type ConversionTrigger = {
  id: string;
  category: ConversionTriggerCategory;
  trigger: string;
  signal: string;
  recommendedAction: string;
  destination:
    | "diagnostics"
    | "executive-reporting"
    | "strategy-room"
    | "membership"
    | "authority-content";
};

export const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    id: "diagnostic-authority-present",
    category: "diagnostic_escalation",
    trigger: "Diagnostic completion with clear authority and visible cost of delay.",
    signal: "The respondent can act or can convene the true decision-maker.",
    recommendedAction: "Escalate to Executive Reporting as the paid interpretation layer.",
    destination: "executive-reporting",
  },
  {
    id: "diagnostic-severity-high",
    category: "diagnostic_escalation",
    trigger: "Diagnostic results indicate institutional drift, fragility, or execution blockage.",
    signal: "The issue is too serious for generic advice but not yet ready for direct intervention.",
    recommendedAction: "Position Executive Reporting as the next disciplined container.",
    destination: "executive-reporting",
  },
  {
    id: "executive-urgency-qualified",
    category: "executive_urgency",
    trigger: "Executive Reporting buyer expresses urgency, consequence, and authority.",
    signal: "There is an active decision window with meaningful downside if delayed.",
    recommendedAction: "Route to Strategy Room qualification and chamber positioning.",
    destination: "strategy-room",
  },
  {
    id: "executive-multi-stakeholder-risk",
    category: "executive_urgency",
    trigger: "The decision affects board, investor, regulator, or senior operator stakeholders.",
    signal: "The interpretation layer reveals coordination or governance risk across multiple actors.",
    recommendedAction: "Escalate toward Strategy Room rather than leaving the issue at report level.",
    destination: "strategy-room",
  },
  {
    id: "dropoff-after-short",
    category: "dropoff_reentry",
    trigger: "Short-form content consumed, but no deeper funnel step taken.",
    signal: "Awareness exists, but seriousness has not yet consolidated.",
    recommendedAction: "Re-enter through Essays or authority-led strategic framework content.",
    destination: "authority-content",
  },
  {
    id: "dropoff-during-diagnostics",
    category: "dropoff_reentry",
    trigger: "Diagnostic session started but not completed.",
    signal: "Interest exists, but cognitive load, fear, or weak urgency blocked progression.",
    recommendedAction: "Re-enter with lower-friction authority content tied back to Diagnostics.",
    destination: "diagnostics",
  },
  {
    id: "dropoff-after-executive-interest",
    category: "dropoff_reentry",
    trigger: "Executive Reporting interest shown but no purchase or intake completion.",
    signal: "The buyer may understand the stakes but has not yet accepted the commercial move.",
    recommendedAction: "Re-enter with case-shaping authority material and clearer urgency framing.",
    destination: "executive-reporting",
  },
];
