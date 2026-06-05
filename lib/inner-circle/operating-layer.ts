import crypto from "crypto";

export type PressureLevel = "GREEN" | "AMBER" | "RED";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AccessState = "Reader" | "Instrument User" | "Council Candidate";
export type ToolStatus = "active" | "planned" | "restricted";

export type ProductRoute = {
  label: string;
  href: string;
  reason: string;
  productKey:
    | "free-account"
    | "rise-decay-scorecard"
    | "boardroom-brief"
    | "strategy-room"
    | "enterprise-scan"
    | "retainer-oversight"
    | "inner-circle";
};

export type PressureSignalResult = {
  pressureLevel: PressureLevel;
  consequenceWarning: string;
  firstWeaknessLikelyToBreak: string;
  recommendedNextStep: string;
  route: ProductRoute;
  shareCard: {
    title: string;
    pressureLevel: PressureLevel;
    warning: string;
    nextStep: string;
  };
  safeMetrics: {
    wordCount: number;
    charCount: number;
    containsEnterpriseSignal: boolean;
  };
};

export type PressureSignalRefusal = {
  error: "INPUT_TOO_WEAK";
  message: string;
  nextAdmissibleInput: string;
};

export type RiseDecayAnswers = {
  authorityClarity: number;
  decisionLatency: number;
  founderDependency: number;
  evidenceQuality: number;
  operatingCadence: number;
  capitalConstraint: number;
  cultureUnderPressure: number;
  recoveryReadiness: number;
  teamOrEnterpriseSignal?: boolean;
  governanceRecurrence?: boolean;
};

export type RiseDecayScoreResult = {
  score: number;
  riskLevel: RiskLevel;
  weakestDomains: string[];
  recommendedNextAction: string;
  route: ProductRoute;
  councilCandidate: boolean;
  enterpriseIndicator: boolean;
  governanceRecurrence: boolean;
};

export const ACTIVE_READING_PATH = "founder-under-pressure";

export const readingPaths = [
  {
    slug: "founder-under-pressure",
    label: "Founder Under Pressure",
    status: "active",
    diagnostic: "rise-decay-scorecard",
    tool: "Rise-Decay Scorecard",
    briefs: [
      "/vault/briefs/frontier-resilience-founder-endurance-is-not-a-plan",
      "/vault/briefs/frontier-resilience-fragility-of-unowned-decisions",
      "/vault/briefs/frontier-resilience-decision-latency-as-hidden-risk",
      "/vault/briefs/frontier-resilience-stress-reveals-the-real-culture",
      "/vault/briefs/brief-010-geometry-of-inner-circle",
    ],
    actionSequence: [
      "identify-current-decision-bottleneck",
      "identify-one-unowned-decision",
      "identify-founder-dependent-judgment-area",
      "complete-rise-decay-scorecard",
      "choose-one-governance-repair-action",
    ],
  },
  { slug: "household-order", label: "Household Order", status: "planned" },
  { slug: "capital-and-sovereignty", label: "Capital and Sovereignty", status: "planned" },
  { slug: "decision-rights", label: "Decision Rights", status: "planned" },
  { slug: "crisis-and-recovery", label: "Crisis and Recovery", status: "planned" },
  { slug: "legacy-transmission", label: "Legacy Transmission", status: "planned" },
  { slug: "inner-circle-formation", label: "Inner Circle Formation", status: "planned" },
] as const;

export const companionTools: Array<{
  slug: string;
  title: string;
  status: ToolStatus;
  feeds: string[];
  purpose: string;
}> = [
  {
    slug: "rise-decay-scorecard",
    title: "Rise-Decay Scorecard",
    status: "active",
    feeds: ["Boardroom Brief", "Inner Circle", "Purpose Alignment"],
    purpose: "Measure structural drift and institutional health.",
  },
  {
    slug: "decision-rights-charter",
    title: "Decision Rights Charter",
    status: "planned",
    feeds: ["Boardroom Brief", "Strategy Room"],
    purpose: "Clarify ownership, vetoes, authority lines, and unowned decisions.",
  },
  {
    slug: "frontier-resilience-stress-test",
    title: "Frontier Resilience Stress Test",
    status: "planned",
    feeds: ["Strategy Room", "Retainer Oversight"],
    purpose: "Measure pressure exposure, key-person fragility, decision latency, information strain, and recovery readiness.",
  },
  { slug: "key-person-risk-scorecard", title: "Key-Person Risk Scorecard", status: "restricted", feeds: ["Strategy Room"], purpose: "Planned restricted companion." },
  { slug: "signal-discipline-standards", title: "Signal Discipline Standards", status: "restricted", feeds: ["Boardroom Brief"], purpose: "Planned restricted companion." },
  { slug: "cadence-health-checklist", title: "Cadence Health Checklist", status: "restricted", feeds: ["Retainer Oversight"], purpose: "Planned restricted companion." },
  { slug: "crisis-loop-interruption-protocol", title: "Crisis Loop Interruption Protocol", status: "restricted", feeds: ["Strategy Room"], purpose: "Planned restricted companion." },
  { slug: "legacy-ledger-template", title: "Legacy Ledger Template", status: "restricted", feeds: ["Inner Circle"], purpose: "Planned restricted companion." },
  { slug: "inner-circle-council-charter", title: "Inner Circle Council Charter", status: "restricted", feeds: ["Private Council"], purpose: "Planned restricted companion." },
  { slug: "covenantal-oath-template", title: "Covenantal Oath Template", status: "restricted", feeds: ["Private Council"], purpose: "Planned restricted companion." },
];

