import { describe, expect, it } from 'vitest'
import { toExecutiveReportingPublicResult } from '@/lib/product/executive-reporting-public-dto'

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    runKey: 'er_test',
    caseId: 'case_1',
    executiveRunId: 'run_1',
    checkpointId: null,
    route: 'STRATEGY' as const,
    generatedAt: '2026-06-01T00:00:00.000Z',
    dataQuality: 'CASE_SCOPED' as const,
    evidencePosture: 'SYSTEM_INFERRED' as const,
    provenance: [],
    scope: {
      caseId: 'case_1',
      journeyId: 'case_1',
      executiveRunId: 'run_1',
      sourceSurface: 'EXECUTIVE_REPORTING',
      scopeLabel: 'Executive Reporting case',
      scopeType: 'CASE' as const,
    },
    viewModel: {
      header: { reportId: 'er_test', organisationName: 'AOL Test' },
      summary: {
        headline: 'Decision authority is blocked',
        summary: 'The case needs a governed decision.',
        mandate: 'Assign a sponsor and force the decision.',
        priorityStack: ['Assign a sponsor and force the decision.'],
      },
      constitution: {
        route: 'STRATEGY',
        orgState: 'DRIFTING',
        authorityType: 'UNCLEAR',
        readinessTier: 'EMERGING',
        clarityScore: 58,
        authorityScore: 44,
        governanceScore: 51,
        revenueBand: '1m_5m',
      },
      financialExposure: {
        totalExposureFormatted: '£90,000',
      },
    },
    canonical: {
      sections: {},
      ladderContext: {
        constitutional: { route: 'STRATEGY', severity: 'high' },
        team: { respondentCount: 2, band: 'DIVERGENT', gaps: ['owner disagreement'] },
        enterprise: { score: 42, reading: 'dependency pressure', route: 'ESCALATE' },
      },
      evidenceGraph: {
        nodes: [
          {
            sourceStage: 'enterprise_assessment',
            label: 'Scenario stress',
            summary: 'Dependency pressure creates board challenge risk.',
            evidenceText: 'PRIVATE RAW ENTERPRISE TEXT SHOULD NOT LEAK',
          },
        ],
        decisionObjects: [],
      },
    },
    intake: {
      decisionNeed: {
        decisionQuestion: 'Should the organisation proceed with the contested decision?',
        whatHappensIfNothingChanges: 'Client delivery keeps slipping.',
        verificationCriteria: 'Sponsor named and first checkpoint passed.',
      },
      governance: {
        sponsorNameOrSeat: 'COO',
      },
      history: {
        priorAttemptOutcome: 'Previous steering group failed to assign an owner.',
      },
    },
    boardroom: {
      qualified: false,
      reason: 'Boardroom threshold not met.',
      dossier: {
        sections: [
          { id: 'secret', label: 'Dossier', content: 'Boardroom adversarial dossier content' },
        ],
      },
    },
    ...overrides,
  }
}

function serialise(value: unknown) {
  return JSON.stringify(value)
}

describe('Executive Reporting public DTO', () => {
  it('carries forward Team, Enterprise, and Constitutional evidence into board-grade judgement', () => {
    const result = toExecutiveReportingPublicResult(baseInput())

    const sources = result.executiveJudgement.evidenceCarriedForward.map((item) => item.source)
    expect(sources).toEqual(expect.arrayContaining([
      'constitutional_diagnostic',
      'team_assessment',
      'enterprise_assessment',
    ]))
    expect(result.executiveJudgement.recommendation.available).toBe(true)
    expect(result.executiveJudgement.recommendation.statement).toContain('Recommendation:')
  })

  it('does not expose unsafe raw evidence payloads or unqualified Boardroom dossier content', () => {
    const result = toExecutiveReportingPublicResult(baseInput())
    const json = serialise(result)

    expect(json).not.toContain('PRIVATE RAW ENTERPRISE TEXT SHOULD NOT LEAK')
    expect(json).not.toContain('Boardroom adversarial dossier content')
    expect(result.boardroom.qualified).toBe(false)
    expect(result.boardroom.dossier).toBeNull()
    expect(result.executiveJudgement.boardroomDossierStatus).toContain('Boardroom threshold not met')
  })

  it('withholds board-grade recommendation when prior evidence threshold is not met', () => {
    const result = toExecutiveReportingPublicResult(baseInput({
      canonical: {
        sections: {},
        ladderContext: {},
        evidenceGraph: { nodes: [], decisionObjects: [] },
      },
    }))

    expect(result.executiveJudgement.recommendation.available).toBe(false)
    expect(result.executiveJudgement.recommendation.statement).toContain('withheld')
    expect(result.executiveJudgement.evidenceGaps.join(' ')).toContain('Team aggregate divergence')
    expect(result.executiveJudgement.evidenceGaps.join(' ')).toContain('Enterprise stress')
  })
})
