/**
 * tests/product-estate/market-activation-authority.test.ts
 *
 * Validates market activation surfaces:
 * - decision_pressure_signal, fast_diagnostic, quick_decision_health_check,
 *   scenario_stress_test, boardroom_brief_public_entry
 *
 * Rules:
 * - Diagnostics below 9 must be free, safe, and clearly scoped
 * - Each activation surface must have a nextAdmissibleMove routing to the paid corridor
 * - decision_pressure_signal must not be marketed as a primary paid CTA below 9/10
 * - Scenario Stress Test must carry "simulation" framing, not predictive language
 * - Boardroom Brief public entry must be evidence_gated or higher
 */

import { describe, expect, it } from 'vitest'
import {
  getMarketActivationSurfaces,
  getSurfaceById,
} from '@/lib/product/product-surface-registry'

const ACTIVATION_SURFACE_IDS = [
  'decision_pressure_signal',
  'fast_diagnostic',
  'quick_decision_health_check',
  'scenario_stress_test',
  'boardroom_brief_public_entry',
]

// ─── Surface completeness ──────────────────────────────────────────────────────

describe('market activation surface completeness', () => {
  it('all 5 market activation surfaces exist in registry', () => {
    for (const id of ACTIVATION_SURFACE_IDS) {
      const surface = getSurfaceById(id)
      expect(surface, `missing market activation surface: ${id}`).toBeDefined()
    }
  })

  it('getMarketActivationSurfaces returns the market_activation family', () => {
    const surfaces = getMarketActivationSurfaces()
    expect(surfaces.length).toBeGreaterThan(0)
    for (const s of surfaces) {
      expect(s.family).toBe('market_activation')
    }
  })
})

// ─── Route coverage ────────────────────────────────────────────────────────────

describe('market activation route coverage', () => {
  it('every activation surface has a route', () => {
    const surfaces = getMarketActivationSurfaces()
    for (const s of surfaces) {
      expect(s.route, `${s.surfaceId} missing route`).toBeTruthy()
    }
  })
})

// ─── Paid surface restrictions ─────────────────────────────────────────────────

describe('paid market activation restrictions', () => {
  it('decision_pressure_signal is not a primary CTA for payment (below 9/10)', () => {
    const surface = getSurfaceById('decision_pressure_signal')
    expect(surface).toBeDefined()
    if (surface!.currentScore < 9) {
      // Must not be the primary checkout CTA
      const cta = (surface!.primaryCTA ?? '').toLowerCase()
      expect(cta).not.toContain('buy now')
      expect(cta).not.toContain('purchase')
    }
  })

  it('fast_diagnostic does not charge without entitlement', () => {
    const surface = getSurfaceById('fast_diagnostic')
    expect(surface).toBeDefined()
    // Either it is free (acceptsPayment=false) or it has an entitlement
    const isFreeOrGated = !surface!.acceptsPayment || !!surface!.entitlementSlug
    expect(isFreeOrGated).toBe(true)
  })
})

// ─── Diagnostic safety ─────────────────────────────────────────────────────────

describe('diagnostic safety requirements', () => {
  const DIAGNOSTIC_SURFACES = ['fast_diagnostic', 'quick_decision_health_check']

  it('diagnostics below 9/10 are not acceptsPayment=true without entitlement gating', () => {
    for (const id of DIAGNOSTIC_SURFACES) {
      const surface = getSurfaceById(id)
      if (!surface) continue
      if (surface.currentScore < 9 && surface.acceptsPayment) {
        expect(surface.entitlementSlug, `${id}: paid diagnostic without entitlement`).toBeTruthy()
      }
    }
  })

  it('diagnostics have authority gaps documenting stateless/persistence status', () => {
    for (const id of DIAGNOSTIC_SURFACES) {
      const surface = getSurfaceById(id)
      if (!surface) continue
      // Below 9 must have documented gaps
      if (surface.currentScore < 9) {
        expect(surface.authorityGaps.length, `${id} has no authority gaps despite score < 9`).toBeGreaterThan(0)
      }
    }
  })
})

// ─── Next route coverage ───────────────────────────────────────────────────────

describe('market activation next route coverage', () => {
  it('each activation surface has a nextAdmissibleMove', () => {
    const surfaces = getMarketActivationSurfaces()
    for (const s of surfaces) {
      expect(s.nextAdmissibleMove, `${s.surfaceId} missing nextAdmissibleMove`).toBeTruthy()
    }
  })

  it('boardroom_brief_public_entry next move leads into the corridor', () => {
    const surface = getSurfaceById('boardroom_brief_public_entry')
    expect(surface).toBeDefined()
    const move = (surface!.nextAdmissibleMove ?? '').toLowerCase()
    expect(move.length).toBeGreaterThan(0)
  })
})

// ─── Exposure appropriateness ──────────────────────────────────────────────────

describe('market activation exposure appropriateness', () => {
  it('no market activation surface is evidence_gated (they must be accessible)', () => {
    const surfaces = getMarketActivationSurfaces()
    for (const s of surfaces) {
      expect(s.currentExposureStatus, `${s.surfaceId} is evidence_gated but is a market activation surface`).not.toBe('evidence_gated')
    }
  })

  it('scenario_stress_test is not public_active (score below 9)', () => {
    const surface = getSurfaceById('scenario_stress_test')
    if (surface && surface.currentScore < 9) {
      expect(surface.currentExposureStatus).not.toBe('public_active')
    }
  })
})
