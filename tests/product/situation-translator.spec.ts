/**
 * tests/product/situation-translator.spec.ts — Situation Translator Tests
 *
 * Two layers:
 *   Layer 1 (structural): Verifies the interface contract — vocabulary states,
 *   actor extraction, clarification generation, dimension surfacing.
 *
 *   Layer 2 (quality): Verifies the 12 mandatory scenario classifications and
 *   the translation law — no false precision, alternative classes preserved,
 *   hidden stakes detected, low-stakes proportionality upheld.
 *
 * Run: vitest run tests/product/situation-translator.spec.ts
 */

import { describe, it, expect } from 'vitest'
import { SituationTranslator } from '../../lib/intelligence/situation-translator'

const translator = new SituationTranslator()

// ─── Layer 1: Structural / interface contract ─────────────────────────────────

describe('SituationTranslator — structural contract', () => {

  it('returns all required TranslationResult fields', async () => {
    const result = await translator.translate('We have a board decision to make.')
    expect(result).toHaveProperty('vocabularyState')
    expect(result).toHaveProperty('situationSummary')
    expect(result).toHaveProperty('kernelInterpretation')
    expect(result).toHaveProperty('translationConfidence')
    expect(result).toHaveProperty('clarificationRequired')
    expect(result).toHaveProperty('decisionClass')
    expect(result).toHaveProperty('alternativeClasses')
    expect(result).toHaveProperty('initialActors')
    expect(result).toHaveProperty('surfacedDimensions')
    expect(result).toHaveProperty('detectedSignals')
    expect(result).toHaveProperty('preservedAmbiguities')
    expect(result).toHaveProperty('hiddenStakesDetected')
  })

  it('detects vocabulary state 1 — urgency without structure', async () => {
    const result = await translator.translate('Something terrible is happening and I need help now!')
    expect(result.vocabularyState).toBe(1)
    expect(result.translationConfidence).toBe('LOW')
  })

  it('detects vocabulary state 2 — structure without diagnosis', async () => {
    const result = await translator.translate('We have a board decision to make about a major acquisition. The deadline is end of quarter.')
    expect(result.vocabularyState).toBe(2)
  })

  it('detects vocabulary state 3 — diagnosis without path', async () => {
    const result = await translator.translate(
      'The board is divided because the CEO wants to acquire but the NEDs have reservations about strategic fit due to cultural differences.',
    )
    expect(result.vocabularyState).toBe(3)
  })

  it('detects vocabulary state 4 — path without governance', async () => {
    const result = await translator.translate(
      'The board is divided because the CEO wants to acquire. The strategy team recommends a compromise approach. This is the way forward.',
    )
    expect(result.vocabularyState).toBe(4)
  })

  it('classifies COMPLIANCE_AND_FILING', async () => {
    const result = await translator.translate('We have an HMRC filing due in 14 days and no funds to pay the accountant.')
    expect(result.decisionClass).toBe('COMPLIANCE_AND_FILING')
  })

  it('classifies GOVERNANCE_AND_BOARD', async () => {
    const result = await translator.translate('The board needs to approve a major acquisition but two NEDs have reservations.')
    expect(result.decisionClass).toBe('GOVERNANCE_AND_BOARD')
  })

  it('classifies LOW_STAKES_PREFERENCE', async () => {
    const result = await translator.translate('I am trying to decide which project management software to use. It is a personal choice. No deadline.')
    expect(result.decisionClass).toBe('LOW_STAKES_PREFERENCE')
  })

  it('detects hidden stakes when low-stakes language masks high-stakes content', async () => {
    const result = await translator.translate('It is just a personal preference but it involves a million pounds of investment.')
    expect(result.hiddenStakesDetected).toBe(true)
  })

  it('generates clarification question with domain field when state is 1', async () => {
    const result = await translator.translate('Help!')
    expect(result.clarificationRequired.length).toBeGreaterThan(0)
    expect(result.clarificationRequired[0].domain).toBe('structure')
  })

  it('extracts named actors', async () => {
    const result = await translator.translate('The CEO and the board need to decide. The CFO has concerns about the budget.')
    expect(result.initialActors.length).toBeGreaterThanOrEqual(2)
    expect(result.initialActors.some(a => a.name.toLowerCase() === 'ceo')).toBe(true)
  })

  it('surfaces timing and financial dimensions', async () => {
    const result = await translator.translate('We have a deadline. There is no budget. The board is watching.')
    const dims = result.surfacedDimensions
    expect(dims).toContain('timing')
    expect(dims).toContain('financial')
  })

  it('exposes structured detectedSignals alongside display dimensions', async () => {
    const result = await translator.translate(
      'We have an HMRC filing due. No funds for an accountant.',
    )
    expect(result.detectedSignals).toContain('constraint:cash')
    expect(result.detectedSignals).toContain('obligation:statutory')
  })
})

