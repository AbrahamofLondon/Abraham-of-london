import { z } from "zod";

import {
  GMI_METHODOLOGY,
  getGmiRubricLabel,
  hasOutcomeEvidenceOrTooEarlyJustification,
  type GmiRubricScore,
} from "./gmi-methodology";
import {
  MARKET_CALL_LEDGER,
  summariseCallReview,
  type MarketCallRecord,
} from "./market-intelligence-call-ledger";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

export type GmiEvidencePosture =
  | "OBSERVED"
  | "HIGH"
  | "MEDIUM"
  | "MONITORING"
  | "SCENARIO"
  | "SPECULATIVE_BLOCKED";

export const GMI_REQUIRED_EDITION_SECTIONS = [
  "COVER_METADATA",
  "LEGAL_BOUNDARY",
  "PRIOR_QUARTER_CALL_REVIEW",
  "BOARD_SUMMARY",
  "OPERATOR_DECISION_INTERFACE",
  "EVIDENCE_POSTURE_INDEX",
  "CORE_THESIS",
  "FALSIFICATION_CONDITIONS",
  "MACRO_SNAPSHOT",
  "CROSS_MARKET_SIGNALS",
  "SCENARIO_FRAMEWORK",
  "SOURCE_APPENDIX",
  "INSTITUTIONAL_RECORD",
] as const;

export const GMI_OPTIONAL_EDITION_SECTIONS = [
  "SECTOR_OPPORTUNITY_MAP",
  "REGIONAL_DEEP_DIVE",
  "SPECIAL_FOCUS",
  "CLIENT_SPECIFIC_ADDENDUM",
] as const;

export type GmiRequiredEditionSection =
  (typeof GMI_REQUIRED_EDITION_SECTIONS)[number];

export type GmiBlockedClaimType =
  | "HARD_MACRO_NUMBER"
  | "HARD_PROBABILITY"
  | "CAPITAL_FLOW_CLAIM"
  | "POLICY_QUOTE"
  | "COUNTRY_OR_SECTOR_CURRENT_DATA";

export type GmiHardClaim = {
  claim: string;
  type: GmiBlockedClaimType;
  sourceRowId?: string | null;
  posture: GmiEvidencePosture;
};

export type GmiScenarioProbability = {
  label: "Base case" | "Downside" | "Upside";
  probability: number;
  methodNote: string;
  keyAssumptions: string[];
  triggerVariables: string[];
  whatChangesThisProbability: string;
};

export type GmiWatchSignal = {
  signal: string;
  currentStatus: string;
  triggerThreshold: string;
  evidencePosture: GmiEvidencePosture;
  actionIfTriggered: string;
};

export type GmiBoardDecision = {
  decision: string;
  timingCondition: string;
  riskIfDelayed: string;
  ownerFunction: string;
  route: "/boardroom-brief" | "/strategy-room" | "/retainer-oversight" | "/executive-reporting";
};

export type GmiOperatorDashboard = {
  editionId: string;
  editionLabel: string;
  watchSignals: GmiWatchSignal[];
  boardDecisions: GmiBoardDecision[];
  scenarioProbabilities: GmiScenarioProbability[];
  falsificationThresholds: Array<{
    threshold: string;
    observableSignal: string;
    reviewTiming: string;
  }>;
  priorCallSummary: ReturnType<typeof summariseCallReview>;
  callLedgerHref: string;
  boardPackHref: string;
  redTeamHref: string;
  estateRoutes: Array<{
    route: string;
    role: string;
  }>;
};

export type GmiEditionInstrument = {
  editionId: string;
  methodologyVersion: string;
  rubricVersion: string;
  requiredSections: Partial<Record<GmiRequiredEditionSection, boolean>>;
  priorCalls: MarketCallRecord[];
  sourceAppendixRows: Array<{ id: string; status: "VERIFIED" | "PENDING" | "BLOCKED" }>;
  hardClaims: GmiHardClaim[];
  scenarioProbabilities: GmiScenarioProbability[];
};

export type GmiEditionValidationResult = {
  releaseReady: boolean;
  blockers: string[];
  warnings: string[];
};

