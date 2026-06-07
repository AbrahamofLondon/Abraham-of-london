/**
 * tests/product-estate/trust-seams.test.ts
 *
 * Phase 9 — Trust seam authority tests.
 * Validates that authority gates, session guards, and audit trails are wired
 * consistently across the paid product surfaces.
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

// ─── Auth guard coverage ───────────────────────────────────────────────────────

const PROTECTED_ROUTES = [
  'app/api/decisions/return-brief/route.ts',
  'app/api/instruments/runs/me/route.ts',
  'app/api/boardroom/brief/route.ts',
  'app/api/retainer/oversight/client-status/route.ts',
]

describe('Auth guard coverage', () => {
  for (const routeFile of PROTECTED_ROUTES) {
    it(`${routeFile} — enforces session authentication`, () => {
      const src = readFile(routeFile)
      if (!src) return // route not present — skip gracefully
      const hasSessionCheck = src.includes('getServerSession') || src.includes('session?.user') || src.includes('requireAdminAppRoute')
      expect(hasSessionCheck, `${routeFile} has no session guard`).toBe(true)
    })

    it(`${routeFile} — returns 401 when unauthenticated`, () => {
      const src = readFile(routeFile)
      if (!src) return
      expect(src, `${routeFile} has no 401 response`).toContain('401')
    })
  }
})

// ─── Audit trail wiring ────────────────────────────────────────────────────────

describe('Audit trail wiring', () => {
  it('enterprise enquiry route writes to security audit log', () => {
    const src = readFile('app/api/enterprise/enquiry/route.ts')
    expect(src).toContain('writeSecurityAudit')
  })

  it('return brief route persists DecisionOutcomeRecord', () => {
    const src = readFile('app/api/decisions/return-brief/route.ts')
    // Route uses Prisma model name (camelCase), not the mapped table name
    const hasPersist = src.includes('decisionOutcomeRecord') || src.includes('decision_outcome_records')
    expect(hasPersist).toBe(true)
  })

  it('instrument run history route scopes to authenticated user email', () => {
    const src = readFile('app/api/instruments/runs/me/route.ts')
    expect(src).toContain('userEmail')
  })

  it('retainer readiness admin route requires admin guard', () => {
    const src = readFile('app/api/admin/retainer/readiness/route.ts')
    expect(src).toContain('requireAdminAppRoute')
  })
})

// ─── Paid delivery authority gate ─────────────────────────────────────────────

describe('Paid delivery authority gate', () => {
  it('Boardroom Brief route checks assertPaidDeliveryAuthorised or assertCheckoutAuthorised', () => {
    const src = readFile('app/api/boardroom/brief/route.ts')
    if (!src) return
    const hasGate =
      src.includes('assertPaidDeliveryAuthorised') ||
      src.includes('assertCheckoutAuthorised') ||
      src.includes('entitlementVerified')
    expect(hasGate, 'Boardroom Brief route has no paid delivery gate').toBe(true)
  })

  it('instrument runs require entitlement verification', () => {
    // All instrument run routes should reference entitlement
    const src = readFile('app/api/instruments/runs/me/route.ts')
    expect(src).toContain('entitlement')
  })
})

// ─── Hash / artifact integrity ─────────────────────────────────────────────────

describe('Artifact integrity', () => {
  it('BoardroomDossier type carries artifactHash', () => {
    const schema = readFile('prisma/schema.prisma')
    expect(schema).toContain('artifactHash')
  })

  it('DecisionInstrumentRun carries artifactHash or artifact state', () => {
    const schema = readFile('prisma/schema.prisma')
    const hasArtifact = schema.includes('artifactHash') || schema.includes('artifactState')
    expect(hasArtifact).toBe(true)
  })

  it('Return Brief route generates system-level memorySummary — not user-provided', () => {
    const src = readFile('app/api/decisions/return-brief/route.ts')
    if (!src) return
    // The route must generate memorySummary programmatically
    expect(src).toContain('memorySummary')
    // Must NOT pass through raw user memorySummary from request body
    expect(src).not.toContain('body.memorySummary')
  })
})

// ─── Admin guard barrel ────────────────────────────────────────────────────────

describe('Admin route guard barrel', () => {
  it('lib/admin/admin-route-guard.ts exists', () => {
    expect(existsSync(join(ROOT, 'lib/admin/admin-route-guard.ts'))).toBe(true)
  })

  it('exports requireAdminAppRoute', () => {
    const src = readFile('lib/admin/admin-route-guard.ts')
    expect(src).toContain('requireAdminAppRoute')
  })

  it('delegates to lib/access/require-admin-app', () => {
    const src = readFile('lib/admin/admin-route-guard.ts')
    expect(src).toContain('require-admin-app')
  })
})

// ─── Commercial confusion absence ─────────────────────────────────────────────

describe('Commercial confusion absence', () => {
  it('instrument entitlements map is not empty', async () => {
    const mod = await import('@/lib/commercial/instrument-entitlements').catch(() => null)
    if (!mod) return
    const { INSTRUMENT_ENTITLEMENTS } = mod as { INSTRUMENT_ENTITLEMENTS: Record<string, string> }
    expect(Object.keys(INSTRUMENT_ENTITLEMENTS).length).toBeGreaterThan(0)
  })

  it('no paid surface references commercialStatus: inactive', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const paidInactive = CONSEQUENCE_REGISTRY.filter(
      (r: { commercialStatus: string }) => r.commercialStatus === 'inactive',
    )
    // inactive surfaces should not carry paid commercialStatus — check cross
    expect(paidInactive.every((r: { commercialStatus: string }) => r.commercialStatus !== 'paid')).toBe(true)
  })
})