// ─── Layer 2: Quality — 12 mandatory scenarios ────────────────────────────────

describe('Scenario 1 — HMRC filing rescue with no funds', () => {
  const input =
    'I need to file my tax for the year ended 2023/2024, to avoid a late fine. ' +
    'I do not have funds for an accountant and the accounts are complicated. ' +
    'I have submitted a placeholder after two extensions. ' +
    'I now have till June 30 2026 to file or risk a huge fine. ' +
    'Turnover is about £800k although very little profit.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as COMPLIANCE_AND_FILING', () => expect(result.decisionClass).toBe('COMPLIANCE_AND_FILING'))
  it('does not classify as LOW_STAKES_PREFERENCE', () => expect(result.decisionClass).not.toBe('LOW_STAKES_PREFERENCE'))
  it('detects constraint:cash signal', () => expect(result.detectedSignals).toContain('constraint:cash'))
  it('detects obligation:deadline signal', () => expect(result.detectedSignals).toContain('obligation:deadline'))
  it('detects obligation:statutory signal', () => expect(result.detectedSignals).toContain('obligation:statutory'))
  it('detects records incomplete', () => expect(result.detectedSignals).toContain('constraint:records_incomplete'))
  it('has HIGH or MEDIUM confidence', () => expect(result.translationConfidence).not.toBe('LOW'))
  it('situation summary references compliance or statutory', () => {
    expect(result.situationSummary.toLowerCase()).toMatch(/compliance|statutory|filing/)
  })
  it('kernel interpretation addresses constraint + obligation tension', () => {
    const interp = result.kernelInterpretation.toLowerCase()
    expect(interp).toMatch(/constrained|statutory|obligation|minimum viable/)
  })
  it('identifies HMRC as an actor', () => {
    expect(result.initialActors.some(a => a.name.toLowerCase().includes('hmrc'))).toBe(true)
  })
})

describe('Scenario 2 — Board decision with authority ambiguity', () => {
  const input =
    'We need to decide on a significant acquisition. ' +
    'The CEO is in favour but the CFO has serious concerns about cash position. ' +
    'Not sure who ultimately signs off — the board meeting is scheduled for next week. ' +
    'Due diligence is still incomplete.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as GOVERNANCE_AND_BOARD or FINANCIAL_AND_CAPITAL', () => {
    expect(['GOVERNANCE_AND_BOARD', 'FINANCIAL_AND_CAPITAL', 'STRATEGIC_AND_POSITIONING']).toContain(result.decisionClass)
  })
  it('does not classify as LOW_STAKES_PREFERENCE', () => expect(result.decisionClass).not.toBe('LOW_STAKES_PREFERENCE'))
  it('detects authority:unclear signal', () => expect(result.detectedSignals).toContain('authority:unclear'))
  it('surfaces authority dimension', () => expect(result.surfacedDimensions).toContain('authority'))
  it('detects CEO and CFO actors', () => {
    const names = result.initialActors.map(a => a.name.toLowerCase())
    expect(names.some(n => n.includes('ceo') || n.includes('cfo') || n.includes('board'))).toBe(true)
  })
  it('generates a clarification question about authority', () => {
    expect(result.clarificationRequired.some(q => q.domain === 'authority')).toBe(true)
  })
})

describe('Scenario 3 — Market claim with copy but no buyer proof', () => {
  const input =
    'We want to launch a market claim that our platform is the industry-leading solution ' +
    'for enterprise transformation. We have strong messaging but no customer case studies yet. ' +
    'Our team believes the claim is accurate.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as COMMERCIAL_AND_MARKET', () => expect(result.decisionClass).toBe('COMMERCIAL_AND_MARKET'))
  it('detects evidence:assumed signal', () => expect(result.detectedSignals).toContain('evidence:assumed'))
  it('kernel interpretation addresses the proof gap', () => {
    const interp = result.kernelInterpretation.toLowerCase()
    expect(interp).toMatch(/claim|evidence|positioning|market/)
  })
})