export type PublicGmiCallLedgerEntry = {
  callId: string;
  editionId: string;
  publicationDate: string | null;
  thesis: string;
  category: MarketCallRecord["callType"];
  assetClass: string;
  region: string;
  theme: string;
  confidenceBand: MarketCallRecord["originalConfidence"];
  scenarioLink: string | null;
  reviewWindow: string;
  currentStatus: NonNullable<MarketCallRecord["outcomeStatus"]> | "PENDING_REVIEW";
  currentScore: GmiRubricScore | null;
  scoreLabel: string | null;
  evidenceSources: string[];
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
  versionHistory: NonNullable<MarketCallRecord["versionHistory"]>;
};

function missingRequiredSections(
  sections: GmiEditionInstrument["requiredSections"],
): GmiRequiredEditionSection[] {
  return GMI_REQUIRED_EDITION_SECTIONS.filter((section) => sections[section] !== true);
}

function sourceAppendixReleaseSafe(
  rows: GmiEditionInstrument["sourceAppendixRows"],
): boolean {
  return rows.length > 0 && rows.every((row) => row.status === "VERIFIED");
}

function hardClaimIsSupported(claim: GmiHardClaim): boolean {
  if (claim.posture === "SPECULATIVE_BLOCKED") return false;
  return Boolean(claim.sourceRowId?.trim());
}

function scenarioIsGoverned(scenario: GmiScenarioProbability): boolean {
  return (
    scenario.methodNote.trim().length > 0 &&
    scenario.keyAssumptions.length > 0 &&
    scenario.triggerVariables.length > 0 &&
    scenario.whatChangesThisProbability.trim().length > 0
  );
}

export function validateGmiEditionInstrument(
  edition: GmiEditionInstrument,
): GmiEditionValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (edition.methodologyVersion !== GMI_METHODOLOGY.methodologyVersion) {
    blockers.push("Edition methodologyVersion does not match the locked methodology.");
  }

  if (edition.rubricVersion !== GMI_METHODOLOGY.rubricVersion) {
    blockers.push("Edition rubricVersion does not match the locked scoring rubric.");
  }

  for (const section of missingRequiredSections(edition.requiredSections)) {
    blockers.push(`Missing required GMI section: ${section}`);
  }

  if (edition.priorCalls.length === 0) {
    blockers.push("Prior quarter call review is missing.");
  }

  for (const call of edition.priorCalls) {
    if (!hasOutcomeEvidenceOrTooEarlyJustification(call)) {
      blockers.push(`Call ${call.id} has a score without outcome evidence or a too-early justification.`);
    }
  }

  if (!sourceAppendixReleaseSafe(edition.sourceAppendixRows)) {
    blockers.push("Source appendix is missing or contains pending/blocking rows.");
  }

  for (const claim of edition.hardClaims) {
    if (!hardClaimIsSupported(claim)) {
      blockers.push(`Unsupported hard claim: ${claim.claim}`);
    }
  }

  for (const scenario of edition.scenarioProbabilities) {
    if (!scenarioIsGoverned(scenario)) {
      blockers.push(`Scenario probability lacks method, assumptions, triggers, or change condition: ${scenario.label}`);
    }
  }

  const probabilityTotal = edition.scenarioProbabilities.reduce(
    (sum, scenario) => sum + scenario.probability,
    0,
  );
  if (edition.scenarioProbabilities.length > 0 && probabilityTotal !== 100) {
    warnings.push(`Scenario probabilities sum to ${probabilityTotal}, not 100.`);
  }

  return {
    releaseReady: blockers.length === 0,
    blockers,
    warnings,
  };
}

export function getPublicGmiCallLedger(): PublicGmiCallLedgerEntry[] {
  return (MARKET_CALL_LEDGER as MarketCallRecord[]).map((call) => {
    const record = getMarketIntelligenceRecord(call.reportId);
    const score = call.score ?? null;

    return {
      callId: call.id,
      editionId: call.reportId,
      publicationDate: record?.publishedAt ?? null,
      thesis: call.statement,
      category: call.callType,
      assetClass: call.assetClass ?? "Macro / operating consequence",
      region: call.region ?? "Global",
      theme: call.theme ?? call.callType.toLowerCase().replace(/_/g, " "),
      confidenceBand: call.originalConfidence,
      scenarioLink: call.scenarioLink ?? null,
      reviewWindow: call.expectedReviewWindow,
      currentStatus: call.outcomeStatus ?? "PENDING_REVIEW",
      currentScore: score,
      scoreLabel: score === null ? null : getGmiRubricLabel(score),
      evidenceSources: call.evidenceSources ?? [],
      lastReviewedAt: call.lastReviewedAt ?? null,
      nextReviewDue: call.nextReviewDue ?? call.expectedReviewWindow,
      versionHistory:
        call.versionHistory ??
        [
          {
            version: "1.0.0",
            changedAt: record?.publishedAt ?? "2026-04-08",
            note: "Initial call registered in the GMI verification ledger.",
          },
        ],
    };
  });
}

