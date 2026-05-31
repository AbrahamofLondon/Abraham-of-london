/**
 * lib/intelligence/admin-fulfilment.ts — Admin Dossier Fulfilment Workflow
 *
 * Internal/admin-only Full Dossier generation, review, and delivery.
 * No checkout. No payment. No public access.
 *
 * This is the delivery room before the till.
 */

import type {
  LivingDecisionCase,
  DisclosureOutput,
  DisclosureTier,
  LivingCaseEventType,
} from './types'
import { DecisionIntelligenceKernel } from './decision-intelligence-kernel'
import { TieredDisclosure } from './tiered-disclosure'
import { KernelQualityGates } from './kernel-quality-gates'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FulfilmentStatus =
  | 'dossier_generated'
  | 'quality_failed'
  | 'pending_review'
  | 'in_review'
  | 'amended'
  | 'approved'
  | 'rejected'
  | 'delivered'

export interface FulfilmentRecord {
  caseId: string
  caseReference: string
  scenario: string
  status: FulfilmentStatus
  dossierTier: DisclosureTier | null
  qualityFailures: string[]
  embarrassmentRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  humanReviewState: string
  humanReviewTier: string | null
  selfAdversarialPresent: boolean
  regulatedBoundaryHit: boolean
  forbiddenActionsCount: number
  minimumViablePathSteps: number
  evidenceCount: number
  authorityCount: number
  obligationCount: number
  constraintCount: number
  adversarialCount: number
  reviewEvents: FulfilmentEvent[]
  deliverable: boolean
  blockReasons: string[]
  generatedAt: string
}

export interface FulfilmentEvent {
  eventType: LivingCaseEventType | 'FULFILMENT_GENERATED' | 'FULFILMENT_REVIEWED' | 'FULFILMENT_AMENDED' | 'FULFILMENT_APPROVED' | 'FULFILMENT_REJECTED' | 'FULFILMENT_DELIVERED'
  timestamp: string
  actorId: string
  notes: string
  payload?: Record<string, unknown>
}

export interface DossierArtefact {
  caseReference: string
  generatedAt: string
  kernelVersion: string
  contractVersion: string
  classification: {
    primaryClass: string
    alternativeClasses: Array<{ decisionClass: string; confidence: string; reason: string }>
    confidence: string
  }
  situationSummary: string
  authoritySummary: string
  obligationSummary: string
  constraintSummary: string
  evidenceSummary: string
  adversarialChallenges: Array<{ id: string; contradiction: string; severity: string }>
  selfAdversarialChallenge: {
    loadBearingAssumptions: Array<{ assumption: string; ifWrong: string }>
    informationGaps: Array<{ gap: string; impact: string }>
  } | null
  regulatedBoundary: {
    hit: boolean
    type: string | null
    professionalBrief: {
      suggestedProfession: string
      whatToBring: string[]
      questionsToAsk: string[]
    } | null
  }
  minimumViablePath: Array<{ order: number; action: string; urgency: string }>
  forbiddenActions: Array<{ action: string; severity: string }>
  whatMustNotBeDelayed: string[]
  humanReviewState: string
  humanReviewTier: string | null
  qualityVerdict: 'PASS' | 'FAIL'
  qualityFailures: string[]
  // Admin-only: not for public exposure
  _adminNotes: string[]
}

// ─── Fulfilment Engine ───────────────────────────────────────────────────────

export class AdminFulfilmentEngine {
  private kernel: DecisionIntelligenceKernel
  private disclosure: TieredDisclosure
  private qualityGates: KernelQualityGates

  constructor() {
    this.kernel = new DecisionIntelligenceKernel()
    this.disclosure = new TieredDisclosure()
    this.qualityGates = new KernelQualityGates()
  }

