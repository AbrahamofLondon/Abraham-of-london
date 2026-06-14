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
 *
 * Prices: Do NOT hardcode prices here. Use getInstrumentDisplayPrice(slug)
 * from lib/decision-instruments/instrument-catalog-bridge.ts.
 * The INSTRUMENT_REGISTRY.price field is now derived at access time from the
 * catalog via getCatalogPrice(). All price rendering must use that getter.
 */

import { getInstrumentCatalogProduct } from "@/lib/decision-instruments/instrument-catalog-bridge";

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
 *
 * IMPORTANT: Slug must match the URL path segment AND the key in
 * INSTRUMENT_SLUG_TO_CATALOG_CODE in instrument-catalog-bridge.ts.
 * "board-brief-builder" is canonical — "board-brief-template" is a legacy
 * alias and must not be used for new routing or entitlement logic.
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
  "board-brief-builder",
] as const;

export type InstrumentSlug = (typeof INSTRUMENT_SLUGS)[number];

/**
 * Instrument metadata for display and discovery.
 *
 * `catalogCode` links this entry to lib/commercial/catalog.ts.
 * Do NOT add a `price` field here — get prices via:
 *   getInstrumentDisplayPrice(slug) from instrument-catalog-bridge.ts
 */
export const INSTRUMENT_REGISTRY: Record<InstrumentSlug, {
  title: string;
  /** Catalog product code — used to look up price, Stripe IDs, and entitlement slug */
  catalogCode: string;
  category: "signal" | "exposure_risk" | "alignment_authority" | "board_execution";
  timeEstimate: string;
  whatItTests: string;
  whatItProduces: string;
  feedsCorridorSurface: string;
}> = {
  "decision-exposure-instrument": {
    title: "Decision Exposure Instrument",
    catalogCode: "decision_exposure_instrument",
    category: "exposure_risk",
    timeEstimate: "8 min",
    whatItTests: "How exposed is this decision across financial, operational, reputational, strategic, and temporal dimensions",
    whatItProduces: "Exposure score, consequence band, cost projection, recommended next move",
    feedsCorridorSurface: "Executive Reporting",
  },
  "escalation-readiness-scorecard": {
    title: "Escalation Readiness Scorecard",
    catalogCode: "escalation_readiness_scorecard",
    category: "exposure_risk",
    timeEstimate: "6 min",
    whatItTests: "Whether a decision is ready for escalation to executive, strategy, counsel, or retained review",
    whatItProduces: "Readiness band, escalation path, blockers, evidence gaps",
    feedsCorridorSurface: "Strategy Room / Counsel",
  },
  "structural-failure-diagnostic-canvas": {
    title: "Structural Failure Diagnostic Canvas",
    catalogCode: "structural_failure_diagnostic_canvas",
    category: "exposure_risk",
    timeEstimate: "8 min",
    whatItTests: "Whether the issue is strategic, operational, authority-based, execution-based, or governance-based",
    whatItProduces: "Failure pattern, root cause, intervention priority, repair path",
    feedsCorridorSurface: "Strategy Room",
  },
  "execution-risk-index": {
    title: "Execution Risk Index",
    catalogCode: "execution_risk_index",
    category: "exposure_risk",
    timeEstimate: "10 min",
    whatItTests: "Whether a decision can survive execution reality across 8 factors",
    whatItProduces: "Risk index, decay projection, authority gap detection, vulnerability assessment",
    feedsCorridorSurface: "Strategy Room / Oversight",
  },
  "team-alignment-gap-map": {
    title: "Decision Alignment Gap Map",
    catalogCode: "team_alignment_gap_map",
    category: "alignment_authority",
    timeEstimate: "10 min",
    whatItTests: "Where decision owners and affected operators diverge on reality, priority, and action",
    whatItProduces: "Decision alignment score, gap map, divergence zones, correction priority",
    feedsCorridorSurface: "Mandate Clarity / Strategy Room",
  },
  "mandate-clarity-framework": {
    title: "Mandate Clarity Framework",
    catalogCode: "mandate_clarity_framework",
    category: "alignment_authority",
    timeEstimate: "12 min",
    whatItTests: "Whether decision ownership, scope, accountability, and delegation are clear",
    whatItProduces: "Clarity score, authority type, misalignment flags, risk level",
    feedsCorridorSurface: "Strategy Room / Boardroom",
  },
  "governance-drift-detector": {
    title: "Governance Drift Detector",
    catalogCode: "governance_drift_detector",
    category: "alignment_authority",
    timeEstimate: "12 min",
    whatItTests: "Whether a team or organisation is drifting from its declared governance standard",
    whatItProduces: "Drift score, drift pattern, correction priority, cadence risk",
    feedsCorridorSurface: "Oversight / Portfolio Memory",
  },
  "strategic-priority-stack-builder": {
    title: "Strategic Priority Stack Builder",
    catalogCode: "strategic_priority_stack_builder",
    category: "alignment_authority",
    timeEstimate: "15 min",
    whatItTests: "How competing priorities rank by governed composite with conflict and resource pressure",
    whatItProduces: "Priority stack, conflict detection, resource pressure, sequencing recommendation",
    feedsCorridorSurface: "Executive Reporting / Board Brief",
  },
  "intervention-path-selector": {
    title: "Intervention Path Selector",
    catalogCode: "intervention_path_selector",
    category: "board_execution",
    timeEstimate: "15 min",
    whatItTests: "Which intervention path is risk-adjusted optimal given constraints and stakeholder state",
    whatItProduces: "Ranked intervention path, rejected paths, deployment brief, escalation window",
    feedsCorridorSurface: "Strategy Room / Boardroom",
  },
  "board-brief-builder": {
    title: "Board Brief Builder",
    catalogCode: "board_brief_builder",
    category: "board_execution",
    timeEstimate: "20 min",
    whatItTests: "Whether a decision is ready for board-level presentation with objection handling",
    whatItProduces: "Board-facing brief (user-supplied, not independently verified), objection responses, evidence gaps, readiness signal",
    feedsCorridorSurface: "Boardroom / Proof Pack",
  },
};

/**
 * Get the display price for an instrument from the catalog.
 * Use this in all UI rendering — do not use hardcoded price strings.
 *
 * @example
 *   const meta = INSTRUMENT_REGISTRY[slug];
 *   const price = getInstrumentPrice(slug); // "£29"
 */
export function getInstrumentPrice(slug: InstrumentSlug): string {
  const meta = INSTRUMENT_REGISTRY[slug];
  if (!meta) return "";
  try {
    const product = getInstrumentCatalogProduct(slug);
    return product?.displayPrice ?? "";
  } catch {
    return "";
  }
}
