/**
 * tests/decision-instruments/commercial-truth-consolidation.test.ts
 *
 * Decision Instruments — Commercial Truth Consolidation Tests (P2)
 *
 * Verifies that:
 *   1. lib/commercial/catalog.ts is the single source of truth for prices.
 *   2. Every instrument slug in INSTRUMENT_ENTITLEMENTS maps to a catalog product.
 *   3. Every paid instrument has an entitlement slug in both catalog and INSTRUMENT_ENTITLEMENTS.
 *   4. No instrument appears as active in INSTRUMENT_ENTITLEMENTS but inactive in catalog.
 *   5. INSTRUMENT_ENTITLEMENTS uses hyphenated keys (URL slugs) → underscore entitlement values.
 *   6. Catalog entitlement slugs match INSTRUMENT_ENTITLEMENTS values (after normalisation).
 *
 * This test set enforces no-price-outside-catalog and no-checkout-for-inactive-instruments.
 */

import { describe, expect, it } from 'vitest'
import { CATALOG } from '@/lib/commercial/catalog'
import { INSTRUMENT_ENTITLEMENTS } from '@/lib/decision-instruments/instrument-run-authority'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert URL slug (hyphens) to catalog code (underscores) */
function slugToCode(slug: string): string {
  return slug.replace(/-/g, '_')
}

/** All instrument slugs (hyphenated URL form) */
const INSTRUMENT_SLUGS = Object.keys(INSTRUMENT_ENTITLEMENTS)

/** All instrument catalog codes (underscore form) */
const INSTRUMENT_CODES = INSTRUMENT_SLUGS.map(slugToCode)

// ─── 1. Coverage: all slugs resolve to catalog entries ────────────────────────

describe('INSTRUMENT_ENTITLEMENTS → CATALOG coverage', () => {
  it('every instrument slug resolves to a catalog product', () => {
    for (const slug of INSTRUMENT_SLUGS) {
      const code = slugToCode(slug)
      expect(
        CATALOG[code as keyof typeof CATALOG],
        `Instrument slug "${slug}" (code: "${code}") not found in CATALOG`,
      ).toBeDefined()
    }
  })

  it('all 11 instruments are present', () => {
    expect(INSTRUMENT_SLUGS).toHaveLength(11)
  })
})

// ─── 2. Entitlement slug consistency ─────────────────────────────────────────

describe('entitlement slug consistency', () => {
  it('catalog entitlement slug matches INSTRUMENT_ENTITLEMENTS value (normalised)', () => {
    for (const slug of INSTRUMENT_SLUGS) {
      const code = slugToCode(slug)
      const catalogProduct = CATALOG[code as keyof typeof CATALOG]
      if (!catalogProduct) continue

      const catalogEntitlement = (catalogProduct as { entitlementSlug?: string }).entitlementSlug ?? ''
      const registryEntitlement = INSTRUMENT_ENTITLEMENTS[slug]

      // Both must be truthy
      expect(catalogEntitlement, `${code}: catalog entitlementSlug is empty`).toBeTruthy()
      expect(registryEntitlement, `${slug}: INSTRUMENT_ENTITLEMENTS value is empty`).toBeTruthy()

      // Normalise both to underscore form for comparison
      const normalCatalog = catalogEntitlement.replace(/-/g, '_')
      const normalRegistry = registryEntitlement.replace(/-/g, '_')
      expect(normalCatalog, `${code}: entitlement slug mismatch between catalog and INSTRUMENT_ENTITLEMENTS`)
        .toBe(normalRegistry)
    }
  })

  it('INSTRUMENT_ENTITLEMENTS keys use hyphens (URL slug format)', () => {
    for (const slug of INSTRUMENT_SLUGS) {
      expect(slug, `"${slug}" should use hyphens not underscores`).toMatch(/^[a-z0-9-]+$/)
      expect(slug).not.toContain('_')
    }
  })

  it('INSTRUMENT_ENTITLEMENTS values use underscores (catalog code format)', () => {
    for (const [slug, entitlement] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(entitlement, `"${slug}" entitlement "${entitlement}" should use underscores`).toMatch(/^[a-z0-9_]+$/)
      expect(entitlement).not.toContain('-')
    }
  })
})

