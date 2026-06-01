/**
 * lib/kernel/simulation-gate.ts — Simulation Gate
 *
 * Runs structured "what if" checks against the current live session context.
 * Deterministic and bounded — not freeform AI speculation.
 *
 * Generates up to three plausible assumption paths based on the case state,
 * then evaluates each for likely outcome, risk shift, and next admissible move.
 */

import type { LiveSessionContext } from '@/lib/kernel/live-session-context'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SimulationAssumption = {
  id: string
  label: string
  description: string
}

export type SimulationPath = {
  assumptionId: string
  assumptionLabel: string
  likelyOutcome: string
  riskShift: 'LOWER' | 'UNCHANGED' | 'HIGHER' | 'UNKNOWN'
  affectedSignals: string[]
  nextAdmissibleMove: string
  shouldProceed: boolean
  refusalReason?: string
}

export type SimulationGateResult = {
  paths: SimulationPath[]
  preferredPathId?: string
  comparisonSummary: string
}

// ─── Default assumption generation ───────────────────────────────────────────

function generateDefaultAssumptions(context: LiveSessionContext): SimulationAssumption[] {
  const assumptions: SimulationAssumption[] = []
  const signalKeys = context.signals.map(s => s.key)
  const hasOwner = context.actors.length > 0
  const hasDeadline = signalKeys.some(k => k.includes('deadline') || k.includes('timing'))
  const hasAuthorityIssue = signalKeys.some(k => k.includes('authority'))
  const hasEvidenceGap = signalKeys.some(k => k.includes('evidence'))
  const hasCashConstraint = signalKeys.some(k => k.includes('cash') || k.includes('constraint'))
  const hasHiddenStakes = context.hiddenStakes.length > 0
  const hasAmbiguity = context.ambiguities.length > 0

  // Assumption 1: Proceed with current evidence
  if (hasOwner) {
    assumptions.push({
      id: 'proceed-current',
      label: 'Proceed with current evidence',
      description: hasEvidenceGap
        ? 'Proceed with the decision using the evidence already available, acknowledging the gaps.'
        : 'Proceed with the decision as currently framed.',
    })
  }

  // Assumption 2: Delay to resolve evidence gap
  if (hasEvidenceGap || hasAmbiguity) {
    const delayLabel = hasDeadline ? 'Delay to resolve evidence gap (if deadline allows)' : 'Delay to resolve evidence gap'
    assumptions.push({
      id: 'delay-evidence',
      label: delayLabel,
      description: hasDeadline
        ? 'Resolve the evidence gaps before proceeding, if the deadline can absorb the delay.'
        : 'Resolve the evidence gaps before proceeding with the decision.',
    })
  }

  // Assumption 3: Escalate to authority holder
  if (hasAuthorityIssue || hasHiddenStakes || !hasOwner) {
    assumptions.push({
      id: 'escalate-authority',
      label: 'Escalate to the apparent authority holder',
      description: !hasOwner
        ? 'Identify and escalate to the person or body with authority to decide.'
        : 'Escalate to the confirmed authority holder for formal decision.',
    })
  }

  // Assumption 4: Cash-constrained minimum viable path
  if (hasCashConstraint && hasDeadline) {
    assumptions.push({
      id: 'minimum-viable',
      label: 'Find the minimum viable path under constraint',
      description: 'Identify the cheapest or fastest path that satisfies the binding constraint without exceeding available resources.',
    })
  }

  return assumptions.slice(0, 3)
}

// ─── Evaluate a single path ──────────────────────────────────────────────────

