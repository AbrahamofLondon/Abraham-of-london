/**
 * Wave 1 Gold Standard Engine — Trust Surfaces and Decision Instruments.
 *
 * Wave 1 covers the first customer encounters that must reach true 9.8/10:
 * the fast diagnostic result, free/public signal products, decision
 * instruments, and the strategy room session report.
 *
 * Core rule: no Wave 1 product is released merely because it works. A free
 * product costs time, attention, trust, cognitive effort, and decision
 * energy. Every Wave 1 output must pass the time-value surplus test:
 * did the user receive more useful clarity than the time and attention
 * they spent?
 */

export type WaveOneProductFamily =
  | "fast_diagnostic_result"
  | "free_public_signal"
  | "decision_instrument"
  | "strategy_room_session_report";

export type WaveOneCommercialTier = "free" | "paid_entry" | "paid_premium";

export interface WaveOneProduct {
  productCode: string;
  family: WaveOneProductFamily;
  commercialTier: WaveOneCommercialTier;
  requiresCheckout: boolean;
  composerPath: string;
}

const FAST_DIAGNOSTIC_COMPOSER = "lib/product/fast-diagnostic-gold-composer.ts";
const FREE_SIGNAL_COMPOSER = "lib/product/free-signal-gold-composer.ts";
const DECISION_INSTRUMENT_COMPOSER = "lib/product/decision-instrument-gold-composer.ts";
const STRATEGY_ROOM_COMPOSER = "lib/product/strategy-room-session-gold-composer.ts";

/**
 * The explicit Wave 1 product list. Membership is deliberate: these are the
 * trust surfaces and decision instruments named by the Wave 1 mandate.
 */
export const WAVE_ONE_PRODUCTS: WaveOneProduct[] = [
  { productCode: "fast_diagnostic", family: "fast_diagnostic_result", commercialTier: "free", requiresCheckout: false, composerPath: FAST_DIAGNOSTIC_COMPOSER },
  { productCode: "team_assessment", family: "free_public_signal", commercialTier: "free", requiresCheckout: false, composerPath: FREE_SIGNAL_COMPOSER },
  { productCode: "enterprise_assessment", family: "free_public_signal", commercialTier: "free", requiresCheckout: false, composerPath: FREE_SIGNAL_COMPOSER },
  { productCode: "case_dossier_tariff_shock", family: "free_public_signal", commercialTier: "free", requiresCheckout: false, composerPath: FREE_SIGNAL_COMPOSER },
  { productCode: "case_dossier_team_alignment", family: "free_public_signal", commercialTier: "free", requiresCheckout: false, composerPath: FREE_SIGNAL_COMPOSER },
  { productCode: "case_dossier_escalation_denied", family: "free_public_signal", commercialTier: "free", requiresCheckout: false, composerPath: FREE_SIGNAL_COMPOSER },
  { productCode: "personal_decision_audit", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "alignment_audit_playbook", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "drift_detection_framework", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "decision_exposure_instrument", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "escalation_readiness_scorecard", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "execution_integrity_protocol", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "execution_risk_index", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "governance_drift_detector", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "intervention_path_selector", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "mandate_clarity_framework", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "strategic_priority_stack_builder", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "structural_failure_diagnostic_canvas", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "team_alignment_gap_map", family: "decision_instrument", commercialTier: "paid_entry", requiresCheckout: true, composerPath: DECISION_INSTRUMENT_COMPOSER },
  { productCode: "strategy_room", family: "strategy_room_session_report", commercialTier: "paid_premium", requiresCheckout: true, composerPath: STRATEGY_ROOM_COMPOSER },
  { productCode: "strategy_room_extended", family: "strategy_room_session_report", commercialTier: "paid_premium", requiresCheckout: true, composerPath: STRATEGY_ROOM_COMPOSER },
];

export function getWaveOneProduct(productCode: string): WaveOneProduct | null {
  return WAVE_ONE_PRODUCTS.find((product) => product.productCode === productCode) ?? null;
}

export function isWaveOneProduct(productCode: string): boolean {
  return getWaveOneProduct(productCode) !== null;
}

/**
 * Universal Wave 1 output standard. Every Wave 1 result, regardless of
 * family, must resolve to these nine sections before it may be shown to a
 * customer.
 */
export interface WaveOneUniversalOutput {
  productCode: string;
  signalOrDiagnosis: string;
  whyThisMatters: string;
  evidenceOrReasoningBasis: string[];
  decisionFrictionOrContradiction: string;
  consequenceIfIgnored: string;
  oneSpecificNextMove: string;
  whatThisDoesNotProve: string;
  escalationTrigger: string;
  optionalDeeperRoute: string;
}

export const WAVE_ONE_UNIVERSAL_SECTIONS = [
  "signalOrDiagnosis",
  "whyThisMatters",
  "evidenceOrReasoningBasis",
  "decisionFrictionOrContradiction",
  "consequenceIfIgnored",
  "oneSpecificNextMove",
  "whatThisDoesNotProve",
  "escalationTrigger",
  "optionalDeeperRoute",
] as const satisfies readonly (keyof WaveOneUniversalOutput)[];

/**
 * Phrases that mark an output as vague, generic, or marketing disguised as
 * diagnosis. Any output containing one of these fails validation outright.
 */
export const WAVE_ONE_BANNED_PHRASES = [
  "consider exploring",
  "you may want to consider",
  "it depends on your situation",
  "every business is different",
  "in today's fast-paced world",
  "unlock your potential",
  "game-changing",
  "take it to the next level",
  "leverage synergies",
  "best-in-class solution",
  "don't miss out",
  "limited time",
  "act now",
  "sign up today",
] as const;

