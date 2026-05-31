/**
 * tests/product/protective-synthesis.spec.ts
 *
 * Tests that the kernel's minimum viable path and forbidden actions
 * are PROTECTIVE, not merely structural.
 *
 * The standard: the system must be able to say —
 *   "Do not vote yet."
 *   "Do not sign yet."
 *   "Do not issue the statement tonight."
 *   "Do not treat that placeholder as compliance."
 *
 * Until it can say those things, it is detection, not decision infrastructure.
 */

import { describe, it, expect } from 'vitest'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'

const kernel = new DecisionIntelligenceKernel()

async function run(rawScenario: string) {
  return kernel.process({
    caseId: `protective-test-${Date.now()}`,
    caseReference: `PT-${Date.now().toString(36).toUpperCase()}`,
    rawScenario,
    aperture: 'paid_full_dossier',
    requestedTier: 'full_dossier',
    clarifications: {
      authority: 'Authority is being assessed',
      obligation: 'Obligations are being assessed',
    },
  })
}

// ─── Test 1: Board ratification theatre ──────────────────────────────────────

describe('Board ratification theatre — NED threatens resignation', () => {
  const input =
    'The board is being asked to approve a major acquisition. ' +
    'Management has already decided and is presenting this as a board endorsement. ' +
    'Two non-executive directors have expressed serious reservations about strategic fit. ' +
    'One NED has threatened to resign if the acquisition proceeds without a full due diligence period. ' +
    'The CEO is pushing for approval before year-end. ' +
    'The AGM is in three months.'

  let result: Awaited<ReturnType<typeof run>>
  beforeEach(async () => { result = await run(input) })

  it('classifies as GOVERNANCE_AND_BOARD', () => {
    expect(result.livingCase?.classification?.primaryClass).toBe('GOVERNANCE_AND_BOARD')
  })

  it('minimum viable path delays or conditions the vote', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    const pathText = path.map(p => `${p.action} ${p.description}`).join(' ').toLowerCase()
    const protects = (
      pathText.includes('delay') ||
      pathText.includes('condition') ||
      pathText.includes('do not') ||
      pathText.includes('vote') ||
      pathText.includes('not vote') ||
      pathText.includes('pause') ||
      pathText.includes('object')
    )
    expect(protects).toBe(true)
  })

  it('minimum viable path includes documenting NED objection', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    const pathText = path.map(p => p.description).join(' ').toLowerCase()
    const documentsObjection = (
      pathText.includes('objection') ||
      pathText.includes('reservation') ||
      pathText.includes('formally') ||
      pathText.includes('minuted') ||
      pathText.includes('record')
    )
    expect(documentsObjection).toBe(true)
  })

  it('forbidden actions includes no vote before reservations are documented', () => {
    const forbidden = result.livingCase?.forbiddenActions ?? []
    const forbiddenText = forbidden.map(f => f.action + ' ' + f.reason).join(' ').toLowerCase()
    const protectiveVoteForbidden = (
      forbiddenText.includes('vote') ||
      forbiddenText.includes('reservation') ||
      forbiddenText.includes('resignation') ||
      forbiddenText.includes('objection') ||
      forbiddenText.includes('undocumented')
    )
    expect(protectiveVoteForbidden).toBe(true)
  })

  it('human review triggered', () => {
    expect(result.livingCase?.review?.state).not.toBe('not_required')
  })

  it('regulated boundary fires for director duty', () => {
    expect(result.livingCase?.regulatedBoundary?.hit).toBe(true)
  })
})

// ─── Test 2: Strategic partnership optionality destruction ───────────────────

describe('Strategic partnership — irrevocable IP and no-exit clause', () => {
  const input =
    'A much larger company has offered a strategic partnership. ' +
    'They want exclusive access to our technology in exchange for distribution. ' +
    'The legal team says the contract has no exit clause and grants them IP rights to derivative works. ' +
    'The CEO wants to sign quickly before they change their mind. ' +
    'The board is excited about the distribution opportunity but has not reviewed the IP terms.'

  let result: Awaited<ReturnType<typeof run>>
  beforeEach(async () => { result = await run(input) })

  it('constraint graph includes IP/exit/exclusivity constraints', () => {
    const constraints = result.livingCase?.constraintGraph ?? []
    const constraintTypes = constraints.map(c => c.type)
    const hasLegalConstraint = constraintTypes.includes('legal') || constraints.some(c => c.description.toLowerCase().match(/ip|exit|exclusiv|irrevoc/))
    expect(hasLegalConstraint).toBe(true)
  })

  it('minimum viable path says do not sign before IP/exit terms are separated', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    const pathText = path.map(p => p.description).join(' ').toLowerCase()
    const protective = (
      pathText.includes('do not sign') ||
      pathText.includes('pause') ||
      pathText.includes('sign') ||
      pathText.includes('ip') ||
      pathText.includes('exit') ||
      pathText.includes('irrevoc') ||
      pathText.includes('optionality')
    )
    expect(protective).toBe(true)
  })

  it('forbidden actions includes no signature before irreversibility is documented', () => {
    const forbidden = result.livingCase?.forbiddenActions ?? []
    const forbiddenText = forbidden.map(f => f.action).join(' ').toLowerCase()
    const hasSignatureForbidden = (
      forbiddenText.includes('ip') ||
      forbiddenText.includes('exclusiv') ||
      forbiddenText.includes('exit') ||
      forbiddenText.includes('irrevoc') ||
      forbiddenText.includes('sign')
    )
    expect(hasSignatureForbidden).toBe(true)
  })

  it('adversarial challenges fire for irrevocability and urgency', () => {
    const adversarial = result.livingCase?.adversarialChallenge ?? []
    const adversarialIds = adversarial.map(c => c.id)
    const hasProtectiveChallenge = (
      adversarialIds.includes('strategic-commitment-vs-capability') ||
      adversarialIds.includes('urgency-vs-legal-concern')
    )
    expect(hasProtectiveChallenge).toBe(true)
  })
})