function evaluatePath(
  assumption: SimulationAssumption,
  context: LiveSessionContext,
): SimulationPath {
  const signalKeys = context.signals.map(s => s.key)
  const hasOwner = context.actors.length > 0
  const hasDeadline = signalKeys.some(k => k.includes('deadline') || k.includes('timing'))
  const hasAuthorityIssue = signalKeys.some(k => k.includes('authority'))
  const hasEvidenceGap = signalKeys.some(k => k.includes('evidence'))
  const hasCashConstraint = signalKeys.some(k => k.includes('cash') || k.includes('constraint'))
  const hasHiddenStakes = context.hiddenStakes.length > 0
  const hasPenaltyExposure = signalKeys.some(k => k.includes('penalty') || k.includes('consequence'))

  switch (assumption.id) {
    case 'proceed-current': {
      if (!hasOwner) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'The decision will not resolve because no accountable owner has been identified.',
          riskShift: 'HIGHER',
          affectedSignals: signalKeys.filter(k => k.includes('authority') || k.includes('evidence')),
          nextAdmissibleMove: 'Identify who owns this decision before proceeding further.',
          shouldProceed: false,
          refusalReason: 'No accountable decision owner identified.',
        }
      }
      if (hasEvidenceGap && hasPenaltyExposure) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'Proceeding without resolving the evidence gap risks a decision that cannot withstand scrutiny, especially given the penalty exposure.',
          riskShift: 'HIGHER',
          affectedSignals: signalKeys.filter(k => k.includes('evidence') || k.includes('penalty')),
          nextAdmissibleMove: 'Resolve the evidence gap before committing to a course of action.',
          shouldProceed: false,
          refusalReason: 'Evidence gap combined with penalty exposure makes proceeding inadvisable.',
        }
      }
      if (hasEvidenceGap) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'The decision can proceed but the evidence gap will need to be addressed before escalation.',
          riskShift: 'UNCHANGED',
          affectedSignals: signalKeys.filter(k => k.includes('evidence')),
          nextAdmissibleMove: 'Proceed with caution. Document the evidence gap and revisit before escalation.',
          shouldProceed: true,
        }
      }
      return {
        assumptionId: assumption.id,
        assumptionLabel: assumption.label,
        likelyOutcome: 'The decision can proceed with the available evidence and identified owner.',
        riskShift: 'UNCHANGED',
        affectedSignals: [],
        nextAdmissibleMove: 'Proceed with the current evidence base.',
        shouldProceed: true,
      }
    }

    case 'delay-evidence': {
      if (hasDeadline && hasPenaltyExposure) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'Delay may reduce decision quality risk but increases deadline and penalty exposure. The window for safe delay may be narrow or closed.',
          riskShift: 'HIGHER',
          affectedSignals: signalKeys.filter(k => k.includes('deadline') || k.includes('penalty') || k.includes('timing')),
          nextAdmissibleMove: 'Determine whether the deadline can absorb the delay before choosing this path.',
          shouldProceed: false,
          refusalReason: 'Deadline and penalty exposure make delay risky without confirming the timeline first.',
        }
      }
      if (hasDeadline) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'Delay is possible only if the deadline can accommodate it. Without confirming the timeline, delay may create new pressure.',
          riskShift: 'UNCHANGED',
          affectedSignals: signalKeys.filter(k => k.includes('deadline') || k.includes('timing')),
          nextAdmissibleMove: 'Confirm whether the deadline is fixed or negotiable before deciding to delay.',
          shouldProceed: true,
        }
      }
      return {
        assumptionId: assumption.id,
        assumptionLabel: assumption.label,
        likelyOutcome: 'Delay allows the evidence gap to be resolved, reducing decision quality risk.',
        riskShift: 'LOWER',
        affectedSignals: signalKeys.filter(k => k.includes('evidence')),
        nextAdmissibleMove: 'Use the delay to gather the missing evidence.',
        shouldProceed: true,
      }
    }

    case 'escalate-authority': {
      if (!hasOwner) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'Escalation cannot proceed because no authority holder has been identified to escalate to.',
          riskShift: 'UNCHANGED',
          affectedSignals: signalKeys.filter(k => k.includes('authority')),
          nextAdmissibleMove: 'Identify who holds the authority to decide before attempting escalation.',
          shouldProceed: false,
          refusalReason: 'No authority holder identified for escalation.',
        }
      }
      if (hasAuthorityIssue) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'Escalation to the authority holder may resolve the authority gap but could increase timing pressure if the authority holder is not immediately available.',
          riskShift: 'UNCHANGED',
          affectedSignals: signalKeys.filter(k => k.includes('authority')),
          nextAdmissibleMove: 'Confirm the authority holder\'s availability and timeline before escalating.',
          shouldProceed: true,
        }
      }
      return {
        assumptionId: assumption.id,
        assumptionLabel: assumption.label,
        likelyOutcome: 'Escalation to the authority holder provides formal decision cover but may slow execution.',
        riskShift: 'LOWER',
        affectedSignals: [],
        nextAdmissibleMove: 'Prepare the case summary and escalate to the identified authority holder.',
        shouldProceed: true,
      }
    }

    case 'minimum-viable': {
      if (hasCashConstraint && hasDeadline) {
        return {
          assumptionId: assumption.id,
          assumptionLabel: assumption.label,
          likelyOutcome: 'The minimum viable path exists but will require trade-offs between cost, quality, and timeline. The binding constraint is cash, not willingness.',
          riskShift: 'UNCHANGED',
          affectedSignals: signalKeys.filter(k => k.includes('cash') || k.includes('deadline')),
          nextAdmissibleMove: 'Identify the cheapest path that meets the deadline, then assess whether the quality trade-off is acceptable.',
          shouldProceed: true,
        }
      }
      return {
        assumptionId: assumption.id,
        assumptionLabel: assumption.label,
        likelyOutcome: 'A minimum viable path can be identified once the binding constraints are fully mapped.',
        riskShift: 'UNCHANGED',
        affectedSignals: [],
        nextAdmissibleMove: 'Map all binding constraints before identifying the minimum viable path.',
        shouldProceed: true,
      }
    }

    default:
      return {
        assumptionId: assumption.id,
        assumptionLabel: assumption.label,
        likelyOutcome: 'The consequences of this path cannot be reliably simulated with the available evidence.',
        riskShift: 'UNKNOWN',
        affectedSignals: [],
        nextAdmissibleMove: 'Gather additional evidence to enable a reliable simulation.',
        shouldProceed: false,
        refusalReason: 'Insufficient evidence to simulate this path.',
      }
  }
}

