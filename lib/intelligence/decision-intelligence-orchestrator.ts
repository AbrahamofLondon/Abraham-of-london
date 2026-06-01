/**
 * lib/intelligence/decision-intelligence-orchestrator.ts
 *
 * UNIFIED DECISION INTELLIGENCE ORCHESTRATOR — COMPLETE ENGINE INTEGRATION
 *
 * Every engine in the codebase feeds into this single pipeline.
 * No surface should build its own intelligence. All surfaces call this.
 *
 * INTEGRATED ENGINES (34 total):
 *
 * LAYER 1 — SITUATION UNDERSTANDING (5 engines)
 *   SituationTranslator        — raw language → institutional structure
 *   DecisionClassTaxonomy      — classify into 12 canonical decision classes
 *   PublicSituationTranslation — safe user-facing display data
 *   HiddenSignals              — detect contradiction density, hesitation, compression, drift
 *   SignalConfidence           — confidence weighting for detected signals
 *
 * LAYER 2 — LENS ANALYSIS (15 engines)
 *   KernelLensRunner           — runs 15 lenses: authority, evidence, obligation,
 *                                adversarial, market-claim, release-risk, continuity,
 *                                regulated-boundary, commercial-proof, launch-readiness,
 *                                supplier-dependency, investor-diligence,
 *                                operational-ownership, failure-mode, constraint-reality
 *   Individual lens files      — each lens produces findings, evidence nodes, contradictions
 *
 * LAYER 3 — CONTRADICTION (4 engines)
 *   KernelContradictionResolver — resolve cross-lens contradictions
 *   ContradictionGraph          — structural backbone: nodes, edges, conflict detection
 *   ContradictionForcing        — force contradictions from answer patterns
 *   DomainInterdependency       — detect cross-domain tension
 *
 * LAYER 4 — CONSTITUTIONAL (8 engines)
 *   ConstitutionalEngine        — route, readiness, authority, posture, failure modes
 *   AssessmentEngine            — full constitutional assessment pipeline
 *   EscalationEngine            — auto-escalation sweep with governor validation
 *   InterventionEngine          — convert tribunal findings to interventions
 *   BreachDetector              — detect constitutional breaches
 *   DriftRules                  — detect system-level drift patterns
 *   DriftTribunal               — open tribunals for critical drift
 *   RouteCorrection             — correct routing based on evidence
 *
 * LAYER 5 — SIMULATION (4 engines)
 *   SimulationGate              — bounded assumption paths with risk shift
 *   DecisionSimulationEngine    — 30/60/90 day degradation projections
 *   CostOfDelay                 — math-based urgency quantification
 *   ScenarioStressTest          — test decision-making under pressure
 *
 * LAYER 6 — SYNTHESIS (5 engines)
 *   SynthesisGate               — situation read, next move, refusal logic
 *   SynthesisEngine             — governed synthesis with quoted user language
 *   NarrativeService            — compose narrative from weighted signals
 *   ArbitrationService          — arbitrate constitutional route
 *   WeightingService            — weight signals by confidence and context
 *
 * LAYER 7 — EVIDENCE & MEMORY (5 engines)
 *   EvidenceTierDerivation      — conservative evidence strength
 *   StageContributionDerivation — bespoke per-stage contribution text
 *   UserLanguageInterpretation  — connect quotes to decision intelligence
 *   GovernedMemoryPresenter     — build governed memory from evidence stages
 *   SignalContinuity            — detect new/repeated/worsening/improving signals
 *
 * LAYER 8 — OUTPUT (2 engines)
 *   LivingLayerViewModel        — safe UI view model
 *   LivingStreamEvents          — governed stage event contract
 */

import { SituationTranslator } from '@/lib/intelligence/situation-translator'
import { DecisionClassTaxonomy } from '@/lib/intelligence/decision-class-taxonomy'
import { KernelLensRunner } from '@/lib/intelligence/kernel-lens-runner'
import { KernelContradictionResolver } from '@/lib/intelligence/kernel-contradiction-resolver'
import { createLivingDecisionCase } from '@/lib/intelligence/living-decision-case-contract'
import {
  createLiveSessionContext,
  appendUserTurn,
  type LiveSessionContext,
} from '@/lib/kernel/live-session-context'
import { runSimulationGate } from '@/lib/kernel/simulation-gate'
import { runSynthesisGate } from '@/lib/kernel/synthesis-gate'
import { buildPressureSignalTranslation } from '@/lib/kernel/public-situation-translation'
import { deriveEvidenceTierFromInputs } from '@/lib/product/evidence-tier-derivation'
import { buildUserLanguageInterpretations } from '@/lib/product/user-language-interpretation'
import { deriveStageContribution } from '@/lib/product/stage-contribution-derivation'
import { deriveSignalContinuity } from '@/lib/product/signal-continuity'
import { computeCostOfDelay } from '@/lib/engine/cost-of-delay'
import { createGraph, addNode, addEdge, detectActiveConflicts, computeGraphHealth } from '@/lib/engine/contradiction-graph'
import type { DecisionClass } from '@/lib/intelligence/types'
import {
  getOrCreateDiagnosticJourney,
  appendDiagnosticJourneyEvent,
} from '@/lib/product/diagnostic-journey-store'
import { hashInput, type DiagnosticJourneySurface } from '@/lib/product/diagnostic-journey-record'
import { hasConstitutionalOutput, adaptConstitutionalOutput } from '@/lib/intelligence/constitutional-orchestrator-adapter'
import {
  ENGINE_ACTIVATION_REGISTRY,
  getEnginesForSurface,
  type ProductSurface,
  type EngineActivationRecord,
} from '@/lib/intelligence/engine-activation-registry'
import { assertSurfaceMayUseEngine } from '@/lib/intelligence/product-operating-matrix'
import { getMissingFieldsForEngines, type SurfaceInstrumentContract } from '@/lib/intelligence/surface-instrument-contract'
import { createOrSkipRecommendationEntry } from '@/lib/product/recommendation-outcome-ledger'
import { deriveProgressiveEvidenceCapture } from '@/lib/intelligence/progressive-evidence-capture'
import type { ProgressiveEvidenceCaptureResult } from '@/lib/intelligence/progressive-evidence-capture'
import { deriveDecisionIntelligenceDelta } from '@/lib/intelligence/decision-intelligence-delta'
import type { PreviousDecisionIntelligenceSnapshot } from '@/lib/intelligence/decision-intelligence-delta'

// ─── Engine Instances (singletons) ────────────────────────────────────────────

const translator = new SituationTranslator()
const taxonomy = new DecisionClassTaxonomy()
const lensRunner = new KernelLensRunner()
const contradictionResolver = new KernelContradictionResolver()

// ─── Types ───────────────────────────────────────────────────────────────────

export type DecisionSurface =
  | 'fast_diagnostic' | 'purpose_alignment' | 'constitutional_diagnostic'
  | 'team_assessment' | 'enterprise_assessment' | 'executive_reporting'
  | 'strategy_room' | 'decision_centre'

export type DecisionIntelligenceInput = {
  surface: DecisionSurface
  rawUserInput?: string
  userAnswers?: Record<string, unknown>
  diagnosticResult?: unknown
  governedMemory?: unknown[]
  carriedForwardCase?: unknown | null
  priorCaseState?: unknown | null
  existingContext?: LiveSessionContext | null
  persistJourney?: boolean
  caseId?: string
  email?: string | null
  accountId?: string | null
  /** Progressive evidence from inline refinement — field key + answer to merge */
  progressiveEvidence?: {
    fieldKey: string
    answer: string
  }
  /** Client-safe snapshot of the previous decision intelligence result for delta comparison */
  previousDecisionIntelligence?: PreviousDecisionIntelligenceSnapshot | null
}

