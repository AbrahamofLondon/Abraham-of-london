import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  SELECTED_DECISION_AUTHORITY_ARCHITECTURE,
  assertSingleRecordContract,
  classifyUserReportedHelpfulness,
  requiresMonetaryCostBeforeClaim,
} from '@/lib/product/decision-authority-runtime-contract'

type Json = Record<string, any>

function readJson(path: string): Json {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('Phase 1.5 decision engine authority matrix', () => {
  it('classifies every audited engine export without UNKNOWN', () => {
    const matrix = readJson('reports/product/decision-engine-authority-matrix.json')
    expect(matrix.unknownExportCount).toBe(0)

    const exports = matrix.engines.flatMap((engine: any) => engine.exports)
    expect(exports.map((entry: any) => entry.name).sort()).toEqual([
      'DecisionIntelligenceKernel',
      'composeCaseDerivedJudgement',
      'evaluateDecision',
      'runConstitutionalOrchestration',
    ].sort())
    expect(exports.every((entry: any) => entry.classification !== 'UNKNOWN')).toBe(true)
  })

  it('records the selected architecture as a target, not a closed implementation claim', () => {
    const matrix = readJson('reports/product/decision-engine-authority-matrix.json')
    expect(SELECTED_DECISION_AUTHORITY_ARCHITECTURE).toBe('LAYERED_CANONICAL_ARCHITECTURE')
    expect(matrix.selectedArchitecture).toBe('LAYERED_CANONICAL_ARCHITECTURE')
    expect(matrix.selectedArchitectureStatus).toBe('TARGET_SELECTED_NOT_IMPLEMENTED')
    expect(matrix.reconciliationRequiredBeforePublicKernelAdapter).toBe(true)
  })

  it('proves route call chains with call expressions rather than imports alone', () => {
    const publicRoute = read('pages/api/public/kernel-signal.ts')
    expect(publicRoute).toContain('kernel.process({')
    expect(publicRoute).toContain('runDecisionIntelligence({')
    expect(publicRoute).toContain('persistPublicSignalFromDecisionIntelligence({')
    expect(publicRoute).toContain('composeCaseDerivedJudgement({')
    expect(publicRoute).not.toContain("@/lib/decision/kernel")

    const executiveRoute = read('app/api/executive-reporting/run/route.ts')
    expect(executiveRoute).toContain('evaluateDecision({')

    const strategyRoute = read('app/api/strategy-room/execution/[id]/state/route.ts')
    expect(strategyRoute).toContain('evaluateDecision({')

    const enterpriseRoute = read('pages/api/diagnostics/enterprise.ts')
    expect(enterpriseRoute).toContain('runDecisionIntelligence({')

    const outcomeRoute = read('pages/api/outcomes/verify.ts')
    expect(outcomeRoute).toContain('submitOutcomeVerification({')
    expect(outcomeRoute).not.toContain('evaluateDecision(')
  })
})

describe('Phase 1.5 single-record and public boundary contract', () => {
  it('fails closed when two evaluation authorities run without reconciliation', () => {
    expect(() => assertSingleRecordContract({
      workflowId: 'public-free-signal',
      route: '/api/public/kernel-signal',
      evaluationAuthorities: ['DecisionIntelligenceKernel.process', 'runDecisionIntelligence'],
      judgementComposers: ['composeCaseDerivedJudgement'],
      canonicalDecisionRecordsCreated: ['case-a'],
      reconciliationContract: null,
    })).toThrow(/multiple evaluation authorities/)
  })

  it('allows multiple engines only when the reconciliation contract is explicit', () => {
    expect(() => assertSingleRecordContract({
      workflowId: 'layered-target',
      route: '/api/example',
      evaluationAuthorities: ['evaluateDecision', 'runDecisionIntelligence'],
      judgementComposers: ['composeCaseDerivedJudgement'],
      canonicalDecisionRecordsCreated: ['case-a'],
      reconciliationContract: 'Derived judgement references authoritative state version v1.',
    })).not.toThrow()
  })

  it('keeps public signal route no-store, rate-limited and size-bounded without importing internal decision kernel', () => {
    const source = read('pages/api/public/kernel-signal.ts')
    expect(source).toContain('applyNoStoreHeaders(res)')
    expect(source).toContain('Cache-Control')
    expect(source).toContain('PUBLIC_SIGNAL_RATE_LIMIT')
    expect(source).toContain('rateLimit(`public-kernel-signal:${getClientIp(req)}`')
    expect(source).toContain('PUBLIC_SIGNAL_MAX_SITUATION_CHARS')
    expect(source).toContain('res.status(413)')
    expect(source).not.toContain("from '@/lib/decision/kernel'")
  })
})

describe('Phase 1.5 router, persistence and commercial staging ledgers', () => {
  it('has zero UNKNOWN router classifications and no unrepaired security gap', () => {
    const matrix = readJson('reports/product/router-consistency-matrix.json')
    expect(matrix.unknownCount).toBe(0)
    expect(matrix.dimensions.every((entry: any) => entry.classification !== 'UNKNOWN')).toBe(true)
    expect(matrix.securityGapCount).toBe(0)
  })

  it('classifies SharedMemoryBridge as unused and does not justify Redis', () => {
    const bridge = readJson('reports/product/shared-memory-bridge-authority.json')
    expect(bridge.classification).toBe('UNUSED')
    expect(bridge.callers).toEqual([])
    expect(bridge.redisNeed).toBe('NOT_PROVEN')
  })

  it('does not mark paid products automation-ready from price alone', () => {
    const ledger = readJson('reports/product/product-automation-eligibility-ledger.json')
    expect(ledger.products.length).toBeGreaterThan(0)
    expect(ledger.products.every((product: any) => product.eligible === false)).toBe(true)
  })

  it('stages helpfulness as user-reported only, not outcome verification', () => {
    const signal = classifyUserReportedHelpfulness({ caseId: 'pub-helpful-001', helpful: true, note: 'It clarified the next move.' })
    expect(signal.signalType).toBe('USER_REPORTED_HELPFULNESS')
    expect(signal.verifiedAction).toBe(false)
    expect(signal.verifiedOutcome).toBe(false)
    expect(signal.structuralChange).toBe(false)
    expect(signal.financialReturn).toBe(false)
  })

  it('requires explicit monetary cost before ROI or cost-based checkout claims', () => {
    expect(requiresMonetaryCostBeforeClaim('NUMERICAL_ROI_CLAIM')).toBe(true)
    expect(requiresMonetaryCostBeforeClaim('COST_BASED_CHECKOUT_COPY')).toBe(true)
    expect(requiresMonetaryCostBeforeClaim('QUALITATIVE_STRUCTURAL_EXPOSURE')).toBe(false)
  })
})
