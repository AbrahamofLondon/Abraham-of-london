/**
 * lib/intelligence/product-operating-matrix.ts
 *
 * Canonical operating matrix defining what every product surface captures,
 * which engines it may run, what records it must write, what outputs it may
 * show, and what it unlocks next.
 *
 * This is governance infrastructure — it prevents reactive patching by making
 * surface-engine relationships explicit and enforceable.
 *
 * Rules:
 *   - No product surface may be omitted.
 *   - Every ACTIVE engine must appear in at least one allowedEngines list.
 *   - Every GATED engine must appear in futureEnginePreparation for at least one surface.
 *   - Every surface that generates intelligence must write DiagnosticJourneyEvents.
 *   - Every surface that recommends action must prepare RecommendationOutcomeLedger entries.
 *   - No surface may show "living" output without engine/memory-backed data.
 */

import {
  ENGINE_ACTIVATION_REGISTRY,
  type ProductSurface,
} from '@/lib/intelligence/engine-activation-registry'

// Re-export for convenience
export type { ProductSurface } from '@/lib/intelligence/engine-activation-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SurfaceCaptureRequirement = {
  /** What user input this surface captures */
  inputs: string[]
  /** Whether user answers / structured responses are collected */
  collectsAnswers: boolean
  /** Whether this surface captures email / identity */
  capturesIdentity: boolean
}

export type SurfaceEnginePolicy = {
  /** Engines this surface may invoke */
  allowed: string[]
  /** Engines this surface must never invoke */
  prohibited: string[]
}

export type SurfacePersistencePolicy = {
  /** DiagnosticJourneyEvent types this surface must write */
  requiredJourneyEvents: string[]
  /** Whether this surface must write or prepare recommendation ledger entries */
  requiresRecommendationLedger: boolean
  /** Memory sources this surface consumes for display */
  memorySources: string[]
}

export type SurfaceOutputPolicy = {
  /** User-visible outputs this surface must produce */
  requiredUserVisibleOutputs: string[]
  /** Conditions under which this surface must refuse to produce output */
  refusalConditions: string[]
}

export type ProductOperatingSurfaceRecord = {
  surface: ProductSurface
  purpose: string
  captures: SurfaceCaptureRequirement
  requiredInputs: string[]
  engines: SurfaceEnginePolicy
  persistence: SurfacePersistencePolicy
  outputs: SurfaceOutputPolicy
  /** Which surfaces this surface unlocks */
  unlocks: ProductSurface[]
  /** GATED engines this surface should prepare inputs for */
  futureEnginePreparation: string[]
}

// ---------------------------------------------------------------------------
// Shared engine sets
// ---------------------------------------------------------------------------

const SITUATION_ENGINES = [
  'situation-translator', 'decision-class-taxonomy', 'hidden-signals', 'signal-confidence',
]

const LENS_ENGINES = [
  'kernel-lens-runner', 'authority-lens', 'evidence-lens', 'obligation-lens',
  'adversarial-lens', 'market-claim-lens', 'release-risk-lens', 'continuity-lens',
  'regulated-boundary-lens', 'failure-mode-lens', 'constraint-reality-lens',
  'commercial-proof-lens', 'investor-diligence-lens', 'launch-readiness-lens',
  'operational-ownership-lens', 'supplier-dependency-lens',
]

const CONTRADICTION_ENGINES = [
  'kernel-contradiction-resolver', 'contradiction-graph',
]

const SIMULATION_ENGINES = [
  'simulation-gate', 'cost-of-delay',
]

const SYNTHESIS_ENGINES = [
  'synthesis-gate', 'narrative-service', 'arbitration-service', 'weighting-service',
]

const EVIDENCE_ENGINES = [
  'evidence-tier-derivation', 'stage-contribution-derivation',
  'user-language-interpretation', 'signal-continuity',
]

const OUTPUT_ENGINES = [
  'living-layer-view-model', 'living-stream-events',
]