export const GMI_ESTATE_INTEGRATION_MAP = [
  {
    route: "/intelligence/gmi",
    role: "GMI home: category claim, edition architecture, and buyer orientation.",
  },
  {
    route: "/intelligence/gmi/q2-2026",
    role: "Static operator dashboard for the current draft edition.",
  },
  {
    route: "/intelligence/gmi/calls",
    role: "Public read-only call ledger and track record.",
  },
  {
    route: "/intelligence/gmi/performance",
    role: "Public performance centre: score distribution, failures, carried-forward calls, and methodology versions.",
  },
  {
    route: "/intelligence/gmi/falsification",
    role: "Public falsification register showing what would prove major theses wrong.",
  },
  {
    route: "/intelligence/gmi/methodology",
    role: "Locked methodology, rubric, evidence posture, and release blockers.",
  },
  {
    route: "/intelligence/gmi/operator-brief",
    role: "Free operator brief: summary, watch signals, decisions, and selected prior-call record.",
  },
  {
    route: "/intelligence/gmi/board-pulse",
    role: "Public board-level one-page decision signal.",
  },
  {
    route: "/intelligence/gmi/red-team",
    role: "Governed challenge intake for calls, assumptions, and falsification thresholds.",
  },
  {
    route: "/intelligence/gmi/use-cases",
    role: "Boardroom use cases and commercial routing from public GMI proof to paid depth.",
  },
  {
    route: "/boardroom-brief",
    role: "Board-ready challenge dossier when the dashboard identifies board-level action.",
  },
  {
    route: "/strategy-room",
    role: "Live decision intervention when the dashboard identifies severe strategic consequence.",
  },
] as const;

