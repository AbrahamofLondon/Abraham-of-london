// lib/decision/system-constitution.ts

export type CanonRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type CanonOrgState = "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
export type CanonReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";
export type CanonAuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type CanonPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "SOVEREIGN";
export type CanonTemperature = "COLD" | "WARM" | "HOT" | "SCORCHING";

export type StrategyRoomFieldType = "text" | "textarea" | "email" | "select";

export interface StrategyRoomFieldSpec {
  name: keyof ConstitutionalIntake;
  label: string;
  type: StrategyRoomFieldType;
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
}

export interface ConstitutionalIntake {
  fullName: string;
  email: string;
  organisation: string;
  sector: string;
  revenueBand: string;
  authorityRole: string;
  authorityScope: string;
  urgencyWindow: string;
  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  currentConstraint: string;
  marketExposure: string;
  boardInvolved: string;
}

export interface ConstitutionalAssessment {
  route: CanonRoute;
  orgState: CanonOrgState;
  readinessTier: CanonReadinessTier;
  authorityType: CanonAuthorityType;
  priority: CanonPriority;
  temperature: CanonTemperature;
  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityScore: number;
  revenueScore: number;
  marketRiskBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  revenueBand: "MICRO" | "SMB" | "MID" | "ENTERPRISE" | "WHALE";
  failureModes: string[];
  dominantDomains: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];
  narrativeSummary: string;
  rationale: string[];
}

export interface ConstitutionalAssetCandidate {
  id: string;
  title: string;
  kind: string;
  href?: string;
  metadataConfidence?: number;
  matchScore: number;
  matchReasons: string[];
  decisionTags?: string[];
  worldviewAnchors?: string[];
  requiredInterventions?: string[];
  failureModes?: string[];
  sponsorTypes?: string[];
  sectors?: string[];
  revenueBands?: string[];
  orgStates?: string[];
  readinessTiers?: string[];
  marketRiskBands?: string[];
}

export const STRATEGY_ROOM_FORM_SPEC: StrategyRoomFieldSpec[] = [
  {
    name: "fullName",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "Abraham Adaramola",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
    placeholder: "you@institution.com",
  },
  {
    name: "organisation",
    label: "Organisation / Institution",
    type: "text",
    required: true,
    placeholder: "Company, board, fund, ministry or operating entity",
  },
  {
    name: "sector",
    label: "Sector",
    type: "text",
    required: true,
    placeholder: "Governance, finance, operations, infrastructure, policy...",
  },
  {
    name: "revenueBand",
    label: "Revenue Band",
    type: "select",
    required: true,
    options: [
      { label: "Under £50k", value: "MICRO" },
      { label: "£50k – £250k", value: "SMB" },
      { label: "£250k – £1m", value: "MID" },
      { label: "£1m – £10m", value: "ENTERPRISE" },
      { label: "Above £10m", value: "WHALE" },
    ],
  },
  {
    name: "authorityRole",
    label: "Authority Role",
    type: "text",
    required: true,
    placeholder: "Founder, CEO, Chief of Staff, Director, Board Chair...",
  },
  {
    name: "authorityScope",
    label: "Authority Scope",
    type: "select",
    required: true,
    options: [
      { label: "I decide directly", value: "DIRECT" },
      { label: "I influence and sponsor", value: "PROXY" },
      { label: "I am exploring only", value: "UNCLEAR" },
    ],
  },
  {
    name: "urgencyWindow",
    label: "Urgency Window",
    type: "select",
    required: true,
    options: [
      { label: "Immediate / 30 days", value: "IMMEDIATE" },
      { label: "Quarter / 90 days", value: "NEAR_TERM" },
      { label: "6–12 months", value: "MID_TERM" },
      { label: "Long horizon / strategic", value: "LONG_HORIZON" },
    ],
  },
  {
    name: "problemStatement",
    label: "Problem Statement",
    type: "textarea",
    required: true,
    placeholder:
      "State the actual problem in structural terms, not just symptoms or frustration.",
    helpText:
      "The stronger the articulation, the stronger the diagnosis.",
  },
  {
    name: "symptoms",
    label: "Observed Symptoms",
    type: "textarea",
    required: true,
    placeholder:
      "What are you seeing on the ground: drift, delays, confusion, politics, trust loss, weak execution, revenue pressure...",
  },
  {
    name: "desiredOutcome",
    label: "Desired Outcome",
    type: "textarea",
    required: true,
    placeholder:
      "What decision-quality outcome are you trying to reach?",
  },
  {
    name: "currentConstraint",
    label: "Current Constraint",
    type: "textarea",
    required: true,
    placeholder:
      "What is preventing movement right now: clarity, authority, money, timing, politics, governance, trust...",
  },
  {
    name: "marketExposure",
    label: "Market Exposure",
    type: "select",
    required: true,
    options: [
      { label: "Stable", value: "LOW" },
      { label: "Some volatility", value: "MEDIUM" },
      { label: "Meaningful pressure", value: "HIGH" },
      { label: "Severe instability", value: "CRITICAL" },
    ],
  },
  {
    name: "boardInvolved",
    label: "Board / Senior Stakeholder Involvement",
    type: "select",
    required: true,
    options: [
      { label: "Yes", value: "YES" },
      { label: "No", value: "NO" },
      { label: "Not yet / uncertain", value: "UNCERTAIN" },
    ],
  },
];