const CORE_DIAGNOSTIC_ENGINES = [
  ...SITUATION_ENGINES, ...LENS_ENGINES, ...CONTRADICTION_ENGINES,
  ...SIMULATION_ENGINES, ...SYNTHESIS_ENGINES, ...EVIDENCE_ENGINES,
  ...OUTPUT_ENGINES,
]

const CONSTITUTIONAL_ENGINES = [
  'constitutional-engine', 'assessment-engine', 'adversarial-preview',
]

const DEEP_ANALYSIS_ENGINES = [
  'domain-interdependency', 'decision-simulation-engine', 'synthesis-engine',
  'governed-memory-presenter',
]

// ---------------------------------------------------------------------------
// Matrix
// ---------------------------------------------------------------------------

export const PRODUCT_OPERATING_MATRIX: ProductOperatingSurfaceRecord[] = [
  // ─── FREE SIGNAL ────────────────────────────────────────────────────
  {
    surface: 'free_signal',
    purpose: 'First-contact signal detection — prove the system can read a situation without login or payment',
    captures: { inputs: ['rawUserInput'], collectsAnswers: false, capturesIdentity: false },
    requiredInputs: ['rawUserInput'],
    engines: {
      allowed: [
        'situation-translator', 'decision-class-taxonomy', 'public-situation-translation',
        'hidden-signals', 'signal-confidence', 'simulation-gate', 'synthesis-gate',
        'cost-of-delay', 'evidence-tier-derivation', 'user-language-interpretation',
        'narrative-service', 'arbitration-service', 'weighting-service',
        'living-stream-events',
      ],
      prohibited: [
        ...LENS_ENGINES, 'governed-memory-presenter', 'decision-simulation-engine',
        'domain-interdependency', 'synthesis-engine', 'assessment-engine',
        'adversarial-preview', 'living-layer-view-model',
      ],
    },
    persistence: {
      requiredJourneyEvents: ['SITUATION_TRANSLATED', 'SYNTHESIS_GENERATED'],
      requiresRecommendationLedger: false,
      memorySources: [],
    },
    outputs: {
      requiredUserVisibleOutputs: ['situation_read', 'detected_signals', 'next_admissible_move'],
      refusalConditions: ['rawUserInput is empty or trivial'],
    },
    unlocks: ['fast_diagnostic', 'purpose_alignment'],
    futureEnginePreparation: [],
  },

  // ─── FAST DIAGNOSTIC ────────────────────────────────────────────────
  {
    surface: 'fast_diagnostic',
    purpose: 'Structured diagnostic producing decision class, contradiction, simulation, and next move',
    captures: { inputs: ['rawUserInput', 'userAnswers'], collectsAnswers: true, capturesIdentity: false },
    requiredInputs: ['rawUserInput'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, 'public-situation-translation',
        'constitutional-engine',
      ],
      prohibited: [
        'decision-simulation-engine', 'domain-interdependency', 'synthesis-engine',
        'assessment-engine', 'adversarial-preview', 'governed-memory-presenter',
      ],
    },
    persistence: {
      requiredJourneyEvents: [
        'SITUATION_TRANSLATED', 'LENSES_RUN', 'CONTRADICTION_DETECTED',
        'SIMULATION_RUN', 'SYNTHESIS_GENERATED', 'ACTION_RECOMMENDED',
      ],
      requiresRecommendationLedger: true,
      memorySources: [],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'situation_read', 'decision_class', 'detected_signals',
        'simulation_paths', 'next_admissible_move', 'evidence_tier',
      ],
      refusalConditions: ['rawUserInput is empty or trivial', 'no signals detected'],
    },
    unlocks: ['purpose_alignment', 'constitutional_diagnostic', 'decision_centre'],
    futureEnginePreparation: ['contradiction-forcing'],
  },

  // ─── PURPOSE ALIGNMENT ──────────────────────────────────────────────
  {
    surface: 'purpose_alignment',
    purpose: 'Deep personal decision audit — mandate, obligation conflicts, alignment drift, next admissible move',
    captures: { inputs: ['rawUserInput', 'userAnswers', 'contextAnswers'], collectsAnswers: true, capturesIdentity: true },
    requiredInputs: ['userAnswers'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, 'public-situation-translation',
        'constitutional-engine', 'adversarial-preview', 'synthesis-engine',
        'governed-memory-presenter',
      ],
      prohibited: [
        'decision-simulation-engine', 'domain-interdependency', 'assessment-engine',
      ],
    },
    persistence: {
      requiredJourneyEvents: [
        'SITUATION_TRANSLATED', 'LENSES_RUN', 'SYNTHESIS_GENERATED',
        'ACTION_RECOMMENDED', 'EVIDENCE_CAPTURED',
      ],
      requiresRecommendationLedger: true,
      memorySources: ['journey_events', 'evidence_stages'],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'situation_read', 'decision_class', 'mandate_reading',
        'obligation_conflict_map', 'alignment_drift_warning',
        'next_admissible_move', 'evidence_tier', 'living_layer_progress',
      ],
      refusalConditions: ['userAnswers incomplete', 'no coherent situation detected'],
    },
    unlocks: ['constitutional_diagnostic', 'decision_centre', 'executive_reporting'],
    futureEnginePreparation: ['contradiction-forcing', 'similar-case-surfacer'],
  },

  // ─── CONSTITUTIONAL DIAGNOSTIC ──────────────────────────────────────
  {
    surface: 'constitutional_diagnostic',
    purpose: 'Constitutional assessment — route, readiness, authority, posture, failure modes, bridge to deeper surfaces',
    captures: { inputs: ['userAnswers'], collectsAnswers: true, capturesIdentity: true },
    requiredInputs: ['userAnswers'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, ...CONSTITUTIONAL_ENGINES,
        'domain-interdependency', 'decision-simulation-engine',
        'synthesis-engine', 'governed-memory-presenter',
      ],
      prohibited: [],
    },
    persistence: {
      requiredJourneyEvents: [
        'SITUATION_TRANSLATED', 'LENSES_RUN', 'CONTRADICTION_DETECTED',
        'SIMULATION_RUN', 'SYNTHESIS_GENERATED', 'ACTION_RECOMMENDED',
        'ROUTE_CHANGED',
      ],
      requiresRecommendationLedger: true,
      memorySources: ['journey_events', 'evidence_stages', 'constitutional_report'],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'constitutional_route', 'constitutional_readiness', 'constitutional_posture',
        'failure_modes', 'disqualifiers', 'next_admissible_move',
        'bridge_to_next_surface', 'living_layer_progress',
      ],
      refusalConditions: [
        'userAnswers incomplete', 'route is REJECT and disqualifiers present',
      ],
    },
    unlocks: ['team_assessment', 'enterprise_assessment', 'executive_reporting', 'strategy_room'],
    futureEnginePreparation: ['escalation-engine', 'route-correction', 'contradiction-forcing'],
  },

  // ─── TEAM ASSESSMENT ────────────────────────────────────────────────
  {
    surface: 'team_assessment',
    purpose: 'Multi-respondent team dynamics assessment with divergence analysis',
    captures: { inputs: ['userAnswers', 'respondentAnswers'], collectsAnswers: true, capturesIdentity: true },
    requiredInputs: ['userAnswers'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, 'constitutional-engine',
        'adversarial-preview', 'governed-memory-presenter',
      ],
      prohibited: ['decision-simulation-engine', 'assessment-engine'],
    },
    persistence: {
      requiredJourneyEvents: [
        'SITUATION_TRANSLATED', 'LENSES_RUN', 'SYNTHESIS_GENERATED',
        'EVIDENCE_CAPTURED',
      ],
      requiresRecommendationLedger: true,
      memorySources: ['journey_events', 'evidence_stages', 'respondent_data'],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'team_divergence_analysis', 'contradiction_summary',
        'next_admissible_move', 'evidence_tier',
      ],
      refusalConditions: ['insufficient respondent data', 'userAnswers incomplete'],
    },
    unlocks: ['enterprise_assessment', 'decision_centre'],
    futureEnginePreparation: ['contradiction-forcing', 'similar-case-surfacer'],
  },

  // ─── ENTERPRISE ASSESSMENT ──────────────────────────────────────────
  {
    surface: 'enterprise_assessment',
    purpose: 'Organisation-wide decision quality assessment with domain interdependency and scenario stress',
    captures: { inputs: ['userAnswers', 'organisationContext'], collectsAnswers: true, capturesIdentity: true },
    requiredInputs: ['userAnswers'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, ...CONSTITUTIONAL_ENGINES,
        'domain-interdependency', 'decision-simulation-engine',
        'synthesis-engine', 'governed-memory-presenter',
      ],
      prohibited: [],
    },
    persistence: {
      requiredJourneyEvents: [
        'SITUATION_TRANSLATED', 'LENSES_RUN', 'CONTRADICTION_DETECTED',
        'SIMULATION_RUN', 'SYNTHESIS_GENERATED', 'ACTION_RECOMMENDED',
        'EVIDENCE_CAPTURED',
      ],
      requiresRecommendationLedger: true,
      memorySources: ['journey_events', 'evidence_stages', 'constitutional_report'],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'domain_interdependency_map', 'scenario_stress_summary',
        'degradation_projection', 'next_admissible_move',
        'evidence_tier', 'living_layer_progress',
      ],
      refusalConditions: ['userAnswers incomplete', 'no organisational context available'],
    },
    unlocks: ['executive_reporting', 'strategy_room', 'decision_centre'],
    futureEnginePreparation: [
      'scenario-stress-test', 'escalation-engine', 'intervention-engine',
      'similar-case-surfacer', 'breach-detector', 'drift-rules',
      'drift-tribunal', 'assumption-drift-detector', 'failure-pattern-calibrator',
    ],
  },

  // ─── EXECUTIVE REPORTING ────────────────────────────────────────────
  {
    surface: 'executive_reporting',
    purpose: 'Board-ready intelligence reporting with constitutional guidance and governed memory',
    captures: { inputs: ['executiveContext'], collectsAnswers: false, capturesIdentity: true },
    requiredInputs: ['priorCaseState'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, ...CONSTITUTIONAL_ENGINES,
        'domain-interdependency', 'decision-simulation-engine',
        'synthesis-engine', 'governed-memory-presenter',
      ],
      prohibited: [],
    },
    persistence: {
      requiredJourneyEvents: ['SYNTHESIS_GENERATED', 'ACTION_RECOMMENDED'],
      requiresRecommendationLedger: true,
      memorySources: ['journey_events', 'evidence_stages', 'governed_memory', 'constitutional_report'],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'executive_summary', 'constitutional_guidance',
        'governed_memory_panel', 'degradation_projection',
        'next_admissible_move',
      ],
      refusalConditions: ['no prior case state available', 'evidence tier insufficient'],
    },
    unlocks: ['strategy_room', 'decision_centre'],
    futureEnginePreparation: [
      'escalation-engine', 'drift-rules', 'failure-pattern-calibrator',
    ],
  },

  // ─── DECISION CENTRE ───────────────────────────────────────────────
  {
    surface: 'decision_centre',
    purpose: 'Central case management hub — continuity, memory, velocity, outcome tracking',
    captures: { inputs: ['caseActions'], collectsAnswers: false, capturesIdentity: true },
    requiredInputs: ['authenticatedUser'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, ...CONSTITUTIONAL_ENGINES,
        ...DEEP_ANALYSIS_ENGINES,
      ],
      prohibited: [],
    },
    persistence: {
      requiredJourneyEvents: [
        'EVIDENCE_CAPTURED', 'MEMORY_ITEM_CREATED', 'CHECKPOINT_CREATED',
      ],
      requiresRecommendationLedger: true,
      memorySources: [
        'journey_events', 'evidence_stages', 'governed_memory',
        'pattern_recurrence', 'verification_boundary', 'purpose_alignment_evidence',
      ],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'case_card', 'continuity_status', 'governed_memory_panel',
        'evidence_tier', 'cost_of_inaction', 'completion_risk',
        'next_required_action', 'urgency_reasons',
      ],
      refusalConditions: ['user not authenticated', 'no cases exist'],
    },
    unlocks: ['strategy_room', 'executive_reporting'],
    futureEnginePreparation: [
      'drift-rules', 'drift-tribunal', 'breach-detector',
      'similar-case-surfacer', 'assumption-drift-detector',
      'failure-pattern-calibrator',
    ],
  },

  // ─── STRATEGY ROOM ─────────────────────────────────────────────────
  {
    surface: 'strategy_room',
    purpose: 'Governed decision execution — intervention stacks, constraint maps, outcome accountability',
    captures: { inputs: ['executionDecisions', 'outcomeReports'], collectsAnswers: true, capturesIdentity: true },
    requiredInputs: ['authenticatedUser', 'priorCaseState'],
    engines: {
      allowed: [
        ...CORE_DIAGNOSTIC_ENGINES, ...CONSTITUTIONAL_ENGINES,
        ...DEEP_ANALYSIS_ENGINES,
      ],
      prohibited: [],
    },
    persistence: {
      requiredJourneyEvents: [
        'ACTION_RECOMMENDED', 'OUTCOME_REPORTED', 'ROUTE_CHANGED',
        'ESCALATION_RECOMMENDED',
      ],
      requiresRecommendationLedger: true,
      memorySources: [
        'journey_events', 'evidence_stages', 'governed_memory',
        'recommendation_ledger', 'outcome_verification',
      ],
    },
    outputs: {
      requiredUserVisibleOutputs: [
        'intervention_stack', 'constraint_map', 'governed_memory_panel',
        'recommendation_status', 'outcome_tracking',
        'next_admissible_move', 'living_layer_progress',
      ],
      refusalConditions: [
        'user not authenticated', 'no prior case state',
        'evidence tier below multi_source',
      ],
    },
    unlocks: ['decision_centre'],
    futureEnginePreparation: [
      'escalation-engine', 'intervention-engine', 'drift-rules',
      'drift-tribunal', 'route-correction', 'assumption-drift-detector',
      'failure-pattern-calibrator',
    ],
  },

  // ─── OVERSIGHT ──────────────────────────────────────────────────────
  {
    surface: 'oversight',
    purpose: 'Internal operator view — system health, quality gates, drift monitoring',
    captures: { inputs: [], collectsAnswers: false, capturesIdentity: true },
    requiredInputs: ['operatorAccess'],
    engines: {
      allowed: [
        'kernel-quality-gates', 'human-review-protocol',
        'regulated-boundary-protocol', 'vetting-engine',
        'living-case-persistence', 'living-case-event-ledger',
        'kernel-version-tracker',
      ],
      prohibited: [...LENS_ENGINES, 'public-situation-translation'],
    },
    persistence: {
      requiredJourneyEvents: [],
      requiresRecommendationLedger: false,
      memorySources: ['system_audit', 'quality_gates'],
    },
    outputs: {
      requiredUserVisibleOutputs: ['system_health_dashboard', 'quality_gate_status', 'drift_monitoring'],
      refusalConditions: ['operator access not verified'],
    },
    unlocks: [],
    futureEnginePreparation: [
      'drift-rules', 'drift-tribunal', 'breach-detector',
      'assumption-drift-detector', 'failure-pattern-calibrator',
    ],
  },

  // ─── ADMIN ─────────────────────────────────────────────────────────
  {
    surface: 'admin',
    purpose: 'System administration — configuration, version tracking, audit trails',
    captures: { inputs: [], collectsAnswers: false, capturesIdentity: true },
    requiredInputs: ['adminAccess'],
    engines: {
      allowed: [
        'kernel-quality-gates', 'human-review-protocol',
        'regulated-boundary-protocol', 'vetting-engine',
        'living-case-persistence', 'living-case-event-ledger',
        'kernel-version-tracker',
      ],
      prohibited: [...LENS_ENGINES, ...SITUATION_ENGINES, 'public-situation-translation'],
    },
    persistence: {
      requiredJourneyEvents: [],
      requiresRecommendationLedger: false,
      memorySources: ['system_audit'],
    },
    outputs: {
      requiredUserVisibleOutputs: ['admin_dashboard', 'version_tracking', 'audit_trail'],
      refusalConditions: ['admin access not verified'],
    },
    unlocks: [],
    futureEnginePreparation: ['breach-detector', 'kernel-version-tracker'],
  },
]

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Get the operating record for a surface.
 */