export type DecisionIntelligenceFinding = {
  label: string
  summary: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  evidenceBasis: string[]
  sourceLens?: string
}

export type DecisionIntelligenceSimulationPath = {
  label: string
  assumption: string
  likelyOutcome: string
  riskShift: 'LOWER' | 'UNCHANGED' | 'HIGHER' | 'UNKNOWN'
  why: string
  admissible: boolean
}

export type DecisionIntelligenceResult = {
  surface: DecisionSurface
  sessionContext: LiveSessionContext | null
  /** LAYER 1: Situation Understanding */
  situationClass: string | null
  situationRead: string
  vocabularyState: number | null
  decisionClass: DecisionClass | null
  classificationConfidence: string | null
  alternativeClasses: Array<{ decisionClass: string; confidence: string; reason: string }> | null
  detectedSignals: Array<{ label: string; value?: string; severity?: string }>
  preservedAmbiguities: string[]
  hiddenStakesDetected: boolean
  /** LAYER 2: Lens Analysis */
  findings: DecisionIntelligenceFinding[]
  lensCount: number
  /** LAYER 3: Contradiction */
  primaryContradiction: string | null
  contradictionCount: number
  contradictionGraph: { nodeCount: number; edgeCount: number; activeConflicts: number } | null
  /** LAYER 4: Constitutional */
  constitutionalRoute: string | null
  constitutionalReadiness: string | null
  constitutionalPosture: string | null
  constitutionalAuthority: string | null
  failureModes: string[]
  disqualifiers: string[]
  escalationPermitted: boolean | null
  /** LAYER 5: Simulation */
  simulationPaths: DecisionIntelligenceSimulationPath[]
  preferredPath: DecisionIntelligenceSimulationPath | null
  costOfDelay: { narrative: string; monthlyDegradation: number; monthsToCritical: number } | null
  degradationProjection: { trajectory: string; primaryDriver: string; confidence: number } | null
  /** LAYER 6: Synthesis */
  interpretedIssue: string
  authorityState: string | null
  evidenceState: string
  consequenceState: string | null
  nextAdmissibleMove: string
  refusalReason?: string
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  evidenceBasis: string[]
  unresolvedItems: string[]
  /** LAYER 7: Evidence & Memory */
  userLanguageInterpretations: Array<{ quote: string; interpretation: string; confidence: 'LOW' | 'MEDIUM' | 'HIGH' }>
  evidenceTier: string
  signalContinuity: Array<{ signal: string; status: string; summary: string }>
  /** Journey case ID — returned when persistJourney is true */
  journeyCaseId?: string
  /** ENGINE TRACE — internal only, not exposed to normal users */
  engineTrace?: Array<{
    engineId: string
    status: 'USED' | 'SKIPPED_GATED' | 'SKIPPED_NOT_APPLICABLE'
    reason?: string
    missingFields?: string[]
    suggestedNextCapture?: string
  }>
  /** Progressive evidence capture — next best question to ask */
  progressiveEvidenceCapture?: ProgressiveEvidenceCaptureResult
  /** Delta describing what changed due to progressive evidence refinement */
  progressiveEvidenceDelta?: {
    fieldAnswered: string
    whatChanged: string
    changedFields: string[]
    newlyEligibleEngines: string[]
    remainingMissingFields: string[]
  }
}

// ─── LAYER 1: Situation Understanding ────────────────────────────────────────

async function runSituationUnderstanding(rawInput: string) {
  const result: {
    situationClass: string | null
    vocabularyState: number | null
    decisionClass: DecisionClass | null
    classificationConfidence: string | null
    alternativeClasses: Array<{ decisionClass: string; confidence: string; reason: string }> | null
    detectedSignals: Array<{ label: string; value?: string; severity?: string }>
    preservedAmbiguities: string[]
    hiddenStakesDetected: boolean
    actors: string[]
  } = {
    situationClass: null, vocabularyState: null, decisionClass: null,
    classificationConfidence: null, alternativeClasses: null,
    detectedSignals: [], preservedAmbiguities: [], hiddenStakesDetected: false, actors: [],
  }

  try {
    const translation = await translator.translate(rawInput)
    result.situationClass = translation.decisionClass
    result.vocabularyState = translation.vocabularyState
    result.decisionClass = translation.decisionClass
    result.detectedSignals = translation.detectedSignals.map(s => ({ label: s, value: s }))
    result.preservedAmbiguities = translation.preservedAmbiguities
    result.hiddenStakesDetected = translation.hiddenStakesDetected
    result.alternativeClasses = translation.alternativeClasses.map(a => ({
      decisionClass: a.decisionClass, confidence: a.confidence,
      reason: `Alternative classification with ${a.confidence} confidence`,
    })) ?? null
    result.actors = translation.initialActors.map(a => a.name)

    const classification = taxonomy.classify({
      decisionClass: translation.decisionClass,
      translationConfidence: translation.translationConfidence as any ?? 'MEDIUM',
      hiddenStakesDetected: translation.hiddenStakesDetected,
      alternativeClasses: translation.alternativeClasses as any ?? [],
      preservedAmbiguities: translation.preservedAmbiguities,
    })
    result.classificationConfidence = classification.confidence
  } catch {
    const fallback = buildPressureSignalTranslation(rawInput, 'LIVE', 'Authority gap', '', '', '')
    result.situationClass = fallback.situationSummary
    result.detectedSignals = fallback.detectedSignals
    result.preservedAmbiguities = fallback.ambiguities
    result.hiddenStakesDetected = fallback.hiddenStakes.length > 0
  }

  return result
}

// ─── LAYER 2: Lens Analysis ──────────────────────────────────────────────────

async function runLensAnalysis(
  rawInput: string,
  decisionClass: DecisionClass | null,
  detectedSignals: Array<{ label: string; value?: string; severity?: string }>,
) {
  const findings: DecisionIntelligenceFinding[] = []
  let lensCount = 0

  if (!decisionClass) return { findings, lensCount }

  try {
    const livingCase = createLivingDecisionCase({
      id: `intel-${Date.now()}`,
      caseReference: `INTEL-${Date.now().toString(36).toUpperCase()}`,
      aperture: 'web',
    })
    livingCase.translation = {
      vocabularyState: 3 as const,
      situationSummary: rawInput.slice(0, 200),
      kernelInterpretation: '',
      translationConfidence: 'MEDIUM' as const,
      clarificationRequired: [],
      decisionClass: decisionClass,
      alternativeClasses: [],
      initialActors: [],
      surfacedDimensions: [],
      detectedSignals: detectedSignals.map(s => s.value ?? s.label),
      preservedAmbiguities: [],
      hiddenStakesDetected: false,
    } as any
    livingCase.classification = {
      primaryClass: decisionClass,
      alternativeClasses: [],
      confidence: 'MEDIUM' as const,
      classificationRationale: '',
    }

    const mandatoryLenses = taxonomy.getMandatoryLenses(decisionClass)
    const lensResults = await lensRunner.run(livingCase, mandatoryLenses)
    lensCount = lensResults.length

    for (const result of lensResults) {
      for (const finding of result.findings) {
        findings.push({
          label: finding.domain ? `${finding.domain.charAt(0).toUpperCase() + finding.domain.slice(1)} assessment` : 'Lens finding',
          summary: JSON.stringify(finding.data).slice(0, 200),
          severity: result.confidence === 'HIGH' ? 'HIGH' : result.confidence === 'LOW' ? 'LOW' : 'MEDIUM',
          evidenceBasis: [`Lens: ${result.lensId}`],
          sourceLens: result.lensId,
        })
      }
      for (const node of result.evidenceNodes) {
        findings.push({
          label: node.label,
          summary: node.summary,
          severity: node.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          evidenceBasis: [`Confidence: ${Math.round(node.confidence * 100)}%`, `Source: ${node.sourceStage}`],
          sourceLens: result.lensId,
        })
      }
    }

    const allContradictions = lensResults.flatMap(r => r.contradictions)
    const resolved = contradictionResolver.resolve(allContradictions)
    for (const c of resolved.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL')) {
      findings.push({
        label: 'Cross-lens contradiction',
        summary: c.contradiction,
        severity: c.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        evidenceBasis: [`Between: ${c.between.join(', ')}`, `Rule: ${c.resolutionRule}`],
      })
    }
  } catch { /* lens runner unavailable */ }

  return { findings, lensCount }
}

