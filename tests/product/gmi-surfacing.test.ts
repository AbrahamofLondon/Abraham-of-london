/**
 * tests/product/gmi-surfacing.test.ts
 * Enforces Global Market Intelligence surfacing and claim rules.
 */
import { describe, it, expect } from 'vitest'
import {
  getProductsByFamily,
  getProductsForDirectory,
  getProductsForPricing,
  PRODUCT_ESTATE,
} from '@/lib/product/product-estate-contract'
import { CATALOG } from '@/lib/commercial/catalog'

describe('Global Market Intelligence surfacing', () => {
  it('market_intelligence family has at least one item', () => {
    expect(getProductsByFamily('market_intelligence').length).toBeGreaterThanOrEqual(1)
  })

  it('gmi_q1_2026 is in the product estate as live and governed', () => {
    const item = PRODUCT_ESTATE.find(p => p.id === 'gmi_q1_2026')
    expect(item).toBeDefined()
    expect(item!.live).toBe(true)
    expect(item!.governed).toBe(true)
    expect(item!.purchasable).toBe(true)
  })

  it('gmi_q1_2026 appears on products page', () => {
    expect(getProductsForDirectory().map(p => p.id)).toContain('gmi_q1_2026')
  })

  it('gmi_q1_2026 appears on pricing page', () => {
    expect(getProductsForPricing().map(p => p.id)).toContain('gmi_q1_2026')
  })

  it('gmi_q1_2026 exists in CATALOG as active paid product', () => {
    const cat = CATALOG.gmi_q1_2026
    expect(cat).toBeTruthy()
    expect(cat?.active).toBe(true)
    expect(cat?.commercialStatus).toBe('paid')
    expect(cat?.requiresCheckout).toBe(true)
  })

  it('gmi_q1_2026 has a Stripe price ID in CATALOG', () => {
    expect(CATALOG.gmi_q1_2026?.stripePriceId).toBeTruthy()
  })

  it('GMI descriptions do not use prediction-certainty language', () => {
    const prohibited = ['ai predicts', 'guaranteed forecast', 'prediction engine', 'ai market oracle', 'guaranteed market', 'certain']
    for (const item of getProductsByFamily('market_intelligence')) {
      const text = `${item.name} ${item.shortDescription} ${item.buyerDescription}`.toLowerCase()
      for (const term of prohibited) {
        expect(text, `GMI '${item.name}' contains prohibited term '${term}'`).not.toContain(term)
      }
    }
  })

  it('GMI description references prior-call review or verification', () => {
    const item = PRODUCT_ESTATE.find(p => p.id === 'gmi_q1_2026')
    expect(item).toBeDefined()
    const text = `${item!.shortDescription} ${item!.buyerDescription}`.toLowerCase()
    expect(text.includes('prior') || text.includes('review') || text.includes('verification')).toBe(true)
  })

  it('GMI family does not bleed into ODI corridor', () => {
    const corridorIds = getProductsByFamily('operational_decision_corridor').map(p => p.id)
    const gmiIds = getProductsByFamily('market_intelligence').map(p => p.id)
    for (const id of gmiIds) {
      expect(corridorIds).not.toContain(id)
    }
  })
})
