/**
 * Governed Instrument Contract — shared result shape for all decision instruments.
 *
 * Every instrument must return data conforming to this contract.
 * This ensures consistent behavior across:
 * - Result persistence
 * - History display
 * - Dossier export
 * - Earned progression
 * - Decision Centre integration
 * - Memory write
 */

export type InstrumentEvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "SOURCE_LABELLED"
  | "INSUFFICIENT";

export type GovernedInstrumentResult = {
  instrumentId: string;
  runId: string;
  title: string;
  decisionStatement?: string;
  resultBand: string;
  score?: number;
  evidencePosture: InstrumentEvidencePosture;
  sourceLabels: string[];
  caveats: string[];
  missingEvidence: string[];
  primaryFinding: string;
  consequenceStatement: string;
  nextAdmissibleMove: {
    label: string;
    route?: string;
    gated: boolean;
    reason: string;
  };
  memoryWrite: {
    shouldWrite: boolean;
    memoryType: string;
    summary: string;
  };
  dossier: {
    available: boolean;
    recommendedTitle: string;
  };
};

/**
 * Map any instrument engine result into the governed contract shape.
 * Each engine has its own output type — this normalises for shared consumers.
 */
export function toGovernedResult(input: {
  slug: string;
  title: string;
  decisionStatement?: string;
  band: string;
  score?: number;
  recommendation: string;
  missingEvidence?: string[];
  nextLabel: string;
  nextRoute?: string;
  nextGated?: boolean;
  nextReason?: string;
}): GovernedInstrumentResult {
  return {
    instrumentId: input.slug,
    runId: `${input.slug}:${Date.now()}`,
    title: input.title,
    decisionStatement: input.decisionStatement,
    resultBand: input.band,
    score: input.score,
    evidencePosture: "USER_REPORTED",
    sourceLabels: ["User-reported instrument inputs", "Deterministic scoring engine"],
    caveats: [
      "This is an instrument estimate based on user-reported inputs.",
      "It is not independently verified analysis.",
      "Scores may change if inputs are updated.",
    ],
    missingEvidence: input.missingEvidence ?? [],
    primaryFinding: input.recommendation,
    consequenceStatement: `Based on current inputs, the decision condition is classified as ${input.band.replace(/_/g, " ").toLowerCase()}.`,
    nextAdmissibleMove: {
      label: input.nextLabel,
      route: input.nextRoute,
      gated: input.nextGated ?? false,
      reason: input.nextReason ?? "Earned by instrument completion.",
    },
    memoryWrite: {
      shouldWrite: true,
      memoryType: "instrument_result",
      summary: `${input.title}: ${input.band}${input.score != null ? ` (${input.score}/100)` : ""}`,
    },
    dossier: {
      available: true,
      recommendedTitle: `${input.title} — Decision Dossier`,
    },
  };
}

/**
 * All known instrument slugs in the product line.
 */
export const INSTRUMENT_SLUGS = [
  "decision-exposure-instrument",
  "mandate-clarity-framework",
  "intervention-path-selector",
  "escalation-readiness-scorecard",
  "structural-failure-diagnostic-canvas",
  "execution-risk-index",
  "team-alignment-gap-map",
  "governance-drift-detector",
  "strategic-priority-stack-builder",
  "board-brief-template",
] as const;

export type InstrumentSlug = (typeof INSTRUMENT_SLUGS)[number];

/**
 * Instrument metadata for display and discovery.
 */