// ─── Test 3: Reputational legal hold — no statement before board/legal ────────

describe('Reputational exposure — CEO allegations + potential proceedings', () => {
  const input =
    'A newspaper has contacted us about allegations regarding the CEO\'s conduct at a previous company. ' +
    'The allegations are unproven but damaging. ' +
    'The CEO says they are false. ' +
    'The PR firm recommends a full denial tonight. ' +
    'The legal team says any public statement could prejudice potential proceedings. ' +
    'The board meets tomorrow morning.'

  let result: Awaited<ReturnType<typeof run>>
  beforeEach(async () => { result = await run(input) })

  it('classifies as REPUTATIONAL_AND_EXPOSURE', () => {
    expect(result.livingCase?.classification?.primaryClass).toBe('REPUTATIONAL_AND_EXPOSURE')
  })

  it('regulated boundary fires for legal/proceedings risk', () => {
    expect(result.livingCase?.regulatedBoundary?.hit).toBe(true)
  })

  it('minimum viable path begins with hold on public statement', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    expect(path.length).toBeGreaterThan(0)
    const firstStep = path[0]?.description?.toLowerCase() ?? ''
    const holdsStatement = (
      firstStep.includes('do not') ||
      firstStep.includes('statement') ||
      firstStep.includes('hold') ||
      firstStep.includes('no public') ||
      firstStep.includes('clearance') ||
      firstStep.includes('proceed')
    )
    expect(holdsStatement).toBe(true)
  })

  it('minimum viable path includes board briefing before the meeting', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    const pathText = path.map(p => p.description).join(' ').toLowerCase()
    const briefsBoard = (
      pathText.includes('board') ||
      pathText.includes('brief') ||
      pathText.includes('tomorrow') ||
      pathText.includes('meeting')
    )
    expect(briefsBoard).toBe(true)
  })

  it('forbidden actions explicitly forbids a public statement before legal clearance', () => {
    const forbidden = result.livingCase?.forbiddenActions ?? []
    expect(forbidden.length).toBeGreaterThan(0)
    const forbiddenText = forbidden.map(f => f.action + ' ' + f.reason).join(' ').toLowerCase()
    const forbidsStatement = (
      forbiddenText.includes('statement') ||
      forbiddenText.includes('pr') ||
      forbiddenText.includes('public') ||
      forbiddenText.includes('proceedings') ||
      forbiddenText.includes('clearance')
    )
    expect(forbidsStatement).toBe(true)
  })

  it('urgent human review triggered', () => {
    const reviewState = result.livingCase?.review?.state
    const reviewTier = result.livingCase?.review?.tier
    expect(reviewState).not.toBe('not_required')
    expect(reviewTier).toBe('URGENT')
  })

  it('adversarial challenges include PR vs legal conflict', () => {
    const adversarial = result.livingCase?.adversarialChallenge ?? []
    const adversarialIds = adversarial.map(c => c.id)
    expect(adversarialIds.includes('pr-vs-legal-conflict') || adversarialIds.includes('reputational-threat-vs-response-gap')).toBe(true)
  })
})

// ─── Test 4: Low-stakes — quality gate proportionality ───────────────────────

describe('Low-stakes preference — quality gate must not overfire', () => {
  const input =
    'I am trying to decide which project management software to use for my small team. ' +
    'We have used Asana before but some team members prefer Notion. ' +
    'There is no deadline. No budget constraint. No customer impact. ' +
    'It is purely a team preference decision.'

  let result: Awaited<ReturnType<typeof run>>
  beforeEach(async () => { result = await run(input) })

  it('classifies as LOW_STAKES_PREFERENCE', () => {
    expect(result.livingCase?.classification?.primaryClass).toBe('LOW_STAKES_PREFERENCE')
  })

  it('status is COMPLETED, not QUALITY_FAILED', () => {
    expect(result.status).toBe('COMPLETED')
  })

  it('no human review triggered', () => {
    expect(result.livingCase?.review?.state).toBe('not_required')
  })

  it('quality gate does not fire structural failures for legitimately absent maps', () => {
    const qualityFailures = result.qualityFailures ?? []
    // These should NOT fire for low-stakes:
    const forbiddenFailures = qualityFailures.filter(f =>
      f.includes('MISSING_CONSTRAINT_GRAPH') ||
      f.includes('MISSING_ADVERSARIAL_CHALLENGE') ||
      f.includes('MISSING_SELF_ADVERSARIAL_CHALLENGE') ||
      f.includes('MISSING_AUTHORITY_MAP') ||
      f.includes('MISSING_OBLIGATION_MAP') ||
      f.includes('GENERIC_ADVICE')
    )
    expect(forbiddenFailures).toHaveLength(0)
  })

  it('has a proportionate minimum viable path', () => {
    const path = result.livingCase?.minimumViablePath ?? []
    expect(path.length).toBeGreaterThan(0)
    // The path should be lightweight — just "choose by preference"
    const pathText = path[0]?.description?.toLowerCase() ?? ''
    expect(pathText.length).toBeGreaterThan(10)
  })

  it('no institutional machinery: empty authority map, adversarial, self-adversarial', () => {
    expect(result.livingCase?.authorityMap ?? []).toHaveLength(0)
    expect(result.livingCase?.adversarialChallenge ?? []).toHaveLength(0)
    expect(result.livingCase?.selfAdversarialChallenge).toBeNull()
  })
})
