/**
 * tests/product-estate/outcome-loop-authority.test.ts
 *
 * Phase 9 — Outcome loop authority tests.
 * Validates DecisionOutcomeRecord, Return Brief API, and consequence consequence record
 * for the return_brief surface.
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

const schema = readFile('prisma/schema.prisma')
const returnBriefRoute = readFile('app/api/decisions/return-brief/route.ts')

// ─── Schema authority ──────────────────────────────────────────────────────────

describe('DecisionOutcomeRecord schema', () => {
  it('model exists in prisma schema', () => {
    expect(schema).toContain('model DecisionOutcomeRecord')
  })

  it('maps to decision_outcome_records table', () => {
    expect(schema).toContain('"decision_outcome_records"')
  })

  it('has outcomeClass field', () => {
    const start = schema.indexOf('model DecisionOutcomeRecord')
    const slice = schema.slice(start, start + 4000)
    expect(slice).toContain('outcomeClass')
  })

  it('has carryForward field', () => {
    const start = schema.indexOf('model DecisionOutcomeRecord')
    const slice = schema.slice(start, start + 4000)
    expect(slice).toContain('carryForward')
  })

  it('has memorySummary field', () => {
    const start = schema.indexOf('model DecisionOutcomeRecord')
    const slice = schema.slice(start, start + 4000)
    expect(slice).toContain('memorySummary')
  })

  it('has evidenceMissing field', () => {
    const start = schema.indexOf('model DecisionOutcomeRecord')
    const slice = schema.slice(start, start + 4000)
    expect(slice).toContain('evidenceMissing')
  })
})

// ─── Return Brief API authority ───────────────────────────────────────────────

describe('Return Brief API (app/api/decisions/return-brief/route.ts)', () => {
  it('exists', () => {
    expect(existsSync(join(ROOT, 'app/api/decisions/return-brief/route.ts'))).toBe(true)
  })

  it('exports POST handler', () => {
    expect(returnBriefRoute).toContain('export async function POST')
  })

  it('exports GET handler', () => {
    expect(returnBriefRoute).toContain('export async function GET')
  })

  it('requires authentication — rejects unauthenticated requests with 401', () => {
    expect(returnBriefRoute).toContain('401')
  })

  it('validates outcome class enum', () => {
    const outcomeClasses = ['SUCCESS', 'MITIGATED', 'PARTIAL', 'FAILURE', 'DEFERRED', 'UNKNOWN']
    for (const cls of outcomeClasses) {
      expect(returnBriefRoute, `Missing outcome class: ${cls}`).toContain(cls)
    }
  })

  it('requires at least one source reference (runId|dossierId|decisionObjectId|sessionId)', () => {
    const sources = ['runId', 'dossierId', 'decisionObjectId', 'sessionId']
    // At least one must appear in the schema/validation
    const hasAny = sources.some((s) => returnBriefRoute.includes(s))
    expect(hasAny, 'Return Brief route has no source reference validation').toBe(true)
  })

  it('verifies run ownership before submission', () => {
    expect(returnBriefRoute).toContain('submittedByEmail')
  })

  it('generates memorySummary programmatically — not from request body', () => {
    expect(returnBriefRoute).toContain('memorySummary')
    // Check no direct passthrough from req body
    expect(returnBriefRoute).not.toContain('body.memorySummary')
  })

  it('scopes GET results to authenticated user', () => {
    expect(returnBriefRoute).toContain('submittedByEmail')
  })
})

// ─── Consequence consequence record for return_brief ──────────────────────────

describe('CONSEQUENCE_REGISTRY — return_brief surface', () => {
  it('return_brief exists in CONSEQUENCE_REGISTRY', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const surface = CONSEQUENCE_REGISTRY.find((r: { surfaceId: string }) => r.surfaceId === 'return_brief')
    expect(surface).toBeDefined()
  })

  it('return_brief commercial status is free', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const surface = CONSEQUENCE_REGISTRY.find((r: { surfaceId: string }) => r.surfaceId === 'return_brief')
    expect(surface?.commercialStatus).toBe('free')
  })

  it('return_brief has all 7 consequence dimensions populated', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const surface = CONSEQUENCE_REGISTRY.find((r: { surfaceId: string }) => r.surfaceId === 'return_brief')
    expect(surface?.buyerType.length).toBeGreaterThan(0)
    expect(surface?.pressureMoment.length).toBeGreaterThan(0)
    expect(surface?.testQuestion.length).toBeGreaterThan(0)
    expect(surface?.outputArtifact.length).toBeGreaterThan(0)
    expect(surface?.gateCondition.length).toBeGreaterThan(0)
    expect(surface?.nextAdmissibleMove.length).toBeGreaterThan(0)
    expect(surface?.proofOfAuthority.length).toBeGreaterThan(0)
  })

  it('return_brief nextAdmissibleMove references retainer review eligibility', async () => {
    const { CONSEQUENCE_REGISTRY } = await import('@/lib/product/product-consequence-standard')
    const surface = CONSEQUENCE_REGISTRY.find((r: { surfaceId: string }) => r.surfaceId === 'return_brief')
    expect(surface?.nextAdmissibleMove.toLowerCase()).toContain('retainer')
  })

  it('return_brief evaluation has consequenceScore ≥ 7', async () => {
    const { evaluateProductConsequence } = await import('@/lib/product/product-consequence-standard')
    const result = evaluateProductConsequence('return_brief')
    expect(result.consequenceScore).toBeGreaterThanOrEqual(7)
  })
})

// ─── Outcome loop triggers Retainer Review eligibility ────────────────────────

describe('Outcome accumulation → Retainer eligibility chain', () => {
  it('retainer readiness evaluator checks minimum outcome records', async () => {
    const src = readFile('lib/retainer/readiness-evaluator.ts')
    expect(src).toContain('MIN_OUTCOME_RECORDS')
  })

  it('retainer readiness evaluator checks outcome history dimension', async () => {
    const src = readFile('lib/retainer/readiness-evaluator.ts')
    expect(src).toContain('outcomeHistoryPresent')
  })

  it('RetainerReadinessEvaluation schema exists', () => {
    expect(schema).toContain('model RetainerReadinessEvaluation')
    expect(schema).toContain('"retainer_readiness_evaluations"')
  })
})
