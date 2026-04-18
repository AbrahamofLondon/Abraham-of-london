export type FrameworkEntry = {
  name: string;
  category: "diagnostic" | "execution" | "governance" | "decision";
  promise: string;
  misuseWarning: string;
  canonicalCta:
    | "diagnostics"
    | "executive-reporting"
    | "strategy-room"
    | "membership";
};

export const FRAMEWORKS: FrameworkEntry[] = [
  {
    name: "Institutional Drift",
    category: "diagnostic",
    promise: "Diagnose where structural misalignment is eroding execution, clarity, and legitimacy.",
    misuseWarning: "Do not use this as a vague culture complaint label without measurable decision consequences.",
    canonicalCta: "diagnostics",
  },
  {
    name: "Execution Integrity",
    category: "execution",
    promise: "Test whether declared strategy survives constraint, ownership, and operational reality.",
    misuseWarning: "Do not reduce this to productivity language or generic performance improvement.",
    canonicalCta: "executive-reporting",
  },
  {
    name: "Strategic Escalation Ladder",
    category: "decision",
    promise: "Determine when a problem should remain diagnostic, move to interpretation, or escalate to intervention.",
    misuseWarning: "Do not use this to justify premature advisory escalation without authority or urgency.",
    canonicalCta: "executive-reporting",
  },
  {
    name: "Diagnostic Authority",
    category: "diagnostic",
    promise: "Distinguish between signal that is merely interesting and signal that belongs in a decision environment.",
    misuseWarning: "Do not confuse diagnostic visibility with actual authority to act.",
    canonicalCta: "diagnostics",
  },
  {
    name: "Decision Hygiene",
    category: "decision",
    promise: "Force disciplined decision inputs, option boundaries, and trade-off clarity before action.",
    misuseWarning: "Do not use this as a formatting exercise while avoiding the real decision.",
    canonicalCta: "strategy-room",
  },
  {
    name: "Integrity Moat Model",
    category: "governance",
    promise: "Translate trust, credibility, and principled boundaries into durable strategic advantage.",
    misuseWarning: "Do not present integrity as branding language detached from governance behavior.",
    canonicalCta: "membership",
  },
];
