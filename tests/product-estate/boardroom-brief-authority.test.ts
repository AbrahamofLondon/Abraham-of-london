/**
 * tests/product-estate/boardroom-brief-authority.test.ts
 *
 * Tests for the Boardroom Brief paid delivery authority gate.
 * Verifies that dev-spine fixtures are rejected for paid deliverables,
 * state machine transitions are valid, and input/artifact hashing works.
 */

import { describe, expect, it } from 'vitest'
import {
  checkPaidDeliveryAuthority,
  assertPaidDeliveryAuthorised,
  hashInputSnapshot,
  hashArtifact,
  assertDossierStateTransition,
  DEV_SPINE_FIXTURE_ID,
  ALLOWED_SOURCE_TYPES_FOR_PAID,
  BANNED_SOURCE_TYPES_FOR_PAID,
  BoardroomDeliveryAuthorityError,
  type BoardroomDossierState,
} from '@/lib/boardroom/boardroom-brief-authority'

// ─── DEV_SPINE_FIXTURE_ID ─────────────────────────────────────────────────────

describe('DEV_SPINE_FIXTURE_ID', () => {
  it('is the known fixture ID from boardroom-dev-spine.ts', () => {
    expect(DEV_SPINE_FIXTURE_ID).toBe('fixture-qualifying-001')
  })
})

// ─── checkPaidDeliveryAuthority ───────────────────────────────────────────────