const DIRECT_ROLE_WORDS = [
  "founder",
  "owner",
  "ceo",
  "chief executive",
  "managing director",
  "board chair",
  "chairman",
  "chair",
  "president",
  "principal",
];

const PROXY_ROLE_WORDS = [
  "chief of staff",
  "director",
  "vp",
  "vice president",
  "head of",
  "strategy",
  "operations",
  "special projects",
  "programme lead",
  "advisor",
];

const PURPOSE_FAILURE_WORDS = [
  "confused",
  "unclear",
  "misaligned",
  "drift",
  "drifting",
  "fragmented",
  "chaos",
  "politics",
  "trust",
  "incoherent",
  "conflict",
  "stuck",
  "uncertain",
];

const EXECUTION_FAILURE_WORDS = [
  "execution",
  "delivery",
  "delays",
  "cadence",
  "follow-through",
  "ownership",
  "accountability",
  "pipeline",
  "operating rhythm",
];

const GOVERNANCE_FAILURE_WORDS = [
  "board",
  "governance",
  "mandate",
  "sponsor",
  "authority",
  "decision rights",
  "escalation",
  "boundaries",
  "policy",
];

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function scoreTextClarity(text: string): number {
  const len = text.trim().length;
  if (len >= 550) return 90;
  if (len >= 350) return 78;
  if (len >= 220) return 66;
  if (len >= 120) return 52;
  if (len >= 60) return 36;
  return 18;
}

function normalizeRevenueBand(input: string): ConstitutionalAssessment["revenueBand"] {
  const raw = safeText(input).toUpperCase();
  if (["MICRO", "SMB", "MID", "ENTERPRISE", "WHALE"].includes(raw)) {
    return raw as ConstitutionalAssessment["revenueBand"];
  }
  return "SMB";
}

function classifyAuthorityType(
  authorityRole: string,
  authorityScope: string
): CanonAuthorityType {
  const scope = safeText(authorityScope).toUpperCase();
  const role = authorityRole.toLowerCase();

  if (scope === "DIRECT") return "DIRECT";
  if (scope === "PROXY") return "PROXY";

  if (DIRECT_ROLE_WORDS.some((w) => role.includes(w))) return "DIRECT";
  if (PROXY_ROLE_WORDS.some((w) => role.includes(w))) return "PROXY";

  return "UNCLEAR";
}

function revenueScoreFromBand(
  band: ConstitutionalAssessment["revenueBand"]
): number {
  switch (band) {
    case "WHALE":
      return 95;
    case "ENTERPRISE":
      return 82;
    case "MID":
      return 68;
    case "SMB":
      return 52;
    default:
      return 34;
  }
}

