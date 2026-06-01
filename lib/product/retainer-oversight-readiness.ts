/**
 * lib/product/retainer-oversight-readiness.ts
 *
 * Retainer Oversight Readiness Gate.
 *
 * Defines and enforces the minimum durable memory threshold required
 * before any retained oversight, institutional learning, recurrence,
 * drift, cadence, or cycle-comparison claims can be shown.
 *
 * Rules:
 *   - Do not mark Retainer Oversight ACTIVE.
 *   - Do not claim institutional memory without durable case history.
 *   - Do not claim recurrence without repeated comparable cases or
 *     repeated unresolved patterns.
 *   - Do not claim drift without time-separated state comparison.
 *   - Do not claim outcome learning without reported or verified outcomes.
 *   - Do not show monthly oversight/retainer language unless readiness
 *     threshold is met.
 *   - Do not expose raw private case data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RetainerOversightReadinessStatus =
  | 'NOT_READY'
  | 'REVIEW_READY'
  | 'OVERSIGHT_READY'

export type RetainerOversightReadiness = {
  status: RetainerOversightReadinessStatus
  reasons: string[]
  missingRequirements: string[]
  availableSignals: string[]
  allowedPreviewClaims: string[]
  prohibitedClaims: string[]
}

export type RetainerOversightReadinessInput = {
  /** Number of durable case identities available */
  durableCaseCount: number
  /** Number of recommendation ledger entries */
  recommendationEntryCount: number
  /** Whether at least one execution or follow-up state exists */
  hasExecutionState: boolean
  /** Whether at least one outcome report exists */
  hasOutcomeReport: boolean
  /** Age of the oldest unresolved recommendation in days */
  oldestUnresolvedRecommendationAgeDays: number
  /** Number of repeated decision classes or patterns */
  repeatedPatternCount: number
  /** Whether a client-safe evidence summary can be produced */
  hasClientSafeEvidenceSummary: boolean
  /** Whether account/org identity is available */
  hasAccountIdentity: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum recommendation entries for REVIEW_READY */
const MIN_RECOMMENDATIONS_FOR_REVIEW = 1

/** Minimum recommendation entries for OVERSIGHT_READY */
const MIN_RECOMMENDATIONS_FOR_OVERSIGHT = 3

/** Minimum execution states for OVERSIGHT_READY */
const MIN_EXECUTION_STATES_FOR_OVERSIGHT = 1

/** Age threshold in days for unresolved recommendation to qualify for review */
const UNRESOLVED_AGE_THRESHOLD_DAYS = 30

/** Minimum repeated patterns for OVERSIGHT_READY */
const MIN_REPEATED_PATTERNS_FOR_OVERSIGHT = 1

/** Minimum durable cases for OVERSIGHT_READY */
const MIN_DURABLE_CASES_FOR_OVERSIGHT = 1

// ---------------------------------------------------------------------------
// Allowed / Prohibited Claims
// ---------------------------------------------------------------------------

const ALLOWED_PREVIEW_CLAIMS: string[] = [
  'This case may qualify for retained oversight review.',
  'Further outcome history is required before oversight can begin.',
  'Recurring pattern detected; operator review recommended.',
]

const PROHIBITED_CLAIMS: string[] = [
  'Institutional memory active',
  'Monthly oversight active',
  'Retainer cycle started',
  'Organisation is learning across cycles',
  'Retained oversight in progress',
  'Cycle comparison available',
  'Drift detection active',
  'Institutional learning across cycles',
]

// ---------------------------------------------------------------------------
// Readiness Classifier
// ---------------------------------------------------------------------------

/**
 * Evaluate Retainer Oversight readiness based on available durable memory signals.
 *
 * Required minimum signals:
 *   - durable case identity
 *   - at least one recommendation ledger entry
 *   - at least one execution or follow-up state
 *   - outcome report OR unresolved recommendation age threshold
 *   - recurrence signal OR repeated pattern OR repeated decision class
 *   - client-safe evidence summary
 *   - account/org identity where applicable
 */
