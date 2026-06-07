import { describe, expect, it } from 'vitest'
import { CATALOG } from '@/lib/commercial/catalog'
import { PRODUCT_ESTATE } from '@/lib/product/product-estate-contract'

describe('commercial catalog coherence', () => {
  it('does not sell dormant Inner Circle as an active subscription', () => {
    expect(CATALOG.inner_circle?.active).toBe(false)
    expect(CATALOG.inner_circle?.requiresCheckout).toBeFalsy()

    const innerCircle = PRODUCT_ESTATE.find((product) => product.id === 'inner_circle')
    expect(innerCircle).toBeUndefined()
  })

  it('Pressure Signal routes to the DB-backed canonical public surface', () => {
    const pressure = PRODUCT_ESTATE.find((product) => product.id === 'decision_pressure_signal')

    expect(pressure?.route).toBe('/pressure')
    expect(pressure?.purchasable).toBe(false)
    expect(pressure?.availability).toBe('free')
  })

  it('every purchasable product estate item resolves to an active catalog item', () => {
    for (const item of PRODUCT_ESTATE) {
      if (!item.purchasable) continue
      const catalogProduct = item.checkoutProductCode ? CATALOG[item.checkoutProductCode] : undefined

      expect(catalogProduct, `${item.id}: missing catalog product`).toBeDefined()
      expect(catalogProduct?.active, `${item.id}: catalog product is inactive`).toBe(true)
      expect(catalogProduct?.requiresCheckout, `${item.id}: missing checkout requirement`).toBe(true)
    }
  })

  it('active paid catalog products have Stripe IDs or an explicit manual/contracted status', () => {
    for (const product of Object.values(CATALOG)) {
      if (!product.active || product.amount <= 0) continue
      const manual = product.commercialStatus === 'manual_billing' || product.commercialStatus === 'contracted'
      const stripeMapped = Boolean(product.stripePriceId)

      expect(stripeMapped || manual, `${product.code}: missing Stripe price mapping or manual billing status`).toBe(true)
    }
  })
})
