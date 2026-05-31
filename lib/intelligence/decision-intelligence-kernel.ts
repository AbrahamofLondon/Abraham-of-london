/**
 * lib/intelligence/decision-intelligence-kernel.ts — Sovereign Orchestrator
 *
 * The kernel is a sovereign orchestrator, not a giant function.
 * It accepts raw scenario input and returns a governed Living Decision Case.
 *
 * Kernel sequence:
 * 1. Accept raw scenario
 * 2. Run Situation Translator
 * 3. Run Clarification Gate
 * 4. Classify decision
 * 5. Build initial Living Decision Case
 * 6. Select mandatory lenses by decision class
 * 7. Run lenses
 * 8. Resolve contradictions
 * 9. Build adversarial challenge
 * 10. Build self-adversarial challenge
 * 11. Check regulated boundaries
 * 12. Determine human-review requirement
 * 13. Generate tiered disclosure
 * 14. Persist case state
 * 15. Emit admin quality signal
 * 16. Return aperture output
 */

import { SituationTranslator } from './situation-translator'
import { DecisionClassTaxonomy } from './decision-class-taxonomy'
import { KernelLensRunner } from './kernel-lens-runner'
import { KernelContradictionResolver } from './kernel-contradiction-resolver'
import { KernelQualityGates } from './kernel-quality-gates'
import { TieredDisclosure } from './tiered-disclosure'
import { HumanReviewProtocol } from './human-review-protocol'
import { RegulatedBoundaryProtocol } from './regulated-boundary-protocol'
import { LivingCasePersistence } from './living-case-persistence'
import { LivingCaseEventLedger } from './living-case-events'
import { createLivingDecisionCase, KERNEL_VERSION, ONTOLOGY_VERSION } from './living-decision-case-contract'
import type {
  LivingDecisionCase,
  KernelInput,
  KernelResult,
  KernelLensResult,
  SelfAdversarialChallenge,
  DecisionMove,
  ForbiddenAction,
  DecisionAuthority,
  DecisionObligation,
  DecisionConstraint,
  DecisionConsequence,
  DecisionDependency,
  DecisionIncentive,
  SourceAperture,
  DisclosureTier,
} from './types'

export class DecisionIntelligenceKernel {
  private translator: SituationTranslator
  private taxonomy: DecisionClassTaxonomy
  private lensRunner: KernelLensRunner
  private contradictionResolver: KernelContradictionResolver
  private qualityGates: KernelQualityGates
  private disclosure: TieredDisclosure
  private humanReview: HumanReviewProtocol
  private regulatedBoundary: RegulatedBoundaryProtocol
  private persistence: LivingCasePersistence
  private events: LivingCaseEventLedger

  constructor() {
    this.translator = new SituationTranslator()
    this.taxonomy = new DecisionClassTaxonomy()
    this.lensRunner = new KernelLensRunner()
    this.contradictionResolver = new KernelContradictionResolver()
    this.qualityGates = new KernelQualityGates()
    this.disclosure = new TieredDisclosure()
    this.humanReview = new HumanReviewProtocol()
    this.regulatedBoundary = new RegulatedBoundaryProtocol()
    this.persistence = new LivingCasePersistence()
    this.events = new LivingCaseEventLedger()
  }

