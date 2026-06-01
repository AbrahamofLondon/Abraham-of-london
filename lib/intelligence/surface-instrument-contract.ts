/**
 * lib/intelligence/surface-instrument-contract.ts
 *
 * Defines the structured input/output instrument for every product surface.
 * Each contract specifies what the surface asks, why, which engines each field
 * unlocks, what output becomes possible, and what must be refused if missing.
 *
 * Rules:
 *   - No engine may be activated without its required fields present.
 *   - No output may be claimed without supporting fields.
 *   - No private respondent text may be exposed unless privacyLevel permits.
 *   - No cross-respondent insight from a single respondent.
 */

import type { ProductSurface } from '@/lib/intelligence/engine-activation-registry'

// Re-export for convenience
export type { ProductSurface } from '@/lib/intelligence/engine-activation-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SurfaceInstrumentField = {
  key: string
  label: string
  purpose: string
  requiredForEngines: string[]
  required: boolean
  inputType: 'text' | 'textarea' | 'scale' | 'select' | 'multi_select'
  privacyLevel: 'client_safe' | 'aggregate_only' | 'private'
}

export type SurfaceInstrumentContract = {
  surface: ProductSurface
  primaryUserQuestion: string
  fields: SurfaceInstrumentField[]
  minimumViableInput: string[]
  wowOutputRequirements: string[]
  refusalConditions: string[]
  engineUnlocks: Array<{
    engineId: string
    requiredFields: string[]
    outputEnabled: string
  }>
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

const FREE_SIGNAL_CONTRACT: SurfaceInstrumentContract = {
  surface: 'free_signal',
  primaryUserQuestion: 'Describe the decision or situation you are facing.',
  fields: [
    {
      key: 'situation',
      label: 'Situation description',
      purpose: 'Raw input for situation translation and signal detection',
      requiredForEngines: ['situation-translator', 'decision-class-taxonomy', 'hidden-signals', 'signal-confidence'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
  ],
  minimumViableInput: ['situation'],
  wowOutputRequirements: [
    'situation_read',
    'decision_class',
    'detected_signals',
    'next_admissible_move',
  ],
  refusalConditions: [
    'situation is empty or trivial (fewer than 10 characters)',
  ],
  engineUnlocks: [
    { engineId: 'situation-translator', requiredFields: ['situation'], outputEnabled: 'TranslationResult with decision class, vocabulary state, signals' },
    { engineId: 'decision-class-taxonomy', requiredFields: ['situation'], outputEnabled: 'ClassificationResult with 12-class taxonomy' },
    { engineId: 'hidden-signals', requiredFields: ['situation'], outputEnabled: 'Hidden signal detection: contradiction density, hesitation, compression' },
    { engineId: 'signal-confidence', requiredFields: ['situation'], outputEnabled: 'Confidence weighting for detected signals' },
    { engineId: 'public-situation-translation', requiredFields: ['situation'], outputEnabled: 'Safe user-facing signal display' },
    { engineId: 'simulation-gate', requiredFields: ['situation'], outputEnabled: 'Bounded assumption paths with risk shift' },
    { engineId: 'synthesis-gate', requiredFields: ['situation'], outputEnabled: 'Situation read and next admissible move' },
    { engineId: 'cost-of-delay', requiredFields: ['situation'], outputEnabled: 'Urgency narrative when consequence signals detected' },
  ],
}

const FAST_DIAGNOSTIC_CONTRACT: SurfaceInstrumentContract = {
  surface: 'fast_diagnostic',
  primaryUserQuestion: 'What decision are you trying to make, and what is blocking it?',
  fields: [
    {
      key: 'situation',
      label: 'Decision situation',
      purpose: 'Raw input for full diagnostic pipeline',
      requiredForEngines: ['situation-translator', 'decision-class-taxonomy', 'hidden-signals', 'signal-confidence'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'decision_owner',
      label: 'Who is responsible for this decision?',
      purpose: 'Authority mapping and escalation detection',
      requiredForEngines: ['authority-lens', 'constitutional-engine'],
      required: false,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'blocker',
      label: 'What is currently blocking progress?',
      purpose: 'Contradiction detection and failure mode analysis',
      requiredForEngines: ['kernel-contradiction-resolver', 'failure-mode-lens', 'contradiction-graph'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'deadline',
      label: 'Is there a deadline or time pressure?',
      purpose: 'Cost of delay quantification and urgency detection',
      requiredForEngines: ['cost-of-delay', 'simulation-gate'],
      required: false,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'consequence',
      label: 'What happens if this decision is delayed or wrong?',
      purpose: 'Consequence mapping and risk shift analysis',
      requiredForEngines: ['simulation-gate', 'cost-of-delay', 'synthesis-gate'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'authority_uncertainty',
      label: 'Is it clear who has authority to approve this?',
      purpose: 'Authority gap detection for constitutional analysis',
      requiredForEngines: ['authority-lens', 'constitutional-engine'],
      required: false,
      inputType: 'select',
      privacyLevel: 'client_safe',
    },
    {
      key: 'evidence_uncertainty',
      label: 'How confident are you in the information you have?',
      purpose: 'Evidence tier derivation and gap detection',
      requiredForEngines: ['evidence-lens', 'evidence-tier-derivation'],
      required: false,
      inputType: 'scale',
      privacyLevel: 'client_safe',
    },
  ],
  minimumViableInput: ['situation'],
  wowOutputRequirements: [
    'situation_read',
    'decision_class',
    'detected_signals',
    'lens_findings',
    'contradiction_summary',
    'simulation_paths',
    'next_admissible_move',
    'evidence_tier',
    'cost_of_delay_narrative',
  ],
  refusalConditions: [
    'situation is empty or trivial',
    'no signals detected from any engine',
  ],
  engineUnlocks: [
    { engineId: 'situation-translator', requiredFields: ['situation'], outputEnabled: 'TranslationResult' },
    { engineId: 'decision-class-taxonomy', requiredFields: ['situation'], outputEnabled: 'ClassificationResult' },
    { engineId: 'hidden-signals', requiredFields: ['situation'], outputEnabled: 'Hidden signal detection' },
    { engineId: 'signal-confidence', requiredFields: ['situation'], outputEnabled: 'Confidence weighting' },
    { engineId: 'kernel-lens-runner', requiredFields: ['situation'], outputEnabled: 'Full lens analysis' },
    { engineId: 'authority-lens', requiredFields: ['situation'], outputEnabled: 'Authority gap detection' },
    { engineId: 'evidence-lens', requiredFields: ['situation'], outputEnabled: 'Evidence sufficiency assessment' },
    { engineId: 'obligation-lens', requiredFields: ['situation'], outputEnabled: 'Obligation mapping' },
    { engineId: 'adversarial-lens', requiredFields: ['situation'], outputEnabled: 'Adversarial challenge vectors' },
    { engineId: 'market-claim-lens', requiredFields: ['situation'], outputEnabled: 'Market claim validation' },
    { engineId: 'release-risk-lens', requiredFields: ['situation'], outputEnabled: 'Release risk assessment' },
    { engineId: 'continuity-lens', requiredFields: ['situation'], outputEnabled: 'Continuity implications' },
    { engineId: 'regulated-boundary-lens', requiredFields: ['situation'], outputEnabled: 'Regulatory boundary detection' },
    { engineId: 'failure-mode-lens', requiredFields: ['situation'], outputEnabled: 'Failure mode analysis' },
    { engineId: 'constraint-reality-lens', requiredFields: ['situation'], outputEnabled: 'Constraint reality check' },
    { engineId: 'commercial-proof-lens', requiredFields: ['situation'], outputEnabled: 'Commercial viability' },
    { engineId: 'investor-diligence-lens', requiredFields: ['situation'], outputEnabled: 'Investment readiness' },
    { engineId: 'launch-readiness-lens', requiredFields: ['situation'], outputEnabled: 'Launch preparation' },
    { engineId: 'operational-ownership-lens', requiredFields: ['situation'], outputEnabled: 'Operational clarity' },
    { engineId: 'supplier-dependency-lens', requiredFields: ['situation'], outputEnabled: 'Supply chain risk' },
    { engineId: 'kernel-contradiction-resolver', requiredFields: ['situation'], outputEnabled: 'Cross-lens contradiction resolution' },
    { engineId: 'contradiction-graph', requiredFields: ['situation'], outputEnabled: 'Structural contradiction backbone' },
    { engineId: 'simulation-gate', requiredFields: ['situation'], outputEnabled: 'Bounded assumption paths' },
    { engineId: 'cost-of-delay', requiredFields: ['situation'], outputEnabled: 'Urgency quantification' },
    { engineId: 'synthesis-gate', requiredFields: ['situation'], outputEnabled: 'Situation read and next move' },
    { engineId: 'evidence-tier-derivation', requiredFields: ['situation'], outputEnabled: 'Conservative evidence strength' },
    { engineId: 'user-language-interpretation', requiredFields: ['situation'], outputEnabled: 'Quote-to-intelligence mapping' },
    { engineId: 'signal-continuity', requiredFields: ['situation'], outputEnabled: 'Signal trend detection' },
    { engineId: 'stage-contribution-derivation', requiredFields: ['situation'], outputEnabled: 'Stage contribution text' },
    { engineId: 'constitutional-engine', requiredFields: ['situation'], outputEnabled: 'Constitutional route assessment' },
    { engineId: 'living-stream-events', requiredFields: ['situation'], outputEnabled: 'Stage event stream' },
    { engineId: 'living-layer-view-model', requiredFields: ['situation'], outputEnabled: 'Living layer progress' },
    { engineId: 'narrative-service', requiredFields: ['situation'], outputEnabled: 'Narrative composition' },
    { engineId: 'arbitration-service', requiredFields: ['situation'], outputEnabled: 'Constitutional route arbitration' },
    { engineId: 'weighting-service', requiredFields: ['situation'], outputEnabled: 'Signal weighting' },
    { engineId: 'public-situation-translation', requiredFields: ['situation'], outputEnabled: 'Safe display data' },
    // Gated engine preparation
    { engineId: 'contradiction-forcing', requiredFields: ['situation', 'blocker'], outputEnabled: 'Forced contradiction from answer patterns (GATED — requires diagnostic answers)' },
  ],
}

const PURPOSE_ALIGNMENT_CONTRACT: SurfaceInstrumentContract = {
  surface: 'purpose_alignment',
  primaryUserQuestion: 'What decision have you been avoiding, and what would it cost to keep avoiding it?',
  fields: [
    {
      key: 'stated_purpose',
      label: 'What is the core purpose of this role or organisation?',
      purpose: 'Mandate clarity reading and alignment drift detection',
      requiredForEngines: ['situation-translator', 'constitutional-engine'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'avoided_decision',
      label: 'What decision have you been avoiding?',
      purpose: 'Core input for obligation conflict map and alignment drift',
      requiredForEngines: ['situation-translator', 'hidden-signals', 'adversarial-lens'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'competing_obligation',
      label: 'What competing obligation prevents you from acting?',
      purpose: 'Obligation conflict mapping and constraint detection',
      requiredForEngines: ['obligation-lens', 'constraint-reality-lens', 'contradiction-graph'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'tolerated_dysfunction',
      label: 'What dysfunction have you been tolerating?',
      purpose: 'Hidden signal detection and failure mode analysis',
      requiredForEngines: ['hidden-signals', 'failure-mode-lens', 'adversarial-preview'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'consequence_of_delay',
      label: 'What happens if you delay this decision another 30 days?',
      purpose: 'Cost of delay quantification and simulation input',
      requiredForEngines: ['cost-of-delay', 'simulation-gate', 'synthesis-gate'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'justifying_evidence',
      label: 'What evidence would justify action?',
      purpose: 'Evidence gap detection and tier derivation',
      requiredForEngines: ['evidence-lens', 'evidence-tier-derivation'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
  ],
  minimumViableInput: ['stated_purpose', 'avoided_decision', 'competing_obligation'],
  wowOutputRequirements: [
    'mandate_reading',
    'obligation_conflict_map',
    'alignment_drift_warning',
    'decision_behaviour_pattern',
    'execution_integrity_implication',
    'personal_decision_constitution',
    'next_admissible_move',
    'cost_of_delay_narrative',
    'living_layer_progress',
  ],
  refusalConditions: [
    'stated_purpose is empty',
    'avoided_decision is empty',
    'competing_obligation is empty',
    'no coherent situation detected from combined inputs',
  ],
  engineUnlocks: [
    { engineId: 'situation-translator', requiredFields: ['avoided_decision'], outputEnabled: 'TranslationResult from avoided decision' },
    { engineId: 'decision-class-taxonomy', requiredFields: ['avoided_decision'], outputEnabled: 'ClassificationResult' },
    { engineId: 'hidden-signals', requiredFields: ['avoided_decision', 'tolerated_dysfunction'], outputEnabled: 'Deep hidden signal detection from avoidance patterns' },
    { engineId: 'signal-confidence', requiredFields: ['avoided_decision'], outputEnabled: 'Confidence weighting' },
    { engineId: 'kernel-lens-runner', requiredFields: ['avoided_decision'], outputEnabled: 'Full lens analysis' },
    { engineId: 'obligation-lens', requiredFields: ['competing_obligation'], outputEnabled: 'Obligation conflict mapping' },
    { engineId: 'constraint-reality-lens', requiredFields: ['competing_obligation'], outputEnabled: 'Constraint reality check' },
    { engineId: 'adversarial-lens', requiredFields: ['avoided_decision'], outputEnabled: 'Adversarial challenge vectors' },
    { engineId: 'adversarial-preview', requiredFields: ['avoided_decision'], outputEnabled: 'Adversarial challenge panel' },
    { engineId: 'failure-mode-lens', requiredFields: ['tolerated_dysfunction'], outputEnabled: 'Failure mode from tolerated dysfunction' },
    { engineId: 'cost-of-delay', requiredFields: ['consequence_of_delay'], outputEnabled: 'Math-based urgency from stated consequence' },
    { engineId: 'simulation-gate', requiredFields: ['avoided_decision'], outputEnabled: 'Bounded assumption paths' },
    { engineId: 'synthesis-gate', requiredFields: ['avoided_decision'], outputEnabled: 'Synthesis and next move' },
    { engineId: 'synthesis-engine', requiredFields: ['avoided_decision'], outputEnabled: 'Governed synthesis with quoted user language' },
    { engineId: 'evidence-lens', requiredFields: ['justifying_evidence'], outputEnabled: 'Evidence sufficiency from stated justification threshold' },
    { engineId: 'evidence-tier-derivation', requiredFields: ['avoided_decision'], outputEnabled: 'Conservative evidence tier' },
    { engineId: 'constitutional-engine', requiredFields: ['stated_purpose'], outputEnabled: 'Constitutional route from stated purpose' },
    { engineId: 'governed-memory-presenter', requiredFields: ['avoided_decision'], outputEnabled: 'Governed memory items' },
    { engineId: 'user-language-interpretation', requiredFields: ['avoided_decision'], outputEnabled: 'Quote interpretation' },
    { engineId: 'signal-continuity', requiredFields: ['avoided_decision'], outputEnabled: 'Signal trend' },
    // Gated
    { engineId: 'contradiction-forcing', requiredFields: ['avoided_decision', 'competing_obligation'], outputEnabled: 'Forced contradiction from obligation vs avoidance (GATED)' },
    { engineId: 'similar-case-surfacer', requiredFields: ['avoided_decision'], outputEnabled: 'Similar case patterns (GATED — requires case store)' },
  ],
}

const CONSTITUTIONAL_DIAGNOSTIC_CONTRACT: SurfaceInstrumentContract = {
  surface: 'constitutional_diagnostic',
  primaryUserQuestion: 'What is the governance structure around this decision, and where does authority break down?',
  fields: [
    {
      key: 'decision_owner',
      label: 'Who owns this decision?',
      purpose: 'Authority mapping and constitutional route derivation',
      requiredForEngines: ['constitutional-engine', 'authority-lens', 'assessment-engine'],
      required: true,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'approving_authority',
      label: 'Who can approve this decision?',
      purpose: 'Authority hierarchy and escalation path',
      requiredForEngines: ['constitutional-engine', 'assessment-engine', 'authority-lens'],
      required: true,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'blocking_authority',
      label: 'Who can block this decision?',
      purpose: 'Veto detection and failure mode analysis',
      requiredForEngines: ['constitutional-engine', 'failure-mode-lens', 'adversarial-preview'],
      required: false,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'mandate_source',
      label: 'Where does the mandate for this decision come from?',
      purpose: 'Mandate clarity and constitutional legitimacy',
      requiredForEngines: ['constitutional-engine', 'assessment-engine'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'current_route',
      label: 'What is the current decision-making approach?',
      purpose: 'Route detection and drift analysis',
      requiredForEngines: ['constitutional-engine', 'narrative-service'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'non_negotiable_constraint',
      label: 'What constraint cannot be violated?',
      purpose: 'Constraint boundary detection and regulated boundary analysis',
      requiredForEngines: ['constraint-reality-lens', 'regulated-boundary-lens'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'failure_mode',
      label: 'What is the most likely way this decision fails?',
      purpose: 'Failure mode analysis and adversarial challenge',
      requiredForEngines: ['failure-mode-lens', 'adversarial-preview', 'simulation-gate'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'repair_condition',
      label: 'What would need to change for this decision to succeed?',
      purpose: 'Route correction input and synthesis',
      requiredForEngines: ['synthesis-gate', 'synthesis-engine'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
  ],
  minimumViableInput: ['decision_owner', 'approving_authority', 'mandate_source'],
  wowOutputRequirements: [
    'constitutional_route',
    'constitutional_readiness',
    'constitutional_posture',
    'authority_state',
    'failure_modes',
    'disqualifiers',
    'bridge_to_next_surface',
    'next_admissible_move',
    'living_layer_progress',
  ],
  refusalConditions: [
    'decision_owner is empty',
    'approving_authority is empty',
    'mandate_source is empty',
    'route is REJECT and disqualifiers present',
  ],
  engineUnlocks: [
    { engineId: 'constitutional-engine', requiredFields: ['decision_owner', 'approving_authority', 'mandate_source'], outputEnabled: 'Full constitutional route assessment' },
    { engineId: 'assessment-engine', requiredFields: ['decision_owner', 'mandate_source'], outputEnabled: 'Constitutional guidance assembly' },
    { engineId: 'adversarial-preview', requiredFields: ['decision_owner', 'failure_mode'], outputEnabled: 'Adversarial challenge panel' },
    { engineId: 'domain-interdependency', requiredFields: ['decision_owner', 'mandate_source'], outputEnabled: 'Cross-domain tension detection' },
    { engineId: 'decision-simulation-engine', requiredFields: ['decision_owner', 'failure_mode'], outputEnabled: '30/60/90 day degradation projections' },
    { engineId: 'synthesis-engine', requiredFields: ['decision_owner', 'repair_condition'], outputEnabled: 'Governed synthesis' },
    // Gated
    { engineId: 'escalation-engine', requiredFields: ['decision_owner', 'approving_authority', 'blocking_authority'], outputEnabled: 'Auto-escalation sweep (GATED — requires case memory)' },
    { engineId: 'route-correction', requiredFields: ['current_route', 'repair_condition'], outputEnabled: 'Route correction from evidence (GATED — requires multi-turn)' },
    { engineId: 'contradiction-forcing', requiredFields: ['decision_owner', 'blocking_authority'], outputEnabled: 'Forced contradiction from authority conflict (GATED)' },
  ],
}

const TEAM_ASSESSMENT_CONTRACT: SurfaceInstrumentContract = {
  surface: 'team_assessment',
  primaryUserQuestion: 'How does your team perceive this decision, and where do they diverge?',
  fields: [
    {
      key: 'respondent_role',
      label: 'What is your role in relation to this decision?',
      purpose: 'Authority mapping and perspective weighting',
      requiredForEngines: ['authority-lens', 'constitutional-engine'],
      required: true,
      inputType: 'text',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'perceived_decision',
      label: 'What decision do you think is being made?',
      purpose: 'Decision alignment detection across respondents',
      requiredForEngines: ['situation-translator', 'kernel-contradiction-resolver'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'perceived_owner',
      label: 'Who do you think owns this decision?',
      purpose: 'Authority clarity measurement across respondents',
      requiredForEngines: ['authority-lens', 'contradiction-graph'],
      required: true,
      inputType: 'text',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'perceived_blocker',
      label: 'What do you think is blocking this decision?',
      purpose: 'Cross-respondent blocker divergence detection',
      requiredForEngines: ['kernel-contradiction-resolver', 'failure-mode-lens'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'authority_clarity',
      label: 'How clear is the authority structure around this decision?',
      purpose: 'Authority ambiguity measurement',
      requiredForEngines: ['authority-lens', 'constitutional-engine'],
      required: true,
      inputType: 'scale',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'evidence_clarity',
      label: 'How confident are you in the evidence supporting this decision?',
      purpose: 'Evidence gap measurement across respondents',
      requiredForEngines: ['evidence-lens', 'evidence-tier-derivation'],
      required: true,
      inputType: 'scale',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'execution_confidence',
      label: 'How confident are you that this decision will be executed?',
      purpose: 'Execution risk detection',
      requiredForEngines: ['simulation-gate', 'failure-mode-lens'],
      required: true,
      inputType: 'scale',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'consequence_awareness',
      label: 'What is the most significant consequence of getting this wrong?',
      purpose: 'Consequence divergence detection across respondents',
      requiredForEngines: ['cost-of-delay', 'simulation-gate'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'aggregate_only',
    },
    {
      key: 'leadership_avoidance_signal',
      label: 'Is there something leadership is avoiding about this decision?',
      purpose: 'Leadership avoidance detection — hidden signal amplification',
      requiredForEngines: ['hidden-signals', 'adversarial-preview'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'private',
    },
  ],
  minimumViableInput: ['respondent_role', 'perceived_decision', 'perceived_owner', 'perceived_blocker', 'authority_clarity', 'evidence_clarity', 'execution_confidence'],
  wowOutputRequirements: [
    'team_divergence_analysis',
    'authority_clarity_score',
    'evidence_clarity_score',
    'execution_confidence_score',
    'blocker_divergence_map',
    'contradiction_summary',
    'next_admissible_move',
    'evidence_tier',
  ],
  refusalConditions: [
    'fewer than 2 respondents (cannot derive divergence from single respondent)',
    'perceived_decision is empty for all respondents',
    'respondent_role is empty for all respondents',
  ],
  engineUnlocks: [
    { engineId: 'situation-translator', requiredFields: ['perceived_decision'], outputEnabled: 'TranslationResult from perceived decision' },
    { engineId: 'authority-lens', requiredFields: ['perceived_owner', 'authority_clarity'], outputEnabled: 'Authority clarity measurement' },
    { engineId: 'evidence-lens', requiredFields: ['evidence_clarity'], outputEnabled: 'Cross-respondent evidence confidence' },
    { engineId: 'kernel-contradiction-resolver', requiredFields: ['perceived_decision', 'perceived_blocker'], outputEnabled: 'Cross-respondent contradiction detection' },
    { engineId: 'contradiction-graph', requiredFields: ['perceived_decision', 'perceived_blocker'], outputEnabled: 'Divergence graph backbone' },
    { engineId: 'failure-mode-lens', requiredFields: ['perceived_blocker'], outputEnabled: 'Failure mode from blocker divergence' },
    { engineId: 'hidden-signals', requiredFields: ['leadership_avoidance_signal'], outputEnabled: 'Leadership avoidance detection' },
    { engineId: 'adversarial-preview', requiredFields: ['perceived_decision', 'leadership_avoidance_signal'], outputEnabled: 'Adversarial challenge from avoidance' },
    { engineId: 'simulation-gate', requiredFields: ['execution_confidence'], outputEnabled: 'Execution risk simulation' },
    { engineId: 'cost-of-delay', requiredFields: ['consequence_awareness'], outputEnabled: 'Consequence-based urgency' },
    { engineId: 'governed-memory-presenter', requiredFields: ['perceived_decision'], outputEnabled: 'Governed memory items' },
    // Gated
    { engineId: 'contradiction-forcing', requiredFields: ['perceived_decision', 'perceived_blocker'], outputEnabled: 'Forced contradiction from respondent patterns (GATED)' },
    { engineId: 'similar-case-surfacer', requiredFields: ['perceived_decision'], outputEnabled: 'Similar case patterns (GATED)' },
  ],
}

const ENTERPRISE_ASSESSMENT_CONTRACT: SurfaceInstrumentContract = {
  surface: 'enterprise_assessment',
  primaryUserQuestion: 'How does your organisation make decisions, and where do the structural weaknesses lie?',
  fields: [
    {
      key: 'domain_scores',
      label: 'Rate your organisation across key decision domains',
      purpose: 'Domain interdependency mapping and systemic lock detection',
      requiredForEngines: ['domain-interdependency', 'decision-simulation-engine'],
      required: true,
      inputType: 'scale',
      privacyLevel: 'client_safe',
    },
    {
      key: 'dependency_map',
      label: 'Which decisions depend on which other decisions?',
      purpose: 'Intervention sequence and cross-domain tension detection',
      requiredForEngines: ['domain-interdependency', 'contradiction-graph'],
      required: true,
      inputType: 'multi_select',
      privacyLevel: 'client_safe',
    },
    {
      key: 'escalation_triggers',
      label: 'What triggers escalation in your organisation?',
      purpose: 'Escalation pattern detection and constitutional assessment',
      requiredForEngines: ['constitutional-engine', 'assessment-engine'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'scenario_responses',
      label: 'How would you handle these scenarios?',
      purpose: 'Scenario stress testing and pressure response analysis',
      requiredForEngines: ['scenario-stress-test'],
      required: true,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'financial_exposure',
      label: 'What is the financial exposure of current decision delays?',
      purpose: 'Financial risk quantification and cost of delay',
      requiredForEngines: ['cost-of-delay', 'commercial-proof-lens'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'client_exposure',
      label: 'Which client relationships are at risk from decision delays?',
      purpose: 'Client exposure mapping and commercial proof',
      requiredForEngines: ['commercial-proof-lens', 'supplier-dependency-lens'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'regulatory_exposure',
      label: 'Are there regulatory or compliance risks from current decision patterns?',
      purpose: 'Regulated boundary detection and compliance risk',
      requiredForEngines: ['regulated-boundary-lens', 'obligation-lens'],
      required: false,
      inputType: 'textarea',
      privacyLevel: 'client_safe',
    },
    {
      key: 'operating_deadline',
      label: 'What is the nearest operating deadline that depends on these decisions?',
      purpose: 'Deadline-driven urgency and degradation projection',
      requiredForEngines: ['cost-of-delay', 'decision-simulation-engine'],
      required: false,
      inputType: 'text',
      privacyLevel: 'client_safe',
    },
    {
      key: 'board_challenge_readiness',
      label: 'How prepared is leadership for board-level scrutiny of decision quality?',
      purpose: 'Governance readiness and executive reporting preparation',
      requiredForEngines: ['assessment-engine', 'adversarial-preview'],
      required: false,
      inputType: 'scale',
      privacyLevel: 'client_safe',
    },
  ],
  minimumViableInput: ['domain_scores', 'dependency_map', 'scenario_responses'],
  wowOutputRequirements: [
    'domain_interdependency_map',
    'systemic_lock_detection',
    'scenario_stress_results',
    'degradation_projection',
    'intervention_sequence',
    'financial_exposure_summary',
    'governance_readiness',
    'next_admissible_move',
    'living_layer_progress',
  ],
  refusalConditions: [
    'domain_scores is empty or incomplete',
    'dependency_map is empty',
    'scenario_responses is empty',
    'no organisational context available',
  ],
  engineUnlocks: [
    { engineId: 'domain-interdependency', requiredFields: ['domain_scores', 'dependency_map'], outputEnabled: 'Cross-domain tension and intervention sequence' },
    { engineId: 'decision-simulation-engine', requiredFields: ['domain_scores'], outputEnabled: '30/60/90 day degradation projections' },
    { engineId: 'constitutional-engine', requiredFields: ['escalation_triggers'], outputEnabled: 'Constitutional assessment from escalation patterns' },
    { engineId: 'assessment-engine', requiredFields: ['domain_scores', 'board_challenge_readiness'], outputEnabled: 'Constitutional guidance assembly' },
    { engineId: 'adversarial-preview', requiredFields: ['domain_scores', 'board_challenge_readiness'], outputEnabled: 'Adversarial challenge from governance gaps' },
    { engineId: 'cost-of-delay', requiredFields: ['financial_exposure', 'operating_deadline'], outputEnabled: 'Financial urgency quantification' },
    { engineId: 'commercial-proof-lens', requiredFields: ['financial_exposure', 'client_exposure'], outputEnabled: 'Commercial viability from exposure data' },
    { engineId: 'regulated-boundary-lens', requiredFields: ['regulatory_exposure'], outputEnabled: 'Regulatory boundary from compliance data' },
    { engineId: 'obligation-lens', requiredFields: ['regulatory_exposure'], outputEnabled: 'Obligation mapping from compliance' },
    { engineId: 'supplier-dependency-lens', requiredFields: ['client_exposure'], outputEnabled: 'Supply chain risk from client exposure' },
    { engineId: 'governed-memory-presenter', requiredFields: ['domain_scores'], outputEnabled: 'Governed memory items' },
    // Gated
    { engineId: 'scenario-stress-test', requiredFields: ['scenario_responses'], outputEnabled: 'Scenario stress analysis (GATED — engine not yet invoked)' },
    { engineId: 'escalation-engine', requiredFields: ['escalation_triggers'], outputEnabled: 'Auto-escalation sweep (GATED — requires case memory)' },
    { engineId: 'intervention-engine', requiredFields: ['domain_scores', 'dependency_map'], outputEnabled: 'Intervention conversion (GATED — requires tribunal)' },
    { engineId: 'similar-case-surfacer', requiredFields: ['domain_scores'], outputEnabled: 'Similar case patterns (GATED)' },
    { engineId: 'breach-detector', requiredFields: ['domain_scores', 'regulatory_exposure'], outputEnabled: 'Constitutional breach detection (GATED — requires contract store)' },
    { engineId: 'drift-rules', requiredFields: ['domain_scores'], outputEnabled: 'Recommendation drift detection (GATED — requires case memory with prior recommendations)' },
    { engineId: 'drift-tribunal', requiredFields: ['domain_scores'], outputEnabled: 'Critical drift tribunal (GATED — requires drift history)' },
    { engineId: 'assumption-drift-detector', requiredFields: ['domain_scores'], outputEnabled: 'Assumption drift from prior outcomes (GATED — requires 100+ cases)' },
    { engineId: 'failure-pattern-calibrator', requiredFields: ['domain_scores'], outputEnabled: 'Failure pattern calibration (GATED — requires 500+ cases)' },
  ],
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SURFACE_INSTRUMENT_CONTRACTS: SurfaceInstrumentContract[] = [
  FREE_SIGNAL_CONTRACT,
  FAST_DIAGNOSTIC_CONTRACT,
  PURPOSE_ALIGNMENT_CONTRACT,
  CONSTITUTIONAL_DIAGNOSTIC_CONTRACT,
  TEAM_ASSESSMENT_CONTRACT,
  ENTERPRISE_ASSESSMENT_CONTRACT,
]

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Get the instrument contract for a surface.
 */
export function getInstrumentContract(
  surface: ProductSurface,
): SurfaceInstrumentContract | undefined {
  return SURFACE_INSTRUMENT_CONTRACTS.find(c => c.surface === surface)
}

/**
 * Get all engine unlocks for a surface.
 */
export function getEngineUnlocks(
  surface: ProductSurface,
): SurfaceInstrumentContract['engineUnlocks'] {
  return getInstrumentContract(surface)?.engineUnlocks ?? []
}

/**
 * Check which engines can be unlocked given the available field keys.
 */
export function getUnlockableEngines(
  surface: ProductSurface,
  availableFields: string[],
): Array<{ engineId: string; outputEnabled: string }> {
  const contract = getInstrumentContract(surface)
  if (!contract) return []

  const available = new Set(availableFields)
  return contract.engineUnlocks.filter(
    unlock => unlock.requiredFields.every(f => available.has(f)),
  )
}

/**
 * Check which engines are blocked by missing fields.
 */
export function getMissingFieldsForEngines(
  surface: ProductSurface,
  availableFields: string[],
): Array<{ engineId: string; missingFields: string[]; outputEnabled: string }> {
  const contract = getInstrumentContract(surface)
  if (!contract) return []

  const available = new Set(availableFields)
  const blocked: Array<{ engineId: string; missingFields: string[]; outputEnabled: string }> = []

  for (const unlock of contract.engineUnlocks) {
    const missing = unlock.requiredFields.filter(f => !available.has(f))
    if (missing.length > 0) {
      blocked.push({
        engineId: unlock.engineId,
        missingFields: missing,
        outputEnabled: unlock.outputEnabled,
      })
    }
  }

  return blocked
}

/**
 * Get refusal conditions for a surface.
 */
export function getRefusalConditions(
  surface: ProductSurface,
): string[] {
  return getInstrumentContract(surface)?.refusalConditions ?? []
}

/**
 * Check if minimum viable input is satisfied.
 */
export function isMinimumViableInputSatisfied(
  surface: ProductSurface,
  availableFields: string[],
): boolean {
  const contract = getInstrumentContract(surface)
  if (!contract) return false

  const available = new Set(availableFields)
  return contract.minimumViableInput.every(f => available.has(f))
}

/**
 * Get recommended next fields to capture, ordered by engine unlock impact.
 */
export function getRecommendedNextFields(
  surface: ProductSurface,
  availableFields: string[],
): SurfaceInstrumentField[] {
  const contract = getInstrumentContract(surface)
  if (!contract) return []

  const available = new Set(availableFields)
  const missing = contract.fields.filter(f => !available.has(f.key))

  // Sort by number of engines unlocked (descending)
  return missing.sort(
    (a, b) => b.requiredForEngines.length - a.requiredForEngines.length,
  )
}
