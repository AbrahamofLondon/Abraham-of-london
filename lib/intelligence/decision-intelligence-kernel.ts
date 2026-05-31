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

    // Step 4: Classify decision — pass all translator signals so alternatives are preserved
    const classification = this.taxonomy.classify({
      decisionClass: translation.decisionClass,
      translationConfidence: translation.translationConfidence,
      hiddenStakesDetected: translation.hiddenStakesDetected,
      alternativeClasses: translation.alternativeClasses,
      preservedAmbiguities: translation.preservedAmbiguities,
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

    // Step 8b: Derive minimum viable path, forbidden actions, and urgency
    // MUST happen after adversarialChallenge is populated — the path and forbidden
    // actions are adversarially informed (they derive from challenge IDs).
    livingCase.minimumViablePath = this.deriveMinimumViablePath(livingCase)
    livingCase.forbiddenActions = this.deriveForbiddenActions(livingCase)
    livingCase.whatMustNotBeDelayed = this.deriveWhatMustNotBeDelayed(livingCase)

    // Step 9: Build self-adversarial challenge (skip for low-stakes — would be overengineering)
    if (this.requiresSelfAdversarial(input.aperture) && classification.primaryClass !== 'LOW_STAKES_PREFERENCE') {
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

    // Step 11b: LOW_STAKES — downgrade to free_signal regardless of requested tier
    // A low-stakes preference decision must not be on a paid tier (brief §E).
    if (classification.primaryClass === 'LOW_STAKES_PREFERENCE') {
      livingCase.disclosure.currentTier = 'free_signal'
    }

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

    // NOTE: minimumViablePath, forbiddenActions, and whatMustNotBeDelayed are derived
    // AFTER adversarialChallenge is populated (Step 8 in process()). Do not call them here.
  }

  /**
   * Derive the minimum viable path.
   *
   * The path must be class-specific and adversarially informed.
   * It must name the first PROTECTIVE move, not the first analytical move.
   *
   * For high-consequence cases the first step is never "map options" —
   * it is the action that prevents the most irreversible harm.
   */
  private deriveMinimumViablePath(livingCase: LivingDecisionCase): DecisionMove[] {
    const path: DecisionMove[] = []
    const cls = livingCase.classification?.primaryClass
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''
    const adversarialIds = new Set(livingCase.adversarialChallenge.map(c => c.id))

    // LOW_STAKES: proportionate — no institutional machinery
    if (cls === 'LOW_STAKES_PREFERENCE') {
      path.push({
        order: 1,
        action: 'DECIDE_BY_PREFERENCE',
        description: 'This is a low-stakes preference decision. Choose based on team preference and practical fit.',
        rationale: 'No binding constraints, obligations, or consequences are at stake.',
        urgency: 'LOW',
      })
      return path
    }

    // ── STRATEGIC / IRREVOCABLE COMMITMENT — checked BEFORE generic governance ────
    // These adversarial IDs signal specific, irrevocable harm. They take precedence
    // over the generic governance branch even when class is GOVERNANCE_AND_BOARD,
    // because the right first move is about the specific commitment — not the vote process.
    if (
      adversarialIds.has('strategic-commitment-vs-capability') ||
      adversarialIds.has('urgency-vs-legal-concern')
    ) {
      path.push({
        order: 1,
        action: 'PAUSE_SIGNATURE',
        description: 'Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation.',
        rationale: "The partner's impatience is not an obligation. The decision to accept irrevocable terms must be made consciously, not under time pressure.",
        urgency: 'IMMEDIATE',
      })
      path.push({
        order: 2,
        action: 'SEPARATE_TERMS_FOR_DECISION',
        description: 'List the specific terms that create permanent constraint (IP transfer, no exit, exclusivity scope, derivative works definition). Each must be understood and accepted separately, not as a package.',
        rationale: 'Package agreements obscure irrevocable terms. Each term that restricts future optionality must be a deliberate, documented decision.',
        urgency: 'HIGH',
      })
      path.push({
        order: 3,
        action: 'ASSESS_OPTIONALITY_DESTRUCTION',
        description: 'Map what the organisation loses the ability to do if this agreement is signed: sell direct, pivot technology, partner with competitors, change pricing. Make these visible before the board decision.',
        rationale: 'The board is excited about distribution access. The question is what optionality they are selling. That must be visible to them, not implicit.',
        urgency: 'HIGH',
      })
      return path
    }

    // ── REPUTATIONAL: legal hold / PR-vs-legal conflict ────────────────────
    // First protective move: do not issue public statement before board/legal clearance
    if (
      cls === 'REPUTATIONAL_AND_EXPOSURE' ||
      adversarialIds.has('pr-vs-legal-conflict') ||
      adversarialIds.has('reputational-threat-vs-response-gap')
    ) {
      const hasPotentialProceedings = raw.includes('potential proceedings') || raw.includes('proceedings')
      const hasBoardMeeting = raw.includes('board meets') || raw.includes('board meeting')

      path.push({
        order: 1,
        action: 'HOLD_PUBLIC_COMMUNICATIONS',
        description: hasPotentialProceedings
          ? 'Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight.'
          : 'Do not issue any public statement before the authority that holds mandate has agreed the response.',
        rationale: 'A premature statement cannot be withdrawn. Legal exposure and reputational damage from a wrong statement exceeds the cost of delay.',
        urgency: 'IMMEDIATE',
      })

      if (hasBoardMeeting) {
        path.push({
          order: 2,
          action: 'BRIEF_DECISION_AUTHORITY',
          description: 'Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response.',
          rationale: 'The board meeting tomorrow is the legitimate decision gate. Both positions must be heard before a response is authorised.',
          urgency: 'IMMEDIATE',
        })
      }

      path.push({
        order: path.length + 1,
        action: 'PRESERVE_EVIDENCE_RECORD',
        description: 'Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom.',
        rationale: 'Record integrity is required for any defence — legal, regulatory, or reputational.',
        urgency: 'IMMEDIATE',
      })

      return path
    }

    // ── GOVERNANCE/BOARD: board division + NED pressure ───────────────────
    // First protective move: do not vote while material objections are undocumented
    if (
      cls === 'GOVERNANCE_AND_BOARD' &&
      (adversarialIds.has('board-pressure-vs-reservations') || adversarialIds.has('executive-vs-governance'))
    ) {
      path.push({
        order: 1,
        action: 'DELAY_OR_CONDITION_THE_VOTE',
        description: 'Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge.',
        rationale: 'A NED resignation threat is a governance signal, not a negotiating tactic. The process protects the board as much as the decision.',
        urgency: 'IMMEDIATE',
      })
      path.push({
        order: 2,
        action: 'RECORD_FORMAL_OBJECTIONS',
        description: 'Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record.',
        rationale: 'Undocumented objections cannot be relied upon later. The record must show the objections were heard.',
        urgency: 'IMMEDIATE',
      })
      path.push({
        order: 3,
        action: 'CLARIFY_CEO_DEADLINE',
        description: "Establish whether the CEO's year-end deadline is a legal or contractual obligation or an internal preference. If it is a preference, it does not override governance process.",
        rationale: 'Manufactured urgency is a known governance pressure vector. Distinguish it from genuine obligation before it determines the timeline.',
        urgency: 'HIGH',
      })
      return path
    }

    // ── COMPLIANCE: cash constraint + statutory deadline ───────────────────
    if (cls === 'COMPLIANCE_AND_FILING') {
      const urgentObligations = livingCase.obligationMap.filter(o => o.deadline !== null)
      if (urgentObligations.length > 0) {
        path.push({
          order: 1,
          action: 'IDENTIFY_SPECIFIC_FILING_REQUIRED',
          description: `Address: ${urgentObligations[0]?.description ?? 'statutory obligation'} (deadline: ${urgentObligations[0]?.deadline ?? 'as soon as possible'}). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.`,
          rationale: 'Treating multiple obligations as one increases error risk. Separate and sequence them.',
          urgency: 'IMMEDIATE',
        })
      }
      const hasCashConstraint = livingCase.constraintGraph.some(c => c.type === 'cash' && (c.severity === 'CRITICAL' || c.severity === 'HIGH'))
      if (hasCashConstraint) {
        path.push({
          order: path.length + 1,
          action: 'IDENTIFY_LOW_COST_PROFESSIONAL_PATH',
          description: 'Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty.',
          rationale: 'Cash constraint does not remove the legal obligation. Fixed-scope professional review is typically far cheaper than the cost of error or penalty.',
          urgency: 'IMMEDIATE',
        })
      }
      return path
    }

    // ── GENERAL: derive from adversarial challenges first ─────────────────
    // If adversarial challenges exist, the first move comes from the highest-severity one
    const criticalChallenge = livingCase.adversarialChallenge.find(c => c.severity === 'CRITICAL')
    const highChallenge = livingCase.adversarialChallenge.find(c => c.severity === 'HIGH')
    const leadChallenge = criticalChallenge ?? highChallenge

    if (leadChallenge) {
      path.push({
        order: 1,
        action: 'RESOLVE_PRIMARY_ADVERSARIAL_RISK',
        description: `Address the primary identified risk: ${leadChallenge.contradiction}. This is the failure point most likely to undermine the decision.`,
        rationale: `The adversarial challenge (${leadChallenge.id}) must be resolved or consciously accepted before the decision proceeds.`,
        urgency: 'IMMEDIATE',
      })
    }

    // Structural fallbacks — authority, constraints, obligations
    if (livingCase.authorityMap.length === 0) {
      path.push({
        order: path.length + 1,
        action: 'CLARIFY_AUTHORITY',
        description: 'Identify and confirm who holds formal decision mandate.',
        rationale: 'Without confirmed authority, the decision is vulnerable to challenge.',
        urgency: 'IMMEDIATE',
      })
    }

    const criticalConstraints = livingCase.constraintGraph.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH')
    if (criticalConstraints.length > 0 && !path.some(p => p.action === 'VALIDATE_CRITICAL_CONSTRAINTS')) {
      path.push({
        order: path.length + 1,
        action: 'VALIDATE_CRITICAL_CONSTRAINTS',
        description: `Verify: ${criticalConstraints[0]?.description ?? 'critical constraint'}`,
        rationale: 'Critical constraints change what is feasible.',
        urgency: 'IMMEDIATE',
      })
    }

    const urgentObligations = livingCase.obligationMap.filter(o => o.deadline !== null)
    if (urgentObligations.length > 0 && !path.some(p => p.action === 'ADDRESS_URGENT_OBLIGATIONS')) {
      path.push({
        order: path.length + 1,
        action: 'ADDRESS_URGENT_OBLIGATIONS',
        description: `Address: ${urgentObligations[0]?.description ?? 'obligation'} (deadline: ${urgentObligations[0]?.deadline ?? 'unknown'})`,
        rationale: 'Time-sensitive obligations cannot be safely deferred.',
        urgency: 'IMMEDIATE',
      })
    }

    return path
  }

  /**
   * Derive forbidden actions.
   *
   * Primary source: adversarial challenge IDs map to concrete forbidden actions.
   * Secondary: class-specific patterns.
   * Tertiary: regulated boundary.
   */
  private deriveForbiddenActions(livingCase: LivingDecisionCase): ForbiddenAction[] {
    const forbidden: ForbiddenAction[] = []
    const cls = livingCase.classification?.primaryClass

    // LOW_STAKES: no institutional forbidden actions
    if (cls === 'LOW_STAKES_PREFERENCE') return forbidden

    // Primary: map adversarial challenge IDs to protective forbidden actions
    const ADVERSARIAL_FORBIDDEN: Record<string, ForbiddenAction> = {
      'board-pressure-vs-reservations': {
        action: 'Put the decision to a vote while material reservations or resignation threats from directors remain undocumented',
        reason: 'A vote taken before formal objections are recorded creates reversal risk and may constitute a governance failure. The record must show objections were heard.',
        severity: 'HIGH',
      },
      'executive-vs-governance': {
        action: 'Treat executive urgency or preference as board mandate',
        reason: 'CEO direction is not the same as board authority. Proceeding on executive preference without board ratification creates accountability exposure for all directors.',
        severity: 'HIGH',
      },
      'urgency-vs-legal-concern': {
        action: 'Sign or commit before legal concerns are recorded and consciously resolved or accepted by the proper authority',
        reason: 'Proceeding while legal concerns are explicitly unresolved creates liability that cannot be retrospectively managed.',
        severity: 'CRITICAL',
      },
      'strategic-commitment-vs-capability': {
        action: 'Transfer IP rights, exclusivity, or exit options without documenting the irreversibility and the capability loss it creates',
        reason: 'Irrevocable capability loss cannot be undone. It must be a conscious, documented decision — not an oversight obscured in contract language.',
        severity: 'CRITICAL',
      },
      'reputational-threat-vs-response-gap': {
        action: 'Issue a public response before facts, decision authority, and legal exposure have been assessed and the response has been cleared',
        reason: 'A premature or unauthorised public statement may worsen the reputational position and create legal liability that cannot be retracted.',
        severity: 'CRITICAL',
      },
      'pr-vs-legal-conflict': {
        action: 'Issue any public statement tonight or before the board has met and legal counsel has confirmed no proceedings risk',
        reason: 'Any public statement made while proceedings are possible may prejudice the organisation\'s legal position. Legal clearance is not a procedural step — it is protection.',
        severity: 'CRITICAL',
      },
      'runway-vs-funding-delay': {
        action: 'Make commitments — payroll guarantees, supplier agreements, or operational promises — that assume funding or payment that has not been confirmed in writing',
        reason: 'Unconfirmed funding is not a resource. Commitments made against it create personal and institutional liability if funding does not arrive.',
        severity: 'HIGH',
      },
      'obligation-vs-resources': {
        action: 'Proceed as if the filing obligation will resolve itself, or that delay is neutral',
        reason: 'Statutory obligations compound with delay. Inaction is not a safe default — it is the highest-risk option.',
        severity: 'CRITICAL',
      },
      'deadline-vs-cash': {
        action: 'Miss the filing deadline on the assumption that a penalty is preferable to filing imperfectly',
        reason: 'Missing a statutory deadline is rarely the better option. An imperfect filing with proactive contact typically results in better outcomes than non-filing.',
        severity: 'CRITICAL',
      },
      'investor-claim-vs-evidence': {
        action: 'Make growth or traction claims to investors without disclosing they are based on internal projections rather than verified data',
        reason: 'Misrepresentation to investors carries both legal and regulatory risk. Projections presented as results is a known grounds for claim.',
        severity: 'CRITICAL',
      },
      'claim-vs-evidence': {
        action: 'Publish or present claims about market position, growth, or customer adoption without documented supporting evidence',
        reason: 'Claims made without supporting evidence create legal, regulatory, and reputational exposure. A claim that cannot be substantiated is a liability.',
        severity: 'HIGH',
      },
      'commercial-claim-vs-evidence-gap': {
        action: 'Publish or present commercial claims without supporting evidence that would survive buyer, regulator, or competitor challenge',
        reason: 'Unsupported commercial claims create legal, regulatory, and reputational exposure. Each claim must have a documented evidence basis before publication.',
        severity: 'CRITICAL',
      },
      'revenue-vs-readiness': {
        action: 'Launch or proceed while unresolved readiness issues exist and revenue pressure is distorting the risk assessment',
        reason: 'Revenue pressure creates a known decision bias. The incentive to proceed may be overriding legitimate readiness concerns. Separate the revenue decision from the readiness decision.',
        severity: 'CRITICAL',
      },
      'supply-failure-vs-customer-obligation': {
        action: 'Assume customer obligations can be met without a confirmed supply recovery timeline or alternative sourcing plan',
        reason: 'Supply interruption combined with customer penalty exposure creates compound risk. A confirmed recovery plan must be in place before customer commitments are reaffirmed.',
        severity: 'CRITICAL',
      },
      'ownership-vs-accountability': {
        action: 'Proceed with operational recovery while ownership of the failure remains disputed between teams',
        reason: 'Without clear ownership, no recovery action can be assigned and the failure will recur. Ownership must be resolved before technical recovery can be effective.',
        severity: 'CRITICAL',
      },
    }

    for (const challenge of livingCase.adversarialChallenge) {
      const mapped = ADVERSARIAL_FORBIDDEN[challenge.id]
      if (mapped && !forbidden.some(f => f.action === mapped.action)) {
        forbidden.push(mapped)
      }
    }

    // Secondary: class-specific forbidden actions not covered by adversarial
    if (cls === 'COMPLIANCE_AND_FILING' && !forbidden.some(f => f.action.includes('filing deadline'))) {
      forbidden.push({
        action: 'Ignore the filing deadline or treat a placeholder submission as a completed obligation',
        reason: 'Missing the deadline triggers penalties, strike-off, or director disqualification. A provisional submission does not discharge the duty.',
        severity: 'CRITICAL',
      })
    }

    // Tertiary: evidence nodes with forbidden_action kind (from specialized lenses)
    for (const evidence of livingCase.evidenceGraph) {
      if (evidence.kind === 'forbidden_action') {
        const exists = forbidden.some(f => f.action.includes(evidence.summary.substring(0, 60)))
        if (!exists) {
          forbidden.push({
            action: evidence.summary,
            reason: evidence.label,
            severity: evidence.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          })
        }
      }
    }

    // Debug: log evidence kinds for diagnosis
    const forbiddenKinds = livingCase.evidenceGraph.filter(e => e.kind === 'forbidden_action').length
    if (forbiddenKinds > 0 && forbidden.length === 0) {
      console.error('[FORBIDDEN_DEBUG] Found', forbiddenKinds, 'forbidden_action evidence nodes but none extracted')
      console.error('[FORBIDDEN_DEBUG] Evidence kinds:', [...new Set(livingCase.evidenceGraph.map(e => e.kind))])
    }

    // Quaternary: regulated boundary
    if (livingCase.regulatedBoundary.hit && !forbidden.some(f => f.action.includes('professional advice'))) {
      forbidden.push({
        action: 'Proceed on the final decision without seeking appropriate professional advice',
        reason: 'A regulated professional boundary has been identified. Proceeding without appropriate advice creates liability.',
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