export function evaluateRetainerOversightReadiness(
  input: RetainerOversightReadinessInput,
): RetainerOversightReadiness {
  const reasons: string[] = []
  const missingRequirements: string[] = []
  const availableSignals: string[] = []

  // ── 1. Durable case identity ──────────────────────────────────────
  if (input.durableCaseCount > 0) {
    availableSignals.push(`${input.durableCaseCount} durable case(s)`)
  } else {
    missingRequirements.push('No durable case identity available')
  }

  // ── 2. Recommendation ledger entry ────────────────────────────────
  if (input.recommendationEntryCount >= MIN_RECOMMENDATIONS_FOR_REVIEW) {
    availableSignals.push(`${input.recommendationEntryCount} recommendation ledger entr(ies)`)
  } else {
    missingRequirements.push(`At least ${MIN_RECOMMENDATIONS_FOR_REVIEW} recommendation ledger entr(ies) required`)
  }

  // ── 3. Execution or follow-up state ───────────────────────────────
  if (input.hasExecutionState) {
    availableSignals.push('Execution or follow-up state exists')
  } else {
    missingRequirements.push('At least one execution or follow-up state required')
  }

  // ── 4. Outcome report OR unresolved recommendation age ────────────
  const hasOutcomeSignal = input.hasOutcomeReport || input.oldestUnresolvedRecommendationAgeDays >= UNRESOLVED_AGE_THRESHOLD_DAYS
  if (input.hasOutcomeReport) {
    availableSignals.push('Outcome report exists')
  }
  if (input.oldestUnresolvedRecommendationAgeDays >= UNRESOLVED_AGE_THRESHOLD_DAYS) {
    availableSignals.push(`Unresolved recommendation aged ${input.oldestUnresolvedRecommendationAgeDays} days`)
  }
  if (!hasOutcomeSignal) {
    missingRequirements.push('Outcome report or unresolved recommendation aged 30+ days required')
  }

  // ── 5. Recurrence or repeated pattern ─────────────────────────────
  if (input.repeatedPatternCount > 0) {
    availableSignals.push(`${input.repeatedPatternCount} repeated pattern(s) detected`)
  } else {
    missingRequirements.push('Recurrence signal or repeated pattern required')
  }

  // ── 6. Client-safe evidence summary ───────────────────────────────
  if (input.hasClientSafeEvidenceSummary) {
    availableSignals.push('Client-safe evidence summary available')
  } else {
    missingRequirements.push('Client-safe evidence summary required')
  }

  // ── 7. Account/org identity ───────────────────────────────────────
  if (input.hasAccountIdentity) {
    availableSignals.push('Account/organisation identity available')
  } else {
    missingRequirements.push('Account or organisation identity required')
  }

  // ── Determine status ──────────────────────────────────────────────
  const hasOversightReady = (
    input.durableCaseCount >= MIN_DURABLE_CASES_FOR_OVERSIGHT &&
    input.recommendationEntryCount >= MIN_RECOMMENDATIONS_FOR_OVERSIGHT &&
    input.hasExecutionState &&
    hasOutcomeSignal &&
    input.repeatedPatternCount >= MIN_REPEATED_PATTERNS_FOR_OVERSIGHT &&
    input.hasClientSafeEvidenceSummary &&
    input.hasAccountIdentity
  )

  const hasReviewReady = (
    input.durableCaseCount > 0 &&
    input.recommendationEntryCount >= MIN_RECOMMENDATIONS_FOR_REVIEW &&
    input.hasExecutionState &&
    hasOutcomeSignal &&
    input.hasClientSafeEvidenceSummary
  )

  let status: RetainerOversightReadinessStatus
  let allowedPreviewClaims: string[]

  if (hasOversightReady) {
    status = 'OVERSIGHT_READY'
    reasons.push('All minimum memory thresholds met for retained oversight.')
    reasons.push(`${input.recommendationEntryCount} recommendation(s), ${input.repeatedPatternCount} repeated pattern(s), outcome data present.`)
    allowedPreviewClaims = [
      ...ALLOWED_PREVIEW_CLAIMS,
      'Retained oversight review eligible.',
    ]
  } else if (hasReviewReady) {
    status = 'REVIEW_READY'
    reasons.push('Minimum review threshold met but oversight requires more evidence.')
    if (input.recommendationEntryCount < MIN_RECOMMENDATIONS_FOR_OVERSIGHT) {
      reasons.push(`Additional recommendations needed: ${input.recommendationEntryCount}/${MIN_RECOMMENDATIONS_FOR_OVERSIGHT}`)
    }
    if (input.repeatedPatternCount < MIN_REPEATED_PATTERNS_FOR_OVERSIGHT) {
      reasons.push('Repeated pattern evidence needed for full oversight')
    }
    allowedPreviewClaims = [
      'This case may qualify for retained oversight review.',
      'Further outcome history is required before oversight can begin.',
    ]
  } else {
    status = 'NOT_READY'
    reasons.push('Insufficient durable memory for retained oversight review.')
    allowedPreviewClaims = [
      'Further outcome history is required before oversight can begin.',
    ]
  }

  // ── Prohibited claims (always the same when not fully ready) ──────
  const prohibitedClaims = status === 'OVERSIGHT_READY'
    ? [] // All claims become available when fully ready
    : [...PROHIBITED_CLAIMS]

  return {
    status,
    reasons,
    missingRequirements,
    availableSignals,
    allowedPreviewClaims,
    prohibitedClaims,
  }
}
