/**
 * lib/decision-instruments/decision-signal-engine.ts
 *
 * §4 — the authoritative, input-sensitive Decision Signal engine. Extracted from the
 * page so it is deterministic and testable, and so the same computation can back an
 * authenticated (spine-bound) run later. The free signal is a FIRST reading, not a
 * diagnosis — but it must be genuinely sensitive to the input, surface contradictions
 * the input itself implies, name the evidence gap, and justify why the next move is
 * admissible (and why a bigger intervention is not yet).
 *
 * It never fabricates a polished answer irrespective of input:
 *   • empty/short statement → validation error (no result);
 *   • contradictory band combinations → an explicit contradiction is surfaced;
 *   • very weak evidence (no delay cost, low consequence) → a low-confidence posture;
 *   • the decision statement text influences the evidence-gap + correction framing.
 */

export type Band4 = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type UrgencyBand = "LOW" | "MODERATE" | "HIGH" | "IMMEDIATE";
export type Consequence = "REVERSIBLE" | "COSTLY" | "STRUCTURAL" | "IRREVERSIBLE";

export interface SignalInput {
  decisionStatement: string;
  delayCostBand: Band4;
  confidenceLevel: number; // 0..10
  consequenceIfWrong: Consequence;
  urgencyBand: UrgencyBand;
}

export interface SignalContradiction {
  key: string;
  detail: string;
}

export interface SignalResult {
  pressureBand: Band4;
  compositeScore: number;
  namedSignal: string;
  consequenceWarning: string;
  /** contradictions the input combination implies (may be empty). */
  contradictions: SignalContradiction[];
  /** the single most material missing evidence for a first reading. */
  evidenceGap: string;
  correctionQuestion: string;
  nextAdmissibleMove: { move: string; targetRoute: string; targetLabel: string; whyAdmissible: string };
  /** an intervention that is deliberately NOT recommended yet, with the reason. */
  notYetAdmissible: { move: string; whyNotYet: string } | null;
  evidencePosture: string;
  evidenceConfidence: "LOW" | "MODERATE";
}

export interface SignalValidationError {
  ok: false;
  code: "STATEMENT_REQUIRED" | "STATEMENT_TOO_SHORT" | "CONFIDENCE_OUT_OF_RANGE";
  message: string;
}
export type SignalComputation = { ok: true; result: SignalResult } | SignalValidationError;

export const SIGNAL_ENGINE_VERSION = "1.1.0";

const COST_SCORE: Record<Band4, number> = { LOW: 1, MODERATE: 3, HIGH: 6, CRITICAL: 9 };
const CONSEQUENCE_SCORE: Record<Consequence, number> = { REVERSIBLE: 1, COSTLY: 3, STRUCTURAL: 6, IRREVERSIBLE: 9 };
const URGENCY_SCORE: Record<UrgencyBand, number> = { LOW: 1, MODERATE: 3, HIGH: 6, IMMEDIATE: 9 };

/** Validate raw input. Fail-closed: an empty/short statement yields NO result. */
export function validateSignalInput(input: SignalInput): SignalValidationError | null {
  const s = (input.decisionStatement ?? "").trim();
  if (!s) return { ok: false, code: "STATEMENT_REQUIRED", message: "Describe the decision before generating a signal." };
  if (s.length < 12) return { ok: false, code: "STATEMENT_TOO_SHORT", message: "Add a little more detail — one or two sentences — so the reading is meaningful." };
  if (input.confidenceLevel < 0 || input.confidenceLevel > 10) return { ok: false, code: "CONFIDENCE_OUT_OF_RANGE", message: "Confidence must be between 0 and 10." };
  return null;
}