export function buildGmiOperatorDashboard(
  editionId = "GMI-Q2-2026",
): GmiOperatorDashboard {
  const priorCalls = MARKET_CALL_LEDGER.filter((call) => call.reportId === "GMI-Q1-2026");

  return {
    editionId,
    editionLabel: "Global Market Intelligence Q2 2026 Operator Dashboard",
    watchSignals: [
      {
        signal: "Tariff de-escalation durability",
        currentStatus: "Monitoring policy signal quality rather than headline relief.",
        triggerThreshold: "Sustained reduction in effective tariff burden with implementation detail.",
        evidencePosture: "MONITORING",
        actionIfTriggered: "Reweight supply-chain optionality decisions and update board exposure map.",
      },
      {
        signal: "Dollar weakness under risk-off conditions",
        currentStatus: "Anomalous signal carried from Q1 call ledger.",
        triggerThreshold: "Continued dollar weakness while credit and equity stress remain elevated.",
        evidencePosture: "SCENARIO",
        actionIfTriggered: "Prepare reserve-currency credibility challenge note for Strategy Room review.",
      },
      {
        signal: "Operational optionality premium",
        currentStatus: "Awaiting observable market reward for supply-chain flexibility disclosures.",
        triggerThreshold: "Equity or credit differentiation tied to resilience disclosure quality.",
        evidencePosture: "MEDIUM",
        actionIfTriggered: "Commission Boardroom Brief on exposure, optionality, and capital narrative.",
      },
    ],
    boardDecisions: [
      {
        decision: "Approve supplier-node exposure mapping rather than country-level exposure review.",
        timingCondition: "Before the next procurement or margin-protection cycle.",
        riskIfDelayed: "Board sees geography while operating exposure remains hidden in intermediate nodes.",
        ownerFunction: "Operations / Finance",
        route: "/boardroom-brief",
      },
      {
        decision: "Decide whether resilience disclosure should become part of investor narrative.",
        timingCondition: "Before next reporting cycle.",
        riskIfDelayed: "Market reads cost pressure without seeing optionality discipline.",
        ownerFunction: "CEO / CFO / Investor Relations",
        route: "/boardroom-brief",
      },
      {
        decision: "Set thresholds for strategic inventory, alternate routing, and jurisdictional redundancy.",
        timingCondition: "If tariff uncertainty persists into the decision window.",
        riskIfDelayed: "Optimisation logic keeps overriding survivability logic.",
        ownerFunction: "COO / Supply Chain",
        route: "/strategy-room",
      },
      {
        decision: "Define the macro signals that would change capital allocation timing.",
        timingCondition: "Before approving discretionary expansion or hiring commitments.",
        riskIfDelayed: "Capital deployment remains tied to stale globalisation assumptions.",
        ownerFunction: "Board / Investment Committee",
        route: "/strategy-room",
      },
      {
        decision: "Determine whether recurring macro exposure requires retained oversight cadence.",
        timingCondition: "If two consecutive reviews identify unresolved governance exposure.",
        riskIfDelayed: "Market intelligence remains episodic instead of becoming a management rhythm.",
        ownerFunction: "Board Chair / CEO",
        route: "/retainer-oversight",
      },
    ],
    scenarioProbabilities: [
      {
        label: "Base case",
        probability: 43,
        methodNote:
          "Structured judgement anchored in Q1 scenario model, institutional forecast clustering, and market-implied stress signals.",
        keyAssumptions: ["Managed fragmentation persists", "Policy relief remains partial", "Monetary constraint fades slowly"],
        triggerVariables: ["tariff implementation", "credit spread behaviour", "Fed posture"],
        whatChangesThisProbability:
          "A durable tariff settlement or material credit deterioration would force reweighting.",
      },
      {
        label: "Downside",
        probability: 39,
        methodNote:
          "Planning assumption combining escalation and confidence-fracture branches from the Q1 scenario model.",
        keyAssumptions: ["Tariff stress transmits into margins", "Safe-haven behaviour weakens", "Liquidity preference rises"],
        triggerVariables: ["USD under risk-off", "inflation pass-through", "equity breadth"],
        whatChangesThisProbability:
          "Evidence of contained pass-through and stabilised dollar demand would reduce downside weight.",
      },
      {
        label: "Upside",
        probability: 18,
        methodNote:
          "Scenario assumption for rapid bilateral de-escalation and productivity-offset branch.",
        keyAssumptions: ["De-escalation becomes executable", "AI productivity offsets cost pressure", "Markets reward credible policy repair"],
        triggerVariables: ["formal tariff rollback", "productivity data", "margin resilience"],
        whatChangesThisProbability:
          "Policy headlines without implementation do not change this probability.",
      },
    ],
    falsificationThresholds: [
      {
        threshold: "Tariff burden normalises below structural-impairment levels.",
        observableSignal: "Sustained implemented tariff relief rather than negotiation language.",
        reviewTiming: "Next monthly evidence review and Q3 call review.",
      },
      {
        threshold: "Dollar safe-haven behaviour resumes under risk-off stress.",
        observableSignal: "USD strength returns while equity or credit stress rises.",
        reviewTiming: "Weekly signal monitor during stress periods.",
      },
      {
        threshold: "Markets stop rewarding operational optionality disclosures.",
        observableSignal: "No valuation, credit, or analyst differentiation by resilience posture.",
        reviewTiming: "Q2 close and Q3 publication gate.",
      },
    ],
    priorCallSummary: summariseCallReview(priorCalls),
    callLedgerHref: "/intelligence/gmi/calls",
    boardPackHref: "/api/gmi/board-pack?edition=GMI-Q2-2026&format=pdf",
    redTeamHref: "/intelligence/gmi/red-team",
    estateRoutes: [...GMI_ESTATE_INTEGRATION_MAP],
  };
}

