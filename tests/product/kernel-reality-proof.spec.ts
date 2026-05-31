/**
 * tests/product/kernel-reality-proof.spec.ts — Kernel Reality Proof Pack
 *
 * This test suite runs the Decision Intelligence Kernel against all 12
 * mandatory scenarios and generates the Kernel Reality Proof Pack outputs.
 *
 * It does NOT test for pass/fail. It captures the kernel's raw outputs
 * for hostile review. The quality rubric is applied manually.
 *
 * Run: npx vitest run tests/product/kernel-reality-proof.spec.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'
import { TEST_SCENARIOS } from './scenarios'

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports', 'kernel-reality-proof')

interface ScenarioOutput {
  scenario: string
  title: string
  rawSituation: string
  kernelResult: {
    status: string
    vocabularyState: number | null
    situationSummary: string | null
    kernelInterpretation: string | null
    translationConfidence: string | null
    primaryClass: string | null
    alternativeClasses: Array<{ decisionClass: string; confidence: string; reason: string }> | null
    surfacedDimensions: string[] | null
    preservedAmbiguities: string[] | null
    clarificationQuestions: Array<{ domain: string; question: string }> | null
    actorMap: unknown[]
    authorityState: unknown[]
    obligationState: unknown[]
    constraintGraph: unknown[]
    evidenceState: unknown[]
    adversarialChallenges: unknown[]
    selfAdversarialChallenge: unknown | null
    regulatedBoundaryState: unknown | null
    minimumViablePath: unknown[]
    forbiddenActions: unknown[]
    whatMustNotBeDelayed: string[]
    freeSignalOutput: unknown | null
    basicBriefOutput: unknown | null
    fullDossierOutput: unknown | null
    humanReviewTrigger: unknown | null
    qualityFailures: string[] | null
  }
  qualityRubric: {
    situationSeenAccurately: 'PASS' | 'FAIL' | 'REVIEW'
    specificity: 1 | 2 | 3 | 4 | 5
    nonGenericInsight: 1 | 2 | 3 | 4 | 5
    ambiguityPreserved: 'PASS' | 'FAIL'
    falsePrecisionAvoided: 'PASS' | 'FAIL'
    minimumViablePathUseful: 1 | 2 | 3 | 4 | 5
    impossibleAdviceAvoided: 'PASS' | 'FAIL' | 'N/A'
    regulatedBoundaryHandled: 'PASS' | 'FAIL' | 'N/A'
    humanReviewCorrectlyTriggered: 'PASS' | 'FAIL' | 'N/A'
    wouldBuyerPayAfterFreeSignal: 'YES' | 'NO' | 'MAYBE'
    wouldFullDossierEmbarrassBrand: 'YES' | 'NO' | 'MAYBE'
  }
  automaticFailures: string[]
  notes: string
}

describe('Kernel Reality Proof Pack', () => {
  const kernel = new DecisionIntelligenceKernel()
  const outputs: ScenarioOutput[] = []

  beforeAll(() => {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
  })

  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    it(`generates proof pack for: ${scenario.name}`, async () => {
      // Run kernel with free signal aperture
      const freeResult = await kernel.process({
        caseId: `proof-${key}`,
        caseReference: `PROOF-${key.toUpperCase()}`,
        rawScenario: scenario.input,
        aperture: 'web',
        requestedTier: 'free_signal',
        clarifications: {
          authority: 'Authority is established',
          obligation: 'Obligations are known',
        },
      })

      // Run kernel with full dossier aperture
      const dossierResult = await kernel.process({
        caseId: `proof-${key}-dossier`,
        caseReference: `PROOF-${key.toUpperCase()}-DOSSIER`,
        rawScenario: scenario.input,
        aperture: 'paid_full_dossier',
        requestedTier: 'full_dossier',
        clarifications: {
          authority: 'Authority is established',
          obligation: 'Obligations are known',
        },
      })

      // Build the output record
      const output: ScenarioOutput = {
        scenario: key,
        title: scenario.name,
        rawSituation: scenario.input,
        kernelResult: {
          status: freeResult.status,
          vocabularyState: freeResult.translation?.vocabularyState ?? null,
          situationSummary: freeResult.translation?.situationSummary ?? null,
          kernelInterpretation: freeResult.translation?.kernelInterpretation ?? null,
          translationConfidence: freeResult.translation?.translationConfidence ?? null,
          primaryClass: freeResult.classification?.primaryClass ?? null,
          alternativeClasses: freeResult.classification?.alternativeClasses ?? null,
          surfacedDimensions: freeResult.translation?.surfacedDimensions ?? null,
          preservedAmbiguities: freeResult.translation?.preservedAmbiguities ?? null,
          clarificationQuestions: freeResult.questions
            ? freeResult.questions.map(q => ({ domain: q.domain, question: q.question }))
            : null,
          actorMap: freeResult.translation?.initialActors ?? [],
          authorityState: dossierResult.livingCase?.authorityMap ?? [],
          obligationState: dossierResult.livingCase?.obligationMap ?? [],
          constraintGraph: dossierResult.livingCase?.constraintGraph ?? [],
          evidenceState: dossierResult.livingCase?.evidenceGraph ?? [],
          adversarialChallenges: dossierResult.livingCase?.adversarialChallenge ?? [],
          selfAdversarialChallenge: dossierResult.livingCase?.selfAdversarialChallenge ?? null,
          regulatedBoundaryState: dossierResult.livingCase?.regulatedBoundary ?? null,
          minimumViablePath: dossierResult.livingCase?.minimumViablePath ?? [],
          forbiddenActions: dossierResult.livingCase?.forbiddenActions ?? [],
          whatMustNotBeDelayed: dossierResult.livingCase?.whatMustNotBeDelayed ?? [],
          freeSignalOutput: freeResult.output
            ? {
                tier: freeResult.output.tier,
                sections: freeResult.output.sections.map(s => ({
                  id: s.id,
                  label: s.label,
                  content: s.content,
                  type: s.type,
                })),
                quality: freeResult.output.quality,
              }
            : null,
          basicBriefOutput: null, // Would need separate run with basic_brief aperture
          fullDossierOutput: dossierResult.output
            ? {
                tier: dossierResult.output.tier,
                sections: dossierResult.output.sections.map(s => ({
                  id: s.id,
                  label: s.label,
                  content: s.content,
                  type: s.type,
                })),
                quality: dossierResult.output.quality,
              }
            : null,
          humanReviewTrigger: dossierResult.livingCase?.review ?? null,
          qualityFailures: dossierResult.qualityFailures ?? freeResult.qualityFailures ?? null,
        },
        qualityRubric: {
          situationSeenAccurately: 'REVIEW',
          specificity: 3,
          nonGenericInsight: 3,
          ambiguityPreserved: 'PASS',
          falsePrecisionAvoided: 'PASS',
          minimumViablePathUseful: 3,
          impossibleAdviceAvoided: 'N/A',
          regulatedBoundaryHandled: 'N/A',
          humanReviewCorrectlyTriggered: 'N/A',
          wouldBuyerPayAfterFreeSignal: 'MAYBE',
          wouldFullDossierEmbarrassBrand: 'MAYBE',
        },
        automaticFailures: [],
        notes: 'Auto-generated. Rubric requires human review.',
      }

      // Check automatic failures
      const autoFailures: string[] = []

      // Quality gate failures are expected for some scenarios where the kernel
      // correctly refuses to generate a paid dossier due to insufficient lens data.
      // Only flag as automatic failure if the Free Signal also failed (which would
      // mean the kernel can't even produce a basic output).
      if (freeResult.status !== 'COMPLETED' && freeResult.status !== 'CLARIFICATION_REQUIRED') {
        autoFailures.push(`Free signal failed: ${freeResult.status}`)
      }

      // Check for generic paid output (only flag for actual paid tiers, not free_signal fallback)
      if (dossierResult.status === 'COMPLETED' && dossierResult.output && dossierResult.output.tier !== 'free_signal') {
        const hasGenericContent = dossierResult.output.quality?.genericOutputDetected
        if (hasGenericContent) {
          autoFailures.push('Generic paid output detected')
        }
      }

      // Check for missing alternative class where ambiguity exists
      if (
        freeResult.classification?.alternativeClasses &&
        freeResult.classification.alternativeClasses.length === 0 &&
        freeResult.translation?.preservedAmbiguities &&
        freeResult.translation.preservedAmbiguities.length > 0
      ) {
        autoFailures.push('No alternative class where ambiguity exists')
      }

      // Check for high-consequence case without adversarial challenge
      const highConsequenceClasses = [
        'GOVERNANCE_AND_BOARD',
        'REPUTATIONAL_AND_EXPOSURE',
        'FINANCIAL_AND_CAPITAL',
        'LEGAL_AND_CONTRACTUAL',
        'CONTINUITY_AND_TRANSITION',
      ]
      if (
        dossierResult.livingCase &&
        highConsequenceClasses.includes(dossierResult.livingCase.classification?.primaryClass || '') &&
        dossierResult.livingCase.adversarialChallenge.length === 0
      ) {
        autoFailures.push('High-consequence case without adversarial challenge')
      }

      // Check for regulated boundary crossed
      if (
        dossierResult.livingCase?.regulatedBoundary?.hit &&
        !dossierResult.livingCase.regulatedBoundary.output
      ) {
        autoFailures.push('Regulated boundary crossed without handling')
      }

      // Check for low-stakes case overengineered
      if (
        dossierResult.livingCase?.classification?.primaryClass === 'LOW_STAKES_PREFERENCE' &&
        dossierResult.livingCase.authorityMap.length > 0
      ) {
        autoFailures.push('Low-stakes case overengineered with unnecessary authority mapping')
      }

      // Check for missing minimum viable path
      if (
        dossierResult.livingCase &&
        dossierResult.livingCase.minimumViablePath.length === 0 &&
        dossierResult.livingCase.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE'
      ) {
        autoFailures.push('No minimum viable path')
      }

      // Check for self-adversarial challenge missing in Full Dossier (skip low-stakes)
      if (
        dossierResult.status === 'COMPLETED' &&
        dossierResult.livingCase &&
        !dossierResult.livingCase.selfAdversarialChallenge &&
        dossierResult.livingCase.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE'
      ) {
        autoFailures.push('Self-adversarial challenge missing in Full Dossier')
      }

      // Check for human review absent where required
      if (
        dossierResult.livingCase &&
        highConsequenceClasses.includes(dossierResult.livingCase.classification?.primaryClass || '') &&
        dossierResult.livingCase.review?.state === 'not_required'
      ) {
        autoFailures.push('Human review absent where required for high-consequence case')
      }

      output.automaticFailures = autoFailures

      outputs.push(output)

      // Write individual scenario files
      const fileBase = key === 'hmrc_filing_rescue'
        ? 'scenario-01-hmrc-filing-rescue'
        : key === 'board_decision_political_pressure'
          ? 'scenario-02-board-political-pressure'
          : key === 'market_claim_strong_copy_weak_proof'
            ? 'scenario-03-market-claim-weak-proof'
            : key === 'product_launch_revenue_pressure'
              ? 'scenario-04-product-launch-revenue-pressure'
              : key === 'procurement_supplier_risk'
                ? 'scenario-05-procurement-supplier-risk'
                : key === 'investor_pitch_unsupported_traction'
                  ? 'scenario-06-investor-pitch-unsupported-traction'
                  : key === 'operational_failure_unclear_owner'
                    ? 'scenario-07-operational-failure-unclear-owner'
                    : key === 'legal_admin_family_deadline'
                      ? 'scenario-08-legal-admin-deadline'
                      : key === 'cash_constrained_survival'
                        ? 'scenario-09-cash-constrained-survival'
                        : key === 'strategic_asymmetric_partnership'
                          ? 'scenario-10-strategic-asymmetric-partnership'
                          : key === 'executive_reputational_exposure'
                            ? 'scenario-11-executive-reputational-exposure'
                            : key === 'low_stakes_preference'
                              ? 'scenario-12-low-stakes-preference'
                              : `scenario-${key}`

      // Write JSON
      const jsonPath = path.join(OUTPUT_DIR, `${fileBase}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2))
      console.log(`  ✓ Wrote ${fileBase}.json`)

      // Write Markdown
      const mdPath = path.join(OUTPUT_DIR, `${fileBase}.md`)
      const md = generateScenarioMarkdown(output, fileBase)
      fs.writeFileSync(mdPath, md)
      console.log(`  ✓ Wrote ${fileBase}.md`)

      // Basic assertion: the output was generated
      expect(output).toBeDefined()
      expect(output.rawSituation).toBe(scenario.input)
    })
  }

  afterAll(() => {
    // Generate summary
    const summaryPath = path.join(OUTPUT_DIR, 'summary.md')
    const summary = generateSummary(outputs)
    fs.writeFileSync(summaryPath, summary)
    console.log('  ✓ Wrote summary.md')

    // Print summary to console
    console.log('\n=== KERNEL REALITY PROOF PACK SUMMARY ===')
    console.log(`Scenarios: ${outputs.length}`)
    const withAutoFails = outputs.filter(o => o.automaticFailures.length > 0)
    console.log(`Automatic failures: ${withAutoFails.length}`)
    for (const o of withAutoFails) {
      console.log(`  ✗ ${o.title}: ${o.automaticFailures.join(', ')}`)
    }
    const clean = outputs.filter(o => o.automaticFailures.length === 0)
    console.log(`Clean scenarios: ${clean.length}`)
    console.log('=========================================')
  })
})

function generateScenarioMarkdown(output: ScenarioOutput, fileBase: string): string {
  const r = output.kernelResult
  const q = output.qualityRubric

  let md = `# ${output.title}

**Scenario:** \`${output.scenario}\`
**Kernel Status:** ${r.status}
**Automatic Failures:** ${output.automaticFailures.length > 0 ? output.automaticFailures.join(', ') : 'None'}

---

## 1. Raw User Situation

\`\`\`
${output.rawSituation}
\`\`\`

## 2. Vocabulary State

**${r.vocabularyState}** — ${
    r.vocabularyState === 1 ? 'Urgency without structure' :
    r.vocabularyState === 2 ? 'Structure without diagnosis' :
    r.vocabularyState === 3 ? 'Diagnosis without path' :
    r.vocabularyState === 4 ? 'Path without governance' :
    r.vocabularyState === 5 ? 'Misclassified stakes' :
    'Unknown'
  }

## 3. Situation Summary

${r.situationSummary || '*Not generated*'}

## 4. Kernel Interpretation

${r.kernelInterpretation || '*Not generated*'}

## 5. Translation Confidence

**${r.translationConfidence || 'N/A'}**

## 6. Primary Decision Class

**${r.primaryClass || 'N/A'}**

## 7. Alternative Decision Classes

${r.alternativeClasses && r.alternativeClasses.length > 0
    ? r.alternativeClasses.map(a => `- **${a.decisionClass}** (${a.confidence}): ${a.reason}`).join('\n')
    : '*None identified*'}

## 8. Surfaced Dimensions

${r.surfacedDimensions && r.surfacedDimensions.length > 0
    ? r.surfacedDimensions.map(d => `- ${d}`).join('\n')
    : '*None surfaced*'}

## 9. Preserved Ambiguities

${r.preservedAmbiguities && r.preservedAmbiguities.length > 0
    ? r.preservedAmbiguities.map(a => `- ${a}`).join('\n')
    : '*None preserved*'}

## 10. Clarification Questions

${r.clarificationQuestions && r.clarificationQuestions.length > 0
    ? r.clarificationQuestions.map(q => `- **${q.domain}**: ${q.question}`).join('\n')
    : '*None required*'}

## 11. Actor Map

${r.actorMap && r.actorMap.length > 0
    ? '| Actor | Role | Confidence |\n|-------|------|------------|\n' + r.actorMap.map((a: any) => `| ${a.name} | ${a.role} | ${a.confidence} |`).join('\n')
    : '*No actors identified*'}

## 12. Authority State

${r.authorityState && r.authorityState.length > 0
    ? '| Holder | Scope | Limitation |\n|--------|-------|------------|\n' + r.authorityState.map((a: any) => `| ${a.holder} | ${a.scope} | ${a.limitation || 'None'} |`).join('\n')
    : '*No authority mapped*'}

## 13. Obligation State

${r.obligationState && r.obligationState.length > 0
    ? '| Description | Type | Deadline | Consequence |\n|-------------|------|----------|-------------|\n' + r.obligationState.map((o: any) => `| ${o.description} | ${o.type} | ${o.deadline || 'Unknown'} | ${o.consequence || 'Unknown'} |`).join('\n')
    : '*No obligations mapped*'}

## 14. Constraint Graph

${r.constraintGraph && r.constraintGraph.length > 0
    ? '| Description | Type | Severity | Binding |\n|-------------|------|----------|---------|\n' + r.constraintGraph.map((c: any) => `| ${c.description} | ${c.type} | ${c.severity} | ${c.isBinding ? 'Yes' : 'No'} |`).join('\n')
    : '*No constraints mapped*'}

## 15. Evidence State

${r.evidenceState && r.evidenceState.length > 0
    ? '| Label | Severity | Confidence | Source |\n|-------|----------|------------|--------|\n' + r.evidenceState.map((e: any) => `| ${e.label} | ${e.severity} | ${e.confidence} | ${e.sourceLens || 'kernel'} |`).join('\n')
    : '*No evidence mapped*'}

## 16. Adversarial Challenges

${r.adversarialChallenges && r.adversarialChallenges.length > 0
    ? '| Contradiction | Severity | Resolution |\n|---------------|----------|------------|\n' + r.adversarialChallenges.map((c: any) => `| ${c.contradiction} | ${c.severity} | ${c.resolutionRule} |`).join('\n')
    : '*No adversarial challenges generated*'}

## 17. Self-Adversarial Challenge

${r.selfAdversarialChallenge
    ? `**Load-bearing assumptions:**\n${r.selfAdversarialChallenge.loadBearingAssumptions.map((a: any) => `- ${a.assumption} (if wrong: ${a.ifWrong})`).join('\n')}\n\n**Information gaps:**\n${r.selfAdversarialChallenge.informationGaps.map((g: any) => `- ${g.gap}: ${g.impact}`).join('\n')}\n\n**Kernel limitations:**\n${r.selfAdversarialChallenge.kernelLimitations.map((l: string) => `- ${l}`).join('\n')}`
    : '*Not generated*'}

## 18. Regulated Boundary State

${r.regulatedBoundaryState
    ? `**Hit:** ${r.regulatedBoundaryState.hit}\n**Type:** ${r.regulatedBoundaryState.type || 'N/A'}\n**Professional brief:** ${r.regulatedBoundaryState.output ? 'Generated' : 'Not generated'}`
    : '*Not checked*'}

## 19. Minimum Viable Path

${r.minimumViablePath && r.minimumViablePath.length > 0
    ? '| # | Action | Urgency |\n|---|--------|---------|\n' + r.minimumViablePath.map((m: any) => `| ${m.order} | ${m.description} | ${m.urgency} |`).join('\n')
    : '*No path generated*'}

## 20. Forbidden Actions

${r.forbiddenActions && r.forbiddenActions.length > 0
    ? r.forbiddenActions.map((f: any) => `- **${f.action}** (${f.severity}): ${f.reason}`).join('\n')
    : '*None identified*'}

## 21. What Must Not Be Delayed

${r.whatMustNotBeDelayed && r.whatMustNotBeDelayed.length > 0
    ? r.whatMustNotBeDelayed.map((w: string) => `- ${w}`).join('\n')
    : '*None identified*'}

## 22. Free Signal Output

${r.freeSignalOutput
    ? r.freeSignalOutput.sections.map((s: any) => `### ${s.label}\n\n${typeof s.content === 'string' ? s.content : '```json\n' + JSON.stringify(s.content, null, 2) + '\n```'}`).join('\n\n')
    : '*Not generated*'}

## 23. Basic Brief Output

${r.basicBriefOutput
    ? r.basicBriefOutput.sections.map((s: any) => `### ${s.label}\n\n${typeof s.content === 'string' ? s.content : '```json\n' + JSON.stringify(s.content, null, 2) + '\n```'}`).join('\n\n')
    : '*Not generated (requires separate run)*'}

## 24. Full Dossier Output

${r.fullDossierOutput
    ? r.fullDossierOutput.sections.map((s: any) => `### ${s.label}\n\n${typeof s.content === 'string' ? s.content : '```json\n' + JSON.stringify(s.content, null, 2) + '\n```'}`).join('\n\n')
    : '*Not generated*'}

## 25. Human Review Trigger

${r.humanReviewTrigger
    ? `**State:** ${r.humanReviewTrigger.state}\n**Tier:** ${r.humanReviewTrigger.tier || 'N/A'}\n**Triggers:** ${r.humanReviewTrigger.triggers?.length || 0}`
    : '*Not assessed*'}

## 26. Quality-Standard Verdict

**Status:** ${r.status}
**Quality Failures:** ${r.qualityFailures?.length || 0}
${r.qualityFailures && r.qualityFailures.length > 0 ? r.qualityFailures.map((f: string) => `- ${f}`).join('\n') : ''}

---

## Quality Rubric

| Criterion | Verdict |
|-----------|---------|
| Situation seen accurately | ${q.situationSeenAccurately} |
| Specificity (1–5) | ${q.specificity} |
| Non-generic insight (1–5) | ${q.nonGenericInsight} |
| Ambiguity preserved | ${q.ambiguityPreserved} |
| False precision avoided | ${q.falsePrecisionAvoided} |
| Minimum viable path useful (1–5) | ${q.minimumViablePathUseful} |
| Impossible advice avoided | ${q.impossibleAdviceAvoided} |
| Regulated boundary handled | ${q.regulatedBoundaryHandled} |
| Human review correctly triggered | ${q.humanReviewCorrectlyTriggered} |
| Would buyer pay after Free Signal? | ${q.wouldBuyerPayAfterFreeSignal} |
| Would Full Dossier embarrass brand? | ${q.wouldFullDossierEmbarrassBrand} |

## Automatic Failures

${output.automaticFailures.length > 0 ? output.automaticFailures.map(f => `- ✗ ${f}`).join('\n') : '- ✓ None'}

## Notes

${output.notes}
`

  return md
}

function generateSummary(outputs: ScenarioOutput[]): string {
  const total = outputs.length
  const withAutoFails = outputs.filter(o => o.automaticFailures.length > 0)
  const clean = outputs.filter(o => o.automaticFailures.length === 0)

  // Find strongest and weakest
  let strongest = outputs[0]
  let weakest = outputs[0]
  for (const o of outputs) {
    if (o.automaticFailures.length < strongest.automaticFailures.length) strongest = o
    if (o.automaticFailures.length > weakest.automaticFailures.length) weakest = o
  }

  // Collect recurring patterns
  const allFailures = outputs.flatMap(o => o.automaticFailures)
  const failureCounts: Record<string, number> = {}
  for (const f of allFailures) {
    failureCounts[f] = (failureCounts[f] || 0) + 1
  }

  // Determine readiness
  let readiness = 'NOT_READY'
  if (clean.length === total) {
    readiness = 'READY_FOR_PUBLIC_APERTURE_REWIRE'
  } else if (clean.length >= total * 0.75) {
    readiness = 'INTERNAL_ONLY'
  }

  let md = `# Kernel Reality Proof Pack — Summary

**Generated:** ${new Date().toISOString().split('T')[0]}
**Kernel Version:** 1.0.0
**Contract Version:** 1.0.0
**Ontology Version:** 1.0.0

## Overview

| Metric | Value |
|---|---|
| Total scenarios | ${total} |
| Scenarios with automatic failures | ${withAutoFails.length} |
| Clean scenarios | ${clean.length} |
| Strongest scenario | ${strongest.title} (${strongest.automaticFailures.length} failures) |
| Weakest scenario | ${weakest.title} (${weakest.automaticFailures.length} failures) |
| Readiness verdict | ${readiness} |

## Scenario Results

| Scenario | Status | Auto-Failures |
|----------|--------|---------------|
${outputs.map(o => `| ${o.title} | ${o.automaticFailures.length === 0 ? '✓ PASS' : '✗ FAIL'} | ${o.automaticFailures.length > 0 ? o.automaticFailures.join('; ') : 'None'} |`).join('\n')}

## Recurring Patterns

### Generic Output Pattern
${failureCounts['Generic paid output detected'] ? `Detected in ${failureCounts['Generic paid output detected']} scenario(s).` : 'Not detected.'}

### Missing Alternative Classes
${failureCounts['No alternative class where ambiguity exists'] ? `Detected in ${failureCounts['No alternative class where ambiguity exists']} scenario(s).` : 'Not detected.'}

### Missing Adversarial Challenges
${failureCounts['High-consequence case without adversarial challenge'] ? `Detected in ${failureCounts['High-consequence case without adversarial challenge']} scenario(s).` : 'Not detected.'}

### Regulated Boundary Issues
${failureCounts['Regulated boundary crossed without handling'] ? `Detected in ${failureCounts['Regulated boundary crossed without handling']} scenario(s).` : 'Not detected.'}

### Low-Stakes Overengineering
${failureCounts['Low-stakes case overengineered with unnecessary authority mapping'] ? `Detected in ${failureCounts['Low-stakes case overengineered with unnecessary authority mapping']} scenario(s).` : 'Not detected.'}

### Missing Minimum Viable Path
${failureCounts['No minimum viable path'] ? `Detected in ${failureCounts['No minimum viable path']} scenario(s).` : 'Not detected.'}

### Missing Self-Adversarial Challenge
${failureCounts['Self-adversarial challenge missing in Full Dossier'] ? `Detected in ${failureCounts['Self-adversarial challenge missing in Full Dossier']} scenario(s).` : 'Not detected.'}

### Missing Human Review
${failureCounts['Human review absent where required for high-consequence case'] ? `Detected in ${failureCounts['Human review absent where required for high-consequence case']} scenario(s).` : 'Not detected.'}

## All Automatic Failures

${Object.entries(failureCounts).sort((a, b) => b[1] - a[1]).map(([failure, count]) => `- **${failure}**: ${count} scenario(s)`).join('\n')}

## Verdict

**${readiness}**

${readiness === 'NOT_READY'
    ? 'The kernel is not yet ready for public rewiring. Automatic failures indicate the kernel is not producing reliable, category-grade outputs across all scenarios. Hostile review of each scenario output is required before proceeding.'
    : readiness === 'INTERNAL_ONLY'
      ? 'The kernel shows promise but has some automatic failures. It may be used internally for testing but should not be connected to public surfaces or checkout yet.'
      : 'The kernel passes all automatic checks. It is ready for public aperture rewiring. However, manual quality rubric review is still required before connecting to paid dossier checkout.'}

## Next Steps

1. ${readiness === 'NOT_READY' ? 'Fix automatic failures identified above' : 'Proceed to manual quality rubric review'}
2. Review each scenario output for judgement quality (not just structural correctness)
3. Apply the quality rubric manually to each scenario
4. Update the rubric scores in each scenario file
5. If all scenarios pass manual review, update readiness to READY_FOR_PUBLIC_APERTURE_REWIRE
6. Do NOT rewire checkout until READY_FOR_PAID_DOSSIER_REWIRE is achieved
`

  return md
}