/** Detect contradictions the input itself implies (surfaced honestly, not invented). */
function detectContradictions(input: SignalInput): SignalContradiction[] {
  const out: SignalContradiction[] = [];
  // High confidence on an irreversible/structural decision that is also urgent+costly:
  if (input.confidenceLevel >= 8 && (input.consequenceIfWrong === "IRREVERSIBLE" || input.consequenceIfWrong === "STRUCTURAL") && (input.urgencyBand === "HIGH" || input.urgencyBand === "IMMEDIATE")) {
    out.push({ key: "confidence_vs_stakes", detail: "You report high confidence, yet the decision is near-irreversible and time-pressured. High confidence under irreversible stakes is where costly errors hide — the confidence itself warrants a second reading." });
  }
  // Immediate urgency but low delay cost: the urgency may be manufactured.
  if (input.urgencyBand === "IMMEDIATE" && input.delayCostBand === "LOW") {
    out.push({ key: "urgency_vs_cost", detail: "The decision is marked immediate, but the cost of delay is low. Urgency without delay cost is often external pressure, not decision pressure — worth separating before acting." });
  }
  // Irreversible consequence but low urgency and low delay cost: under-weighted risk.
  if (input.consequenceIfWrong === "IRREVERSIBLE" && input.urgencyBand === "LOW" && input.delayCostBand === "LOW") {
    out.push({ key: "stakes_vs_attention", detail: "The consequence is irreversible, yet urgency and delay cost are both low. An irreversible decision receiving low attention is a latent exposure." });
  }
  return out;
}

function statementTheme(statement: string): string {
  const s = statement.toLowerCase();
  if (/\b(hire|fire|headcount|team|people|staff|redundan)\b/.test(s)) return "people";
  if (/\b(invest|capital|fund|raise|acqui|buy|sell|price|budget|cost)\b/.test(s)) return "capital";
  if (/\b(launch|product|market|customer|go-to-market|gtm)\b/.test(s)) return "market";
  if (/\b(supplier|vendor|contract|partner|depend)\b/.test(s)) return "dependency";
  if (/\b(comply|regul|legal|govern|risk|audit)\b/.test(s)) return "governance";
  return "general";
}

const EVIDENCE_GAP_BY_THEME: Record<string, string> = {
  people: "The people impact is stated but the reversibility of the team change and the owner accountable for it are not yet evidenced.",
  capital: "The financial stake is implied but the downside scenario and the threshold at which you would stop are not yet evidenced.",
  market: "The market move is described but the falsifiable success condition and the earliest signal of failure are not yet evidenced.",
  dependency: "A dependency is implied but the concentration risk and the fallback path are not yet evidenced.",
  governance: "A governance/compliance dimension is present but the specific obligation and the review owner are not yet evidenced.",
  general: "The single most material missing input is the evidence that would change your mind — the falsification condition is not yet stated.",
};

