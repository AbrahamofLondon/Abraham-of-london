/**
 * tests/product/paid-dossier-fulfilment-proof.spec.ts — Paid Dossier Fulfilment Proof
 *
 * Generates admin fulfilment records for all 12 scenarios, simulates human review,
 * and produces delivery-ready dossier artefacts.
 *
 * No checkout. No payment. No public access.
 *
 * Run: npx vitest run tests/product/paid-dossier-fulfilment-proof.spec.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { AdminFulfilmentEngine, type FulfilmentRecord } from '../../lib/intelligence/admin-fulfilment'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'
import { TEST_SCENARIOS } from './scenarios'

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports', 'paid-dossier-fulfilment-proof')

describe('Paid Dossier Fulfilment Proof', () => {
  const engine = new AdminFulfilmentEngine()
  const kernel = new DecisionIntelligenceKernel()
  const records: FulfilmentRecord[] = []

  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
  })

  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    it(`generates admin fulfilment for: ${scenario.name}`, async () => {
      const record = await engine.generateDossier(scenario.input, scenario.name, {
        authority: 'Authority is established',
        obligation: 'Obligations are known',
      })

      records.push(record)

      // Generate the kernel result for the artefact
      const caseId = `artefact-${key}-${Date.now()}`
      const result = await kernel.process({
        caseId,
        caseReference: record.caseReference,
        rawScenario: scenario.input,
        aperture: 'paid_full_dossier',
        requestedTier: 'full_dossier',
        clarifications: { authority: 'Authority is established', obligation: 'Obligations are known' },
      })

      // Generate delivery-ready artefact
      const artefact = engine.generateArtefact(record, result.livingCase, result.output)

      // Write fulfilment record
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

      // Write JSON
      const jsonPath = path.join(OUTPUT_DIR, `${fileBase}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify({ record, artefact }, null, 2))
      console.log(`  ✓ Wrote ${fileBase}.json`)

      // Write Markdown
      const mdPath = path.join(OUTPUT_DIR, `${fileBase}.md`)
      const md = generateFulfilmentMarkdown(record, artefact, fileBase)
      fs.writeFileSync(mdPath, md)
      console.log(`  ✓ Wrote ${fileBase}.md`)

      expect(record).toBeDefined()
      expect(artefact).toBeDefined()
    })
  }

  it('simulates human review workflow on board scenario', async () => {
    const boardRecord = records.find(r => r.scenario.includes('Board Decision'))
    expect(boardRecord).toBeDefined()

    if (boardRecord) {
      // Simulate review
      engine.reviewDossier(boardRecord, 'approve', 'founder@abraham.com', 'Approved after review. NED objections properly documented.')
      expect(boardRecord.status).toBe('approved')
      expect(boardRecord.reviewEvents.length).toBeGreaterThanOrEqual(2)

      // Simulate delivery
      engine.deliverDossier(boardRecord, 'admin@abraham.com')
      expect(boardRecord.status).toBe('delivered')
      expect(boardRecord.reviewEvents.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('simulates human review workflow on strategic scenario', async () => {
    const strategicRecord = records.find(r => r.scenario.includes('Strategic'))
    expect(strategicRecord).toBeDefined()

    if (strategicRecord) {
      engine.reviewDossier(strategicRecord, 'amend', 'founder@abraham.com', 'Added IP risk clarification.', { forbiddenActionsAdded: true })
      expect(strategicRecord.status).toBe('amended')

      engine.reviewDossier(strategicRecord, 'approve', 'founder@abraham.com', 'Approved with amendments.')
      expect(strategicRecord.status).toBe('approved')

      engine.deliverDossier(strategicRecord, 'admin@abraham.com')
      expect(strategicRecord.status).toBe('delivered')
    }
  })

  it('simulates human review workflow on reputational scenario', async () => {
    const reputationalRecord = records.find(r => r.scenario.includes('Reputational'))
    expect(reputationalRecord).toBeDefined()

    if (reputationalRecord) {
      engine.reviewDossier(reputationalRecord, 'approve', 'founder@abraham.com', 'Legal hold correctly identified. Approved for delivery.')
      expect(reputationalRecord.status).toBe('approved')

      engine.deliverDossier(reputationalRecord, 'admin@abraham.com')
      expect(reputationalRecord.status).toBe('delivered')
    }
  })

  it('blocks low-stakes from paid dossier generation', async () => {
    const lowStakesRecord = records.find(r => r.scenario.includes('Low-Stakes'))
    expect(lowStakesRecord).toBeDefined()

    if (lowStakesRecord) {
      // Low-stakes should either be blocked or downgraded to free_signal
      const isCorrectlyHandled = !lowStakesRecord.deliverable ||
        lowStakesRecord.dossierTier === 'free_signal' ||
        lowStakesRecord.blockReasons.length > 0
      expect(isCorrectlyHandled).toBe(true)
    }
  })

  it('records append-only events for all review actions', async () => {
    for (const record of records) {
      expect(record.reviewEvents.length).toBeGreaterThanOrEqual(1)
      for (const event of record.reviewEvents) {
        expect(event.timestamp).toBeDefined()
        expect(event.actorId).toBeDefined()
        expect(event.notes).toBeDefined()
      }
    }
  })

  afterAll(() => {
    // Generate summary
    const summaryPath = path.join(OUTPUT_DIR, 'summary.md')
    const summary = generateSummary(records)
    fs.writeFileSync(summaryPath, summary)
    console.log('  ✓ Wrote summary.md')

    // Print summary
    console.log('\n=== PAID DOSSIER FULFILMENT PROOF ===')
    const deliverable = records.filter(r => r.deliverable)
    const blocked = records.filter(r => !r.deliverable)
    console.log(`Total: ${records.length}`)
    console.log(`Deliverable: ${deliverable.length}`)
    console.log(`Blocked: ${blocked.length}`)
    for (const r of blocked) {
      console.log(`  ✗ ${r.scenario}: ${r.blockReasons.join('; ')}`)
    }
    console.log('=====================================')
  })
})

function generateFulfilmentMarkdown(
  record: FulfilmentRecord,
  artefact: any,
  fileBase: string,
): string {
  return `# ${record.scenario}

**Case:** ${record.caseReference}
**Status:** ${record.status}
**Deliverable:** ${record.deliverable ? 'Yes' : 'No'}
**Embarrassment Risk:** ${record.embarrassmentRisk}

---

## Fulfilment Record

| Metric | Value |
|---|---|
| Dossier Tier | ${record.dossierTier || 'N/A'} |
| Quality Failures | ${record.qualityFailures.length > 0 ? record.qualityFailures.join(', ') : 'None'} |
| Human Review State | ${record.humanReviewState} |
| Human Review Tier | ${record.humanReviewTier || 'N/A'} |
| Self-Adversarial | ${record.selfAdversarialPresent ? 'Present' : 'Missing'} |
| Regulated Boundary | ${record.regulatedBoundaryHit ? 'Hit' : 'Not hit'} |
| Forbidden Actions | ${record.forbiddenActionsCount} |
| MVP Steps | ${record.minimumViablePathSteps} |
| Evidence Nodes | ${record.evidenceCount} |
| Authority Entries | ${record.authorityCount} |
| Obligation Entries | ${record.obligationCount} |
| Constraints | ${record.constraintCount} |
| Adversarial Challenges | ${record.adversarialCount} |
| Block Reasons | ${record.blockReasons.length > 0 ? record.blockReasons.join('; ') : 'None'} |

## Review Events

${record.reviewEvents.map(e => `- **${e.eventType}** (${e.actorId}): ${e.notes}`).join('\n')}

## Delivery-Ready Artefact

### Classification
- **Primary:** ${artefact.classification.primaryClass}
- **Confidence:** ${artefact.classification.confidence}
- **Alternatives:** ${artefact.classification.alternativeClasses.map((a: any) => `${a.decisionClass} (${a.confidence})`).join(', ') || 'None'}

### Situation
${artefact.situationSummary}

### Authority
${artefact.authoritySummary}

### Obligation
${artefact.obligationSummary}

### Constraints
${artefact.constraintSummary}

### Evidence
${artefact.evidenceSummary}

### Adversarial Challenges
${artefact.adversarialChallenges.length > 0 ? artefact.adversarialChallenges.map((c: any) => `- ${c.contradiction} (${c.severity})`).join('\n') : '*None*'}

### Self-Adversarial Challenge
${artefact.selfAdversarialChallenge ? `**Assumptions:** ${artefact.selfAdversarialChallenge.loadBearingAssumptions.length} identified\n**Gaps:** ${artefact.selfAdversarialChallenge.informationGaps.length} identified` : '*Not generated*'}

### Regulated Boundary
**Hit:** ${artefact.regulatedBoundary.hit}
**Type:** ${artefact.regulatedBoundary.type || 'N/A'}
**Professional Brief:** ${artefact.regulatedBoundary.professionalBrief ? 'Generated' : 'Not generated'}

### Minimum Viable Path
${artefact.minimumViablePath.length > 0 ? artefact.minimumViablePath.map((m: any) => `${m.order}. [${m.urgency}] ${m.action}`).join('\n') : '*None*'}

### Forbidden Actions
${artefact.forbiddenActions.length > 0 ? artefact.forbiddenActions.map((f: any) => `- [${f.severity}] ${f.action}`).join('\n') : '*None*'}

### What Must Not Be Delayed
${artefact.whatMustNotBeDelayed.length > 0 ? artefact.whatMustNotBeDelayed.map((w: string) => `- ${w}`).join('\n') : '*None*'}

### Quality Verdict
**${artefact.qualityVerdict}** — ${artefact.qualityFailures.length > 0 ? artefact.qualityFailures.join('; ') : 'All checks passed'}

### Admin Notes
${artefact._adminNotes.length > 0 ? artefact._adminNotes.map((n: string) => `- ${n}`).join('\n') : '*None*'}
`
}

function generateSummary(records: FulfilmentRecord[]): string {
  const total = records.length
  const deliverable = records.filter(r => r.deliverable)
  const blocked = records.filter(r => !r.deliverable)
  const approved = records.filter(r => r.status === 'approved' || r.status === 'delivered')
  const needsReview = records.filter(r => r.humanReviewState !== 'not_required' && r.humanReviewState !== 'completed')

  let readiness = 'NOT_READY'
  if (blocked.length === 0 && deliverable.length === total) {
    readiness = 'READY_FOR_CHECKOUT_REWIRE'
  } else if (deliverable.length >= total * 0.75) {
    readiness = 'INTERNAL_ONLY'
  }

  return `# Paid Dossier Fulfilment Proof — Summary

**Generated:** ${new Date().toISOString().split('T')[0]}
**Kernel Version:** 1.0.0
**Contract Version:** 1.0.0

## Overview

| Metric | Value |
|---|---|
| Total cases | ${total} |
| Deliverable | ${deliverable.length} |
| Blocked | ${blocked.length} |
| Approved / Delivered | ${approved.length} |
| Human review required | ${needsReview.length} |
| Readiness verdict | ${readiness} |

## Case Results

| Scenario | Status | Deliverable | Embarrassment | Block Reasons |
|---|---|---|---|---|
${records.map(r => `| ${r.scenario} | ${r.status} | ${r.deliverable ? 'Yes' : 'No'} | ${r.embarrassmentRisk} | ${r.blockReasons.length > 0 ? r.blockReasons.join('; ') : 'None'} |`).join('\n')}

## Blocked Cases

${blocked.length > 0 ? blocked.map(r => `### ${r.scenario}\n- Reasons: ${r.blockReasons.join('; ')}\n- Embarrassment: ${r.embarrassmentRisk}`).join('\n\n') : '*None — all cases deliverable*'}

## Human Review Summary

${needsReview.length > 0 ? needsReview.map(r => `- ${r.scenario}: ${r.humanReviewState} (${r.humanReviewTier || 'standard'})`).join('\n') : '*No human review required for any case*'}

## Verdict

**${readiness}**

${readiness === 'NOT_READY'
  ? 'The admin fulfilment workflow is not ready. Blocked cases must be resolved before checkout can be considered.'
  : readiness === 'INTERNAL_ONLY'
    ? 'The admin fulfilment workflow works for most cases but some are blocked. Usable for internal testing but not for checkout.'
    : 'All cases are deliverable. The admin fulfilment workflow is ready for checkout rewiring.'}

## Next Steps

1. ${readiness === 'NOT_READY' ? 'Resolve blocked cases' : 'Proceed to checkout entitlement wiring'}
2. Wire admin UI to fulfilment engine
3. Add delivery notification
4. Only then enable payment
`
}
