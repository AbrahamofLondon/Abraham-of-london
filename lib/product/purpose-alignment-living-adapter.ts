/**
 * lib/product/purpose-alignment-living-adapter.ts
 *
 * Converts Purpose Alignment result data into a LivingLayerViewModel-compatible shape.
 * This is the adapter for the free result surface.
 *
 * Rules:
 * - Never invent data. Where runtime data is unavailable, use conservative unresolved language.
 * - Evidence tier comes from deriveEvidenceTierFromInputs().
 * - Never claim verified evidence without VERIFIED confidence label.
 * - Never claim institutional memory.
 */

import type { LivingLayerViewModel, LivingLayerContinuityView } from '@/lib/kernel/living-layer-view-model'
import type { PurposeProfileResult } from '@/lib/alignment/types'
import { deriveEvidenceTierFromInputs } from '@/lib/product/evidence-tier-derivation'
import type { DecisionIntelligenceResult } from '@/lib/intelligence/decision-intelligence-orchestrator'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BuildPurposeAlignmentViewModelInput = {
  result: PurposeProfileResult
  contextAnswers: {
    avoidedDecision: string
    competingObligation: string
    consequence: string
    toleratedDysfunction?: string
    justifyingEvidence?: string
  }
  decisionIntelligence?: DecisionIntelligenceResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapConfidenceBand(band: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (band === 'SOVEREIGN' || band === 'ALIGNED') return 'HIGH'
  if (band === 'DRIFTING') return 'MEDIUM'
  return 'LOW'
}

// ─── Progress Derivation ─────────────────────────────────────────────────────

function deriveProgress(): LivingLayerViewModel['progress'] {
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

  // Purpose Alignment is a single diagnostic — stage 1 and 2 are completed
  const stagesCompleted = 2

  return {
    stagesCompleted,
    currentStage: stageLabels[Math.min(stagesCompleted, stageLabels.length - 1)] ?? 'Situation captured',
    nextStage: stageLabels[Math.min(stagesCompleted, stageLabels.length - 1) + 1] ?? 'Oversight memory',
    stageLabels: [...stageLabels],
  }
}

// ─── Evidence Derivation ─────────────────────────────────────────────────────

function deriveEvidence(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['evidence'] {
  const { result, contextAnswers } = input

  const derived = deriveEvidenceTierFromInputs({
    completedStages: ['purpose_alignment'],
    currentSessionSignals: [
      ...(result.primaryPattern ? [{ signal: result.primaryPattern.label }] : []),
      ...(result.contradictions?.map(c => ({ signal: c.evidence })) ?? []),
    ],
  })

  const gaps: string[] = []
  if (result.contradictions && result.contradictions.length > 0) {
    gaps.push(`${result.contradictions.length} contradiction(s) identified but not yet structurally verified`)
  }
  if (contextAnswers.justifyingEvidence) {
    gaps.push(`Evidence threshold for justified action is clearer: ${contextAnswers.justifyingEvidence.slice(0, 80)}`)
  } else {
    gaps.push('Evidence threshold for justified action remains unresolved')
  }
  gaps.push('Single diagnostic — combine with Constitutional or Team assessment for corroboration')

  return {
    level: derived.level,
    stagesCompleted: 1,
    summary: contextAnswers.justifyingEvidence
      ? `Evidence threshold identified: ${contextAnswers.justifyingEvidence.slice(0, 100)}.`
      : derived.summary,
    gaps,
  }
}

// ─── Governed Action Derivation ──────────────────────────────────────────────

function deriveGovernedAction(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['governedAction'] {
  const { result, contextAnswers, decisionIntelligence } = input

  // Use orchestrator output when available
  if (decisionIntelligence) {
    return {
      requiredAction: decisionIntelligence.nextAdmissibleMove,
      whyThisAction: decisionIntelligence.interpretedIssue,
      whatProvesProgress: 'Complete the first action within 14 days. The system tracks whether the alignment pattern improves or repeats.',
      whatHappensNext: decisionIntelligence.simulationPaths.length > 0
        ? `Preferred path: ${decisionIntelligence.preferredPath?.label ?? 'Further assessment needed'}.`
        : 'Constitutional Diagnostic reveals structural posture.',
      evidenceBasis: decisionIntelligence.evidenceBasis.length > 0
        ? decisionIntelligence.evidenceBasis.slice(0, 3)
        : ['Evidence basis remains limited to the current diagnostic result.'],
    }
  }

  // Fallback: existing derivation
  const requiredAction = result.firstAction ?? result.corrections[0] ?? 'Complete the Constitutional Diagnostic to test whether this pattern has structural consequences.'

  let whyThisAction = ''
  if (result.primaryPattern?.reasons?.[0]) {
    whyThisAction = result.primaryPattern.reasons[0]
  } else if (contextAnswers.avoidedDecision) {
    whyThisAction = `The avoided decision "${contextAnswers.avoidedDecision}" is the most likely source of the pattern.`
  }
  if (contextAnswers.toleratedDysfunction) {
    const toleratedSuffix = whyThisAction ? ' Additionally, a tolerated dysfunction was detected.' : ''
    whyThisAction = `The system detected a tolerated dysfunction: ${contextAnswers.toleratedDysfunction.slice(0, 100)}. This may be sustaining the current drift.${toleratedSuffix}`
  }

  const evidenceBasisParts: string[] = []
  if (result.primaryPattern) {
    evidenceBasisParts.push(`Detected pattern: ${result.primaryPattern.label}`)
  }
  if (contextAnswers.avoidedDecision) {
    evidenceBasisParts.push('Stated avoided decision')
  }
  if (result.contradictions && result.contradictions.length > 0) {
    evidenceBasisParts.push(`${result.contradictions.length} contradiction(s) identified`)
  }
  if (contextAnswers.justifyingEvidence) {
    evidenceBasisParts.push('Evidence threshold for action identified')
  }
  if (contextAnswers.toleratedDysfunction) {
    evidenceBasisParts.push('Tolerated dysfunction surfaced')
  }

  return {
    requiredAction,
    whyThisAction,
    whatProvesProgress: 'Complete the first action within 14 days. The system tracks whether the alignment pattern improves or repeats.',
    whatHappensNext: 'Constitutional Diagnostic reveals structural posture. Team Assessment reveals execution divergence.',
    evidenceBasis: evidenceBasisParts.length > 0
      ? [`Recommended from: ${evidenceBasisParts.join('; ')}.`]
      : ['Evidence basis remains limited to the current diagnostic result.'],
  }
}

// ─── Advantage Derivation ────────────────────────────────────────────────────

function deriveAdvantage(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['advantage'] {
  const { result, contextAnswers, decisionIntelligence } = input
  const advantages: string[] = []

  // Use orchestrator findings when available
  if (decisionIntelligence) {
    for (const finding of decisionIntelligence.findings.slice(0, 3)) {
      advantages.push(`${finding.label}: ${finding.summary.slice(0, 100)}`)
    }
    if (decisionIntelligence.primaryContradiction) {
      advantages.push(`Core contradiction identified: ${decisionIntelligence.primaryContradiction.slice(0, 80)}`)
    }
  }

  // Always add result-specific advantages
  if (result.primaryPattern) {
    advantages.push(`Internal authority conflict named: ${result.primaryPattern.label}`)
  }
  if (contextAnswers.avoidedDecision) {
    advantages.push(`Avoided decision surfaced: ${contextAnswers.avoidedDecision}`)
  }
  if (contextAnswers.competingObligation) {
    advantages.push(`Competing obligation identified: ${contextAnswers.competingObligation}`)
  }
  if (contextAnswers.toleratedDysfunction) {
    advantages.push(`Tolerated dysfunction surfaced: ${contextAnswers.toleratedDysfunction.slice(0, 80)}`)
  }
  if (contextAnswers.justifyingEvidence) {
    advantages.push(`Evidence threshold for action identified: ${contextAnswers.justifyingEvidence.slice(0, 80)}`)
  }

  const confidenceBand = decisionIntelligence
    ? (decisionIntelligence.confidence === 'HIGH' ? 'HIGH' : decisionIntelligence.confidence === 'MEDIUM' ? 'MEDIUM' : 'LOW')
    : mapConfidenceBand(result.coherenceBand)

  const limitations: string[] = [
    'Purpose alignment is self-assessed. Combine with team or constitutional assessment for structural validation.',
  ]

  return {
    advantages: advantages.length > 0 ? advantages : ['Pattern identified from self-reported inputs.'],
    confidenceBand,
    limitations,
  }
}

// ─── Next Layer Derivation ───────────────────────────────────────────────────

function deriveNextLayer(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['nextLayer'] {
  const { result, contextAnswers, decisionIntelligence } = input

  // Derive real unresolved items — prefer orchestrator when available
  const unresolvedItems: string[] = []

  if (decisionIntelligence) {
    unresolvedItems.push(...decisionIntelligence.unresolvedItems.slice(0, 4))
  }

  // Always add result-specific unresolved items
  if (result.contradictions && result.contradictions.length > 0) {
    unresolvedItems.push(`${result.contradictions.length} contradiction(s) identified but not yet structurally verified`)
  }
  if (result.corrections && result.corrections.length > 0) {
    unresolvedItems.push(...result.corrections.slice(0, 2))
  }
  if (!result.firstAction) {
    unresolvedItems.push('First correction action not yet determined')
  }
  if (contextAnswers.toleratedDysfunction) {
    unresolvedItems.push('Tolerated dysfunction may be sustaining current drift')
  }
  if (!contextAnswers.justifyingEvidence) {
    unresolvedItems.push('Evidence threshold for justified action remains unresolved')
  }

  return {
    currentStage: 'Purpose Alignment',
    nextStage: 'Constitutional Diagnostic',
    unlockReason: 'Whether this internal conflict has structural consequences — governance posture, authority clarity, and institutional readiness.',
    unresolvedItems: [...new Set(unresolvedItems)].slice(0, 6),
  }
}

// ─── Memory Derivation ───────────────────────────────────────────────────────

function deriveMemory(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['memory'] {
  const { result, contextAnswers } = input
  const entries: LivingLayerViewModel['memory']['entries'] = []

  entries.push({
    label: 'Purpose Alignment completed',
    summary: `Coherence band: ${result.coherenceBand ?? '—'}. Pattern: ${result.primaryPattern?.label ?? 'Pattern identified'}.`,
    timestamp: result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '',
  })

  if (contextAnswers.avoidedDecision) {
    entries.push({
      label: 'Avoided decision surfaced',
      summary: contextAnswers.avoidedDecision.length > 80 ? contextAnswers.avoidedDecision.slice(0, 80) + '…' : contextAnswers.avoidedDecision,
      timestamp: '',
    })
  }

  if (contextAnswers.competingObligation) {
    entries.push({
      label: 'Competing obligation identified',
      summary: contextAnswers.competingObligation.length > 80 ? contextAnswers.competingObligation.slice(0, 80) + '…' : contextAnswers.competingObligation,
      timestamp: '',
    })
  }

  if (contextAnswers.toleratedDysfunction) {
    entries.push({
      label: 'Tolerated dysfunction surfaced',
      summary: contextAnswers.toleratedDysfunction.length > 80 ? contextAnswers.toleratedDysfunction.slice(0, 80) + '…' : contextAnswers.toleratedDysfunction,
      timestamp: '',
    })
  }

  if (contextAnswers.justifyingEvidence) {
    entries.push({
      label: 'Evidence threshold identified',
      summary: contextAnswers.justifyingEvidence.length > 80 ? contextAnswers.justifyingEvidence.slice(0, 80) + '…' : contextAnswers.justifyingEvidence,
      timestamp: '',
    })
  }

  return {
    entries,
    dominantPattern: result.primaryPattern?.label ?? null,
    escalationTrend: result.coherenceBand === 'FRAGMENTED' ? 'rising' : result.coherenceBand === 'DRIFTING' ? 'rising' : null,
  }
}

// ─── Changes Derivation ──────────────────────────────────────────────────────

function deriveChanges(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['changes'] {
  const { result, contextAnswers, decisionIntelligence } = input
  const deltas: LivingLayerViewModel['changes']['deltas'] = []
  const newEvidence: string[] = []

  // Use orchestrator findings when available
  if (decisionIntelligence) {
    for (const finding of decisionIntelligence.findings.slice(0, 3)) {
      deltas.push({
        label: finding.label,
        after: finding.summary.slice(0, 80),
        significance: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      })
    }
    if (decisionIntelligence.primaryContradiction) {
      newEvidence.push(`Contradiction: ${decisionIntelligence.primaryContradiction.slice(0, 100)}`)
    }
    newEvidence.push(...decisionIntelligence.evidenceBasis.slice(0, 2))
  }

  // Always add result-specific changes
  if (result.contradictions && result.contradictions.length > 0) {
    deltas.push({
      label: 'Contradictions',
      after: `${result.contradictions.length} contradiction(s) identified`,
      significance: 'HIGH',
    })
  }

  if (result.primaryPattern) {
    newEvidence.push(`Primary pattern: ${result.primaryPattern.label}`)
    if (result.primaryPattern.consequence) {
      newEvidence.push(`Consequence: ${result.primaryPattern.consequence}`)
    }
  }

  // New enrichment fields
  if (contextAnswers.toleratedDysfunction) {
    newEvidence.push(`Tolerated dysfunction: ${contextAnswers.toleratedDysfunction.slice(0, 80)}`)
  }
  if (contextAnswers.justifyingEvidence) {
    newEvidence.push(`Evidence threshold: ${contextAnswers.justifyingEvidence.slice(0, 80)}`)
  }

  return { deltas, newEvidence }
}

// ─── Review Derivation ───────────────────────────────────────────────────────

function deriveReview(input: BuildPurposeAlignmentViewModelInput): LivingLayerViewModel['review'] {
  const { result } = input
  const isHighSeverity = result.severity === 'high' || result.severity === 'critical'
  const hasContradictions = (result.contradictions?.length ?? 0) > 0

  const triggers: string[] = []
  if (isHighSeverity) triggers.push('high severity pattern detected')
  if (hasContradictions) triggers.push('contradictions identified')

  const required = triggers.length > 0

  let reason: string | null = null
  if (required) {
    reason = 'Human review may be appropriate because this case involves unresolved authority, consequence, or evidence questions that should not be collapsed into a simple automated answer.'
    if (triggers.length > 0) {
      reason += ` (Triggers: ${triggers.join('; ')}.)`
    }
  }

  return { required, reason }
}

// ─── Continuity Derivation ───────────────────────────────────────────────────

function deriveContinuity(input: BuildPurposeAlignmentViewModelInput): LivingLayerContinuityView {
  const { contextAnswers, decisionIntelligence } = input

  let continuityStatement = 'This is a single-diagnostic assessment. Completing additional diagnostics strengthens the evidence base and enables continuity tracking.'

  if (decisionIntelligence?.primaryContradiction) {
    continuityStatement = `The orchestrator identified a core contradiction: ${decisionIntelligence.primaryContradiction.slice(0, 120)}. This is a single-diagnostic assessment — completing additional diagnostics strengthens the evidence base.`
  } else if (contextAnswers.toleratedDysfunction) {
    continuityStatement = `A tolerated dysfunction was identified: ${contextAnswers.toleratedDysfunction.slice(0, 80)}. This may be sustaining current drift. Completing additional diagnostics strengthens the evidence base.`
  } else if (contextAnswers.justifyingEvidence) {
    continuityStatement = `The evidence threshold for responsible action is now clearer: ${contextAnswers.justifyingEvidence.slice(0, 80)}. Completing additional diagnostics strengthens the evidence base.`
  }

  return {
    sessionContinuity: {
      status: 'active_session',
      summary: 'This case is being tracked within the current session. Repeated actors and signals will be recognised while this session remains active.',
    },
    carriedForwardCase: {
      available: false,
      summary: 'No prior diagnostic result is available in this browser session.',
    },
    signalContinuity: decisionIntelligence
      ? decisionIntelligence.signalContinuity.map(s => ({
          signal: s.signal,
          status: s.status as any,
          summary: s.summary,
        }))
      : [],
    continuityStatement,
  }
}

// ─── Main Adapter Function ───────────────────────────────────────────────────

export function buildPurposeAlignmentViewModel(
  input: BuildPurposeAlignmentViewModelInput,
): LivingLayerViewModel {
  return {
    progress: deriveProgress(),
    evidence: deriveEvidence(input),
    governedAction: deriveGovernedAction(input),
    advantage: deriveAdvantage(input),
    nextLayer: deriveNextLayer(input),
    memory: deriveMemory(input),
    changes: deriveChanges(input),
    review: deriveReview(input),
    continuity: deriveContinuity(input),
  }
}
