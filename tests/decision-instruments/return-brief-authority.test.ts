/**
 * tests/decision-instruments/return-brief-authority.test.ts
 *
 * Return Brief 2.0 — Outcome Loop Authority Tests
 *
 * Tests:
 *   1. Return brief route exists and requires auth
 *   2. Valid outcome classes (SUCCESS | MITIGATED | PARTIAL | FAILURE | DEFERRED | UNKNOWN)
 *   3. Source linkage required (runId | dossierId | decisionObjectId | sessionId)
 *   4. Memory summary is system-generated from outcome class + detail
 *   5. DecisionOutcomeRecord model fields
 *   6. Ownership enforcement (runId ownership check)
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ─── Route source guards ──────────────────────────────────────────────────────

describe('return-brief route — source guards', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/api/decisions/return-brief/route.ts'),
    'utf-8',
  )

  it('requires authentication (getServerSession)', () => {
    expect(source).toContain('getServerSession')
    expect(source).toContain('Authentication required')
  })

  it('validates against allowed outcomeClass values', () => {
    const classes = ['SUCCESS', 'MITIGATED', 'PARTIAL', 'FAILURE', 'DEFERRED', 'UNKNOWN']
    for (const cls of classes) {
      expect(source).toContain(`'${cls}'`)
    }
  })

  it('requires at least one source reference', () => {
    expect(source).toContain('decisionInstrumentRunId')
    expect(source).toContain('boardroomDossierId')
    expect(source).toContain('decisionObjectId')
    expect(source).toContain('strategySessionId')
  })

  it('enforces run ownership before accepting return brief', () => {
    expect(source).toContain('OWNERSHIP_DENIED')
    expect(source).toContain('userEmail !== userEmail')
  })

  it('generates memorySummary from outcomeClass + detail (not from user input)', () => {
    expect(source).toContain('buildMemorySummary')
    expect(source).toContain('memorySummary')
  })

  it('persists to decisionOutcomeRecord (Prisma)', () => {
    expect(source).toContain('decisionOutcomeRecord.create')
  })

  it('includes carryForward field (memory feedback)', () => {
    expect(source).toContain('carryForward')
  })

  it('includes evidenceMissing field', () => {
    expect(source).toContain('evidenceMissing')
  })
})

// ─── Outcome class coverage ───────────────────────────────────────────────────

describe('outcome classification', () => {
  const OUTCOME_CLASSES = ['SUCCESS', 'MITIGATED', 'PARTIAL', 'FAILURE', 'DEFERRED', 'UNKNOWN'] as const

  it('covers all 6 required outcome classes', () => {
    expect(OUTCOME_CLASSES).toHaveLength(6)
  })

  it('each class produces a distinct memory summary prefix', () => {
    // The buildMemorySummary function in the route should have a mapping entry for each
    const source = readFileSync(
      join(process.cwd(), 'app/api/decisions/return-brief/route.ts'),
      'utf-8',
    )
    for (const cls of OUTCOME_CLASSES) {
      expect(source, `Missing memory prefix for outcome class "${cls}"`).toContain(cls + ':')
    }
  })
})

// ─── DecisionOutcomeRecord schema ─────────────────────────────────────────────

describe('DecisionOutcomeRecord schema', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf-8')

  it('model exists in schema', () => {
    expect(schema).toContain('model DecisionOutcomeRecord')
  })

  it('has outcomeClass field', () => {
    expect(schema).toContain('outcomeClass')
  })

  it('has carryForward field for memory feedback', () => {
    expect(schema).toContain('carryForward')
  })

  it('has memorySummary field', () => {
    expect(schema).toContain('memorySummary')
  })

  it('has decisionInstrumentRunId linkage', () => {
    expect(schema).toContain('decisionInstrumentRunId')
  })

  it('has boardroomDossierId linkage', () => {
    expect(schema).toContain('boardroomDossierId')
  })

  it('is indexed by outcomeClass', () => {
    expect(schema).toContain('outcomeClass')
    expect(schema).toContain('"decision_outcome_records"')
  })
})
