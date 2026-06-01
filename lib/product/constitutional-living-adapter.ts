/**
 * lib/product/constitutional-living-adapter.ts
 *
 * Converts Constitutional Diagnostic result data into a LivingLayerViewModel.
 *
 * Derives:
 * - authority type and posture
 * - route decision (STRATEGY/DIAGNOSTIC/REJECT)
 * - failure modes and restrictions
 * - next admissible move
 * - evidence gaps
 * - unresolved mandate/authority issues
 *
 * Rules:
 * - Never fabricate outputs.
 * - Evidence tier uses deriveEvidenceTierFromInputs().
 * - Stage contributions use deriveStageContribution().
 * - Unresolved items must be real.
 * - No verified claim without verified evidence.
 */

import type { LivingLayerViewModel, LivingLayerContinuityView } from '@/lib/kernel/living-layer-view-model'
import { deriveEvidenceTierFromInputs } from '@/lib/product/evidence-tier-derivation'
import type { ConstitutionalStructuralInput } from '@/lib/intelligence/constitutional-structural-mapping'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConstitutionalReport = {
  authorityScore: number
  coherenceScore: number
  pressureScore: number
  frictionScore: number
  trustScore: number
  seriousnessScore: number
  governanceDiscipline: number
  interventionReadiness: number
  narrativeCoherence: number
  failureModeCount: number
  failureModeSeverity: number
  authorityType: string
  posture: string
  readinessTier: string
  mandateFit: boolean
  summary: string
  keyFindings: string[]
  answeredCount: number
  totalQuestions: number
  completionPercent: number
}

export type ConstitutionalDecision = {
  route: 'REJECT' | 'DIAGNOSTIC' | 'STRATEGY'
  confidence: number
  disqualifiersTriggered: string[]
  recommendedInterventions: string[]
  rationale: string[]
  escalationAllowed: boolean
}

export type ConstitutionalRouteSummary = {
  route: string
  title: string
  description: string
  href: string
  cta: string
  tone: 'neutral' | 'amber' | 'emerald'
}

export type BuildConstitutionalLivingViewModelInput = {
  report: ConstitutionalReport
  decision: ConstitutionalDecision
  routeSummary: ConstitutionalRouteSummary
  userAnswers?: Record<string, unknown>
  /** Structural fields mapped from constitutional answers — enriches output when available */
  constitutionalStructural?: ConstitutionalStructuralInput
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapConfidence(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 0.7) return 'HIGH'
  if (score >= 0.5) return 'MEDIUM'
  return 'LOW'
}

function confidenceLabel(score: number): string {
  if (score >= 0.7) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
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

  // Constitutional Diagnostic completes stages 1-3
  const stagesCompleted = 3

  return {
    stagesCompleted,
    currentStage: stageLabels[Math.min(stagesCompleted, stageLabels.length - 1)] ?? 'Situation captured',
    nextStage: stageLabels[Math.min(stagesCompleted, stageLabels.length - 1) + 1] ?? 'Oversight memory',
    stageLabels: [...stageLabels],
  }
}

// ─── Evidence Derivation ─────────────────────────────────────────────────────

