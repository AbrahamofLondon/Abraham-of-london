/**
 * tests/product/retainer-oversight-readiness.test.ts
 *
 * Tests for the Retainer Oversight Readiness Gate.
 *
 * Rules:
 *   - No recommendation history → NOT_READY
 *   - Recommendation but no outcome/follow-up → NOT_READY or REVIEW_READY only
 *   - Recommendation + unresolved age threshold → REVIEW_READY
 *   - Repeated pattern + recommendation + outcome → OVERSIGHT_READY
 *   - Readiness output includes missingRequirements
 *   - Prohibited claims include institutional/monthly/retainer claims when not ready
 *   - Retainer Oversight remains GATED in paid-corridor-contract
 *   - No raw case data exposed in preview
 */

import { describe, it, expect } from 'vitest'
import { evaluateRetainerOversightReadiness } from '@/lib/product/retainer-oversight-readiness'
import type { RetainerOversightReadinessInput } from '@/lib/product/retainer-oversight-readiness'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<RetainerOversightReadinessInput> = {}): RetainerOversightReadinessInput {
  return {
    durableCaseCount: 0,
    recommendationEntryCount: 0,
    hasExecutionState: false,
    hasOutcomeReport: false,
    oldestUnresolvedRecommendationAgeDays: 0,
    repeatedPatternCount: 0,
    hasClientSafeEvidenceSummary: false,
    hasAccountIdentity: false,
    ...overrides,
  }
}

// ─── 1. No recommendation history → NOT_READY ────────────────────────────────

describe('no recommendation history', () => {
  it('returns NOT_READY when no recommendation entries exist', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(result.status).toBe('NOT_READY')
  })

  it('includes missingRequirements when nothing is available', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(result.missingRequirements.length).toBeGreaterThanOrEqual(5)
    expect(result.availableSignals.length).toBe(0)
  })

  it('includes prohibited claims when NOT_READY', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(result.prohibitedClaims.length).toBeGreaterThan(0)
    expect(result.prohibitedClaims).toContain('Institutional memory active')
    expect(result.prohibitedClaims).toContain('Monthly oversight active')
    expect(result.prohibitedClaims).toContain('Retainer cycle started')
  })
})

// ─── 2. Recommendation but no outcome/follow-up → NOT_READY or REVIEW_READY ──

describe('recommendation without outcome', () => {
  it('returns NOT_READY when recommendation exists but no execution state or outcome', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: false,
      hasOutcomeReport: false,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('NOT_READY')
    expect(result.missingRequirements).toContain('At least one execution or follow-up state required')
  })

  it('returns REVIEW_READY when recommendation + execution state exist but no outcome', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 45,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('REVIEW_READY')
  })

  it('includes missingRequirements when only partial data exists', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 10,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('NOT_READY')
    expect(result.missingRequirements.some(m => m.includes('outcome') || m.includes('unresolved'))).toBe(true)
  })
})

// ─── 3. Recommendation + unresolved age threshold → REVIEW_READY ─────────────

describe('recommendation with unresolved age threshold', () => {
  it('returns REVIEW_READY when recommendation is aged 30+ days unresolved', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 45,
      repeatedPatternCount: 0,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('REVIEW_READY')
    expect(result.availableSignals.some(s => s.includes('Unresolved recommendation'))).toBe(true)
  })

  it('returns NOT_READY when recommendation is only 5 days old', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 5,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('NOT_READY')
  })
})

// ─── 4. Repeated pattern + recommendation + outcome → OVERSIGHT_READY ────────

describe('full oversight readiness', () => {
  it('returns OVERSIGHT_READY when all thresholds are met', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('OVERSIGHT_READY')
    expect(result.missingRequirements.length).toBe(0)
  })

  it('returns REVIEW_READY when repeated patterns are missing', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 0,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('REVIEW_READY')
    expect(result.missingRequirements.some(m => m.includes('repeated pattern') || m.includes('Recurrence'))).toBe(true)
  })

  it('returns REVIEW_READY when recommendation count is below oversight threshold', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('REVIEW_READY')
  })
})

// ─── 5. Readiness output includes missingRequirements ────────────────────────

describe('missingRequirements output', () => {
  it('includes all missing requirements in the output', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(Array.isArray(result.missingRequirements)).toBe(true)
    expect(result.missingRequirements.length).toBeGreaterThan(0)
  })

  it('has empty missingRequirements when OVERSIGHT_READY', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.missingRequirements.length).toBe(0)
  })
})

// ─── 6. Prohibited claims ────────────────────────────────────────────────────

describe('prohibited claims', () => {
  it('prohibits institutional/monthly/retainer claims when NOT_READY', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(result.prohibitedClaims).toContain('Institutional memory active')
    expect(result.prohibitedClaims).toContain('Monthly oversight active')
    expect(result.prohibitedClaims).toContain('Retainer cycle started')
    expect(result.prohibitedClaims).toContain('Organisation is learning across cycles')
  })

  it('prohibits claims when REVIEW_READY', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 45,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('REVIEW_READY')
    expect(result.prohibitedClaims.length).toBeGreaterThan(0)
  })

  it('allows all claims when OVERSIGHT_READY', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.status).toBe('OVERSIGHT_READY')
    expect(result.prohibitedClaims.length).toBe(0)
  })
})

// ─── 7. Allowed preview claims ───────────────────────────────────────────────

describe('allowed preview claims', () => {
  it('NOT_READY allows only conservative preview language', () => {
    const result = evaluateRetainerOversightReadiness(makeInput())
    expect(result.allowedPreviewClaims.length).toBeGreaterThan(0)
    expect(result.allowedPreviewClaims[0]).toContain('Further outcome history')
  })

  it('REVIEW_READY allows case may qualify language', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 1,
      recommendationEntryCount: 1,
      hasExecutionState: true,
      hasOutcomeReport: false,
      oldestUnresolvedRecommendationAgeDays: 45,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.allowedPreviewClaims.some(c => c.includes('may qualify'))).toBe(true)
  })

  it('OVERSIGHT_READY allows retained oversight review eligible language', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    expect(result.allowedPreviewClaims.some(c => c.includes('oversight review eligible'))).toBe(true)
  })
})

// ─── 8. No raw case data exposed ─────────────────────────────────────────────

describe('no raw case data exposure', () => {
  it('does not include raw case data in preview claims', () => {
    const result = evaluateRetainerOversightReadiness(makeInput({
      durableCaseCount: 2,
      recommendationEntryCount: 4,
      hasExecutionState: true,
      hasOutcomeReport: true,
      oldestUnresolvedRecommendationAgeDays: 60,
      repeatedPatternCount: 2,
      hasClientSafeEvidenceSummary: true,
      hasAccountIdentity: true,
    }))
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain('rawCaseData')
    expect(serialized).not.toContain('privateCaseData')
    // All claims are generic templates, not case-specific
    for (const claim of result.allowedPreviewClaims) {
      expect(claim).not.toContain('undefined')
      expect(claim).not.toContain('[object Object]')
    }
  })
})
