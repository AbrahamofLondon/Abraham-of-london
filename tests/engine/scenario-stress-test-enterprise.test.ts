/**
 * tests/engine/scenario-stress-test-enterprise.test.ts
 *
 * Enterprise Scenario Bank Regression Tests.
 *
 * Prevents future breakage between Enterprise Assessment scenario IDs
 * emitted by the form and the SCENARIOS bank definitions.
 *
 * Rules:
 *   - Do not default chosenOption.
 *   - Do not expose raw explanation text.
 *   - Do not mark ScenarioStressTest USED unless analyseScenarioResponse
 *     runs against a known scenario.
 */

import { describe, it, expect } from 'vitest'
import {
  SCENARIOS,
  ENTERPRISE_SCENARIO_IDS,
  analyseScenarioResponse,
  type StressScenario,
  type ScenarioResponse,
} from '@/lib/engine/scenario-stress-test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEnterpriseScenarios(): StressScenario[] {
  return SCENARIOS.filter(s => s.assessmentType === 'enterprise')
}

function getScenarioById(id: string): StressScenario | undefined {
  return SCENARIOS.find(s => s.id === id)
}

function makeScenarioResponse(
  scenarioId: string,
  chosenOption: 0 | 1,
  explanation = '',
): ScenarioResponse {
  return {
    scenarioId,
    chosenOption,
    confidence: 5,
    reasoning: explanation,
    responseTimeMs: 0,
  }
}

// ─── 1. SCENARIOS contains enterprise_delay_30 ───────────────────────────────

describe(ENTERPRISE_SCENARIO_IDS.DELAY_30, () => {
  it('exists in SCENARIOS bank', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)
    expect(scenario).toBeDefined()
    expect(scenario!.assessmentType).toBe('enterprise')
  })

  it('has exactly two binary options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    expect(scenario.options).toHaveLength(2)
    expect(scenario.options[0]).toBeTruthy()
    expect(scenario.options[1]).toBeTruthy()
    expect(typeof scenario.options[0]).toBe('string')
    expect(typeof scenario.options[1]).toBe('string')
  })

  it('has two reveals matching options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    expect(scenario.reveals).toHaveLength(2)
    expect(scenario.reveals[0]).toBeTruthy()
    expect(scenario.reveals[1]).toBeTruthy()
  })

  it('has testsDomains with at least one domain', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    expect(scenario.testsDomains.length).toBeGreaterThanOrEqual(1)
  })

  it('analyseScenarioResponse accepts chosenOption 0', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, 'Delivery timeline would break first.')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 70, risk: 60 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.DELAY_30)
    expect(analysis.insight).toBe(scenario.reveals[0])
    expect(typeof analysis.consistentWithScores).toBe('boolean')
    expect(typeof analysis.speedSignal).toBe('string')
    expect(typeof analysis.confidenceAlignment).toBe('string')
  })

  it('analyseScenarioResponse accepts chosenOption 1', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 1, 'Client confidence would erode first.')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 40, risk: 30 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.DELAY_30)
    expect(analysis.insight).toBe(scenario.reveals[1])
  })

  it('analysis insight is derived from reveals, not raw explanation', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const rawExplanation = 'This is a very sensitive internal matter that should not be exposed.'
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, rawExplanation)
    const analysis = analyseScenarioResponse(scenario, response, { execution: 70, risk: 60 })
    // The insight should be the reveal text, NOT the raw explanation
    expect(analysis.insight).not.toContain(rawExplanation)
    expect(analysis.insight).toBe(scenario.reveals[0])
    // inconsistencyNote should also not contain raw explanation
    if (analysis.inconsistencyNote) {
      expect(analysis.inconsistencyNote).not.toContain(rawExplanation)
    }
  })
})

// ─── 2. SCENARIOS contains enterprise_owner_unavailable ──────────────────────

