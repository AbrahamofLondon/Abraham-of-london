/**
 * lib/kernel/living-layer-view-model.ts — Living Layer View Model
 *
 * Converts the Living Layer v1 API response (context, noticed, simulation, synthesis)
 * into a safe UI view model that feeds the existing components/living/* components.
 *
 * This is the translation bridge between engine outputs and UI props.
 *
 * Rules:
 * - Never expose internal scores, thresholds, raw taxonomy keys, or engine mechanics.
 * - Expose: evidence strength, stage progression, next admissible action, what changed,
 *   what is still missing, what deeper analysis would add, whether human review is appropriate.
 * - Keep evidence language honest. Do not overclaim.
 * - Continuity: session memory only. Never claim institutional memory without durable persistence.
 */

import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'
import type { SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Public View Model Types ─────────────────────────────────────────────────

export type LivingLayerRuntimeInput = {
  context: LiveSessionContext
  noticed: PublicSituationTranslation
  simulation: SimulationGateResult
  synthesis: SynthesisGateResult
  carriedForwardCase?: SaveCasePayload | null
}

export type LivingLayerContinuityView = {
  sessionContinuity: {
    status: 'new_session' | 'active_session' | 'multi_turn_session'
    summary: string
  }
  carriedForwardCase?: {
    available: boolean
    caseRef?: string
    decisionLabel?: string
    nextGovernanceMove?: string
    comparisonBand?: string
    summary: string
  }
  signalContinuity: Array<{
    signal: string
    status: 'NEW' | 'REPEATED' | 'WORSENING' | 'IMPROVING' | 'RESOLVED' | 'VERIFIED_PATTERN' | 'UNKNOWN'
    summary: string
  }>
  continuityStatement: string
}

export type LivingLayerViewModel = {
  progress: {
    stagesCompleted: number
    currentStage: string
    nextStage: string
    stageLabels: string[]
  }

  evidence: {
    level: 'none' | 'single_source' | 'multi_source' | 'corroborated' | 'verified'
    stagesCompleted: number
    summary: string
    gaps: string[]
  }

  governedAction: {
    requiredAction: string
    whyThisAction: string
    whatProvesProgress: string
    whatHappensNext: string
    evidenceBasis?: string[]
  }

  advantage: {
    advantages: string[]
    confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH'
    limitations: string[]
  }

  nextLayer: {
    currentStage: string
    nextStage: string
    unlockReason: string
    unresolvedItems: string[]
  }

  memory: {
    entries: Array<{
      label: string
      summary: string
      timestamp: string
    }>
    dominantPattern: string | null
    escalationTrend: string | null
  }

  changes: {
    deltas: Array<{
      label: string
      before?: string
      after: string
      significance: 'LOW' | 'MEDIUM' | 'HIGH'
    }>
    newEvidence: string[]
  }

  review: {
    required: boolean
    reason: string | null
  }

  continuity: LivingLayerContinuityView
}

// ─── Canonical Stage Labels ──────────────────────────────────────────────────

const STAGE_LABELS: string[] = [
  'Situation captured',
  'Signals detected',
  'Ambiguity tested',
  'Simulation compared',
  'Next move identified',
  'Evidence strengthened',
  'Escalation readiness',
  'Oversight memory',
]

// ─── Evidence Tier Derivation ────────────────────────────────────────────────
//
// v1 rule:
//   none           = no clear actor, consequence, or signal
//   single_source  = user has provided one coherent situation description
//   multi_source   = repeated turns add new actors/signals or clarify ambiguity
//   corroborated   = user provides confirmation, document reference, board/client/regulator detail, or deadline
//   verified       = reserved; do not use in v1 unless actual evidence upload/verification exists

function deriveEvidenceLevel(input: LivingLayerRuntimeInput): LivingLayerViewModel['evidence'] {
  const { context, noticed, synthesis } = input
  const turnCount = context.turns.filter(t => t.role === 'user').length
  const hasActors = context.actors.length > 0
  const hasSignals = context.signals.length > 0
  const hasHiddenStakes = context.hiddenStakes.length > 0
  const hasAmbiguity = context.ambiguities.length > 0
  const hasDeadline = context.signals.some(s => s.key.includes('deadline'))
  const hasRegulatorDetail = context.signals.some(s => s.key.includes('statutory') || s.key.includes('legal'))
  const hasBoardDetail = context.signals.some(s => s.key.includes('board'))
  const hasCorroboratingDetail = hasDeadline || hasRegulatorDetail || hasBoardDetail

  let level: LivingLayerViewModel['evidence']['level'] = 'none'
  let summary: string
  const gaps: string[] = []

  if (turnCount >= 3 && hasCorroboratingDetail && hasActors && hasSignals) {
    level = 'corroborated'
    summary = 'The situation is corroborated by specific details — deadlines, actors, and contextual signals are present.'
  } else if (turnCount >= 2 && hasActors && hasSignals) {
    level = 'multi_source'
    summary = 'Multiple signals and actors have been identified across turns, building a multi-source picture.'
  } else if (turnCount >= 1 && (hasActors || hasSignals)) {
    level = 'single_source'
    summary = 'The system has a single coherent description of the situation with identifiable actors or signals.'
  } else {
    level = 'none'
    summary = 'The situation is not yet clear enough to assess evidence strength.'
  }

  // Gaps
  if (!hasActors) gaps.push('No decision actors identified')
  if (!hasSignals) gaps.push('No signals or pressures detected')
  if (hasAmbiguity) gaps.push('Ambiguities remain unresolved')
  if (synthesis.currentRisk === 'HIGH' || synthesis.currentRisk === 'CRITICAL') {
    if (!hasCorroboratingDetail) gaps.push('High-risk situation without corroborating detail')
  }

  return {
    level,
    stagesCompleted: turnCount,
    summary,
    gaps,
  }
}

// ─── Stage Progression Derivation ────────────────────────────────────────────
//
// Map completed stages from actual state:
//   1. Situation captured       = first user turn exists
//   2. Signals detected         = detectedSignals.length > 0
//   3. Ambiguity tested         = ambiguities have been surfaced or resolved
//   4. Simulation compared      = simulation.paths.length >= 2
//   5. Next move identified     = synthesis.nextAdmissibleMove exists
//   6. Evidence strengthened    = repeated turns or corroborating detail exists
//   7. Escalation readiness     = synthesis.currentRisk is HIGH/CRITICAL and next move is clear
//   8. Oversight memory         = more than 2 turns or repeated unresolved signal exists

function deriveStageProgression(input: LivingLayerRuntimeInput): LivingLayerViewModel['progress'] {
  const { context, noticed, simulation, synthesis } = input
  const turnCount = context.turns.filter(t => t.role === 'user').length
  const hasSignals = noticed.detectedSignals.length > 0
  const hasAmbiguity = context.ambiguities.length > 0
  const hasMultiplePaths = simulation.paths.length >= 2
  const hasNextMove = Boolean(synthesis.nextAdmissibleMove)
  const hasCorroboratingDetail = context.signals.some(s =>
    s.key.includes('deadline') || s.key.includes('statutory') || s.key.includes('legal') || s.key.includes('board')
  )
  const isHighRisk = synthesis.currentRisk === 'HIGH' || synthesis.currentRisk === 'CRITICAL'
  const hasRepeatedSignals = context.signals.filter(s => s.occurrences > 1).length > 0

  // Determine which stages are completed (0-indexed)
  const completedIndices: number[] = []

  // Stage 1: Situation captured
  if (turnCount >= 1) completedIndices.push(0)

  // Stage 2: Signals detected
  if (hasSignals) completedIndices.push(1)

  // Stage 3: Ambiguity tested
  if (hasAmbiguity) completedIndices.push(2)

  // Stage 4: Simulation compared
  if (hasMultiplePaths) completedIndices.push(3)

  // Stage 5: Next move identified
  if (hasNextMove) completedIndices.push(4)

  // Stage 6: Evidence strengthened
  if (turnCount >= 2 || hasCorroboratingDetail) completedIndices.push(5)

  // Stage 7: Escalation readiness
  if (isHighRisk && hasNextMove) completedIndices.push(6)

  // Stage 8: Oversight memory
  if (turnCount > 2 || hasRepeatedSignals) completedIndices.push(7)

  const stagesCompleted = completedIndices.length
  const currentStageIndex = Math.min(stagesCompleted, STAGE_LABELS.length - 1)
  const nextStageIndex = Math.min(currentStageIndex + 1, STAGE_LABELS.length - 1)

  return {
    stagesCompleted,
    currentStage: STAGE_LABELS[currentStageIndex] ?? 'Situation captured',
    nextStage: stagesCompleted < STAGE_LABELS.length ? (STAGE_LABELS[nextStageIndex] ?? 'Oversight memory') : 'Oversight memory',
    stageLabels: [...STAGE_LABELS],
  }
}

// ─── Governed Action Derivation ──────────────────────────────────────────────

function deriveGovernedAction(input: LivingLayerRuntimeInput): LivingLayerViewModel['governedAction'] {
  const { context, simulation, synthesis } = input

  const requiredAction = synthesis.nextAdmissibleMove || 'Gather additional evidence or clarify the decision parameters.'

  // Why this action: derive from the most relevant simulation path
  let whyThisAction = ''
  if (simulation.preferredPathId) {
    const preferred = simulation.paths.find(p => p.assumptionId === simulation.preferredPathId)
    if (preferred) {
      whyThisAction = preferred.shouldProceed
        ? `This path keeps risk ${preferred.riskShift.toLowerCase() === 'lower' ? 'lower' : preferred.riskShift.toLowerCase() === 'higher' ? 'from increasing further' : 'stable'} while making progress.`
        : preferred.refusalReason ?? 'This path avoids proceeding under conditions that could make the situation worse.'
    }
  } else if (simulation.paths.length > 0) {
    const firstProceedable = simulation.paths.find(p => p.shouldProceed)
    if (firstProceedable) {
      whyThisAction = `This is the safest path given the current evidence — risk is ${firstProceedable.riskShift.toLowerCase()}.`
    } else {
      whyThisAction = 'No path is safe to proceed. More evidence is needed before a move can be recommended.'
    }
  }

  // What proves progress: derive from what changed
  let whatProvesProgress = ''
  if (context.lastDelta) {
    const delta = context.lastDelta
    if (delta.newActors.length > 0 || delta.newSignals.length > 0) {
      whatProvesProgress = 'Each turn that adds new actors or signals strengthens the evidence base and reduces ambiguity.'
    } else if (delta.resolvedAmbiguities.length > 0) {
      whatProvesProgress = 'Resolving ambiguities narrows the decision space and makes the next move clearer.'
    } else {
      whatProvesProgress = 'The system tracks whether the situation evolves, stabilises, or deteriorates across turns.'
    }
  } else {
    whatProvesProgress = 'The system tracks whether the situation evolves, stabilises, or deteriorates across turns.'
  }

  // What happens next: derive from simulation comparison
  let whatHappensNext = ''
  if (simulation.paths.length > 0) {
    const preferred = simulation.paths.find(p => p.assumptionId === simulation.preferredPathId) ?? simulation.paths[0]
    whatHappensNext = preferred?.likelyOutcome
      ? preferred.likelyOutcome.length > 120
        ? preferred.likelyOutcome.slice(0, 120) + '…'
        : preferred.likelyOutcome
      : 'Simulation result not available.'
  } else {
    whatHappensNext = 'More information is needed before the system can simulate what happens next.'
  }

  return {
    requiredAction,
    whyThisAction,
    whatProvesProgress,
    whatHappensNext,
  }
}

// ─── Advantage Derivation ────────────────────────────────────────────────────

function deriveAdvantage(input: LivingLayerRuntimeInput): LivingLayerViewModel['advantage'] {
  const { context, noticed, synthesis } = input
  const advantages: string[] = []

  // What the system sees that others can't
  if (noticed.hiddenStakes.length > 0) {
    advantages.push('The system detected possible hidden stakes that were not explicitly stated.')
  }
  if (noticed.ambiguities.length > 0) {
    advantages.push('The system identified areas of ambiguity that may affect the decision.')
  }
  if (context.actors.length > 0) {
    const repeated = context.actors.filter(a => a.occurrences > 1)
    if (repeated.length > 0) {
      advantages.push(`The system tracks that ${repeated.map(a => a.name).join(', ')} ${repeated.length === 1 ? 'has' : 'have'} been consistently involved.`)
    }
  }
  if (simulationPathsRevealInsight(input)) {
    advantages.push('The system compared multiple paths and identified which ones are safe to proceed.')
  }

  // Confidence band
  const confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH' =
    synthesis.currentRisk === 'CRITICAL' ? 'LOW' :
    synthesis.currentRisk === 'HIGH' ? 'MEDIUM' :
    synthesis.currentRisk === 'MEDIUM' ? 'MEDIUM' :
    'HIGH'

  // Limitations
  const limitations: string[] = []
  if (context.turns.filter(t => t.role === 'user').length < 2) {
    limitations.push('Single-turn analysis. Multiple turns build a more reliable picture.')
  }
  if (context.ambiguities.length > 0) {
    limitations.push('Ambiguities remain unresolved, which may affect the accuracy of the assessment.')
  }
  if (!context.actors.some(a => a.occurrences > 1)) {
    limitations.push('No actor has been confirmed across multiple turns.')
  }

  return {
    advantages: advantages.length > 0 ? advantages : ['The system is tracking your case across turns.'],
    confidenceBand,
    limitations,
  }
}

function simulationPathsRevealInsight(input: LivingLayerRuntimeInput): boolean {
  const paths = input.simulation.paths
  if (paths.length < 2) return false
  const hasProceedable = paths.some(p => p.shouldProceed)
  const hasNonProceedable = paths.some(p => !p.shouldProceed)
  return hasProceedable && hasNonProceedable
}

// ─── Next Layer Derivation ───────────────────────────────────────────────────

function deriveNextLayer(input: LivingLayerRuntimeInput): LivingLayerViewModel['nextLayer'] {
  const { context, noticed, simulation, synthesis } = input
  const turnCount = context.turns.filter(t => t.role === 'user').length

  const progress = deriveStageProgression(input)
  const currentStage = progress.currentStage
  const nextStage = progress.nextStage

  // Unlock reason: what the next stage would detect
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

  // Unresolved items
  const unresolvedItems: string[] = []
  if (context.ambiguities.length > 0) {
    unresolvedItems.push(...context.ambiguities.slice(0, 3))
  }
  if (synthesis.shouldRefuse && synthesis.refusalReason) {
    unresolvedItems.push(synthesis.refusalReason)
  }
  if (context.actors.length === 0) {
    unresolvedItems.push('No decision owner identified')
  }

  return {
    currentStage,
    nextStage,
    unlockReason,
    unresolvedItems,
  }
}

// ─── Memory Derivation ───────────────────────────────────────────────────────
//
// v1: No database persistence. Use session turns as "memory."
// Do not claim cross-session memory yet.

function deriveMemory(input: LivingLayerRuntimeInput): LivingLayerViewModel['memory'] {
  const { context, synthesis } = input
  const userTurns = context.turns.filter(t => t.role === 'user')

  const entries = userTurns.map((turn, i) => {
    // Derive a label from the turn content
    const lower = turn.content.toLowerCase()
    let label = `Turn ${i + 1}`

    if (i === 0) {
      label = 'Initial situation captured'
    } else if (lower.includes('board') || lower.includes('ceo') || lower.includes('founder')) {
      label = 'Board or leadership actor introduced'
    } else if (lower.includes('deadline') || lower.includes('urgent') || lower.includes('time')) {
      label = 'Timing or deadline pressure clarified'
    } else if (lower.includes('budget') || lower.includes('cost') || lower.includes('cash') || lower.includes('financial')) {
      label = 'Financial or budget exposure clarified'
    } else if (lower.includes('legal') || lower.includes('compliance') || lower.includes('regulatory')) {
      label = 'Legal or compliance dimension surfaced'
    } else if (lower.includes('client') || lower.includes('customer') || lower.includes('partner')) {
      label = 'External stakeholder introduced'
    } else if (lower.includes('not sure') || lower.includes('unclear') || lower.includes('maybe')) {
      label = 'Ambiguity acknowledged'
    } else {
      label = `Additional context: ${turn.content.slice(0, 40).trim()}…`
    }

    return {
      label,
      summary: turn.content.length > 80 ? turn.content.slice(0, 80) + '…' : turn.content,
      timestamp: new Date(turn.createdAt).toLocaleTimeString(),
    }
  })

  // Dominant pattern: derive from repeated signals
  let dominantPattern: string | null = null
  const repeatedSignals = context.signals.filter(s => s.occurrences > 1)
  const firstRepeatedSignal = repeatedSignals[0]
  if (firstRepeatedSignal) {
    dominantPattern = `${firstRepeatedSignal.label} appears consistently`
  }

  // Escalation trend
  let escalationTrend: string | null = null
  if (synthesis.currentRisk === 'CRITICAL') {
    escalationTrend = 'rising'
  } else if (synthesis.currentRisk === 'HIGH' && context.hiddenStakes.length > 0) {
    escalationTrend = 'rising'
  } else if (synthesis.currentRisk === 'LOW' && context.turns.length > 2) {
    escalationTrend = 'falling'
  } else if (context.turns.length > 1) {
    escalationTrend = 'stable'
  }

  return {
    entries,
    dominantPattern,
    escalationTrend,
  }
}

// ─── Changes Derivation ──────────────────────────────────────────────────────

function deriveChanges(input: LivingLayerRuntimeInput): LivingLayerViewModel['changes'] {
  const { context, noticed } = input
  const deltas: LivingLayerViewModel['changes']['deltas'] = []
  const newEvidence: string[] = []

  if (context.lastDelta) {
    const delta = context.lastDelta

    // Actor changes
    if (delta.newActors.length > 0) {
      deltas.push({
        label: 'Actors',
        after: `${delta.newActors.join(', ')} introduced`,
        significance: 'HIGH',
      })
    }
    if (delta.repeatedActors.length > 0) {
      deltas.push({
        label: 'Actors',
        before: 'mentioned once',
        after: `${delta.repeatedActors[0]} confirmed`,
        significance: 'MEDIUM',
      })
    }

    // Signal changes
    if (delta.newSignals.length > 0) {
      const signalLabels = delta.newSignals.map(s => {
        const sig = context.signals.find(sg => sg.key === s)
        return sig?.label ?? s
      })
      deltas.push({
        label: 'Signals',
        after: `${signalLabels.join(', ')} detected`,
        significance: 'HIGH',
      })
    }

    // Ambiguity changes
    if (delta.resolvedAmbiguities.length > 0) {
      deltas.push({
        label: 'Clarity',
        before: `${delta.resolvedAmbiguities.length} area(s) unclear`,
        after: `${delta.resolvedAmbiguities.length} area(s) now clearer`,
        significance: 'MEDIUM',
      })
    }
    if (delta.newAmbiguities.length > 0) {
      deltas.push({
        label: 'Ambiguity',
        after: `${delta.newAmbiguities.length} new area(s) of ambiguity surfaced`,
        significance: 'MEDIUM',
      })
    }

    // Hidden stakes
    if (delta.newlyDetectedHiddenStakes.length > 0) {
      deltas.push({
        label: 'Risk awareness',
        before: 'not detected',
        after: 'possible hidden stake surfaced',
        significance: 'HIGH',
      })
    }
  }

  // New evidence from signals
  if (noticed.detectedSignals.length > 0) {
    for (const signal of noticed.detectedSignals) {
      newEvidence.push(`Signal detected: ${signal.label}`)
    }
  }
  if (noticed.hiddenStakes.length > 0) {
    newEvidence.push(...noticed.hiddenStakes)
  }

  return {
    deltas,
    newEvidence,
  }
}

// ─── Human Review Logic ──────────────────────────────────────────────────────
//
// Set review.required = true when:
//   - current risk is HIGH or CRITICAL and owner is unclear
//   - hidden stakes are present
//   - simulation paths disagree strongly
//   - synthesis refuses to proceed
//   - ambiguity remains after two or more user turns

function deriveReview(input: LivingLayerRuntimeInput): LivingLayerViewModel['review'] {
  const { context, simulation, synthesis } = input
  const turnCount = context.turns.filter(t => t.role === 'user').length
  const hasOwner = context.actors.length > 0
  const isHighRisk = synthesis.currentRisk === 'HIGH' || synthesis.currentRisk === 'CRITICAL'
  const hasHiddenStakes = context.hiddenStakes.length > 0
  const pathsDisagree = simulation.paths.filter(p => p.shouldProceed).length > 0 &&
    simulation.paths.filter(p => !p.shouldProceed).length > 0
  const refusesToProceed = synthesis.shouldRefuse
  const ambiguityPersists = context.ambiguities.length > 0 && turnCount >= 2

  const triggers: string[] = []
  if (isHighRisk && !hasOwner) triggers.push('high risk without clear owner')
  if (hasHiddenStakes) triggers.push('possible hidden stakes detected')
  if (pathsDisagree) triggers.push('simulation paths disagree on whether to proceed')
  if (refusesToProceed) triggers.push('system cannot responsibly proceed')
  if (ambiguityPersists) triggers.push('ambiguity remains after multiple turns')

  const required = triggers.length > 0

  let reason: string | null = null
  if (required) {
    reason = `Human review may be appropriate because this case now involves unresolved authority, consequence, or evidence questions that should not be collapsed into a simple automated answer.`
    if (triggers.length > 0) {
      reason += ` (Triggers: ${triggers.join('; ')}.)`
    }
  }

  return { required, reason }
}

// ─── Continuity Derivation ───────────────────────────────────────────────────
//
// v1.6: Session continuity + carried-forward case + signal continuity.
// Never emit VERIFIED_PATTERN or RESOLVED without durable evidence.
// Never claim institutional memory.

function deriveSessionContinuity(input: LivingLayerRuntimeInput): LivingLayerContinuityView['sessionContinuity'] {
  const turnCount = input.context.turns.filter(t => t.role === 'user').length

  if (turnCount === 0) {
    return {
      status: 'new_session',
      summary: 'This case is being tracked within the current session. Repeated actors and signals will be recognised while this session remains active.',
    }
  }
  if (turnCount === 1) {
    return {
      status: 'active_session',
      summary: 'This case is being tracked within the current session. Repeated actors and signals will be recognised while this session remains active.',
    }
  }
  return {
    status: 'multi_turn_session',
    summary: 'This case is being tracked within the current session. Repeated actors and signals will be recognised while this session remains active.',
  }
}

function deriveCarriedForwardCase(input: LivingLayerRuntimeInput): LivingLayerContinuityView['carriedForwardCase'] {
  const cfc = input.carriedForwardCase
  if (!cfc) {
    return { available: false, summary: 'No prior diagnostic result is available in this browser session.' }
  }

  const parts: string[] = []
  if (cfc.decisionLabel) parts.push(`Decision: ${cfc.decisionLabel}`)
  if (cfc.nextGovernanceMove) parts.push(`Next move: ${cfc.nextGovernanceMove}`)
  if (cfc.comparisonBand) parts.push(`Comparison: ${cfc.comparisonBand}`)

  return {
    available: true,
    caseRef: cfc.caseRef ?? undefined,
    decisionLabel: cfc.decisionLabel ?? undefined,
    nextGovernanceMove: cfc.nextGovernanceMove ?? undefined,
    comparisonBand: cfc.comparisonBand ?? undefined,
    summary: parts.length > 0
      ? parts.join(' | ')
      : 'A prior diagnostic result is available in this browser session.',
  }
}

/**
 * Conservative local signal continuity classifier.
 *
 * The existing deriveSignalContinuity in lib/product/signal-continuity.ts requires
 * DiagnosticJourneyRecord which the Living Layer does not yet have access to.
 * This adapter maps current session signals into the closest supported shape.
 *
 * TODO: Wire deriveSignalContinuity from lib/product/signal-continuity.ts when
 * the Living Layer has access to DiagnosticJourneyRecord.
 *
 * Rules:
 * - first occurrence = NEW
 * - repeated across turns = REPEATED
 * - hidden stake introduced after earlier weak framing = WORSENING
 * - ambiguity resolved = IMPROVING
 * - no sufficient history = UNKNOWN
 * - never emit VERIFIED_PATTERN in v1.6
 * - never emit RESOLVED in v1.6 (requires outcome verification)
 */
function deriveSignalContinuityStatus(
  signalLabel: string,
  occurrences: number,
  isHiddenStake: boolean,
  hasResolvedAmbiguity: boolean,
): 'NEW' | 'REPEATED' | 'WORSENING' | 'IMPROVING' | 'UNKNOWN' {
  // Never emit VERIFIED_PATTERN or RESOLVED in v1.6
  if (isHiddenStake && occurrences > 1) return 'WORSENING'
  if (hasResolvedAmbiguity) return 'IMPROVING'
  if (occurrences >= 2) return 'REPEATED'
  if (occurrences === 1) return 'NEW'
  return 'UNKNOWN'
}

function deriveSignalContinuity(input: LivingLayerRuntimeInput): LivingLayerContinuityView['signalContinuity'] {
  const { context } = input
  const results: LivingLayerContinuityView['signalContinuity'] = []

  // Classify each unique signal from the session context
  for (const signal of context.signals) {
    const isHiddenStake = context.hiddenStakes.length > 0 &&
      context.lastDelta?.newlyDetectedHiddenStakes.length ? true : false
    const hasResolvedAmbiguity = context.lastDelta?.resolvedAmbiguities.length ? true : false

    const status = deriveSignalContinuityStatus(
      signal.label,
      signal.occurrences,
      isHiddenStake,
      hasResolvedAmbiguity,
    )

    let summary: string
    switch (status) {
      case 'NEW':
        summary = `"${signal.label}" has appeared once in the current session.`
        break
      case 'REPEATED':
        summary = `"${signal.label}" has appeared ${signal.occurrences} times in the current session. The system is treating it as repeated, not yet verified.`
        break
      case 'WORSENING':
        summary = `A higher-stakes signal appeared after the issue was initially framed more casually. The system is treating this as possible worsening, not as verified fact.`
        break
      case 'IMPROVING':
        summary = `An area of ambiguity has been resolved. The system is treating this as improving clarity, not as verified resolution.`
        break
      default:
        summary = `Insufficient session history to classify "${signal.label}".`
    }

    results.push({ signal: signal.label, status, summary })
  }

  return results
}

function deriveContinuityStatement(input: LivingLayerRuntimeInput): string {
  const { context, carriedForwardCase } = input
  const turnCount = context.turns.filter(t => t.role === 'user').length
  const hasCarriedForward = Boolean(carriedForwardCase)
  const hasRepeatedSignals = context.signals.some(s => s.occurrences > 1)
  const hasHiddenStakes = context.hiddenStakes.length > 0

  if (hasCarriedForward) {
    return 'A prior diagnostic result is available in this browser session. The system can use it as carried-forward context, but it is not yet durable institutional memory.'
  }
  if (hasHiddenStakes && turnCount > 1) {
    return 'A higher-stakes signal appeared after the issue was initially framed more casually. The system is treating this as possible worsening, not as verified fact.'
  }
  if (hasRepeatedSignals && turnCount > 1) {
    return 'This signal has appeared more than once in the current session. The system is treating it as repeated, not yet verified.'
  }
  if (turnCount === 0) {
    return 'No session data yet. Submit a decision description to begin.'
  }
  return 'This case is being tracked within the current session. Repeated actors and signals will be recognised while this session remains active.'
}

function deriveContinuity(input: LivingLayerRuntimeInput): LivingLayerContinuityView {
  return {
    sessionContinuity: deriveSessionContinuity(input),
    carriedForwardCase: deriveCarriedForwardCase(input),
    signalContinuity: deriveSignalContinuity(input),
    continuityStatement: deriveContinuityStatement(input),
  }
}

// ─── Main Builder Function ───────────────────────────────────────────────────

export function buildLivingLayerViewModel(input: LivingLayerRuntimeInput): LivingLayerViewModel {
  const progress = deriveStageProgression(input)
  const evidence = deriveEvidenceLevel(input)
  const governedAction = deriveGovernedAction(input)
  const advantage = deriveAdvantage(input)
  const nextLayer = deriveNextLayer(input)
  const memory = deriveMemory(input)
  const changes = deriveChanges(input)
  const review = deriveReview(input)
  const continuity = deriveContinuity(input)

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