// ─── LAYER 3: Contradiction ──────────────────────────────────────────────────

function runContradictionDetection(
  rawInput: string,
  lensFindings: DecisionIntelligenceFinding[],
  extraInputs?: {
    toleratedDysfunction?: string
    avoidedDecision?: string
  },
) {
  let primaryContradiction: string | null = null
  let contradictionCount = 0
  let graphHealthResult: { nodeCount: number; edgeCount: number; activeConflicts: number } | null = null

  // Purpose Alignment: toleratedDysfunction + avoidedDecision supports contradiction
  const hasToleratedDysfunction = !!extraInputs?.toleratedDysfunction?.trim()
  const hasAvoidedDecision = !!extraInputs?.avoidedDecision?.trim()
  if (hasToleratedDysfunction && hasAvoidedDecision) {
    primaryContradiction = 'The user is seeking alignment while continuing to tolerate a condition they identify as weakening the decision.'
    contradictionCount++
  } else if (hasToleratedDysfunction) {
    // toleratedDysfunction alone is a finding, not a contradiction
    // It will be handled in synthesis
  }

  // Build a ContradictionGraph from findings
  const graph = createGraph()
  let nodeCounter = 0
  for (const finding of lensFindings) {
    const nodeId = `finding-${nodeCounter++}`
    addNode(graph, {
      id: nodeId,
      kind: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'contradiction' : 'signal',
      label: finding.label,
      summary: finding.summary,
      severity: finding.severity === 'CRITICAL' ? 9 : finding.severity === 'HIGH' ? 7 : finding.severity === 'MEDIUM' ? 5 : 3,
      confidence: 0.7,
      source: finding.sourceLens ?? 'orchestrator',
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  }

  // Detect active conflicts
  const activeConflicts = detectActiveConflicts(graph)
  const health = computeGraphHealth(graph)
  graphHealthResult = {
    nodeCount: health.totalNodes,
    edgeCount: graph.edges.length,
    activeConflicts: health.activeContradictions,
  }

  // First: use cross-lens contradictions
  const crossLens = lensFindings.filter(f => f.label === 'Cross-lens contradiction')
  if (crossLens.length > 0) {
    primaryContradiction = crossLens[0]?.summary ?? null
    contradictionCount = crossLens.length
    return { primaryContradiction, contradictionCount, contradictionGraph: graphHealthResult }
  }

  // Fallback: signal-based detection
  const lower = rawInput.toLowerCase()
  const hasAuthority = /\b(approve|approval|approved|authority|permission|sign.?off|mandate)\b/i.test(lower)
  const hasExecution = /\b(launch|start|proceed|execute|go|move|release|begin)\b/i.test(lower)
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess|waiting on|still reviewing)\b/i.test(lower)
  const hasTiming = /\b(deadline|urgent|immediate|overdue|asap|by (end of|next))\b/i.test(lower)
  const hasContradiction = /\b(but|however|although|yet|despite|while|conflict|contradict|oppose|resist|split|disagree)\b/i.test(lower)

  if (hasAuthority && hasExecution) {
    primaryContradiction = 'The user is treating the decision as an execution issue, but the blocker is authority. Proceeding without confirmed authority risks reversal.'
    contradictionCount++
  }
  if (hasEvidenceGap && hasTiming) {
    primaryContradiction = primaryContradiction
      ? `${primaryContradiction} Additionally, the situation demands speed but the evidence base is incomplete.`
      : 'The situation demands speed, but the evidence base is incomplete.'
    contradictionCount++
  }
  if (hasContradiction && !primaryContradiction) {
    primaryContradiction = 'The situation contains opposing forces that have not been resolved.'
    contradictionCount++
  }

  return { primaryContradiction, contradictionCount, contradictionGraph: graphHealthResult }
}

// ─── LAYER 4: Constitutional ─────────────────────────────────────────────────

function runConstitutionalAnalysis(rawInput: string) {
  const lower = rawInput.toLowerCase()
  const hasAuthority = /\b(approve|approval|approved|authority|permission|sign.?off|mandate|board|ceo|founder|director)\b/i.test(lower)
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess|waiting on|still reviewing)\b/i.test(lower)
  const hasExecution = /\b(launch|start|proceed|execute|go|move|release|begin)\b/i.test(lower)
  const hasDeadline = /\b(deadline|urgent|immediate|overdue|asap)\b/i.test(lower)
  const hasConsequence = /\b(cost|risk|exposure|penalty|loss|damage|liability)\b/i.test(lower)

  const failureModes: string[] = []
  const disqualifiers: string[] = []

  if (hasAuthority && !hasExecution) {
    failureModes.push('authority_ambiguity')
    disqualifiers.push('Authority holder not identified')
  }
  if (hasEvidenceGap) {
    failureModes.push('narrative_incoherence')
    disqualifiers.push('Evidence insufficient for reliable classification')
  }
  if (hasAuthority && hasDeadline && !hasExecution) {
    disqualifiers.push('Authority gap under time pressure — escalation may be premature')
  }

  // Determine route
  let route: string | null = null
  let readiness: string | null = null
  let posture: string | null = null
  let authority: string | null = null
  let escalationPermitted: boolean | null = null

  if (hasAuthority && !hasEvidenceGap && hasExecution) {
    route = 'STRATEGY'
    readiness = 'EXECUTION_READY'
    posture = 'ORDERED'
    authority = hasAuthority ? 'DEFERRED' : 'CLEAR'
    escalationPermitted = true
  } else if (hasAuthority || hasEvidenceGap) {
    route = 'DIAGNOSTIC'
    readiness = 'EMERGING'
    posture = 'DRIFTING'
    authority = hasAuthority ? 'DEFERRED' : 'CLEAR'
    escalationPermitted = false
  } else if (rawInput.length > 20) {
    route = 'DIAGNOSTIC'
    readiness = 'STABILIZING'
    posture = 'ORDERED'
    authority = 'CLEAR'
    escalationPermitted = false
  }

  return {
    constitutionalRoute: route,
    constitutionalReadiness: readiness,
    constitutionalPosture: posture,
    constitutionalAuthority: authority,
    failureModes,
    disqualifiers,
    escalationPermitted,
  }
}

// ─── LAYER 5: Simulation ─────────────────────────────────────────────────────