/**
 * Pressure language is banned from the deeper route specifically: the route
 * to deeper support must exist without manipulative urgency.
 */
export const WAVE_ONE_PRESSURE_PHRASES = [
  "act now",
  "don't miss",
  "limited time",
  "before it's too late",
  "only today",
  "last chance",
  "you cannot afford not to",
] as const;

export type WaveOneScoringDimension =
  | "time_respect"
  | "clarity_gain"
  | "specificity"
  | "decision_usefulness"
  | "evidence_reasoning_basis"
  | "actionability"
  | "trust_and_authority"
  | "experience_quality"
  | "time_value_surplus"
  | "reuse_value";

export const WAVE_ONE_SCORING_DIMENSIONS: WaveOneScoringDimension[] = [
  "time_respect",
  "clarity_gain",
  "specificity",
  "decision_usefulness",
  "evidence_reasoning_basis",
  "actionability",
  "trust_and_authority",
  "experience_quality",
  "time_value_surplus",
  "reuse_value",
];

export const WAVE_ONE_GOLD_THRESHOLD = 9.8;
export const WAVE_ONE_CRITICAL_DIMENSION_MINIMUM = 9.5;

/**
 * Wave 1 can certify internally only. Internal certification is necessary
 * but not sufficient for release: gold requires external proof through the
 * external product value benchmark (actual rendered output, anti-toy test,
 * red-team review, market comparison). Externally proven gold or blocked.
 */
export type WaveOneReleaseStatus = "internally_certified" | "blocked_from_release";

export interface WaveOneValidationResult {
  productCode: string;
  passes: boolean;
  failures: string[];
}

const MINIMUM_SECTION_LENGTH = 24;
const MINIMUM_NEXT_MOVE_LENGTH = 32;

/**
 * Validates a composed Wave 1 output against the universal standard.
 * This is the runtime gate: a composer may build an output, but the output
 * may not be surfaced to a customer unless this validation passes.
 */
export function validateWaveOneUniversalOutput(output: WaveOneUniversalOutput): WaveOneValidationResult {
  const failures: string[] = [];

  for (const section of WAVE_ONE_UNIVERSAL_SECTIONS) {
    const value = output[section];
    if (Array.isArray(value)) {
      if (value.length === 0) failures.push(`${section}: empty — every Wave 1 output must state its evidence or reasoning basis.`);
      if (value.some((entry) => entry.trim().length < 8)) failures.push(`${section}: contains an entry too thin to count as evidence or reasoning.`);
      continue;
    }
    if (value.trim().length === 0) {
      failures.push(`${section}: empty — vague endings and missing sections are not permitted.`);
    } else if (value.trim().length < MINIMUM_SECTION_LENGTH) {
      failures.push(`${section}: too short to carry a concrete, specific statement.`);
    }
  }

  const flattened = [
    output.signalOrDiagnosis,
    output.whyThisMatters,
    ...output.evidenceOrReasoningBasis,
    output.decisionFrictionOrContradiction,
    output.consequenceIfIgnored,
    output.oneSpecificNextMove,
    output.whatThisDoesNotProve,
    output.escalationTrigger,
    output.optionalDeeperRoute,
  ].join(" ").toLowerCase();

  for (const phrase of WAVE_ONE_BANNED_PHRASES) {
    if (flattened.includes(phrase)) failures.push(`Banned generic phrasing detected: "${phrase}".`);
  }

  const deeperRoute = output.optionalDeeperRoute.toLowerCase();
  for (const phrase of WAVE_ONE_PRESSURE_PHRASES) {
    if (deeperRoute.includes(phrase)) failures.push(`Manipulative pressure in deeper route: "${phrase}".`);
  }

  const nextMove = output.oneSpecificNextMove.trim();
  if (nextMove.length < MINIMUM_NEXT_MOVE_LENGTH) {
    failures.push("oneSpecificNextMove: not specific enough — the user must be able to act on it directly.");
  }
  if (/^(consider|maybe|perhaps|possibly)\b/i.test(nextMove)) {
    failures.push("oneSpecificNextMove: opens with hedging — a next move must be a directive, not a suggestion to consider.");
  }

  return { productCode: output.productCode, passes: failures.length === 0, failures };
}

export interface WaveOneTimeValueSurplus {
  minutesAskedOfUser: number;
  clarityReturned: string;
  nextMoveReturned: string;
  surplusJustification: string;
}

/**
 * The time-value surplus test. A free product is not free: it costs time,
 * attention, trust, cognitive effort, and decision energy.
 */
export function assessTimeValueSurplus(
  output: WaveOneUniversalOutput,
  minutesAskedOfUser: number,
): WaveOneTimeValueSurplus & { passes: boolean } {
  const validation = validateWaveOneUniversalOutput(output);
  const withinBudget = minutesAskedOfUser > 0 && minutesAskedOfUser <= 15;
  return {
    minutesAskedOfUser,
    clarityReturned: output.signalOrDiagnosis,
    nextMoveReturned: output.oneSpecificNextMove,
    surplusJustification: withinBudget
      ? `The user spends at most ${minutesAskedOfUser} minutes and leaves with a named diagnosis, its consequence, one directive next move, an honest limit, and an escalation trigger.`
      : `The product asks for ${minutesAskedOfUser} minutes, which exceeds the Wave 1 attention budget for a low-friction result.`,
    passes: validation.passes && withinBudget,
  };
}
