/**
 * lib/product/signal-authority-composer.ts
 *
 * Canonical server-safe composer for all governed signal intelligence surfaces.
 *
 * Classification: SERVER_SAFE — safe to import from API routes.
 * NEVER import from client components. No raw predicates leave this module.
 *
 * This is the single authoritative source for:
 *   1. Named signal — what the condition is called
 *   2. Severity — CRITICAL / ALERT / CONCERN / WATCH
 *   3. Condition explanation — what it means institutionally
 *   4. Comparison basis — how the comparison was derived + maturity
 *   5. Consequence path — 30/60/90-day trajectory if unaddressed
 *   6. Next admissible move — what the governed record supports
 *   7. Verification status — where the follow-up record stands
 *   8. Memory effect — what this signal writes into institutional memory
 *   9. Operator review requirement — when human review is mandated
 *  10. Evidence basis — the posture under which the finding was produced
 *
 * All product surfaces (Fast Diagnostic, Strategy Room, Boardroom, Oversight,
 * Executive Reporting, Decision Instruments) adapt their outputs through this
 * type — not through ad-hoc blocks.
 */

import type { InstrumentSignalAuthority } from "./instrument-signal-authority";
import type { SovereignSignalPublicSummary } from "@/lib/sovereign/sovereign-signal-public-dto";
import type { OutcomeVerificationStatus } from "./outcome-verification-contract";

// ─── Core Types ───────────────────────────────────────────────────────────────

export type SignalAuthoritySeverity = "CRITICAL" | "ALERT" | "CONCERN" | "WATCH";

/**
 * All possible states a signal's verification record can occupy.
 * Ordered by lifecycle progression.
 */
export type SignalVerificationState =
  | "NOT_REQUESTED"       // No verification checkpoint created
  | "REQUESTED"           // Checkpoint created — user has not yet responded
  | "PENDING_VERIFICATION"// Response window open — overdue signals promote here
  | "COMPLETED"           // Full evidence provided; action confirmed
  | "PARTIAL"             // Partial evidence; action partially taken
  | "BLOCKED"             // User could not act — blocker documented
  | "DISPUTED"            // User disputes the system's diagnosis
  | "NO_CHANGE"           // Verified no change occurred
  | "INSUFFICIENT_EVIDENCE" // Response submitted but lacks evidence
  | "PENDING_OPERATOR_REVIEW" // Flagged for human operator review
  | "OPERATOR_REVIEWED"   // Operator has reviewed and annotated
  | "MEMORY_UPDATED";     // Verification applied to institutional memory

export type SignalEvidenceBasis =
  | "SELF_REPORTED"                    // Answers from the user only
  | "MULTI_ANSWER_CORROBORATED"        // Multiple diagnostic answers align
  | "CROSS_SURFACE_CORROBORATED"       // Confirmed across multiple surfaces
  | "OPERATOR_REVIEWED"                // Human operator reviewed the record
  | "OUTCOME_VERIFIED"                 // Outcome verification completed
  | "INSUFFICIENT";                    // Not enough evidence to classify

export type MemoryTarget =
  | "DECISION_CENTRE"
  | "OVERSIGHT_BRIEF"
  | "RETURN_BRIEF"
  | "PORTFOLIO_MEMORY"
  | "INSTITUTIONAL_RECORD"
  | "COMPARISON_BASIS_MATURITY"
  | "SIGNAL_RECURRENCE";

/**
 * The canonical governed signal authority record.
 * Every product surface that surfaces a named signal MUST be representable
 * as this type — even if it renders a subset of the fields.
 */
