import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'

describe('runtime provenance audit', () => {
  it('records high-risk static or fake runtime findings until they are fixed', () => {
    const staticRisks = audit.crossCuttingFindings.filter((finding) => finding.classification === 'STATIC_OR_FAKE_RUNTIME')
    const ids = staticRisks.map((finding) => finding.id)

    expect(ids).not.toContain('boardroom_fixture_dossier_generation')
    expect(ids).toContain('living_case_fulfilment_in_memory')
    expect(ids).toContain('fake_live_dashboard')
  })

  it('does not allow products with known blockers to claim perfect reality grade', () => {
    for (const product of audit.products) {
      if (product.knownBlockers.length > 0) {
        expect(product.realityGrade, `${product.productCode}: blockers cannot be 10/10`).toBeLessThan(10)
      }
    }
  })

  it('labels editorial static curation differently from operational runtime truth', () => {
    const editorialIndex = readFileSync('pages/editorials/index.tsx', 'utf-8')
    const briefs = audit.products.find((product) => product.productCode === 'briefs_vault_editorial')

    expect(editorialIndex).toContain('editorially curated')
    expect(briefs?.runtimeTruth).toContain('Content-derived')
    expect(briefs?.knownBlockers.join(' ')).toContain('curated static list')
  })

  it('keeps GMI static fixture risk visible outside the hardened runtime', () => {
    const gmi = audit.products.find((product) => product.productCode === 'gmi_quarterly')

    expect(gmi?.runtimeTruth).toContain('DB/snapshot-derived')
    expect(gmi?.knownBlockers.join(' ')).toContain('Legacy support/admin views')
  })
})