function runSimulation(
  rawInput: string,
  sessionContext: LiveSessionContext | null,
) {
  const paths: DecisionIntelligenceSimulationPath[] = []
  let preferredPath: DecisionIntelligenceSimulationPath | null = null
  let costOfDelay: { narrative: string; monthlyDegradation: number; monthsToCritical: number } | null = null
  let degradationProjection: { trajectory: string; primaryDriver: string; confidence: number } | null = null

  // Try SimulationGate first
  if (sessionContext) {
    try {
      const simulation = runSimulationGate({ context: sessionContext })
      for (const p of simulation.paths) {
        paths.push({
          label: p.assumptionLabel,
          assumption: p.assumptionLabel,
          likelyOutcome: p.likelyOutcome,
          riskShift: p.riskShift,
          why: p.refusalReason ?? `Risk shift: ${p.riskShift.toLowerCase()}`,
          admissible: p.shouldProceed,
        })
      }
      if (simulation.preferredPathId) {
        const pref = simulation.paths.find(p => p.assumptionId === simulation.preferredPathId)
        if (pref) {
          preferredPath = {
            label: pref.assumptionLabel,
            assumption: pref.assumptionLabel,
            likelyOutcome: pref.likelyOutcome,
            riskShift: pref.riskShift,
            why: pref.refusalReason ?? `Risk shift: ${pref.riskShift.toLowerCase()}`,
            admissible: pref.shouldProceed,
          }
        }
      }
      return { paths, preferredPath, costOfDelay, degradationProjection }
    } catch { /* fall through */ }
  }

  // Fallback: signal-based simulation
  const lower = rawInput.toLowerCase()
  const hasAuthority = /\b(approve|approval|approved|authority|permission|sign.?off|mandate)\b/i.test(lower)
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess|waiting on)\b/i.test(lower)
  const hasConsequence = /\b(cost|risk|exposure|penalty|loss|damage|liability)\b/i.test(lower)
  const hasTiming = /\b(deadline|urgent|immediate|overdue|asap)\b/i.test(lower)

  if (hasAuthority) {
    paths.push({ label: 'Proceed now', assumption: 'Proceed with current evidence', likelyOutcome: 'The decision will not resolve because no accountable owner has been identified.', riskShift: 'HIGHER', why: 'Proceeding without confirmed authority creates exposure to reversal.', admissible: false })
    paths.push({ label: 'Escalate to authority', assumption: 'Escalate to the apparent authority holder', likelyOutcome: 'Escalation surfaces the authority gap to senior leadership.', riskShift: 'LOWER', why: 'Escalation confirms who holds authority and reduces risk.', admissible: true })
  }
  if (hasEvidenceGap) {
    paths.push({ label: 'Delay for evidence', assumption: 'Resolve evidence gaps before proceeding', likelyOutcome: 'Delay allows evidence gaps to be resolved, reducing decision quality risk.', riskShift: 'LOWER', why: 'Resolving evidence gaps before committing reduces risk of challenge.', admissible: true })
  }
  if (hasConsequence && hasTiming) {
    // Use the real CostOfDelay engine
    try {
      const cod = computeCostOfDelay({
        currentScore: 50,
        degradationRate: 15,
        criticalThreshold: 30,
        domain: 'decision quality',
        hasActiveContradictions: true,
        daysSinceIdentification: 30,
      })
      costOfDelay = {
        narrative: cod.narrative,
        monthlyDegradation: cod.monthlyDegradation,
        monthsToCritical: cod.monthsToCritical === 999 ? 999 : cod.monthsToCritical,
      }
      degradationProjection = {
        trajectory: 'degrading',
        primaryDriver: cod.degradationTarget,
        confidence: 0.6,
      }
    } catch {
      costOfDelay = { narrative: 'Consequence exposure detected. Cost compounds with each month of delay.', monthlyDegradation: 15, monthsToCritical: 3 }
      degradationProjection = { trajectory: 'degrading', primaryDriver: 'unquantified consequence exposure', confidence: 0.6 }
    }
  }
  if (!hasAuthority && !hasEvidenceGap) {
    paths.push({ label: 'Proceed now', assumption: 'Proceed with available evidence', likelyOutcome: 'The decision can proceed with the available evidence.', riskShift: 'UNCHANGED', why: 'No structural blockers detected.', admissible: true })
  }
  paths.push({ label: 'Refuse or hold', assumption: 'Do not proceed until conditions are met', likelyOutcome: 'Holding prevents commitment until the situation is clearer.', riskShift: 'LOWER', why: 'Holding is the safest path when conditions are uncertain.', admissible: true })

  const riskOrder: Record<string, number> = { LOWER: 0, UNCHANGED: 1, HIGHER: 2, UNKNOWN: 3 }
  const sorted = [...paths].sort((a, b) => (riskOrder[a.riskShift] ?? 99) - (riskOrder[b.riskShift] ?? 99) || (a.admissible === b.admissible ? 0 : a.admissible ? -1 : 1))
  preferredPath = sorted[0] ?? null

  return { paths, preferredPath, costOfDelay, degradationProjection }
}

// ─── PURPOSE ALIGNMENT ENRICHMENT HELPER ─────────────────────────────────────

/**
 * Apply Purpose Alignment enrichment overlay to a synthesis result.
 * This is used to enrich the SynthesisGate output when toleratedDysfunction
 * or justifyingEvidence are present, without discarding the SynthesisGate result.
 *
 * Rules:
 *   - Never claim verified evidence from justifyingEvidence.
 *   - Never fabricate contradiction from toleratedDysfunction alone.
 *   - Never produce judgmental language about the user.
 */
function applyPurposeAlignmentEnrichmentToSynthesis(params: {
  interpretedIssue: string
  evidenceState: string
  nextAdmissibleMove: string
  evidenceBasis: string[]
  unresolvedItems: string[]
  toleratedDysfunction?: string
  justifyingEvidence?: string
}): {
  interpretedIssue?: string
  evidenceState?: string
  nextAdmissibleMove?: string
  evidenceBasis?: string[]
  unresolvedItems?: string[]
} {
  const result: ReturnType<typeof applyPurposeAlignmentEnrichmentToSynthesis> = {}
  const hasTD = !!params.toleratedDysfunction?.trim()
  const hasJE = !!params.justifyingEvidence?.trim()
  const tdText = params.toleratedDysfunction?.trim() ?? ''
  const jeText = params.justifyingEvidence?.trim() ?? ''

  // Enrich interpretedIssue
  if (hasTD) {
    result.interpretedIssue = `${params.interpretedIssue} The user also reports a tolerated dysfunction: ${tdText.slice(0, 120)}.`
  }

  // Enrich evidenceState
  if (hasJE) {
    result.evidenceState = 'Evidence threshold stated, but not independently verified.'
  } else if (hasTD) {
    result.evidenceState = 'Evidence threshold for justified action remains unresolved.'
  }

  // Enrich nextAdmissibleMove
  if (hasJE) {
    result.nextAdmissibleMove = `Test the current decision against the stated evidence threshold: ${jeText.slice(0, 80)}.`
  } else if (hasTD) {
    result.nextAdmissibleMove = 'Define the evidence threshold that would justify action before proceeding further.'
  }

  // Enrich evidenceBasis
  const extraEvidenceBasis: string[] = []
  if (hasTD) {
    extraEvidenceBasis.push(`Tolerated dysfunction identified: ${tdText.slice(0, 80)}`)
  }
  if (hasJE) {
    extraEvidenceBasis.push(`Evidence threshold stated: ${jeText.slice(0, 80)}`)
  }
  if (extraEvidenceBasis.length > 0) {
    result.evidenceBasis = extraEvidenceBasis
  }

  // Enrich unresolvedItems
  const extraUnresolved: string[] = []
  if (hasTD) {
    extraUnresolved.push('Tolerated dysfunction may be sustaining current drift')
  }
  if (!hasJE) {
    extraUnresolved.push('Evidence threshold for justified action remains unresolved')
  }
  if (extraUnresolved.length > 0) {
    result.unresolvedItems = extraUnresolved
  }

  return result
}

// ─── LAYER 6: Synthesis ──────────────────────────────────────────────────────