function deriveEvidence(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['evidence'] {
  const { report, constitutionalStructural } = input

  const derived = deriveEvidenceTierFromInputs({
    completedStages: ['constitutional'],
    currentSessionSignals: [
      { signal: `Authority type: ${report.authorityType}` },
      { signal: `Posture: ${report.posture}` },
      { signal: `Readiness: ${report.readinessTier}` },
      ...report.keyFindings.map(f => ({ signal: f })),
    ],
  })

  const gaps: string[] = []
  if (!report.mandateFit) {
    gaps.push('Mandate fit is not confirmed — authority may not align with stated purpose')
  }
  if (report.failureModeCount > 0) {
    gaps.push(`${report.failureModeCount} failure mode(s) identified but not yet structurally verified`)
  }
  if (constitutionalStructural?.approvingAuthority) {
    gaps.push(`Approving authority identified: ${constitutionalStructural.approvingAuthority}`)
  }
  if (constitutionalStructural?.mandateSource) {
    gaps.push(`Mandate source: ${constitutionalStructural.mandateSource}`)
  }
  if (constitutionalStructural?.currentRoute) {
    gaps.push(`Current route: ${constitutionalStructural.currentRoute}`)
  }
  if (constitutionalStructural?.failureMode) {
    gaps.push(`Failure mode: ${constitutionalStructural.failureMode}`)
  }
  if (constitutionalStructural?.repairCondition) {
    gaps.push(`Repair condition: ${constitutionalStructural.repairCondition}`)
  }
  gaps.push('Single diagnostic — combine with Team or Enterprise assessment for corroboration')

  return {
    level: derived.level,
    stagesCompleted: 1,
    summary: derived.summary,
    gaps,
  }
}

// ─── Governed Action Derivation ──────────────────────────────────────────────

function deriveGovernedAction(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['governedAction'] {
  const { decision, routeSummary, constitutionalStructural } = input

  // Determine required action — failureMode and repairCondition influence the action
  let requiredAction = decision.recommendedInterventions[0] ?? routeSummary.description

  // If failureMode is present, adjust the required action to address it
  if (constitutionalStructural?.failureMode && !decision.recommendedInterventions[0]) {
    const failureModeLower = constitutionalStructural.failureMode.toLowerCase()
    if (failureModeLower.includes('ownership') || failureModeLower.includes('owner')) {
      requiredAction = 'Confirm decision ownership before proceeding with the current route.'
    } else if (failureModeLower.includes('approval') || failureModeLower.includes('authority')) {
      requiredAction = 'Resolve the approval authority gap before proceeding.'
    } else if (failureModeLower.includes('evidence')) {
      requiredAction = 'Strengthen the evidence base before committing to a course of action.'
    } else {
      requiredAction = `Address the identified failure mode: ${constitutionalStructural.failureMode}.`
    }
  }

  // If repairCondition is present, it should drive the governed action
  if (constitutionalStructural?.repairCondition) {
    requiredAction = constitutionalStructural.repairCondition
  }

  let whyThisAction = ''
  if (decision.rationale[0]) {
    whyThisAction = decision.rationale[0]
  }
  if (constitutionalStructural?.failureMode && !whyThisAction) {
    whyThisAction = `The primary failure mode is ${constitutionalStructural.failureMode}. Address this before proceeding with the current route.`
  }
  if (constitutionalStructural?.repairCondition && !whyThisAction) {
    whyThisAction = `A repair condition has been identified: ${constitutionalStructural.repairCondition}. This must be confirmed or resolved before the decision can responsibly proceed.`
  }

  // Derive evidence basis from constitutional result + structural input
  const evidenceBasisParts: string[] = []
  evidenceBasisParts.push(`Route: ${decision.route}`)
  evidenceBasisParts.push(`Confidence: ${Math.round(decision.confidence * 100)}%`)
  if (decision.disqualifiersTriggered.length > 0) {
    evidenceBasisParts.push(`${decision.disqualifiersTriggered.length} disqualifier(s) triggered`)
  }
  if (constitutionalStructural?.approvingAuthority) {
    evidenceBasisParts.push('Approving authority identified')
  }
  if (constitutionalStructural?.failureMode) {
    evidenceBasisParts.push(`Failure mode: ${constitutionalStructural.failureMode}`)
  }
  if (constitutionalStructural?.repairCondition) {
    evidenceBasisParts.push(`Repair condition: ${constitutionalStructural.repairCondition}`)
  }

  return {
    requiredAction,
    whyThisAction,
    whatProvesProgress: 'Complete the recommended next assessment within 14 days. The system tracks whether the structural pattern improves or repeats.',
    whatHappensNext: routeSummary.description,
    evidenceBasis: [`Recommended from constitutional assessment: ${evidenceBasisParts.join('; ')}.`],
  }
}

// ─── Advantage Derivation ────────────────────────────────────────────────────

function deriveAdvantage(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['advantage'] {
  const { report, decision } = input
  const advantages: string[] = []

  advantages.push(`Constitutional route classified: ${decision.route} with ${Math.round(decision.confidence * 100)}% confidence`)
  if (decision.disqualifiersTriggered.length > 0) {
    advantages.push(`Structural risks identified: ${decision.disqualifiersTriggered.slice(0, 2).join(', ')}`)
  }
  if (decision.recommendedInterventions.length > 0) {
    advantages.push(`Interventions mapped: ${decision.recommendedInterventions.length} governed interventions identified`)
  }

  const confidenceBand = mapConfidence(decision.confidence)

  const limitations: string[] = [
    'Constitutional reading is based on your responses — team or enterprise validation strengthens evidence.',
  ]
  if (decision.disqualifiersTriggered.length > 0) {
    limitations.push('Active disqualifiers may affect route accuracy.')
  }

  return {
    advantages: advantages.length > 0 ? advantages : ['Constitutional posture assessed.'],
    confidenceBand,
    limitations,
  }
}

// ─── Next Layer Derivation ───────────────────────────────────────────────────

function deriveNextLayer(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['nextLayer'] {
  const { report, decision, constitutionalStructural } = input

  // Determine next stage based on route
  const isStrategyRoute = decision.route === 'STRATEGY'
  const nextStageName = isStrategyRoute ? 'Executive Reporting' : 'Team Assessment'
  let nextStageDetects = isStrategyRoute
    ? 'Board-grade consequence: financial exposure, priority stack, required interventions with confidence bands.'
    : 'Whether your team perceives the same structural tensions you identified.'

  // Enhance nextStageDetects with currentRoute and mandateSource when available
  if (constitutionalStructural?.currentRoute) {
    const routeLower = constitutionalStructural.currentRoute.toLowerCase()
    if (routeLower.includes('informal') || routeLower.includes('workaround')) {
      nextStageDetects += ' The current route is informal — formalising it may reduce risk.'
    } else if (routeLower.includes('board') || routeLower.includes('executive')) {
      nextStageDetects += ' The current route involves board or executive review, which supports governance discipline.'
    } else if (routeLower.includes('regulatory') || routeLower.includes('legal')) {
      nextStageDetects += ' The current route involves regulatory or legal review — compliance context is present.'
    } else if (routeLower.includes('not clear')) {
      nextStageDetects += ' The current route is unclear — route clarification should be prioritised.'
    }
  }

  if (constitutionalStructural?.mandateSource) {
    nextStageDetects += ` Mandate source identified: ${constitutionalStructural.mandateSource}.`
  }

  // Derive real unresolved items
  const unresolvedItems: string[] = []

  if (!report.mandateFit) {
    unresolvedItems.push('Authority holder not confirmed — mandate may not align with stated purpose')
  }
  if (constitutionalStructural?.decisionOwner && !constitutionalStructural?.approvingAuthority) {
    unresolvedItems.push('Approving authority not confirmed')
  }
  if (constitutionalStructural?.blockingAuthority) {
    unresolvedItems.push(`Blocking authority identified: ${constitutionalStructural.blockingAuthority}`)
  }
  if (!constitutionalStructural?.mandateSource && report.mandateFit === false) {
    unresolvedItems.push('Mandate source not confirmed')
  }
  if (decision.disqualifiersTriggered.length > 0) {
    unresolvedItems.push(...decision.disqualifiersTriggered.slice(0, 3))
  }
  if (decision.route === 'REJECT') {
    unresolvedItems.push('Route restricted — evidence insufficient for escalation')
  }
  if (report.failureModeCount > 0) {
    unresolvedItems.push(`${report.failureModeCount} failure mode(s) require resolution before escalation`)
  }
  if (constitutionalStructural?.repairCondition) {
    unresolvedItems.push(`Repair condition: ${constitutionalStructural.repairCondition}`)
  }

  return {
    currentStage: 'Constitutional Diagnostic',
    nextStage: nextStageName,
    unlockReason: nextStageDetects,
    unresolvedItems,
  }
}

// ─── Memory Derivation ───────────────────────────────────────────────────────

function deriveMemory(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['memory'] {
  const { report, decision } = input
  const entries: LivingLayerViewModel['memory']['entries'] = []

  entries.push({
    label: 'Constitutional Diagnostic completed',
    summary: `Route: ${decision.route}. Authority: ${report.authorityType}. Posture: ${report.posture}. Readiness: ${report.readinessTier}.`,
    timestamp: '',
  })

  if (report.keyFindings.length > 0) {
    for (const finding of report.keyFindings.slice(0, 2)) {
      entries.push({
        label: 'Key finding',
        summary: finding.length > 80 ? finding.slice(0, 77) + '...' : finding,
        timestamp: '',
      })
    }
  }

  return {
    entries,
    dominantPattern: report.posture ? `Posture: ${report.posture}` : null,
    escalationTrend: decision.route === 'STRATEGY' ? 'rising' : decision.route === 'REJECT' ? 'stable' : null,
  }
}

// ─── Changes Derivation ──────────────────────────────────────────────────────

function deriveChanges(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['changes'] {
  const { report, decision, constitutionalStructural } = input
  const deltas: LivingLayerViewModel['changes']['deltas'] = []
  const newEvidence: string[] = []

  deltas.push({
    label: 'Constitutional route',
    after: `${decision.route} (${Math.round(decision.confidence * 100)}% confidence)`,
    significance: 'HIGH',
  })

  if (report.failureModeCount > 0) {
    deltas.push({
      label: 'Failure modes',
      after: `${report.failureModeCount} identified (severity: ${report.failureModeSeverity})`,
      significance: 'MEDIUM',
    })
  }

  newEvidence.push(`Authority type: ${report.authorityType}`)
  newEvidence.push(`Posture: ${report.posture}`)
  newEvidence.push(`Readiness: ${report.readinessTier}`)

  if (constitutionalStructural?.approvingAuthority) {
    newEvidence.push(`Approving authority: ${constitutionalStructural.approvingAuthority}`)
  }
  if (constitutionalStructural?.failureMode) {
    newEvidence.push(`Failure mode: ${constitutionalStructural.failureMode}`)
  }
  if (constitutionalStructural?.repairCondition) {
    newEvidence.push(`Repair condition: ${constitutionalStructural.repairCondition}`)
  }

  return { deltas, newEvidence }
}

// ─── Review Derivation ───────────────────────────────────────────────────────

function deriveReview(input: BuildConstitutionalLivingViewModelInput): LivingLayerViewModel['review'] {
  const { decision, constitutionalStructural } = input
  const isRejected = decision.route === 'REJECT'
  const hasDisqualifiers = decision.disqualifiersTriggered.length > 0
  const lowConfidence = decision.confidence < 0.5
  const hasBlockingAuthority = !!constitutionalStructural?.blockingAuthority
  const missingMandate = !constitutionalStructural?.mandateSource

  const triggers: string[] = []
  if (isRejected) triggers.push('route rejected — insufficient evidence')
  if (hasDisqualifiers) triggers.push('disqualifiers triggered')
  if (lowConfidence) triggers.push('low confidence in route classification')
  if (hasBlockingAuthority) triggers.push('blocking authority identified')
  if (missingMandate) triggers.push('mandate source not confirmed')

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

function deriveContinuity(input: BuildConstitutionalLivingViewModelInput): LivingLayerContinuityView {
  const { constitutionalStructural } = input

  let continuityStatement = 'This is a single-diagnostic assessment. Completing additional diagnostics strengthens the evidence base and enables continuity tracking.'

  if (constitutionalStructural?.repairCondition) {
    continuityStatement = `Repair condition identified: ${constitutionalStructural.repairCondition.slice(0, 100)}. This must be confirmed or resolved before the decision can responsibly proceed. Completing additional diagnostics strengthens the evidence base.`
  } else if (constitutionalStructural?.failureMode) {
    continuityStatement = `Primary failure mode: ${constitutionalStructural.failureMode}. This affects the next admissible move and should be addressed before escalation. Completing additional diagnostics strengthens the evidence base.`
  } else if (constitutionalStructural?.currentRoute) {
    continuityStatement = `Current route: ${constitutionalStructural.currentRoute}. The route affects admissibility and downstream routing decisions. Completing additional diagnostics strengthens the evidence base.`
  } else if (constitutionalStructural?.approvingAuthority) {
    continuityStatement = `Approving authority identified: ${constitutionalStructural.approvingAuthority}. This establishes the authority state for downstream assessment. Completing additional diagnostics strengthens the evidence base.`
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
    signalContinuity: [],
    continuityStatement,
  }
}

// ─── Main Adapter Function ───────────────────────────────────────────────────

export function buildConstitutionalLivingViewModel(
  input: BuildConstitutionalLivingViewModelInput,
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