export type SignalAuthorityRecord = {
  // ── Dimension 1: Source ─────────────────────────────────────────────────
  /** Which product surface produced this record */
  sourceSurface:
    | "fast-diagnostic"
    | "strategy-room"
    | "boardroom"
    | "oversight"
    | "executive-reporting"
    | "decision-instrument"
    | "portfolio-command";

  // ── Dimension 2: Named Signal ────────────────────────────────────────────
  /** The canonical named condition */
  conditionName: string;

  /** Short institutional pattern tag — one phrase */
  patternTag: string;

  // ── Dimension 3: Severity ────────────────────────────────────────────────
  severity: SignalAuthoritySeverity;

  // ── Dimension 4: Public Meaning ──────────────────────────────────────────
  /** What this condition means institutionally — plain language */
  publicMeaning: string;

  // ── Dimension 5: Evidence Basis ──────────────────────────────────────────
  evidenceBasis: SignalEvidenceBasis;

  /** Governance caveat that must accompany any claim based on this evidence */
  evidenceCaveat: string;

  // ── Dimension 6: Comparison ──────────────────────────────────────────────
  comparison: {
    band: string | null;
    basisLabel: string | null;
    maturityLevel: number | null;
    caveat: string | null;
  };

  // ── Dimension 7: Consequence Path ────────────────────────────────────────
  consequencePath: {
    /** Current condition description */
    current: string;
    thirtyDay: string;
    sixtyDay: string;
    ninetyDay: string;
    /** Point at which intervention becomes structurally harder — null if not applicable */
    compoundingPoint: string | null;
    /** What changes the outcome — the key differentiator */
    correctionPoint: string;
    caveat: string;
  };

  // ── Dimension 8: Next Admissible Move ────────────────────────────────────
  nextAdmissibleMove: {
    /** The governed instruction */
    label: string;
    /** Relative or absolute href — null for advisory-only moves */
    href: string | null;
    /** Why this move is the correct one given the current record */
    rationale: string;
    /** Whether this move has been earned by completing prerequisite steps */
    earned: boolean;
  };

  // ── Dimension 9: Verification ────────────────────────────────────────────
  verification: {
    /** Whether a verification checkpoint is required for this record */
    required: boolean;
    /** ISO timestamp when verification was due — null if not scheduled */
    dueAt: string | null;
    /** Current state of the verification lifecycle */
    status: SignalVerificationState;
    /** Whether this verification requires operator (human) review */
    requiresOperatorReview: boolean;
    /** Reason operator review is required — null if not required */
    operatorReviewReason: string | null;
  };

  // ── Dimension 10: Memory Effect ──────────────────────────────────────────
  memoryEffect: {
    /** Whether this signal writes into institutional memory on verification */
    writesToMemory: boolean;
    /** Which memory systems are updated */
    memoryTargets: MemoryTarget[];
    /** How this signal influences future recommendations */
    futureInfluence: string;
  };
};

// ─── Adapter: InstrumentSignalAuthority → SignalAuthorityRecord ───────────────

/**
 * Adapts an InstrumentSignalAuthority (built by buildInstrumentSignalAuthority)
 * into the canonical SignalAuthorityRecord.
 *
 * Used by all decision instrument result pages.
 */