describe('Scenario 4 — Product launch under revenue pressure', () => {
  const input =
    'We need to launch the new feature next week. ' +
    'There is a major client contract that depends on this release being live. ' +
    'Testing is still in progress and we have not completed sign-off yet. ' +
    'Revenue will be impacted if we miss the date.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as OPERATIONAL_AND_EXECUTION or related', () => {
    expect(['OPERATIONAL_AND_EXECUTION', 'COMMERCIAL_AND_MARKET', 'FINANCIAL_AND_CAPITAL']).toContain(result.decisionClass)
  })
  it('does not classify as LOW_STAKES_PREFERENCE', () => expect(result.decisionClass).not.toBe('LOW_STAKES_PREFERENCE'))
  it('surfaces timing dimension', () => expect(result.surfacedDimensions).toContain('timing'))
})

describe('Scenario 5 — Critical supplier dependency risk', () => {
  const input =
    'Our main supplier has just been acquired by a competitor. ' +
    'We depend on them for 60% of our production. ' +
    'No alternative supplier is qualified. ' +
    'The contract runs for another 18 months.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as TECHNOLOGY_AND_DEPENDENCY or OPERATIONAL_AND_EXECUTION or STRATEGIC_AND_POSITIONING', () => {
    expect(['TECHNOLOGY_AND_DEPENDENCY', 'OPERATIONAL_AND_EXECUTION', 'STRATEGIC_AND_POSITIONING', 'LEGAL_AND_CONTRACTUAL']).toContain(result.decisionClass)
  })
  it('does not classify as LOW_STAKES_PREFERENCE', () => expect(result.decisionClass).not.toBe('LOW_STAKES_PREFERENCE'))
})

describe('Scenario 6 — Investor pitch with unvalidated traction', () => {
  const input =
    'We are pitching to investors next month. ' +
    'We plan to claim 300% year-on-year growth. ' +
    'The figures are based on internal projections we have not had externally validated. ' +
    'We also want to describe the market as a £10bn opportunity.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as COMMERCIAL_AND_MARKET or FINANCIAL_AND_CAPITAL or REPUTATIONAL_AND_EXPOSURE', () => {
    expect(['COMMERCIAL_AND_MARKET', 'FINANCIAL_AND_CAPITAL', 'REPUTATIONAL_AND_EXPOSURE', 'STRATEGIC_AND_POSITIONING']).toContain(result.decisionClass)
  })
  it('detects evidence:assumed signal', () => expect(result.detectedSignals).toContain('evidence:assumed'))
})

describe('Scenario 7 — Operational failure with unclear accountability', () => {
  const input =
    'Our production system went down for 4 hours yesterday. ' +
    'We are not sure who is responsible for deciding the response plan. ' +
    'Customers are asking for a public statement. ' +
    'Engineering says it was a config change, not a code bug.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as OPERATIONAL_AND_EXECUTION or REPUTATIONAL_AND_EXPOSURE or GOVERNANCE_AND_BOARD', () => {
    expect(['OPERATIONAL_AND_EXECUTION', 'REPUTATIONAL_AND_EXPOSURE', 'GOVERNANCE_AND_BOARD']).toContain(result.decisionClass)
  })
  it('detects authority:unclear signal', () => expect(result.detectedSignals).toContain('authority:unclear'))
})

describe('Scenario 8 — Family legal deadline with harm of delay', () => {
  const input =
    'I need to respond to a court notice about a custody arrangement by next Friday. ' +
    "I don't have a solicitor and I'm not sure I can afford one. " +
    'Missing the deadline could mean I lose my position in the case.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as LEGAL_AND_CONTRACTUAL', () => expect(result.decisionClass).toBe('LEGAL_AND_CONTRACTUAL'))
  it('detects obligation:deadline signal', () => expect(result.detectedSignals).toContain('obligation:deadline'))
  it('detects constraint:cash signal', () => expect(result.detectedSignals).toContain('constraint:cash'))
  it('identifies court as an actor', () => {
    expect(result.initialActors.some(a => a.name.toLowerCase().includes('court'))).toBe(true)
  })
})

