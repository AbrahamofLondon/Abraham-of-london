import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'

const paidProductCodes = [
  'boardroom_brief',
  'strategy_room',
  'executive_reporting',
  'decision_instruments',
  'professional',
]

describe('paid product authority coverage', () => {
  it('every paid product has persisted state or an explicit authority gap', () => {
    for (const code of paidProductCodes) {
      const product = audit.products.find((item) => item.productCode === code)
      expect(product, `${code}: missing from audit`).toBeDefined()

      const hasPersistedState = Boolean(product?.dbModelsUsed.length)
      const hasRecordedGap = Boolean(product?.knownBlockers.length)
      expect(hasPersistedState || hasRecordedGap, `${code}: no persisted state and no recorded gap`).toBe(true)
    }
  })

  it('records the weakest paid-product authority gaps explicitly', () => {
    const boardroom = audit.products.find((item) => item.productCode === 'boardroom_brief')
    const instruments = audit.products.find((item) => item.productCode === 'decision_instruments')

    expect(boardroom?.knownBlockers.join(' ')).toContain('paid BoardroomBriefOrder')
    expect(instruments?.knownBlockers.join(' ')).toContain('price/catalog truth is duplicated')
    expect(instruments?.knownBlockers.join(' ')).toContain('browser smoke')
  })

  it('active paid products expose admin visibility or an explicit exception', () => {
    for (const code of paidProductCodes) {
      const product = audit.products.find((item) => item.productCode === code)
      const hasAdminSurface = Boolean(product?.adminRoutes.length)
      const hasKnownException = false

      expect(hasAdminSurface || hasKnownException, `${code}: missing admin visibility`).toBe(true)
    }
  })
})
