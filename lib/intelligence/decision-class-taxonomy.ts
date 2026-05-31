/**
 * lib/intelligence/decision-class-taxonomy.ts — Decision Class Taxonomy
 *
 * The taxonomy is stable, finite, and commercially useful.
 * 12 decision classes, each with mandatory lenses, adversarial vectors,
 * regulated boundary triggers, default tiers, and quality checks.
 */

import type {
  DecisionClass,
  DecisionClassDefinition,
  ConfidenceLevel,
  ClassificationResult,
  DecisionClassCandidate,
  DisclosureTier,
} from './types'

export class DecisionClassTaxonomy {
  private definitions: Record<DecisionClass, DecisionClassDefinition>

  constructor() {
    this.definitions = {
      COMPLIANCE_AND_FILING: {
        class: 'COMPLIANCE_AND_FILING',
        label: 'Compliance & Filing',
        description: 'A statutory, regulatory, or contractual filing obligation with a defined deadline and consequence for missing it.',
        mandatoryLenses: ['failure-mode', 'constraint-reality', 'obligation', 'evidence', 'adversarial', 'regulated-boundary'],
        optionalLenses: ['authority', 'continuity'],
        primaryAdversarialVectors: [
          'Missing the deadline',
          'Incorrect or incomplete filing',
          'Underestimating penalty exposure',
          'Assuming extension is available',
        ],
        regulatedBoundaryTriggers: ['tax-advice', 'legal-advice', 'audit-opinion'],
        defaultTier: 'basic_brief',
        humanReviewThreshold: 'HIGH',
        forbiddenOutputClaims: [
          'This constitutes tax advice',
          'This constitutes legal advice',
          'The filing will be accepted',
          'Penalties will not apply',
        ],
        qualityChecks: [
          'authority_map_exists',
          'obligation_map_exists',
          'constraint_graph_exists',
          'deadline_identified',
          'penalty_exposure_estimated',
          'no_regulated_advice_overclaim',
        ],
      },

      GOVERNANCE_AND_BOARD: {
        class: 'GOVERNANCE_AND_BOARD',
        label: 'Governance & Board',
        description: 'A board-level decision requiring proper process, documentation, fiduciary consideration, and stakeholder alignment.',
        mandatoryLenses: ['authority', 'obligation', 'evidence', 'adversarial', 'failure-mode', 'regulated-boundary', 'constraint-reality'],
        optionalLenses: ['continuity', 'market-claim'],
        primaryAdversarialVectors: [
          'Board was not properly informed',
          'Fiduciary duty was not considered',
          'Conflict of interest was not disclosed',
          'Process was not followed',
          'Minority shareholder or stakeholder interests were ignored',
        ],
        regulatedBoundaryTriggers: ['director-duty-advice', 'fiduciary-advice', 'insolvency-advice', 'legal-advice'],
        defaultTier: 'full_dossier',
        humanReviewThreshold: 'STANDARD',
        forbiddenOutputClaims: [
          'This constitutes legal advice to the board',
          'Director duties are fully discharged',
          'No conflict of interest exists',
          'Shareholder challenge will not succeed',
        ],
        qualityChecks: [
          'authority_map_exists',
          'obligation_map_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'board_process_mapped',
          'fiduciary_consideration_documented',
          'no_regulated_advice_overclaim',
        ],
      },

      COMMERCIAL_AND_MARKET: {
        class: 'COMMERCIAL_AND_MARKET',
        label: 'Commercial & Market',
        description: 'A commercial or market decision where positioning, pricing, partnership terms, or competitive response is at stake.',
        mandatoryLenses: ['failure-mode', 'constraint-reality', 'evidence', 'market-claim', 'adversarial', 'commercial-proof', 'investor-diligence'],
        optionalLenses: ['authority', 'obligation', 'release-risk', 'continuity'],
        primaryAdversarialVectors: [
          'Market claim is unsupported',
          'Competitive response is underestimated',
          'Pricing assumption is wrong',
          'Customer concentration risk is ignored',
          'Contract terms are unfavourable',
        ],
        regulatedBoundaryTriggers: ['investment-promotion', 'financial-promotion', 'competition-law'],
        defaultTier: 'basic_brief',
        humanReviewThreshold: 'HIGH',
        forbiddenOutputClaims: [
          'This constitutes investment advice',
          'The market will respond as predicted',
          'Competitors will not react',
          'Revenue projections are guaranteed',
        ],
        qualityChecks: [
          'evidence_graph_exists',
          'market_claim_identified',
          'adversarial_challenge_exists',
          'constraint_graph_exists',
          'no_regulated_advice_overclaim',
        ],
      },

      OPERATIONAL_AND_EXECUTION: {
        class: 'OPERATIONAL_AND_EXECUTION',
        label: 'Operational & Execution',
        description: 'An operational or execution decision where delivery, capacity, process reliability, or supply chain is the primary concern.',
        mandatoryLenses: ['failure-mode', 'constraint-reality', 'evidence', 'adversarial', 'release-risk', 'launch-readiness', 'operational-ownership', 'commercial-proof'],
        optionalLenses: ['authority', 'obligation', 'continuity'],
        primaryAdversarialVectors: [
          'Execution capacity is overestimated',
          'Dependencies are not mapped',
          'Fallback plan does not exist',
          'Timeline is unrealistic',
          'Quality will be sacrificed for speed',
        ],
        regulatedBoundaryTriggers: [],
        defaultTier: 'basic_brief',
        humanReviewThreshold: 'MEDIUM',
        forbiddenOutputClaims: ['Execution will succeed', 'Timeline is achievable', 'No operational risk exists'],
        qualityChecks: [
          'constraint_graph_exists',
          'evidence_graph_exists',
          'dependency_map_exists',
          'adversarial_challenge_exists',
          'minimum_viable_path_exists',
        ],
      },

      STRATEGIC_AND_POSITIONING: {
        class: 'STRATEGIC_AND_POSITIONING',
        label: 'Strategic & Positioning',
        description: 'A strategic or positioning decision where direction, structure, competitive posture, or organisational design is being set.',
        mandatoryLenses: ['authority', 'failure-mode', 'constraint-reality', 'evidence', 'adversarial', 'continuity'],
        optionalLenses: ['obligation', 'market-claim', 'release-risk'],
        primaryAdversarialVectors: [
          'Strategy is based on unvalidated assumptions',
          'Execution capacity is insufficient',
          'Market conditions change',
          'Key stakeholder alignment is assumed, not verified',
          'Exit path is not considered',
        ],
        regulatedBoundaryTriggers: ['investment-promotion', 'financial-promotion'],
        defaultTier: 'full_dossier',
        humanReviewThreshold: 'STANDARD',
        forbiddenOutputClaims: ['Strategy will succeed', 'Market will respond as predicted', 'This constitutes investment advice'],
        qualityChecks: [
          'authority_map_exists',
          'constraint_graph_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'continuity_considered',
          'assumptions_documented',
        ],
      },

      REPUTATIONAL_AND_EXPOSURE: {
        class: 'REPUTATIONAL_AND_EXPOSURE',
        label: 'Reputational & Exposure',
        description: 'A reputational or exposure decision where public perception, trust, brand integrity, or stakeholder confidence is the primary asset at risk.',
        mandatoryLenses: ['failure-mode', 'evidence', 'adversarial', 'constraint-reality', 'regulated-boundary'],
        optionalLenses: ['authority', 'obligation', 'market-claim', 'continuity'],
        primaryAdversarialVectors: [
          'Reputational damage is underestimated',
          'Stakeholder reaction is misjudged',
          'Timing of response is wrong',
          'Legal exposure from public statement',
          'Crisis escalates due to inadequate response',
        ],
        regulatedBoundaryTriggers: ['legal-advice', 'defamation', 'regulatory-disclosure', 'litigation-advice'],
        defaultTier: 'urgent_operational',
        humanReviewThreshold: 'URGENT',
        forbiddenOutputClaims: [
          'Reputational damage will be contained',
          'This constitutes PR advice',
          'Legal exposure does not exist',
          'Stakeholders will respond as predicted',
        ],
        qualityChecks: [
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'constraint_graph_exists',
          'stakeholder_map_exists',
          'timing_assessment_exists',
          'no_regulated_advice_overclaim',
        ],
      },

      FINANCIAL_AND_CAPITAL: {
        class: 'FINANCIAL_AND_CAPITAL',
        label: 'Financial & Capital',
        description: 'A financial or capital decision where cash, funding, balance sheet capacity, or financial structure constrains the feasible set.',
        mandatoryLenses: ['constraint-reality', 'failure-mode', 'evidence', 'adversarial', 'regulated-boundary', 'investor-diligence'],
        optionalLenses: ['authority', 'obligation', 'continuity'],
        primaryAdversarialVectors: [
          'Cash position is overestimated',
          'Funding assumption is wrong',
          'Financial projections are optimistic',
          'Balance sheet risk is underestimated',
          'Covenant breach is not considered',
        ],
        regulatedBoundaryTriggers: ['investment-advice', 'financial-promotion', 'insolvency-advice', 'tax-advice'],
        defaultTier: 'full_dossier',
        humanReviewThreshold: 'STANDARD',
        forbiddenOutputClaims: [
          'This constitutes investment advice',
          'Funding will be secured',
          'Cash position is sufficient',
          'No insolvency risk exists',
          'Financial projections are guaranteed',
        ],
        qualityChecks: [
          'constraint_graph_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'financial_exposure_estimated',
          'no_regulated_advice_overclaim',
        ],
      },

      LEGAL_AND_CONTRACTUAL: {
        class: 'LEGAL_AND_CONTRACTUAL',
        label: 'Legal & Contractual',
        description: 'A legal or contractual decision where rights, obligations, liabilities, or dispute resolution is being determined.',
        mandatoryLenses: ['obligation', 'authority', 'evidence', 'adversarial', 'constraint-reality', 'regulated-boundary'],
        optionalLenses: ['failure-mode', 'continuity'],
        primaryAdversarialVectors: [
          'Contractual obligation is misinterpreted',
          'Liability exposure is underestimated',
          'Dispute resolution mechanism is unfavourable',
          'Legal position is weaker than presented',
          'Limitation period is approaching',
        ],
        regulatedBoundaryTriggers: ['legal-advice', 'litigation-advice', 'settlement-advice'],
        defaultTier: 'full_dossier',
        humanReviewThreshold: 'STANDARD',
        forbiddenOutputClaims: [
          'This constitutes legal advice',
          'Legal position will prevail',
          'Liability does not exist',
          'Settlement terms are fair',
          'No regulatory action will follow',
        ],
        qualityChecks: [
          'obligation_map_exists',
          'authority_map_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'regulated_boundary_identified',
          'no_regulated_advice_overclaim',
        ],
      },

      PEOPLE_AND_AUTHORITY: {
        class: 'PEOPLE_AND_AUTHORITY',
        label: 'People & Authority',
        description: 'A people or authority decision where mandate, leadership, organisational structure, or accountability is the primary variable.',
        mandatoryLenses: ['authority', 'obligation', 'failure-mode', 'evidence', 'adversarial', 'operational-ownership'],
        optionalLenses: ['constraint-reality', 'continuity'],
        primaryAdversarialVectors: [
          'Authority is assumed, not documented',
          'Succession risk is not considered',
          'Accountability structure is unclear',
          'Cultural or behavioural factors are ignored',
          'Employment or contractual risk is underestimated',
        ],
        regulatedBoundaryTriggers: ['employment-advice', 'legal-advice'],
        defaultTier: 'basic_brief',
        humanReviewThreshold: 'MEDIUM',
        forbiddenOutputClaims: [
          'This constitutes employment advice',
          'Authority is valid',
          'No succession risk exists',
          'Cultural issues will resolve',
        ],
        qualityChecks: [
          'authority_map_exists',
          'obligation_map_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'no_regulated_advice_overclaim',
        ],
      },

      TECHNOLOGY_AND_DEPENDENCY: {
        class: 'TECHNOLOGY_AND_DEPENDENCY',
        label: 'Technology & Dependency',
        description: 'A technology or dependency decision where system reliability, migration, technical debt, or vendor dependency is the binding constraint.',
        mandatoryLenses: ['constraint-reality', 'failure-mode', 'evidence', 'adversarial', 'release-risk', 'continuity', 'supplier-dependency', 'operational-ownership'],
        optionalLenses: ['authority', 'obligation', 'market-claim'],
        primaryAdversarialVectors: [
          'Technical debt is underestimated',
          'Migration risk is not mapped',
          'Vendor lock-in is ignored',
          'Security or data risk is not considered',
          'Business continuity during transition is not planned',
        ],
        regulatedBoundaryTriggers: ['data-protection', 'regulatory-compliance'],
        defaultTier: 'basic_brief',
        humanReviewThreshold: 'MEDIUM',
        forbiddenOutputClaims: [
          'Migration will succeed',
          'No security risk exists',
          'Vendor dependency is manageable',
          'Data protection obligations are fully met',
        ],
        qualityChecks: [
          'constraint_graph_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'dependency_map_exists',
          'continuity_plan_assessed',
        ],
      },

      CONTINUITY_AND_TRANSITION: {
        class: 'CONTINUITY_AND_TRANSITION',
        label: 'Continuity & Transition',
        description: 'A continuity or transition decision where succession, handover, business continuity, or orderly closure is the primary concern.',
        mandatoryLenses: ['authority', 'obligation', 'constraint-reality', 'evidence', 'adversarial', 'continuity', 'regulated-boundary'],
        optionalLenses: ['failure-mode', 'market-claim'],
        primaryAdversarialVectors: [
          'Successor is not identified or qualified',
          'Handover documentation is incomplete',
          'Business continuity during transition is not planned',
          'Stakeholder notification is inadequate',
          'Legal or regulatory obligations during transition are ignored',
        ],
        regulatedBoundaryTriggers: ['director-duty-advice', 'insolvency-advice', 'legal-advice', 'employment-advice'],
        defaultTier: 'full_dossier',
        humanReviewThreshold: 'EXECUTIVE',
        forbiddenOutputClaims: [
          'Succession is secure',
          'Business continuity is assured',
          'This constitutes legal advice',
          'No regulatory notification is required',
          'Stakeholder concerns are addressed',
        ],
        qualityChecks: [
          'authority_map_exists',
          'obligation_map_exists',
          'constraint_graph_exists',
          'evidence_graph_exists',
          'adversarial_challenge_exists',
          'continuity_plan_exists',
          'regulated_boundary_identified',
          'no_regulated_advice_overclaim',
        ],
      },

      LOW_STAKES_PREFERENCE: {
        class: 'LOW_STAKES_PREFERENCE',
        label: 'Low-Stakes Preference',
        description: 'A low-stakes preference decision where the primary variable is personal or organisational preference rather than binding constraint or consequence.',
        mandatoryLenses: ['evidence'],
        optionalLenses: [],
        primaryAdversarialVectors: ['Stakes are higher than presented', 'Preference is masking an underlying constraint'],
        regulatedBoundaryTriggers: [],
        defaultTier: 'free_signal',
        humanReviewThreshold: 'LOW',
        forbiddenOutputClaims: ['This is definitely low-stakes', 'No consequence exists'],
        qualityChecks: ['stakes_verified', 'no_hidden_constraints'],
      },
    }
  }

