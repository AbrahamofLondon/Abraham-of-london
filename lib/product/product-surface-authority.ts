/**
 * lib/product/product-surface-authority.ts
 *
 * Surface-level authority scoring engine.
 *
 * Scores every surface in the registry across its applicable dimension set:
 *   - Universal (8 dimensions, all surfaces)
 *   - Paid/corridor (7 additional dimensions)
 *   - Diagnostic (5 additional dimensions)
 *   - Console (6 additional dimensions)
 *
 * Each dimension is PASS (1pt), PARTIAL (0.5pt), or FAIL (0pt).
 * Final score is normalised to 10.
 *
 * Exposure recommendation is derived from the final score.
 */

import {
  type ProductSurface,
  type SurfaceExposureStatus,
  PRODUCT_SURFACE_REGISTRY,
  getSurfacesBelow,
} from './product-surface-registry'

// ─── Dimension Sets ───────────────────────────────────────────────────────────

/**
 * Universal dimensions that apply to every surface.
 */
export const UNIVERSAL_DIMENSIONS = [
  'route_exists',
  'cta_coherent',
  'runtime_truth_declared',
  'data_source_legitimate',
  'exposure_status_clear',
  'no_fake_live_state',
  'tests_exist',
  'smoke_status_known',
] as const

/**
 * Additional dimensions for paid/corridor stages.
 */
export const PAID_CORRIDOR_DIMENSIONS = [
  'entitlement_payment_path',
  'persisted_order_run_case',
  'admin_visibility',
  'fulfilment_state',
  'artifact_result_proof',
  'audit_trail',
  'failure_refund_cancel_path',
] as const

/**
 * Additional dimensions for diagnostic surfaces.
 */
export const DIAGNOSTIC_DIMENSIONS = [
  'input_validation',
  'rate_limiting',
  'safe_storage',
  'result_persistence_or_stateless_label',
  'next_route_logic',
  'analytics_conversion_tracking',
] as const

/**
 * Additional dimensions for console surfaces.
 */
export const CONSOLE_DIMENSIONS = [
  'case_identity_gate',
  'memory_source_declared',
  'recommendation_source_declared',
  'outcome_state',
  'return_brief_state',
  'user_admin_visibility',
] as const

// ─── Score Result ─────────────────────────────────────────────────────────────

export type DimensionResult = 'PASS' | 'PARTIAL' | 'FAIL' | 'NA'

export interface SurfaceDimensionScore {
  dimension: string
  result: DimensionResult
  note: string
}

export interface SurfaceAuthorityScore {
  surfaceId: string
  displayName: string
  surfaceType: string
  family: string
  currentScore: number
  derivedScore: number              // computed from dimension scores
  exposureRecommendation: SurfaceExposureStatus
  currentExposure: SurfaceExposureStatus
  exposureMismatch: boolean         // true if current exposure is higher than recommended
  universalDimensions: SurfaceDimensionScore[]
  additionalDimensions: SurfaceDimensionScore[]
  failCount: number
  partialCount: number
  passCount: number
  authorityGaps: string[]           // inherited from registry
  highestPriorityGap: string | null
}

// ─── Exposure derivation ──────────────────────────────────────────────────────

export function deriveExposureFromScore(score: number, isInactive: boolean): SurfaceExposureStatus {
  if (isInactive) return 'dormant'
  if (score >= 9) return 'public_active'
  if (score >= 8) return 'public_limited'
  if (score >= 6) return 'controlled_access'
  return 'admin_only'
}

// ─── Scoring from registry ────────────────────────────────────────────────────

/**
 * Derive dimension scores from the surface registry authority gaps.
 * This translates the declarative gap strings into dimension results.
 */