export function getOperatingRecord(
  surface: ProductSurface,
): ProductOperatingSurfaceRecord | undefined {
  return PRODUCT_OPERATING_MATRIX.find(r => r.surface === surface)
}

/**
 * Get all engines allowed for a surface.
 */
export function getAllowedEnginesForSurface(
  surface: ProductSurface,
): string[] {
  const record = getOperatingRecord(surface)
  return record?.engines.allowed ?? []
}

/**
 * Assert that a surface may use a specific engine.
 * Throws if the engine is prohibited or not in the allowed list.
 */
export function assertSurfaceMayUseEngine(
  surface: ProductSurface,
  engineId: string,
): void {
  const record = getOperatingRecord(surface)
  if (!record) {
    throw new Error(`No operating record for surface: ${surface}`)
  }
  if (record.engines.prohibited.includes(engineId)) {
    throw new Error(
      `Surface "${surface}" explicitly prohibits engine "${engineId}"`,
    )
  }
  if (!record.engines.allowed.includes(engineId)) {
    throw new Error(
      `Surface "${surface}" does not allow engine "${engineId}". Allowed: ${record.engines.allowed.join(', ')}`,
    )
  }
}

/**
 * Get required journey events for a surface.
 */
export function getRequiredJourneyEvents(
  surface: ProductSurface,
): string[] {
  const record = getOperatingRecord(surface)
  return record?.persistence.requiredJourneyEvents ?? []
}

