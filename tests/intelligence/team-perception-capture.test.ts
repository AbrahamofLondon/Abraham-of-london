import { describe, it, expect, beforeEach } from 'vitest'
import {
  aggregateTeamRespondents,
  type TeamRespondentInput,
} from '@/lib/intelligence/team-respondent-aggregation'
import {
  getOrCreateDiagnosticJourney,
  appendDiagnosticJourneyEvent,
  getDiagnosticJourney,
  _resetMemoryStore,
} from '@/lib/product/diagnostic-journey-store'
import { getAudienceSafeEvents } from '@/lib/product/diagnostic-journey-record'

beforeEach(() => {
  _resetMemoryStore()
})

describe('explicit perception capture', () => {
  it('explicit perceivedDecision is stored in respondentData', async () => {
    await getOrCreateDiagnosticJourney({ caseId: 'team-test-001', surface: 'team_assessment' })

    await appendDiagnosticJourneyEvent({
      caseId: 'team-test-001',
      surface: 'team_assessment',
      type: 'EVIDENCE_CAPTURED',
      engineId: 'team-respondent-capture',
      summary: 'Respondent evidence captured',
      audienceSafe: false,
      payload: {
        respondentData: {
          respondentRole: 'Manager',
          perceivedDecision: 'Whether to restructure the sales team',
          perceivedOwner: 'VP Sales',
          perceivedBlocker: 'Budget approval',
        },
        audienceSafe: 'aggregate_only',
      },
    })

    const journey = await getDiagnosticJourney('team-test-001')
    const events = journey!.events.filter(e => e.type === 'EVIDENCE_CAPTURED')
    expect(events.length).toBe(1)
    const data = events[0]!.payload['respondentData'] as Record<string, unknown>
    expect(data['perceivedDecision']).toBe('Whether to restructure the sales team')
  })

  it('explicit perceivedOwner overrides any derived fallback', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-002',
      responses: [
        { respondentRole: 'Manager', perceivedOwner: 'VP Sales' },
        { respondentRole: 'Director', perceivedOwner: 'CEO' },
      ],
    })

    expect(result.ownerVariance.detected).toBe(true)
    expect(result.ownerVariance.uniqueOwners).toBe(2)
    expect(result.ownerVariance.summary).toContain('2 different owner')
  })

  it('explicit perceivedBlocker overrides any derived fallback', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-003',
      responses: [
        { respondentRole: 'Manager', perceivedBlocker: 'Budget approval' },
        { respondentRole: 'Director', perceivedBlocker: 'Board sign-off' },
      ],
    })

    expect(result.blockerVariance.detected).toBe(true)
    expect(result.blockerVariance.uniqueBlockers).toBe(2)
    expect(result.blockerVariance.summary).toContain('2 different blocker')
  })
})

describe('decision-definition divergence', () => {
  it('two respondents with different perceivedDecision produce decision-definition divergence', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-004',
      responses: [
        { perceivedDecision: 'Whether to hire more engineers', perceivedOwner: 'CTO' },
        { perceivedDecision: 'Whether to outsource development', perceivedOwner: 'CTO' },
      ],
    })

    expect(result.decisionVariance.detected).toBe(true)
    expect(result.decisionVariance.uniqueDecisions).toBe(2)
    expect(result.decisionVariance.summary).toContain('2 different decision definition')
    expect(result.disagreementThemes).toContain('Respondents are not describing the same decision.')
  })

  it('two respondents with same perceivedDecision show no divergence', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-005',
      responses: [
        { perceivedDecision: 'Whether to hire more engineers', perceivedOwner: 'CTO' },
        { perceivedDecision: 'whether to hire more engineers', perceivedOwner: 'VP Engineering' },
      ],
    })

    expect(result.decisionVariance.detected).toBe(false)
    expect(result.decisionVariance.summary).toContain('same decision')
  })
})