  /**
   * Process a raw scenario through the full kernel pipeline.
   */
  async process(input: KernelInput): Promise<KernelResult> {
    // Step 1: Record case creation
    this.events.record(input.caseId, 'CASE_CREATED', {
      aperture: input.aperture,
      caseReference: input.caseReference,
    })

    // Step 2: Translate raw situation
    const translation = await this.translator.translate(input.rawScenario)
    this.events.record(input.caseId, 'TRANSLATION_COMPLETED', {
      vocabularyState: translation.vocabularyState,
      confidence: translation.translationConfidence,
      decisionClass: translation.decisionClass,
    })

    // Step 3: Clarification gate
    if (translation.clarificationRequired.length > 0 && !input.clarifications) {
      this.events.record(input.caseId, 'CLARIFICATION_REQUESTED', {
        questionCount: translation.clarificationRequired.length,
      })
      return {
        caseId: input.caseId,
        status: 'CLARIFICATION_REQUIRED',
        translation,
        output: null,
        questions: translation.clarificationRequired,
      }
    }

    // Step 4: Classify decision
    const classification = this.taxonomy.classify({
      decisionClass: translation.decisionClass,
      translationConfidence: translation.translationConfidence,
      hiddenStakesDetected: translation.hiddenStakesDetected,
    })
    this.events.record(input.caseId, 'CASE_CLASSIFIED', {
      primaryClass: classification.primaryClass,
      confidence: classification.confidence,
    })

    // Step 5: Build initial Living Decision Case
    const livingCase = createLivingDecisionCase({
      id: input.caseId,
      caseReference: input.caseReference,
      aperture: input.aperture,
      createdBy: input.createdBy,
      organisationId: input.organisationId,
    })

    livingCase.translation = translation
    livingCase.classification = classification
    livingCase.situationModel = {
      rawContext: input.rawScenario,
      buyerLanguageSummary: translation.situationSummary,
      institutionalInterpretation: translation.kernelInterpretation,
      coreTension: this.extractCoreTension(translation),
    }

    // Step 6: Select and run mandatory lenses
    const mandatoryLenses = this.taxonomy.getMandatoryLenses(classification.primaryClass)
    const lensResults = await this.lensRunner.run(livingCase, mandatoryLenses)

    for (const result of lensResults) {
      this.events.record(input.caseId, 'LENS_APPLIED', {
        lensId: result.lensId,
        findings: result.findings.length,
        contradictions: result.contradictions.length,
      })
    }

    // Step 7: Merge lens outputs into case
    this.mergeLensResults(livingCase, lensResults)

    // Step 8: Resolve contradictions
    const allContradictions = lensResults.flatMap(r => r.contradictions)
    livingCase.adversarialChallenge = this.contradictionResolver.resolve(allContradictions)

    if (livingCase.adversarialChallenge.length > 0) {
      this.events.record(input.caseId, 'ADVERSARIAL_CHALLENGE_ADDED', {
        count: livingCase.adversarialChallenge.length,
      })
    }

    // Step 9: Build self-adversarial challenge
    if (this.requiresSelfAdversarial(input.aperture)) {
      livingCase.selfAdversarialChallenge = this.buildSelfAdversarialChallenge(livingCase, lensResults)
      this.events.record(input.caseId, 'SELF_ADVERSARIAL_COMPLETED', {})
    }

    // Step 10: Check regulated boundaries
    const boundaryCheck = this.regulatedBoundary.check(livingCase)
    livingCase.regulatedBoundary = boundaryCheck
    if (boundaryCheck.hit) {
      this.events.record(input.caseId, 'REGULATED_BOUNDARY_HIT', {
        type: boundaryCheck.type,
      })
    }

    // Step 11: Set disclosure tier based on aperture
    const requestedTier = input.requestedTier || 'free_signal'
    livingCase.disclosure.currentTier = this.resolveTierFromAperture(input.aperture, requestedTier)

    // Step 12: Determine human review requirement
    const reviewRequirement = this.humanReview.determine(livingCase)
    livingCase.review = reviewRequirement
    if (reviewRequirement.state !== 'not_required') {
      this.events.record(input.caseId, 'HUMAN_REVIEW_TRIGGERED', {
        tier: reviewRequirement.tier,
        triggerCount: reviewRequirement.triggers.length,
      })
    }

    // Step 14: Run quality gates
    const qualityResult = this.qualityGates.check(livingCase)
    if (!qualityResult.passed) {
      this.events.record(input.caseId, 'QUALITY_STANDARD_FAILED', {
        failures: qualityResult.failures,
      })
      return {
        caseId: input.caseId,
        status: 'QUALITY_FAILED',
        translation,
        classification,
        livingCase,
        output: null,
        qualityFailures: qualityResult.failures,
      }
    }
    this.events.record(input.caseId, 'QUALITY_STANDARD_PASSED', {})

    // Step 13: Update case metadata
    livingCase.updatedAt = new Date().toISOString()

    // Step 14: Persist
    await this.persistence.save(livingCase)

    // Step 15: Generate tiered output
    const output = this.disclosure.render(livingCase, livingCase.disclosure.currentTier)

    if (output) {
      this.events.record(input.caseId, 'TIER_DISCLOSED', {
        tier: output.tier,
        sections: output.sections.length,
      })
    }

    return {
      caseId: input.caseId,
      status: 'COMPLETED',
      translation,
      classification,
      livingCase,
      output,
      qualityFailures: [],
    }
  }

