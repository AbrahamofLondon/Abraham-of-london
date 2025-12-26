// lib/resources/strategic-frameworks.ts
export type FrameworkTier = "Board" | "Founder" | "Household";
export type FrameworkAccent = "gold" | "emerald" | "blue" | "rose" | "indigo";

export type Framework = {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;

  tier: FrameworkTier[];
  tag: string;

  // Where it came from (Canon → tool)
  canonRoot: string;

  // Public (prelude)
  executiveSummary: string[];
  useWhen: string[];
  inputs: string[];
  outputs: string[];

  // Gated (full dossier)
  operatingLogic: Array<{ title: string; body: string }>;
  applicationPlaybook: Array<{ step: string; detail: string; deliverable: string }>;
  metrics: Array<{ metric: string; whyItMatters: string; reviewCadence: string }>;
  boardQuestions: string[];
  failureModes: string[];
  whatToDoNext: string[];

  // Optional artifact
  artifactHref?: string;

  // UI
  accent: FrameworkAccent;
};

export const LIBRARY_HREF = "/resources/strategic-frameworks";

export const FRAMEWORKS: Framework[] = [
  {
    key: "purpose-pyramid",
    slug: "purpose-pyramid",
    title: "The Purpose Pyramid",
    oneLiner: "A hierarchy that forces clarity: survival → success → significance → legacy.",
    tier: ["Board", "Founder", "Household"],
    tag: "Identity → Assignment → Stewardship",
    canonRoot:
      "Created order implies ordered aims: identity precedes assignment; assignment governs stewardship.",
    executiveSummary: [
      "Purpose is a ranked hierarchy of aims enforced by trade-offs, not a slogan.",
      "Most teams are not under-strategised; they are under-disciplined (no priority stack, no kill list, no cadence).",
      "Incentives reveal the truth: people obey what is rewarded, not what is preached.",
    ],
    useWhen: [
      "You have activity, but no mandate.",
      "Your priorities change weekly and the team is exhausted.",
      "You are growing outputs while shrinking meaning, cohesion, or trust.",
    ],
    inputs: [
      "The stated mission and the real incentives (what gets promoted or funded).",
      "Constraints: cash, regulation, time, capacity, market reality.",
      "A 3–5 year picture of what must be true if the work succeeds.",
    ],
    outputs: [
      "A mandate statement (one paragraph, measurable, non-poetic).",
      "A priority stack (top 5, ranked, with explicit trade-offs).",
      "A kill list (what stops now or next quarter).",
    ],
    operatingLogic: [
      {
        title: "Why a hierarchy",
        body:
          "You cannot pursue every good simultaneously. A hierarchy prevents mission creep by turning philosophy into operational constraint.",
      },
      {
        title: "Trade-offs are the receipt",
        body:
          "Anybody can write purpose. Only leaders who accept trade-offs actually have it. Trade-offs are the proof.",
      },
      {
        title: "Incentives tell the truth",
        body:
          "If your rewards contradict your stated purpose, your purpose becomes theatre. Incentives are the enforcement layer.",
      },
    ],
    applicationPlaybook: [
      {
        step: "Step 1 — Identify the current tier",
        detail:
          "Decide the tier you are actually operating in (not what you wish): Survival (cashflow/compliance/crisis), Success (repeatability/profit), Significance (durable stakeholder value), Legacy (intergenerational durability).",
        deliverable: "One sentence: “We are in ____ tier because ____.”",
      },
      {
        step: "Step 2 — Lock non-negotiables",
        detail:
          "List 3–7 constraints that cannot be violated: regulatory, moral, reputational, covenantal. This blocks clever strategies that destroy trust.",
        deliverable: "Non-negotiables list + owners + enforcement triggers.",
      },
      {
        step: "Step 3 — Build the priority stack",
        detail:
          "Rank five priorities. If you cannot rank them, you do not have priorities—only wishes. Assign owners, metrics, and review dates.",
        deliverable: "Priority stack (P1–P5) with owner + metric + review date.",
      },
      {
        step: "Step 4 — Create the kill list",
        detail:
          "Stop anything that competes with the priority stack. The kill list is compassion: fewer initiatives, higher execution, lower cynicism.",
        deliverable: "Kill list + stop date + stakeholder comms note.",
      },
      {
        step: "Step 5 — Install cadence",
        detail:
          "Weekly: progress and blockers. Monthly: metric review. Quarterly: tier reassessment and trade-off refresh. Without cadence, purpose drifts.",
        deliverable: "Cadence calendar with decision outputs (not updates).",
      },
    ],
    metrics: [
      { metric: "Priority compliance rate", whyItMatters: "Measures discipline: are we executing what we claim matters?", reviewCadence: "Weekly" },
      { metric: "Active initiative count", whyItMatters: "Too many initiatives is a predictable failure mode.", reviewCadence: "Monthly" },
      { metric: "Incentive alignment score", whyItMatters: "If rewards contradict purpose, drift is guaranteed.", reviewCadence: "Quarterly" },
      { metric: "Trust signal proxy", whyItMatters: "Trust collapses late; measure earlier signals (retention, escalations, quality).", reviewCadence: "Quarterly" },
    ],
    boardQuestions: [
      "What tier are we actually in—and what evidence proves it?",
      "Which trade-off did we accept this quarter that proves purpose is real?",
      "Which incentive currently rewards the opposite of what we claim to value?",
      "What are we willing to stop doing—clearly, publicly, permanently?",
    ],
    failureModes: [
      "Confusing identity with marketing language.",
      "Trying to serve every tier at once (you will serve none).",
      "Leaving incentives misaligned with the stated purpose.",
      "Calling it a vision while refusing the sacrifices it requires.",
    ],
    whatToDoNext: [
      "Run a 60-minute Pyramid session and ship the priority stack + kill list.",
      "Convert the stack into a 90-day execution plan with owners and review dates.",
      "If you want speed: bring it into a Strategy Room and produce board-ready artifacts in-session.",
    ],
    artifactHref: "/downloads/decision-log-template.pdf",
    accent: "gold",
  },

  {
    key: "decision-matrix",
    slug: "decision-matrix",
    title: "The Decision Matrix",
    oneLiner: "Decision hygiene: impact, effort, risk, certainty, moral cost—then commit with a review date.",
    tier: ["Board", "Founder"],
    tag: "Governance · Accountability · Speed",
    canonRoot: "Wisdom is applied truth under constraint; governance requires accountable reasoning, not vibes.",
    executiveSummary: [
      "Most bad decisions are not immoral; they are undisciplined—no criteria, no owner, no review date.",
      "The Matrix is a governance tool: it makes reasoning visible and auditable.",
      "A decision without assumptions and triggers is a gamble pretending to be strategy.",
    ],
    useWhen: [
      "You are stuck in analysis paralysis.",
      "Politics is beating evidence and accountability.",
      "You need speed without recklessness.",
    ],
    inputs: [
      "Decision candidates (3–12).",
      "Constraints and non-negotiables.",
      "Risk register: financial, legal, reputational, ethical, operational.",
    ],
    outputs: [
      "Ranked options with rationale (audit trail).",
      "Decision log entry (owner, date, assumptions, triggers).",
      "Review date (how the decision stays alive).",
    ],
    operatingLogic: [
      { title: "Criteria must be explicit", body: "When criteria are hidden, power fills the vacuum. Explicit criteria reduce political drift and improve fairness." },
      { title: "Review dates are humility", body: "Markets move; assumptions decay. A review date is operational intelligence and prevents stubbornness masquerading as conviction." },
      { title: "Moral cost belongs in the model", body: "A decision can be profitable and still be corrupt. Moral cost protects trust, brand durability, and institutional integrity." },
    ],
    applicationPlaybook: [
      { step: "Step 1 — Define the decision", detail: "Write one sentence: “We are deciding whether to ____ by ____ because ____.”", deliverable: "Decision statement + scope boundaries." },
      { step: "Step 2 — Lock constraints", detail: "List constraints and non-negotiables. These become hard filters before scoring begins.", deliverable: "Constraints list; violations eliminated." },
      { step: "Step 3 — Score with agreed meaning", detail: "Score impact, effort, risk, certainty, and moral cost using a shared rubric (what does a 5 mean?).", deliverable: "Rubric + scored options." },
      { step: "Step 4 — Capture assumptions", detail: "For the top option, list the top assumptions that must be true and the evidence status today.", deliverable: "Assumptions list + evidence status." },
      { step: "Step 5 — Triggers + review date", detail: "Define what would change your mind and when you will revisit.", deliverable: "Trigger list + review date + owner." },
    ],
    metrics: [
      { metric: "Decision cycle time", whyItMatters: "Speed without chaos; too slow kills opportunity, too fast kills trust.", reviewCadence: "Monthly" },
      { metric: "Decision reversal rate", whyItMatters: "High reversals indicate weak assumptions or poor evidence discipline.", reviewCadence: "Quarterly" },
      { metric: "Assumption accuracy", whyItMatters: "Improves organisational judgment over time.", reviewCadence: "Quarterly" },
      { metric: "Risk events realised", whyItMatters: "Confirms whether risk assessment is real or ceremonial.", reviewCadence: "Quarterly" },
    ],
    boardQuestions: [
      "What is the real decision—and what are we refusing to decide?",
      "Which assumption is most likely wrong, and what evidence would prove it?",
      "What moral cost are we accepting, and is it compatible with our stated values?",
      "What is the review date—and who owns the revisit?",
    ],
    failureModes: [
      "Scoring without agreeing what the scores mean.",
      "Pretending unknowns are knowns.",
      "Skipping the review date and locking in bad decisions.",
      "Allowing hierarchy to replace evidence.",
    ],
    whatToDoNext: [
      "Apply the Matrix to your top decisions this quarter.",
      "Install a decision log and make it visible in leadership cadence.",
      "If decisions are politically stuck: bring a neutral facilitator into the room.",
    ],
    artifactHref: "/downloads/decision-log-template.pdf",
    accent: "blue",
  },

  {
    key: "legacy-canvas",
    slug: "legacy-canvas",
    title: "The Legacy Canvas",
    oneLiner: "A 4D legacy model: financial, intellectual, relational, spiritual—measured across time horizons.",
    tier: ["Board", "Founder", "Household"],
    tag: "Stewardship · Succession · Durability",
    canonRoot: "Stewardship is time-bound accountability; the future is shaped by today’s formation and discipline.",
    executiveSummary: [
      "Legacy is not a speech; it is a system built in time.",
      "Most leaders track only financial legacy and then act surprised when everything else collapses.",
      "Durability requires multi-dimensional measurement and leading indicators.",
    ],
    useWhen: [
      "You want long-range governance, not short-term adrenaline.",
      "You sense success without meaning is expensive.",
      "You need formation, succession, and durability built into operations.",
    ],
    inputs: [
      "Current state (assets, knowledge, relationships, convictions).",
      "Time horizons (3, 10, 25 years).",
      "Stewardship priorities and constraints.",
    ],
    outputs: [
      "Legacy scorecard (leading indicators).",
      "Succession intent and skills gap analysis.",
      "Formation plan: values, rhythms, boundaries, accountability.",
    ],
    operatingLogic: [
      { title: "Why four dimensions", body: "Money without wisdom is waste. Wisdom without relationships is sterile. Relationships without formation decay. Formation without responsibility becomes self-indulgent." },
      { title: "Why time horizons matter", body: "3 years measures execution. 10 years measures institution-building. 25 years measures what outlives you." },
      { title: "Why leading indicators", body: "Collapse shows up late. Leading indicators surface drift early while correction is still cheap." },
    ],
    applicationPlaybook: [
      { step: "Step 1 — Map the current legacy", detail: "Write current state across the four dimensions with brutal honesty.", deliverable: "One-page Legacy Snapshot." },
      { step: "Step 2 — Define the 25-year anchor", detail: "What must be true in 25 years if stewardship is faithful?", deliverable: "Legacy North Star statement." },
      { step: "Step 3 — Convert to 10-year capabilities", detail: "List capabilities required: governance, culture, succession, knowledge systems.", deliverable: "Capability roadmap." },
      { step: "Step 4 — Install 90-day moves", detail: "Choose three initiatives that compound toward the legacy anchor.", deliverable: "90-day legacy sprint plan." },
      { step: "Step 5 — Cadence + accountability", detail: "Monthly review; quarterly reset; annual deep audit.", deliverable: "Legacy review cadence + owners." },
    ],
    metrics: [
      { metric: "Succession readiness", whyItMatters: "Durability requires transfer, not personality dependence.", reviewCadence: "Quarterly" },
      { metric: "Relational health signals", whyItMatters: "Relational debt is a silent killer of institutions.", reviewCadence: "Quarterly" },
      { metric: "Knowledge capture rate", whyItMatters: "If knowledge is in heads, the institution is fragile.", reviewCadence: "Monthly" },
      { metric: "Formation rhythm adherence", whyItMatters: "Formation is slow; without rhythm it never happens.", reviewCadence: "Monthly" },
    ],
    boardQuestions: [
      "What are we building that still works when we are no longer here?",
      "Where is the institution dependent on one personality?",
      "What relational debt have we accumulated—and what is the repayment plan?",
      "What formation practices are installed, not merely admired?",
    ],
    failureModes: [
      "Treating legacy as branding.",
      "Ignoring relational debt until it becomes crisis.",
      "Outsourcing spiritual and moral formation to chance.",
      "No succession path; everything depends on the founder.",
    ],
    whatToDoNext: [
      "Run the Canvas with leadership and household heads; produce a scorecard.",
      "Install a monthly cadence and assign owners to each dimension.",
      "If you want a board pack: bring it into a Strategy Room and ship it as a governance artifact.",
    ],
    artifactHref: "/downloads/operating-cadence-template.pdf",
    accent: "indigo",
  },
];

export function getFrameworkBySlug(slug: string): Framework | null {
  return FRAMEWORKS.find((f) => f.slug === slug) ?? null;
}

export function getAllFrameworkSlugs(): string[] {
  return FRAMEWORKS.map((f) => f.slug);
}