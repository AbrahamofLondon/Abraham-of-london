/**
 * lib/intelligence/tiered-disclosure.ts — Tiered Disclosure Engine
 *
 * Renders a Living Decision Case at the appropriate disclosure tier.
 * Each tier shows and withholds specific sections.
 *
 * Tiers:
 * - FREE_SIGNAL: Proves perception, not full answer
 * - BASIC_BRIEF: Short failure map + minimum viable move
 * - FULL_DOSSIER: Complete analysis with all maps
 * - URGENT_OPERATIONAL: Full dossier + 24-48h sequence
 * - EXECUTIVE_BOARD: Board-ready summary + options comparison
 * - RETAINED_CONTINUITY: Full + drift tracking + outcome follow-up
 */

import type {
  LivingDecisionCase,
  DisclosureOutput,
  DisclosureSection,
  DisclosureTier,
  OutputQuality,
} from './types'

export class TieredDisclosure {
  /**
   * Render a Living Decision Case at the requested tier.
   * If the requested tier exceeds current entitlement, falls back to current tier.
   */
  render(livingCase: LivingDecisionCase, requestedTier: string): DisclosureOutput {
    const allowedTier = this.resolveAllowedTier(livingCase, requestedTier)

    switch (allowedTier) {
      case 'free_signal':
        return this.renderFreeSignal(livingCase)
      case 'basic_brief':
        return this.renderBasicBrief(livingCase)
      case 'full_dossier':
        return this.renderFullDossier(livingCase)
      case 'urgent_operational':
        return this.renderUrgentOperational(livingCase)
      case 'executive_board':
        return this.renderExecutiveBoard(livingCase)
      case 'retained_continuity':
        return this.renderRetainedContinuity(livingCase)
      default:
        return this.renderFreeSignal(livingCase)
    }
  }

  /**
   * Resolve the allowed tier based on entitlement.
   */
  private resolveAllowedTier(livingCase: LivingDecisionCase, requested: string): DisclosureTier {
    const tiers: DisclosureTier[] = [
      'free_signal',
      'basic_brief',
      'full_dossier',
      'urgent_operational',
      'executive_board',
      'retained_continuity',
    ]
    const requestedIndex = tiers.indexOf(requested as DisclosureTier)
    const currentIndex = tiers.indexOf(livingCase.disclosure.currentTier)

    if (requestedIndex > currentIndex) return livingCase.disclosure.currentTier
    return requested as DisclosureTier
  }

  /**
   * Free Signal — proves perception, not full answer.
   */
  private renderFreeSignal(livingCase: LivingDecisionCase): DisclosureOutput {
    return {
      tier: 'free_signal',
      sections: [
        {
          id: 'situation_class',
          label: 'Situation Class',
          content: livingCase.classification?.primaryClass || 'Unclassified',
          type: 'badge',
        },
        {
          id: 'what_the_system_saw',
          label: 'What the System Saw',
          content: livingCase.situationModel?.institutionalInterpretation || 'Analysis in progress',
          type: 'prose',
        },
        {
          id: 'primary_failure_point',
          label: 'Primary Failure Point',
          content: this.extractPrimaryFailurePoint(livingCase),
          type: 'prose',
        },
        {
          id: 'governing_tension',
          label: 'Governing Tension',
          content: livingCase.situationModel?.coreTension || 'Unable to determine',
          type: 'prose',
        },
        {
          id: 'consequence_class',
          label: 'Consequence Class',
          content: this.assessConsequenceClass(livingCase),
          type: 'badge',
        },
        {
          id: 'what_full_analysis_maps',
          label: 'What the Full Analysis Maps',
          content: this.describeFullAnalysis(livingCase),
          type: 'list',
        },
        {
          id: 'direction_of_minimum_viable_move',
          label: 'Direction of Minimum Viable Move',
          content: this.directionOfMove(livingCase),
          type: 'prose',
        },
      ],
      quality: this.assessOutputQuality(livingCase),
    }
  }