export function instrumentAuthorityToRecord(
  authority: InstrumentSignalAuthority,
  options: {
    sourceSurface: SignalAuthorityRecord["sourceSurface"];
    verificationStatus?: OutcomeVerificationStatus;
    verificationDueAt?: string | null;
    verificationRequired?: boolean;
    requiresOperatorReview?: boolean;
    operatorReviewReason?: string | null;
    nextMoveHref?: string | null;
    nextMoveRationale?: string | null;
    evidenceBasis?: SignalEvidenceBasis;
  },
): SignalAuthorityRecord {
  const status = mapOutcomeStatusToVerificationState(options.verificationStatus);

  return {
    sourceSurface: options.sourceSurface,
    conditionName: authority.conditionName,
    patternTag: authority.patternTag,
    severity: authority.severity,
    publicMeaning: authority.differentiator,
    evidenceBasis: options.evidenceBasis ?? "SELF_REPORTED",
    evidenceCaveat: authority.caveat,
    comparison: {
      band: authority.comparisonBand,
      basisLabel: authority.comparisonBasisLabel,
      maturityLevel: authority.comparisonMaturityLevel,
      caveat: authority.comparisonCaveat,
    },
    consequencePath: {
      current: authority.conditionName,
      thirtyDay: authority.consequence.thirtyDays,
      sixtyDay: authority.consequence.sixtyDays,
      ninetyDay: authority.consequence.ninetyDays,
      compoundingPoint: null,
      correctionPoint: authority.differentiator,
      caveat: authority.caveat,
    },
    nextAdmissibleMove: {
      label: authority.nextMove,
      href: options.nextMoveHref ?? null,
      rationale: options.nextMoveRationale ?? authority.differentiator,
      earned: true,
    },
    verification: {
      required: options.verificationRequired ?? false,
      dueAt: options.verificationDueAt ?? null,
      status,
      requiresOperatorReview: options.requiresOperatorReview ?? (authority.severity === "CRITICAL"),
      operatorReviewReason: options.operatorReviewReason ?? (
        authority.severity === "CRITICAL"
          ? "CRITICAL severity signals require operator confirmation before memory effect is applied."
          : null
      ),
    },
    memoryEffect: buildMemoryEffect(options.sourceSurface, authority.severity),
  };
}

// ─── Adapter: SovereignSignalPublicSummary → SignalAuthorityRecord ────────────

/**
 * Adapts a SovereignSignalPublicSummary (from the intelligence detection engine)
 * into the canonical SignalAuthorityRecord.
 *
 * Used by boardroom, oversight, and executive reporting sovereign signal panels.
 */