function deriveDimensionScores(surface: ProductSurface): {
  universal: SurfaceDimensionScore[]
  additional: SurfaceDimensionScore[]
} {
  const gaps = surface.authorityGaps
  const hasFail = (keyword: string) => gaps.some((g) => g.startsWith('[FAIL]') && g.toLowerCase().includes(keyword))
  const hasPartial = (keyword: string) => gaps.some((g) => g.startsWith('[PARTIAL]') && g.toLowerCase().includes(keyword))

  function score(keyword: string, dimension: string, note: string): SurfaceDimensionScore {
    if (hasFail(keyword)) return { dimension, result: 'FAIL', note }
    if (hasPartial(keyword)) return { dimension, result: 'PARTIAL', note }
    return { dimension, result: 'PASS', note: 'No recorded gap' }
  }

  const universal: SurfaceDimensionScore[] = [
    score('route',           'route_exists',             surface.route ? `Route: ${surface.route}` : 'No route defined'),
    score('commercial',      'cta_coherent',             surface.primaryCTA ?? 'No CTA'),
    score('runtime_truth',   'runtime_truth_declared',   surface.writesDatabase ? 'Writes DB' : surface.usesContent ? 'Content-derived' : 'Stateless or unknown'),
    score('runtime_truth',   'data_source_legitimate',   surface.readsDatabase || surface.usesContent ? 'DB or content sourced' : 'Static or ephemeral'),
    score('feature',         'exposure_status_clear',    `Current: ${surface.currentExposureStatus}`),
    score('fake',            'no_fake_live_state',       surface.featureFlag ? `Feature flag: ${surface.featureFlag}` : 'No feature flag'),
    score('test',            'tests_exist',              'See reality audit test coverage'),
    score('smoke',           'smoke_status_known',       'NEEDS_MANUAL_CHECK'),
  ]

  const additional: SurfaceDimensionScore[] = []

  if (surface.acceptsPayment || surface.surfaceType === 'corridor_stage') {
    additional.push(
      score('entitlement', 'entitlement_payment_path', surface.entitlementSlug ?? 'No entitlement slug'),
      score('fulfilment',  'persisted_order_run_case', surface.writesDatabase ? 'Writes DB' : 'No DB write confirmed'),
      score('admin',       'admin_visibility',          surface.adminRoutes.length > 0 ? (surface.adminRoutes[0] ?? 'No admin route') : 'No admin route'),
      score('fulfilment',  'fulfilment_state',          surface.producesArtifact ? 'Produces artifact' : 'No artifact'),
      score('market',      'artifact_result_proof',     surface.producesArtifact ? 'Artifact produced' : 'No artifact'),
      score('audit',       'audit_trail',               surface.writesDatabase ? 'DB write exists' : 'No audit trail confirmed'),
      { dimension: 'failure_refund_cancel_path', result: 'NA' as const, note: 'Not evaluated in static analysis' },
    )
  }

  if (surface.surfaceType === 'diagnostic') {
    additional.push(
      score('input',       'input_validation',                        'Not evaluated in static analysis'),
      { dimension: 'rate_limiting', result: gaps.length > 0 ? 'PARTIAL' : 'PASS', note: 'Upstash rate limit status not confirmed' },
      score('storage',     'safe_storage',                            'No sensitive data storage confirmed'),
      score('persistence', 'result_persistence_or_stateless_label',  surface.writesDatabase ? 'Writes DB' : 'Must carry stateless label'),
      score('route',       'next_route_logic',                        'Next route wiring status'),
      { dimension: 'analytics_conversion_tracking', result: 'PARTIAL', note: 'Conversion tracking not confirmed' },
    )
  }

  if (surface.surfaceType === 'console') {
    additional.push(
      score('evidence_input', 'case_identity_gate',              'Gate on case identity'),
      score('memory',          'memory_source_declared',          'Memory source declaration'),
      score('recommendation',  'recommendation_source_declared',  'Recommendation source'),
      score('fulfilment',      'outcome_state',                   'Outcome state persistence'),
      score('return',          'return_brief_state',              'Return brief generation'),
      score('admin',           'user_admin_visibility',           surface.adminRoutes.length > 0 ? 'Admin visible' : 'No admin route'),
    )
  }

  return { universal, additional }
}

function computeScore(dims: SurfaceDimensionScore[]): number {
  const scorable = dims.filter((d) => d.result !== 'NA')
  if (scorable.length === 0) return 0
  const points = scorable.reduce((sum, d) => {
    if (d.result === 'PASS') return sum + 1
    if (d.result === 'PARTIAL') return sum + 0.5
    return sum
  }, 0)
  return Math.round((points / scorable.length) * 10 * 10) / 10
}