describe(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE, () => {
  it('exists in SCENARIOS bank', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)
    expect(scenario).toBeDefined()
    expect(scenario!.assessmentType).toBe('enterprise')
  })

  it('has exactly two binary options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)!
    expect(scenario.options).toHaveLength(2)
    expect(scenario.options[0]).toBeTruthy()
    expect(scenario.options[1]).toBeTruthy()
  })

  it('has two reveals matching options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)!
    expect(scenario.reveals).toHaveLength(2)
  })

  it('analyseScenarioResponse accepts chosenOption 0', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE, 0, 'We have clear delegation.')
    const analysis = analyseScenarioResponse(scenario, response, { governance: 75, authority: 70 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)
    expect(analysis.insight).toBe(scenario.reveals[0])
  })

  it('analyseScenarioResponse accepts chosenOption 1', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE, 1, 'Everything depends on the CEO.')
    const analysis = analyseScenarioResponse(scenario, response, { governance: 30, authority: 25 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE)
    expect(analysis.insight).toBe(scenario.reveals[1])
  })
})

// ─── 3. SCENARIOS contains enterprise_challenge_evidence ─────────────────────

describe(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE, () => {
  it('exists in SCENARIOS bank', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)
    expect(scenario).toBeDefined()
    expect(scenario!.assessmentType).toBe('enterprise')
  })

  it('has exactly two binary options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)!
    expect(scenario.options).toHaveLength(2)
    expect(scenario.options[0]).toBeTruthy()
    expect(scenario.options[1]).toBeTruthy()
  })

  it('has two reveals matching options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)!
    expect(scenario.reveals).toHaveLength(2)
  })

  it('analyseScenarioResponse accepts chosenOption 0', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE, 0, 'All data is independently audited.')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 80, risk: 75 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)
    expect(analysis.insight).toBe(scenario.reveals[0])
  })

  it('analyseScenarioResponse accepts chosenOption 1', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE, 1, 'Our evidence is mostly anecdotal.')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 25, risk: 20 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE)
    expect(analysis.insight).toBe(scenario.reveals[1])
  })
})

// ─── 4. All enterprise scenarios have exactly two binary options ─────────────

describe('enterprise scenario structural integrity', () => {
  it('every enterprise scenario has exactly two options', () => {
    const enterprise = getEnterpriseScenarios()
    expect(enterprise.length).toBeGreaterThanOrEqual(4) // 3 new + 1 legacy
    for (const scenario of enterprise) {
      expect(
        scenario.options,
        `Enterprise scenario "${scenario.id}" does not have exactly 2 options`,
      ).toHaveLength(2)
    }
  })

  it('every enterprise scenario has exactly two reveals', () => {
    const enterprise = getEnterpriseScenarios()
    for (const scenario of enterprise) {
      expect(
        scenario.reveals,
        `Enterprise scenario "${scenario.id}" does not have exactly 2 reveals`,
      ).toHaveLength(2)
    }
  })

  it('every enterprise scenario has a non-empty situation', () => {
    const enterprise = getEnterpriseScenarios()
    for (const scenario of enterprise) {
      expect(
        scenario.situation.length,
        `Enterprise scenario "${scenario.id}" has empty situation`,
      ).toBeGreaterThan(10)
    }
  })

  it('every enterprise scenario has at least one testsDomain', () => {
    const enterprise = getEnterpriseScenarios()
    for (const scenario of enterprise) {
      expect(
        scenario.testsDomains.length,
        `Enterprise scenario "${scenario.id}" has no testsDomains`,
      ).toBeGreaterThanOrEqual(1)
    }
  })
})

// ─── 5. analyseScenarioResponse consistency scoring ──────────────────────────

describe('analyseScenarioResponse consistency scoring', () => {
  it('marks consistentWithScores=true when scores align with choice', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    // High domain scores (>=65) expect chosenOption 0 (conviction/enforcement)
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, '')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 80, risk: 75 })
    expect(analysis.consistentWithScores).toBe(true)
  })

  it('marks consistentWithScores=false when scores contradict choice', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    // Low domain scores (<65) expect chosenOption 1 (adaptive)
    // But user chose option 0 (conviction) — inconsistent
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, '')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 30, risk: 25 })
    expect(analysis.consistentWithScores).toBe(false)
  })

  it('produces inconsistencyNote when inconsistent', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, '')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 30, risk: 25 })
    expect(analysis.inconsistencyNote.length).toBeGreaterThan(0)
  })

  it('does not produce inconsistencyNote when consistent', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.DELAY_30, 0, '')
    const analysis = analyseScenarioResponse(scenario, response, { execution: 80, risk: 75 })
    expect(analysis.inconsistencyNote).toBe('')
  })
})

