import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'
import { PRODUCT_ESTATE } from '@/lib/product/product-estate-contract'
import { CATALOG } from '@/lib/commercial/catalog'

describe('product estate reality inventory', () => {
  it('tracks the major estate surfaces with reality grades', () => {
    expect(audit.products.length).toBeGreaterThanOrEqual(10)

    for (const product of audit.products) {
      expect(product.productCode).toBeTruthy()
      expect(product.productName).toBeTruthy()
      expect(product.route).toMatch(/^\//)
      expect(product.classification).toBeTruthy()
      expect(product.realityGrade).toBeGreaterThanOrEqual(0)
      expect(product.realityGrade).toBeLessThanOrEqual(10)
      expect(product.runtimeTruth).toBeTruthy()
      expect(product.sourceOfTruthDeclaration).toBeTruthy()
    }
  })

  it('records Briefs, Vault, and Editorial as content-derived surfaces', () => {
    const briefs = audit.products.find((product) => product.productCode === 'briefs_vault_editorial')

    expect(briefs).toBeDefined()
    expect(briefs?.classification).toBe('VERIFIED_ACTIVE')
    expect(briefs?.runtimeTruth).toContain('Content-derived')
    expect(briefs?.alternateRoutes).toContain('/vault/briefs')
    expect(briefs?.alternateRoutes).toContain('/editorials')
  })

  it('keeps GMI quarterly intelligence future-edition-parametric', () => {
    expect(audit.quarterlyEditionPolicy).toContain('future editions')
    expect(audit.quarterlyEditionPolicy).toContain('edition-parametric')

    const gmi = audit.products.find((product) => product.productCode === 'gmi_quarterly')
    expect(gmi?.knownBlockers.join(' ')).toContain('future-edition-parametric')
  })

  it('keeps catalog, product estate, and audit map connected', () => {
    const estateCodes = new Set(PRODUCT_ESTATE.map((product) => product.id))
    const catalogCodes = new Set(Object.keys(CATALOG))

    expect(estateCodes.has('decision_pressure_signal')).toBe(true)
    expect(estateCodes.has('boardroom_brief')).toBe(true)
    expect(catalogCodes.has('boardroom_brief')).toBe(true)
    expect(catalogCodes.has('executive_reporting')).toBe(true)
  })
})
