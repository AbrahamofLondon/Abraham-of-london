/* lib/diagnostics/executive-reporting-market-proof.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORTING — MARKET PROOF CONFIG
   Single source of truth for:
   - buyer variants
   - demo scenarios
   - pricing tiers
   - proof language
   --------------------------------------------------------------------------- */

export type ExecutiveBuyerVariant = {
  id: "founder" | "board" | "leadership";
  label: string;
  headline: string;
  subheadline: string;
  pains: string[];
  outcomes: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type ExecutiveDemoScenario = {
  id: string;
  buyer: ExecutiveBuyerVariant["id"];
  title: string;
  label: string;
  context: string;
  trigger: string;
  findings: string[];
  output: string;
};

export type ExecutivePricingTier = {
  id: "signal" | "report" | "mandate";
  label: string;
  title: string;
  price: string;
  positioning: string;
  bestFor: string;
  includes: string[];
  ctaLabel: string;
  ctaHref: string;
  emphasis?: boolean;
};

export type ExecutiveProofBlock = {
  title: string;
  body: string;
};

export const EXECUTIVE_BUYER_VARIANTS: ExecutiveBuyerVariant[] = [
  {
    id: "founder",
    label: "Founder",
    headline: "For founder-led businesses approaching structural complexity",
    subheadline:
      "When the founder can feel drag, but the system cannot yet explain where it lives.",
    pains: [
      "Growth is outpacing internal clarity",
      "Execution feels expensive even when activity is high",
      "Leadership judgement is carrying too much of the organisation",
    ],
    outcomes: [
      "A sharper reading of structural drag",
      "Clear correction priorities before scale compounds error",
      "A report serious enough to guide next moves",
    ],
    ctaLabel: "Request founder review",
    ctaHref: "/consulting/strategy-room",
  },
  {
    id: "board",
    label: "Board",
    headline: "For boards and senior operators requiring disciplined interpretation",
    subheadline:
      "When the issue is too consequential for vague dashboards and too early for blind intervention.",
    pains: [
      "Board visibility exists, but interpretive confidence is weak",
      "Trust, execution, and governance signals are moving out of alignment",
      "Decisions need cleaner evidence and sharper narrative framing",
    ],
    outcomes: [
      "Board-readable diagnostic narrative",
      "Correction architecture before escalation",
      "A clearer bridge from signal to intervention",
    ],
    ctaLabel: "Request board review",
    ctaHref: "/consulting/strategy-room",
  },
  {
    id: "leadership",
    label: "Leadership Team",
    headline: "For leadership teams under pressure from drift, mistrust, and execution drag",
    subheadline:
      "When the problem is no longer motivation, but coherence.",
    pains: [
      "Operating rhythm exists, but coordination is weakening",
      "Decision bottlenecks and ambiguity are slowing execution",
      "Internal confidence is overstating real alignment",
    ],
    outcomes: [
      "Operational reading with domain-level clarity",
      "Cleaner correction priorities",
      "Structured path into intervention if required",
    ],
    ctaLabel: "Request leadership review",
    ctaHref: "/consulting/strategy-room",
  },
];

export const EXECUTIVE_DEMO_SCENARIOS: ExecutiveDemoScenario[] = [
  {
    id: "founder-scale-friction",
    buyer: "founder",
    title: "Founder scale friction",
    label: "Founder Scenario",
    context:
      "A founder-led firm enters a faster growth phase. Revenue is rising, but decisions are becoming heavier and execution feels less reliable.",
    trigger:
      "The founder senses hidden drag, but the team lacks a disciplined way to isolate where the friction actually sits.",
    findings: [
      "Operational Clarity emerged as the weakest domain",
      "Leadership load concentration was compounding system fragility",
      "Execution authority was psychologically assumed, not structurally verified",
    ],
    output:
      "The report clarified where to correct before hiring, restructuring, or accelerating delivery.",
  },
  {
    id: "board-intervention-readiness",
    buyer: "board",
    title: "Board intervention readiness",
    label: "Board Scenario",
    context:
      "A board sees signs of drift across leadership communication, execution confidence, and internal trust, but lacks a coherent reading of severity.",
    trigger:
      "The board needs something sharper than a dashboard and more disciplined than a verbal impression.",
    findings: [
      "Leadership Trust and Strategic Intent were diverging materially",
      "Average dissonance indicated meaningful governance exposure",
      "Intervention became justifiable, but only in a specific order",
    ],
    output:
      "The report gave the board a readable basis for action without resorting to reaction theatre.",
  },
  {
    id: "leadership-coordination-drag",
    buyer: "leadership",
    title: "Leadership coordination drag",
    label: "Leadership Scenario",
    context:
      "A leadership team is active, intelligent, and hardworking, but outcomes no longer reflect the level of effort being expended.",
    trigger:
      "Meetings are full, urgency is high, but progress feels structurally slower than it should.",
    findings: [
      "Cultural Cohesion remained acceptable, but Operational Clarity deteriorated",
      "Human capital strain was amplifying execution inconsistency",
      "The organisation was approaching misalignment, not collapse",
    ],
    output:
      "The report created a correction sequence before the situation hardened into crisis.",
  },
];

export const EXECUTIVE_PRICING_TIERS: ExecutivePricingTier[] = [
  {
    id: "signal",
    label: "Entry Layer",
    title: "Signal Review",
    price: "Paid Entry",
    positioning:
      "For situations that need disciplined reading before deeper reporting or intervention.",
    bestFor:
      "Early-stage ambiguity, directional confusion, or pre-escalation clarity.",
    includes: [
      "Initial signal reading",
      "High-level interpretive summary",
      "Suitability check for full reporting",
    ],
    ctaLabel: "Start with diagnostics",
    ctaHref: "/diagnostics",
  },
  {
    id: "report",
    label: "Flagship",
    title: "Executive Report",
    price: "Premium",
    positioning:
      "The flagship reporting product for serious operators who need a structured reading before intervention.",
    bestFor:
      "Founder, board, or leadership environments where the cost of error justifies disciplined interpretation.",
    includes: [
      "Executive narrative",
      "Domain matrix",
      "Exposure model",
      "Priority stack",
      "Exportable PDF and structured output",
    ],
    ctaLabel: "View flagship product",
    ctaHref: "/diagnostics/executive-reporting",
    emphasis: true,
  },
  {
    id: "mandate",
    label: "Selective",
    title: "Mandate Escalation",
    price: "Governed Escalation",
    positioning:
      "For matters where the consequence is already material and structured intervention is warranted.",
    bestFor:
      "Situations requiring correction architecture, decision design, or governed escalation support.",
    includes: [
      "Strategy Room entry",
      "Intervention design",
      "Structured advisory path",
    ],
    ctaLabel: "Enter Strategy Room",
    ctaHref: "/consulting/strategy-room",
  },
];

export const EXECUTIVE_PROOF_BLOCKS: ExecutiveProofBlock[] = [
  {
    title: "Not another dashboard",
    body:
      "The value is not in decorative visualisation. The value is in disciplined interpretation that helps a serious buyer understand what is wrong, what it is costing, and what must happen next.",
  },
  {
    title: "A cleaner niche",
    body:
      "This product occupies the high-value middle ground between shallow diagnostics and high-cost advisory retainers. That is where much of the real commercial edge sits.",
  },
  {
    title: "Readable by decision-makers",
    body:
      "The report is designed to be board-readable, founder-usable, and operationally meaningful without collapsing into consultancy theatre or technical noise.",
  },
];