export const INSTRUMENT_REGISTRY: Record<InstrumentSlug, {
  title: string;
  category: "signal" | "exposure_risk" | "alignment_authority" | "board_execution";
  price: string;
  timeEstimate: string;
  whatItTests: string;
  whatItProduces: string;
  feedsCorridorSurface: string;
}> = {
  "decision-exposure-instrument": {
    title: "Decision Exposure Instrument",
    category: "exposure_risk",
    price: "£29",
    timeEstimate: "8 min",
    whatItTests: "How exposed is this decision across financial, operational, reputational, strategic, and temporal dimensions",
    whatItProduces: "Exposure score, consequence band, cost projection, recommended next move",
    feedsCorridorSurface: "Executive Reporting",
  },
  "escalation-readiness-scorecard": {
    title: "Escalation Readiness Scorecard",
    category: "exposure_risk",
    price: "£19",
    timeEstimate: "6 min",
    whatItTests: "Whether a decision is ready for escalation to executive, strategy, counsel, or retained review",
    whatItProduces: "Readiness band, escalation path, blockers, evidence gaps",
    feedsCorridorSurface: "Strategy Room / Counsel",
  },
  "structural-failure-diagnostic-canvas": {
    title: "Structural Failure Diagnostic Canvas",
    category: "exposure_risk",
    price: "£19",
    timeEstimate: "8 min",
    whatItTests: "Whether the issue is strategic, operational, authority-based, execution-based, or governance-based",
    whatItProduces: "Failure pattern, root cause, intervention priority, repair path",
    feedsCorridorSurface: "Strategy Room",
  },
  "execution-risk-index": {
    title: "Execution Risk Index",
    category: "exposure_risk",
    price: "£29",
    timeEstimate: "10 min",
    whatItTests: "Whether a decision can survive execution reality across 8 factors",
    whatItProduces: "Risk index, decay projection, authority gap detection, vulnerability assessment",
    feedsCorridorSurface: "Strategy Room / Oversight",
  },
  "team-alignment-gap-map": {
    title: "Team Alignment Gap Map",
    category: "alignment_authority",
    price: "£29",
    timeEstimate: "10 min",
    whatItTests: "Where stated agreement and practical alignment diverge between leader and team",
    whatItProduces: "Alignment score, gap map, misalignment zones, divergence signal",
    feedsCorridorSurface: "Mandate Clarity / Strategy Room",
  },
  "mandate-clarity-framework": {
    title: "Mandate Clarity Framework",
    category: "alignment_authority",
    price: "£49",
    timeEstimate: "12 min",
    whatItTests: "Whether decision ownership, scope, accountability, and delegation are clear",
    whatItProduces: "Clarity score, authority type, misalignment flags, risk level",
    feedsCorridorSurface: "Strategy Room / Boardroom",
  },
  "governance-drift-detector": {
    title: "Governance Drift Detector",
    category: "alignment_authority",
    price: "£49",
    timeEstimate: "12 min",
    whatItTests: "Whether a team or organisation is drifting from its declared governance standard",
    whatItProduces: "Drift score, drift pattern, correction priority, cadence risk",
    feedsCorridorSurface: "Oversight / Portfolio Memory",
  },
  "strategic-priority-stack-builder": {
    title: "Strategic Priority Stack Builder",
    category: "alignment_authority",
    price: "£49",
    timeEstimate: "15 min",
    whatItTests: "How competing priorities rank by governed composite with conflict and resource pressure",
    whatItProduces: "Priority stack, conflict detection, resource pressure, sequencing recommendation",
    feedsCorridorSurface: "Executive Reporting / Board Brief",
  },
  "intervention-path-selector": {
    title: "Intervention Path Selector",
    category: "board_execution",
    price: "£79",
    timeEstimate: "15 min",
    whatItTests: "Which intervention path is risk-adjusted optimal given constraints and stakeholder state",
    whatItProduces: "Ranked intervention path, rejected paths, deployment brief, escalation window",
    feedsCorridorSurface: "Strategy Room / Boardroom",
  },
  "board-brief-template": {
    title: "Board Brief Builder",
    category: "board_execution",
    price: "£129",
    timeEstimate: "20 min",
    whatItTests: "Whether a decision is ready for board-level presentation with objection handling",
    whatItProduces: "Board-ready brief, objection responses, evidence gaps, readiness signal",
    feedsCorridorSurface: "Boardroom / Proof Pack",
  },
};
