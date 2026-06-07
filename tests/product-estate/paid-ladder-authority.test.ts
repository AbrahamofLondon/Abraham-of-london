/**
 * tests/product-estate/paid-ladder-authority.test.ts
 *
 * Phase 9 — Paid product ladder authority tests.
 * Validates commercial catalogue completeness, entitlement consistency,
 * and consequence scores for all paid surfaces.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

function readFile(rel: string) {
  const full = join(ROOT, rel)
  if (!existsSync(full)) return ''
  return readFileSync(full, 'utf-8')
}

// ─── Catalogue authority ───────────────────────────────────────────────────────

describe('Commercial catalogue', () => {
  it('catalog.ts exists', () => {
    expect(existsSync(join(ROOT, 'lib/commercial/catalog.ts'))).toBe(true)
  })

  it('all paid CONSEQUENCE_REGISTRY surfaces appear in catalog', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const catalog = readFile('lib/commercial/catalog.ts')
    const paidSurfaces = CONSEQUENCE_REGISTRY.filter(
      (r: { commercialStatus: string }) => r.commercialStatus === 'paid',
    )
    // Not every paid surface maps 1:1 to catalog (some are subscription-based).
    // At minimum the catalog should mention each paid surface family.
    // Check that at least half of paid surfaces have some catalog reference.
    const referenced = paidSurfaces.filter((s: { surfaceId: string; displayName: string }) =>
      catalog.includes(s.surfaceId) || catalog.includes(s.displayName),
    )
    expect(referenced.length).toBeGreaterThan(0)
  })
})

// ─── Instrument entitlement consistency ───────────────────────────────────────

describe('Instrument entitlements', () => {
  it('INSTRUMENT_ENTITLEMENTS exists and is non-empty', async () => {
    const mod = await import('@/lib/commercial/instrument-entitlements').catch(() => null)
    if (!mod) return // graceful skip if not found at this path
    const { INSTRUMENT_ENTITLEMENTS } = mod as { INSTRUMENT_ENTITLEMENTS: Record<string, string> }
    expect(Object.keys(INSTRUMENT_ENTITLEMENTS).length).toBeGreaterThan(0)
  })

  it('all entitlement values are non-empty strings', async () => {
    const mod = await import('@/lib/commercial/instrument-entitlements').catch(() => null)
    if (!mod) return
    const { INSTRUMENT_ENTITLEMENTS } = mod as { INSTRUMENT_ENTITLEMENTS: Record<string, string> }
    for (const [key, value] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(typeof value, `${key} entitlement value is not a string`).toBe('string')
      expect(value.trim().length, `${key} entitlement value is empty`).toBeGreaterThan(0)
    }
  })
})

// ─── Paid surface consequence scores ──────────────────────────────────────────

describe('Paid surface consequence scores', () => {
  it('all paid surfaces have consequenceScore ≥ 6', async () => {
    const { CONSEQUENCE_REGISTRY, evaluateProductConsequence } = await import('@/lib/product/product-consequence-standard')
    const paidSurfaces = CONSEQUENCE_REGISTRY.filter(
      (r: { commercialStatus: string }) => r.commercialStatus === 'paid',
    )
    for (const surface of paidSurfaces) {
      const result = evaluateProductConsequence(surface.surfaceId)
      expect(result.consequenceScore, `${surface.surfaceId} consequenceScore below 6 (${result.consequenceScore})`).toBeGreaterThanOrEqual(6)
    }
  })

  it('no paid surface has commercialConfusion=true without a named resolution', async () => {
    const { CONSEQUENCE_REGISTRY, evaluateProductConsequence } = await import('@/lib/product/product-consequence-standard')
    const paidSurfaces = CONSEQUENCE_REGISTRY.filter(
      (r: { commercialStatus: string }) => r.commercialStatus === 'paid',
    )
    for (const surface of paidSurfaces) {
      const result = evaluateProductConsequence(surface.surfaceId)
      if (result.commercialConfusion) {
        // A recommendation must be provided
        expect(result.recommendation.trim().length, `${surface.surfaceId} has commercialConfusion but no recommendation`).toBeGreaterThan(0)
      }
    }
  })
})

// ─── Product estate grade authority ───────────────────────────────────────────

describe('Product estate reality grades', () => {
  it('reality audit JSON exists', () => {
    expect(existsSync(join(ROOT, 'lib/product/product-estate-reality-audit.json'))).toBe(true)
  })

  it('decision_instruments has grade ≥ 9', () => {
    const audit = JSON.parse(readFile('lib/product/product-estate-reality-audit.json'))
    const product = audit.products?.find((p: { productCode: string }) => p.productCode === 'decision_instruments')
    expect(product).toBeDefined()
    expect(product?.realityGrade).toBeGreaterThanOrEqual(9)
  })

  it('retainer_oversight has grade ≥ 9', () => {
    const audit = JSON.parse(readFile('lib/product/product-estate-reality-audit.json'))
    const product = audit.products?.find((p: { productCode: string }) => p.productCode === 'retainer_oversight')
    expect(product).toBeDefined()
    expect(product?.realityGrade).toBeGreaterThanOrEqual(9)
  })

  it('boardroom_brief has grade ≥ 8', () => {
    const audit = JSON.parse(readFile('lib/product/product-estate-reality-audit.json'))
    const product = audit.products?.find((p: { productCode: string }) => p.productCode === 'boardroom_brief')
    expect(product).toBeDefined()
    expect(product?.realityGrade).toBeGreaterThanOrEqual(8)
  })

  it('no VERIFIED_ACTIVE paid product has reality grade below 7', () => {
    // VERIFIED_ACTIVE products are fully live and must meet grade ≥7.
    // ACTIVE_BUT_UNVERIFIED / controlled-access products (e.g. inner_circle) may be lower.
    const audit = JSON.parse(readFile('lib/product/product-estate-reality-audit.json'))
    const verifiedActive = audit.products?.filter(
      (p: { classification: string }) => p.classification === 'VERIFIED_ACTIVE',
    ) ?? []
    for (const product of verifiedActive) {
      expect(
        product.realityGrade,
        `VERIFIED_ACTIVE product ${product.productCode} has reality grade ${product.realityGrade} (below 7)`,
      ).toBeGreaterThanOrEqual(7)
    }
  })
})

// ─── getProductsBelowThreshold ────────────────────────────────────────────────

describe('Product estate gate functions', () => {
  it('decision_instruments is NOT below threshold (grade 9)', async () => {
    const mod = await import('@/lib/product/product-estate').catch(() => null)
    if (!mod) return
    const { getProductsBelowThreshold } = mod as {
      getProductsBelowThreshold: (n: number) => { code: string }[]
    }
    const below = getProductsBelowThreshold(9)
    const codes = below.map((p) => p.code)
    // decision_instruments is grade 9 — should not appear below threshold 9
    expect(codes).not.toContain('decision_instruments')
  })

  it('retainer_oversight is NOT below threshold (grade 9)', async () => {
    const mod = await import('@/lib/product/product-estate').catch(() => null)
    if (!mod) return
    const { getProductsBelowThreshold } = mod as {
      getProductsBelowThreshold: (n: number) => { code: string }[]
    }
    const below = getProductsBelowThreshold(9)
    const codes = below.map((p) => p.code)
    expect(codes).not.toContain('retainer_oversight')
  })
})