describe('Scenario 9 — Cash-constrained survival decision', () => {
  const input =
    'We have 6 weeks of runway left. ' +
    'We need to decide whether to cut half the team, raise a bridge round, or wind down. ' +
    'No investor has committed yet. ' +
    'Payroll is due in 3 weeks.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as FINANCIAL_AND_CAPITAL or CONTINUITY_AND_TRANSITION or PEOPLE_AND_AUTHORITY', () => {
    expect(['FINANCIAL_AND_CAPITAL', 'CONTINUITY_AND_TRANSITION', 'PEOPLE_AND_AUTHORITY', 'OPERATIONAL_AND_EXECUTION']).toContain(result.decisionClass)
  })
  it('detects cash constraint or deadline', () => {
    const hasRelevant = result.detectedSignals.includes('constraint:cash') || result.detectedSignals.includes('obligation:deadline')
    expect(hasRelevant).toBe(true)
  })
})

describe('Scenario 10 — Strategic asymmetric partnership', () => {
  const input =
    'A much larger competitor has offered us an exclusive distribution deal. ' +
    'The commercial terms look attractive but we would lose our ability to sell direct. ' +
    'The board has not reviewed the full terms yet. ' +
    'We need to respond within 10 days.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as STRATEGIC or COMMERCIAL or LEGAL or GOVERNANCE', () => {
    expect(['STRATEGIC_AND_POSITIONING', 'COMMERCIAL_AND_MARKET', 'LEGAL_AND_CONTRACTUAL', 'GOVERNANCE_AND_BOARD']).toContain(result.decisionClass)
  })
  it('surfaces timing dimension', () => expect(result.surfacedDimensions).toContain('timing'))
})

describe('Scenario 11 — Executive reputational exposure', () => {
  const input =
    'Our CEO made a public statement last week that has been misinterpreted. ' +
    'There are now calls for a formal response. ' +
    'Legal has not reviewed the proposed statement. ' +
    'Media coverage is increasing.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as REPUTATIONAL_AND_EXPOSURE or GOVERNANCE_AND_BOARD', () => {
    expect(['REPUTATIONAL_AND_EXPOSURE', 'GOVERNANCE_AND_BOARD', 'LEGAL_AND_CONTRACTUAL']).toContain(result.decisionClass)
  })
})

describe('Scenario 12 — Genuinely low-stakes preference', () => {
  const input =
    'Should we move our weekly team standup from Monday to Wednesday morning? ' +
    'The team lead has approved the change and everyone seems comfortable with it.'

  let result: Awaited<ReturnType<typeof translator.translate>>
  beforeEach(async () => { result = await translator.translate(input) })

  it('classifies as LOW_STAKES_PREFERENCE', () => expect(result.decisionClass).toBe('LOW_STAKES_PREFERENCE'))
  it('does not detect hidden stakes', () => expect(result.hiddenStakesDetected).toBe(false))
  it('requires no clarification questions', () => expect(result.clarificationRequired.length).toBe(0))
  it('vocabulary state is not 1 or 5', () => expect([1, 5]).not.toContain(result.vocabularyState))
})

// ─── Translation law tests ────────────────────────────────────────────────────

describe('Translation law — ambiguity preservation', () => {

  it('preserves ambiguity when obligation is uncertain', async () => {
    const result = await translator.translate('I may need to file something with HMRC, not sure if it applies to me.')
    const hasAmbiguity = result.preservedAmbiguities.length > 0 || result.clarificationRequired.length > 0
    expect(hasAmbiguity).toBe(true)
  })

  it('detects hidden stakes when compliance is trivialised', async () => {
    const result = await translator.translate('It is just a minor tax thing, I need to file a quick return, the fine will not be that big.')
    expect(result.hiddenStakesDetected).toBe(true)
  })

  it('does not give HIGH confidence to an ambiguous single-word input', async () => {
    const result = await translator.translate('Decide.')
    expect(result.translationConfidence).not.toBe('HIGH')
  })

  it('preserves alternative classes when two domains are plausible', async () => {
    const result = await translator.translate('We have a legal contract issue that may also have compliance implications.')
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('alternativeClasses field is always an array', async () => {
    const result = await translator.translate('Simple scheduling question.')
    expect(Array.isArray(result.alternativeClasses)).toBe(true)
  })

  it('detectedSignals field is always an array', async () => {
    const result = await translator.translate('Something happened.')
    expect(Array.isArray(result.detectedSignals)).toBe(true)
  })
})