// ─── Authority evaluation ─────────────────────────────────────────────────────

/**
 * Evaluate the authority of a single surface.
 */
export function evaluateSurfaceAuthority(surface: ProductSurface): SurfaceAuthorityScore {
  const { universal, additional } = deriveDimensionScores(surface)
  const allDims = [...universal, ...additional]
  const derivedScore = computeScore(allDims)
  const isInactive = surface.currentExposureStatus === 'dormant' || surface.currentExposureStatus === 'retired'
  const exposureRecommendation = deriveExposureFromScore(derivedScore, isInactive)

  const statusOrder: SurfaceExposureStatus[] = [
    'public_active', 'public_limited', 'controlled_access', 'evidence_gated',
    'review_gated', 'admin_only', 'dormant', 'hidden', 'retired',
  ]
  const currentIdx = statusOrder.indexOf(surface.currentExposureStatus)
  const recommendedIdx = statusOrder.indexOf(exposureRecommendation)
  const exposureMismatch = currentIdx < recommendedIdx // current is more permissive than recommended

  const failCount = allDims.filter((d) => d.result === 'FAIL').length
  const partialCount = allDims.filter((d) => d.result === 'PARTIAL').length
  const passCount = allDims.filter((d) => d.result === 'PASS').length

  const highestPriorityGap = surface.authorityGaps.find((g) => g.startsWith('[FAIL]')) ??
    surface.authorityGaps.find((g) => g.startsWith('[PARTIAL]')) ?? null

  return {
    surfaceId: surface.surfaceId,
    displayName: surface.displayName,
    surfaceType: surface.surfaceType,
    family: surface.family,
    currentScore: surface.currentScore,
    derivedScore,
    exposureRecommendation,
    currentExposure: surface.currentExposureStatus,
    exposureMismatch,
    universalDimensions: universal,
    additionalDimensions: additional,
    failCount,
    partialCount,
    passCount,
    authorityGaps: surface.authorityGaps,
    highestPriorityGap,
  }
}

/**
 * Evaluate all surfaces in the registry.
 */
export function evaluateAllSurfaces(): SurfaceAuthorityScore[] {
  return PRODUCT_SURFACE_REGISTRY.map(evaluateSurfaceAuthority)
}

/**
 * Get surfaces where current exposure is more permissive than the derived recommendation.
 * These are overexposed surfaces — public when they should be controlled.
 */
export function getOverexposedSurfaces(): SurfaceAuthorityScore[] {
  return evaluateAllSurfaces().filter((s) => s.exposureMismatch)
}

/**
 * Get surfaces that are paid but have entitlement or fulfilment FAIL gaps.
 */
export function getPaidSurfacesWithCriticalGaps(): SurfaceAuthorityScore[] {
  return evaluateAllSurfaces().filter(
    (s) =>
      s.failCount > 0 &&
      PRODUCT_SURFACE_REGISTRY.find((r) => r.surfaceId === s.surfaceId)?.acceptsPayment,
  )
}

/**
 * Get a ranked gap summary for triage.
 * Sorted by: FAIL count desc → current score asc → surface type priority.
 */
export function getSurfaceGapSummary(): {
  surfaceId: string
  displayName: string
  currentScore: number
  failCount: number
  partialCount: number
  exposureMismatch: boolean
  topGap: string | null
}[] {
  return evaluateAllSurfaces()
    .map((s) => ({
      surfaceId: s.surfaceId,
      displayName: s.displayName,
      currentScore: s.currentScore,
      failCount: s.failCount,
      partialCount: s.partialCount,
      exposureMismatch: s.exposureMismatch,
      topGap: s.highestPriorityGap,
    }))
    .sort((a, b) => b.failCount - a.failCount || a.currentScore - b.currentScore)
}

/**
 * Assert no paid surface has a FAIL on evidence_input (entitlement) or fulfilment.
 * Use in CI to enforce zero-tolerance for paid surfaces serving unverified runs.
 */