function authorityScoreFromType(type: CanonAuthorityType): number {
  switch (type) {
    case "DIRECT":
      return 90;
    case "PROXY":
      return 72;
    default:
      return 34;
  }
}

function severityScoreFromUrgency(window: string, marketExposure: string): number {
  const urgency = safeText(window).toUpperCase();
  const market = safeText(marketExposure).toUpperCase();

  let score = 40;
  if (urgency === "IMMEDIATE") score += 28;
  else if (urgency === "NEAR_TERM") score += 18;
  else if (urgency === "MID_TERM") score += 10;
  else score += 5;

  if (market === "CRITICAL") score += 24;
  else if (market === "HIGH") score += 16;
  else if (market === "MEDIUM") score += 8;

  return Math.min(100, score);
}

function inferGovernanceScore(input: ConstitutionalIntake): number {
  let score = 45;

  if (safeText(input.boardInvolved).toUpperCase() === "YES") score += 10;
  if (classifyAuthorityType(input.authorityRole, input.authorityScope) !== "UNCLEAR") {
    score += 14;
  }
  if (containsAny(input.problemStatement + " " + input.symptoms, GOVERNANCE_FAILURE_WORDS)) {
    score -= 12;
  }
  if (containsAny(input.currentConstraint, ["authority", "sponsor", "board", "mandate"])) {
    score -= 8;
  }

  return Math.max(0, Math.min(100, score));
}

function inferOrgState(input: ConstitutionalIntake): CanonOrgState {
  const corpus = [
    input.problemStatement,
    input.symptoms,
    input.currentConstraint,
    input.desiredOutcome,
  ]
    .map(safeText)
    .join(" ")
    .toLowerCase();

  const severe =
    containsAny(corpus, ["chaos", "collapse", "breakdown", "crisis", "toxic"]) ||
    (containsAny(corpus, PURPOSE_FAILURE_WORDS) &&
      containsAny(corpus, EXECUTION_FAILURE_WORDS) &&
      containsAny(corpus, GOVERNANCE_FAILURE_WORDS));

  if (severe) return "DISORDERED";
  if (
    containsAny(corpus, ["misaligned", "conflict", "trust", "politics", "authority"])
  ) {
    return "MISALIGNED";
  }
  if (containsAny(corpus, ["drift", "unclear", "slipping", "slowed"])) {
    return "DRIFTING";
  }
  return "ORDERED";
}

function inferReadinessTier(args: {
  clarityScore: number;
  authorityType: CanonAuthorityType;
  governanceScore: number;
  orgState: CanonOrgState;
  revenueBand: ConstitutionalAssessment["revenueBand"];
}): CanonReadinessTier {
  const { clarityScore, authorityType, governanceScore, orgState, revenueBand } = args;

  if (
    clarityScore < 38 ||
    authorityType === "UNCLEAR" ||
    governanceScore < 40 ||
    orgState === "DISORDERED"
  ) {
    return "FRAGILE";
  }

  if (
    clarityScore < 55 ||
    governanceScore < 52 ||
    orgState === "MISALIGNED"
  ) {
    return "EMERGING";
  }

  if (clarityScore < 68 || governanceScore < 65 || orgState === "DRIFTING") {
    return "STABILIZING";
  }

  if (revenueBand === "WHALE" && authorityType === "DIRECT" && governanceScore >= 78) {
    return "SOVEREIGN";
  }

  return "EXECUTION_READY";
}