export const founderUnderPressureWorksheet = [
  "Identify current decision bottleneck",
  "Identify one unowned decision",
  "Identify one founder-dependent judgment area",
  "Complete Rise-Decay Scorecard",
  "Choose one governance repair action",
] as const;

function hasAny(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

export function hashSensitiveInput(input: string): string {
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

export function evaluatePressureSignal(rawInput: string): PressureSignalResult | PressureSignalRefusal {
  const input = rawInput.trim();
  const words = input.split(/\s+/).filter(Boolean);

  if (input.length < 36 || words.length < 7) {
    return {
      error: "INPUT_TOO_WEAK",
      message: "The concern is too vague to produce a responsible pressure signal.",
      nextAdmissibleInput: "Name the decision, the pressure, who can decide, and what breaks if the decision is delayed.",
    };
  }

  const hasDecision = hasAny(input, /\b(decide|decision|approve|reject|delay|launch|stop|hire|fire|sign|commit|invest|settle|escalate|choose)\b/i);
  const hasStakes = hasAny(input, /\b(risk|cost|loss|revenue|client|legal|regulator|cash|runway|deadline|damage|reputation|exposure|consequence|board)\b/i);

  if (!hasDecision || !hasStakes) {
    return {
      error: "INPUT_TOO_WEAK",
      message: "The system can see concern, but not a decision-grade pressure point.",
      nextAdmissibleInput: "Rewrite it as: We need to decide whether to [action], but [blocker], because [consequence].",
    };
  }

  const urgent = (input.match(/\b(today|tomorrow|urgent|asap|overdue|deadline|critical|immediate|this week|late)\b/gi) ?? []).length;
  const stakes = (input.match(/\b(board|investor|legal|regulator|compliance|revenue|cash|runway|client|reputation|penalty|lawsuit|breach|funding)\b/gi) ?? []).length;
  const stuck = (input.match(/\b(avoiding|delaying|stuck|blocked|split|unclear|waiting|stalling|disagree|conflict|no owner|unowned)\b/gi) ?? []).length;
  const evidence = (input.match(/\b(assume|guess|not sure|unknown|missing|no evidence|lack|unproven|waiting for data|bad information)\b/gi) ?? []).length;
  const authority = (input.match(/\b(authority|owner|approval|sign.?off|mandate|permission|who decides|accountable|responsible|board|ceo|founder|committee)\b/gi) ?? []).length;
  const enterprise = hasAny(input, /\b(board|enterprise|team|department|executive|leadership|manager|organisation|organization|stakeholder|committee)\b/i);

  const score = urgent * 3 + stakes * 2 + stuck * 2 + evidence + authority + (enterprise ? 2 : 0);
  const pressureLevel: PressureLevel = score >= 12 ? "RED" : score >= 6 ? "AMBER" : "GREEN";

  const firstWeaknessLikelyToBreak =
    authority > 0 || stuck > 0
      ? "Decision rights and ownership clarity."
      : evidence > 0
        ? "Signal quality and evidence discipline."
        : enterprise
          ? "Escalation cadence across the leadership system."
          : "Follow-through cadence after the first decision.";

  const consequenceWarning =
    pressureLevel === "RED"
      ? "This pressure is likely already narrowing options. Delay may turn a governed choice into damage control."
      : pressureLevel === "AMBER"
        ? "This pressure is material but still recoverable if authority, evidence, and timing are tightened now."
        : "This pressure is currently governable, but should be tracked before drift becomes normal.";

  const recommendedNextStep =
    pressureLevel === "RED"
      ? "Escalate into a board-ready challenge brief before another informal decision cycle begins."
      : pressureLevel === "AMBER"
        ? "Save the decision and complete the Rise-Decay Scorecard to locate the structural weakness."
        : "Create a free account and track whether this pressure repeats over the next review cycle.";

  const route =
    pressureLevel === "RED"
      ? productRoute("strategy-room")
      : pressureLevel === "AMBER"
        ? productRoute("rise-decay-scorecard")
        : productRoute("free-account");

  return {
    pressureLevel,
    consequenceWarning,
    firstWeaknessLikelyToBreak,
    recommendedNextStep,
    route,
    shareCard: {
      title: "Decision Pressure Signal",
      pressureLevel,
      warning: consequenceWarning,
      nextStep: recommendedNextStep,
    },
    safeMetrics: {
      wordCount: words.length,
      charCount: input.length,
      containsEnterpriseSignal: enterprise,
    },
  };
}

export function normaliseRiseDecayAnswers(input: Partial<RiseDecayAnswers>): RiseDecayAnswers {
  const clamp = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 3;
    return Math.min(5, Math.max(1, Math.round(n)));
  };

  return {
    authorityClarity: clamp(input.authorityClarity),
    decisionLatency: clamp(input.decisionLatency),
    founderDependency: clamp(input.founderDependency),
    evidenceQuality: clamp(input.evidenceQuality),
    operatingCadence: clamp(input.operatingCadence),
    capitalConstraint: clamp(input.capitalConstraint),
    cultureUnderPressure: clamp(input.cultureUnderPressure),
    recoveryReadiness: clamp(input.recoveryReadiness),
    teamOrEnterpriseSignal: input.teamOrEnterpriseSignal === true,
    governanceRecurrence: input.governanceRecurrence === true,
  };
}

export function scoreRiseDecay(input: Partial<RiseDecayAnswers>, previousHighCriticalCount = 0): RiseDecayScoreResult {
  const answers = normaliseRiseDecayAnswers(input);
  const weighted =
    answers.authorityClarity * 1.3 +
    answers.decisionLatency * 1.15 +
    answers.founderDependency * 1.25 +
    answers.evidenceQuality +
    answers.operatingCadence +
    answers.capitalConstraint +
    answers.cultureUnderPressure * 1.1 +
    answers.recoveryReadiness;

  const score = Math.round((weighted / 8.8) * 20);
  const riskLevel: RiskLevel = score >= 82 ? "Critical" : score >= 64 ? "High" : score >= 42 ? "Medium" : "Low";

  const domainEntries: Array<[string, number]> = [
    ["Authority clarity", answers.authorityClarity],
    ["Decision latency", answers.decisionLatency],
    ["Founder dependency", answers.founderDependency],
    ["Evidence quality", answers.evidenceQuality],
    ["Operating cadence", answers.operatingCadence],
    ["Capital constraint", answers.capitalConstraint],
    ["Culture under pressure", answers.cultureUnderPressure],
    ["Recovery readiness", answers.recoveryReadiness],
  ];

  const weakestDomains = domainEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  const route =
    riskLevel === "Critical"
      ? productRoute("strategy-room")
      : riskLevel === "High"
        ? productRoute("boardroom-brief")
        : productRoute("inner-circle");

  const recommendedNextAction =
    riskLevel === "Critical"
      ? "This has exceeded self-guided review. A Strategy Room intro is recommended."
      : riskLevel === "High"
        ? "This has exceeded self-guided review. A board-ready challenge brief is recommended."
        : riskLevel === "Medium"
          ? "Continue the Founder Under Pressure path and complete one governance repair action within 30 days."
          : "Continue the path and monitor whether this pressure recurs in the next monthly review.";

  return {
    score,
    riskLevel,
    weakestDomains,
    recommendedNextAction,
    route,
    councilCandidate: previousHighCriticalCount + (riskLevel === "High" || riskLevel === "Critical" ? 1 : 0) >= 2,
    enterpriseIndicator: answers.teamOrEnterpriseSignal === true,
    governanceRecurrence: answers.governanceRecurrence === true,
  };
}

export function productRoute(key: ProductRoute["productKey"]): ProductRoute {
  const routes: Record<ProductRoute["productKey"], ProductRoute> = {
    "free-account": {
      productKey: "free-account",
      label: "Create free account",
      href: "/auth/signin?callbackUrl=/inner-circle/dashboard",
      reason: "Save this decision and track it over time.",
    },
    "rise-decay-scorecard": {
      productKey: "rise-decay-scorecard",
      label: "Start Rise-Decay Scorecard",
      href: "/inner-circle/tools/rise-decay-scorecard",
      reason: "Locate the structural weakness behind the pressure.",
    },
    "boardroom-brief": {
      productKey: "boardroom-brief",
      label: "Boardroom Brief",
      href: "/boardroom-brief",
      reason: "Convert the risk into a board-ready challenge dossier.",
    },
    "strategy-room": {
      productKey: "strategy-room",
      label: "Strategy Room",
      href: "/strategy-room",
      reason: "Move severe decision risk into live intervention.",
    },
    "enterprise-scan": {
      productKey: "enterprise-scan",
      label: "Enterprise Scan",
      href: "/diagnostics/enterprise-assessment",
      reason: "Test whether this is isolated or systemic.",
    },
    "retainer-oversight": {
      productKey: "retainer-oversight",
      label: "Retainer Oversight",
      href: "/retainer",
      reason: "Move recurring governance risk into ongoing accountability.",
    },
    "inner-circle": {
      productKey: "inner-circle",
      label: "Continue Inner Circle path",
      href: "/inner-circle/dashboard",
      reason: "Continue self-guided diagnosis, tools, and cadence.",
    },
  };

  return routes[key];
}
