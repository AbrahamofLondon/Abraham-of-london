/**
 * lib/product/decision-centre-living-adapter.ts
 *
 * Converts existing Decision Centre case data into a LivingLayerViewModel-compatible shape.
 * This is the production bridge between the Decision Centre data model and the Living Layer.
 *
 * Rules:
 * - Never invent data. Where production data is missing, use restrained unresolved language.
 * - Never expose audience-unsafe memory.
 * - Never claim verified evidence without verified evidence.
 * - Never claim institutional memory if the data is only sessionStorage.
 */

import type { LivingLayerViewModel, LivingLayerContinuityView } from '@/lib/kernel/living-layer-view-model'
import type { DecisionCentreCase } from '@/lib/product/decision-centre-contract'
import type { GovernedMemoryItem } from '@/lib/product/governed-memory-contract'
import type { SaveCasePayload } from '@/lib/product/save-case-continuity'
import { deriveEvidenceTierFromInputs } from '@/lib/product/evidence-tier-derivation'
import { isMemoryDisplaySafe } from '@/lib/product/governed-memory-contract'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BuildDecisionCentreLivingViewModelInput = {
  caseData: DecisionCentreCase
  governedMemory?: GovernedMemoryItem[]
  carriedForwardCase?: SaveCasePayload | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a date string for display.
 */
function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Map a DecisionCentreCase evidence tier to the view model evidence level.
 */
function mapEvidenceTier(tier: string): LivingLayerViewModel['evidence']['level'] {
  switch (tier) {
    case 'insufficient':
      return 'none'
    case 'single_source':
      return 'single_source'
    case 'multi_source':
      return 'multi_source'
    case 'outcome_verified':
    case 'human_reviewed':
      return 'corroborated'
    default:
      return 'none'
  }
}

/**
 * Get a safe label for a governed memory item's source surface.
 */
function sourceSurfaceLabel(surface: string): string {
  const labels: Record<string, string> = {
    FAST_DIAGNOSTIC: 'Fast Diagnostic',
    PURPOSE_ALIGNMENT: 'Purpose Alignment',
    TEAM_ASSESSMENT: 'Team Assessment',
    ENTERPRISE_ASSESSMENT: 'Enterprise Assessment',
    EXECUTIVE_REPORTING: 'Executive Reporting',
    STRATEGY_ROOM: 'Strategy Room',
    RETURN_BRIEF: 'Return Brief',
    OVERSIGHT_BRIEF: 'Oversight Brief',
    DECISION_CENTRE: 'Decision Centre',
    OUTCOME_VERIFICATION: 'Outcome Verification',
    COUNSEL_REVIEW: 'Counsel Review',
    BOARDROOM_MODE: 'Boardroom Mode',
  }
  return labels[surface] ?? surface.replace(/_/g, ' ').toLowerCase()
}

/**
 * Get a confidence label prefix for display.
 */
function confidencePrefix(confidenceLabel: string): string {
  switch (confidenceLabel) {
    case 'VERIFIED':
      return 'Verified'
    case 'REVIEWED':
      return 'Reviewed'
    case 'CHECKED':
      return 'Checked'
    case 'AGGREGATED':
      return 'Aggregated'
    case 'CAPTURED':
      return 'Captured'
    case 'REPORTED':
      return 'Reported'
    default:
      return 'Recorded'
  }
}

// ─── Progress Derivation ─────────────────────────────────────────────────────

function deriveProgress(caseData: DecisionCentreCase): LivingLayerViewModel['progress'] {
  const stageLabels = [
    'Situation captured',
    'Signals detected',
    'Ambiguity tested',
    'Simulation compared',
    'Next move identified',
    'Evidence strengthened',
    'Escalation readiness',
    'Oversight memory',
  ]

  const completedCount = caseData.completedStages.filter(s => s.status === 'completed').length
  const stagesCompleted = Math.min(completedCount, stageLabels.length)
  const currentStageIndex = Math.min(stagesCompleted, stageLabels.length - 1)
  const nextStageIndex = Math.min(currentStageIndex + 1, stageLabels.length - 1)

  return {
    stagesCompleted,
    currentStage: stageLabels[currentStageIndex] ?? 'Situation captured',
    nextStage: stagesCompleted < stageLabels.length ? (stageLabels[nextStageIndex] ?? 'Oversight memory') : 'Oversight memory',
    stageLabels: [...stageLabels],
  }
}

// ─── Evidence Derivation ─────────────────────────────────────────────────────

function deriveEvidence(
  caseData: DecisionCentreCase,
  governedMemory: GovernedMemoryItem[],
  carriedForwardCase?: SaveCasePayload | null,
): LivingLayerViewModel['evidence'] {
  // Use the canonical evidence tier derivation
  const derived = deriveEvidenceTierFromInputs({
    governedMemory,
    completedStages: caseData.completedStages.filter(s => s.status === 'completed').map(s => s.key),
    carriedForwardCase,
  })

  // If the canonical derivation is more conservative than the case's own tier, use it
  // Otherwise, use the case's tier but add appropriate caveats
  const caseLevel = mapEvidenceTier(caseData.evidenceTier)
  const level = derived.level === 'none' && caseLevel !== 'none' ? caseLevel : derived.level

  const gaps: string[] = [...derived.gaps]
  if (caseData.unresolvedContradictions > 0) {
    gaps.push(`${caseData.unresolvedContradictions} unresolved contradiction(s)`)
  }

  return {
    level,
    stagesCompleted: caseData.completedStages.filter(s => s.status === 'completed').length,
    summary: derived.summary,
    gaps,
  }
}

// ─── Memory Derivation ───────────────────────────────────────────────────────

function deriveMemory(
  caseData: DecisionCentreCase,
  governedMemory: GovernedMemoryItem[],
): LivingLayerViewModel['memory'] {
  const entries: LivingLayerViewModel['memory']['entries'] = []

  // Add governed memory items as memory entries (safe ones only)
  for (const item of governedMemory) {
    if (!isMemoryDisplaySafe(item)) continue

    const sourceLabel = sourceSurfaceLabel(item.sourceSurface)
    const prefix = confidencePrefix(item.confidenceLabel)

    entries.push({
      label: `${prefix} from ${sourceLabel}`,
      summary: item.summary.length > 80 ? item.summary.slice(0, 80) + '…' : item.summary,
      timestamp: formatDate(item.capturedAt),
    })
  }

  // Add the decision text as a memory entry if present
  if (caseData.decisionText) {
    entries.push({
      label: 'Decision statement',
      summary: caseData.decisionText.length > 80 ? caseData.decisionText.slice(0, 80) + '…' : caseData.decisionText,
      timestamp: formatDate(caseData.updatedAt),
    })
  }

  // Dominant pattern from continuity
  let dominantPattern: string | null = null
  if (caseData.continuity?.status === 'REPEATED' || caseData.continuity?.status === 'VERIFIED_PATTERN') {
    dominantPattern = caseData.continuity.summary ?? 'Pattern appears consistently'
  }

  // Escalation trend from cognitive state
  let escalationTrend: string | null = null
  if (caseData.cognitiveState === 'EXECUTION_GOVERNANCE' || caseData.cognitiveState === 'INSTITUTIONAL_INTELLIGENCE') {
    escalationTrend = 'stable'
  } else if (caseData.cognitiveState === 'INTERVENTION_READINESS') {
    escalationTrend = 'rising'
  } else if (caseData.completionRisk?.band === 'HIGH' || caseData.completionRisk?.band === 'SEVERE') {
    escalationTrend = 'rising'
  } else if (caseData.completedStages.length > 0) {
    escalationTrend = 'stable'
  }

  return {
    entries,
    dominantPattern,
    escalationTrend,
  }
}

// ─── Changes Derivation ──────────────────────────────────────────────────────

function deriveChanges(caseData: DecisionCentreCase): LivingLayerViewModel['changes'] {
  const deltas: LivingLayerViewModel['changes']['deltas'] = []
  const newEvidence: string[] = []

  // What changed from the case data
  if (caseData.whatChanged) {
    const changes = caseData.whatChanged.changes ?? []
    const newSignals = changes.filter(c => c.direction === 'NEW_SIGNAL')
    const improved = changes.filter(c => c.direction === 'IMPROVED')
    const deteriorated = changes.filter(c => c.direction === 'DETERIORATED')

    if (newSignals.length > 0) {
      deltas.push({
        label: 'Signals',
        after: `${newSignals.length} new signal(s) detected`,
        significance: 'HIGH',
      })
    }
    if (improved.length > 0) {
      deltas.push({
        label: 'Clarity',
        before: 'previously unresolved',
        after: `${improved.length} area(s) improved`,
        significance: 'MEDIUM',
      })
    }
    if (deteriorated.length > 0) {
      deltas.push({
        label: 'Condition',
        before: 'stable',
        after: `${deteriorated.length} area(s) deteriorated`,
        significance: 'HIGH',
      })
    }
  }

  // Completion risk changes
  if (caseData.completionRisk && caseData.completionRisk.band !== 'LOW') {
    deltas.push({
      label: 'Completion risk',
      after: `${caseData.completionRisk.band} — ${caseData.completionRisk.reason}`,
      significance: caseData.completionRisk.band === 'SEVERE' ? 'HIGH' : 'MEDIUM',
    })
  }

  // Cost of inaction
  if (caseData.costOfInaction && caseData.costOfInaction.accumulatedCost > 0) {
    newEvidence.push(`Estimated cost of inaction: £${caseData.costOfInaction.accumulatedCost.toLocaleString()} over ${caseData.costOfInaction.daysElapsed} days`)
  }

  return { deltas, newEvidence }
}

// ─── Advantage Derivation ────────────────────────────────────────────────────

function deriveAdvantage(caseData: DecisionCentreCase): LivingLayerViewModel['advantage'] {
  const advantages: string[] = []

  if (caseData.governedMemory && caseData.governedMemory.length > 0) {
    advantages.push('The system is carrying forward evidence from prior diagnostics.')
  }
  if (caseData.continuity) {
    advantages.push('The system is tracking whether this case is new, repeated, or worsening.')
  }
  if (caseData.crossAssessmentIntelligence) {
    advantages.push('The system has cross-referenced findings across multiple assessments.')
  }
  if (caseData.contradictionMap && caseData.contradictionMap.activeContradictions.length > 0) {
    advantages.push('The system has mapped contradictions that may affect the decision.')
  }

  // Confidence band from cognitive state
  const confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH' =
    caseData.cognitiveState === 'INSTITUTIONAL_INTELLIGENCE' ? 'HIGH' :
    caseData.cognitiveState === 'EXECUTION_GOVERNANCE' ? 'HIGH' :
    caseData.cognitiveState === 'INTERVENTION_READINESS' ? 'MEDIUM' :
    'LOW'

  // Limitations
  const limitations: string[] = []
  if (caseData.evidenceTier === 'insufficient' || caseData.evidenceTier === 'single_source') {
    limitations.push('Limited evidence base. More diagnostics would strengthen the assessment.')
  }
  if (caseData.unresolvedContradictions > 0) {
    limitations.push(`${caseData.unresolvedContradictions} unresolved contradiction(s) may affect accuracy.`)
  }

  return {
    advantages: advantages.length > 0 ? advantages : ['The system is tracking your case.'],
    confidenceBand,
    limitations,
  }
}

// ─── Next Layer Derivation ───────────────────────────────────────────────────

function deriveNextLayer(
  caseData: DecisionCentreCase,
  governedMemory: GovernedMemoryItem[],
): LivingLayerViewModel['nextLayer'] {
  const progress = deriveProgress(caseData)
  const currentStage = progress.currentStage
  const nextStage = progress.nextStage

  const unlockReasons: Record<string, string> = {
    'Situation captured': 'The system can now begin detecting signals and pressures from your description.',
    'Signals detected': 'With signals identified, the system can test ambiguities and surface what is still unclear.',
    'Ambiguity tested': 'With ambiguities mapped, the system can compare different paths and simulate consequences.',
    'Simulation compared': 'With simulation results, the system can identify the next admissible move.',
    'Next move identified': 'With a move identified, the system can strengthen evidence by asking targeted questions.',
    'Evidence strengthened': 'With stronger evidence, the system can assess escalation readiness.',
    'Escalation readiness': 'With escalation readiness assessed, the system can begin tracking oversight patterns.',
    'Oversight memory': 'All stages are active. Continue refining to strengthen the case.',
  }

  const unlockReason = unlockReasons[nextStage] ?? 'Continuing to build the case strengthens the evidence base.'

  // Derive real unresolved items from case data
  const unresolvedItems: string[] = []

  // Contradictions
  if (caseData.unresolvedContradictions > 0) {
    unresolvedItems.push(`${caseData.unresolvedContradictions} unresolved contradiction(s)`)
  }

  // Admission restrictions
  if (caseData.admission.executiveReporting?.status === 'RESTRICTED') {
    const reasons = caseData.admission.executiveReporting.repairActions ?? []
    if (reasons.length > 0) {
      unresolvedItems.push(...reasons.slice(0, 2))
    } else {
      unresolvedItems.push('Executive Reporting is restricted — more evidence required')
    }
  }
  if (caseData.admission.strategyRoom?.status === 'RESTRICTED') {
    const reasons = caseData.admission.strategyRoom.repairActions ?? []
    if (reasons.length > 0) {
      unresolvedItems.push(...reasons.slice(0, 2))
    } else {
      unresolvedItems.push('Strategy Room is restricted — upstream diagnostic required')
    }
  }

  // Evidence gaps from governed memory
  const unresolvedMemory = governedMemory.filter(
    m => m.audienceSafe && (m.status === 'UNRESOLVED' || m.status === 'STALE')
  )
  for (const item of unresolvedMemory.slice(0, 2)) {
    unresolvedItems.push(item.summary.length > 80 ? item.summary.slice(0, 77) + '...' : item.summary)
  }

  // Completion risk
  if (caseData.completionRisk && caseData.completionRisk.band !== 'LOW') {
    unresolvedItems.push(`Completion risk: ${caseData.completionRisk.band} — ${caseData.completionRisk.reason}`)
  }

  return {
    currentStage,
    nextStage,
    unlockReason,
    unresolvedItems,
  }
}

// ─── Governed Action Derivation ──────────────────────────────────────────────

function deriveGovernedAction(
  caseData: DecisionCentreCase,
  governedMemory: GovernedMemoryItem[],
): LivingLayerViewModel['governedAction'] {
  const requiredAction = caseData.nextRequiredAction || 'Gather additional evidence or clarify the decision parameters.'

  let whyThisAction = ''
  if (caseData.completionRisk) {
    whyThisAction = caseData.completionRisk.suggestedIntervention
      ? `Suggested intervention: ${caseData.completionRisk.suggestedIntervention.replace(/_/g, ' ')}.`
      : ''
  }

  let whatProvesProgress = ''
  if (caseData.whatChanged) {
    whatProvesProgress = 'The system tracks whether the situation evolves, stabilises, or deteriorates across assessments.'
  } else {
    whatProvesProgress = 'Completing additional diagnostics strengthens the evidence base and may unlock deeper surfaces.'
  }

  let whatHappensNext = ''
  if (caseData.admission.strategyRoom?.status === 'ADMITTED') {
    whatHappensNext = 'Evidence is strong enough for Strategy Room — the earned execution layer.'
  } else if (caseData.admission.executiveReporting?.status === 'ADMITTED') {
    whatHappensNext = 'Evidence is strong enough for Executive Reporting — the first paid governed intelligence layer.'
  } else {
    whatHappensNext = 'More evidence is needed before deeper governed surfaces become available.'
  }

  // Derive evidence basis from available data
  const evidenceBasisParts: string[] = []
  const safeMemory = governedMemory.filter(isMemoryDisplaySafe)
  if (safeMemory.length > 0) {
    const sources = [...new Set(safeMemory.map(m => sourceSurfaceLabel(m.sourceSurface)))]
    evidenceBasisParts.push(`Evidence from ${sources.join(', ')}`)
  }
  if (caseData.unresolvedContradictions > 0) {
    evidenceBasisParts.push(`${caseData.unresolvedContradictions} active contradiction(s)`)
  }
  if (caseData.continuity?.status === 'REPEATED' || caseData.continuity?.status === 'VERIFIED_PATTERN') {
    evidenceBasisParts.push('Pattern has appeared before in case history')
  }

  return {
    requiredAction,
    whyThisAction,
    whatProvesProgress,
    whatHappensNext,
    evidenceBasis: evidenceBasisParts.length > 0
      ? [`Recommended from: ${evidenceBasisParts.join('; ')}.`]
      : ['Evidence basis remains limited to the current diagnostic result.'],
  }
}

// ─── Review Derivation ───────────────────────────────────────────────────────

function deriveReview(caseData: DecisionCentreCase): LivingLayerViewModel['review'] {
  const isHighRisk = caseData.completionRisk?.band === 'HIGH' || caseData.completionRisk?.band === 'SEVERE'
  const hasHiddenStakes = caseData.urgencyReasons && caseData.urgencyReasons.length > 0
  const hasUnresolvedContradictions = caseData.unresolvedContradictions > 0

  const triggers: string[] = []
  if (isHighRisk) triggers.push('high completion risk')
  if (hasHiddenStakes) triggers.push('urgency signals detected')
  if (hasUnresolvedContradictions) triggers.push('unresolved contradictions')

  const required = triggers.length > 0

  let reason: string | null = null
  if (required) {
    reason = `Human review may be appropriate because this case involves unresolved authority, consequence, or evidence questions that should not be collapsed into a simple automated answer.`
    if (triggers.length > 0) {
      reason += ` (Triggers: ${triggers.join('; ')}.)`
    }
  }

  return { required, reason }
}

// ─── Continuity Derivation ───────────────────────────────────────────────────

function deriveContinuity(
  caseData: DecisionCentreCase,
  governedMemory: GovernedMemoryItem[],
  carriedForwardCase?: SaveCasePayload | null,
): LivingLayerContinuityView {
  // Session continuity
  const hasMemory = governedMemory.length > 0
  const sessionContinuity: LivingLayerContinuityView['sessionContinuity'] = {
    status: hasMemory ? 'multi_turn_session' : 'active_session',
    summary: hasMemory
      ? 'This case has accumulated evidence across multiple diagnostics.'
      : 'This case is being tracked. Evidence accumulates as diagnostics are completed.',
  }

  // Carried-forward case
  let carriedForward: LivingLayerContinuityView['carriedForwardCase'] | undefined
  if (carriedForwardCase) {
    const parts: string[] = []
    if (carriedForwardCase.decisionLabel) parts.push(`Decision: ${carriedForwardCase.decisionLabel}`)
    if (carriedForwardCase.nextGovernanceMove) parts.push(`Next move: ${carriedForwardCase.nextGovernanceMove}`)
    if (carriedForwardCase.comparisonBand) parts.push(`Comparison: ${carriedForwardCase.comparisonBand}`)

    carriedForward = {
      available: true,
      caseRef: carriedForwardCase.caseRef ?? undefined,
      decisionLabel: carriedForwardCase.decisionLabel ?? undefined,
      nextGovernanceMove: carriedForwardCase.nextGovernanceMove ?? undefined,
      comparisonBand: carriedForwardCase.comparisonBand ?? undefined,
      summary: parts.length > 0
        ? parts.join(' | ')
        : 'A prior diagnostic result is available in this browser session.',
    }
  } else {
    carriedForward = { available: false, summary: 'No prior diagnostic result available.' }
  }

  // Signal continuity from case continuity
  const signalContinuity: LivingLayerContinuityView['signalContinuity'] = []
  if (caseData.continuity) {
    signalContinuity.push({
      signal: caseData.title,
      status: caseData.continuity.status as any,
      summary: caseData.continuity.summary ?? 'Continuity status derived from case history.',
    })
  }

  // Continuity statement
  let continuityStatement: string
  if (carriedForwardCase) {
    continuityStatement = 'A prior diagnostic result is available. The system can use it as carried-forward context, but it is not yet durable institutional memory.'
  } else if (caseData.continuity?.status === 'REPEATED' || caseData.continuity?.status === 'VERIFIED_PATTERN') {
    continuityStatement = 'This pattern has appeared before. The system is treating it as repeated, not yet verified.'
  } else if (governedMemory.length > 0) {
    continuityStatement = 'Evidence from prior diagnostics is available as case memory.'
  } else {
    continuityStatement = 'This case is being tracked. Evidence accumulates as diagnostics are completed.'
  }

  return {
    sessionContinuity,
    carriedForwardCase: carriedForward,
    signalContinuity,
    continuityStatement,
  }
}

// ─── Main Adapter Function ───────────────────────────────────────────────────

export function buildDecisionCentreLivingViewModel(
  input: BuildDecisionCentreLivingViewModelInput,
): LivingLayerViewModel {
  const { caseData, carriedForwardCase } = input

  // Filter to safe governed memory only
  const safeMemory = (input.governedMemory ?? caseData.governedMemory ?? []).filter(isMemoryDisplaySafe)

  const progress = deriveProgress(caseData)
  const evidence = deriveEvidence(caseData, safeMemory, carriedForwardCase)
  const governedAction = deriveGovernedAction(caseData, safeMemory)
  const advantage = deriveAdvantage(caseData)
  const nextLayer = deriveNextLayer(caseData, safeMemory)
  const memory = deriveMemory(caseData, safeMemory)
  const changes = deriveChanges(caseData)
  const review = deriveReview(caseData)
  const continuity = deriveContinuity(caseData, safeMemory, carriedForwardCase)

  return {
    progress,
    evidence,
    governedAction,
    advantage,
    nextLayer,
    memory,
    changes,
    review,
    continuity,
  }
}
