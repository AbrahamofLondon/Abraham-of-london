/**
 * lib/playbooks/playbook-run-types.ts
 *
 * Shared VOCABULARY for governed playbook execution runs.
 *
 * This module deliberately contains NO scoring or conclusion logic. Each playbook
 * engine (execution-integrity-protocol, alignment-audit-playbook,
 * drift-detection-framework) implements its own product-specific analysis and
 * must produce materially different outputs for different inputs. The only things
 * shared here are the posture enum, severity scale, the run-result envelope, and
 * the input-failure error — so that the three engines can be gated, persisted, and
 * rendered uniformly WITHOUT sharing a conclusion.
 *
 * Doctrine: a playbook run must never hardcode a universal conclusion. When
 * evidence is missing it returns INSUFFICIENT_EVIDENCE; when the input contradicts
 * itself it returns CONTRADICTORY_INPUT and names the contradiction. It does not
 * pretend to a verdict it cannot support.
 */

export type PlaybookRunPosture =
  | "ACTIONABLE" // enough evidence to produce a governed result across all dimensions
  | "PARTIAL" // some dimensions assessable; others lack evidence
  | "INSUFFICIENT_EVIDENCE" // not enough to conclude anything — do NOT fabricate
  | "CONTRADICTORY_INPUT"; // input contains internal contradictions to resolve first

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function maxSeverity(severities: Severity[]): Severity {
  let worst: Severity = "LOW";
  for (const s of severities) {
    if (SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s;
  }
  return worst;
}

/** A single named contradiction the reader must resolve before relying on output. */
export interface Contradiction {
  ref: string; // the id/field the contradiction attaches to
  detail: string;
}

/** A recommended, owner-facing next action produced by an engine. */
export interface PlaybookAction {
  action: string;
  rationale: string;
  severity: Severity;
}

/**
 * The uniform envelope every playbook engine returns. `findings` and `summary`
 * are engine-specific and typed by each engine via the generic parameter.
 */
export interface PlaybookRunResult<TFindings> {
  playbook: string; // canonical product code
  posture: PlaybookRunPosture;
  overallSeverity: Severity;
  /** 0–100 governed score. Higher = healthier. Null when INSUFFICIENT_EVIDENCE. */
  score: number | null;
  findings: TFindings;
  contradictions: Contradiction[];
  evidenceGaps: string[];
  actions: PlaybookAction[];
  claimBoundary: string;
}

/** Boundary statement carried on every governed playbook result. */
export const PLAYBOOK_CLAIM_BOUNDARY =
  "Governed decision-support analysis of operator-supplied evidence. Not legal, " +
  "financial, or investment advice. Conclusions are bounded by the evidence " +
  "supplied and must be validated by the accountable owner before action.";

/** Thrown when input is structurally invalid (the failure case). */
export class PlaybookInputError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PlaybookInputError";
    this.code = code;
  }
}

/** Guard: require a non-empty array, else throw the failure-case error. */
export function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new PlaybookInputError(
      "INVALID_INPUT_SHAPE",
      `"${field}" must be an array; received ${value === null ? "null" : typeof value}.`,
    );
  }
  return value;
}