  /**
   * Basic Brief — short failure map + minimum viable move.
   */
  private renderBasicBrief(livingCase: LivingDecisionCase): DisclosureOutput {
    return {
      tier: 'basic_brief',
      sections: [
        {
          id: 'situation_class',
          label: 'Situation Class',
          content: livingCase.classification?.primaryClass || 'Unclassified',
          type: 'badge',
        },
        {
          id: 'short_failure_map',
          label: 'Short Failure Map',
          content: this.renderFailureMap(livingCase),
          type: 'structured',
        },
        {
          id: 'primary_and_secondary_failure',
          label: 'Primary & Secondary Failure',
          content: this.renderPrimarySecondaryFailure(livingCase),
          type: 'structured',
        },
        {
          id: 'minimum_viable_move',
          label: 'Minimum Viable Move',
          content: livingCase.minimumViablePath[0]?.description || 'Unable to determine',
          type: 'action',
        },
        {
          id: 'short_fallback',
          label: 'Short Fallback',
          content: livingCase.minimumViablePath[1]?.description || 'No fallback identified',
          type: 'action',
        },
        {
          id: 'what_not_to_do',
          label: 'What Not to Do',
          content: livingCase.forbiddenActions.map(f => f.action),
          type: 'list',
        },
      ],
      quality: this.assessOutputQuality(livingCase),
    }
  }

  /**
   * Full Dossier — complete analysis with all maps.
   */
  private renderFullDossier(livingCase: LivingDecisionCase): DisclosureOutput {
    const sections: DisclosureSection[] = [
      {
        id: 'authority_map',
        label: 'Authority Map',
        content: livingCase.authorityMap,
        type: 'structured',
      },
      {
        id: 'obligation_map',
        label: 'Obligation Map',
        content: livingCase.obligationMap,
        type: 'structured',
      },
      {
        id: 'constraint_graph',
        label: 'Constraint Graph',
        content: livingCase.constraintGraph,
        type: 'structured',
      },
      {
        id: 'evidence_graph',
        label: 'Evidence Graph',
        content: livingCase.evidenceGraph,
        type: 'structured',
      },
      {
        id: 'adversarial_challenge',
        label: 'Adversarial Challenge',
        content: livingCase.adversarialChallenge,
        type: 'structured',
      },
      {
        id: 'minimum_viable_path',
        label: 'Minimum Viable Path',
        content: livingCase.minimumViablePath,
        type: 'ordered_actions',
      },
      {
        id: 'forbidden_actions',
        label: 'Forbidden Actions',
        content: livingCase.forbiddenActions,
        type: 'list',
      },
      {
        id: 'fallback_path',
        label: 'Fallback Path',
        content: livingCase.minimumViablePath.slice(1),
        type: 'ordered_actions',
      },
      {
        id: 'what_must_not_be_delayed',
        label: 'What Must Not Be Delayed',
        content: livingCase.whatMustNotBeDelayed,
        type: 'list',
      },
      {
        id: 'record_reference',
        label: 'Record Reference',
        content: {
          caseReference: livingCase.caseReference,
          kernelVersion: livingCase.kernelVersion,
          ontologyVersion: livingCase.ontologyVersion,
          generatedAt: new Date().toISOString(),
        },
        type: 'metadata',
      },
    ]

    // Add self-adversarial challenge if present
    if (livingCase.selfAdversarialChallenge) {
      sections.splice(5, 0, {
        id: 'self_adversarial_challenge',
        label: 'Self-Adversarial Challenge',
        content: livingCase.selfAdversarialChallenge,
        type: 'structured',
      })
    }

    // Add regulated boundary output if hit
    if (livingCase.regulatedBoundary?.output) {
      sections.push({
        id: 'regulated_boundary',
        label: 'Regulated Boundary',
        content: livingCase.regulatedBoundary.output,
        type: 'structured',
      })
    }

    return {
      tier: 'full_dossier',
      sections,
      quality: this.assessOutputQuality(livingCase),
    }
  }

  /**
   * Urgent Operational — full dossier + 24-48h sequence.
   */
  private renderUrgentOperational(livingCase: LivingDecisionCase): DisclosureOutput {
    const base = this.renderFullDossier(livingCase)
    base.tier = 'urgent_operational'
    base.sections.unshift(
      {
        id: 'urgent_sequence',
        label: '24–48 Hour Sequence',
        content: this.generateUrgentSequence(livingCase),
        type: 'ordered_actions',
      },
      {
        id: 'triage_priority',
        label: 'Triage Priority',
        content: this.determineTriagePriority(livingCase),
        type: 'badge',
      },
      {
        id: 'escalation_triggers',
        label: 'Escalation Triggers',
        content: this.identifyEscalationTriggers(livingCase),
        type: 'list',
      },
    )
    return base
  }

