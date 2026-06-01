/**
 * lib/kernel/synthesis-gate.ts — Synthesis Gate
 *
 * Turns the live session context, latest delta, and simulation results
 * into one clear user-facing response.
 *
 * Answers:
 * 1. What does the system now understand?
 * 2. What changed since the last turn?
 * 3. What assumption is most dangerous?
 * 4. What is still missing?
 * 5. What is the next admissible move?
 */

import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SynthesisGateResult = {
  situationRead: string
  whatChanged: string | null
  simulationSummary: string | null
  currentRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  nextQuestion: string | null
  nextAdmissibleMove: string
  shouldRefuse: boolean
  refusalReason?: string
}

// ─── Risk assessment ─────────────────────────────────────────────────────────

function assessRisk(context: LiveSessionContext): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const signalKeys = context.signals.map(s => s.key)
  const hasCriticalSignal = context.signals.some(s => s.severity === 'CRITICAL')
  const hasHighSignal = context.signals.some(s => s.severity === 'HIGH')
  const hasHiddenStakes = context.hiddenStakes.length > 0
  const hasDeadline = signalKeys.some(k => k.includes('deadline'))
  const hasPenalty = signalKeys.some(k => k.includes('penalty'))
  const hasAuthorityIssue = signalKeys.some(k => k.includes('authority'))
  const hasOwner = context.actors.length > 0
  const isLowStakes = context.currentSummary.toLowerCase().includes('low-stakes') || context.currentSummary.toLowerCase().includes('low pressure')

  if (isLowStakes && !hasHiddenStakes) return 'LOW'
  if (hasCriticalSignal || (hasPenalty && hasDeadline)) return 'CRITICAL'
  if (hasHighSignal || hasHiddenStakes || (hasAuthorityIssue && hasDeadline)) return 'HIGH'
  if (hasDeadline || hasAuthorityIssue || !hasOwner) return 'MEDIUM'
  return 'LOW'
}

// ─── Build situation read ────────────────────────────────────────────────────

function buildSituationRead(context: LiveSessionContext): string {
  const parts: string[] = []

  // Use current summary as base
  if (context.currentSummary) {
    parts.push(context.currentSummary)
  }

  // Add actor context
  if (context.actors.length > 0) {
    const actorNames = context.actors.map(a => a.name)
    const repeatedActors = context.actors.filter(a => a.occurrences > 1).map(a => a.name)
    if (repeatedActors.length > 0) {
      parts.push(`${repeatedActors.join(', ')} ${repeatedActors.length === 1 ? 'has' : 'have'} been mentioned multiple times, confirming their involvement.`)
    } else {
      parts.push(`The following actors are involved: ${actorNames.join(', ')}.`)
    }
  } else {
    parts.push('No clear decision owner has been identified.')
  }

  // Add signal context
  if (context.signals.length > 0) {
    const highSignals = context.signals.filter(s => s.severity === 'HIGH' || s.severity === 'CRITICAL')
    if (highSignals.length > 0) {
      const labels = highSignals.map(s => s.label.toLowerCase())
      parts.push(`Key pressures detected: ${labels.join(', ')}.`)
    }
  }

  return parts.join(' ')
}

// ─── Build what changed ──────────────────────────────────────────────────────

function buildWhatChanged(context: LiveSessionContext): string | null {
  if (!context.lastDelta) return null

  const delta = context.lastDelta
  const parts: string[] = []

  if (delta.newActors.length > 0) {
    parts.push(`you introduced ${delta.newActors.join(', ')} as ${delta.newActors.length === 1 ? 'an actor' : 'actors'}`)
  }
  if (delta.newSignals.length > 0) {
    const signalLabels = delta.newSignals.map(s => {
      const sig = context.signals.find(sg => sg.key === s)
      return sig?.label.toLowerCase() ?? s
    })
    parts.push(`new signals detected: ${signalLabels.join(', ')}`)
  }
  if (delta.resolvedAmbiguities.length > 0) {
    parts.push(`${delta.resolvedAmbiguities.length} area${delta.resolvedAmbiguities.length === 1 ? ' is' : 's are'} now clearer`)
  }
  if (delta.newlyDetectedHiddenStakes.length > 0) {
    parts.push('the system detected a possible hidden stake that was not apparent before')
  }
  if (delta.repeatedActors.length > 0 && delta.newActors.length === 0 && delta.newSignals.length === 0) {
    parts.push(`${delta.repeatedActors[0]} was mentioned again, confirming their role`)
  }

  if (parts.length === 0) return null

  const changed = parts.join('; ')
  return `Since your last input, ${changed}.`
}

// ─── Build simulation summary ────────────────────────────────────────────────

