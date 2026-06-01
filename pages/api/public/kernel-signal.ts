/**
 * pages/api/public/kernel-signal.ts — Public Kernel Signal API
 *
 * The ONLY public API endpoint for the Decision Intelligence Kernel.
 * Accepts raw situation text, returns FREE_SIGNAL disclosure only.
 *
 * No persistence. No admin data. No paid entitlement.
 * No Full Dossier. No self-adversarial challenge. No record reference.
 * No checkout. No Strategy Room escalation as primary CTA.
 *
 * This is the controlled public aperture.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { DecisionIntelligenceKernel } from '@/lib/intelligence/decision-intelligence-kernel'
import { createLivingDecisionCase } from '@/lib/intelligence/living-decision-case-contract'
import { selectAdversarialPreview } from '@/lib/kernel/adversarial-preview'
import type { AdversarialPreview } from '@/lib/kernel/adversarial-preview'
import { extractSafeUserLanguageQuotes } from '@/lib/product/user-language-extraction'
import { runDecisionIntelligence } from '@/lib/intelligence/decision-intelligence-orchestrator'
import type { DecisionIntelligenceResult } from '@/lib/intelligence/decision-intelligence-orchestrator'

const kernel = new DecisionIntelligenceKernel()

export type KernelSignalResponse = {
  caseId: string
  situationClass: string | null
  whatTheSystemSaw: string | null
  primaryFailurePoint: string | null
  governingTension: string | null
  consequenceClass: string | null
  whatFullAnalysisWouldMap: string[]
  directionOfMinimumViableMove: string | null
  boundaryNote: string | null
  reviewNote: string | null
  adversarialPreview: AdversarialPreview | null
  alternativeClasses: Array<{ decisionClass: string; confidence: string; reason: string }> | null
  surfacedDimensions: string[]
  preservedAmbiguities: string[]
  clarificationRequired: boolean
  clarificationQuestions: Array<{ domain: string; question: string }> | null
  userLanguageEvidence?: string[]
  decisionIntelligence?: DecisionIntelligenceResult
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KernelSignalResponse>,
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      caseId: '',
      situationClass: null,
      whatTheSystemSaw: null,
      primaryFailurePoint: null,
      governingTension: null,
      consequenceClass: null,
      whatFullAnalysisWouldMap: [],
      directionOfMinimumViableMove: null,
      boundaryNote: null,
      reviewNote: null,
      adversarialPreview: null,
      alternativeClasses: null,
      surfacedDimensions: [],
      preservedAmbiguities: [],
      clarificationRequired: false,
      clarificationQuestions: null,
      userLanguageEvidence: [],
      decisionIntelligence: undefined,
      error: 'Method not allowed. Use POST.',
    })
    return
  }

  const { situation, clarifications, progressiveEvidence, previousDecisionIntelligence } = req.body as {
    situation?: string
    clarifications?: Record<string, string>
    progressiveEvidence?: { fieldKey: string; answer: string }
    previousDecisionIntelligence?: {
      situationRead?: string
      interpretedIssue?: string
      primaryContradiction?: string | null
      authorityState?: string | null
      evidenceState?: string
      consequenceState?: string | null
      nextAdmissibleMove?: string
      unresolvedItems?: string[]
      confidence?: 'LOW' | 'MEDIUM' | 'HIGH'
    }
  }

  if (!situation || typeof situation !== 'string' || situation.trim().length === 0) {
    res.status(400).json({
      caseId: '',
      situationClass: null,
      whatTheSystemSaw: null,
      primaryFailurePoint: null,
      governingTension: null,
      consequenceClass: null,
      whatFullAnalysisWouldMap: [],
      directionOfMinimumViableMove: null,
      boundaryNote: null,
      reviewNote: null,
      adversarialPreview: null,
      alternativeClasses: null,
      surfacedDimensions: [],
      preservedAmbiguities: [],
      clarificationRequired: false,
      clarificationQuestions: null,
      userLanguageEvidence: [],
      decisionIntelligence: undefined,
      error: 'Situation text is required.',
    })
    return
  }

  try {
    const caseId = `pub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const caseReference = `PUB-${caseId.substring(4, 12).toUpperCase()}`

    const result = await kernel.process({
      caseId,
      caseReference,
      rawScenario: situation.trim(),
      aperture: 'web',
      requestedTier: 'free_signal',
      clarifications: clarifications || undefined,
    })

    // If clarification is required, return the questions
    if (result.status === 'CLARIFICATION_REQUIRED') {
      res.status(200).json({
        caseId,
        situationClass: result.translation?.decisionClass || null,
        whatTheSystemSaw: result.translation?.kernelInterpretation || null,
        primaryFailurePoint: null,
        governingTension: null,
        consequenceClass: null,
        whatFullAnalysisWouldMap: [],
        directionOfMinimumViableMove: null,
        boundaryNote: null,
        reviewNote: null,
        adversarialPreview: null,
        alternativeClasses: null,
        surfacedDimensions: result.translation?.surfacedDimensions || [],
        preservedAmbiguities: result.translation?.preservedAmbiguities || [],
        clarificationRequired: true,
        clarificationQuestions: result.questions?.map(q => ({
          domain: q.domain,
          question: q.question,
        })) || null,
        userLanguageEvidence: extractSafeUserLanguageQuotes([situation.trim()]),
        decisionIntelligence: await runDecisionIntelligence({
          surface: 'fast_diagnostic',
          rawUserInput: situation.trim(),
          persistJourney: true,
          caseId,
          ...(progressiveEvidence ? { progressiveEvidence } : {}),
          ...(previousDecisionIntelligence ? { previousDecisionIntelligence } : {}),
        }),
      })
      return
    }

    // Extract FREE_SIGNAL output only
    const output = result.output
    const livingCase = result.livingCase

    // Select one adversarial challenge for the Free Signal preview
    const adversarialPreview = livingCase ? selectAdversarialPreview(livingCase) : null

    const getSectionContent = (id: string): string | null => {
      const section = output?.sections.find(s => s.id === id)
      if (!section) return null
      if (typeof section.content === 'string') return section.content
      return JSON.stringify(section.content)
    }

    const getSectionList = (id: string): string[] => {
      const section = output?.sections.find(s => s.id === id)
      if (!section) return []
      if (Array.isArray(section.content)) return section.content as string[]
      return []
    }

    // Build boundary/review note
    let boundaryNote: string | null = null
    if (livingCase?.regulatedBoundary?.hit) {
      boundaryNote = `A regulated professional boundary has been identified (${livingCase.regulatedBoundary.type || 'regulated advice area'}). The system can map the decision structure but cannot provide regulated professional advice.`
    }

    let reviewNote: string | null = null
    if (livingCase?.review?.state !== 'not_required') {
      reviewNote = `This situation may require human review (${livingCase?.review?.tier || 'standard'} tier) before a full analysis can be delivered.`
    }

    // Run decision intelligence orchestrator
    const decisionIntelligence = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: situation.trim(),
      persistJourney: true,
      caseId,
      ...(progressiveEvidence ? { progressiveEvidence } : {}),
      ...(previousDecisionIntelligence ? { previousDecisionIntelligence } : {}),
    })

    res.status(200).json({
      caseId,
      situationClass: getSectionContent('situation_class'),
      whatTheSystemSaw: getSectionContent('what_the_system_saw'),
      primaryFailurePoint: getSectionContent('primary_failure_point'),
      governingTension: getSectionContent('governing_tension'),
      consequenceClass: getSectionContent('consequence_class'),
      whatFullAnalysisWouldMap: getSectionList('what_full_analysis_maps'),
      directionOfMinimumViableMove: getSectionContent('direction_of_minimum_viable_move'),
      boundaryNote,
      reviewNote,
      adversarialPreview,
      alternativeClasses: result.classification?.alternativeClasses || null,
      surfacedDimensions: result.translation?.surfacedDimensions || [],
      preservedAmbiguities: result.translation?.preservedAmbiguities || [],
      clarificationRequired: false,
      clarificationQuestions: null,
      userLanguageEvidence: extractSafeUserLanguageQuotes([situation.trim()]),
      decisionIntelligence,
    })
  } catch (error) {
    console.error('[KERNEL_SIGNAL] Error:', error)
    res.status(500).json({
      caseId: '',
      situationClass: null,
      whatTheSystemSaw: null,
      primaryFailurePoint: null,
      governingTension: null,
      consequenceClass: null,
      whatFullAnalysisWouldMap: [],
      directionOfMinimumViableMove: null,
      boundaryNote: null,
      reviewNote: null,
      adversarialPreview: null,
      alternativeClasses: null,
      surfacedDimensions: [],
      preservedAmbiguities: [],
      clarificationRequired: false,
      clarificationQuestions: null,
      userLanguageEvidence: [],
      decisionIntelligence: undefined,
      error: 'An internal error occurred while processing your situation.',
    })
  }
}