  /**
   * Extract the governing tension from translation.
   */
  private extractCoreTension(translation: { kernelInterpretation: string }): string {
    const sentences = translation.kernelInterpretation.split('.')
    return sentences[0] || 'Unclear governing tension'
  }

  /**
   * Merge lens results into the living case structure.
   */
  private mergeLensResults(livingCase: LivingDecisionCase, results: KernelLensResult[]): void {
    for (const result of results) {
      livingCase.evidenceGraph.push(...result.evidenceNodes)

      for (const finding of result.findings) {
        switch (finding.domain) {
          case 'authority':
            livingCase.authorityMap.push(finding.data as unknown as DecisionAuthority)
            break
          case 'obligation':
            livingCase.obligationMap.push(finding.data as unknown as DecisionObligation)
            break
          case 'constraint':
            livingCase.constraintGraph.push(finding.data as unknown as DecisionConstraint)
            break
          case 'evidence':
            break
          case 'consequence':
            livingCase.consequenceMap.push(finding.data as unknown as DecisionConsequence)
            break
          case 'dependency':
            livingCase.dependencyMap.push(finding.data as unknown as DecisionDependency)
            break
          case 'incentive':
            livingCase.incentiveMap.push(finding.data as unknown as DecisionIncentive)
            break
        }
      }
    }

    // Derive minimum viable path, forbidden actions, urgency
    livingCase.minimumViablePath = this.deriveMinimumViablePath(livingCase)
    livingCase.forbiddenActions = this.deriveForbiddenActions(livingCase)
    livingCase.whatMustNotBeDelayed = this.deriveWhatMustNotBeDelayed(livingCase)
  }

  /**
   * Derive the minimum viable path from merged findings.
   */
  private deriveMinimumViablePath(livingCase: LivingDecisionCase): DecisionMove[] {
    const path: DecisionMove[] = []

    // If authority is unclear, first move is always authority clarification
    if (livingCase.authorityMap.length === 0) {
      path.push({
        order: 1,
        action: 'CLARIFY_AUTHORITY',
        description: 'Establish who holds decision mandate before proceeding',
        rationale: 'Without clear authority, any decision is vulnerable to challenge',
        urgency: 'IMMEDIATE',
      })
    }

    // If constraints are severe, next move is constraint validation
    const criticalConstraints = livingCase.constraintGraph.filter(
      c => c.severity === 'CRITICAL' || c.severity === 'HIGH'
    )
    if (criticalConstraints.length > 0) {
      path.push({
        order: path.length + 1,
        action: 'VALIDATE_CRITICAL_CONSTRAINTS',
        description: `Verify: ${criticalConstraints[0]?.description ?? 'critical constraint'}`,
        rationale: 'Critical constraints change the feasible set',
        urgency: 'IMMEDIATE',
      })
    }

    // If obligations exist, next move is obligation fulfilment
    const urgentObligations = livingCase.obligationMap.filter(o => o.deadline !== null)
    if (urgentObligations.length > 0) {
      path.push({
        order: path.length + 1,
        action: 'ADDRESS_URGENT_OBLIGATIONS',
        description: `Address: ${urgentObligations[0]?.description ?? 'obligation'} (deadline: ${urgentObligations[0]?.deadline ?? 'unknown'})`,
        rationale: 'Time-sensitive obligations cannot be deferred without consequence',
        urgency: 'IMMEDIATE',
      })
    }

    // General path: assess options
    if (path.length === 0) {
      path.push({
        order: 1,
        action: 'ASSESS_OPTIONS',
        description: 'Map available options against constraints and obligations',
        rationale: 'Without a clear path, the first step is understanding what is feasible',
        urgency: 'HIGH',
      })
    }

    return path
  }

