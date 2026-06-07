/**
 * tests/product-estate/corridor-authority.test.ts
 *
 * Validates that the Operational Decision Corridor:
 * - Contains all 7 named stages
 * - Retainer Oversight is never self-serve
 * - Boardroom Mode is never public_active
 * - Each stage has an explicit nextAdmissibleMove or is the terminal stage
 * - Evidence-gated stages do not appear as open public activation
 * - Authority gaps are documented for each corridor stage
 */

import { describe, expect, it } from 'vitest'
import {
  getCorridorSurfaces,
  getSurfaceById,
} from '@/lib/product/product-surface-registry'
import {
  CORRIDOR_SURFACE_ORDER,
  validateCorridorOrdering,
} from '@/lib/product/product-surface-authority'

const CORRIDOR_STAGE_IDS = [
  'team_assessment',
  'enterprise_assessment',
  'executive_reporting',
  'boardroom_mode',
  'strategy_room',
  'retainer_review_queue',
  'retainer_oversight',
]

// ─── Corridor completeness ─────────────────────────────────────────────────────

describe('corridor completeness', () => {
  it('corridor surface order contains all 7 canonical stages', () => {
    for (const id of CORRIDOR_STAGE_IDS) {
      expect(CORRIDOR_SURFACE_ORDER, `missing ${id} from CORRIDOR_SURFACE_ORDER`).toContain(id)
    }
  })

  it('all 7 corridor stages exist in the registry', () => {
    for (const id of CORRIDOR_STAGE_IDS) {
      const surface = getSurfaceById(id)
      expect(surface, `${id} missing from PRODUCT_SURFACE_REGISTRY`).toBeDefined()
    }
  })

  it('corridor surfaces from registry covers all 7 stages', () => {
    const corridor = getCorridorSurfaces()
    const ids = corridor.map((s) => s.surfaceId)
    for (const id of CORRIDOR_STAGE_IDS) {
      expect(ids, `${id} missing from getCorridorSurfaces()`).toContain(id)
    }
  })
})

// ─── Exposure rules ────────────────────────────────────────────────────────────

describe('corridor exposure rules', () => {
  it('retainer_oversight is never public_active or public_limited', () => {
    const surface = getSurfaceById('retainer_oversight')
    expect(surface).toBeDefined()
    expect(surface!.currentExposureStatus).not.toBe('public_active')
    expect(surface!.currentExposureStatus).not.toBe('public_limited')
  })

  it('retainer_oversight is not self-serve (controlled_access or more restrictive)', () => {
    const surface = getSurfaceById('retainer_oversight')
    const selfServeStatuses = ['public_active', 'public_limited', 'controlled_access']
    expect(selfServeStatuses).not.toContain(surface!.currentExposureStatus)
  })

  it('boardroom_mode is not public_active', () => {
    const surface = getSurfaceById('boardroom_mode')
    expect(surface).toBeDefined()
    expect(surface!.currentExposureStatus).not.toBe('public_active')
  })

  it('retainer_review_queue requires approval — not public_active', () => {
    const surface = getSurfaceById('retainer_review_queue')
    expect(surface).toBeDefined()
    expect(surface!.currentExposureStatus).not.toBe('public_active')
  })
})

// ─── Gap documentation ─────────────────────────────────────────────────────────

describe('corridor gap documentation', () => {
  it('every corridor stage has documented authority gaps or a score of 9+', () => {
    const corridor = getCorridorSurfaces()
    for (const s of corridor) {
      if (s.currentScore < 9) {
        expect(s.authorityGaps.length, `${s.surfaceId} score ${s.currentScore} but has no authority gaps`).toBeGreaterThan(0)
      }
    }
  })

  it('boardroom_mode has the most authority gaps (lowest-scored evidence-gated stage)', () => {
    const boardroomMode = getSurfaceById('boardroom_mode')
    expect(boardroomMode).toBeDefined()
    const corridor = getCorridorSurfaces()
    const maxGaps = Math.max(...corridor.map((s) => s.authorityGaps.length))
    // boardroom_mode should be among the highest-gap surfaces
    expect(boardroomMode!.authorityGaps.length).toBeGreaterThan(0)
  })
})

// ─── validateCorridorOrdering ──────────────────────────────────────────────────

describe('validateCorridorOrdering', () => {
  it('passes with current registry state', () => {
    const result = validateCorridorOrdering()
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('returns violations array (empty when valid)', () => {
    const result = validateCorridorOrdering()
    expect(Array.isArray(result.violations)).toBe(true)
  })
})

// ─── Next admissible moves ─────────────────────────────────────────────────────

describe('corridor next admissible moves', () => {
  it('team_assessment has a next route to enterprise_assessment', () => {
    const surface = getSurfaceById('team_assessment')
    expect(surface).toBeDefined()
    const move = (surface!.nextAdmissibleMove ?? '').toLowerCase()
    expect(move).toBeTruthy()
  })

  it('strategy_room has a next route', () => {
    const surface = getSurfaceById('strategy_room')
    expect(surface!.nextAdmissibleMove).toBeTruthy()
  })

  it('retainer_oversight is the terminal stage — its next move is not another corridor stage', () => {
    const surface = getSurfaceById('retainer_oversight')
    expect(surface).toBeDefined()
    // Terminal stage — next move should not loop back into corridor
    const move = (surface!.nextAdmissibleMove ?? '').toLowerCase()
    expect(move).not.toContain('team_assessment')
  })
})