export function buildGmiBoardPackSnapshot(editionId = "GMI-Q2-2026") {
  const dashboard = buildGmiOperatorDashboard(editionId);
  const operatorConsequenceIndex = [
    {
      dimension: "capitalAllocationPressure",
      score: 4,
      rationale: "Expansion and discretionary deployment should be tested against fragmentation and tariff persistence.",
      linkedSignal: "GMI-Q1-2026-CALL-006",
      decisionImplication: "Define macro signals that change capital timing before approving new commitments.",
      route: "escalate to Strategy Room",
    },
    {
      dimension: "marginPressure",
      score: 4,
      rationale: "Tariff pass-through and supplier-node exposure keep margin protection on the board agenda.",
      linkedSignal: "GMI-Q1-2026-CALL-004",
      decisionImplication: "Prepare margin scenarios and owner accountability before the next reporting cycle.",
      route: "prepare",
    },
    {
      dimension: "supplyChainExposure",
      score: 5,
      rationale: "Country-level exposure mapping understates intermediate-node tariff and compliance risk.",
      linkedSignal: "GMI-Q1-2026-CALL-002",
      decisionImplication: "Move supplier-node mapping from analysis to board-level operating requirement.",
      route: "escalate to Boardroom Brief",
    },
    {
      dimension: "policyInstability",
      score: 5,
      rationale: "Tariff regime shifts remain the primary uncertainty driver for Q2 and Q3 decision windows.",
      linkedSignal: "GMI-Q1-2026-CALL-007",
      decisionImplication: "Set observable policy thresholds that would change the current view.",
      route: "decide",
    },
    {
      dimension: "liquidityCreditPressure",
      score: 3,
      rationale: "Credit and liquidity stress are monitored as transmission signals rather than a settled thesis.",
      linkedSignal: "GMI-Q2-SRC-007",
      decisionImplication: "Prepare reporting triggers if credit stress begins altering financing optionality.",
      route: "watch",
    },
    {
      dimension: "boardDecisionUrgency",
      score: 4,
      rationale: "The current intelligence changes governance cadence more than it changes a single forecast.",
      linkedSignal: "GMI-Q1-2026-CALL-001",
      decisionImplication: "Convert GMI into a recurring decision review until Q2 evidence matures.",
      route: "escalate to Executive Reporting / Retainer",
    },
  ] as const;

  return {
    editionId,
    generatedAt: new Date().toISOString(),
    title: `${dashboard.editionLabel} — Board Pack Snapshot`,
    legalBoundary: GMI_METHODOLOGY.legalBoundary,
    watchSignals: dashboard.watchSignals,
    boardDecisions: dashboard.boardDecisions,
    scenarioSummary: dashboard.scenarioProbabilities,
    falsificationThresholds: dashboard.falsificationThresholds,
    operatorConsequenceIndex,
    decisionsToMakeIn30Days: dashboard.boardDecisions.slice(0, 5).map((decision) => ({
      decision: decision.decision,
      whyNow: decision.timingCondition,
      linkedSignal: "GMI call ledger",
      riskIfDelayed: decision.riskIfDelayed,
      suggestedOwner: decision.ownerFunction,
      route: decision.route,
    })),
    decisionsToPrepareIn90Days: [
      {
        decision: "Prepare alternate-routing and jurisdictional redundancy options.",
        preparationRequired: "Map supplier nodes, switching costs, timeline, and contractual constraints.",
        triggerCondition: "Tariff relief remains partial or origin-compliance enforcement tightens.",
        linkedSignal: "GMI-Q1-2026-CALL-007",
        route: "/strategy-room",
      },
    ],
    decisionsToDefer: [
      {
        decision: "Launch interactive scenario tooling.",
        reasonToDefer: "The public track record is not mature enough to justify interactive scenario expansion.",
        whatWouldChange: "Q2 scored, Q3 review rhythm live, and public performance evidence established.",
        reviewDate: "2026-09-30",
      },
    ],
    priorCallSummary: dashboard.priorCallSummary,
    nextActions: [
      { label: "Board-level exposure", href: "/boardroom-brief" },
      { label: "Severe strategic decision", href: "/strategy-room" },
    ],
  };
}

export const redTeamChallengeSchema = z.object({
  callId: z.string().min(6).max(80),
  counterThesis: z.string().min(40).max(2500),
  evidence: z.string().min(40).max(3000),
  sourceLinks: z.array(z.string().url()).min(1).max(5),
  submitterName: z.string().min(2).max(120),
  submitterEmail: z.string().email(),
  consentToPublishIfSelected: z.boolean(),
});

export type GmiRedTeamChallengeInput = z.infer<typeof redTeamChallengeSchema>;

export function validateGmiRedTeamChallenge(input: unknown) {
  const parsed = redTeamChallengeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      accepted: false,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (!parsed.data.consentToPublishIfSelected) {
    return {
      accepted: false,
      issues: ["Consent for publication is required for selected challenges."],
    };
  }

  const callExists = MARKET_CALL_LEDGER.some((call) => call.id === parsed.data.callId);
  if (!callExists) {
    return {
      accepted: false,
      issues: ["Challenge must reference a registered GMI call."],
    };
  }

  return {
    accepted: true,
    issues: [],
    challenge: parsed.data,
  };
}