  /**
   * Derive forbidden actions from constraint analysis.
   */
  private deriveForbiddenActions(livingCase: LivingDecisionCase): ForbiddenAction[] {
    const forbidden: ForbiddenAction[] = []

    for (const constraint of livingCase.constraintGraph) {
      if (constraint.forbids) {
        forbidden.push({
          action: constraint.forbids,
          reason: constraint.forbidReason || 'Identified as impossible or damaging by constraint analysis',
          severity: constraint.severity,
        })
      }
    }

    // Add common forbidden actions based on patterns
    if (livingCase.classification?.primaryClass === 'COMPLIANCE_AND_FILING') {
      forbidden.push({
        action: 'Ignore the filing deadline',
        reason: 'Missing the deadline triggers penalty, strike-off, or director disqualification',
        severity: 'CRITICAL',
      })
    }

    if (livingCase.regulatedBoundary.hit) {
      forbidden.push({
        action: 'Proceed without professional advice',
        reason: 'Regulated boundary identified — professional advice is required before proceeding',
        severity: 'CRITICAL',
      })
    }

    return forbidden
  }

  /**
   * Derive what must not be delayed.
   */
  private deriveWhatMustNotBeDelayed(livingCase: LivingDecisionCase): string[] {
    const urgent: string[] = []

    for (const consequence of livingCase.consequenceMap) {
      if (consequence.timeSensitivity === 'IMMEDIATE' || consequence.timeSensitivity === 'WITHIN_48_HOURS') {
        if (consequence.mustNotDelay) {
          urgent.push(consequence.mustNotDelay)
        }
      }
    }

    for (const move of livingCase.minimumViablePath) {
      if (move.urgency === 'IMMEDIATE' || move.urgency === 'CRITICAL') {
        urgent.push(move.description)
      }
    }

    return [...new Set(urgent)]
  }

  /**
   * Determine if self-adversarial challenge is required.
   */
  private requiresSelfAdversarial(aperture: SourceAperture): boolean {
    return (
      aperture === 'paid_basic_brief' ||
      aperture === 'paid_full_dossier' ||
      aperture === 'paid_urgent_operational' ||
      aperture === 'paid_executive_board'
    )
  }

  /**
   * Build self-adversarial challenge.
   */
  private buildSelfAdversarialChallenge(
    livingCase: LivingDecisionCase,
    lensResults: KernelLensResult[],
  ): SelfAdversarialChallenge {
    return {
      loadBearingAssumptions: this.extractAssumptions(livingCase, lensResults),
      classificationConfidence: {
        primaryClass: livingCase.classification.primaryClass,
        confidence: livingCase.classification.confidence,
        alternativeClass: livingCase.classification.alternativeClasses[0]?.decisionClass,
        implication:
          'If classification is wrong, the entire lens selection and output structure changes.',
      },
      informationGaps: this.identifyInformationGaps(livingCase),
      kernelLimitations: [
        'This analysis is based on the information provided and available evidence.',
        'The system cannot verify independently reported facts.',
        'Human review is recommended for high-consequence decisions.',
        'This does not constitute legal, tax, or regulated professional advice.',
      ],
    }
  }