function inferFailureModes(input: ConstitutionalIntake, orgState: CanonOrgState): string[] {
  const corpus = [
    input.problemStatement,
    input.symptoms,
    input.currentConstraint,
    input.desiredOutcome,
  ]
    .map(safeText)
    .join(" ")
    .toLowerCase();

  const modes = new Set<string>();

  if (containsAny(corpus, ["unclear", "confused", "incoherent", "narrative"])) {
    modes.add("Narrative incoherence");
  }
  if (containsAny(corpus, ["trust", "credibility", "confidence"])) {
    modes.add("Trust erosion");
  }
  if (containsAny(corpus, ["authority", "sponsor", "decision rights", "ownership"])) {
    modes.add("Decision-owner ambiguity");
  }
  if (containsAny(corpus, ["execution", "delivery", "cadence", "delay", "follow-through"])) {
    modes.add("Execution fragmentation");
  }
  if (containsAny(corpus, ["misaligned", "strategy", "operations", "disconnect"])) {
    modes.add("Strategic-operational misalignment");
  }
  if (containsAny(corpus, ["board", "governance", "policy", "escalation", "boundary"])) {
    modes.add("Governance erosion");
  }
  if (orgState === "DISORDERED") {
    modes.add("Systemic structural disorder");
  }

  if (modes.size === 0) {
    modes.add("Decision-quality weakness");
  }

  return [...modes];
}

function inferDominantDomains(
  failureModes: string[],
  input: ConstitutionalIntake
): string[] {
  const domains = new Set<string>();

  domains.add("DECISION_QUALITY");

  if (failureModes.some((m) => /narrative|purpose|incoherence/i.test(m))) {
    domains.add("STRATEGIC_INTENT");
  }
  if (failureModes.some((m) => /governance|authority|boundary/i.test(m))) {
    domains.add("GOVERNANCE");
  }
  if (failureModes.some((m) => /trust/i.test(m))) {
    domains.add("LEADERSHIP_TRUST");
    domains.add("CULTURAL_COHESION");
  }
  if (failureModes.some((m) => /execution|operational/i.test(m))) {
    domains.add("OPERATIONAL_CLARITY");
  }

  if (safeText(input.boardInvolved).toUpperCase() === "YES") {
    domains.add("GOVERNANCE");
  }

  return [...domains];
}

function inferRequiredInterventions(
  assessment: Pick<
    ConstitutionalAssessment,
    | "authorityType"
    | "orgState"
    | "readinessTier"
    | "failureModes"
    | "governanceScore"
  >
): string[] {
  const set = new Set<string>();

  if (assessment.authorityType === "UNCLEAR") {
    set.add("Clarify decision owner and sponsor");
  }
  if (assessment.failureModes.some((x) => /narrative/i.test(x))) {
    set.add("Restore narrative coherence and purpose hierarchy");
  }
  if (assessment.failureModes.some((x) => /governance|authority/i.test(x))) {
    set.add("Restore governance discipline");
  }
  if (assessment.failureModes.some((x) => /execution/i.test(x))) {
    set.add("Re-sequence strategic priorities");
    set.add("Stabilise operational cadence");
  }
  if (assessment.failureModes.some((x) => /trust/i.test(x))) {
    set.add("Repair trust before scale");
  }
  if (assessment.orgState === "DISORDERED") {
    set.add("Pause escalation and rebuild institutional order");
  }
  if (assessment.readinessTier === "FRAGILE") {
    set.add("Route through diagnostic clarification before strategy escalation");
  }
  if (assessment.governanceScore < 50) {
    set.add("Define mandate, boundaries and escalation order");
  }

  return [...set];
}

function inferPriority(args: {
  severityScore: number;
  revenueBand: ConstitutionalAssessment["revenueBand"];
  orgState: CanonOrgState;
}): CanonPriority {
  if (args.revenueBand === "WHALE" && args.severityScore >= 78) return "SOVEREIGN";
  if (args.orgState === "DISORDERED" || args.severityScore >= 82) return "CRITICAL";
  if (args.severityScore >= 65) return "HIGH";
  if (args.severityScore >= 48) return "MEDIUM";
  return "LOW";
}

function inferTemperature(
  priority: CanonPriority,
  severityScore: number
): CanonTemperature {
  if (priority === "SOVEREIGN" || severityScore >= 88) return "SCORCHING";
  if (priority === "CRITICAL" || severityScore >= 72) return "HOT";
  if (priority === "HIGH" || severityScore >= 56) return "WARM";
  return "COLD";
}