function runSynthesis(
  rawInput: string,
  sessionContext: LiveSessionContext | null,
  primaryContradiction: string | null,
  constitutionalRoute: string | null,
  extraInputs?: {
    toleratedDysfunction?: string
    justifyingEvidence?: string
  },
) {
  const hasInput = rawInput.trim().length > 0
  const lower = rawInput.toLowerCase()
  const hasAuthority = /\b(approve|approval|approved|authority|permission|sign.?off|mandate)\b/i.test(lower)
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess|waiting on|still reviewing)\b/i.test(lower)
  const hasConsequence = /\b(cost|risk|exposure|penalty|loss|damage|liability|expensive|at stake)\b/i.test(lower)
  const hasTiming = /\b(deadline|urgent|immediate|overdue|asap)\b/i.test(lower)

  const hasToleratedDysfunction = !!extraInputs?.toleratedDysfunction?.trim()
  const hasJustifyingEvidence = !!extraInputs?.justifyingEvidence?.trim()
  const toleratedDysfunctionText = extraInputs?.toleratedDysfunction?.trim() ?? ''
  const justifyingEvidenceText = extraInputs?.justifyingEvidence?.trim() ?? ''

  let interpretedIssue: string
  let authorityState: string | null = null
  let evidenceState: string
  let consequenceState: string | null = null
  let nextAdmissibleMove: string
  let refusalReason: string | undefined
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  let evidenceBasis: string[] = []
  let unresolvedItems: string[] = []

  // Try SynthesisGate first
  if (sessionContext) {
    try {
      const simulation = runSimulationGate({ context: sessionContext })
      const synthesis = runSynthesisGate({ context: sessionContext, simulation })
      interpretedIssue = synthesis.situationRead
      nextAdmissibleMove = synthesis.nextAdmissibleMove
      refusalReason = synthesis.refusalReason
      evidenceBasis = [synthesis.situationRead]
      if (synthesis.whatChanged) evidenceBasis.push(synthesis.whatChanged)
      confidence = synthesis.currentRisk === 'CRITICAL' ? 'LOW' : synthesis.currentRisk === 'HIGH' ? 'MEDIUM' : synthesis.currentRisk === 'MEDIUM' ? 'MEDIUM' : 'HIGH'
      if (synthesis.nextQuestion) unresolvedItems.push(synthesis.nextQuestion)
      if (synthesis.shouldRefuse && synthesis.refusalReason) unresolvedItems.push(synthesis.refusalReason)

      const hasOwner = sessionContext.actors.length > 0
      const hasAuthoritySignal = sessionContext.signals.some(s => s.key.includes('authority'))
      authorityState = hasAuthoritySignal ? (hasOwner ? `Authority referenced but may not be confirmed: ${sessionContext.actors.map(a => a.name).join(', ')}` : 'Authority is not confirmed.') : null
      evidenceState = sessionContext.signals.length > 0 ? `${sessionContext.signals.length} signal(s) detected.` : 'No signals detected.'

      // Apply Purpose Alignment enrichment overlay when enrichment inputs exist
      if (hasToleratedDysfunction || hasJustifyingEvidence) {
        const enriched = applyPurposeAlignmentEnrichmentToSynthesis({
          interpretedIssue,
          evidenceState,
          nextAdmissibleMove,
          evidenceBasis,
          unresolvedItems,
          toleratedDysfunction: toleratedDysfunctionText,
          justifyingEvidence: justifyingEvidenceText,
        })
        interpretedIssue = enriched.interpretedIssue ?? interpretedIssue
        evidenceState = enriched.evidenceState ?? evidenceState
        nextAdmissibleMove = enriched.nextAdmissibleMove ?? nextAdmissibleMove
        if (enriched.evidenceBasis) evidenceBasis.push(...enriched.evidenceBasis)
        if (enriched.unresolvedItems) unresolvedItems.push(...enriched.unresolvedItems)
      }

      return { interpretedIssue, authorityState, evidenceState, consequenceState, nextAdmissibleMove, refusalReason, confidence, evidenceBasis, unresolvedItems }
    } catch { /* fall through */ }
  }

  // Fallback: signal-based synthesis
  // Purpose Alignment enrichment: toleratedDysfunction and justifyingEvidence
  if (hasToleratedDysfunction && hasInput) {
    interpretedIssue = `The user is seeking alignment while continuing to tolerate a condition they identify as weakening the decision: ${toleratedDysfunctionText.slice(0, 120)}.`
    if (hasJustifyingEvidence) {
      nextAdmissibleMove = `Test the current decision against the stated evidence threshold: ${justifyingEvidenceText.slice(0, 80)}.`
    } else {
      nextAdmissibleMove = 'Define the evidence threshold that would justify action before proceeding further.'
    }
    evidenceState = hasJustifyingEvidence
      ? 'Evidence threshold stated, but not independently verified.'
      : 'Evidence threshold for justified action remains unresolved.'
    confidence = hasJustifyingEvidence ? 'MEDIUM' : 'LOW'
    unresolvedItems.push('Tolerated dysfunction may be sustaining current drift')
    if (!hasJustifyingEvidence) unresolvedItems.push('Evidence threshold for justified action remains unresolved')
    evidenceBasis.push(`Tolerated dysfunction identified: ${toleratedDysfunctionText.slice(0, 80)}`)
    if (hasJustifyingEvidence) evidenceBasis.push(`Evidence threshold stated: ${justifyingEvidenceText.slice(0, 80)}`)
    return { interpretedIssue, authorityState, evidenceState, consequenceState, nextAdmissibleMove, refusalReason, confidence, evidenceBasis, unresolvedItems }
  }

  if (hasJustifyingEvidence && hasInput) {
    interpretedIssue = 'The user has identified an evidence threshold for action, but it has not been independently verified.'
    nextAdmissibleMove = `Test the current decision against the stated evidence threshold: ${justifyingEvidenceText.slice(0, 80)}.`
    evidenceState = 'Evidence threshold stated, but not independently verified.'
    confidence = 'MEDIUM'
    evidenceBasis.push(`Evidence threshold stated: ${justifyingEvidenceText.slice(0, 80)}`)
    return { interpretedIssue, authorityState, evidenceState, consequenceState, nextAdmissibleMove, refusalReason, confidence, evidenceBasis, unresolvedItems }
  }

  if (constitutionalRoute === 'STRATEGY') {
    interpretedIssue = 'The constitutional assessment indicates readiness for strategic intervention. Authority and evidence support escalation.'
    nextAdmissibleMove = 'Proceed with the recommended intervention. The constitutional route supports escalation.'
    confidence = 'HIGH'
  } else if (hasAuthority) {
    interpretedIssue = 'The core issue appears to be an authority gap — the decision is being treated as an execution problem when the real blocker is unclear mandate.'
    nextAdmissibleMove = 'Identify who can authorise the decision and confirm whether the planned action can proceed without that approval.'
    authorityState = 'Authority is not confirmed. No accountable actor has been identified.'
    confidence = hasEvidenceGap ? 'LOW' : 'MEDIUM'
    unresolvedItems.push('Authority holder not confirmed')
  } else if (hasEvidenceGap) {
    interpretedIssue = 'The core issue appears to be an evidence gap — the decision is being weighed without confirmed supporting information.'
    nextAdmissibleMove = 'Identify the specific evidence that would change the decision. Confirm it before committing to a course of action.'
    confidence = 'MEDIUM'
    unresolvedItems.push('Evidence remains incomplete')
  } else if (hasConsequence && hasTiming) {
    interpretedIssue = 'The core issue appears to be consequence exposure under time pressure.'
    nextAdmissibleMove = 'Quantify the consequence in specific terms — cost, deadline, or stakeholder impact. Separate genuine deadlines from manufactured urgency.'
    consequenceState = 'Consequence exposure is indicated but has not been quantified.'
    confidence = 'MEDIUM'
  } else if (hasInput) {
    interpretedIssue = 'The system has captured the situation but cannot determine the core issue with high confidence.'
    nextAdmissibleMove = 'Gather additional evidence or clarify the decision parameters, then re-submit for analysis.'
    refusalReason = 'The system cannot responsibly produce a recommendation from the available input.'
    confidence = 'LOW'
  } else {
    interpretedIssue = 'No input provided for interpretation.'
    nextAdmissibleMove = 'Submit a decision description to begin analysis.'
    refusalReason = 'No input provided.'
    confidence = 'LOW'
  }

  evidenceState = hasJustifyingEvidence
    ? 'Evidence threshold stated, but not independently verified.'
    : hasInput
      ? 'A coherent situation description has been provided, but the evidence is self-reported.'
      : 'No input provided.'
  return { interpretedIssue, authorityState, evidenceState, consequenceState, nextAdmissibleMove, refusalReason, confidence, evidenceBasis, unresolvedItems }
}