/**
 * Get future engine preparation list for a surface.
 */
export function getFutureEnginePreparation(
  surface: ProductSurface,
): string[] {
  return getOperatingRecord(surface)?.futureEnginePreparation ?? []
}

/**
 * Assert that the matrix covers every engine in the activation registry.
 * - Every ACTIVE engine must appear in at least one surface's allowed list.
 * - Every GATED engine must appear in at least one surface's futureEnginePreparation.
 * Throws with details if violated.
 */
export function assertMatrixCoversRegistry(): void {
  const allAllowed = new Set<string>()
  const allFuture = new Set<string>()

  for (const record of PRODUCT_OPERATING_MATRIX) {
    for (const id of record.engines.allowed) allAllowed.add(id)
    for (const id of record.futureEnginePreparation) allFuture.add(id)
  }

  const errors: string[] = []

  for (const engine of ENGINE_ACTIVATION_REGISTRY) {
    if (engine.status === 'ACTIVE' && !allAllowed.has(engine.engineId)) {
      errors.push(`ACTIVE engine "${engine.engineId}" not allowed by any surface`)
    }
    if (engine.status === 'GATED' && !allFuture.has(engine.engineId)) {
      errors.push(`GATED engine "${engine.engineId}" not in futureEnginePreparation of any surface`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Matrix-registry coverage violations:\n${errors.join('\n')}`)
  }
}
