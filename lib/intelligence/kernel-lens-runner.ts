/**
 * lib/intelligence/kernel-lens-runner.ts — Lens Execution Engine
 *
 * Runs mandatory and optional lenses against a Living Decision Case.
 * Each lens returns structured findings, evidence nodes, and contradictions.
 * The kernel owns synthesis — no lens owns the output.
 */

import type {
  LivingDecisionCase,
  KernelLensResult,
  LensFinding,
  DecisionEvidenceNode,
  KernelContradiction,
  ConfidenceLevel,
} from './types'

export class KernelLensRunner {
  /**
   * Run a set of lenses against a living case.
   * Each lens is executed independently and results are collected.
   */
  async run(livingCase: LivingDecisionCase, lensIds: string[]): Promise<KernelLensResult[]> {
    const results: KernelLensResult[] = []

    for (const lensId of lensIds) {
      const result = await this.executeLens(lensId, livingCase)
      results.push(result)
    }

    return results
  }

  /**
   * Execute a single lens by ID.
   * If the lens is not found, returns a no-op result.
   */
  private async executeLens(lensId: string, livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    switch (lensId) {
      case 'failure-mode':
        return this.failureModeLens(livingCase)
      case 'constraint-reality':
        return this.constraintRealityLens(livingCase)
      case 'authority':
        return this.authorityLens(livingCase)
      case 'obligation':
        return this.obligationLens(livingCase)
      case 'evidence':
        return this.evidenceLens(livingCase)
      case 'adversarial':
        return this.adversarialLens(livingCase)
      case 'market-claim':
        return this.marketClaimLens(livingCase)
      case 'release-risk':
        return this.releaseRiskLens(livingCase)
      case 'continuity':
        return this.continuityLens(livingCase)
      case 'regulated-boundary':
        return this.regulatedBoundaryLens(livingCase)
      case 'commercial-proof':
        return this.commercialProofLens(livingCase)
      case 'launch-readiness':
        return this.launchReadinessLens(livingCase)
      case 'supplier-dependency':
        return this.supplierDependencyLens(livingCase)
      case 'investor-diligence':
        return this.investorDiligenceLens(livingCase)
      case 'operational-ownership':
        return this.operationalOwnershipLens(livingCase)
      default:
        return {
          lensId,
          lensVersion: '1.0.0',
          applied: false,
          confidence: 'LOW',
          findings: [],
          evidenceNodes: [],
          contradictions: [],
          recommendedEvents: [],
        }
    }
  }

  /**
   * Failure Mode Lens — Identify primary failure modes from the situation.
   */
  private async failureModeLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const contradictions: KernelContradiction[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    // Detect failure modes from language
    const failurePatterns = [
      { pattern: 'deadline', mode: 'Time-sensitive failure — deadline pressure without contingency', severity: 'HIGH' as const },
      { pattern: 'no funds', mode: 'Cash constraint — insufficient resources to execute', severity: 'CRITICAL' as const },
      { pattern: 'cash', mode: 'Liquidity concern — cash position may constrain options', severity: 'HIGH' as const },
      { pattern: 'resigned', mode: 'Key person dependency — critical role is vacant or departing', severity: 'HIGH' as const },
      { pattern: 'unwell', mode: 'Key person dependency — decision-maker capacity is compromised', severity: 'HIGH' as const },
      { pattern: 'struck off', mode: 'Existential threat — entity dissolution risk', severity: 'CRITICAL' as const },
      { pattern: 'board', mode: 'Governance pressure — board-level decision with fiduciary implications', severity: 'HIGH' as const },
      { pattern: 'legal', mode: 'Legal exposure — potential liability or dispute', severity: 'HIGH' as const },
      { pattern: 'deadline', mode: 'Time constraint — fixed deadline with penalty for missing', severity: 'HIGH' as const },
    ]

    for (const { pattern, mode, severity } of failurePatterns) {
      if (raw.includes(pattern)) {
        findings.push({
          domain: 'evidence',
          data: { type: 'failure_mode', mode, severity },
        })
        evidenceNodes.push({
          kind: 'failure_mode',
          label: `Failure Mode: ${mode}`,
          summary: mode,
          severity,
          confidence: 0.7,
          sourceStage: 'kernel',
          sourceLens: 'failure-mode',
        })
      }
    }

    return {
      lensId: 'failure-mode',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'HIGH' : 'MEDIUM',
      findings,
      evidenceNodes,
      contradictions,
      recommendedEvents: [],
    }
  }

