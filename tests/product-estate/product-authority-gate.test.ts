/**
 * tests/product-estate/product-authority-gate.test.ts
 *
 * Tests for the product authority gate evaluation engine.
 * Verifies that exposure classification, dimension scoring, and
 * estate-wide assertions work correctly.
 */

import { describe, expect, it } from 'vitest'
import {
  evaluateProductAuthority,
  evaluateEstateAuthority,
  getProductsBelowThreshold,
  getProductsWithFailedDimensions,
  assertPublicProductsMeetThreshold,
  getEstateAuthorityGapsSummary,
} from '@/lib/product/product-authority-gate'
import {
  classifyExposureStatus,
  isCheckoutAllowed,
  isPublicDiscoverable,
  requiresWaitlist,
  isAdminOnly,
  assertCheckoutAuthorised,
  getEstateExposureMap,
  getProductsRequiringWaitlist,
  getAdminOnlyProducts,
} from '@/lib/product/product-exposure-policy'

// ─── Exposure classification ──────────────────────────────────────────────────

describe('classifyExposureStatus', () => {
  it('returns public_active for grade ≥ 9', () => {
    expect(classifyExposureStatus(9, true)).toBe('public_active')
    expect(classifyExposureStatus(10, true)).toBe('public_active')
  })

  it('returns public_limited for grade = 8', () => {
    expect(classifyExposureStatus(8, true)).toBe('public_limited')
  })

  it('returns controlled_access for grade 6–7', () => {
    expect(classifyExposureStatus(7, true)).toBe('controlled_access')
    expect(classifyExposureStatus(6, true)).toBe('controlled_access')
  })

  it('returns admin_only for grade ≤ 5', () => {
    expect(classifyExposureStatus(5, true)).toBe('admin_only')
    expect(classifyExposureStatus(0, true)).toBe('admin_only')
  })

  it('returns dormant when active=false regardless of grade', () => {
    expect(classifyExposureStatus(9, false)).toBe('dormant')
    expect(classifyExposureStatus(8, false)).toBe('dormant')
    expect(classifyExposureStatus(0, false)).toBe('dormant')
  })
})

describe('checkout and discovery flags', () => {
  it('checkout is allowed for public_active and public_limited only', () => {
    expect(isCheckoutAllowed('public_active')).toBe(true)
    expect(isCheckoutAllowed('public_limited')).toBe(true)
    expect(isCheckoutAllowed('controlled_access')).toBe(false)
    expect(isCheckoutAllowed('admin_only')).toBe(false)
    expect(isCheckoutAllowed('dormant')).toBe(false)
  })

  it('public discovery is true for public_active, public_limited, and controlled_access', () => {
    expect(isPublicDiscoverable('public_active')).toBe(true)
    expect(isPublicDiscoverable('public_limited')).toBe(true)
    expect(isPublicDiscoverable('controlled_access')).toBe(true)
    expect(isPublicDiscoverable('admin_only')).toBe(false)
    expect(isPublicDiscoverable('dormant')).toBe(false)
  })

  it('waitlist is required for controlled_access only', () => {
    expect(requiresWaitlist('controlled_access')).toBe(true)
    expect(requiresWaitlist('public_active')).toBe(false)
    expect(requiresWaitlist('public_limited')).toBe(false)
    expect(requiresWaitlist('dormant')).toBe(false)
  })

  it('admin_only is true for admin_only, dormant, hidden, retired', () => {
    expect(isAdminOnly('admin_only')).toBe(true)
    expect(isAdminOnly('dormant')).toBe(true)
    expect(isAdminOnly('hidden')).toBe(true)
    expect(isAdminOnly('retired')).toBe(true)
    expect(isAdminOnly('public_active')).toBe(false)
  })
})

// ─── assertCheckoutAuthorised ─────────────────────────────────────────────────

describe('assertCheckoutAuthorised', () => {
  it('does not throw for strategy_room (grade 8)', () => {
    expect(() => assertCheckoutAuthorised('strategy_room')).not.toThrow()
  })

  it('throws for decision_instruments (grade 6, controlled_access)', () => {
    expect(() => assertCheckoutAuthorised('decision_instruments')).toThrow(
      /checkout requires grade/i,
    )
  })

  it('throws for decision_pressure_signal (grade 6)', () => {
    expect(() => assertCheckoutAuthorised('decision_pressure_signal')).toThrow(
      /checkout requires grade/i,
    )
  })

  it('throws for unknown product code', () => {
    expect(() => assertCheckoutAuthorised('nonexistent_product_xyz')).toThrow(
      /unknown product code/i,
    )
  })
})

// ─── Estate exposure map ──────────────────────────────────────────────────────

describe('getEstateExposureMap', () => {
  it('returns an exposure status for all known products', () => {
    const map = getEstateExposureMap()
    const keys = Object.keys(map)
    expect(keys).toContain('boardroom_brief')
    expect(keys).toContain('decision_instruments')
    expect(keys).toContain('gmi_quarterly')
    expect(keys.length).toBeGreaterThanOrEqual(10)
  })

  it('inactive products are dormant regardless of grade', () => {
    const map = getEstateExposureMap()
    expect(map['retainer_oversight']).toBe('dormant')
    expect(map['inner_circle']).toBe('dormant')
  })

  it('strategy_room is public_limited (grade 8)', () => {
    const map = getEstateExposureMap()
    expect(map['strategy_room']).toBe('public_limited')
  })
})

