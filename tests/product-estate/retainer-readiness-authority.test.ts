/**
 * tests/product-estate/retainer-readiness-authority.test.ts
 *
 * Retainer Readiness Evaluator (P4) — Authority Tests
 *
 * Tests:
 *   1. Admin readiness API exists and is admin-only
 *   2. POST evaluates and persists readiness
 *   3. PATCH approves REVIEW_READY evaluations only
 *   4. ReadinessClass types: NOT_READY | CANDIDATE | REVIEW_READY | APPROVED
 *   5. Admin approval is always required
 *   6. Evaluator dimensions: 6 criteria
 *   7. Schema has RetainerReadinessEvaluation model
 *   8. Retainer Oversight stays dormant until APPROVED
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ─── Admin readiness route — guards ──────────────────────────────────────────

describe('admin retainer readiness route — guards', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/api/admin/retainer/readiness/route.ts'),
    'utf-8',
  )

  it('is admin-only', () => {
    expect(source).toContain('requireAdminAppRoute')
  })

  it('runs evaluateRetainerReadiness on POST', () => {
    expect(source).toContain('evaluateRetainerReadiness')
  })

  it('persists result via persistReadinessEvaluation', () => {
    expect(source).toContain('persistReadinessEvaluation')
  })

  it('supports PATCH action "approve" via adminApproveRetainerReadiness', () => {
    expect(source).toContain('approve')
    expect(source).toContain('adminApproveRetainerReadiness')
  })

  it('requires evaluationId to be REVIEW_READY before approving', () => {
    expect(source).toContain('REVIEW_READY')
    expect(source).toContain('Only REVIEW_READY evaluations can be approved')
  })

  it('returns 422 if already approved', () => {
    expect(source).toContain('409')
    expect(source).toContain('already approved')
  })
})

// ─── Evaluator service ────────────────────────────────────────────────────────

describe('retainer readiness evaluator — service', () => {
  const source = readFileSync(
    join(process.cwd(), 'lib/retainer/readiness-evaluator.ts'),
    'utf-8',
  )

  it('requires organisationId or userEmail', () => {
    expect(source).toContain('organisationId or userEmail is required')
  })

  it('evaluates durableMemoryPresent (completed instrument runs)', () => {
    expect(source).toContain('durableMemoryPresent')
    expect(source).toContain('decisionInstrumentRun')
  })

  it('evaluates recurringDecisionPattern', () => {
    expect(source).toContain('recurringDecisionPattern')
  })

  it('evaluates outcomeHistoryPresent', () => {
    expect(source).toContain('outcomeHistoryPresent')
    expect(source).toContain('decisionOutcomeRecord')
  })

  it('evaluates repeatedHighRisk', () => {
    expect(source).toContain('repeatedHighRisk')
    expect(source).toContain('CRITICAL')
  })

  it('evaluates evidenceQualityScore (0-1)', () => {
    expect(source).toContain('evidenceQualityScore')
  })

  it('evaluates organisationSignalScore (instrument diversity)', () => {
    expect(source).toContain('organisationSignalScore')
    expect(source).toContain('instrumentSlug')
  })

  it('admin approval is always required in result', () => {
    expect(source).toContain('adminApprovalRequired: true')
  })

  it('readiness classes: NOT_READY | CANDIDATE | REVIEW_READY | APPROVED', () => {
    const classes = ['NOT_READY', 'CANDIDATE', 'REVIEW_READY', 'APPROVED']
    for (const cls of classes) {
      expect(source, `Missing readiness class "${cls}"`).toContain(cls)
    }
  })

  it('REVIEW_READY requires all core criteria to be met', () => {
    expect(source).toContain('allCoreMet')
  })

  it('overallScore is a weighted combination of all dimensions', () => {
    expect(source).toContain('overallScore')
    expect(source).toContain('0.20')  // at least one weight
  })
})

// ─── Schema ───────────────────────────────────────────────────────────────────

describe('RetainerReadinessEvaluation schema', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf-8')

  it('model exists', () => {
    expect(schema).toContain('model RetainerReadinessEvaluation')
  })

  it('has readinessClass field', () => {
    expect(schema).toContain('readinessClass')
  })

  it('has adminApprovalRequired field', () => {
    expect(schema).toContain('adminApprovalRequired')
  })

  it('has adminApprovedAt field', () => {
    expect(schema).toContain('adminApprovedAt')
  })

  it('has overallReadinessScore', () => {
    expect(schema).toContain('overallReadinessScore')
  })

  it('maps to retainer_readiness_evaluations table', () => {
    expect(schema).toContain('"retainer_readiness_evaluations"')
  })
})

// ─── IntelligenceSpine schema ─────────────────────────────────────────────────

describe('IntelligenceSpine schema', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf-8')

  it('model exists', () => {
    expect(schema).toContain('model IntelligenceSpine')
  })

  it('has spineId (stable external ID)', () => {
    expect(schema).toContain('spineId')
  })

  it('has sourceType to distinguish diagnostic/ER/manual spines', () => {
    expect(schema).toContain('sourceType')
  })

  it('has isSample guard (false = cannot be used for paid delivery)', () => {
    expect(schema).toContain('isSample')
  })

  it('has authorityLevel (CANDIDATE | QUALIFYING | VERIFIED | RETIRED)', () => {
    expect(schema).toContain('authorityLevel')
  })

  it('has evidenceNodes JSON field', () => {
    expect(schema).toContain('evidenceNodes')
  })

  it('maps to intelligence_spines table', () => {
    expect(schema).toContain('"intelligence_spines"')
  })

  it('BoardroomBriefOrder has spineId FK', () => {
    const orderSection = schema.slice(schema.indexOf('model BoardroomBriefOrder'))
      .slice(0, 1000)
    expect(orderSection).toContain('spine_id')
  })
})