  /**
   * Constraint Reality Lens — Map what makes the ideal path impossible.
   */
  private async constraintRealityLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    const constraintPatterns = [
      { pattern: 'no funds', type: 'cash' as const, desc: 'Insufficient funds to execute the required action', severity: 'CRITICAL' as const },
      { pattern: 'cash', type: 'cash' as const, desc: 'Cash position constrains available options', severity: 'HIGH' as const },
      { pattern: '14 day', type: 'time' as const, desc: '14-day deadline imposes severe time constraint', severity: 'CRITICAL' as const },
      { pattern: 'deadline', type: 'time' as const, desc: 'Fixed deadline constrains response time', severity: 'HIGH' as const },
      { pattern: 'no time', type: 'time' as const, desc: 'Insufficient time to execute ideal path', severity: 'HIGH' as const },
      { pattern: 'board', type: 'authority' as const, desc: 'Board approval required — decision cannot proceed without it', severity: 'HIGH' as const },
      { pattern: 'approval', type: 'authority' as const, desc: 'External approval required before proceeding', severity: 'HIGH' as const },
      { pattern: 'capacity', type: 'capacity' as const, desc: 'Insufficient capacity to execute', severity: 'HIGH' as const },
      // Irrevocable commitment constraints
      { pattern: 'no exit', type: 'legal' as const, desc: 'No exit clause — commitment cannot be unwound once signed', severity: 'CRITICAL' as const },
      { pattern: 'ip rights', type: 'legal' as const, desc: 'IP rights transfer — permanent loss of intellectual property control', severity: 'CRITICAL' as const },
      { pattern: 'derivative works', type: 'legal' as const, desc: 'Derivative works clause — potential loss of control over future IP development', severity: 'CRITICAL' as const },
      { pattern: 'exclusive', type: 'legal' as const, desc: 'Exclusivity clause — restriction on ability to work with other partners', severity: 'HIGH' as const },
      { pattern: 'sign quickly', type: 'time' as const, desc: 'External urgency pressure — timeline driven by partner preference, not obligation', severity: 'HIGH' as const },
      { pattern: 'before they change their mind', type: 'time' as const, desc: 'Manufactured urgency — threat of withdrawal used to bypass proper review', severity: 'HIGH' as const },
      // Reputational constraints
      { pattern: 'potential proceedings', type: 'legal' as const, desc: 'Potential legal proceedings — any public communication requires legal clearance', severity: 'CRITICAL' as const },
      { pattern: 'proceedings', type: 'legal' as const, desc: 'Legal proceedings risk — public statements may prejudice the case', severity: 'HIGH' as const },
    ]

    for (const { pattern, type, desc, severity } of constraintPatterns) {
      if (raw.includes(pattern)) {
        findings.push({
          domain: 'constraint',
          data: { type, description: desc, severity, isBinding: severity === 'CRITICAL' },
        })
        evidenceNodes.push({
          kind: 'constraint',
          label: `Constraint: ${desc}`,
          summary: desc,
          severity,
          confidence: 0.8,
          sourceStage: 'kernel',
          sourceLens: 'constraint-reality',
        })
      }
    }

