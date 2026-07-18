/**
 * lib/product/public-signal-persistence.ts
 *
 * Public-safe persistence adapter for the free signal path.
 * Stores derived facts and inputHash only. It must not persist raw situation
 * text, full living cases, full contradiction graphs, paid dossier fields, or
 * prediction claims.
 */

import type { DecisionIntelligenceResult } from '@/lib/intelligence/decision-intelligence-orchestrator'
import {
  appendDiagnosticJourneyEvent,
  getDiagnosticJourney,
  getOrCreateDiagnosticJourney,
} from '@/lib/product/diagnostic-journey-store'
import { hashInput } from '@/lib/product/diagnostic-journey-record'
import type { DiagnosticJourneyEventType } from '@/lib/product/diagnostic-journey-record'

export type PublicSignalPersistenceInput = {
  caseId: string
  rawInput: string
  result: DecisionIntelligenceResult
  consentBoundary?: 'anonymous_public_signal' | 'known_public_signal'
}

export type PublicSignalPersistenceResult = {
  caseId: string
  inputHash: string
  eventsWritten: number
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

async function appendOnce(params: {
  caseId: string
  inputHash: string
  type: DiagnosticJourneyEventType
  engineId: string
  summary: string
  payload: Record<string, unknown>
}): Promise<boolean> {
  const journey = await getDiagnosticJourney(params.caseId)
  const alreadyExists = journey?.events.some((event) =>
    event.type === params.type &&
    event.engineId === params.engineId &&
    event.inputHash === params.inputHash,
  )

  if (alreadyExists) return false

  await appendDiagnosticJourneyEvent({
    caseId: params.caseId,
    surface: 'free_signal',
    type: params.type,
    engineId: params.engineId,
    inputHash: params.inputHash,
    summary: params.summary,
    payload: params.payload,
    audienceSafe: true,
  })

  return true
}

export async function persistPublicSignalFromDecisionIntelligence(
  input: PublicSignalPersistenceInput,
): Promise<PublicSignalPersistenceResult> {
  const inputHash = hashInput(input.rawInput)
  const consentBoundary = input.consentBoundary ?? 'anonymous_public_signal'

  await getOrCreateDiagnosticJourney({
    caseId: input.caseId,
    surface: 'free_signal',
  })

  let eventsWritten = 0
  const result = input.result
  const detectedSignalCount = result.detectedSignals.length
  const contradictionCount = safeCount(result.contradictionCount)
  const simulationPathCount = result.simulationPaths.length
  const unresolvedItemCount = result.unresolvedItems.length

  if (await appendOnce({
    caseId: input.caseId,
    inputHash,
    type: 'SITUATION_TRANSLATED',
    engineId: 'public-signal-persistence',
    summary: result.decisionClass
      ? `Public signal classified as ${result.decisionClass}.`
      : 'Public signal situation translated.',
    payload: {
      caseId: input.caseId,
      surface: 'free_signal',
      inputHash,
      consentBoundary,
      decisionClass: result.decisionClass,
      classificationConfidence: result.classificationConfidence,
      detectedSignalCount,
      preservedAmbiguityCount: result.preservedAmbiguities.length,
    },
  })) eventsWritten++

  if (contradictionCount > 0 && await appendOnce({
    caseId: input.caseId,
    inputHash,
    type: 'CONTRADICTION_DETECTED',
    engineId: 'public-signal-persistence',
    summary: `${contradictionCount} public-safe contradiction signal(s) detected.`,
    payload: {
      caseId: input.caseId,
      surface: 'free_signal',
      inputHash,
      consentBoundary,
      contradictionCount,
      hasPrimaryContradiction: Boolean(result.primaryContradiction),
      graphMetrics: result.contradictionGraph
        ? {
            nodeCount: result.contradictionGraph.nodeCount,
            edgeCount: result.contradictionGraph.edgeCount,
            activeConflicts: result.contradictionGraph.activeConflicts,
          }
        : null,
    },
  })) eventsWritten++

  if (simulationPathCount > 0 && await appendOnce({
    caseId: input.caseId,
    inputHash,
    type: 'SIMULATION_RUN',
    engineId: 'public-signal-persistence',
    summary: `${simulationPathCount} public-safe simulation path(s) derived.`,
    payload: {
      caseId: input.caseId,
      surface: 'free_signal',
      inputHash,
      consentBoundary,
      simulationPathCount,
      admissiblePathCount: result.simulationPaths.filter((path) => path.admissible).length,
      hasCostOfDelay: Boolean(result.costOfDelay),
      degradationProjection: result.degradationProjection
        ? {
            trajectory: result.degradationProjection.trajectory,
            confidence: result.degradationProjection.confidence,
          }
        : null,
    },
  })) eventsWritten++

  if (await appendOnce({
    caseId: input.caseId,
    inputHash,
    type: 'SYNTHESIS_GENERATED',
    engineId: 'public-signal-persistence',
    summary: 'Public-safe synthesis generated.',
    payload: {
      caseId: input.caseId,
      surface: 'free_signal',
      inputHash,
      consentBoundary,
      confidence: result.confidence,
      evidenceTier: result.evidenceTier,
      hiddenStakesDetected: result.hiddenStakesDetected,
      unresolvedItemCount,
      hasNextAdmissibleMove: Boolean(result.nextAdmissibleMove),
      refusalIssued: Boolean(result.refusalReason),
    },
  })) eventsWritten++

  if (result.nextAdmissibleMove && await appendOnce({
    caseId: input.caseId,
    inputHash,
    type: 'ACTION_RECOMMENDED',
    engineId: 'public-signal-persistence',
    summary: 'Public-safe next admissible move identified.',
    payload: {
      caseId: input.caseId,
      surface: 'free_signal',
      inputHash,
      consentBoundary,
      recommendationPresent: true,
      recommendedProductCode: null,
      routedToCheckout: false,
    },
  })) eventsWritten++

  return { caseId: input.caseId, inputHash, eventsWritten }
}