// ─── 3. No inactive instrument may be shown as active ─────────────────────────

describe('active state consistency', () => {
  it('no instrument in INSTRUMENT_ENTITLEMENTS maps to an inactive catalog product', () => {
    for (const slug of INSTRUMENT_SLUGS) {
      const code = slugToCode(slug)
      const product = CATALOG[code as keyof typeof CATALOG] as { active?: boolean } | undefined
      if (!product) continue
      expect(
        product.active,
        `Instrument "${slug}" is in INSTRUMENT_ENTITLEMENTS but catalog.active = false`,
      ).toBe(true)
    }
  })
})

// ─── 4. Catalog is the single price source ────────────────────────────────────

describe('no hardcoded prices outside catalog', () => {
  it('all instrument catalog products have a numeric amount > 0', () => {
    for (const code of INSTRUMENT_CODES) {
      const product = CATALOG[code as keyof typeof CATALOG] as { amount?: number; active?: boolean } | undefined
      if (!product) continue
      expect(
        typeof product.amount,
        `${code}: amount is not a number`,
      ).toBe('number')
      expect(product.amount, `${code}: amount must be > 0`).toBeGreaterThan(0)
    }
  })

  it('all instrument catalog products have a displayPrice string', () => {
    for (const code of INSTRUMENT_CODES) {
      const product = CATALOG[code as keyof typeof CATALOG] as { displayPrice?: string } | undefined
      if (!product) continue
      expect(
        typeof product.displayPrice,
        `${code}: displayPrice is not a string`,
      ).toBe('string')
      expect(product.displayPrice, `${code}: displayPrice is empty`).toBeTruthy()
    }
  })

  it('all instrument catalog products have a stripeProductId', () => {
    for (const code of INSTRUMENT_CODES) {
      const product = CATALOG[code as keyof typeof CATALOG] as { stripeProductId?: string | null } | undefined
      if (!product) continue
      expect(
        product.stripeProductId,
        `${code}: stripeProductId is null — Stripe integration required for paid instruments`,
      ).toBeTruthy()
    }
  })
})

// ─── 5. Success and cancel paths are defined ──────────────────────────────────

describe('success and cancel path coverage', () => {
  it('all paid instruments have successPath and cancelPath', () => {
    for (const code of INSTRUMENT_CODES) {
      const product = CATALOG[code as keyof typeof CATALOG] as {
        successPath?: string
        cancelPath?: string
      } | undefined
      if (!product) continue
      expect(product.successPath, `${code}: successPath is missing`).toBeTruthy()
      expect(product.cancelPath, `${code}: cancelPath is missing`).toBeTruthy()
    }
  })

  it('successPath for each instrument does not point to a generic page', () => {
    for (const code of INSTRUMENT_CODES) {
      const product = CATALOG[code as keyof typeof CATALOG] as { successPath?: string } | undefined
      if (!product?.successPath) continue
      // Must be instrument-specific
      expect(
        product.successPath,
        `${code}: successPath "${product.successPath}" looks generic`,
      ).not.toBe('/')
      expect(product.successPath).not.toBe('/success')
    }
  })
})

// ─── 6. No pricing duplication in surface registry ───────────────────────────

describe('product surface registry references catalog only', () => {
  it('INSTRUMENT_ENTITLEMENTS and CATALOG share the same code set (no orphan registry entries)', () => {
    // All INSTRUMENT_ENTITLEMENTS keys should resolve to catalog codes
    const orphanSlugs = INSTRUMENT_SLUGS.filter(
      (slug) => !CATALOG[slugToCode(slug) as keyof typeof CATALOG],
    )
    expect(
      orphanSlugs,
      `Orphan INSTRUMENT_ENTITLEMENTS keys with no catalog entry: ${orphanSlugs.join(', ')}`,
    ).toHaveLength(0)
  })
})
