import { describe, it, expect } from 'vitest'
import { hasConstitutionalOutput, adaptConstitutionalOutput } from '@/lib/intelligence/constitutional-orchestrator-adapter'
import { runDecisionIntelligence } from '@/lib/intelligence/decision-intelligence-orchestrator'
import { _resetMemoryStore } from '@/lib/product/diagnostic-journey-store'

describe('constitutional orchestrator adapter', () => {
  it('hasConstitutionalOutput detects valid constitutional data', () => {
    expect(hasConstitutionalOutput(null)).toBe(false)
    expect(hasConstitutionalOutput(undefined)).toBe(false)
    expect(hasConstitutionalOutput('string')).toBe(false)
    expect(hasConstitutionalOutput({})).toBe(false)

    expect(hasConstitutionalOutput({
      report: { authority: 8, coherence: 7 },
      decision: { route: 'STRATEGY' },
    })).toBe(true)

    expect(hasConstitutionalOutput({
      decision: { route: 'DIAGNOSTIC' },
    })).toBe(true)
  })

  it('REJECT route produces correct assessment', () => {
    const result = adaptConstitutionalOutput({
      report: { authority: 3, coherence: 2, pressure: 8, friction: 7 },
      decision: {
        route: 'REJECT',
        confidence: 'LOW',
        disqualifiers: ['Insufficient evidence', 'Authority not confirmed'],
        failureModes: ['authority_ambiguity'],
      },
      routeSummary: { route: 'REJECT' },
    })

    expect(result.constitutionalRoute).toBe('REJECT')
    expect(result.constitutionalReadiness).toBe('EMERGING')
    expect(result.constitutionalPosture).toBe('DRIFTING')
    expect(result.constitutionalAuthority).toBe('DEFERRED')
    expect(result.failureModes).toContain('authority_ambiguity')
    expect(result.disqualifiers).toContain('Insufficient evidence')
    expect(result.disqualifiers).toContain('Authority not confirmed')
  })

  it('STRATEGY route produces execution-ready assessment', () => {
    const result = adaptConstitutionalOutput({
      report: { authority: 9, coherence: 8, pressure: 3, friction: 2 },
      decision: {
        route: 'STRATEGY',
        confidence: 'HIGH',
        disqualifiers: [],
        failureModes: [],
      },
    })

    expect(result.constitutionalRoute).toBe('STRATEGY')
    expect(result.constitutionalReadiness).toBe('EXECUTION_READY')
    expect(result.constitutionalPosture).toBe('ORDERED')
    expect(result.constitutionalAuthority).toBe('CLEAR')
    expect(result.failureModes).toEqual([])
    expect(result.disqualifiers).toEqual([])
    expect(result.escalationPermitted).toBe(true)
  })

  it('DIAGNOSTIC route produces emerging assessment', () => {
    const result = adaptConstitutionalOutput({
      report: { authority: 5, coherence: 6, pressure: 5, friction: 5 },
      decision: { route: 'DIAGNOSTIC', confidence: 'MEDIUM' },
    })

    expect(result.constitutionalRoute).toBe('DIAGNOSTIC')
    expect(result.constitutionalReadiness).toBe('EMERGING')
    expect(result.escalationPermitted).toBe(true)
  })

  it('failure modes inferred from low authority score', () => {
    const result = adaptConstitutionalOutput({
      report: { authority: 2, coherence: 3 },
      decision: { route: 'DIAGNOSTIC' },
    })

    expect(result.failureModes).toContain('authority_ambiguity')
    expect(result.failureModes).toContain('narrative_incoherence')
  })
})

describe('orchestrator uses real constitutional output', () => {
  it('constitutional route comes from diagnosticResult when provided', async () => {
    _resetMemoryStore()

    const result = await runDecisionIntelligence({
      surface: 'constitutional_diagnostic',
      rawUserInput: 'Testing constitutional integration.',
      diagnosticResult: {
        report: { authority: 9, coherence: 8, pressure: 2, friction: 2 },
        decision: {
          route: 'STRATEGY',
          confidence: 'HIGH',
          disqualifiers: [],
          failureModes: [],
        },
        routeSummary: { route: 'STRATEGY' },
      },
    })

    // Should use the adapted constitutional output, not regex
    expect(result.constitutionalRoute).toBe('STRATEGY')
    expect(result.constitutionalReadiness).toBe('EXECUTION_READY')
  })

  it('falls back to regex when no diagnosticResult', async () => {
    _resetMemoryStore()

    const result = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'We need board approval to proceed.',
    })

    // Should use regex-based analysis
    expect(result.constitutionalRoute).toBeTruthy()
  })
})