describe('getProductsRequiringWaitlist', () => {
  it('returns products with controlled_access exposure', () => {
    const waitlist = getProductsRequiringWaitlist()
    expect(waitlist).toContain('decision_pressure_signal')
    expect(waitlist).toContain('decision_instruments')
    // strategy_room (grade 8) should NOT be in waitlist
    expect(waitlist).not.toContain('strategy_room')
  })
})

describe('getAdminOnlyProducts', () => {
  it('returns dormant products', () => {
    const adminOnly = getAdminOnlyProducts()
    expect(adminOnly).toContain('retainer_oversight')
    expect(adminOnly).toContain('inner_circle')
  })
})

// ─── evaluateProductAuthority ─────────────────────────────────────────────────

describe('evaluateProductAuthority', () => {
  it('returns a complete authority score for boardroom_brief', () => {
    const score = evaluateProductAuthority('boardroom_brief')
    expect(score.productCode).toBe('boardroom_brief')
    expect(score.realityGrade).toBe(7)
    expect(score.exposureStatus).toBe('controlled_access')
    expect(score.dimensions).toHaveLength(8)
    expect(score.checkoutAllowed).toBe(false)
    expect(score.requiresWaitlist).toBe(true)
    expect(score.publicDiscoverable).toBe(true)
    expect(score.adminOnly).toBe(false)
  })

  it('boardroom_brief has market_authority FAIL (dev-spine can persist to paid dossier)', () => {
    const score = evaluateProductAuthority('boardroom_brief')
    const marketAuthDim = score.dimensions.find((d) => d.dimension === 'market_authority')
    expect(marketAuthDim?.result).toBe('FAIL')
    expect(marketAuthDim?.note).toMatch(/fixture/)
  })

  it('decision_instruments has 4 FAIL dimensions', () => {
    const score = evaluateProductAuthority('decision_instruments')
    const failures = score.dimensions.filter((d) => d.result === 'FAIL')
    expect(failures.length).toBe(4)
    const failDims = failures.map((d) => d.dimension)
    expect(failDims).toContain('commercial')
    expect(failDims).toContain('fulfilment')
    expect(failDims).toContain('evidence_input')
    expect(failDims).toContain('admin')
  })

  it('strategy_room has 0 FAIL dimensions', () => {
    const score = evaluateProductAuthority('strategy_room')
    const failures = score.dimensions.filter((d) => d.result === 'FAIL')
    expect(failures).toHaveLength(0)
  })

  it('authorityGaps are non-empty for products with gaps', () => {
    const score = evaluateProductAuthority('decision_instruments')
    expect(score.authorityGaps.length).toBeGreaterThan(0)
    expect(score.authorityGaps.some((g) => g.includes('[FAIL]'))).toBe(true)
  })

  it('throws for unknown product code', () => {
    expect(() => evaluateProductAuthority('completely_unknown')).toThrow(
      /unknown product code/i,
    )
  })
})

// ─── Estate-wide evaluation ───────────────────────────────────────────────────

describe('evaluateEstateAuthority', () => {
  it('returns scores for all products in the estate', () => {
    const scores = evaluateEstateAuthority()
    expect(scores.length).toBeGreaterThanOrEqual(10)
  })

  it('every product has exactly 8 dimension scores', () => {
    const scores = evaluateEstateAuthority()
    for (const score of scores) {
      expect(score.dimensions).toHaveLength(8)
    }
  })
})

describe('getProductsBelowThreshold', () => {
  it('returns products below grade 8', () => {
    const below = getProductsBelowThreshold(8)
    const codes = below.map((p) => p.productCode)
    expect(codes).toContain('decision_pressure_signal')
    expect(codes).toContain('decision_instruments')
    expect(codes).toContain('boardroom_brief')
    // strategy_room (grade 8) should NOT be included (below 8, not ≤ 8)
    expect(codes).not.toContain('strategy_room')
  })
})

describe('getProductsWithFailedDimensions', () => {
  it('returns products that have at least one FAIL dimension', () => {
    const withFails = getProductsWithFailedDimensions()
    const codes = withFails.map((p) => p.productCode)
    expect(codes).toContain('decision_instruments')
    expect(codes).toContain('boardroom_brief') // market_authority FAIL
    // strategy_room has no FAIL dims
    expect(codes).not.toContain('strategy_room')
  })
})

describe('assertPublicProductsMeetThreshold', () => {
  it('throws when a checked-out product is below threshold', () => {
    // strategy_room (grade 8) has checkout allowed but below threshold 9
    expect(() => assertPublicProductsMeetThreshold(9)).toThrow(
      /assertPublicProductsMeetThreshold failed/i,
    )
  })

  it('does not throw when threshold is 7 (all checkout products are ≥ 8)', () => {
    // No product with checkout=true has grade < 7 currently
    expect(() => assertPublicProductsMeetThreshold(7)).not.toThrow()
  })
})

describe('getEstateAuthorityGapsSummary', () => {
  it('returns a ranked list with decision_instruments at the top (most FAILs)', () => {
    const summary = getEstateAuthorityGapsSummary()
    expect(summary.length).toBeGreaterThan(0)
    // decision_instruments has 4 FAILs — should be near the top
    const instrIdx = summary.findIndex((s) => s.productCode === 'decision_instruments')
    expect(instrIdx).toBeLessThanOrEqual(2) // top 3 at worst
  })

  it('every entry has productCode, grade, failCount, partialCount', () => {
    const summary = getEstateAuthorityGapsSummary()
    for (const entry of summary) {
      expect(typeof entry.productCode).toBe('string')
      expect(typeof entry.grade).toBe('number')
      expect(typeof entry.failCount).toBe('number')
      expect(typeof entry.partialCount).toBe('number')
    }
  })
})