export function sovereignSignalToRecord(
  signal: SovereignSignalPublicSummary,
  options: {
    sourceSurface: SignalAuthorityRecord["sourceSurface"];
    consequencePath?: {
      current?: string;
      thirtyDay?: string;
      sixtyDay?: string;
      ninetyDay?: string;
    };
    verificationStatus?: OutcomeVerificationStatus;
    verificationDueAt?: string | null;
    verificationRequired?: boolean;
    requiresOperatorReview?: boolean;
    operatorReviewReason?: string | null;
  },
): SignalAuthorityRecord {
  const severity = mapSignalSeverity(signal.severityBand);
  const status = mapOutcomeStatusToVerificationState(options.verificationStatus);
  const path = options.consequencePath ?? {};

  return {
    sourceSurface: options.sourceSurface,
    conditionName: signal.signalName,
    patternTag: signal.patternTag,
    severity,
    publicMeaning: signal.narrativeSummary,
    evidenceBasis: mapSignalEvidencePosture(signal.evidencePosture),
    evidenceCaveat: signal.sampleCaveat,
    comparison: {
      band: null,
      basisLabel: null,
      maturityLevel: null,
      caveat: signal.sampleCaveat,
    },
    consequencePath: {
      current: signal.signalName,
      thirtyDay: path.thirtyDay ?? signal.outcomeDistributionSummary,
      sixtyDay: path.sixtyDay ?? "Pattern embeds in operational behaviour — intervention cost rises.",
      ninetyDay: path.ninetyDay ?? "Structural trajectory is set — recovery requires explicit redesign.",
      compoundingPoint: null,
      correctionPoint: signal.differentiatorSummary,
      caveat: signal.sampleCaveat,
    },
    nextAdmissibleMove: {
      label: signal.admissibleNextMove,
      href: signal.briefSlug ? `/briefs/${signal.briefSlug}` : null,
      rationale: signal.differentiatorSummary,
      earned: signal.confidenceBand !== "INSUFFICIENT",
    },
    verification: {
      required: severity === "CRITICAL" || severity === "ALERT",
      dueAt: options.verificationDueAt ?? null,
      status,
      requiresOperatorReview: options.requiresOperatorReview ?? (severity === "CRITICAL"),
      operatorReviewReason: options.operatorReviewReason ?? (
        severity === "CRITICAL"
          ? "CRITICAL sovereign signals require operator review before memory is updated."
          : null
      ),
    },
    memoryEffect: buildMemoryEffect(options.sourceSurface, severity),
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function mapOutcomeStatusToVerificationState(
  status: OutcomeVerificationStatus | undefined,
): SignalVerificationState {
  if (!status) return "NOT_REQUESTED";
  const map: Record<OutcomeVerificationStatus, SignalVerificationState> = {
    NOT_REQUESTED: "NOT_REQUESTED",
    REQUESTED: "REQUESTED",
    COMPLETED: "COMPLETED",
    PARTIAL: "PARTIAL",
    BLOCKED: "BLOCKED",
    DISPUTED: "DISPUTED",
    NO_CHANGE: "NO_CHANGE",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  };
  return map[status] ?? "NOT_REQUESTED";
}

function mapSignalSeverity(band: string): SignalAuthoritySeverity {
  const upper = band.toUpperCase();
  if (upper === "CRITICAL") return "CRITICAL";
  if (upper === "ALERT") return "ALERT";
  if (upper === "CONCERN") return "CONCERN";
  return "WATCH";
}

function mapSignalEvidencePosture(
  posture: SovereignSignalPublicSummary["evidencePosture"],
): SignalEvidenceBasis {
  switch (posture) {
    case "MULTI_SOURCE_CORROBORATED": return "CROSS_SURFACE_CORROBORATED";
    case "SINGLE_SOURCE_INDICATED":   return "MULTI_ANSWER_CORROBORATED";
    case "THEORETICAL_GROUNDED":      return "SELF_REPORTED";
    case "THIN_EVIDENCE":             return "INSUFFICIENT";
  }
}

function buildMemoryEffect(
  surface: SignalAuthorityRecord["sourceSurface"],
  severity: SignalAuthoritySeverity,
): SignalAuthorityRecord["memoryEffect"] {
  const base: MemoryTarget[] = ["INSTITUTIONAL_RECORD", "SIGNAL_RECURRENCE"];

  const surfaceTargets: Partial<Record<SignalAuthorityRecord["sourceSurface"], MemoryTarget[]>> = {
    "fast-diagnostic":     ["DECISION_CENTRE", "OVERSIGHT_BRIEF"],
    "strategy-room":       ["DECISION_CENTRE", "RETURN_BRIEF", "OVERSIGHT_BRIEF"],
    "boardroom":           ["DECISION_CENTRE", "RETURN_BRIEF", "OVERSIGHT_BRIEF", "PORTFOLIO_MEMORY"],
    "oversight":           ["OVERSIGHT_BRIEF", "SIGNAL_RECURRENCE"],
    "executive-reporting": ["DECISION_CENTRE", "RETURN_BRIEF"],
    "decision-instrument": ["DECISION_CENTRE"],
    "portfolio-command":   ["PORTFOLIO_MEMORY", "OVERSIGHT_BRIEF"],
  };

  const extra = surfaceTargets[surface] ?? [];
  const targets = Array.from(new Set([...base, ...extra])) as MemoryTarget[];

  if (severity === "CRITICAL" || severity === "ALERT") {
    targets.push("COMPARISON_BASIS_MATURITY");
  }

  const unique = Array.from(new Set(targets)) as MemoryTarget[];

  const influence =
    severity === "CRITICAL"
      ? "Verification of this record elevates comparison basis maturity, strengthens pattern recurrence evidence, and updates the decision posture carried into all future surfaces for this case."
      : severity === "ALERT"
        ? "Verification updates institutional record, adjusts signal recurrence confidence, and informs the oversight brief for the next review cycle."
        : "Verification contributes to signal recurrence tracking and informs future consequence path calibration.";

  return {
    writesToMemory: true,
    memoryTargets: unique,
    futureInfluence: influence,
  };
}