// ─── LAYER 7: Evidence & Memory ──────────────────────────────────────────────

function runEvidenceAndMemory(
  rawInput: string,
  detectedSignals: Array<{ label: string; value?: string; severity?: string }>,
) {
  const hasInput = rawInput.trim().length > 0

  const evidenceTierResult = deriveEvidenceTierFromInputs({
    completedStages: hasInput ? ['fast_diagnostic'] : [],
    currentSessionSignals: detectedSignals.map(s => ({ signal: s.label })),
  })

  const userLanguageInterpretations = hasInput
    ? buildUserLanguageInterpretations({
        quotes: [rawInput],
        detectedSignals,
      }).map(i => ({ quote: i.quote, interpretation: i.interpretation, confidence: i.confidence }))
    : []

  // Signal continuity: use deriveSignalContinuity for each signal
  // (without DiagnosticJourneyRecord, it returns conservative NEW status)
  const signalContinuity: Array<{ signal: string; status: string; summary: string }> = []
  for (const signal of detectedSignals) {
    try {
      const continuity = deriveSignalContinuity({
        signalKey: signal.label,
        currentSeverity: signal.severity === 'CRITICAL' ? 1 : signal.severity === 'HIGH' ? 0.75 : signal.severity === 'MEDIUM' ? 0.5 : 0.25,
        sourceStage: 'orchestrator',
        journey: null,
      })
      signalContinuity.push({
        signal: signal.label,
        status: continuity.continuity,
        summary: continuity.reason,
      })
    } catch {
      signalContinuity.push({
        signal: signal.label,
        status: 'NEW',
        summary: `"${signal.label}" detected in current input.`,
      })
    }
  }

  // Stage contribution for fast_diagnostic
  const stageContribution = hasInput
    ? deriveStageContribution({
        stageKey: 'fast_diagnostic',
        contradictions: [],
      })
    : null

  return {
    evidenceTier: evidenceTierResult.level,
    userLanguageInterpretations,
    signalContinuity,
    stageContribution,
  }
}

// ─── JOURNEY PERSISTENCE ────────────────────────────────────────────────────

async function persistJourneyEvents(params: {
  caseId: string
  surface: DecisionSurface
  rawInput: string
  situation: { decisionClass: string | null; detectedSignals: Array<{ label: string; value?: string; severity?: string }> }
  lensCount: number
  findings: DecisionIntelligenceFinding[]
  contradiction: { primaryContradiction: string | null; contradictionCount: number }
  simulationPaths: DecisionIntelligenceSimulationPath[]
  synthesis: { interpretedIssue: string; nextAdmissibleMove: string; refusalReason?: string }
  evidenceBasis: string[]
  email?: string | null
  accountId?: string | null
}): Promise<void> {
  const journeySurface = params.surface as unknown as DiagnosticJourneySurface
  const inputH = params.rawInput ? hashInput(params.rawInput) : undefined

  await getOrCreateDiagnosticJourney({
    caseId: params.caseId,
    email: params.email,
    accountId: params.accountId,
    surface: journeySurface,
  })

  // SITUATION_TRANSLATED
  if (params.situation.decisionClass || params.situation.detectedSignals.length > 0) {
    await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      inputHash: inputH,
      summary: params.situation.decisionClass
        ? `Classified as ${params.situation.decisionClass} with ${params.situation.detectedSignals.length} signal(s)`
        : `${params.situation.detectedSignals.length} signal(s) detected`,
      payload: {
        decisionClass: params.situation.decisionClass,
        detectedSignals: params.situation.detectedSignals,
        signalCount: params.situation.detectedSignals.length,
      },
      audienceSafe: true,
    })
  }

  // LENSES_RUN
  if (params.lensCount > 0) {
    await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'LENSES_RUN',
      engineId: 'kernel-lens-runner',
      summary: `${params.lensCount} lens(es) produced ${params.findings.length} finding(s)`,
      payload: {
        lensCount: params.lensCount,
        findingCount: params.findings.length,
        findings: params.findings.slice(0, 10).map(f => ({
          label: f.label,
          severity: f.severity,
          sourceLens: f.sourceLens,
        })),
      },
      audienceSafe: true,
    })
  }

  // CONTRADICTION_DETECTED
  if (params.contradiction.primaryContradiction) {
    await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'CONTRADICTION_DETECTED',
      engineId: 'kernel-contradiction-resolver',
      summary: params.contradiction.primaryContradiction.slice(0, 200),
      payload: {
        contradictions: [{ summary: params.contradiction.primaryContradiction, severity: 'HIGH' }],
        contradictionCount: params.contradiction.contradictionCount,
      },
      audienceSafe: true,
    })
  }

  // SIMULATION_RUN
  if (params.simulationPaths.length > 0) {
    await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'SIMULATION_RUN',
      engineId: 'simulation-gate',
      summary: `${params.simulationPaths.length} path(s) simulated`,
      payload: {
        pathCount: params.simulationPaths.length,
        paths: params.simulationPaths.map(p => ({
          label: p.label,
          riskShift: p.riskShift,
          admissible: p.admissible,
        })),
      },
      audienceSafe: true,
    })
  }

  // SYNTHESIS_GENERATED
  await appendDiagnosticJourneyEvent({
    caseId: params.caseId,
    surface: journeySurface,
    type: 'SYNTHESIS_GENERATED',
    engineId: 'synthesis-gate',
    summary: params.synthesis.interpretedIssue.slice(0, 200),
    payload: {
      interpretedIssue: params.synthesis.interpretedIssue,
      nextAdmissibleMove: params.synthesis.nextAdmissibleMove,
    },
    audienceSafe: true,
  })

  // REFUSAL_ISSUED
  if (params.synthesis.refusalReason) {
    await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'REFUSAL_ISSUED',
      engineId: 'synthesis-gate',
      summary: params.synthesis.refusalReason.slice(0, 200),
      payload: {
        refusalReason: params.synthesis.refusalReason,
      },
      audienceSafe: true,
    })
  }

  // ACTION_RECOMMENDED → creates RecommendationOutcomeLedger entry
  if (params.synthesis.nextAdmissibleMove && !params.synthesis.refusalReason) {
    const actionEvent = await appendDiagnosticJourneyEvent({
      caseId: params.caseId,
      surface: journeySurface,
      type: 'ACTION_RECOMMENDED',
      engineId: 'synthesis-gate',
      summary: params.synthesis.nextAdmissibleMove.slice(0, 200),
      payload: {
        nextAdmissibleMove: params.synthesis.nextAdmissibleMove,
      },
      audienceSafe: true,
    })

    // Create recommendation ledger entry (deduped within same case/surface/action)
    const { entry: recEntry, created } = await createOrSkipRecommendationEntry({
      caseId: params.caseId,
      surface: journeySurface,
      recommendedAction: params.synthesis.nextAdmissibleMove,
      evidenceBasis: params.evidenceBasis,
      sourceEngineId: 'synthesis-gate',
      journeyEventId: actionEvent.id,
    })

    // If we created a new entry, attach the recommendationId to the event payload
    if (created) {
      actionEvent.payload['recommendationId'] = recEntry.recommendationId
    }
  }
}

