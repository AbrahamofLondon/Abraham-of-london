/**
 * tests/product/paid-dossier-reality-proof.spec.ts — Paid Dossier Reality Proof Pack
 *
 * Generates Full Dossier outputs for all 12 mandatory scenarios and assesses
 * whether the paid dossier is ready for product rewiring.
 *
 * This is the critical gate before any paid rewiring.
 * No checkout. No pricing. No payment. Just the dossier quality.
 *
 * Run: npx vitest run tests/product/paid-dossier-reality-proof.spec.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'
import { TEST_SCENARIOS } from './scenarios'

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports', 'paid-dossier-reality-proof')

interface DossierOutput {
  scenario: string
  title: string
  rawSituation: string
  freeSignal: {
    tier: string
    sections: string[]
    quality: Record<string, unknown> | null
  } | null
  basicBrief: {
    tier: string
    sections: string[]
    quality: Record<string, unknown> | null
  } | null
  fullDossier: {
    tier: string
    sections: string[]
    quality: Record<string, unknown> | null
  } | null
  humanReviewState: string | null
  humanReviewTier: string | null
  regulatedBoundaryHit: boolean
  regulatedBoundaryType: string | null
  professionalBriefGenerated: boolean
  selfAdversarialPresent: boolean
  forbiddenActions: number
  minimumViablePathSteps: number
  whatMustNotBeDelayed: string[]
  evidenceCount: number
  authorityCount: number
  obligationCount: number
  constraintCount: number
  adversarialCount: number
  qualityFailures: string[] | null
  embarrassmentRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  embarrassmentNotes: string[]
}

describe('Paid Dossier Reality Proof Pack', () => {
  const kernel = new DecisionIntelligenceKernel()
  const outputs: DossierOutput[] = []

  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
  })

  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    it(`generates paid dossier proof for: ${scenario.name}`, async () => {
      // Run Free Signal
      const freeResult = await kernel.process({
        caseId: `pd-${key}-free`,
        caseReference: `PD-${key.toUpperCase()}-FREE`,
        rawScenario: scenario.input,
        aperture: 'web',
        requestedTier: 'free_signal',
        clarifications: { authority: 'Authority is established', obligation: 'Obligations are known' },
      })

      // Run Full Dossier (paid tier)
      const dossierResult = await kernel.process({
        caseId: `pd-${key}-dossier`,
        caseReference: `PD-${key.toUpperCase()}-DOSSIER`,
        rawScenario: scenario.input,
        aperture: 'paid_full_dossier',
        requestedTier: 'full_dossier',
        clarifications: { authority: 'Authority is established', obligation: 'Obligations are known' },
      })

      const lc = dossierResult.livingCase

      // Assess embarrassment risk
      const embarrassmentNotes: string[] = []
      let embarrassmentRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

      if (dossierResult.status !== 'COMPLETED') {
        embarrassmentNotes.push(`Dossier status: ${dossierResult.status}`)
        embarrassmentRisk = 'HIGH'
      }
      if (dossierResult.qualityFailures && dossierResult.qualityFailures.length > 0) {
        embarrassmentNotes.push(`Quality failures: ${dossierResult.qualityFailures.join(', ')}`)
        embarrassmentRisk = 'HIGH'
      }
      if (lc && !lc.selfAdversarialChallenge && scenario.expected.primaryClass !== 'LOW_STAKES_PREFERENCE') {
        embarrassmentNotes.push('Self-adversarial challenge missing')
        embarrassmentRisk = 'HIGH'
      }
      if (lc && lc.regulatedBoundary?.hit && !lc.regulatedBoundary?.output) {
        embarrassmentNotes.push('Regulated boundary hit but no professional brief')
        embarrassmentRisk = 'HIGH'
      }
      if (lc && lc.forbiddenActions.length === 0 && lc.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
        embarrassmentNotes.push('No forbidden actions for non-trivial case')
        if (embarrassmentRisk !== 'HIGH') embarrassmentRisk = 'MEDIUM'
      }
      if (lc && lc.minimumViablePath.length === 0 && lc.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
        embarrassmentNotes.push('No minimum viable path')
        embarrassmentRisk = 'HIGH'
      }
      if (lc && lc.classification?.primaryClass === 'LOW_STAKES_PREFERENCE' && lc.authorityMap.length > 0) {
        embarrassmentNotes.push('Low-stakes overengineered with authority mapping')
        embarrassmentRisk = 'HIGH'
      }
      if (lc && lc.classification?.primaryClass === 'LOW_STAKES_PREFERENCE' && dossierResult.status === 'COMPLETED' && dossierResult.output?.tier !== 'free_signal') {
        embarrassmentNotes.push('Low-stakes case generated paid dossier output')
        embarrassmentRisk = 'HIGH'
      }

      const output: DossierOutput = {
        scenario: key,
        title: scenario.name,
        rawSituation: scenario.input,
        freeSignal: freeResult.output ? {
          tier: freeResult.output.tier,
          sections: freeResult.output.sections.map(s => s.id),
          quality: freeResult.output.quality as unknown as Record<string, unknown>,
        } : null,
        basicBrief: null, // Would need separate run
        fullDossier: dossierResult.output ? {
          tier: dossierResult.output.tier,
          sections: dossierResult.output.sections.map(s => s.id),
          quality: dossierResult.output.quality as unknown as Record<string, unknown>,
        } : null,
        humanReviewState: lc?.review?.state ?? null,
        humanReviewTier: lc?.review?.tier ?? null,
        regulatedBoundaryHit: lc?.regulatedBoundary?.hit ?? false,
        regulatedBoundaryType: lc?.regulatedBoundary?.type ?? null,
        professionalBriefGenerated: lc?.regulatedBoundary?.output?.professionalBrief != null,
        selfAdversarialPresent: lc?.selfAdversarialChallenge != null,
        forbiddenActions: lc?.forbiddenActions?.length ?? 0,
        minimumViablePathSteps: lc?.minimumViablePath?.length ?? 0,
        whatMustNotBeDelayed: lc?.whatMustNotBeDelayed ?? [],
        evidenceCount: lc?.evidenceGraph?.length ?? 0,
        authorityCount: lc?.authorityMap?.length ?? 0,
        obligationCount: lc?.obligationMap?.length ?? 0,
        constraintCount: lc?.constraintGraph?.length ?? 0,
        adversarialCount: lc?.adversarialChallenge?.length ?? 0,
        qualityFailures: dossierResult.qualityFailures ?? freeResult.qualityFailures ?? null,
        embarrassmentRisk,
        embarrassmentNotes,
      }

      outputs.push(output)

      // Write individual JSON
      const fileBase = key === 'hmrc_filing_rescue' ? 'scenario-01-hmrc-filing-rescue'
        : key === 'board_decision_political_pressure' ? 'scenario-02-board-political-pressure'
        : key === 'market_claim_strong_copy_weak_proof' ? 'scenario-03-market-claim-weak-proof'
        : key === 'product_launch_revenue_pressure' ? 'scenario-04-product-launch-revenue-pressure'
        : key === 'procurement_supplier_risk' ? 'scenario-05-procurement-supplier-risk'
        : key === 'investor_pitch_unsupported_traction' ? 'scenario-06-investor-pitch-unsupported-traction'
        : key === 'operational_failure_unclear_owner' ? 'scenario-07-operational-failure-unclear-owner'
        : key === 'legal_admin_family_deadline' ? 'scenario-08-legal-admin-deadline'
        : key === 'cash_constrained_survival' ? 'scenario-09-cash-constrained-survival'
        : key === 'strategic_asymmetric_partnership' ? 'scenario-10-strategic-asymmetric-partnership'
        : key === 'executive_reputational_exposure' ? 'scenario-11-executive-reputational-exposure'
        : key === 'low_stakes_preference' ? 'scenario-12-low-stakes-preference'
        : `scenario-${key}`

      const jsonPath = path.join(OUTPUT_DIR, `${fileBase}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2))
      console.log(`  ✓ Wrote ${fileBase}.json`)

      // Write Markdown
      const mdPath = path.join(OUTPUT_DIR, `${fileBase}.md`)
      const md = generateDossierMarkdown(output, fileBase)
      fs.writeFileSync(mdPath, md)
      console.log(`  ✓ Wrote ${fileBase}.md`)

      expect(output).toBeDefined()
    })
  }

  afterAll(() => {
    // Generate summary
    const summaryPath = path.join(OUTPUT_DIR, 'summary.md')
    const summary = generateSummary(outputs)
    fs.writeFileSync(summaryPath, summary)
    console.log('  ✓ Wrote summary.md')

    // Print summary
    console.log('\n=== PAID DOSSIER REALITY PROOF PACK ===')
    console.log(`Scenarios: ${outputs.length}`)
    const highRisk = outputs.filter(o => o.embarrassmentRisk === 'HIGH')
    const medRisk = outputs.filter(o => o.embarrassmentRisk === 'MEDIUM')
    const lowRisk = outputs.filter(o => o.embarrassmentRisk === 'LOW')
    console.log(`Embarrassment risk: ${highRisk.length} HIGH, ${medRisk.length} MEDIUM, ${lowRisk.length} LOW`)
    for (const o of highRisk) {
      console.log(`  ✗ ${o.title}: ${o.embarrassmentNotes.join('; ')}`)
    }
    for (const o of medRisk) {
      console.log(`  ⚠ ${o.title}: ${o.embarrassmentNotes.join('; ')}`)
    }
    console.log('========================================')
  })
})

function generateDossierMarkdown(output: DossierOutput, fileBase: string): string {
  let md = `# ${output.title}

**Scenario:** \`${output.scenario}\`
**Embarrassment Risk:** ${output.embarrassmentRisk}

---

## 1. Raw User Situation

\`\`\`
${output.rawSituation}
\`\`\`

## 2. Free Signal

**Tier:** ${output.freeSignal?.tier ?? 'N/A'}
**Sections:** ${output.freeSignal?.sections?.join(', ') ?? 'N/A'}
**Generic output:** ${output.freeSignal?.quality?.genericOutputDetected ?? 'N/A'}

## 3. Full Dossier

**Status:** ${output.fullDossier ? 'Generated' : 'Not generated'}
**Tier:** ${output.fullDossier?.tier ?? 'N/A'}
**Sections:** ${output.fullDossier?.sections?.join(', ') ?? 'N/A'}
**Generic output:** ${output.fullDossier?.quality?.genericOutputDetected ?? 'N/A'}

## 4. Human Review State

**State:** ${output.humanReviewState ?? 'N/A'}
**Tier:** ${output.humanReviewTier ?? 'N/A'}

## 5. Regulated Boundary

**Hit:** ${output.regulatedBoundaryHit}
**Type:** ${output.regulatedBoundaryType ?? 'N/A'}
**Professional brief:** ${output.professionalBriefGenerated ? 'Generated' : 'Not generated'}

## 6. Self-Adversarial Challenge

**Present:** ${output.selfAdversarialPresent ? 'Yes' : 'No'}

## 7. Forbidden Actions

**Count:** ${output.forbiddenActions}

## 8. Minimum Viable Path

**Steps:** ${output.minimumViablePathSteps}

## 9. What Must Not Be Delayed

${output.whatMustNotBeDelayed.length > 0 ? output.whatMustNotBeDelayed.map(w => `- ${w}`).join('\n') : '*None identified*'}

## 10. Evidence Graph

**Nodes:** ${output.evidenceCount}

## 11. Authority & Obligation

**Authority entries:** ${output.authorityCount}
**Obligation entries:** ${output.obligationCount}

## 12. Constraints

**Constraints:** ${output.constraintCount}

## 13. Adversarial Challenges

**Challenges:** ${output.adversarialCount}

## 14. Quality Failures

${output.qualityFailures && output.qualityFailures.length > 0 ? output.qualityFailures.map(f => `- ${f}`).join('\n') : '*None*'}

## 15. Embarrassment Risk

**Risk:** ${output.embarrassmentRisk}
**Notes:** ${output.embarrassmentNotes.length > 0 ? output.embarrassmentNotes.join('; ') : 'None'}
`

  return md
}

function generateSummary(outputs: DossierOutput[]): string {
  const total = outputs.length
  const highRisk = outputs.filter(o => o.embarrassmentRisk === 'HIGH')
  const medRisk = outputs.filter(o => o.embarrassmentRisk === 'MEDIUM')
  const lowRisk = outputs.filter(o => o.embarrassmentRisk === 'LOW')

  const completed = outputs.filter(o => o.fullDossier?.tier === 'full_dossier')
  const downgraded = outputs.filter(o => o.fullDossier?.tier !== 'full_dossier' && o.fullDossier !== null)

  const withSelfAdv = outputs.filter(o => o.selfAdversarialPresent)
  const withRegBoundary = outputs.filter(o => o.regulatedBoundaryHit)
  const withProfBrief = outputs.filter(o => o.professionalBriefGenerated)
  const withHumanReview = outputs.filter(o => o.humanReviewState !== 'not_required' && o.humanReviewState !== null)
  const withForbidden = outputs.filter(o => o.forbiddenActions > 0)
  const withMVP = outputs.filter(o => o.minimumViablePathSteps > 0)
  const withWND = outputs.filter(o => o.whatMustNotBeDelayed.length > 0)

  // Determine readiness
  let readiness = 'NOT_READY'
  if (highRisk.length === 0 && medRisk.length === 0) {
    readiness = 'READY_FOR_PAID_DOSSIER_REWIRE'
  } else if (highRisk.length === 0) {
    readiness = 'INTERNAL_ONLY'
  }

  let md = `# Paid Dossier Reality Proof Pack — Summary

**Generated:** ${new Date().toISOString().split('T')[0]}
**Kernel Version:** 1.0.0
**Contract Version:** 1.0.0

## Overview

| Metric | Value |
|---|---|
| Total scenarios | ${total} |
| Full Dossier generated | ${completed.length} |
| Downgraded to Free Signal | ${downgraded.length} |
| HIGH embarrassment risk | ${highRisk.length} |
| MEDIUM embarrassment risk | ${medRisk.length} |
| LOW embarrassment risk | ${lowRisk.length} |
| Readiness verdict | ${readiness} |

## Dossier Quality

| Feature | Scenarios |
|---|---|
| Self-adversarial challenge present | ${withSelfAdv.length}/${total} |
| Regulated boundary detected | ${withRegBoundary.length}/${total} |
| Professional brief generated | ${withProfBrief.length}/${total} |
| Human review triggered | ${withHumanReview.length}/${total} |
| Forbidden actions present | ${withForbidden.length}/${total} |
| Minimum viable path present | ${withMVP.length}/${total} |
| What must not be delayed present | ${withWND.length}/${total} |

## Scenario Results

| Scenario | Dossier Tier | Embarrassment | Notes |
|---|---|---|---|
${outputs.map(o => `| ${o.title} | ${o.fullDossier?.tier ?? 'N/A'} | ${o.embarrassmentRisk} | ${o.embarrassmentNotes.length > 0 ? o.embarrassmentNotes.join('; ') : 'Clean'} |`).join('\n')}

## Danger Scenarios

### Board Political Pressure
- Dossier tier: ${outputs.find(o => o.scenario === 'board_decision_political_pressure')?.fullDossier?.tier ?? 'N/A'}
- Embarrassment: ${outputs.find(o => o.scenario === 'board_decision_political_pressure')?.embarrassmentRisk ?? 'N/A'}
- Notes: ${outputs.find(o => o.scenario === 'board_decision_political_pressure')?.embarrassmentNotes.join('; ') ?? 'None'}

### Strategic Asymmetric Partnership
- Dossier tier: ${outputs.find(o => o.scenario === 'strategic_asymmetric_partnership')?.fullDossier?.tier ?? 'N/A'}
- Embarrassment: ${outputs.find(o => o.scenario === 'strategic_asymmetric_partnership')?.embarrassmentRisk ?? 'N/A'}
- Notes: ${outputs.find(o => o.scenario === 'strategic_asymmetric_partnership')?.embarrassmentNotes.join('; ') ?? 'None'}

### Executive Reputational Exposure
- Dossier tier: ${outputs.find(o => o.scenario === 'executive_reputational_exposure')?.fullDossier?.tier ?? 'N/A'}
- Embarrassment: ${outputs.find(o => o.scenario === 'executive_reputational_exposure')?.embarrassmentRisk ?? 'N/A'}
- Notes: ${outputs.find(o => o.scenario === 'executive_reputational_exposure')?.embarrassmentNotes.join('; ') ?? 'None'}

### Low-Stakes Preference
- Dossier tier: ${outputs.find(o => o.scenario === 'low_stakes_preference')?.fullDossier?.tier ?? 'N/A'}
- Embarrassment: ${outputs.find(o => o.scenario === 'low_stakes_preference')?.embarrassmentRisk ?? 'N/A'}
- Notes: ${outputs.find(o => o.scenario === 'low_stakes_preference')?.embarrassmentNotes.join('; ') ?? 'None'}

## Verdict

**${readiness}**

${readiness === 'NOT_READY'
  ? 'The Full Dossier is not ready for paid rewiring. HIGH embarrassment risk scenarios must be resolved before any paid product can be connected.'
  : readiness === 'INTERNAL_ONLY'
    ? 'The Full Dossier passes automatic checks but has MEDIUM embarrassment risk. Usable for internal founder review but not for paid delivery.'
    : 'The Full Dossier passes all 12 scenarios with no embarrassment risk. It is ready for paid dossier rewiring.'}

## Next Steps

1. ${readiness === 'NOT_READY' ? 'Resolve HIGH embarrassment risk scenarios' : 'Proceed to manual Full Dossier review'}
2. Review each danger scenario dossier for judgement quality
3. If all pass manual review, readiness may advance to READY_FOR_PAID_DOSSIER_REWIRE
4. Do NOT enable checkout until READY_FOR_CHECKOUT_REWIRE is achieved
`

  return md
}