  /**
   * Executive Board — board-ready summary + options comparison.
   */
  private renderExecutiveBoard(livingCase: LivingDecisionCase): DisclosureOutput {
    const base = this.renderFullDossier(livingCase)
    base.tier = 'executive_board'
    base.sections.unshift(
      {
        id: 'board_ready_summary',
        label: 'Board-Ready Summary',
        content: this.generateBoardSummary(livingCase),
        type: 'prose',
      },
      {
        id: 'actor_and_authority_map',
        label: 'Actor & Authority Map',
        content: { actors: livingCase.actorMap, authorities: livingCase.authorityMap },
        type: 'structured',
      },
      {
        id: 'options_comparison',
        label: 'Options Comparison',
        content: this.generateOptionsComparison(livingCase),
        type: 'table',
      },
      {
        id: 'decision_conditions',
        label: 'Decision Conditions',
        content: this.generateDecisionConditions(livingCase),
        type: 'structured',
      },
    )
    return base
  }

  /**
   * Retained Continuity — full + drift tracking + outcome follow-up.
   */
  private renderRetainedContinuity(livingCase: LivingDecisionCase): DisclosureOutput {
    const base = this.renderExecutiveBoard(livingCase)
    base.tier = 'retained_continuity'
    base.sections.push(
      {
        id: 'drift_tracking',
        label: 'Case Drift Tracking',
        content: this.assessDrift(livingCase),
        type: 'structured',
      },
      {
        id: 'outcome_follow_up',
        label: 'Outcome Follow-Up',
        content: livingCase.outcome || { outcomeType: 'pending_follow_up' },
        type: 'structured',
      },
      {
        id: 'next_review',
        label: 'Next Scheduled Review',
        content: this.scheduleNextReview(livingCase),
        type: 'metadata',
      },
    )
    return base
  }

  // ─── Helper Methods ─────────────────────────────────────────────────────

  private extractPrimaryFailurePoint(livingCase: LivingDecisionCase): string {
    const highSeverityEvidence = livingCase.evidenceGraph.filter(
      e => e.severity === 'HIGH' || e.severity === 'CRITICAL'
    )
    if (highSeverityEvidence.length > 0) return highSeverityEvidence[0]?.summary ?? 'High-severity evidence detected'
    if (livingCase.constraintGraph.length > 0)
      return `Constraint: ${livingCase.constraintGraph[0]?.description ?? 'active constraint'}`
    return 'Primary failure point requires deeper analysis'
  }

  private assessConsequenceClass(livingCase: LivingDecisionCase): string {
    const severities = livingCase.evidenceGraph.map(e => e.severity)
    if (severities.includes('CRITICAL')) return 'CRITICAL'
    if (severities.includes('HIGH')) return 'HIGH'
    if (severities.includes('MEDIUM')) return 'MEDIUM'
    return 'LOW'
  }

  private describeFullAnalysis(livingCase: LivingDecisionCase): string[] {
    const items: string[] = []
    if (livingCase.authorityMap.length > 0) items.push('Authority structure')
    if (livingCase.obligationMap.length > 0) items.push('Obligation landscape')
    if (livingCase.constraintGraph.length > 0) items.push('Constraint graph')
    if (livingCase.evidenceGraph.length > 0) items.push('Evidence graph')
    if (livingCase.adversarialChallenge.length > 0) items.push('Adversarial challenge')
    if (livingCase.selfAdversarialChallenge) items.push('Self-adversarial challenge')
    return items.length > 0 ? items : ['Full analysis requires entitlement upgrade']
  }

  private directionOfMove(livingCase: LivingDecisionCase): string {
    if (livingCase.minimumViablePath.length > 0) {
      return livingCase.minimumViablePath[0]?.description ?? 'Direction requires case analysis'
    }
    return 'Direction depends on resolving authority, obligation, or constraint ambiguity'
  }

  private renderFailureMap(livingCase: LivingDecisionCase): Record<string, unknown> {
    return {
      primaryFailure: this.extractPrimaryFailurePoint(livingCase),
      evidenceCount: livingCase.evidenceGraph.length,
      constraintCount: livingCase.constraintGraph.length,
      contradictionCount: livingCase.adversarialChallenge.length,
    }
  }

  private renderPrimarySecondaryFailure(livingCase: LivingDecisionCase): Record<string, unknown> {
    const sorted = [...livingCase.evidenceGraph].sort((a, b) => {
      const severityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    })
    return {
      primary: sorted[0]?.summary || 'Unknown',
      secondary: sorted[1]?.summary || 'None identified',
    }
  }