function buildSimulationSummary(simulation: SimulationGateResult): string | null {
  if (simulation.paths.length === 0) return null

  const parts: string[] = []
  for (const path of simulation.paths) {
    if (!path.shouldProceed && path.refusalReason) {
      parts.push(`${path.assumptionLabel}: ${path.refusalReason}`)
    } else {
      parts.push(`${path.assumptionLabel}: ${path.likelyOutcome}`)
    }
  }

  return parts.join('\n\n')
}

// ─── Build next question ─────────────────────────────────────────────────────

function buildNextQuestion(context: LiveSessionContext): string | null {
  const signalKeys = context.signals.map(s => s.key)
  const hasOwner = context.actors.length > 0
  const hasDeadline = signalKeys.some(k => k.includes('deadline') || k.includes('timing'))
  const hasAuthorityIssue = signalKeys.some(k => k.includes('authority'))
  const hasEvidenceGap = signalKeys.some(k => k.includes('evidence'))
  const hasCashConstraint = signalKeys.some(k => k.includes('cash'))
  const hasAmbiguity = context.ambiguities.length > 0

  // Prioritise questions based on what is still missing
  if (!hasOwner) {
    return 'Who owns this decision? Without an accountable owner, the system cannot assess authority alignment or execution readiness.'
  }
  if (hasAuthorityIssue && hasAmbiguity) {
    return 'Is the board being asked to approve the decision, ratify one already made, or receive information after management has already acted?'
  }
  if (!hasDeadline) {
    return 'Is there a specific deadline or time pressure? Is it statutory, contractual, or self-imposed?'
  }
  if (hasEvidenceGap) {
    return 'What evidence is missing that would change this decision?'
  }
  if (hasCashConstraint) {
    return 'What is the binding constraint — cash, time, authority, or capability?'
  }
  if (hasAmbiguity) {
    return 'What makes the ideal path impossible?'
  }

  return null
}

// ─── Build next admissible move ──────────────────────────────────────────────

function buildNextAdmissibleMove(context: LiveSessionContext, simulation: SimulationGateResult): string {
  // If there's a preferred path, use its next move
  if (simulation.preferredPathId) {
    const preferred = simulation.paths.find(p => p.assumptionId === simulation.preferredPathId)
    if (preferred?.nextAdmissibleMove) return preferred.nextAdmissibleMove
  }

  // Fallback: first path that allows proceeding
  const proceedable = simulation.paths.find(p => p.shouldProceed)
  if (proceedable?.nextAdmissibleMove) return proceedable.nextAdmissibleMove

  // Fallback: first path's next move
  const firstPath = simulation.paths[0]
  if (firstPath?.nextAdmissibleMove) return firstPath.nextAdmissibleMove

  // Last resort
  return 'Gather additional evidence or clarify the decision parameters, then re-submit.'
}

// ─── Determine if refusal is needed ──────────────────────────────────────────

function shouldRefuse(context: LiveSessionContext, simulation: SimulationGateResult): boolean {
  // Refuse if all paths refuse
  if (simulation.paths.length > 0 && simulation.paths.every(p => !p.shouldProceed)) {
    return true
  }

  // Refuse if no owner after two turns
  if (context.turns.filter(t => t.role === 'user').length >= 2 && context.actors.length === 0) {
    return true
  }

  // Refuse if low-stakes with no hidden stakes — no need for further analysis
  if (context.currentSummary.toLowerCase().includes('low-stakes') && context.hiddenStakes.length === 0) {
    return false
  }

  return false
}

function buildRefusalReason(context: LiveSessionContext, simulation: SimulationGateResult): string | undefined {
  if (!shouldRefuse(context, simulation)) return undefined

  if (context.turns.filter(t => t.role === 'user').length >= 2 && context.actors.length === 0) {
    return 'After multiple attempts, no accountable decision owner has been identified. The system cannot responsibly proceed without knowing who owns the decision.'
  }

  const refusalPaths = simulation.paths.filter(p => !p.shouldProceed && p.refusalReason)
  const firstRefusal = refusalPaths[0]
  if (firstRefusal?.refusalReason) {
    return firstRefusal.refusalReason
  }

  return 'The system cannot responsibly produce a recommendation from the available evidence.'
}

// ─── Main gate function ──────────────────────────────────────────────────────

export function runSynthesisGate(params: {
  context: LiveSessionContext
  simulation: SimulationGateResult
}): SynthesisGateResult {
  const { context, simulation } = params

  const situationRead = buildSituationRead(context)
  const whatChanged = buildWhatChanged(context)
  const simulationSummary = buildSimulationSummary(simulation)
  const currentRisk = assessRisk(context)
  const nextQuestion = buildNextQuestion(context)
  const nextAdmissibleMove = buildNextAdmissibleMove(context, simulation)
  const refusing = shouldRefuse(context, simulation)
  const refusalReason = buildRefusalReason(context, simulation)

  return {
    situationRead,
    whatChanged,
    simulationSummary,
    currentRisk,
    nextQuestion,
    nextAdmissibleMove,
    shouldRefuse: refusing,
    refusalReason,
  }
}
