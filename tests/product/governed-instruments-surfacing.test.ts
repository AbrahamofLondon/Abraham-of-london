/**
 * tests/product/governed-instruments-surfacing.test.ts
 * Enforces governed instruments are live, surfaced, and not hidden.
 */
import { describe, it, expect } from 'vitest'
import {
  getProductsByFamily,
} from '@/lib/product/product-estate-contract'
import { CATALOG } from '@/lib/commercial/catalog'

const KNOWN_INSTRUMENT_CODES = [
  'decision_exposure_instrument',
  'mandate_clarity_framework',
  'intervention_path_selector',
  'escalation_readiness_scorecard',
  'structural_failure_diagnostic_canvas',
  'execution_risk_index',
  'team_alignment_gap_map',
  'governance_drift_detector',
  'strategic_priority_stack_builder',
  'board_brief_builder',
  'operator_decision_pack',
]

describe('governed instruments surfacing', () => {
  const instruments = getProductsByFamily('governed_instruments')

  it('governed_instruments family contains all known instruments', () => {
    const codes = instruments.map(p => p.checkoutProductCode)
    for (const code of KNOWN_INSTRUMENT_CODES) {
      expect(codes, `Instrument '${code}' missing from governed_instruments family`).toContain(code)
    }
  })

  it('all instruments are live', () => {
    for (const item of instruments) {
      expect(item.live, `${item.name}: not marked live`).toBe(true)
    }
  })

  it('all instruments are governed', () => {
    for (const item of instruments) {
      expect(item.governed, `${item.name}: not marked governed`).toBe(true)
    }
  })

  it('all instruments appear on products page', () => {
    for (const item of instruments) {
      expect(item.shouldAppearOnProducts, `${item.name}: hidden from products page`).toBe(true)
    }
  })

  it('no live instrument is marked planned', () => {
    for (const item of instruments) {
      expect(item.availability, `${item.name}: live but marked planned`).not.toBe('planned')
    }
  })

  it('all purchasable instruments exist in CATALOG as active', () => {
    for (const item of instruments) {
      if (item.purchasable && item.checkoutProductCode) {
        const cat = CATALOG[item.checkoutProductCode]
        expect(cat, `${item.name}: not in CATALOG`).toBeTruthy()
        expect(cat?.active, `${item.name}: in CATALOG but not active`).toBe(true)
      }
    }
  })

  it('all paid instruments have real Stripe price IDs', () => {
    for (const item of instruments) {
      if (item.purchasable && item.checkoutProductCode) {
        const cat = CATALOG[item.checkoutProductCode]
        if (cat?.commercialStatus === 'paid') {
          expect(cat.stripePriceId, `${item.name}: paid instrument without Stripe price ID`).toBeTruthy()
        }
      }
    }
  })
})
