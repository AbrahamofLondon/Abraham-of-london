/**
 * tests/product/product-estate-contract.test.ts
 * Enforces the canonical product estate contract integrity.
 */
import { describe, it, expect } from 'vitest'
import {
  PRODUCT_ESTATE,
  getProductsForDirectory,
  getProductsForPricing,
  getLiveGovernedProducts,
  getMissingCommercialSurfaceWarnings,
  getProductsByFamily,
  getProductEstateItemById,
} from '@/lib/product/product-estate-contract'
import { CATALOG } from '@/lib/commercial/catalog'

describe('PRODUCT_ESTATE completeness', () => {
  it('PRODUCT_ESTATE is a non-empty array', () => {
    expect(PRODUCT_ESTATE.length).toBeGreaterThan(20)
  })

  it('every item has required fields', () => {
    for (const item of PRODUCT_ESTATE) {
      expect(item.id, `${item.id}: missing id`).toBeTruthy()
      expect(item.name, `${item.id}: missing name`).toBeTruthy()
      expect(item.family, `${item.id}: missing family`).toBeTruthy()
      expect(item.availability, `${item.id}: missing availability`).toBeTruthy()
      expect(typeof item.governed).toBe('boolean')
      expect(typeof item.live).toBe('boolean')
      expect(typeof item.purchasable).toBe('boolean')
    }
  })

  it('every purchasable item has a checkoutProductCode and priceLabel', () => {
    for (const item of PRODUCT_ESTATE) {
      if (item.purchasable) {
        expect(item.checkoutProductCode, `${item.name}: purchasable but no checkoutProductCode`).toBeTruthy()
        expect(item.priceLabel, `${item.name}: purchasable but no priceLabel`).toBeTruthy()
      }
    }
  })

  it('every purchasable item with checkoutProductCode exists in CATALOG', () => {
    for (const item of PRODUCT_ESTATE) {
      if (item.purchasable && item.checkoutProductCode) {
        expect(
          CATALOG[item.checkoutProductCode],
          `${item.name}: checkoutProductCode '${item.checkoutProductCode}' not found in CATALOG`,
        ).toBeTruthy()
      }
    }
  })

  it('no item has availability=planned but live=true', () => {
    for (const item of PRODUCT_ESTATE) {
      if (item.live) {
        expect(item.availability, `${item.name}: live item must not be marked planned`).not.toBe('planned')
      }
    }
  })

  it('no item has purchasable=true but live=false', () => {
    for (const item of PRODUCT_ESTATE) {
      if (item.purchasable) {
        expect(item.live, `${item.name}: purchasable but not live`).toBe(true)
      }
    }
  })

  it('getMissingCommercialSurfaceWarnings returns empty array — no visibility gaps', () => {
    const warnings = getMissingCommercialSurfaceWarnings()
    expect(warnings, `Visibility gaps:\n${warnings.join('\n')}`).toEqual([])
  })

  it('getProductEstateItemById finds items by id', () => {
    expect(getProductEstateItemById('boardroom_brief')).toBeDefined()
    expect(getProductEstateItemById('nonexistent_id')).toBeUndefined()
  })
})

describe('product estate family coverage', () => {
  it('market_activation family contains boardroom_brief', () => {
    const family = getProductsByFamily('market_activation')
    expect(family.map(p => p.id)).toContain('boardroom_brief')
  })

  it('market_intelligence family contains gmi_q1_2026', () => {
    const family = getProductsByFamily('market_intelligence')
    expect(family.map(p => p.id)).toContain('gmi_q1_2026')
  })

  it('governed_instruments family contains at least 8 instruments', () => {
    const family = getProductsByFamily('governed_instruments')
    expect(family.length).toBeGreaterThanOrEqual(8)
  })

  it('operational_decision_corridor contains retainer_oversight as gated', () => {
    const family = getProductsByFamily('operational_decision_corridor')
    const oversight = family.find(p => p.id === 'retainer_oversight')
    expect(oversight).toBeDefined()
    expect(oversight!.live).toBe(false)
    expect(oversight!.availability).toBe('retainer_gated')
  })

  it('purpose_alignment is in its own family separate from operational_decision_corridor', () => {
    const purpose = PRODUCT_ESTATE.find(p => p.id === 'personal_decision_audit')
    expect(purpose).toBeDefined()
    expect(purpose!.family).toBe('purpose_alignment')
    expect(purpose!.family).not.toBe('operational_decision_corridor')
  })

  it('getLiveGovernedProducts returns only live=true governed=true items', () => {
    const live = getLiveGovernedProducts()
    for (const item of live) {
      expect(item.live).toBe(true)
      expect(item.governed).toBe(true)
    }
  })
})