// ─── Build comparison summary ────────────────────────────────────────────────

function buildComparisonSummary(paths: SimulationPath[], context: LiveSessionContext): string {
  if (paths.length === 0) return 'No simulation paths could be generated from the current case state.'

  const parts: string[] = []
  for (const path of paths) {
    const riskLabel = path.riskShift === 'LOWER' ? 'risk may lower' :
      path.riskShift === 'HIGHER' ? 'risk may increase' :
      path.riskShift === 'UNCHANGED' ? 'risk stays the same' :
      'risk is unknown'
    const outcome: string = path.likelyOutcome ?? 'the consequences cannot be reliably predicted'
    const firstChar = outcome[0]?.toLowerCase() ?? ''
    const rest = outcome.slice(1)
    parts.push(`If you ${path.assumptionLabel.toLowerCase()}, ${riskLabel} because ${firstChar}${rest}`)
  }

  return parts.join('\n\n')
}

// ─── Select preferred path ───────────────────────────────────────────────────

function selectPreferredPath(paths: SimulationPath[]): string | undefined {
  // Prefer the path with lowest risk that allows proceeding
  const riskOrder: Record<string, number> = { LOWER: 0, UNCHANGED: 1, HIGHER: 2, UNKNOWN: 3 }
  const sorted = [...paths].sort((a, b) => {
    const riskDiff = (riskOrder[a.riskShift] ?? 99) - (riskOrder[b.riskShift] ?? 99)
    if (riskDiff !== 0) return riskDiff
    // Among same risk level, prefer paths that allow proceeding
    if (a.shouldProceed && !b.shouldProceed) return -1
    if (!a.shouldProceed && b.shouldProceed) return 1
    return 0
  })
  return sorted[0]?.assumptionId
}

// ─── Main gate function ──────────────────────────────────────────────────────

export function runSimulationGate(params: {
  context: LiveSessionContext
  assumptions?: SimulationAssumption[]
}): SimulationGateResult {
  const { context, assumptions } = params

  // Generate assumptions if none provided
  const activeAssumptions = assumptions ?? generateDefaultAssumptions(context)

  // Evaluate each path
  const paths: SimulationPath[] = activeAssumptions.map(a => evaluatePath(a, context))

  // Build comparison summary
  const comparisonSummary = buildComparisonSummary(paths, context)

  // Select preferred path
  const preferredPathId = selectPreferredPath(paths)

  return {
    paths,
    preferredPathId,
    comparisonSummary,
  }
}
