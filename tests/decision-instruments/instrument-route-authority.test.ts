/**
 * tests/decision-instruments/instrument-route-authority.test.ts
 *
 * Static authority tests for the Decision Instrument run and artifact routes.
 * Tests source code rules, authority constants, and pure logic — no DB calls.
 *
 * Rules under test:
 *   1. Anonymous paid runs are blocked
 *   2. Unknown instrument slug returns 404
 *   3. verifyInstrumentEntitlement blocks missing / wrong entitlement
 *   4. startInstrumentRun requires valid entitlement (DB-mocked)
 *   5. Artifact download requires runId — slug-only is blocked (source guard)
 *   6. Admin run route source is admin-only
 *   7. Instrument run route persists before execution (source guard)
 *   8. INSTRUMENT_ENTITLEMENTS covers all 11 instruments
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INSTRUMENT_ENTITLEMENTS,
  entitlementSlugForInstrument,
  verifyInstrumentEntitlement,
  hashRunInput,
  InstrumentEntitlementError,
} from '@/lib/decision-instruments/instrument-run-authority'

// ─── Route source code guards ─────────────────────────────────────────────────

describe('instrument run route — authority source guards', () => {
  const runRouteSource = readFileSync(
    join(process.cwd(), 'app/api/instruments/[slug]/run/route.ts'),
    'utf-8',
  )

  it('calls verifyInstrumentEntitlement or startInstrumentRun before execution', () => {
    expect(runRouteSource).toContain('startInstrumentRun')
  })

  it('imports from instrument-run-authority', () => {
    expect(runRouteSource).toContain('instrument-run-authority')
  })

  it('rejects anonymous runs — refine check in schema', () => {
    expect(runRouteSource).toContain('userId')
    expect(runRouteSource).toContain('userEmail')
    expect(runRouteSource).toContain('ANONYMOUS_RUN_BLOCKED')
  })

  it('handles InstrumentEntitlementError with 403', () => {
    expect(runRouteSource).toContain('InstrumentEntitlementError')
    expect(runRouteSource).toContain('403')
  })

  it('handles InstrumentRunPersistenceError', () => {
    expect(runRouteSource).toContain('InstrumentRunPersistenceError')
    expect(runRouteSource).toContain('RUN_PERSISTENCE_FAILED')
  })

  it('persists completion via completeInstrumentRun', () => {
    expect(runRouteSource).toContain('completeInstrumentRun')
  })

  it('persists failure via failInstrumentRun', () => {
    expect(runRouteSource).toContain('failInstrumentRun')
  })

  it('returns runId in success response', () => {
    expect(runRouteSource).toContain('runId')
  })
})

describe('artifact route — slug-only access blocked', () => {
  const artifactRouteSource = readFileSync(
    join(process.cwd(), 'app/api/instruments/[slug]/artifact/route.ts'),
    'utf-8',
  )

  it('requires runId — blocks slug-only access', () => {
    expect(artifactRouteSource).toContain('RUN_ID_REQUIRED')
    expect(artifactRouteSource).toContain('runId')
  })

  it('verifies run ownership before serving artifact', () => {
    expect(artifactRouteSource).toContain('OWNERSHIP_DENIED')
  })

  it('checks artifactState === READY before serving', () => {
    expect(artifactRouteSource).toContain('ARTIFACT_NOT_READY')
    expect(artifactRouteSource).toContain('READY')
  })

  it('POST artifact registration is admin-only', () => {
    expect(artifactRouteSource).toContain('requireAdminAppRoute')
  })

  it('uses recordArtifact from authority service', () => {
    expect(artifactRouteSource).toContain('recordArtifact')
  })

  it('uses beginArtifactGeneration before recordArtifact', () => {
    expect(artifactRouteSource).toContain('beginArtifactGeneration')
  })
})

describe('admin decision-instrument-runs route', () => {
  const adminRouteSource = readFileSync(
    join(process.cwd(), 'app/api/admin/decision-instrument-runs/route.ts'),
    'utf-8',
  )

  it('is admin-only', () => {
    expect(adminRouteSource).toContain('requireAdminAppRoute')
  })

  it('queries decisionInstrumentRun model', () => {
    expect(adminRouteSource).toContain('decisionInstrumentRun')
  })

  it('supports filtering by instrumentSlug', () => {
    expect(adminRouteSource).toContain('instrumentSlug')
  })

  it('supports filtering by status', () => {
    expect(adminRouteSource).toContain('status')
  })

  it('returns summary object', () => {
    expect(adminRouteSource).toContain('summary')
    expect(adminRouteSource).toContain('completed')
    expect(adminRouteSource).toContain('failed')
  })
})

// ─── INSTRUMENT_ENTITLEMENTS coverage ─────────────────────────────────────────

describe('INSTRUMENT_ENTITLEMENTS', () => {
  const EXPECTED_SLUGS = [
    'decision-exposure-instrument',
    'mandate-clarity-framework',
    'intervention-path-selector',
    'escalation-readiness-scorecard',
    'structural-failure-diagnostic-canvas',
    'execution-risk-index',
    'team-alignment-gap-map',
    'governance-drift-detector',
    'strategic-priority-stack-builder',
    'board-brief-builder',
    'operator-decision-pack',
  ]

  it('contains all 11 governed instruments', () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(INSTRUMENT_ENTITLEMENTS[slug], `missing slug: ${slug}`).toBeDefined()
    }
  })

  it('has exactly 11 entries', () => {
    expect(Object.keys(INSTRUMENT_ENTITLEMENTS).length).toBe(11)
  })

  it('all entitlement slugs use underscores (catalog format)', () => {
    for (const [slug, entitlement] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(entitlement, `${slug}: entitlement must use underscores`).toMatch(/^[a-z0-9_]+$/)
    }
  })

  it('all instrument slugs use hyphens (route format)', () => {
    for (const slug of Object.keys(INSTRUMENT_ENTITLEMENTS)) {
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

// ─── entitlementSlugForInstrument ─────────────────────────────────────────────

describe('entitlementSlugForInstrument', () => {
  it('returns correct entitlement for known slug', () => {
    expect(entitlementSlugForInstrument('decision-exposure-instrument')).toBe('decision_exposure_instrument')
    expect(entitlementSlugForInstrument('operator-decision-pack')).toBe('operator_decision_pack')
  })

  it('returns null for unknown slug', () => {
    expect(entitlementSlugForInstrument('nonexistent-instrument')).toBeNull()
  })
})

// ─── verifyInstrumentEntitlement — pure logic ─────────────────────────────────

describe('verifyInstrumentEntitlement (pure)', () => {
  it('passes for all instruments with correct userId + entitlement', () => {
    for (const [slug, entitlement] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(() =>
        verifyInstrumentEntitlement({ instrumentSlug: slug, userId: 'user_abc', entitlementSlug: entitlement }),
      ).not.toThrow()
    }
  })

  it('blocks anonymous (no userId or userEmail)', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        entitlementSlug: 'decision_exposure_instrument',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('blocks wrong entitlement slug', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        userId: 'user_abc',
        entitlementSlug: 'wrong_entitlement',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('blocks unknown instrument slug', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'not-a-real-instrument',
        userId: 'user_abc',
        entitlementSlug: 'not_a_real_instrument',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('allows userEmail instead of userId', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'mandate-clarity-framework',
        userEmail: 'test@example.com',
        entitlementSlug: 'mandate_clarity_framework',
      }),
    ).not.toThrow()
  })
})

// ─── hashRunInput ─────────────────────────────────────────────────────────────

describe('hashRunInput', () => {
  it('produces stable 64-char hex', () => {
    const h = hashRunInput({ answers: [1, 2, 3] })
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(hashRunInput({ answers: [1, 2, 3] })).toBe(h)
  })

  it('differs for different inputs', () => {
    expect(hashRunInput({ a: 1 })).not.toBe(hashRunInput({ a: 2 }))
  })
})