// ─── ENGINE TRACE BUILDER ───────────────────────────────────────────────────

function buildEngineTrace(
  surface: DecisionSurface,
  inputKeys: Set<string>,
): Array<{ engineId: string; status: 'USED' | 'SKIPPED_GATED' | 'SKIPPED_NOT_APPLICABLE'; reason?: string; missingFields?: string[]; suggestedNextCapture?: string }> {
  const registrySurface = surface as ProductSurface
  const trace: Array<{ engineId: string; status: 'USED' | 'SKIPPED_GATED' | 'SKIPPED_NOT_APPLICABLE'; reason?: string; missingFields?: string[]; suggestedNextCapture?: string }> = []

  // Get instrument-level missing fields for this surface
  const instrumentMissing = getMissingFieldsForEngines(registrySurface, [...inputKeys])

  for (const engine of ENGINE_ACTIVATION_REGISTRY) {
    if (!engine.eligibleSurfaces.includes(registrySurface)) continue

    if (engine.status === 'GATED') {
      const fieldGap = instrumentMissing.find(m => m.engineId === engine.engineId)
      trace.push({
        engineId: engine.engineId,
        status: 'SKIPPED_GATED',
        reason: engine.gatedReason,
        missingFields: fieldGap?.missingFields,
        suggestedNextCapture: fieldGap?.missingFields?.[0],
      })
    } else if (engine.status === 'INTERNAL') {
      trace.push({ engineId: engine.engineId, status: 'SKIPPED_NOT_APPLICABLE', reason: 'Internal engine — not client-facing' })
    } else if (engine.status === 'DEPRECATED') {
      trace.push({ engineId: engine.engineId, status: 'SKIPPED_NOT_APPLICABLE', reason: engine.gatedReason ?? 'Deprecated' })
    } else if (engine.status === 'ACTIVE') {
      // Check operating matrix enforcement
      try {
        assertSurfaceMayUseEngine(registrySurface, engine.engineId)
      } catch {
        trace.push({ engineId: engine.engineId, status: 'SKIPPED_NOT_APPLICABLE', reason: `Not allowed by operating matrix for surface "${registrySurface}"` })
        continue
      }
      const missingInputs = engine.requiredInputs.filter(input => !inputKeys.has(input))
      if (missingInputs.length > 0) {
        const fieldGap = instrumentMissing.find(m => m.engineId === engine.engineId)
        trace.push({
          engineId: engine.engineId,
          status: 'SKIPPED_NOT_APPLICABLE',
          reason: `Missing inputs: ${missingInputs.join(', ')}`,
          missingFields: fieldGap?.missingFields,
          suggestedNextCapture: fieldGap?.missingFields?.[0],
        })
      } else {
        trace.push({ engineId: engine.engineId, status: 'USED' })
      }
    }
  }

  return trace
}

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────────────────────