function inferRoute(args: {
  clarityScore: number;
  authorityType: CanonAuthorityType;
  governanceScore: number;
  orgState: CanonOrgState;
  readinessTier: CanonReadinessTier;
  severityScore: number;
  problemStatement: string;
  desiredOutcome: string;
}): CanonRoute {
  const totalSubstance =
    scoreTextClarity(args.problemStatement) + scoreTextClarity(args.desiredOutcome);

  if (totalSubstance < 70) return "REJECT";

  if (
    args.authorityType === "UNCLEAR" ||
    args.clarityScore < 45 ||
    args.governanceScore < 42
  ) {
    return "DIAGNOSTIC";
  }

  if (args.orgState === "DISORDERED" && args.readinessTier !== "SOVEREIGN") {
    return "DIAGNOSTIC";
  }

  if (
    args.readinessTier === "EXECUTION_READY" ||
    args.readinessTier === "SOVEREIGN"
  ) {
    return "STRATEGY";
  }

  if (args.severityScore >= 70 && args.clarityScore >= 58 && args.authorityType !== "UNCLEAR") {
    return "STRATEGY";
  }

  return "DIAGNOSTIC";
}

function buildNarrativeSummary(assessment: ConstitutionalAssessment): string {
  const routeSentence =
    assessment.route === "STRATEGY"
      ? "The signal is sufficiently coherent for direct strategic engagement."
      : assessment.route === "DIAGNOSTIC"
      ? "The signal is real, but structural readiness is incomplete and requires diagnostic correction before escalation."
      : "The signal is currently below decision-grade threshold and should not be escalated.";

  return [
    `This case presents as ${assessment.orgState.toLowerCase()} with ${assessment.readinessTier.toLowerCase()} readiness.`,
    `Authority is classified as ${assessment.authorityType.toLowerCase()}.`,
    routeSentence,
  ].join(" ");
}

export function deriveConstitutionalAssessment(
  intake: ConstitutionalIntake
): ConstitutionalAssessment {
  const revenueBand = normalizeRevenueBand(intake.revenueBand);
  const authorityType = classifyAuthorityType(
    intake.authorityRole,
    intake.authorityScope
  );
  const clarityScore = Math.min(
    100,
    Math.round(
      (scoreTextClarity(intake.problemStatement) * 0.5 +
        scoreTextClarity(intake.symptoms) * 0.2 +
        scoreTextClarity(intake.desiredOutcome) * 0.2 +
        scoreTextClarity(intake.currentConstraint) * 0.1)
    )
  );
  const governanceScore = inferGovernanceScore(intake);
  const orgState = inferOrgState(intake);
  const severityScore = severityScoreFromUrgency(
    intake.urgencyWindow,
    intake.marketExposure
  );
  const revenueScore = revenueScoreFromBand(revenueBand);
  const readinessTier = inferReadinessTier({
    clarityScore,
    authorityType,
    governanceScore,
    orgState,
    revenueBand,
  });
  const failureModes = inferFailureModes(intake, orgState);
  const dominantDomains = inferDominantDomains(failureModes, intake);
  const requiredInterventions = inferRequiredInterventions({
    authorityType,
    orgState,
    readinessTier,
    failureModes,
    governanceScore,
  });
  const priority = inferPriority({ severityScore, revenueBand, orgState });
  const temperature = inferTemperature(priority, severityScore);
  const route = inferRoute({
    clarityScore,
    authorityType,
    governanceScore,
    orgState,
    readinessTier,
    severityScore,
    problemStatement: intake.problemStatement,
    desiredOutcome: intake.desiredOutcome,
  });

  const rationale = [
    `Clarity score: ${clarityScore}`,
    `Authority type: ${authorityType}`,
    `Governance score: ${governanceScore}`,
    `Org state: ${orgState}`,
    `Readiness tier: ${readinessTier}`,
    `Severity score: ${severityScore}`,
  ];

  return {
    route,
    orgState,
    readinessTier,
    authorityType,
    priority,
    temperature,
    clarityScore,
    authorityScore: authorityScoreFromType(authorityType),
    governanceScore,
    severityScore,
    revenueScore,
    marketRiskBand:
      safeText(intake.marketExposure).toUpperCase() === "CRITICAL"
        ? "CRITICAL"
        : safeText(intake.marketExposure).toUpperCase() === "HIGH"
        ? "HIGH"
        : safeText(intake.marketExposure).toUpperCase() === "MEDIUM"
        ? "MEDIUM"
        : "LOW",
    revenueBand,
    failureModes,
    dominantDomains,
    requiredInterventions,
    sponsorTypes: [authorityType],
    worldviewAnchors: [
      "human-purpose",
      "moral-order",
      "stewardship",
      "truth-discipline",
      "governance",
    ],
    narrativeSummary: buildNarrativeSummary({
      route,
      orgState,
      readinessTier,
      authorityType,
      priority,
      temperature,
      clarityScore,
      authorityScore: authorityScoreFromType(authorityType),
      governanceScore,
      severityScore,
      revenueScore,
      marketRiskBand:
        safeText(intake.marketExposure).toUpperCase() === "CRITICAL"
          ? "CRITICAL"
          : safeText(intake.marketExposure).toUpperCase() === "HIGH"
          ? "HIGH"
          : safeText(intake.marketExposure).toUpperCase() === "MEDIUM"
          ? "MEDIUM"
          : "LOW",
      revenueBand,
      failureModes,
      dominantDomains,
      requiredInterventions,
      sponsorTypes: [authorityType],
      worldviewAnchors: [
        "human-purpose",
        "moral-order",
        "stewardship",
        "truth-discipline",
        "governance",
      ],
      rationale,
    }),
    rationale,
  };
}