  private generateUrgentSequence(livingCase: LivingDecisionCase): Array<Record<string, unknown>> {
    return livingCase.minimumViablePath.slice(0, 4).map((move, i) => ({
      order: i + 1,
      description: move.description,
      timeframe: i === 0 ? 'Next 24 hours' : i === 1 ? 'Next 48 hours' : 'This week',
    }))
  }

  private determineTriagePriority(livingCase: LivingDecisionCase): string {
    const hasCriticalConstraint = livingCase.constraintGraph.some(c => c.severity === 'CRITICAL')
    const hasCriticalEvidence = livingCase.evidenceGraph.some(e => e.severity === 'CRITICAL')
    if (hasCriticalConstraint || hasCriticalEvidence) return 'CRITICAL — Immediate attention required'
    return 'HIGH — Address within 48 hours'
  }

  private identifyEscalationTriggers(livingCase: LivingDecisionCase): string[] {
    const triggers: string[] = []
    if (livingCase.regulatedBoundary?.hit) triggers.push('Regulated boundary identified')
    if (livingCase.review?.state !== 'not_required') triggers.push('Human review threshold met')
    if (livingCase.constraintGraph.some(c => c.severity === 'CRITICAL'))
      triggers.push('Critical constraint identified')
    return triggers
  }

  private generateBoardSummary(livingCase: LivingDecisionCase): string {
    return [
      `Decision Class: ${livingCase.classification?.primaryClass || 'Unclassified'}`,
      `Core Tension: ${livingCase.situationModel?.coreTension || 'Unknown'}`,
      `Authority: ${livingCase.authorityMap.length > 0 ? 'Mapped' : 'Unclear — requires clarification'}`,
      `Obligations: ${livingCase.obligationMap.length > 0 ? `${livingCase.obligationMap.length} identified` : 'None identified'}`,
      `Constraints: ${livingCase.constraintGraph.length > 0 ? `${livingCase.constraintGraph.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').length} critical` : 'None identified'}`,
      `Recommended Path: ${livingCase.minimumViablePath[0]?.description || 'Unable to determine'}`,
    ].join('\n')
  }

  private generateOptionsComparison(livingCase: LivingDecisionCase): Array<Record<string, unknown>> {
    return livingCase.options.map(o => ({
      option: o.label,
      advantage: o.advantage,
      risk: o.risk,
      constraint: o.constraint,
      recommended: o.recommended,
    }))
  }

  private generateDecisionConditions(livingCase: LivingDecisionCase): Record<string, unknown> {
    return {
      mustBeTrue: livingCase.minimumViablePath.map(m => m.description),
      mustNotHappen: livingCase.forbiddenActions.map(f => f.action),
      timing: livingCase.whatMustNotBeDelayed,
      reviewRequired: livingCase.review?.state !== 'not_required',
    }
  }

  private assessDrift(livingCase: LivingDecisionCase): Record<string, unknown> {
    return {
      originalPath: livingCase.minimumViablePath[0]?.description,
      currentState: livingCase.caseStatus,
      driftDetected: false,
      lastUpdated: livingCase.updatedAt,
    }
  }

  private scheduleNextReview(livingCase: LivingDecisionCase): Record<string, string> {
    return {
      recommendedCadence:
        livingCase.classification?.primaryClass === 'CONTINUITY_AND_TRANSITION'
          ? 'weekly'
          : 'monthly',
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
    }
  }

  private assessOutputQuality(livingCase: LivingDecisionCase): OutputQuality {
    return {
      genericOutputDetected: this.isGeneric(livingCase),
      missingAuthorityMap: livingCase.authorityMap.length === 0,
      missingObligationMap: livingCase.obligationMap.length === 0,
      missingEvidenceGraph: livingCase.evidenceGraph.length === 0,
      missingAdversarialChallenge: livingCase.adversarialChallenge.length === 0,
      missingMinimumViablePath: livingCase.minimumViablePath.length === 0,
      selfAdversarialPresent: livingCase.selfAdversarialChallenge !== null,
      humanReviewAssessed:
        livingCase.review?.state !== 'not_required' || livingCase.review?.state === 'not_required',
      regulatedBoundaryRespected:
        !livingCase.regulatedBoundary?.hit || livingCase.regulatedBoundary?.type !== undefined,
    }
  }

  private isGeneric(livingCase: LivingDecisionCase): boolean {
    if (livingCase.evidenceGraph.length === 0) return true
    if (livingCase.authorityMap.length === 0 && livingCase.obligationMap.length === 0) return true
    if (livingCase.minimumViablePath.length === 0) return true
    return false
  }
}
