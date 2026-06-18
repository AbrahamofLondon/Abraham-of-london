/**
 * lib/intelligence/source-capture-contract.ts
 *
 * Canonical source capture types used by the run evidence ledger
 * and the team assessment truth harness.  These types define how
 * evidence sources are captured, evaluated, and classified so that
 * the run evidence ledger and truth harness share a single vocabulary.
 *
 * Rules
 * -----
 * - A source set with zero sources is "empty" and cannot support a run.
 * - A source set with stale sources must be flagged as stale.
 * - Insufficient evidence must be representable as a source-level
 *   condition, not just a ledger state.
 * - Contradiction-triggering evidence must be representable.
 */

// ---------------------------------------------------------------------------
// Source freshness
// ---------------------------------------------------------------------------

/**
 * How recently the source was captured or last verified.
 *
 * - fresh:   captured or verified within the current evaluation window
 * - recent:  captured within the last 90 days
 * - aged:    captured more than 90 days ago but still potentially relevant
 * - stale:   captured too long ago to support a fresh judgement
 * - unknown: freshness could not be determined
 */
export type SourceFreshness =
  | "fresh"
  | "recent"
  | "aged"
  | "stale"
  | "unknown";

// ---------------------------------------------------------------------------
// Source applicability
// ---------------------------------------------------------------------------

/**
 * How directly the source applies to the product or claim being evaluated.
 *
 * - direct:        source was captured specifically for this product/claim
 * - family:        source applies to the product family, not this product alone
 * - contextual:    source provides background context but is not product-specific
 * - generic:       source is generic / industry-wide and must not pass
 *                  product-specific gates without justification
 * - insufficient:  source exists but does not contain enough signal
 * - contradictory: source contains evidence that contradicts other sources
 *                  in the same set
 */
export type SourceApplicability =
  | "direct"
  | "family"
  | "contextual"
  | "generic"
  | "insufficient"
  | "contradictory";

// ---------------------------------------------------------------------------
// Source type
// ---------------------------------------------------------------------------

export type SourceType =
  | "validation_run"
  | "red_team_run"
  | "anti_toy_run"
  | "market_comparison"
  | "generic_ai_comparison"
  | "external_benchmark"
  | "outcome_verification"
  | "provenance_anchor"
  | "customer_testimonial"
  | "expert_review"
  | "evidence_ledger_entry"
  | "manual_assertion";

// ---------------------------------------------------------------------------
// Source capture record
// ---------------------------------------------------------------------------

export interface SourceCaptureRecord {
  /** Unique identifier for this source within the product estate. */
  sourceId: string;

  /** The type of run or activity that produced this source. */
  sourceType: SourceType;

  /** File path, URL, or ledger reference where the source lives. */
  location: string;

  /** When the source was captured (ISO-8601). */
  capturedAt: string;

  /** When the source was last verified (ISO-8601), if ever. */
  lastVerifiedAt?: string;

  /** Freshness of this source. */
  freshness: SourceFreshness;

  /** How directly this source applies. */
  applicability: SourceApplicability;

  /** Free-text note about the source. */
  note?: string;

  /** If the source is contradictory, which source IDs it conflicts with. */
  contradictsSourceIds?: string[];
}

// ---------------------------------------------------------------------------
// Source set — a named group of sources for a single run evaluation
// ---------------------------------------------------------------------------

export interface SourceSet {
  /** Unique identifier for this source set. */
  sourceSetId: string;

  /** Human-readable label. */
  label: string;

  /** The sources in this set. */
  sources: SourceCaptureRecord[];
}

// ---------------------------------------------------------------------------
// Source set evaluation result
// ---------------------------------------------------------------------------

export interface SourceSetEvaluation {
  /** Overall status of the source set. */
  status: "valid" | "missing" | "empty" | "stale" | "contradictory" | "insufficient";

  /** Number of named source sets provided. */
  totalSets: number;

  /** Total number of individual source records across all sets. */
  totalSources: number;

  /** Human-readable blockers explaining why the set cannot support a run. */
  blockers: string[];

  /** Whether any source in any set is stale. */
  hasStaleSources: boolean;

  /** Whether any source in any set is contradictory. */
  hasContradictorySources: boolean;

  /** Whether all sources are insufficient to support confident judgement. */
  allSourcesInsufficient: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Evaluate a list of source sets and produce a structured evaluation.
 *
 * This is the canonical implementation; the run evidence ledger delegates
 * to it rather than duplicating the logic.
 */
export function evaluateSourceSets(sourceSets: SourceSet[]): SourceSetEvaluation {
  if (sourceSets.length === 0) {
    return {
      status: "missing",
      totalSets: 0,
      totalSources: 0,
      blockers: ["Run evidence ledger requires at least one named source set."],
      hasStaleSources: false,
      hasContradictorySources: false,
      allSourcesInsufficient: false,
    };
  }

  const emptySets = sourceSets.filter((set) => set.sources.length === 0);
  if (emptySets.length > 0) {
    return {
      status: "empty",
      totalSets: sourceSets.length,
      totalSources: 0,
      blockers: emptySets.map(
        (set) =>
          `Source set ${set.sourceSetId} is empty and cannot support a judgement run.`,
      ),
      hasStaleSources: false,
      hasContradictorySources: false,
      allSourcesInsufficient: false,
    };
  }

  const allSources = sourceSets.flatMap((set) => set.sources);
  const hasStaleSources = allSources.some(
    (source) => source.freshness === "stale",
  );
  const hasContradictorySources = allSources.some(
    (source) => source.applicability === "contradictory",
  );
  const allSourcesInsufficient =
    allSources.length > 0 &&
    allSources.every((source) => source.applicability === "insufficient");

  const blockers: string[] = [];

  if (hasStaleSources) {
    const staleIds = allSources
      .filter((source) => source.freshness === "stale")
      .map((source) => source.sourceId);
    blockers.push(
      `Stale source(s) detected: ${staleIds.join(", ")}. Stale evidence cannot support a fresh or confident judgement.`,
    );
  }

  if (hasContradictorySources) {
    const contraIds = allSources
      .filter((source) => source.applicability === "contradictory")
      .map((source) => source.sourceId);
    blockers.push(
      `Contradictory source(s) detected: ${contraIds.join(", ")}. Contradiction-triggering evidence requires resolution before judgement.`,
    );
  }

  if (allSourcesInsufficient) {
    blockers.push(
      "All sources are marked as insufficient. Insufficient evidence cannot support any judgement run.",
    );
  }

  const status =
    blockers.length > 0
      ? hasStaleSources
        ? "stale"
        : hasContradictorySources
          ? "contradictory"
          : allSourcesInsufficient
            ? "insufficient"
            : "valid"
      : "valid";

  return {
    status,
    totalSets: sourceSets.length,
    totalSources: allSources.length,
    blockers,
    hasStaleSources,
    hasContradictorySources,
    allSourcesInsufficient,
  };
}