describe('ownership divergence', () => {
  it('two respondents with different perceivedOwner produce ownership divergence', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-006',
      responses: [
        { perceivedOwner: 'CTO', perceivedDecision: 'Hire engineers' },
        { perceivedOwner: 'VP Engineering', perceivedDecision: 'Hire engineers' },
      ],
    })

    expect(result.ownerVariance.detected).toBe(true)
    expect(result.ownerVariance.uniqueOwners).toBe(2)
    expect(result.ownerVariance.summary).toContain('2 different owner')
  })
})

describe('blocker divergence', () => {
  it('two respondents with different perceivedBlocker produce blocker divergence', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-007',
      responses: [
        { perceivedBlocker: 'Budget constraints', perceivedDecision: 'Hire' },
        { perceivedBlocker: 'Hiring freeze', perceivedDecision: 'Hire' },
      ],
    })

    expect(result.blockerVariance.detected).toBe(true)
    expect(result.blockerVariance.uniqueBlockers).toBe(2)
  })
})

describe('client safety', () => {
  it('raw perceivedDecision/perceivedOwner/perceivedBlocker not exposed in client-safe output', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-008',
      responses: [
        {
          perceivedDecision: 'SECRET: Whether to fire the entire marketing team',
          perceivedOwner: 'John Smith CEO',
          perceivedBlocker: 'Jane Doe HR Director blocking',
        },
        {
          perceivedDecision: 'CONFIDENTIAL: Restructure marketing',
          perceivedOwner: 'Sarah Jones CMO',
          perceivedBlocker: 'Board has not approved budget',
        },
      ],
    })

    // Privacy-safe summary must not contain raw text
    expect(result.privacySafeSummary).not.toContain('SECRET')
    expect(result.privacySafeSummary).not.toContain('CONFIDENTIAL')
    expect(result.privacySafeSummary).not.toContain('John Smith')
    expect(result.privacySafeSummary).not.toContain('Jane Doe')
    expect(result.privacySafeSummary).not.toContain('Sarah Jones')

    // Aggregate findings must not contain raw text
    for (const finding of result.aggregateOnlyFindings) {
      expect(finding).not.toContain('SECRET')
      expect(finding).not.toContain('John Smith')
    }

    // Disagreement themes must not contain raw text
    for (const theme of result.disagreementThemes) {
      expect(theme).not.toContain('SECRET')
      expect(theme).not.toContain('John Smith')
    }
  })

  it('respondent journey events are not audience-safe', async () => {
    await getOrCreateDiagnosticJourney({ caseId: 'team-test-009', surface: 'team_assessment' })

    await appendDiagnosticJourneyEvent({
      caseId: 'team-test-009',
      surface: 'team_assessment',
      type: 'EVIDENCE_CAPTURED',
      engineId: 'team-respondent-capture',
      summary: 'Respondent evidence captured',
      audienceSafe: false,
      payload: {
        respondentData: {
          perceivedDecision: 'Fire the marketing team',
          perceivedOwner: 'John Smith',
        },
      },
    })

    const journey = await getDiagnosticJourney('team-test-009')
    const safeEvents = getAudienceSafeEvents(journey!)

    // Respondent data events should NOT appear in audience-safe output
    expect(safeEvents.length).toBe(0)
  })
})

describe('single respondent guard', () => {
  it('respondentCount < 2 does not claim divergence', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-010',
      responses: [
        { perceivedDecision: 'Hire engineers', perceivedOwner: 'CTO', perceivedBlocker: 'Budget' },
      ],
    })

    expect(result.respondentCount).toBe(1)
    expect(result.ownerVariance.detected).toBe(false)
    expect(result.blockerVariance.detected).toBe(false)
    expect(result.decisionVariance.detected).toBe(false)
    expect(result.ownerVariance.summary).toContain('Single respondent')
    expect(result.decisionVariance.summary).toContain('Single respondent')
  })

  it('empty responses does not crash', () => {
    const result = aggregateTeamRespondents({
      caseId: 'team-test-011',
      responses: [],
    })

    expect(result.respondentCount).toBe(0)
    expect(result.ownerVariance.detected).toBe(false)
    expect(result.decisionVariance.detected).toBe(false)
  })
})