export function computeSignal(input: SignalInput): SignalResult {
  const costScore = COST_SCORE[input.delayCostBand];
  const consequenceScore = CONSEQUENCE_SCORE[input.consequenceIfWrong];
  const urgencyScore = URGENCY_SCORE[input.urgencyBand];
  const invertedConfidence = 10 - input.confidenceLevel;
  const compositeScore = Math.round((costScore * 0.3 + consequenceScore * 0.3 + urgencyScore * 0.2 + invertedConfidence * 0.2) * 10);

  const contradictions = detectContradictions(input);
  // A live contradiction lifts the pressure floor: an unseen contradiction is itself pressure.
  const contradictionLift = contradictions.length > 0 ? 8 : 0;
  const effective = compositeScore + contradictionLift;

  const pressureBand: Band4 = effective >= 70 ? "CRITICAL" : effective >= 50 ? "HIGH" : effective >= 30 ? "MODERATE" : "LOW";

  const namedSignal: Record<Band4, string> = {
    LOW: "Low pressure — a decision condition exists but is not yet urgent.",
    MODERATE: "Moderate pressure — delay is measurable but not yet structural.",
    HIGH: "High pressure — the decision is approaching a threshold where cost compounds non-linearly.",
    CRITICAL: "Critical pressure — the decision appears overdue and delay is likely compounding.",
  };
  const consequenceWarning: Record<Band4, string> = {
    LOW: "At current levels the primary risk is distraction rather than damage.",
    MODERATE: "If unresolved for another 30 days the cost will be materially higher than today.",
    HIGH: "The consequence of delay is entering structural territory — it will affect more than the original decision.",
    CRITICAL: "The consequence window is closing. What is at stake may not be recoverable if delayed further.",
  };
  const correctionQuestion: Record<Band4, string> = {
    LOW: "What would need to change for this decision to become urgent?",
    MODERATE: "What is the single constraint that, if removed, would let this decision resolve?",
    HIGH: "Who else must be involved before this becomes more expensive than the decision itself?",
    CRITICAL: "What has prevented action so far — and is that reason still valid today?",
  };

  const theme = statementTheme(input.decisionStatement);
  const evidenceGap: string = EVIDENCE_GAP_BY_THEME[theme]
    ?? "The single most material missing input is the evidence that would change your mind — the falsification condition is not yet stated.";

  const nextMoveByBand: Record<Band4, SignalResult["nextAdmissibleMove"]> = {
    LOW: { move: "Monitor. No paid instrument is warranted by this signal alone.", targetRoute: "/decision-instruments/signal", targetLabel: "Re-check when conditions change", whyAdmissible: "The evidence does not yet justify a paid intervention — recommending one would be selling ahead of the signal." },
    MODERATE: { move: "Run the Decision Exposure Instrument to price the full consequence before it compounds.", targetRoute: "/decision-instruments/decision-exposure-instrument", targetLabel: "Decision Exposure Instrument (£29)", whyAdmissible: "Moderate, measurable pressure with an unpriced downside is exactly what the exposure instrument is scoped to quantify." },
    HIGH: { move: "Run the Escalation Readiness Scorecard — this decision may need executive-level attention.", targetRoute: "/decision-instruments/escalation-readiness-scorecard", targetLabel: "Escalation Readiness Scorecard (£19)", whyAdmissible: "High pressure with structural consequence is the threshold at which escalation readiness, not further analysis, is the binding constraint." },
    CRITICAL: { move: "Executive Reporting is warranted — the delay cost is likely compounding.", targetRoute: "/diagnostics/executive-reporting", targetLabel: "Executive Reporting (£295)", whyAdmissible: "Critical, compounding pressure on an irreversible decision justifies a governed executive reading with a checkpoint." },
  };

  // What is deliberately NOT recommended yet — the willingness to not up-sell.
  const notYetAdmissible: SignalResult["notYetAdmissible"] =
    pressureBand === "LOW"
      ? { move: "A full paid diagnosis or Operator Pilot", whyNotYet: "The signal does not yet evidence enough decision pressure to justify a paid engagement. Buying one now would not be admissible on the evidence." }
      : pressureBand === "MODERATE"
        ? { move: "An Operator Pilot / retained engagement", whyNotYet: "A controlled pilot is scoped for material, multi-checkpoint decisions. This decision is real but not yet at that materiality — the exposure instrument is the proportionate step." }
        : null;

  const evidenceConfidence: SignalResult["evidenceConfidence"] =
    (input.delayCostBand === "LOW" && input.consequenceIfWrong === "REVERSIBLE") ? "LOW" : "MODERATE";

  return {
    pressureBand,
    compositeScore: effective,
    namedSignal: namedSignal[pressureBand],
    consequenceWarning: consequenceWarning[pressureBand],
    contradictions,
    evidenceGap,
    correctionQuestion: correctionQuestion[pressureBand],
    nextAdmissibleMove: nextMoveByBand[pressureBand],
    notYetAdmissible,
    evidencePosture: "USER_REPORTED — this is a first signal, not a full diagnosis.",
    evidenceConfidence,
  };
}

/** Validate then compute. The single entry point a surface should call. */
export function runDecisionSignal(input: SignalInput): SignalComputation {
  const err = validateSignalInput(input);
  if (err) return err;
  return { ok: true, result: computeSignal(input) };
}