    return {
      lensId: 'constraint-reality',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'HIGH' : 'MEDIUM',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Authority Lens — Map who holds decision mandate.
   */
  private async authorityLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    const authorityPatterns = [
      { pattern: 'board', holder: 'Board of Directors', scope: 'Strategic and governance decisions', limitation: null },
      { pattern: 'ceo', holder: 'Chief Executive Officer', scope: 'Executive operational decisions', limitation: 'May require board ratification for major decisions' },
      { pattern: 'director', holder: 'Board of Directors', scope: 'Fiduciary and governance decisions', limitation: 'Subject to shareholder oversight' },
      { pattern: 'founder', holder: 'Founder', scope: 'Strategic direction and key decisions', limitation: 'May be subject to board or investor oversight' },
      { pattern: 'cfo', holder: 'Chief Financial Officer', scope: 'Financial and capital allocation decisions', limitation: 'Major financial decisions require board approval' },
      { pattern: 'solicitor', holder: 'Solicitor / Legal Counsel', scope: 'Legal advice and representation', limitation: 'Subject to professional regulation and client instructions' },
      { pattern: 'lawyer', holder: 'Legal Counsel', scope: 'Legal advice and representation', limitation: 'Subject to professional regulation' },
    ]

    for (const { pattern, holder, scope, limitation } of authorityPatterns) {
      if (raw.includes(pattern)) {
        findings.push({
          domain: 'authority',
          data: { holder, scope, limitation, evidenceBasis: 'User-reported', confidence: 'MEDIUM', source: 'user_reported' },
        })
        evidenceNodes.push({
          kind: 'authority',
          label: `Authority: ${holder}`,
          summary: `${holder} holds authority over ${scope}`,
          severity: 'MEDIUM',
          confidence: 0.6,
          sourceStage: 'kernel',
          sourceLens: 'authority',
        })
      }
    }

    return {
      lensId: 'authority',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'MEDIUM' : 'LOW',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Obligation Lens — Map what must be performed.
   */
  private async obligationLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    const obligationPatterns = [
      { pattern: 'filing', desc: 'Statutory filing obligation', type: 'statutory' as const, deadline: '14 days', consequence: 'Company struck off, director disqualification' },
      { pattern: 'deadline', desc: 'Time-sensitive obligation with defined deadline', type: 'contractual' as const, deadline: 'Unknown', consequence: 'Penalty or default' },
      { pattern: 'board', desc: 'Fiduciary duty to board and shareholders', type: 'fiduciary' as const, deadline: null, consequence: 'Director liability' },
      { pattern: 'contract', desc: 'Contractual obligation to counterparty', type: 'contractual' as const, deadline: null, consequence: 'Breach of contract claim' },
      { pattern: 'regulatory', desc: 'Regulatory compliance obligation', type: 'regulatory' as const, deadline: null, consequence: 'Regulatory action or fine' },
    ]

    for (const { pattern, desc, type, deadline, consequence } of obligationPatterns) {
      if (raw.includes(pattern)) {
        findings.push({
          domain: 'obligation',
          data: { description: desc, type, deadline, consequence, evidenceBasis: 'User-reported', confidence: 'MEDIUM' },
        })
        evidenceNodes.push({
          kind: 'obligation',
          label: `Obligation: ${desc}`,
          summary: desc,
          severity: deadline ? 'HIGH' : 'MEDIUM',
          confidence: 0.7,
          sourceStage: 'kernel',
          sourceLens: 'obligation',
        })
      }
    }

    return {
      lensId: 'obligation',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'MEDIUM' : 'LOW',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Evidence Lens — Assess the quality and completeness of evidence.
   */
  private async evidenceLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    // Assess evidence quality
    const hasDocumentation = raw.includes('document') || raw.includes('record') || raw.includes('contract')
    const hasData = raw.includes('data') || raw.includes('report') || raw.includes('financial')
    const hasWitness = raw.includes('said') || raw.includes('told') || raw.includes('advised')
    const hasUnsupportedClaim = raw.includes('claim') || raw.includes('allegation') || raw.includes('unproven')

    if (!hasDocumentation && !hasData) {
      findings.push({
        domain: 'evidence',
        data: { issue: 'Low evidence quality', detail: 'Situation relies on user-reported information without documented backing', severity: 'HIGH' },
      })
      evidenceNodes.push({
        kind: 'evidence_gap',
        label: 'Evidence Gap: Low documentation',
        summary: 'Situation relies primarily on user-reported information without independent documentation',
        severity: 'HIGH',
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'evidence',
      })
    }

    if (hasUnsupportedClaim) {
      evidenceNodes.push({
        kind: 'evidence_warning',
        label: 'Evidence Warning: Unsupported claims',
        summary: 'Situation contains claims or allegations that may not be independently verifiable',
        severity: 'MEDIUM',
        confidence: 0.6,
        sourceStage: 'kernel',
        sourceLens: 'evidence',
      })
    }

    return {
      lensId: 'evidence',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: 'MEDIUM',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Adversarial Lens — Generate adversarial challenges to the decision.
   */
  private async adversarialLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const contradictions: KernelContradiction[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    // Detect potential contradictions

    // Filing obligation vs no funds (compliance scenario)
    if ((raw.includes('filing') || raw.includes('deadline') || raw.includes('due')) &&
        (raw.includes('no funds') || raw.includes('no money') || raw.includes('cash-poor') || raw.includes('insufficient') || raw.includes('cannot afford') || raw.includes('no budget'))) {
      contradictions.push({
        id: 'obligation-vs-resources',
        between: ['obligation-lens', 'constraint-reality-lens'],
        contradiction: 'Obligation to meet deadline exists but resources to meet it do not',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Board authority vs cash constraint
    if (raw.includes('board') && (raw.includes('no funds') || raw.includes('no money') || raw.includes('cash-poor'))) {
      contradictions.push({
        id: 'board-vs-cash',
        between: ['authority-lens', 'constraint-reality-lens'],
        contradiction: 'Board authority exists but cash to execute board decisions does not',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Deadline vs no funds
    if (raw.includes('deadline') && (raw.includes('no funds') || raw.includes('no money'))) {
      contradictions.push({
        id: 'deadline-vs-cash',
        between: ['obligation-lens', 'constraint-reality-lens'],
        contradiction: 'Obligation to meet deadline exists but funds to meet it do not',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Claim vs weak evidence
    if ((raw.includes('claim') || raw.includes('market leadership') || raw.includes('growth')) &&
        (raw.includes('no proof') || raw.includes('unproven') || raw.includes('only') || raw.includes('weak'))) {
      contradictions.push({
        id: 'claim-vs-evidence',
        between: ['market-claim-lens', 'evidence-lens'],
        contradiction: 'Claim is being made but evidence to support it is absent or weak',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Launch pressure vs unresolved issues
    if ((raw.includes('launch') || raw.includes('release')) &&
        (raw.includes('bug') || raw.includes('security') || raw.includes('not ready'))) {
      contradictions.push({
        id: 'launch-vs-readiness',
        between: ['release-risk-lens', 'evidence-lens'],
        contradiction: 'Pressure to launch conflicts with unresolved readiness issues',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Authority vs responsibility (unclear accountability)
    if (raw.includes('no one knows') || raw.includes('says it is') || raw.includes('blaming') ||
        raw.includes('not sure who') || raw.includes('unclear who') || raw.includes('who decides')) {
      contradictions.push({
        id: 'authority-vs-responsibility',
        between: ['authority-lens', 'obligation-lens'],
        contradiction: 'Responsibility exists but authority to act is unclear or disputed',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Existential threat vs lack of resources
    if ((raw.includes('struck off') || raw.includes('dissolve') || raw.includes('insolvent') ||
         raw.includes('wind down') || raw.includes('closure')) &&
        (raw.includes('no funds') || raw.includes('cannot afford') || raw.includes('runway') || raw.includes('cash'))) {
      contradictions.push({
        id: 'existential-threat-vs-resources',
        between: ['failure-mode-lens', 'constraint-reality-lens'],
        contradiction: 'Existential threat detected but resources to address it are constrained',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Board pressure vs internal reservations (governance scenario)
    if (raw.includes('board') && (raw.includes('reservations') || raw.includes('concerns') ||
        raw.includes('divided') || raw.includes('disagree') || raw.includes('objections'))) {
      contradictions.push({
        id: 'board-pressure-vs-reservations',
        between: ['authority-lens', 'evidence-lens'],
        contradiction: 'Board action is proposed but internal reservations or disagreement have not been resolved',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Executive direction vs governance process
    if ((raw.includes('ceo') || raw.includes('executive')) &&
        (raw.includes('board') || raw.includes('director')) &&
        (raw.includes('not reviewed') || raw.includes('not approved') || raw.includes('not agreed') ||
         raw.includes('concern') || raw.includes('without board'))) {
      contradictions.push({
        id: 'executive-vs-governance',
        between: ['authority-lens', 'obligation-lens'],
        contradiction: 'Executive direction conflicts with governance process or board oversight requirement',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Revenue/funding urgency vs cash exhaustion
    // Pattern covers: "neither has committed", "not yet committed", "hasn't committed",
    // "no commitment", "delayed payment", investors present but uncommitted
    if (
      (raw.includes('runway') || raw.includes('payroll') || raw.includes('weeks of') ||
       raw.includes('months of') || raw.includes('cash runway')) &&
      (raw.includes('no investor') || raw.includes('not committed') || raw.includes('no funding') ||
       raw.includes('no commitment') || raw.includes('neither has committed') ||
       raw.includes('not yet committed') || raw.includes("hasn't committed") ||
       raw.includes('delayed payment') || raw.includes('delay') ||
       (raw.includes('investor') && (raw.includes('committed') || raw.includes('discussion'))))
    ) {
      contradictions.push({
        id: 'runway-vs-funding-delay',
        between: ['constraint-reality-lens', 'obligation-lens'],
        contradiction: 'Cash runway is critically short but required funding has not been secured or is delayed',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Strategic commitment vs capability loss
    // Extended to cover: "no exit clause", "IP rights", "sign quickly", irreversible terms
    if (
      (raw.includes('exclusive') || raw.includes('distribution deal') || raw.includes('partnership') ||
       raw.includes('strategic partnership')) &&
      (raw.includes('lose') || raw.includes('cannot') || raw.includes('no longer') ||
       raw.includes('give up') || raw.includes('restrict') ||
       raw.includes('no exit') || raw.includes('ip rights') || raw.includes('derivative works') ||
       raw.includes('sign quickly') || raw.includes('sign before') ||
       raw.includes('irrevocable') || raw.includes('permanent'))
    ) {
      contradictions.push({
        id: 'strategic-commitment-vs-capability',
        between: ['obligation-lens', 'failure-mode-lens'],
        contradiction: 'Proposed commitment would permanently restrict or eliminate a current capability or creates irrevocable IP/capability transfer',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Legal concern vs urgency (e.g. legal says don't sign but exec wants to rush)
    if (
      raw.includes('legal') &&
      (raw.includes('sign quickly') || raw.includes('before they change') || raw.includes('no exit') ||
       raw.includes('quickly') || raw.includes('before the') || raw.includes('rushed')) &&
      (raw.includes('ceo wants') || raw.includes('wants to sign') || raw.includes('wants to proceed') ||
       raw.includes('wants to approve'))
    ) {
      contradictions.push({
        id: 'urgency-vs-legal-concern',
        between: ['authority-lens', 'obligation-lens'],
        contradiction: 'Executive urgency to commit conflicts with unresolved legal concerns',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Reputational crisis vs absence of reviewed/agreed response plan
    // Extended: "newspaper" as media signal; PR-vs-legal conflict; allegations + no agreed response
    const hasReputationalThreat =
      raw.includes('reputation') || raw.includes('media') || raw.includes('press') ||
      raw.includes('public statement') || raw.includes('crisis') || raw.includes('scandal') ||
      raw.includes('newspaper') || raw.includes('journalist') || raw.includes('allegation') ||
      raw.includes('allegations')
    const hasResponseGap =
      raw.includes('no response') || raw.includes('not reviewed') || raw.includes('no plan') ||
      raw.includes('no strategy') || raw.includes('increasing') || raw.includes('escalat') ||
      raw.includes('recommends') || raw.includes('prejudice') || raw.includes('could prejudice') ||
      raw.includes('pr firm') || raw.includes('pr agency') ||
      (raw.includes('legal') && (raw.includes('statement') || raw.includes('public')))

    if (hasReputationalThreat && hasResponseGap) {
      contradictions.push({
        id: 'reputational-threat-vs-response-gap',
        between: ['failure-mode-lens', 'evidence-lens'],
        contradiction: 'Reputational threat is active but no reviewed, legally-cleared response plan exists',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // PR vs legal conflict (specific sub-pattern of reputational)
    if (
      (raw.includes('pr firm') || raw.includes('pr agency') || raw.includes('public relations') ||
       raw.includes('pr recommends') || raw.includes('communications')) &&
      (raw.includes('legal') || raw.includes('solicitor') || raw.includes('lawyer')) &&
      (raw.includes('statement') || raw.includes('response') || raw.includes('denial') || raw.includes('deny'))
    ) {
      contradictions.push({
        id: 'pr-vs-legal-conflict',
        between: ['authority-lens', 'obligation-lens'],
        contradiction: 'PR team and legal team have conflicting recommendations — response strategy is unresolved',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Revenue pressure vs release readiness gap
    if ((raw.includes('revenue') || raw.includes('contract') || raw.includes('client')) &&
        (raw.includes('not complete') || raw.includes('in progress') || raw.includes('testing') ||
         raw.includes('not ready') || raw.includes('not signed off') || raw.includes('not approved'))) {
      contradictions.push({
        id: 'revenue-vs-readiness',
        between: ['constraint-reality-lens', 'evidence-lens'],
        contradiction: 'Revenue or contract pressure exists but readiness or approval has not been confirmed',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    // Investor pitch vs unvalidated claims
    if ((raw.includes('pitch') || raw.includes('investor') || raw.includes('raising')) &&
        (raw.includes('not validated') || raw.includes('projection') || raw.includes('internal') ||
         raw.includes('unverified') || raw.includes('not proven'))) {
      contradictions.push({
        id: 'investor-claim-vs-evidence',
        between: ['market-claim-lens', 'evidence-lens'],
        contradiction: 'Investor or market claim is being made but supporting evidence has not been independently validated',
        severity: 'HIGH',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    return {
      lensId: 'adversarial',
      lensVersion: '1.0.0',
      applied: contradictions.length > 0,
      confidence: contradictions.length > 0 ? 'HIGH' : 'MEDIUM',
      findings: [],
      evidenceNodes: contradictions.map(c => ({
        kind: 'contradiction',
        label: `Contradiction: ${c.contradiction.substring(0, 60)}`,
        summary: c.contradiction,
        severity: c.severity,
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'adversarial',
      })),
      contradictions,
      recommendedEvents: [],
    }
  }

  /**
   * Market Claim Lens — Assess whether market claims are supported.
   */
  private async marketClaimLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    if (raw.includes('claim') || raw.includes('market leadership') || raw.includes('growth')) {
      const hasEvidence = raw.includes('data') || raw.includes('customer') || raw.includes('revenue')
      findings.push({
        domain: 'evidence',
        data: {
          claimDetected: true,
          supported: hasEvidence,
          risk: hasEvidence ? 'LOW' : 'HIGH',
        },
      })
      evidenceNodes.push({
        kind: 'market_claim',
        label: hasEvidence ? 'Market Claim: Partially supported' : 'Market Claim: Unsupported',
        summary: hasEvidence
          ? 'Market claim has some supporting evidence but should be verified'
          : 'Market claim is made without supporting evidence — reputational and regulatory risk',
        severity: hasEvidence ? 'MEDIUM' : 'HIGH',
        confidence: 0.7,
        sourceStage: 'kernel',
        sourceLens: 'market-claim',
      })
    }

    return {
      lensId: 'market-claim',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: 'MEDIUM',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Release Risk Lens — Assess the risk of proceeding with release/launch.
   */
  private async releaseRiskLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    const riskFactors = [
      { signal: 'bug', risk: 'Known unresolved defects', severity: 'HIGH' as const },
      { signal: 'security', risk: 'Security review incomplete', severity: 'CRITICAL' as const },
      { signal: 'not ready', risk: 'Product or service not ready for release', severity: 'CRITICAL' as const },
      { signal: 'pre-sold', risk: 'Revenue pre-sold against unproven delivery', severity: 'HIGH' as const },
    ]

    for (const { signal, risk, severity } of riskFactors) {
      if (raw.includes(signal)) {
        findings.push({
          domain: 'evidence',
          data: { type: 'release_risk', risk, severity },
        })
        evidenceNodes.push({
          kind: 'release_risk',
          label: `Release Risk: ${risk}`,
          summary: risk,
          severity,
          confidence: 0.8,
          sourceStage: 'kernel',
          sourceLens: 'release-risk',
        })
      }
    }

    return {
      lensId: 'release-risk',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'HIGH' : 'MEDIUM',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Continuity Lens — Assess continuity and transition risks.
   */
  private async continuityLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    if (raw.includes('succession') || raw.includes('transition') || raw.includes('handover')) {
      findings.push({
        domain: 'evidence',
        data: { type: 'continuity_risk', detail: 'Transition or succession event detected — continuity planning required' },
      })
      evidenceNodes.push({
        kind: 'continuity',
        label: 'Continuity Risk: Transition detected',
        summary: 'Transition or succession event detected — continuity planning is required',
        severity: 'HIGH',
        confidence: 0.7,
        sourceStage: 'kernel',
        sourceLens: 'continuity',
      })
    }

    if (raw.includes('resigned') || raw.includes('departing') || raw.includes('leaving')) {
      evidenceNodes.push({
        kind: 'continuity',
        label: 'Continuity Risk: Key person departing',
        summary: 'Key person is departing — knowledge transfer and continuity planning needed',
        severity: 'HIGH',
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'continuity',
      })
    }

    return {
      lensId: 'continuity',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'MEDIUM' : 'LOW',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Regulated Boundary Lens — Detect regulated professional advice boundaries.
   */
  private async regulatedBoundaryLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const findings: LensFinding[] = []
    const evidenceNodes: DecisionEvidenceNode[] = []
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    const boundaryTriggers = [
      { signal: 'tax', boundary: 'tax-advice', label: 'Tax advice boundary' },
      { signal: 'legal', boundary: 'legal-advice', label: 'Legal advice boundary' },
      { signal: 'solicitor', boundary: 'legal-advice', label: 'Legal advice boundary' },
      { signal: 'investment', boundary: 'investment-advice', label: 'Investment advice boundary' },
      { signal: 'insolvent', boundary: 'insolvency-advice', label: 'Insolvency advice boundary' },
      { signal: 'bankrupt', boundary: 'insolvency-advice', label: 'Insolvency advice boundary' },
      { signal: 'fiduciary', boundary: 'director-duty-advice', label: 'Director duty advice boundary' },
    ]

    for (const { signal, boundary, label } of boundaryTriggers) {
      if (raw.includes(signal)) {
        findings.push({
          domain: 'evidence',
          data: { type: 'regulated_boundary', boundary, label },
        })
        evidenceNodes.push({
          kind: 'regulated_boundary',
          label,
          summary: `Regulated boundary detected: ${label}. System must not overclaim professional advice.`,
          severity: 'HIGH',
          confidence: 0.9,
          sourceStage: 'kernel',
          sourceLens: 'regulated-boundary',
        })
      }
    }

    return {
      lensId: 'regulated-boundary',
      lensVersion: '1.0.0',
      applied: findings.length > 0,
      confidence: findings.length > 0 ? 'HIGH' : 'LOW',
      findings,
      evidenceNodes,
      contradictions: [],
      recommendedEvents: [],
    }
  }

  /**
   * Commercial Proof Lens — Assesses whether commercial claims can survive challenge.
   */
  private async commercialProofLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const { commercialProofLens: lens } = await import('./lenses/commercial-proof-lens')
    return lens(livingCase.situationModel?.rawContext || '')
  }

  /**
   * Launch Readiness Lens — Assesses product/service launch readiness.
   */
  private async launchReadinessLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const { launchReadinessLens: lens } = await import('./lenses/launch-readiness-lens')
    return lens(livingCase.situationModel?.rawContext || '')
  }

  /**
   * Supplier Dependency Lens — Assesses supplier/vendor dependency risk.
   */
  private async supplierDependencyLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const { supplierDependencyLens: lens } = await import('./lenses/supplier-dependency-lens')
    return lens(livingCase.situationModel?.rawContext || '')
  }

  /**
   * Investor Diligence Lens — Assesses investor pitch due diligence readiness.
   */
  private async investorDiligenceLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const { investorDiligenceLens: lens } = await import('./lenses/investor-diligence-lens')
    return lens(livingCase.situationModel?.rawContext || '')
  }

  /**
   * Operational Ownership Lens — Assesses operational ownership and accountability.
   */
  private async operationalOwnershipLens(livingCase: LivingDecisionCase): Promise<KernelLensResult> {
    const { operationalOwnershipLens: lens } = await import('./lenses/operational-ownership-lens')
    return lens(livingCase.situationModel?.rawContext || '')
  }
}