export function assertNoPaidEntitlementFailures(): void {
  const violations: string[] = []
  const scores = evaluateAllSurfaces()

  for (const score of scores) {
    const surface = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === score.surfaceId)
    if (!surface?.acceptsPayment) continue

    const entitlementDim = score.universalDimensions.find((d) => d.dimension === 'entitlement_payment_path') ??
      score.additionalDimensions.find((d) => d.dimension === 'entitlement_payment_path')
    const fulfilmentDim = score.additionalDimensions.find((d) => d.dimension === 'fulfilment_state')

    if (entitlementDim?.result === 'FAIL') {
      violations.push(`${score.surfaceId}: paid surface with FAIL entitlement_payment_path`)
    }
    if (fulfilmentDim?.result === 'FAIL') {
      violations.push(`${score.surfaceId}: paid surface with FAIL fulfilment_state`)
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `assertNoPaidEntitlementFailures:\n${violations.map((v) => `  - ${v}`).join('\n')}`,
    )
  }
}

/**
 * Generate a plain-text estate summary report.
 */
export function generateEstateSummaryReport(): string {
  const scores = evaluateAllSurfaces()
  const lines: string[] = [
    `Product Surface Authority Report`,
    `Generated: ${new Date().toISOString()}`,
    `Total surfaces: ${scores.length}`,
    ``,
    `Exposure breakdown:`,
  ]

  const exposureGroups: Record<string, number> = {}
  for (const s of scores) {
    exposureGroups[s.currentExposure] = (exposureGroups[s.currentExposure] ?? 0) + 1
  }
  for (const [status, count] of Object.entries(exposureGroups)) {
    lines.push(`  ${status}: ${count}`)
  }

  lines.push(``, `Surfaces with FAIL gaps (${scores.filter((s) => s.failCount > 0).length}):`)
  for (const s of scores.filter((s) => s.failCount > 0)) {
    lines.push(`  [${s.currentScore}/10] ${s.displayName} — ${s.failCount} FAIL(s)`)
    if (s.highestPriorityGap) lines.push(`    ${s.highestPriorityGap}`)
  }

  const overexposed = getOverexposedSurfaces()
  if (overexposed.length > 0) {
    lines.push(``, `Overexposed surfaces (${overexposed.length}):`)
    for (const s of overexposed) {
      lines.push(`  ${s.displayName}: current=${s.currentExposure}, recommended=${s.exposureRecommendation}`)
    }
  }

  return lines.join('\n')
}

// ─── Corridor ordering ────────────────────────────────────────────────────────

/**
 * The canonical order of the Operational Decision Corridor.
 * Used to validate that no evidence-gated stage appears as open public activation.
 */
export const CORRIDOR_SURFACE_ORDER = [
  'team_assessment',
  'enterprise_assessment',
  'executive_reporting',
  'boardroom_mode',
  'strategy_room',
  'retainer_review_queue',
  'retainer_oversight',
] as const

export type CorridorSurfaceId = typeof CORRIDOR_SURFACE_ORDER[number]

/**
 * Validate corridor ordering integrity.
 * Later corridor stages must not have more permissive exposure than earlier stages.
 */
export function validateCorridorOrdering(): { valid: boolean; violations: string[] } {
  const violations: string[] = []

  const GATED_STATUSES = new Set<SurfaceExposureStatus>([
    'evidence_gated', 'review_gated', 'admin_only', 'dormant', 'hidden', 'retired',
  ])

  // Retainer Oversight must always be dormant/review_gated — never public_active or public_limited
  const retainerOversight = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === 'retainer_oversight')
  if (retainerOversight && !GATED_STATUSES.has(retainerOversight.currentExposureStatus)) {
    violations.push(
      `retainer_oversight exposure is ${retainerOversight.currentExposureStatus} — must be dormant or review_gated (not self-serve)`,
    )
  }

  // Boardroom Mode must be evidence_gated or stricter
  const boardroomMode = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === 'boardroom_mode')
  if (boardroomMode && boardroomMode.currentExposureStatus === 'public_active') {
    violations.push(`boardroom_mode is public_active — must be evidence_gated (requires prior evidence record)`)
  }

  return { valid: violations.length === 0, violations }
}