  /**
   * Generate a Full Dossier for admin/internal fulfilment.
   * Returns a FulfilmentRecord with quality assessment and block reasons.
   */
  async generateDossier(
    scenarioInput: string,
    scenarioName: string,
    clarifications?: Record<string, string>,
  ): Promise<FulfilmentRecord> {
    const caseId = `fulfilment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const caseReference = `FULFIL-${caseId.substring(11, 19).toUpperCase()}`

    const result = await this.kernel.process({
      caseId,
      caseReference,
      rawScenario: scenarioInput,
      aperture: 'paid_full_dossier',
      requestedTier: 'full_dossier',
      clarifications: clarifications || { authority: 'Authority is established', obligation: 'Obligations are known' },
    })

    const lc = result.livingCase
    const events: FulfilmentEvent[] = []

    events.push({
      eventType: 'FULFILMENT_GENERATED',
      timestamp: new Date().toISOString(),
      actorId: 'system',
      notes: `Dossier generated for: ${scenarioName}`,
      payload: { status: result.status, qualityFailures: result.qualityFailures },
    })

    // Determine deliverability
    const blockReasons: string[] = []
    let embarrassmentRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (result.status !== 'COMPLETED') {
      blockReasons.push(`Kernel status: ${result.status}`)
      embarrassmentRisk = 'HIGH'
    }
    if (result.qualityFailures && result.qualityFailures.length > 0) {
      blockReasons.push(`Quality failures: ${result.qualityFailures.join(', ')}`)
      embarrassmentRisk = 'HIGH'
    }
    if (lc && !lc.selfAdversarialChallenge && lc.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
      blockReasons.push('Self-adversarial challenge missing')
      if (embarrassmentRisk !== 'HIGH') embarrassmentRisk = 'MEDIUM'
    }
    if (lc && lc.regulatedBoundary?.hit && !lc.regulatedBoundary?.output) {
      blockReasons.push('Regulated boundary crossed without professional brief')
      embarrassmentRisk = 'HIGH'
    }
    if (lc && lc.forbiddenActions.length === 0 && lc.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
      blockReasons.push('No forbidden actions for non-trivial case')
      if (embarrassmentRisk !== 'HIGH') embarrassmentRisk = 'MEDIUM'
    }
    if (lc && lc.minimumViablePath.length === 0 && lc.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
      blockReasons.push('No minimum viable path')
      embarrassmentRisk = 'HIGH'
    }
    if (lc && lc.classification?.primaryClass === 'LOW_STAKES_PREFERENCE' && result.output?.tier !== 'free_signal') {
      blockReasons.push('Low-stakes case should not generate paid dossier')
      embarrassmentRisk = 'HIGH'
    }

    const deliverable = blockReasons.length === 0

    return {
      caseId,
      caseReference,
      scenario: scenarioName,
      status: result.status === 'COMPLETED' ? (deliverable ? 'dossier_generated' : 'quality_failed') : 'quality_failed',
      dossierTier: result.output?.tier || null,
      qualityFailures: result.qualityFailures || [],
      embarrassmentRisk,
      humanReviewState: lc?.review?.state || 'not_required',
      humanReviewTier: lc?.review?.tier || null,
      selfAdversarialPresent: lc?.selfAdversarialChallenge != null,
      regulatedBoundaryHit: lc?.regulatedBoundary?.hit || false,
      forbiddenActionsCount: lc?.forbiddenActions?.length || 0,
      minimumViablePathSteps: lc?.minimumViablePath?.length || 0,
      evidenceCount: lc?.evidenceGraph?.length || 0,
      authorityCount: lc?.authorityMap?.length || 0,
      obligationCount: lc?.obligationMap?.length || 0,
      constraintCount: lc?.constraintGraph?.length || 0,
      adversarialCount: lc?.adversarialChallenge?.length || 0,
      reviewEvents: events,
      deliverable,
      blockReasons,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Simulate a human review action on a fulfilment record.
   */
  reviewDossier(
    record: FulfilmentRecord,
    action: 'approve' | 'amend' | 'reject' | 'return',
    actorId: string,
    notes: string,
    amendments?: Record<string, unknown>,
  ): FulfilmentRecord {
    const event: FulfilmentEvent = {
      eventType: action === 'approve' ? 'FULFILMENT_APPROVED'
        : action === 'amend' ? 'FULFILMENT_AMENDED'
        : action === 'reject' ? 'FULFILMENT_REJECTED'
        : 'FULFILMENT_REVIEWED',
      timestamp: new Date().toISOString(),
      actorId,
      notes,
      payload: amendments,
    }

    record.reviewEvents.push(event)

    switch (action) {
      case 'approve':
        record.status = 'approved'
        break
      case 'amend':
        record.status = 'amended'
        // Clear block reasons if amendments address them
        if (amendments?.forbiddenActionsAdded) {
          record.blockReasons = record.blockReasons.filter(r => !r.includes('forbidden actions'))
        }
        break
      case 'reject':
        record.status = 'rejected'
        break
      case 'return':
        record.status = 'pending_review'
        break
    }

    return record
  }

  /**
   * Mark a dossier as delivered.
   */
  deliverDossier(record: FulfilmentRecord, actorId: string): FulfilmentRecord {
    record.status = 'delivered'
    record.reviewEvents.push({
      eventType: 'FULFILMENT_DELIVERED',
      timestamp: new Date().toISOString(),
      actorId,
      notes: 'Dossier delivered to internal fulfilment queue',
    })
    return record
  }

  /**
   * Generate a clean delivery-ready dossier artefact.
   * No raw internal debug fields. No regulated advice overclaim.
   */
  generateArtefact(
    record: FulfilmentRecord,
    livingCase?: LivingDecisionCase,
    output?: DisclosureOutput | null,
  ): DossierArtefact {
    const adminNotes: string[] = []

    if (record.blockReasons.length > 0) {
      adminNotes.push(`BLOCKED: ${record.blockReasons.join('; ')}`)
    }
    if (record.embarrassmentRisk === 'HIGH') {
      adminNotes.push('HIGH embarrassment risk — do not deliver without founder review')
    }
    if (record.humanReviewState !== 'not_required' && record.humanReviewState !== 'completed') {
      adminNotes.push(`Human review required: ${record.humanReviewState} (${record.humanReviewTier || 'standard'})`)
    }

    return {
      caseReference: record.caseReference,
      generatedAt: record.generatedAt,
      kernelVersion: '1.0.0',
      contractVersion: '1.0.0',
      classification: {
        primaryClass: livingCase?.classification?.primaryClass || 'UNCLASSIFIED',
        alternativeClasses: livingCase?.classification?.alternativeClasses || [],
        confidence: livingCase?.classification?.confidence || 'LOW',
      },
      situationSummary: livingCase?.situationModel?.institutionalInterpretation || '',
      authoritySummary: livingCase?.authorityMap?.length
        ? `${livingCase.authorityMap.length} authority entr${livingCase.authorityMap.length === 1 ? 'y' : 'ies'} mapped`
        : 'Authority structure not fully mapped — see ambiguities',
      obligationSummary: livingCase?.obligationMap?.length
        ? `${livingCase.obligationMap.length} obligation${livingCase.obligationMap.length === 1 ? '' : 's'} identified`
        : 'Obligation landscape not fully mapped — see ambiguities',
      constraintSummary: livingCase?.constraintGraph?.length
        ? `${livingCase.constraintGraph.length} constraint${livingCase.constraintGraph.length === 1 ? '' : 's'} mapped (${livingCase.constraintGraph.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').length} critical/high)`
        : 'No constraints mapped',
      evidenceSummary: livingCase?.evidenceGraph?.length
        ? `${livingCase.evidenceGraph.length} evidence node${livingCase.evidenceGraph.length === 1 ? '' : 's'}`
        : 'No evidence mapped',
      adversarialChallenges: livingCase?.adversarialChallenge?.map(c => ({
        id: c.id,
        contradiction: c.contradiction,
        severity: c.severity,
      })) || [],
      selfAdversarialChallenge: livingCase?.selfAdversarialChallenge
        ? {
            loadBearingAssumptions: livingCase.selfAdversarialChallenge.loadBearingAssumptions.map(a => ({
              assumption: a.assumption,
              ifWrong: a.ifWrong,
            })),
            informationGaps: livingCase.selfAdversarialChallenge.informationGaps.map(g => ({
              gap: g.gap,
              impact: g.impact,
            })),
          }
        : null,
      regulatedBoundary: {
        hit: livingCase?.regulatedBoundary?.hit || false,
        type: livingCase?.regulatedBoundary?.type || null,
        professionalBrief: livingCase?.regulatedBoundary?.output?.professionalBrief
          ? {
              suggestedProfession: livingCase.regulatedBoundary.output.professionalBrief.suggestedProfession,
              whatToBring: livingCase.regulatedBoundary.output.professionalBrief.whatToBring,
              questionsToAsk: livingCase.regulatedBoundary.output.professionalBrief.questionsToAsk,
            }
          : null,
      },
      minimumViablePath: livingCase?.minimumViablePath?.map(m => ({
        order: m.order,
        action: m.action,
        urgency: m.urgency,
      })) || [],
      forbiddenActions: livingCase?.forbiddenActions?.map(f => ({
        action: f.action,
        severity: f.severity,
      })) || [],
      whatMustNotBeDelayed: livingCase?.whatMustNotBeDelayed || [],
      humanReviewState: livingCase?.review?.state || 'not_required',
      humanReviewTier: livingCase?.review?.tier || null,
      qualityVerdict: record.qualityFailures.length === 0 ? 'PASS' : 'FAIL',
      qualityFailures: record.qualityFailures,
      _adminNotes: adminNotes,
    }
  }
}