  /**
   * Extract load-bearing assumptions from lens results.
   */
  private extractAssumptions(
    livingCase: LivingDecisionCase,
    _lensResults: KernelLensResult[],
  ): SelfAdversarialChallenge['loadBearingAssumptions'] {
    const assumptions: SelfAdversarialChallenge['loadBearingAssumptions'] = []

    if (livingCase.authorityMap.length > 0) {
      assumptions.push({
        assumption: `Authority is held by ${livingCase.authorityMap[0]?.holder || 'the identified actor'}`,
        evidenceBasis: livingCase.authorityMap[0]?.evidenceBasis || 'User-reported',
        ifWrong: 'The decision may not be valid, or escalation may be misdirected.',
        verificationPath: 'Verify authority documentation or delegation record.',
      })
    }

    for (const constraint of livingCase.constraintGraph.slice(0, 2)) {
      assumptions.push({
        assumption: constraint.description,
        evidenceBasis: constraint.evidenceBasis || 'System-inferred from context',
        ifWrong: constraint.ifWrong || 'The minimum viable path may change.',
        verificationPath: constraint.verificationPath || 'Verify constraint with primary source.',
      })
    }

    if (assumptions.length === 0) {
      assumptions.push({
        assumption: 'The situation has been interpreted correctly based on the information provided',
        evidenceBasis: 'User-reported context',
        ifWrong: 'The entire analysis may be misdirected',
        verificationPath: 'Review the situation classification and provide additional context',
      })
    }

    return assumptions
  }

  /**
   * Resolve the disclosure tier from the aperture and requested tier.
   */
  private resolveTierFromAperture(aperture: SourceAperture, requestedTier: string): DisclosureTier {
    // Map aperture to minimum tier
    const apertureTierMap: Record<string, DisclosureTier> = {
      'web': 'free_signal',
      'api': 'free_signal',
      'admin': 'full_dossier',
      'strategy_room': 'full_dossier',
      'paid_basic_brief': 'basic_brief',
      'paid_full_dossier': 'full_dossier',
      'paid_urgent_operational': 'urgent_operational',
      'paid_executive_board': 'executive_board',
    }

    const apertureTier = apertureTierMap[aperture] || 'free_signal'
    const tiers: DisclosureTier[] = ['free_signal', 'basic_brief', 'full_dossier', 'urgent_operational', 'executive_board', 'retained_continuity']
    const apertureIndex = tiers.indexOf(apertureTier)
    const requestedIndex = tiers.indexOf(requestedTier as DisclosureTier)

    // Use the higher of the two
    return tiers[Math.max(apertureIndex, requestedIndex)] ?? 'free_signal'
  }

  /**
   * Identify information gaps from the case.
   */
  private identifyInformationGaps(
    livingCase: LivingDecisionCase,
  ): SelfAdversarialChallenge['informationGaps'] {
    const gaps: SelfAdversarialChallenge['informationGaps'] = []

    if (livingCase.authorityMap.length === 0) {
      gaps.push({
        gap: 'Authority structure is unclear',
        impact: 'Cannot determine who holds decision mandate',
        acquisitionPath: 'Ask: Who has the formal authority to make this decision?',
      })
    }

    if (livingCase.obligationMap.length === 0) {
      gaps.push({
        gap: 'Obligation structure is unclear',
        impact: 'Cannot determine what must be performed',
        acquisitionPath:
          'Ask: What contractual, regulatory, or fiduciary obligations apply?',
      })
    }

    if (livingCase.constraintGraph.length === 0) {
      gaps.push({
        gap: 'Constraint landscape is unmapped',
        impact: 'Minimum viable path may be invalid',
        acquisitionPath:
          'Ask: What makes the ideal path impossible? Cash, time, authority, or capacity?',
      })
    }

    return gaps
  }
}
