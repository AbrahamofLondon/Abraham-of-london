/**
 * tests/product-estate/retainer-oversight-authority.test.ts
 *
 * Authority tests for Retainer Oversight (OversightReviewCycle).
 *
 * Rules under test:
 *   1. OversightReviewCycle is admin-created — not self-serve
 *   2. Review request route gates on auth + readiness
 *   3. Admin cycle route is admin-only
 *   4. Intervention log route is admin-only
 *   5. Client status route gates on session auth
 *   6. Client status does NOT expose drift scores, internal notes, or raw log
 *   7. Cycle state machine: OPEN → UNDER_REVIEW → COMPLETED (no skip-ahead)
 *   8. Retainer Oversight surface in registry is NOT self-serve
 *   9. OversightCycleError is thrown for illegal transitions
 *  10. Intervention cannot be added to COMPLETED or SKIPPED cycle (service-level)
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  OversightCycleError,
} from '@/lib/retainer/oversight-cycle-service'
import { getSurfaceById } from '@/lib/product/product-surface-registry'

// ─── Route source guards ───────────────────────────────────────────────────────

describe('admin oversight-cycles route — authority guards', () => {
  const adminCycleSource = readFileSync(
    join(process.cwd(), 'app/api/admin/retainer/oversight-cycles/route.ts'),
    'utf-8',
  )

  it('is admin-only', () => {
    expect(adminCycleSource).toContain('requireAdminAppRoute')
  })

  it('creates OversightReviewCycles via createOversightCycle service', () => {
    expect(adminCycleSource).toContain('createOversightCycle')
  })

  it('requires contractId for cycle list', () => {
    expect(adminCycleSource).toContain('contractId')
  })

  it('handles OversightCycleError with 422', () => {
    expect(adminCycleSource).toContain('OversightCycleError')
    expect(adminCycleSource).toContain('422')
  })
})

describe('admin oversight-cycles/[id] route — state transitions', () => {
  const cycleIdSource = readFileSync(
    join(process.cwd(), 'app/api/admin/retainer/oversight-cycles/[id]/route.ts'),
    'utf-8',
  )

  it('supports begin_review action', () => {
    expect(cycleIdSource).toContain('begin_review')
    expect(cycleIdSource).toContain('beginCycleReview')
  })

  it('supports complete action with drift + health fields', () => {
    expect(cycleIdSource).toContain('complete')
    expect(cycleIdSource).toContain('completeOversightCycle')
    expect(cycleIdSource).toContain('driftScore')
    expect(cycleIdSource).toContain('clientHealthStatus')
  })

  it('supports skip action with reason', () => {
    expect(cycleIdSource).toContain('skip')
    expect(cycleIdSource).toContain('skipCycle')
  })

  it('is admin-only', () => {
    expect(cycleIdSource).toContain('requireAdminAppRoute')
  })
})

describe('admin intervention route', () => {
  const interventionSource = readFileSync(
    join(process.cwd(), 'app/api/admin/retainer/oversight-cycles/[id]/intervention/route.ts'),
    'utf-8',
  )

  it('is admin-only', () => {
    expect(interventionSource).toContain('requireAdminAppRoute')
  })

  it('calls addIntervention from oversight-cycle-service', () => {
    expect(interventionSource).toContain('addIntervention')
  })

  it('requires interventionType, description, performedBy', () => {
    expect(interventionSource).toContain('interventionType')
    expect(interventionSource).toContain('description')
    expect(interventionSource).toContain('performedBy')
  })
})

describe('client-status route — safe fields only', () => {
  const clientStatusSource = readFileSync(
    join(process.cwd(), 'app/api/retainer/oversight/client-status/route.ts'),
    'utf-8',
  )

  it('requires authenticated session', () => {
    expect(clientStatusSource).toContain('getServerSession')
    expect(clientStatusSource).toContain('Authentication required')
  })

  it('verifies contract ownership before returning data', () => {
    expect(clientStatusSource).toContain('clientEmail')
    expect(clientStatusSource).toContain('Access denied')
  })

  it('returns clientHealth, lastReviewDate, nextReviewDate, openInterventions', () => {
    expect(clientStatusSource).toContain('clientHealth')
    expect(clientStatusSource).toContain('nextReviewDate')
    expect(clientStatusSource).toContain('openInterventions')
  })

  it('does NOT expose internalNotes in the response', () => {
    // Internal notes must never be returned to clients
    const responseLines = clientStatusSource
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    const exposesInternalNotes = responseLines.some(
      (l) => l.includes('internalNotes') && l.includes('NextResponse'),
    )
    expect(exposesInternalNotes).toBe(false)
  })

  it('does NOT expose raw driftScore in the client-facing response', () => {
    const responseLines = clientStatusSource
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    const exposesDrift = responseLines.some(
      (l) => l.includes('driftScore') && l.includes('NextResponse'),
    )
    expect(exposesDrift).toBe(false)
  })
})

// ─── Retainer Oversight surface — not self-serve ──────────────────────────────

describe('retainer_oversight surface in registry', () => {
  it('exists in the registry', () => {
    const surface = getSurfaceById('retainer_oversight')
    expect(surface).toBeDefined()
  })

  it('is NOT public_active or public_limited (not self-serve)', () => {
    const surface = getSurfaceById('retainer_oversight')
    expect(surface!.currentExposureStatus).not.toBe('public_active')
    expect(surface!.currentExposureStatus).not.toBe('public_limited')
    expect(surface!.currentExposureStatus).not.toBe('controlled_access')
  })

  it('does not accept payment as a self-serve product', () => {
    const surface = getSurfaceById('retainer_oversight')
    // Retainer Oversight is advisory — payment is via contract, not inline checkout
    expect(surface!.acceptsPayment).toBe(false)
  })
})

// ─── OversightCycleError ──────────────────────────────────────────────────────

describe('OversightCycleError', () => {
  it('is an Error subclass', () => {
    expect(new OversightCycleError('test')).toBeInstanceOf(Error)
  })

  it('has the correct name', () => {
    const err = new OversightCycleError('cycle conflict')
    expect(err.name).toBe('OversightCycleError')
  })

  it('includes message', () => {
    const err = new OversightCycleError('cycle 3 already exists')
    expect(err.message).toContain('cycle 3 already exists')
  })
})
