/**
 * lib/intelligence/living-decision-case-contract.ts — The Living Decision Case Contract
 *
 * The Living Decision Case is not a generic JSON object.
 * It is a governed institutional record.
 *
 * This file defines the contract version, factory function, and validation.
 */

import type { LivingDecisionCase, SourceAperture, ConsentState, DisclosureTier } from './types'

export const KERNEL_VERSION = '1.0.0'
export const ONTOLOGY_VERSION = '1.0.0'
export const CONTRACT_VERSION = '1.0.0'

/**
 * Create a new empty Living Decision Case.
 * This is the only way to create a case — ensures contract compliance.
 */
export function createLivingDecisionCase(params: {
  id: string
  caseReference: string
  aperture: SourceAperture
  createdBy?: string
  organisationId?: string
  consentState?: ConsentState
}): LivingDecisionCase {
  return {
    id: params.id,
    caseReference: params.caseReference,
    contractVersion: CONTRACT_VERSION,
    kernelVersion: KERNEL_VERSION,
    ontologyVersion: ONTOLOGY_VERSION,

    source: {
      aperture: params.aperture,
      createdBy: params.createdBy,
      organisationId: params.organisationId,
      consentState: params.consentState || 'granted',
    },

    translation: null as any, // Must be set by translator
    classification: null as any, // Must be set by classifier
    situationModel: null as any, // Must be set by translator

    actorMap: [],
    authorityMap: [],
    obligationMap: [],
    evidenceGraph: [],
    constraintGraph: [],
    dependencyMap: [],
    incentiveMap: [],
    consequenceMap: [],
    reversibilityMap: null,
    viabilityMap: null,

    adversarialChallenge: [],
    selfAdversarialChallenge: null,

    options: [],
    minimumViablePath: [],
    forbiddenActions: [],
    whatMustNotBeDelayed: [],
    whatWouldChangeRecommendation: [],

    regulatedBoundary: { hit: false },
    disclosure: { currentTier: 'free_signal' },
    review: { state: 'not_required', tier: null, triggers: [] },
    verification: null,
    continuity: null,
    outcome: null,
    learningTrace: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    caseStatus: 'open',
  }
}

/**
 * Validate that a Living Decision Case is complete enough for a given tier.
 * Returns an array of missing required fields.
 */
export function validateCaseForTier(
  livingCase: LivingDecisionCase,
  tier: DisclosureTier,
): string[] {
  const missing: string[] = []

  // All tiers require these
  if (!livingCase.translation) missing.push('translation')
  if (!livingCase.classification) missing.push('classification')
  if (!livingCase.situationModel) missing.push('situationModel')

  // Basic brief and above
  if (tier !== 'free_signal') {
    if (livingCase.evidenceGraph.length === 0) missing.push('evidenceGraph')
    if (livingCase.constraintGraph.length === 0) missing.push('constraintGraph')
    if (livingCase.adversarialChallenge.length === 0) missing.push('adversarialChallenge')
    if (livingCase.minimumViablePath.length === 0) missing.push('minimumViablePath')
    if (livingCase.forbiddenActions.length === 0) missing.push('forbiddenActions')
  }

  // Full dossier and above
  if (tier === 'full_dossier' || tier === 'urgent_operational' || tier === 'executive_board' || tier === 'retained_continuity') {
    if (livingCase.authorityMap.length === 0) missing.push('authorityMap')
    if (livingCase.obligationMap.length === 0) missing.push('obligationMap')
    if (!livingCase.selfAdversarialChallenge) missing.push('selfAdversarialChallenge')
    if (livingCase.whatMustNotBeDelayed.length === 0) missing.push('whatMustNotBeDelayed')
  }

  // Executive board and above
  if (tier === 'executive_board' || tier === 'retained_continuity') {
    if (livingCase.options.length === 0) missing.push('options')
    if (livingCase.review.state === 'not_required' && livingCase.classification?.primaryClass !== 'LOW_STAKES_PREFERENCE') {
      missing.push('humanReviewAssessment')
    }
  }

  return missing
}

/**
 * Check if a case has been updated since a given timestamp.
 */
export function isCaseUpdatedSince(livingCase: LivingDecisionCase, since: string): boolean {
  if (!livingCase.updatedAt) return false
  return new Date(livingCase.updatedAt).getTime() > new Date(since).getTime()
}

/**
 * Get a human-readable summary of the case.
 */
export function summarizeCase(livingCase: LivingDecisionCase): string {
  const parts: string[] = [
    `Case: ${livingCase.caseReference}`,
    `Class: ${livingCase.classification?.primaryClass || 'Unclassified'}`,
    `Status: ${livingCase.caseStatus || 'open'}`,
    `Tier: ${livingCase.disclosure.currentTier}`,
    `Evidence: ${livingCase.evidenceGraph.length} nodes`,
    `Constraints: ${livingCase.constraintGraph.length} mapped`,
    `Contradictions: ${livingCase.adversarialChallenge.length} detected`,
    `Review: ${livingCase.review.state}`,
  ]

  if (livingCase.regulatedBoundary.hit) {
    parts.push(`Regulated Boundary: ${livingCase.regulatedBoundary.type}`)
  }

  return parts.join(' | ')
}