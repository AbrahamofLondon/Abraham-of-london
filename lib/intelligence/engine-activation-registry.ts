/**
 * Engine Activation Registry
 *
 * Comprehensive registry of every engine in the decision intelligence platform.
 * Each entry declares its activation status, layer, eligible and active product
 * surfaces, required inputs, and output contract.
 *
 * Statuses:
 *   ACTIVE      — live in production, wired to at least one surface
 *   GATED       — code exists but blocked by a missing dependency (see gatedReason)
 *   DEPRECATED  — scheduled for removal (see gatedReason for replacement/reason)
 *   INTERNAL    — operational engine not exposed to clients
 *
 * Rules:
 *   - No engine may carry the status "AVAILABLE" (use assertNoAvailableStatus)
 *   - Every ACTIVE engine must have ≥1 activeSurface and either
 *     userVisibleDestination or outputContract
 *   - Every GATED engine must have gatedReason
 *   - Every DEPRECATED engine must have gatedReason (replacement / removal reason)
 *   - Every INTERNAL engine must explain why not client-facing via outputContract
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EngineActivationStatus = 'ACTIVE' | 'GATED' | 'DEPRECATED' | 'INTERNAL'

export type ProductSurface =
  | 'free_signal' | 'fast_diagnostic' | 'purpose_alignment'
  | 'constitutional_diagnostic' | 'team_assessment' | 'enterprise_assessment'
  | 'executive_reporting' | 'decision_centre' | 'strategy_room'
  | 'oversight' | 'admin'

export type EngineActivationRecord = {
  engineId: string
  engineName: string
  filePath: string
  layer:
    | 'SITUATION_UNDERSTANDING' | 'LENS_ANALYSIS' | 'CONTRADICTION'
    | 'CONSTITUTIONAL' | 'SIMULATION' | 'SYNTHESIS'
    | 'EVIDENCE_MEMORY' | 'OUTPUT' | 'OVERSIGHT'
  status: EngineActivationStatus
  requiredInputs: string[]
  eligibleSurfaces: ProductSurface[]
  activeSurfaces: ProductSurface[]
  outputContract: string
  userVisibleDestination?: string
  gatedReason?: string
  fallbackEngine?: string
  testCoverage?: string[]
}

// ---------------------------------------------------------------------------
// Shared surface sets
// ---------------------------------------------------------------------------

const ALL_CORE_SURFACES: ProductSurface[] = [
  'free_signal', 'fast_diagnostic', 'purpose_alignment',
  'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
  'executive_reporting', 'decision_centre', 'strategy_room',
]

const CORE_MINUS_FREE: ProductSurface[] = [
  'fast_diagnostic', 'purpose_alignment',
  'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
  'executive_reporting', 'decision_centre', 'strategy_room',
]

const DEEP_SURFACES: ProductSurface[] = [
  'constitutional_diagnostic', 'enterprise_assessment',
  'executive_reporting', 'decision_centre', 'strategy_room',
]

const PAID_SYNTHESIS_SURFACES: ProductSurface[] = [
  'purpose_alignment', 'constitutional_diagnostic',
  'enterprise_assessment', 'executive_reporting',
  'decision_centre', 'strategy_room',
]

const ENTERPRISE_PLUS: ProductSurface[] = [
  'enterprise_assessment', 'executive_reporting',
  'decision_centre', 'strategy_room',
]

const LENS_ELIGIBLE_SURFACES: ProductSurface[] = [
  'fast_diagnostic', 'purpose_alignment',
  'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
  'executive_reporting', 'decision_centre', 'strategy_room',
]

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const ENGINE_ACTIVATION_REGISTRY: EngineActivationRecord[] = [

  // =========================================================================
  // LAYER 1 — SITUATION_UNDERSTANDING
  // =========================================================================

  {
    engineId: 'situation-translator',
    engineName: 'SituationTranslator',
    filePath: 'lib/intelligence/situation-translator.ts',
    layer: 'SITUATION_UNDERSTANDING',
    status: 'ACTIVE',
    requiredInputs: ['rawUserInput'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'TranslationResult',
    userVisibleDestination: 'SituationRead display',
  },
  {
    engineId: 'decision-class-taxonomy',
    engineName: 'DecisionClassTaxonomy',
    filePath: 'lib/intelligence/decision-class-taxonomy.ts',
    layer: 'SITUATION_UNDERSTANDING',
    status: 'ACTIVE',
    requiredInputs: ['TranslationResult'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'ClassificationResult',
    userVisibleDestination: 'Decision class badge',
  },
  {
    engineId: 'public-situation-translation',
    engineName: 'PublicSituationTranslation',
    filePath: 'lib/kernel/public-situation-translation.ts',
    layer: 'SITUATION_UNDERSTANDING',
    status: 'ACTIVE',
    requiredInputs: ['rawUserInput'],
    eligibleSurfaces: ['free_signal', 'fast_diagnostic', 'purpose_alignment'],
    activeSurfaces: ['free_signal', 'fast_diagnostic'],
    outputContract: 'PressureSignalTranslation',
    userVisibleDestination: 'Free signal result card',
  },
  {
    engineId: 'hidden-signals',
    engineName: 'HiddenSignals',
    filePath: 'lib/engine/hidden-signals.ts',
    layer: 'SITUATION_UNDERSTANDING',
    status: 'ACTIVE',
    requiredInputs: ['rawUserInput', 'userAnswers'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: CORE_MINUS_FREE,
    outputContract: 'HiddenSignalResult',
  },
  {
    engineId: 'signal-confidence',
    engineName: 'SignalConfidence',
    filePath: 'lib/engine/signal-confidence.ts',
    layer: 'SITUATION_UNDERSTANDING',
    status: 'ACTIVE',
    requiredInputs: ['detectedSignals'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: CORE_MINUS_FREE,
    outputContract: 'ConfidenceResult',
  },

  // =========================================================================
  // LAYER 2 — LENS_ANALYSIS
  // =========================================================================

  {
    engineId: 'kernel-lens-runner',
    engineName: 'KernelLensRunner',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase', 'mandatoryLensIds'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: CORE_MINUS_FREE,
    outputContract: 'KernelLensResult[]',
    userVisibleDestination: 'Lens findings panel',
  },

  // Individual lenses
  {
    engineId: 'authority-lens',
    engineName: 'AuthorityLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'evidence-lens',
    engineName: 'EvidenceLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'obligation-lens',
    engineName: 'ObligationLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'adversarial-lens',
    engineName: 'AdversarialLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'market-claim-lens',
    engineName: 'MarketClaimLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'release-risk-lens',
    engineName: 'ReleaseRiskLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'continuity-lens',
    engineName: 'ContinuityLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'regulated-boundary-lens',
    engineName: 'RegulatedBoundaryLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'failure-mode-lens',
    engineName: 'FailureModeLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'constraint-reality-lens',
    engineName: 'ConstraintRealityLens',
    filePath: 'lib/intelligence/kernel-lens-runner.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'commercial-proof-lens',
    engineName: 'CommercialProofLens',
    filePath: 'lib/intelligence/lenses/commercial-proof-lens.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'investor-diligence-lens',
    engineName: 'InvestorDiligenceLens',
    filePath: 'lib/intelligence/lenses/investor-diligence-lens.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'launch-readiness-lens',
    engineName: 'LaunchReadinessLens',
    filePath: 'lib/intelligence/lenses/launch-readiness-lens.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'operational-ownership-lens',
    engineName: 'OperationalOwnershipLens',
    filePath: 'lib/intelligence/lenses/operational-ownership-lens.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },
  {
    engineId: 'supplier-dependency-lens',
    engineName: 'SupplierDependencyLens',
    filePath: 'lib/intelligence/lenses/supplier-dependency-lens.ts',
    layer: 'LENS_ANALYSIS',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: LENS_ELIGIBLE_SURFACES,
    activeSurfaces: LENS_ELIGIBLE_SURFACES,
    outputContract: 'KernelLensResult',
  },

  // =========================================================================
  // LAYER 3 — CONTRADICTION
  // =========================================================================

  {
    engineId: 'kernel-contradiction-resolver',
    engineName: 'KernelContradictionResolver',
    filePath: 'lib/intelligence/kernel-contradiction-resolver.ts',
    layer: 'CONTRADICTION',
    status: 'ACTIVE',
    requiredInputs: ['KernelLensResult[]'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'ResolvedContradiction[]',
  },
  {
    engineId: 'contradiction-graph',
    engineName: 'ContradictionGraph',
    filePath: 'lib/engine/contradiction-graph.ts',
    layer: 'CONTRADICTION',
    status: 'ACTIVE',
    requiredInputs: ['findings'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'ContradictionGraph',
  },
  {
    engineId: 'contradiction-forcing',
    engineName: 'ContradictionForcing',
    filePath: 'lib/engine/contradiction-forcing.ts',
    layer: 'CONTRADICTION',
    status: 'GATED',
    requiredInputs: ['userAnswers'],
    eligibleSurfaces: [
      'purpose_alignment', 'constitutional_diagnostic',
      'team_assessment', 'enterprise_assessment',
      'decision_centre', 'strategy_room',
    ],
    activeSurfaces: [],
    outputContract: 'ContradictionForce',
    gatedReason: 'Engine exists but has zero imports outside its own file — not invoked by any production path',
  },
  {
    engineId: 'domain-interdependency',
    engineName: 'DomainInterdependency',
    filePath: 'lib/engine/domain-interdependency.ts',
    layer: 'CONTRADICTION',
    status: 'GATED',
    requiredInputs: ['contradictionGraph', 'domainScores'],
    eligibleSurfaces: DEEP_SURFACES,
    activeSurfaces: [],
    outputContract: 'InterventionSequence',
    gatedReason: 'Requires contradictionGraph and domainScores; domainScores exist but contradictionGraph is not yet produced by the orchestrator',
  },

  // =========================================================================
  // LAYER 4 — CONSTITUTIONAL
  // =========================================================================

  {
    engineId: 'constitutional-engine',
    engineName: 'ConstitutionalEngine',
    filePath: 'lib/decision/system-constitution.ts',
    layer: 'CONSTITUTIONAL',
    status: 'ACTIVE',
    requiredInputs: ['TranslationResult', 'ClassificationResult'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'ConstitutionalAssessment',
    userVisibleDestination: 'Constitutional route badge',
  },
  {
    engineId: 'assessment-engine',
    engineName: 'AssessmentEngine',
    filePath: 'lib/decision/constitutional-guidance-assembler.ts',
    layer: 'CONSTITUTIONAL',
    status: 'ACTIVE',
    requiredInputs: ['KernelLensResult[]', 'ConstitutionalAssessment'],
    eligibleSurfaces: DEEP_SURFACES,
    activeSurfaces: DEEP_SURFACES,
    outputContract: 'ConstitutionalAssemblerOutput',
    userVisibleDestination: 'Constitutional guidance in strategy room, executive reporting, and decision guidance',
  },
  {
    engineId: 'adversarial-preview',
    engineName: 'AdversarialPreview',
    filePath: 'lib/kernel/adversarial-preview.ts',
    layer: 'CONSTITUTIONAL',
    status: 'ACTIVE',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: PAID_SYNTHESIS_SURFACES,
    activeSurfaces: PAID_SYNTHESIS_SURFACES,
    outputContract: 'AdversarialPreview',
    userVisibleDestination: 'Adversarial challenge panel',
  },
  {
    engineId: 'escalation-engine',
    engineName: 'EscalationEngine',
    filePath: 'lib/engine/orchestrator.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['ConstitutionalAssessment', 'caseMemory'],
    eligibleSurfaces: ENTERPRISE_PLUS,
    activeSurfaces: [],
    outputContract: 'EscalationResult',
    gatedReason: 'Requires case memory store and entitlement verification — not yet wired to persistent case store',
  },
  {
    engineId: 'intervention-engine',
    engineName: 'InterventionEngine',
    filePath: 'lib/engine/domain-interdependency.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['DriftTribunalFindings', 'ConstitutionalAssessment'],
    eligibleSurfaces: ENTERPRISE_PLUS,
    activeSurfaces: [],
    outputContract: 'InterventionSequence',
    gatedReason: 'Requires DriftTribunal findings which depend on case memory persistence',
  },
  {
    engineId: 'breach-detector',
    engineName: 'BreachDetector',
    filePath: 'lib/contracts/breach.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['PatternBreakerContract', 'checkpointId'],
    eligibleSurfaces: ['decision_centre', 'oversight', 'admin'],
    activeSurfaces: [],
    outputContract: 'BreachResult',
    gatedReason: 'Requires PatternBreakerContract store — currently only wired for contract breach, not constitutional breach',
  },
  {
    engineId: 'drift-rules',
    engineName: 'DriftRules',
    filePath: 'lib/decision/recommendation-drift-alerts.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['caseMemory', 'priorRecommendations'],
    eligibleSurfaces: ['decision_centre', 'strategy_room', 'oversight'],
    activeSurfaces: [],
    outputContract: 'DriftAlert[]',
    gatedReason: 'Requires case memory with prior recommendations — not yet wired to persistent case store',
  },
  {
    engineId: 'drift-tribunal',
    engineName: 'DriftTribunal',
    filePath: 'lib/decision/recommendation-drift-alerts.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['DriftAlert[]', 'caseMemory'],
    eligibleSurfaces: ['decision_centre', 'strategy_room', 'oversight'],
    activeSurfaces: [],
    outputContract: 'TribunalFinding[]',
    gatedReason: 'Requires case memory with drift history — not yet wired to persistent case store',
  },
  {
    engineId: 'route-correction',
    engineName: 'RouteCorrection',
    filePath: 'lib/decision/system-constitution.ts',
    layer: 'CONSTITUTIONAL',
    status: 'GATED',
    requiredInputs: ['ConstitutionalAssessment', 'newEvidence'],
    eligibleSurfaces: ['decision_centre', 'strategy_room'],
    activeSurfaces: [],
    outputContract: 'CorrectedRoute',
    gatedReason: 'Requires multi-turn evidence accumulation — awaiting persistent case store',
  },

  // =========================================================================
  // LAYER 5 — SIMULATION
  // =========================================================================

  {
    engineId: 'simulation-gate',
    engineName: 'SimulationGate',
    filePath: 'lib/kernel/simulation-gate.ts',
    layer: 'SIMULATION',
    status: 'ACTIVE',
    requiredInputs: ['LiveSessionContext'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'SimulationGateResult',
    userVisibleDestination: 'Simulation paths panel',
  },
  {
    engineId: 'decision-simulation-engine',
    engineName: 'DecisionSimulationEngine',
    filePath: 'lib/engine/decision-simulation.ts',
    layer: 'SIMULATION',
    status: 'ACTIVE',
    requiredInputs: ['ContradictionGraph'],
    eligibleSurfaces: DEEP_SURFACES,
    activeSurfaces: DEEP_SURFACES,
    outputContract: 'DecisionSimulation',
    userVisibleDestination: '30/60/90 day degradation projections in executive reporting and strategy room',
  },
  {
    engineId: 'cost-of-delay',
    engineName: 'CostOfDelay',
    filePath: 'lib/engine/cost-of-delay.ts',
    layer: 'SIMULATION',
    status: 'ACTIVE',
    requiredInputs: ['currentScore', 'degradationRate', 'criticalThreshold'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'CostOfDelay',
    userVisibleDestination: 'Cost of delay narrative',
  },
  {
    engineId: 'scenario-stress-test',
    engineName: 'ScenarioStressTest',
    filePath: 'lib/engine/scenario-stress-test.ts',
    layer: 'SIMULATION',
    status: 'ACTIVE',
    requiredInputs: ['scenarioResponses'],
    eligibleSurfaces: ENTERPRISE_PLUS,
    activeSurfaces: ['enterprise_assessment'],
    outputContract: 'StressTestResult',
    userVisibleDestination: 'Enterprise scenario stress findings and orchestrator engine trace when valid scenario responses are supplied',
  },

  // =========================================================================
  // LAYER 6 — SYNTHESIS
  // =========================================================================

  {
    engineId: 'synthesis-gate',
    engineName: 'SynthesisGate',
    filePath: 'lib/kernel/synthesis-gate.ts',
    layer: 'SYNTHESIS',
    status: 'ACTIVE',
    requiredInputs: ['LiveSessionContext', 'SimulationGateResult'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'SynthesisGateResult',
    userVisibleDestination: 'Next admissible move',
  },
  {
    engineId: 'synthesis-engine',
    engineName: 'SynthesisEngine',
    filePath: 'lib/decision/synthesis-engine.ts',
    layer: 'SYNTHESIS',
    status: 'ACTIVE',
    requiredInputs: ['CaseObject'],
    eligibleSurfaces: PAID_SYNTHESIS_SURFACES,
    activeSurfaces: PAID_SYNTHESIS_SURFACES,
    outputContract: 'GovernedSynthesis',
  },
  {
    engineId: 'narrative-service',
    engineName: 'NarrativeService',
    filePath: 'lib/engine/narrative.service.ts',
    layer: 'SYNTHESIS',
    status: 'ACTIVE',
    requiredInputs: ['weightedSignals'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'NarrativeResult',
  },
  {
    engineId: 'arbitration-service',
    engineName: 'ArbitrationService',
    filePath: 'lib/engine/arbitration.service.ts',
    layer: 'SYNTHESIS',
    status: 'ACTIVE',
    requiredInputs: ['constitutionalSignals'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'ArbitrationResult',
  },
  {
    engineId: 'weighting-service',
    engineName: 'WeightingService',
    filePath: 'lib/engine/weighting.service.ts',
    layer: 'SYNTHESIS',
    status: 'ACTIVE',
    requiredInputs: ['signals', 'context'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'WeightedSignals',
  },

  // =========================================================================
  // LAYER 7 — EVIDENCE_MEMORY
  // =========================================================================

  {
    engineId: 'evidence-tier-derivation',
    engineName: 'EvidenceTierDerivation',
    filePath: 'lib/product/evidence-tier-derivation.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'ACTIVE',
    requiredInputs: ['completedStages', 'currentSessionSignals'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'EvidenceTierResult',
    userVisibleDestination: 'Evidence strength meter',
  },
  {
    engineId: 'stage-contribution-derivation',
    engineName: 'StageContributionDerivation',
    filePath: 'lib/product/stage-contribution-derivation.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'ACTIVE',
    requiredInputs: ['stageKey'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'StageContribution',
  },
  {
    engineId: 'user-language-interpretation',
    engineName: 'UserLanguageInterpretation',
    filePath: 'lib/product/user-language-interpretation.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'ACTIVE',
    requiredInputs: ['quotes', 'detectedSignals'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'UserLanguageInterpretation[]',
    userVisibleDestination: 'Quote interpretation panel',
  },
  {
    engineId: 'signal-continuity',
    engineName: 'SignalContinuity',
    filePath: 'lib/product/signal-continuity.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'ACTIVE',
    requiredInputs: ['signalKey', 'currentSeverity', 'sourceStage'],
    eligibleSurfaces: ['purpose_alignment', 'constitutional_diagnostic', 'enterprise_assessment', 'decision_centre', 'strategy_room'],
    activeSurfaces: ['purpose_alignment', 'constitutional_diagnostic', 'enterprise_assessment', 'decision_centre', 'strategy_room'],
    outputContract: 'SignalContinuityResult',
    userVisibleDestination: 'Signal continuity badge — shows NEW, REPEATED, WORSENING, IMPROVING, or RESOLVED',
  },
  {
    engineId: 'governed-memory-presenter',
    engineName: 'GovernedMemoryPresenter',
    filePath: 'lib/product/governed-memory-presenter.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'ACTIVE',
    requiredInputs: ['evidenceStages', 'DiagnosticJourneyRecord'],
    eligibleSurfaces: PAID_SYNTHESIS_SURFACES,
    activeSurfaces: ['decision_centre', 'strategy_room', 'executive_reporting'],
    outputContract: 'GovernedMemoryItem[]',
    userVisibleDestination: 'Governed memory panel in Decision Centre and Strategy Room',
  },
  {
    engineId: 'similar-case-surfacer',
    engineName: 'SimilarCaseSurfacer',
    filePath: 'lib/intelligence/outcome-learning/similar-case-surfacer.ts',
    layer: 'EVIDENCE_MEMORY',
    status: 'GATED',
    requiredInputs: ['LivingDecisionCase', 'caseStore'],
    eligibleSurfaces: ['decision_centre', 'strategy_room'],
    activeSurfaces: [],
    outputContract: 'SimilarCase[]',
    gatedReason: 'Requires populated case store with resolved cases — case store not yet in production',
  },

  // =========================================================================
  // LAYER 8 — OUTPUT
  // =========================================================================

  {
    engineId: 'living-layer-view-model',
    engineName: 'LivingLayerViewModel',
    filePath: 'lib/kernel/living-layer-view-model.ts',
    layer: 'OUTPUT',
    status: 'ACTIVE',
    requiredInputs: ['LivingLayerRuntimeInput'],
    eligibleSurfaces: PAID_SYNTHESIS_SURFACES,
    activeSurfaces: PAID_SYNTHESIS_SURFACES,
    outputContract: 'LivingLayerViewModel',
    userVisibleDestination: 'Living layer progress panel',
  },
  {
    engineId: 'living-stream-events',
    engineName: 'LivingStreamEvents',
    filePath: 'lib/kernel/living-stream-events.ts',
    layer: 'OUTPUT',
    status: 'ACTIVE',
    requiredInputs: ['stageData'],
    eligibleSurfaces: ALL_CORE_SURFACES,
    activeSurfaces: ALL_CORE_SURFACES,
    outputContract: 'LivingStreamEvent',
  },

  // =========================================================================
  // LAYER 9 — OVERSIGHT
  // =========================================================================

  {
    engineId: 'kernel-quality-gates',
    engineName: 'KernelQualityGates',
    filePath: 'lib/intelligence/kernel-quality-gates.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'QualityGateResult — internal quality validation, not exposed to clients',
  },
  {
    engineId: 'human-review-protocol',
    engineName: 'HumanReviewProtocol',
    filePath: 'lib/intelligence/human-review-protocol.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['LivingDecisionCase', 'regulatedBoundary'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'HumanReviewDecision — internal routing protocol, determines review tier, not client-visible',
  },
  {
    engineId: 'regulated-boundary-protocol',
    engineName: 'RegulatedBoundaryProtocol',
    filePath: 'lib/intelligence/regulated-boundary-protocol.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'RegulatedBoundaryResult — internal safety boundary, prevents system from crossing into regulated advice',
  },
  {
    engineId: 'vetting-engine',
    engineName: 'VettingEngine',
    filePath: 'lib/intelligence/vetting-engine.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'VettingResult — full pre-release vetting pipeline, internal quality assurance only',
  },
  {
    engineId: 'living-case-persistence',
    engineName: 'LivingCasePersistence',
    filePath: 'lib/intelligence/living-case-persistence.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['LivingDecisionCase'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'PersistenceResult — internal case storage management, not exposed to clients',
  },
  {
    engineId: 'living-case-event-ledger',
    engineName: 'LivingCaseEventLedger',
    filePath: 'lib/intelligence/living-case-events.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['caseId', 'eventType'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'LivingCaseEvent — internal audit trail, tracks all case state changes for governance',
  },
  {
    engineId: 'assumption-drift-detector',
    engineName: 'AssumptionDriftDetector',
    filePath: 'lib/intelligence/outcome-learning/assumption-drift-detector.ts',
    layer: 'OVERSIGHT',
    status: 'GATED',
    requiredInputs: ['caseMemory', 'outcomeRecord'],
    eligibleSurfaces: ['decision_centre', 'strategy_room', 'oversight'],
    activeSurfaces: [],
    outputContract: 'DriftDetection',
    gatedReason: 'Requires outcome record from completed case — outcome learning loop not yet wired to production',
  },
  {
    engineId: 'failure-pattern-calibrator',
    engineName: 'FailurePatternCalibrator',
    filePath: 'lib/intelligence/outcome-learning/failure-pattern-calibrator.ts',
    layer: 'OVERSIGHT',
    status: 'GATED',
    requiredInputs: ['outcomeRecords', 'decisionClass'],
    eligibleSurfaces: ['decision_centre', 'strategy_room', 'oversight'],
    activeSurfaces: [],
    outputContract: 'CalibrationResult',
    gatedReason: 'Requires historical outcome records — outcome learning loop not yet wired to production',
  },
  {
    engineId: 'kernel-version-tracker',
    engineName: 'KernelVersionTracker',
    filePath: 'lib/intelligence/outcome-learning/kernel-version-tracker.ts',
    layer: 'OVERSIGHT',
    status: 'INTERNAL',
    requiredInputs: ['kernelVersion'],
    eligibleSurfaces: ['admin', 'oversight'],
    activeSurfaces: [],
    outputContract: 'VersionTrackingResult — internal kernel version compatibility tracking, not client-facing',
  },
]

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export function getEnginesForSurface(surface: ProductSurface): EngineActivationRecord[] {
  return ENGINE_ACTIVATION_REGISTRY.filter(
    e => e.status === 'ACTIVE' && e.activeSurfaces.includes(surface)
  )
}

export function getGatedEngines(): EngineActivationRecord[] {
  return ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'GATED')
}

export function getInternalEngines(): EngineActivationRecord[] {
  return ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'INTERNAL')
}

export function getEngineById(engineId: string): EngineActivationRecord | undefined {
  return ENGINE_ACTIVATION_REGISTRY.find(e => e.engineId === engineId)
}

export function getEnginesForLayer(layer: EngineActivationRecord['layer']): EngineActivationRecord[] {
  return ENGINE_ACTIVATION_REGISTRY.filter(e => e.layer === layer)
}

export function assertNoAvailableStatus(): void {
  const violations = ENGINE_ACTIVATION_REGISTRY.filter(
    (e: any) => e.status === 'AVAILABLE'
  )
  if (violations.length > 0) {
    throw new Error(
      `Registry violation: ${violations.length} engine(s) have forbidden status AVAILABLE: ${violations.map((e: any) => e.engineId).join(', ')}`
    )
  }
}

export function validateRegistry(): string[] {
  const errors: string[] = []
  for (const engine of ENGINE_ACTIVATION_REGISTRY) {
    if (engine.status === 'ACTIVE') {
      if (engine.activeSurfaces.length === 0) {
        errors.push(`${engine.engineId}: ACTIVE engine has no activeSurfaces`)
      }
      if (!engine.userVisibleDestination && !engine.outputContract) {
        errors.push(`${engine.engineId}: ACTIVE engine has no userVisibleDestination or outputContract`)
      }
    }
    if (engine.status === 'GATED' && !engine.gatedReason) {
      errors.push(`${engine.engineId}: GATED engine has no gatedReason`)
    }
    if (engine.status === 'DEPRECATED' && !engine.gatedReason) {
      errors.push(`${engine.engineId}: DEPRECATED engine has no removal reason in gatedReason`)
    }
    if (engine.requiredInputs.length === 0) {
      errors.push(`${engine.engineId}: engine has no requiredInputs`)
    }
  }
  return errors
}
