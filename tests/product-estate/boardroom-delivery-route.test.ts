/**
 * tests/product-estate/boardroom-delivery-route.test.ts
 *
 * Regression guard for Boardroom Brief paid delivery authority enforcement.
 *
 * CRITICAL RULES under test:
 *   1. Production delivery route must not import or mention development fixture constants
 *   2. assertPaidDeliveryAuthorised() must be called in the route
 *   3. Route gates on paymentStatus === "paid"
 *   4. Fixture/demo/sample spineIds are rejected
 *   5. MANUAL_SYNTHETIC_SAMPLE sourceType is rejected
 *   6. isSample=true is rejected
 *   7. Valid paid inputs pass
 *   8. inputSnapshotHash and artifactHash utilities are stable
 *   9. State machine transitions are fully enforced
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  checkPaidDeliveryAuthority,
  assertPaidDeliveryAuthorised,
  hashInputSnapshot,
  hashArtifact,
  assertDossierStateTransition,
  DOSSIER_STATE_TRANSITIONS,
  BoardroomDeliveryAuthorityError,
  DEV_SPINE_FIXTURE_ID,
  BANNED_SOURCE_TYPES_FOR_PAID,
  ALLOWED_SOURCE_TYPES_FOR_PAID,
  type BoardroomDossierState,
} from '@/lib/boardroom/boardroom-brief-authority'

// ─── Route source code guards ─────────────────────────────────────────────────

describe('production delivery route — no fixture imports', () => {
  const routeSource = readFileSync(
    join(process.cwd(), 'app/api/admin/boardroom-delivery/generate/route.ts'),
    'utf-8',
  )

  // Only check executable lines (exclude comment lines)
  const executableLines = routeSource
    .split('\n')
    .filter((l) => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
  const executableSource = executableLines.join('\n')

  it('does not import boardroom-dev-spine in executable code', () => {
    expect(executableSource).not.toContain('boardroom-dev-spine')
  })

  it('does not reference development fixture constants anywhere in the route', () => {
    expect(routeSource).not.toContain('QUALIFYING_SPINE')
  })

  it('does not pass MANUAL_SYNTHETIC_SAMPLE as a sourceType value in non-comment lines', () => {
    const nonCommentLines = routeSource
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    const sourceTypeViolations = nonCommentLines.filter((l) =>
      l.includes('MANUAL_SYNTHETIC_SAMPLE') && l.includes('sourceType'),
    )
    expect(sourceTypeViolations).toHaveLength(0)
  })

  it('imports assertPaidDeliveryAuthorised from boardroom-brief-authority', () => {
    expect(routeSource).toContain('assertPaidDeliveryAuthorised')
    expect(routeSource).toContain('boardroom-brief-authority')
  })

  it('loads order from DB using boardroomBriefOrder.findUnique', () => {
    expect(routeSource).toContain('boardroomBriefOrder.findUnique')
  })

  it('enforces paymentStatus === "paid"', () => {
    expect(routeSource).toContain('paymentStatus')
    expect(routeSource).toContain('"paid"')
  })

  it('persists inputSnapshotHash', () => {
    expect(routeSource).toContain('inputSnapshotHash')
  })

  it('persists artifactHash', () => {
    expect(routeSource).toContain('artifactHash')
  })

  it('handles authority error with 403 response', () => {
    expect(routeSource).toContain('403')
    expect(routeSource).toContain('BoardroomDeliveryAuthorityError')
  })
})

// ─── DEV_SPINE_FIXTURE_ID and banned constants ────────────────────────────────

describe('authority constants', () => {
  it('DEV_SPINE_FIXTURE_ID is fixture-qualifying-001', () => {
    expect(DEV_SPINE_FIXTURE_ID).toBe('fixture-qualifying-001')
  })

  it('BANNED_SOURCE_TYPES_FOR_PAID contains MANUAL_SYNTHETIC_SAMPLE', () => {
    expect(BANNED_SOURCE_TYPES_FOR_PAID.has('MANUAL_SYNTHETIC_SAMPLE')).toBe(true)
  })

  it('ALLOWED_SOURCE_TYPES_FOR_PAID has at least 3 types', () => {
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID.length).toBeGreaterThanOrEqual(3)
  })

  it('ALLOWED_SOURCE_TYPES_FOR_PAID does not include MANUAL_SYNTHETIC_SAMPLE', () => {
    expect(ALLOWED_SOURCE_TYPES_FOR_PAID).not.toContain('MANUAL_SYNTHETIC_SAMPLE')
  })
})

// ─── Fixture spine rejection ──────────────────────────────────────────────────

describe('fixture spine rejection', () => {
  it('rejects fixture-qualifying-001', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: DEV_SPINE_FIXTURE_ID,
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes(DEV_SPINE_FIXTURE_ID))).toBe(true)
  })

  it('assertPaidDeliveryAuthorised throws for fixture ID', () => {
    expect(() =>
      assertPaidDeliveryAuthorised({
        spineId: DEV_SPINE_FIXTURE_ID,
        sourceType: 'EXECUTIVE_REPORT',
        isSample: false,
      }),
    ).toThrow(BoardroomDeliveryAuthorityError)
  })

  it('rejects fixture- prefix spineIds', () => {
    expect(checkPaidDeliveryAuthority({
      spineId: 'fixture-any-other-id',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    }).authorised).toBe(false)
  })

  it('rejects demo- prefix spineIds', () => {
    expect(checkPaidDeliveryAuthority({
      spineId: 'demo-client-001',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    }).authorised).toBe(false)
  })

  it('rejects sample- prefix spineIds', () => {
    expect(checkPaidDeliveryAuthority({
      spineId: 'sample-run-xyz',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    }).authorised).toBe(false)
  })
})

// ─── sourceType enforcement ───────────────────────────────────────────────────

describe('sourceType enforcement', () => {
  it('rejects MANUAL_SYNTHETIC_SAMPLE', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-cuid-1a2b3c4d',
      sourceType: 'MANUAL_SYNTHETIC_SAMPLE',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('MANUAL_SYNTHETIC_SAMPLE'))).toBe(true)
  })

  it('rejects an unrecognised sourceType', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-cuid-1a2b3c4d',
      sourceType: 'UNKNOWN_CUSTOM_TYPE',
      isSample: false,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('unrecognised'))).toBe(true)
  })

  it('passes for each allowed sourceType', () => {
    for (const sourceType of ALLOWED_SOURCE_TYPES_FOR_PAID) {
      const result = checkPaidDeliveryAuthority({
        spineId: 'real-cuid-1a2b3c4d',
        sourceType,
        isSample: false,
      })
      expect(result.authorised, `expected pass for sourceType=${sourceType}`).toBe(true)
    }
  })
})

// ─── isSample enforcement ─────────────────────────────────────────────────────

describe('isSample enforcement', () => {
  it('rejects isSample=true', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-cuid-1a2b3c4d',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: true,
    })
    expect(result.authorised).toBe(false)
    expect(result.violations.some((v) => v.includes('isSample'))).toBe(true)
  })

  it('accepts isSample=false', () => {
    const result = checkPaidDeliveryAuthority({
      spineId: 'real-cuid-1a2b3c4d',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(result.authorised).toBe(true)
  })
})

// ─── Valid delivery ───────────────────────────────────────────────────────────

describe('valid paid delivery', () => {
  it('passes all checks for a real ER order', () => {
    expect(() =>
      assertPaidDeliveryAuthorised({
        spineId: 'real-cuid-abc123def456',
        sourceType: 'EXECUTIVE_REPORT',
        isSample: false,
        inputObject: { orderId: 'ord_abc', email: 'client@example.com' },
      }),
    ).not.toThrow()
  })

  it('returns inputSnapshotHash when inputObject is provided', () => {
    const { inputSnapshotHash } = assertPaidDeliveryAuthorised({
      spineId: 'real-cuid-abc123',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
      inputObject: { orderId: 'ord_xyz', ts: '2026-06-07' },
    })
    expect(inputSnapshotHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns null inputSnapshotHash when no inputObject provided', () => {
    const { inputSnapshotHash } = assertPaidDeliveryAuthorised({
      spineId: 'real-cuid-abc123',
      sourceType: 'EXECUTIVE_REPORT',
      isSample: false,
    })
    expect(inputSnapshotHash).toBeNull()
  })
})

// ─── Hash utilities ───────────────────────────────────────────────────────────

describe('hashInputSnapshot', () => {
  it('produces 64-char hex', () => {
    expect(hashInputSnapshot({ test: true })).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic for the same input', () => {
    const input = { a: 1, b: 'x' }
    expect(hashInputSnapshot(input)).toBe(hashInputSnapshot(input))
  })

  it('differs for different inputs', () => {
    expect(hashInputSnapshot({ a: 1 })).not.toBe(hashInputSnapshot({ a: 2 }))
  })
})

describe('hashArtifact', () => {
  it('produces 64-char hex', () => {
    expect(hashArtifact({ id: 'dos_1', title: 'Test', sections: [] })).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    const artifact = { id: 'dos_1', title: 'X', sections: [1, 2] }
    expect(hashArtifact(artifact)).toBe(hashArtifact(artifact))
  })

  it('differs for different artifacts', () => {
    expect(hashArtifact({ id: 'a' })).not.toBe(hashArtifact({ id: 'b' }))
  })
})

// ─── State machine ────────────────────────────────────────────────────────────

describe('DOSSIER_STATE_TRANSITIONS', () => {
  it('all 6 states have defined transitions', () => {
    const states: BoardroomDossierState[] = ['DRAFT', 'APPROVED', 'DELIVERED', 'VIEWED', 'CONFIRMED', 'REVOKED']
    for (const s of states) {
      expect(DOSSIER_STATE_TRANSITIONS[s]).toBeDefined()
    }
  })

  it('REVOKED is terminal', () => {
    expect(DOSSIER_STATE_TRANSITIONS['REVOKED']).toHaveLength(0)
  })

  it('DRAFT cannot jump to CONFIRMED directly', () => {
    expect(DOSSIER_STATE_TRANSITIONS['DRAFT']).not.toContain('CONFIRMED')
  })
})

describe('assertDossierStateTransition', () => {
  const validPaths: [BoardroomDossierState, BoardroomDossierState][] = [
    ['DRAFT', 'APPROVED'],
    ['DRAFT', 'REVOKED'],
    ['APPROVED', 'DELIVERED'],
    ['DELIVERED', 'VIEWED'],
    ['VIEWED', 'CONFIRMED'],
    ['CONFIRMED', 'REVOKED'],
  ]

  for (const [from, to] of validPaths) {
    it(`allows ${from} → ${to}`, () => {
      expect(() => assertDossierStateTransition(from, to)).not.toThrow()
    })
  }

  const invalidPaths: [BoardroomDossierState, BoardroomDossierState][] = [
    ['DRAFT', 'CONFIRMED'],
    ['DRAFT', 'DELIVERED'],
    ['REVOKED', 'APPROVED'],
    ['CONFIRMED', 'DELIVERED'],
    ['VIEWED', 'DRAFT'],
  ]

  for (const [from, to] of invalidPaths) {
    it(`rejects ${from} → ${to}`, () => {
      expect(() => assertDossierStateTransition(from, to)).toThrow()
    })
  }
})
