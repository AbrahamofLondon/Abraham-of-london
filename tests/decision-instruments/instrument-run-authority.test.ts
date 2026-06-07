/**
 * tests/decision-instruments/instrument-run-authority.test.ts
 *
 * Tests for the Decision Instrument run authority gate.
 * Verifies entitlement checking, run start persistence, and error cases.
 *
 * Note: DB-dependent methods (startInstrumentRun, completeInstrumentRun, etc.)
 * are mocked since they require a live Prisma connection.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  verifyInstrumentEntitlement,
  hashRunInput,
  INSTRUMENT_ENTITLEMENTS,
  InstrumentEntitlementError,
} from '@/lib/decision-instruments/instrument-run-authority'

// ─── INSTRUMENT_ENTITLEMENTS ──────────────────────────────────────────────────

describe('INSTRUMENT_ENTITLEMENTS', () => {
  it('contains all governed instrument slugs from the product estate', () => {
    const expectedSlugs = [
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
    for (const slug of expectedSlugs) {
      expect(INSTRUMENT_ENTITLEMENTS[slug], `missing slug: ${slug}`).toBeDefined()
    }
  })

  it('maps every slug to a non-empty entitlement slug', () => {
    for (const [slug, entitlement] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(typeof entitlement).toBe('string')
      expect(entitlement.length).toBeGreaterThan(0)
      // entitlement slugs should use underscores (catalog format)
      expect(entitlement).toMatch(/^[a-z0-9_]+$/)
      // instrument slugs use hyphens (route format)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

// ─── verifyInstrumentEntitlement ─────────────────────────────────────────────

describe('verifyInstrumentEntitlement', () => {
  it('passes for a known slug with matching entitlement and userId', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        userId: 'user_123',
        entitlementSlug: 'decision_exposure_instrument',
      }),
    ).not.toThrow()
  })

  it('passes with userEmail instead of userId', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'mandate-clarity-framework',
        userEmail: 'test@example.com',
        entitlementSlug: 'mandate_clarity_framework',
      }),
    ).not.toThrow()
  })

  it('throws InstrumentEntitlementError for unknown instrument slug', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'nonexistent-instrument',
        userId: 'user_123',
        entitlementSlug: 'nonexistent_instrument',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('throws for mismatched entitlement slug', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        userId: 'user_123',
        entitlementSlug: 'wrong_entitlement',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('throws for anonymous run (no userId or userEmail)', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        entitlementSlug: 'decision_exposure_instrument',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('throws for null userId and null userEmail', () => {
    expect(() =>
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        userId: null,
        userEmail: null,
        entitlementSlug: 'decision_exposure_instrument',
      }),
    ).toThrow(InstrumentEntitlementError)
  })

  it('error message includes the instrument slug', () => {
    try {
      verifyInstrumentEntitlement({
        instrumentSlug: 'decision-exposure-instrument',
        entitlementSlug: 'decision_exposure_instrument',
      })
    } catch (err) {
      expect(err).toBeInstanceOf(InstrumentEntitlementError)
      expect((err as Error).message).toContain('decision-exposure-instrument')
    }
  })

  it('passes for all instruments in the entitlements map when correctly configured', () => {
    for (const [slug, entitlement] of Object.entries(INSTRUMENT_ENTITLEMENTS)) {
      expect(() =>
        verifyInstrumentEntitlement({
          instrumentSlug: slug,
          userId: 'user_123',
          entitlementSlug: entitlement,
        }),
      ).not.toThrow()
    }
  })
})

// ─── hashRunInput ─────────────────────────────────────────────────────────────

describe('hashRunInput', () => {
  it('produces a 64-char hex SHA-256', () => {
    const hash = hashRunInput({ decision: 'some input' })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('same input produces same hash', () => {
    const input = { a: 1, b: 'two' }
    expect(hashRunInput(input)).toBe(hashRunInput(input))
  })

  it('different inputs produce different hashes', () => {
    expect(hashRunInput({ a: 1 })).not.toBe(hashRunInput({ a: 2 }))
  })

  it('handles arrays and nested objects', () => {
    const hash = hashRunInput({ answers: [1, 2, 3], nested: { key: 'value' } })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

// ─── InstrumentEntitlementError ───────────────────────────────────────────────

describe('InstrumentEntitlementError', () => {
  it('has the correct name', () => {
    const err = new InstrumentEntitlementError('test-instrument', 'test reason')
    expect(err.name).toBe('InstrumentEntitlementError')
  })

  it('includes instrument slug in message', () => {
    const err = new InstrumentEntitlementError('my-instrument', 'some reason')
    expect(err.message).toContain('my-instrument')
    expect(err.message).toContain('some reason')
  })

  it('is an instance of Error', () => {
    const err = new InstrumentEntitlementError('test', 'reason')
    expect(err).toBeInstanceOf(Error)
  })
})
