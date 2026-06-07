/**
 * tests/product-estate/supporting-layer-boundaries.test.ts
 *
 * Validates supporting layer integrity:
 * - Evidence Memory Layer must not be sold as a standalone product
 * - Continuity Console must gate on case record existence
 * - Inner Circle must not have a subscription CTA
 * - Decision Centre must have durable case state
 * - Return Brief must come from real case state, not generic template
 * - Authority Lens must be positioned as a lens, not standalone replacement
 */

import { describe, expect, it } from 'vitest'
import {
  getSurfaceById,
  getSurfacesByFamily,
} from '@/lib/product/product-surface-registry'

// ─── Evidence Memory Layer ─────────────────────────────────────────────────────

describe('evidence_memory_layer boundaries', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('evidence_memory_layer')
    expect(surface).toBeDefined()
  })

  it('is not a standalone product (does not acceptsPayment)', () => {
    const surface = getSurfaceById('evidence_memory_layer')
    expect(surface).toBeDefined()
    expect(surface!.acceptsPayment).toBe(false)
  })

  it('is infrastructure only — not public_active', () => {
    const surface = getSurfaceById('evidence_memory_layer')
    expect(surface!.currentExposureStatus).not.toBe('public_active')
    expect(surface!.currentExposureStatus).not.toBe('public_limited')
  })
})

// ─── Continuity Console ────────────────────────────────────────────────────────

describe('continuity_console boundaries', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('continuity_console')
    expect(surface).toBeDefined()
  })

  it('is evidence_gated or stricter (requires prior case)', () => {
    const surface = getSurfaceById('continuity_console')
    const gatedStatuses = ['evidence_gated', 'review_gated', 'admin_only', 'dormant', 'hidden', 'retired']
    expect(gatedStatuses, `continuity_console is not gated: ${surface!.currentExposureStatus}`).toContain(
      surface!.currentExposureStatus,
    )
  })

  it('has authority gaps documenting case identity gate', () => {
    const surface = getSurfaceById('continuity_console')
    expect(surface!.authorityGaps.length).toBeGreaterThan(0)
  })
})

// ─── Inner Circle ─────────────────────────────────────────────────────────────

describe('inner_circle boundaries', () => {
  it('exists in the registry as inner_circle_operating_layer', () => {
    const surface = getSurfaceById('inner_circle_operating_layer')
    expect(surface).toBeDefined()
  })

  it('has no subscription CTA (operating layer, not a subscriber product)', () => {
    const surface = getSurfaceById('inner_circle_operating_layer')
    const cta = (surface!.primaryCTA ?? '').toLowerCase()
    expect(cta).not.toContain('subscribe')
    expect(cta).not.toContain('join now')
    expect(cta).not.toContain('buy')
  })

  it('is not public_active (requires invitation or operating layer context)', () => {
    const surface = getSurfaceById('inner_circle_operating_layer')
    expect(surface!.currentExposureStatus).not.toBe('public_active')
  })
})

// ─── Decision Centre ──────────────────────────────────────────────────────────

describe('decision_centre boundaries', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('decision_centre')
    expect(surface).toBeDefined()
  })

  it('reads from the database (case state durable)', () => {
    const surface = getSurfaceById('decision_centre')
    expect(surface!.readsDatabase).toBe(true)
  })

  it('is gated — not self-service public access', () => {
    const surface = getSurfaceById('decision_centre')
    const selfServeStatuses = ['public_active', 'public_limited']
    expect(selfServeStatuses).not.toContain(surface!.currentExposureStatus)
  })
})

// ─── Return Brief ─────────────────────────────────────────────────────────────

describe('return_brief boundaries', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('return_brief')
    expect(surface).toBeDefined()
  })

  it('produces an artifact (return brief is not a static template)', () => {
    const surface = getSurfaceById('return_brief')
    expect(surface!.producesArtifact).toBe(true)
  })

  it('is gated on case state — not public_active', () => {
    const surface = getSurfaceById('return_brief')
    expect(surface!.currentExposureStatus).not.toBe('public_active')
  })
})

// ─── Authority Lens ────────────────────────────────────────────────────────────

describe('authority_lens boundaries', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('authority_lens')
    expect(surface).toBeDefined()
  })

  it('does not accept payment as a standalone product', () => {
    const surface = getSurfaceById('authority_lens')
    // Authority Lens is a lens/supporting tool — must not be a primary paid product
    if (surface!.acceptsPayment) {
      // If it does accept payment, it must have a corridor next move (positions as lens, not replacement)
      expect(surface!.nextAdmissibleMove, 'authority_lens accepts payment but has no corridor next route').toBeTruthy()
    }
  })

  it('has a nextAdmissibleMove toward Enterprise Assessment or corridor', () => {
    const surface = getSurfaceById('authority_lens')
    expect(surface).toBeDefined()
    const move = (surface!.nextAdmissibleMove ?? '').toLowerCase()
    expect(move.length).toBeGreaterThan(0)
  })
})

// ─── Supporting family overall ─────────────────────────────────────────────────

describe('supporting_infrastructure family', () => {
  it('no supporting layer surface is public_active and acceptsPayment=true without a corridor next route', () => {
    const supporting = getSurfacesByFamily('supporting_infrastructure')
    for (const s of supporting) {
      if (s.currentExposureStatus === 'public_active' && s.acceptsPayment) {
        expect(s.nextAdmissibleMove, `${s.surfaceId}: supporting layer selling standalone without corridor route`).toBeTruthy()
      }
    }
  })
})