describe('checkPaidDeliveryAuthority', () => {
  it('rejects the dev-spine fixture ID', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'fixture-qualifying-001',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('development fixture'))).toBe(true)
  })

  it('rejects MANUAL_SYNTHETIC_SAMPLE sourceType', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-spine-abc123',
      sourceType: 'MANUAL_SYNTHETIC_SAMPLE',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('MANUAL_SYNTHETIC_SAMPLE'))).toBe(true)
  })

  it('rejects isSample=true for paid delivery', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-spine-abc123',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: true,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('isSample is true'))).toBe(true)
  })

  it('rejects spineId with fixture- prefix', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'fixture-other-001',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('fixture-'))).toBe(true)
  })

  it('rejects spineId with demo- prefix', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'demo-spine-001',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
  })

  it('rejects spineId with sample- prefix', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'sample-spine-001',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
  })

  it('rejects unrecognised sourceType', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-spine-abc123',
      sourceType: 'MYSTERY_TYPE',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('unrecognised'))).toBe(true)
  })

  it('passes for a valid real paid delivery input', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'cld8f3k2x0000abc123real',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('passes for DIAGNOSTIC_RUN and ER_BOARDROOM_BRIDGE_RUN sourceTypes', () => {
    for (const sourceType of ['DIAGNOSTIC_RUN', 'ER_BOARDROOM_BRIDGE_RUN'] as const) {
      const result = checkPaidDeliveryAuthority({
        spineId: 'cld8f3k2x0000abc123real',
        sourceType,
        isSample: false,
      })
      expect(result.authorised).toBe(true)
    }
  })

  it('returns inputSnapshotHash when inputObject is provided', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'cld8f3k2x0000abc123real',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
      inputObject: { decision: 'some decision', owner: 'CEO' },
    })
    expect(result.authorised).toBe(true)
    expect(result.inputSnapshotHash).toBeTruthy()
    expect(result.inputSnapshotHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns null inputSnapshotHash when no inputObject provided', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'cld8f3k2x0000abc123real',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.inputSnapshotHash).toBeNull()
  })

  it('accumulates multiple violations', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'fixture-qualifying-001',
      sourceType: 'MANUAL_SYNTHETIC_SAMPLE',
      isSample: true,
    })
    expect(result.authorised).toBe(false)
    // Should have at least 3 violations: fixture ID + MANUAL_SYNTHETIC_SAMPLE + isSample
    expect(result.violations.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── assertPaidDeliveryAuthorised ─────────────────────────────────────────────

describe('assertPaidDeliveryAuthorised', () => {
  it('throws BoardroomDeliveryAuthorityError for dev-spine', () => {
    expect(() =>
      assertPaidDeliveryAuthorised({
        spineId: 'fixture-qualifying-001',
        sourceType: 'EXECUTIVE_REPORT',
        isSample: false,
      }),
    ).toThrow(BoardroomDeliveryAuthorityError)
  })

  it('throws with a message containing violations', () => {
    expect(() =>
      assertPaidDeliveryAuthorised({
        spineId: 'fixture-qualifying-001',
        sourceType: 'MANUAL_SYNTHETIC_SAMPLE',
        isSample: false,
      }),
    ).toThrow(/paid delivery authority check failed/i)
  })

  it('does not throw for valid real delivery input', () => {
    expect(() =>
      assertPaidDeliveryAuthorised({
        spineId: 'cld8f3k2x0000abc123real',
        sourceType: 'EXECUTIVE_REPORT',
        isSample: false,
      }),
    ).not.toThrow()
  })

  it('returns inputSnapshotHash when passed', () => {
    const { inputSnapshotHash } = assertPaidDeliveryAuthorised({
      spineId: 'cld8f3k2x0000abc123real',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
      inputObject: { decision: 'test decision' },
    })
    expect(inputSnapshotHash).toBeTruthy()
  })
})

// ─── Hash utilities ───────────────────────────────────────────────────────────

describe('hashInputSnapshot', () => {
  it('produces a 64-char hex string', () => {
    const hash = hashInputSnapshot({ key: 'value' })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces the same hash for identical objects', () => {
    const input = { a: 1, b: 'two', c: true }
    expect(hashInputSnapshot(input)).toBe(hashInputSnapshot(input))
  })

  it('produces different hashes for different objects', () => {
    const h1 = hashInputSnapshot({ decision: 'A' })
    const h2 = hashInputSnapshot({ decision: 'B' })
    expect(h1).not.toBe(h2)
  })
})

describe('hashArtifact', () => {
  it('produces a 64-char hex string for artifact objects', () => {
    const hash = hashArtifact({ sections: [], dossierTitle: 'Test' })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for different artifacts', () => {
    const h1 = hashArtifact({ content: 'version A' })
    const h2 = hashArtifact({ content: 'version B' })
    expect(h1).not.toBe(h2)
  })
})

// ─── Dossier state machine ────────────────────────────────────────────────────

describe('assertDossierStateTransition', () => {
  it('allows DRAFT → APPROVED', () => {
    expect(() => assertDossierStateTransition('DRAFT', 'APPROVED')).not.toThrow()
  })

  it('allows APPROVED → DELIVERED', () => {
    expect(() => assertDossierStateTransition('APPROVED', 'DELIVERED')).not.toThrow()
  })

  it('allows DELIVERED → VIEWED', () => {
    expect(() => assertDossierStateTransition('DELIVERED', 'VIEWED')).not.toThrow()
  })

  it('allows VIEWED → CONFIRMED', () => {
    expect(() => assertDossierStateTransition('VIEWED', 'CONFIRMED')).not.toThrow()
  })

  it('allows any state → REVOKED', () => {
    const states: BoardroomDossierState[] = ['DRAFT', 'APPROVED', 'DELIVERED', 'VIEWED', 'CONFIRMED']
    for (const state of states) {
      expect(() => assertDossierStateTransition(state, 'REVOKED')).not.toThrow()
    }
  })

  it('rejects DRAFT → DELIVERED (skips APPROVED)', () => {
    expect(() => assertDossierStateTransition('DRAFT', 'DELIVERED')).toThrow(
      /invalid dossier state transition/i,
    )
  })

  it('rejects DRAFT → CONFIRMED (multiple skips)', () => {
    expect(() => assertDossierStateTransition('DRAFT', 'CONFIRMED')).toThrow(
      /invalid dossier state transition/i,
    )
  })

  it('rejects CONFIRMED → DELIVERED (reverse)', () => {
    expect(() => assertDossierStateTransition('CONFIRMED', 'DELIVERED')).toThrow(
      /invalid dossier state transition/i,
    )
  })

  it('rejects REVOKED → anything (terminal state)', () => {
    const targets: BoardroomDossierState[] = ['DRAFT', 'APPROVED', 'DELIVERED', 'VIEWED', 'CONFIRMED']
    for (const target of targets) {
      expect(() => assertDossierStateTransition('REVOKED', target)).toThrow(
        /terminal state/i,
      )
    }
  })
})

// ─── Allowed / banned source types ───────────────────────────────────────────

describe('source type constants', () => {
  it('ALLOWED_SOURCE_TYPES_FOR_PAID includes all real delivery types', () => {
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID).toContain('EXECUTIVE_REPORT')
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID).toContain('DIAGNOSTIC_RUN')
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID).toContain('ER_BOARDROOM_BRIDGE_RUN')
  })

  it('BANNED_SOURCE_TYPES_FOR_PAID includes MANUAL_SYNTHETIC_SAMPLE', () => {
    expect(BANNED_SOURCE_TYPES_FOR_PAID.has('MANUAL_SYNTHETIC_SAMPLE')).toBe(true)
  })

  it('MANUAL_SYNTHETIC_SAMPLE is not in ALLOWED types', () => {
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID).not.toContain('MANUAL_SYNTHETIC_SAMPLE')
  })
})