export function applyConstitutionalSelectionPolicy(
  assets: ConstitutionalAssetCandidate[],
  assessment: ConstitutionalAssessment,
  limit = 6
): ConstitutionalAssetCandidate[] {
  const sorted = [...assets].sort((a, b) => b.matchScore - a.matchScore);

  const selected: ConstitutionalAssetCandidate[] = [];
  const countsByKind = new Map<string, number>();

  const needsFoundation =
    assessment.failureModes.some((x) => /narrative|purpose|governance|systemic/i.test(x)) ||
    assessment.orgState === "DISORDERED" ||
    assessment.readinessTier === "FRAGILE";

  if (needsFoundation) {
    const foundation = sorted.find(
      (a) =>
        a.kind.toLowerCase() === "doctrine" ||
        a.kind.toLowerCase() === "playbook" ||
        (a.worldviewAnchors || []).length > 0
    );
    if (foundation) {
      selected.push(foundation);
      countsByKind.set(foundation.kind, 1);
    }
  }

  for (const asset of sorted) {
    if (selected.some((x) => x.id === asset.id)) continue;

    const kindCount = countsByKind.get(asset.kind) || 0;
    if (kindCount >= 2) continue;

    if (
      assessment.route === "STRATEGY" &&
      asset.kind.toLowerCase() === "download" &&
      asset.matchScore < 35
    ) {
      continue;
    }

    selected.push(asset);
    countsByKind.set(asset.kind, kindCount + 1);

    if (selected.length >= limit) break;
  }

  return selected.slice(0, limit);
}

export function buildConstitutionalGuidance(
  assessment: ConstitutionalAssessment,
  assets: ConstitutionalAssetCandidate[]
) {
  const nextAction =
    assessment.route === "STRATEGY"
      ? "Proceed to direct strategic engagement with governance-aware framing."
      : assessment.route === "DIAGNOSTIC"
      ? "Run structured diagnostic correction before escalation."
      : "Do not escalate. Require stronger signal, clearer mandate and better articulated decision context.";

  return {
    summary: assessment.narrativeSummary,
    rationale: assessment.rationale,
    recommendations: assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      href: asset.href,
      kind: asset.kind,
      score: asset.matchScore,
      summary: asset.matchReasons.join(" • "),
      reasons: asset.matchReasons,
    })),
    nextAction,
  };
}