  /**
   * Classify a decision based on translation results.
   *
   * Alternative classes are sourced in priority order:
   *   1. Classes already identified by the translator's multi-class scoring
   *   2. Classes implied by preserved ambiguities
   *   3. Classes implied by hidden stakes
   *
   * Translation law: if ambiguity exists, alternatives must be preserved.
   * This method MUST produce at least one alternative when preservedAmbiguities
   * is non-empty.
   */
  classify(translation: {
    decisionClass: DecisionClass
    translationConfidence: ConfidenceLevel
    hiddenStakesDetected: boolean
    alternativeClasses?: DecisionClassCandidate[]
    preservedAmbiguities?: string[]
  }): ClassificationResult {
    const primaryClass = translation.decisionClass
    const seen = new Set<DecisionClass>([primaryClass])
    const alternatives: DecisionClassCandidate[] = []

    // 1. Use translator's pre-scored alternatives (most reliable source)
    for (const alt of translation.alternativeClasses ?? []) {
      if (!seen.has(alt.decisionClass)) {
        seen.add(alt.decisionClass)
        alternatives.push(alt)
      }
    }

    // 2. Derive alternatives from preserved ambiguities when none yet exist
    //    This ensures the translation law is upheld: ambiguity → alternative preserved
    const ambiguities = translation.preservedAmbiguities ?? []
    if (ambiguities.length > 0 && alternatives.length === 0) {
      const ambiguityMap: Array<{ trigger: string; cls: DecisionClass; reason: string }> = [
        { trigger: 'authority_structure',    cls: 'GOVERNANCE_AND_BOARD',      reason: 'Authority ambiguity suggests governance dimension' },
        { trigger: 'obligation_landscape',   cls: 'COMPLIANCE_AND_FILING',     reason: 'Obligation ambiguity may include filing requirements' },
        { trigger: 'constraint_landscape',   cls: 'FINANCIAL_AND_CAPITAL',     reason: 'Constraint ambiguity suggests financial feasibility question' },
        { trigger: 'timing_pressure',        cls: 'OPERATIONAL_AND_EXECUTION', reason: 'Timing pressure suggests operational execution dimension' },
        { trigger: 'decision_class_uncertain', cls: 'STRATEGIC_AND_POSITIONING', reason: 'Low confidence classification — strategic context possible' },
      ]

      for (const { trigger, cls, reason } of ambiguityMap) {
        if (ambiguities.includes(trigger) && !seen.has(cls)) {
          seen.add(cls)
          alternatives.push({ decisionClass: cls, confidence: 'LOW', reason })
          if (alternatives.length >= 2) break // Cap ambiguity-derived alternatives at 2
        }
      }
    }

    // 3. Hidden stakes fallbacks (only if still no alternatives)
    if (translation.hiddenStakesDetected && alternatives.length === 0) {
      if (primaryClass !== 'FINANCIAL_AND_CAPITAL') {
        alternatives.push({ decisionClass: 'FINANCIAL_AND_CAPITAL', confidence: 'MEDIUM', reason: 'Hidden financial stakes detected in language' })
        seen.add('FINANCIAL_AND_CAPITAL')
      }
      if (primaryClass !== 'REPUTATIONAL_AND_EXPOSURE' && alternatives.length < 2) {
        alternatives.push({ decisionClass: 'REPUTATIONAL_AND_EXPOSURE', confidence: 'LOW', reason: 'Hidden reputational stakes cannot be ruled out' })
      }
    }

    const definition = this.definitions[primaryClass]

    return {
      primaryClass,
      alternativeClasses: alternatives,
      confidence: translation.translationConfidence,
      classificationRationale: `Classified as ${definition.label} based on language patterns. ${
        alternatives.length > 0
          ? `Alternative classifications considered: ${alternatives.map(a => `${a.decisionClass} (${a.confidence})`).join(', ')}.`
          : 'No alternative classifications identified.'
      }`,
    }
  }

  getDefinition(decisionClass: DecisionClass): DecisionClassDefinition {
    return this.definitions[decisionClass]
  }

  getMandatoryLenses(decisionClass: DecisionClass): string[] {
    return this.definitions[decisionClass]?.mandatoryLenses ?? ['failure-mode', 'evidence', 'adversarial']
  }

  getOptionalLenses(decisionClass: DecisionClass): string[] {
    return this.definitions[decisionClass]?.optionalLenses ?? []
  }

  getDefaultTier(decisionClass: DecisionClass): DisclosureTier {
    return (this.definitions[decisionClass]?.defaultTier as DisclosureTier) || 'free_signal'
  }

  getHumanReviewThreshold(decisionClass: DecisionClass): string {
    return this.definitions[decisionClass]?.humanReviewThreshold ?? 'MEDIUM'
  }

  getAllClasses(): DecisionClass[] {
    return Object.keys(this.definitions) as DecisionClass[]
  }

  isValidClass(decisionClass: string): decisionClass is DecisionClass {
    return decisionClass in this.definitions
  }
}