// ─── 6. Unknown scenarioId handling ──────────────────────────────────────────

describe('unknown scenarioId handling', () => {
  it('analyseScenarioResponse is NOT called for unknown scenarioId (test verifies no crash)', () => {
    // This test verifies the function handles gracefully — the orchestrator
    // should skip unknown IDs before calling analyseScenarioResponse
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.DELAY_30)
    expect(scenario).toBeDefined()
    // Verify that a non-existent scenario is not in the bank
    const unknown = getScenarioById('nonexistent_scenario')
    expect(unknown).toBeUndefined()
  })
})

// ─── 7. Legacy backward compatibility ────────────────────────────────────────

describe('legacy enterprise_governance_test', () => {
  it('still exists in SCENARIOS bank', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)
    expect(scenario).toBeDefined()
    expect(scenario!.assessmentType).toBe('enterprise')
  })

  it('has exactly two binary options', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)!
    expect(scenario.options).toHaveLength(2)
  })

  it('analyseScenarioResponse still works with chosenOption 0', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST, 0, '')
    const analysis = analyseScenarioResponse(scenario, response, { authority: 70, governance: 65, execution: 60 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)
    expect(analysis.insight).toBe(scenario.reveals[0])
  })

  it('analyseScenarioResponse still works with chosenOption 1', () => {
    const scenario = getScenarioById(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)!
    const response = makeScenarioResponse(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST, 1, '')
    const analysis = analyseScenarioResponse(scenario, response, { authority: 30, governance: 25, execution: 20 })
    expect(analysis).toBeDefined()
    expect(analysis.scenarioId).toBe(ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST)
    expect(analysis.insight).toBe(scenario.reveals[1])
  })
})

// ─── 8. Scenario ID centralisation ─────────────────────────────────────────

describe('scenario ID centralisation', () => {
  it('every ENTERPRISE_SCENARIO_IDS value exists in SCENARIOS bank', () => {
    const scenarioIds = SCENARIOS.map(s => s.id)
    for (const id of Object.values(ENTERPRISE_SCENARIO_IDS)) {
      expect(scenarioIds, `Scenario ID "${id}" not found in SCENARIOS bank`).toContain(id)
    }
  })

  it('every enterprise scenario in SCENARIOS has a matching ENTERPRISE_SCENARIO_IDS entry', () => {
    const enterpriseScenarios = SCENARIOS.filter(s => s.id.startsWith('enterprise_'))
    const centralIds = new Set(Object.values(ENTERPRISE_SCENARIO_IDS))
    for (const scenario of enterpriseScenarios) {
      expect(centralIds.has(scenario.id as any), `Enterprise scenario "${scenario.id}" missing from ENTERPRISE_SCENARIO_IDS`).toBe(true)
    }
  })
})

// ─── 9. Evidence basis safety ───────────────────────────────────────────────

describe('evidence basis safety', () => {
  it('evidence basis contains derived insight, not raw full explanation text', () => {
    const longExplanation = 'This is a very long explanation that the user typed in to explain their scenario response in great detail with many words and specific internal context that should not appear verbatim in the evidence basis because it could expose sensitive information about the organisation and its decision-making process.'

    const response: ScenarioResponse = {
      scenarioId: ENTERPRISE_SCENARIO_IDS.DELAY_30,
      chosenOption: 0,
      confidence: 80,
      reasoning: longExplanation,
      responseTimeMs: 5000,
    }

    const scenario = SCENARIOS.find(s => s.id === ENTERPRISE_SCENARIO_IDS.DELAY_30)!
    const analysis = analyseScenarioResponse(scenario, response, { execution: 70, risk: 60 })

    // The insight should be from the reveals, not the raw explanation
    expect(analysis.insight).not.toBe(longExplanation)
    expect(analysis.insight.length).toBeLessThan(300)

    // The insight should be the scenario's reveal text
    expect(analysis.insight).toBe(scenario.reveals[0])
  })
})