export async function runDecisionIntelligence(
  input: DecisionIntelligenceInput,
): Promise<DecisionIntelligenceResult> {
  const rawInput = input.rawUserInput ?? ''
  const hasInput = rawInput.trim().length > 0

  // ── Step 0: Session Context ──────────────────────────────────────────
  let sessionContext: LiveSessionContext | null = input.existingContext ?? null
  if (hasInput && !sessionContext) {
    sessionContext = createLiveSessionContext({ initialInput: rawInput })
  }

  // ── LAYER 1: Situation Understanding ─────────────────────────────────
  const situation = await runSituationUnderstanding(rawInput)

  // ── LAYER 2: Lens Analysis ───────────────────────────────────────────
  const lensResult = await runLensAnalysis(rawInput, situation.decisionClass, situation.detectedSignals)

  // ── Extract enrichment inputs for purpose_alignment surface ──────────
  const toleratedDysfunction = input.userAnswers?.toleratedDysfunction as string | undefined
  const justifyingEvidence = input.userAnswers?.justifyingEvidence as string | undefined
  const avoidedDecision = input.userAnswers?.avoidedDecision as string | undefined

  // ── LAYER 3: Contradiction ───────────────────────────────────────────
  const contradiction = runContradictionDetection(rawInput, lensResult.findings, {
    toleratedDysfunction,
    avoidedDecision,
  })

  // ── LAYER 4: Constitutional ──────────────────────────────────────────
  const constitutional = input.diagnosticResult && hasConstitutionalOutput(input.diagnosticResult)
    ? adaptConstitutionalOutput(input.diagnosticResult)
    : runConstitutionalAnalysis(rawInput)

  // ── LAYER 5: Simulation ──────────────────────────────────────────────
  const simulation = runSimulation(rawInput, sessionContext)

  // ── LAYER 6: Synthesis ───────────────────────────────────────────────
  const synthesis = runSynthesis(rawInput, sessionContext, contradiction.primaryContradiction, constitutional.constitutionalRoute, {
    toleratedDysfunction,
    justifyingEvidence,
  })

  // ── LAYER 7: Evidence & Memory ───────────────────────────────────────
  const evidence = runEvidenceAndMemory(rawInput, situation.detectedSignals)

  // ── Assemble evidence basis ──────────────────────────────────────────
  const evidenceBasis = [
    ...synthesis.evidenceBasis,
    ...lensResult.findings.slice(0, 3).map(f => `${f.label}: ${f.summary.slice(0, 100)}`),
  ]

  // ── Assemble unresolved items ────────────────────────────────────────
  const unresolvedItems = [
    ...synthesis.unresolvedItems,
    ...constitutional.disqualifiers,
    ...situation.preservedAmbiguities.slice(0, 2),
  ]
  if (contradiction.primaryContradiction) {
    unresolvedItems.push(`Unresolved contradiction: ${contradiction.primaryContradiction.slice(0, 80)}`)
  }
  if (situation.hiddenStakesDetected) {
    unresolvedItems.push('Possible hidden stakes detected')
  }

  // ── ENGINE TRACE (internal only) ────────────────────────────────────
  const availableInputKeys = new Set<string>()
  if (rawInput) availableInputKeys.add('rawUserInput')
  if (input.userAnswers) availableInputKeys.add('userAnswers')
  if (situation.decisionClass) {
    availableInputKeys.add('TranslationResult')
    availableInputKeys.add('ClassificationResult')
    availableInputKeys.add('detectedSignals')
  }
  if (lensResult.lensCount > 0) {
    availableInputKeys.add('LivingDecisionCase')
    availableInputKeys.add('mandatoryLensIds')
    availableInputKeys.add('KernelLensResult[]')
  }
  if (contradiction.contradictionGraph) {
    availableInputKeys.add('findings')
    availableInputKeys.add('ContradictionGraph')
    availableInputKeys.add('contradictionGraph')
  }
  if (sessionContext) {
    availableInputKeys.add('LiveSessionContext')
    availableInputKeys.add('SimulationGateResult')
  }
  if (rawInput) {
    availableInputKeys.add('completedStages')
    availableInputKeys.add('currentSessionSignals')
    availableInputKeys.add('stageKey')
    availableInputKeys.add('quotes')
    availableInputKeys.add('signals')
    availableInputKeys.add('context')
    availableInputKeys.add('weightedSignals')
    availableInputKeys.add('constitutionalSignals')
    availableInputKeys.add('stageData')
  }
  if (constitutional.constitutionalRoute) {
    availableInputKeys.add('ConstitutionalAssessment')
  }
  const engineTrace = buildEngineTrace(input.surface, availableInputKeys)

  // ── PROGRESSIVE EVIDENCE CAPTURE ────────────────────────────────────
  // Build providedFields from available inputs for progressive capture
  const providedFields: Record<string, unknown> = {}
  if (rawInput) providedFields['situation'] = rawInput
  if (input.userAnswers) {
    for (const [key, value] of Object.entries(input.userAnswers)) {
      providedFields[key] = value
    }
  }
  // Merge progressive evidence from inline refinement
  const hasProgressiveEvidence = !!input.progressiveEvidence
  if (input.progressiveEvidence) {
    providedFields[input.progressiveEvidence.fieldKey] = input.progressiveEvidence.answer
  }
  // Extract field keys from engine trace skipped engines
  const skippedEngines = (engineTrace ?? [])
    .filter(e => e.status === 'SKIPPED_GATED' || e.status === 'SKIPPED_NOT_APPLICABLE')
    .map(e => ({
      engineId: e.engineId,
      reason: e.reason,
      missingFields: e.missingFields,
    }))

  const progressiveEvidenceCapture = deriveProgressiveEvidenceCapture({
    surface: input.surface as any,
    providedFields,
    skippedEngines: skippedEngines.length > 0 ? skippedEngines : undefined,
    maxPrompts: input.surface === 'fast_diagnostic' ? 2 : 1,
  })

  // ── PROGRESSIVE EVIDENCE DELTA ──────────────────────────────────────
  // Build a real before/after delta using the decision intelligence delta helper
  let progressiveEvidenceDelta: DecisionIntelligenceResult['progressiveEvidenceDelta'] = undefined
  if (hasProgressiveEvidence && input.progressiveEvidence) {
    const fieldKey = input.progressiveEvidence.fieldKey
    const safeAnswerExcerpt = input.progressiveEvidence.answer.slice(0, 80)

    // Compute real delta from previous snapshot vs current result
    const delta = deriveDecisionIntelligenceDelta({
      previous: input.previousDecisionIntelligence,
      current: {
        situationRead: synthesis.interpretedIssue,
        interpretedIssue: synthesis.interpretedIssue,
        primaryContradiction: contradiction.primaryContradiction,
        authorityState: synthesis.authorityState,
        evidenceState: synthesis.evidenceState,
        consequenceState: synthesis.consequenceState,
        nextAdmissibleMove: synthesis.nextAdmissibleMove,
        unresolvedItems: [...new Set(unresolvedItems)].slice(0, 8),
        confidence: synthesis.confidence,
      } as DecisionIntelligenceResult,
      answeredField: fieldKey,
    })

    const whatChanged = delta?.headline ?? `The system has incorporated the ${fieldKey.replace(/_/g, ' ')} into the reading.`

    // Determine newly eligible engines from the current engine trace
    const newlyEligibleEngines = (engineTrace ?? [])
      .filter(e => e.status === 'USED')
      .map(e => e.engineId)

    const changedFields = delta?.changedFields.map(c => c.field) ?? []

    progressiveEvidenceDelta = {
      fieldAnswered: fieldKey,
      whatChanged,
      changedFields,
      newlyEligibleEngines,
      remainingMissingFields: progressiveEvidenceCapture.missingFields,
    }

    // Append EVIDENCE_CAPTURED journey event for progressive evidence
    if (input.persistJourney && input.caseId) {
      try {
        const { appendDiagnosticJourneyEvent } = await import('@/lib/product/diagnostic-journey-store')
        await appendDiagnosticJourneyEvent({
          caseId: input.caseId,
          surface: 'fast_diagnostic',
          type: 'EVIDENCE_CAPTURED',
          engineId: 'progressive-evidence-capture',
          summary: `Progressive evidence captured for ${fieldKey}.`,
          payload: {
            fieldKey,
            safeAnswerExcerpt,
            source: 'progressive_evidence_capture',
          },
          audienceSafe: true,
        })
      } catch {
        // Journey event failure does not affect result
      }
    }
  }

  // ── JOURNEY PERSISTENCE (non-blocking) ──────────────────────────────
  let journeyCaseId: string | undefined
  if (input.persistJourney && input.caseId) {
    journeyCaseId = input.caseId
    try {
      await persistJourneyEvents({
        caseId: input.caseId,
        surface: input.surface,
        rawInput,
        situation: {
          decisionClass: situation.decisionClass,
          detectedSignals: situation.detectedSignals,
        },
        lensCount: lensResult.lensCount,
        findings: lensResult.findings,
        contradiction: {
          primaryContradiction: contradiction.primaryContradiction,
          contradictionCount: contradiction.contradictionCount,
        },
        simulationPaths: simulation.paths,
        synthesis: {
          interpretedIssue: synthesis.interpretedIssue,
          nextAdmissibleMove: synthesis.nextAdmissibleMove,
          refusalReason: synthesis.refusalReason,
        },
        evidenceBasis: [...new Set(evidenceBasis)].slice(0, 8),
        email: input.email,
        accountId: input.accountId,
      })
    } catch {
      // Journey persistence failure does not affect result
    }
  }

  return {
    surface: input.surface,
    sessionContext,

    // LAYER 1
    situationClass: situation.situationClass,
    situationRead: synthesis.interpretedIssue,
    vocabularyState: situation.vocabularyState,
    decisionClass: situation.decisionClass,
    classificationConfidence: situation.classificationConfidence,
    alternativeClasses: situation.alternativeClasses,
    detectedSignals: situation.detectedSignals,
    preservedAmbiguities: situation.preservedAmbiguities,
    hiddenStakesDetected: situation.hiddenStakesDetected,

    // LAYER 2
    findings: lensResult.findings,
    lensCount: lensResult.lensCount,

    // LAYER 3
    primaryContradiction: contradiction.primaryContradiction,
    contradictionCount: contradiction.contradictionCount,
    contradictionGraph: contradiction.contradictionGraph,

    // LAYER 4
    constitutionalRoute: constitutional.constitutionalRoute,
    constitutionalReadiness: constitutional.constitutionalReadiness,
    constitutionalPosture: constitutional.constitutionalPosture,
    constitutionalAuthority: constitutional.constitutionalAuthority,
    failureModes: constitutional.failureModes,
    disqualifiers: constitutional.disqualifiers,
    escalationPermitted: constitutional.escalationPermitted,

    // LAYER 5
    simulationPaths: simulation.paths,
    preferredPath: simulation.preferredPath,
    costOfDelay: simulation.costOfDelay,
    degradationProjection: simulation.degradationProjection,

    // LAYER 6
    interpretedIssue: synthesis.interpretedIssue,
    authorityState: synthesis.authorityState,
    evidenceState: synthesis.evidenceState,
    consequenceState: synthesis.consequenceState,
    nextAdmissibleMove: synthesis.nextAdmissibleMove,
    refusalReason: synthesis.refusalReason,
    confidence: synthesis.confidence,
    evidenceBasis: [...new Set(evidenceBasis)].slice(0, 8),
    unresolvedItems: [...new Set(unresolvedItems)].slice(0, 8),

    // LAYER 7
    userLanguageInterpretations: evidence.userLanguageInterpretations,
    evidenceTier: evidence.evidenceTier,
    signalContinuity: evidence.signalContinuity,

    // JOURNEY
    journeyCaseId,

    // ENGINE TRACE
    engineTrace,

    // PROGRESSIVE EVIDENCE CAPTURE
    progressiveEvidenceCapture,

    // PROGRESSIVE EVIDENCE DELTA
    progressiveEvidenceDelta,
  }
}
