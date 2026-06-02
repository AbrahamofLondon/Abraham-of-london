/**
 * tests/product/pricing-surfacing.test.ts
 * Enforces /pricing page surfacing rules.
 */
import { describe, it, expect } from 'vitest'
import {
  getProductsForPricing,
  PRODUCT_ESTATE,
} from '@/lib/product/product-estate-contract'
import { CATALOG } from '@/lib/commercial/catalog'

describe('pricing page surfacing', () => {
  const pricingItems = getProductsForPricing()

  it('boardroom_brief appears on pricing page', () => {
    expect(pricingItems.map(p => p.id)).toContain('boardroom_brief')
  })

  it('gmi_q1_2026 appears on pricing page', () => {
    expect(pricingItems.map(p => p.id)).toContain('gmi_q1_2026')
  })

  it('executive_reporting appears on pricing page', () => {
    expect(pricingItems.map(p => p.id)).toContain('executive_reporting')
  })

  it('every purchasable pricing item has a Stripe price or is manual_billing', () => {
    for (const item of pricingItems) {
      if (item.purchasable && item.checkoutProductCode) {
        const cat = CATALOG[item.checkoutProductCode]
        expect(cat, `${item.name}: not in CATALOG`).toBeTruthy()
        if (cat) {
          const ok = cat.stripePriceId !== null || cat.commercialStatus === 'manual_billing'
          expect(ok, `${item.name}: no Stripe price and not manual_billing`).toBe(true)
        }
      }
    }
  })

  it('no pricing item references a product absent from CATALOG', () => {
    for (const item of pricingItems) {
      if (item.checkoutProductCode) {
        expect(CATALOG[item.checkoutProductCode], `${item.name}: not in CATALOG`).toBeTruthy()
      }
    }
  })

  it('retainer_oversight is NOT on pricing page', () => {
    expect(pricingItems.map(p => p.id)).not.toContain('retainer_oversight')
  })

  it('all active paid catalog products with Stripe IDs surface on products or pricing', () => {
    const activePaid = Object.values(CATALOG).filter(
      p => p.active && p.commercialStatus === 'paid' && p.requiresCheckout && p.stripePriceId,
    )
    for (const cat of activePaid) {
      const surfaced = PRODUCT_ESTATE.find(
        p => p.checkoutProductCode === cat.code && (p.shouldAppearOnProducts || p.shouldAppearOnPricing),
      )
      expect(surfaced, `CATALOG '${cat.code}' (active, paid, Stripe) is not surfaced anywhere`).toBeTruthy()
    }
  })
})
