/**
 * lib/intelligence/situation-translator.ts — First Gate
 *
 * Converts buyer language into institutional structure without destroying ambiguity.
 *
 * Translation law:
 * - Never collapse ambiguity into false precision.
 * - If authority is unclear, say authority is unclear.
 * - If obligation may exist but is not confirmed, say so.
 * - If the situation may belong to two decision classes, preserve both.
 * - False precision is worse than uncertainty.
 *
 * Vocabulary states:
 *   1 — Urgency without structure
 *   2 — Structure without diagnosis
 *   3 — Diagnosis without path
 *   4 — Path without governance
 *   5 — Misclassified stakes (high presented as low, or vice versa)
 *
 * FIXES applied over Deepseek's initial pass:
 *   - State 5 now means misclassified stakes, not "has all four signals"
 *   - Multi-class scoring replaces first-match classification
 *   - alternativeClasses preserved when two domains are plausible
 *   - calculateConfidence uses class score gap + ambiguity, not vocabulary state
 *   - detectedSignals added alongside surfacedDimensions for structured logic use
 *   - generateSummary is now institutional, not just the first sentence
 *   - Hidden stakes detects compliance trivialised as minor
 */

import type {
  TranslationResult,
  ClarificationQuestion,
  DecisionClass,
  DecisionClassCandidate,
  ActorCandidate,
  ConfidenceLevel,
} from './types'

type ClassScore = { cls: DecisionClass; score: number }

export class SituationTranslator {
  /**
   * Translate raw buyer language into institutional structure.
   */
  async translate(rawScenario: string): Promise<TranslationResult> {
    const lower = rawScenario.toLowerCase()

    const classScores = this.scoreDecisionClasses(lower)
    const decisionClass = classScores[0]?.cls ?? 'STRATEGIC_AND_POSITIONING'
    const alternativeClasses = this.buildAlternatives(classScores)
    const classConfidence = this.classConfidenceFromScores(classScores)

    const vocabularyState = this.detectVocabularyState(lower)
    const detectedSignals = this.detectStructuredSignals(lower, decisionClass)
    const surfacedDimensions = this.buildDisplayDimensions(detectedSignals, decisionClass)
    const initialActors = this.extractActors(lower)
    const preservedAmbiguities = this.detectAmbiguities(lower, decisionClass, classConfidence)
    const hiddenStakesDetected = this.detectHiddenStakes(lower, decisionClass)

    const clarificationRequired = this.generateClarifications(
      vocabularyState,
      decisionClass,
      preservedAmbiguities,
      hiddenStakesDetected,
    )

    const translationConfidence = this.calculateConfidence(
      classScores,
      preservedAmbiguities,
      vocabularyState,
    )

    return {
      vocabularyState,
      situationSummary: this.generateSummary(rawScenario, decisionClass, detectedSignals),
      kernelInterpretation: this.generateInterpretation(lower, decisionClass, detectedSignals),
      translationConfidence,
      clarificationRequired,
      decisionClass,
      alternativeClasses,
      initialActors,
      surfacedDimensions,
      detectedSignals,
      preservedAmbiguities,
      hiddenStakesDetected,
    }
  }

  // ─── Vocabulary state ───────────────────────────────────────────────────────

  /**
   * Detects the structural completeness of the input.
   *
   * State 5 is SPECIFICALLY misclassified stakes — not "has all signals".
   * A well-governed decision should return state 4, never state 5 simply
   * because it mentions governance.
   */
  private detectVocabularyState(lower: string): 1 | 2 | 3 | 4 | 5 {
    // State 5 check FIRST: misclassified stakes (high presented as low)
    if (this.hasMisclassifiedStakes(lower)) return 5

    const hasStructure = this.hasInstitutionalStructure(lower)
    const hasDiagnosis = this.hasDiagnosticLanguage(lower)
    const hasPath = this.hasPathLanguage(lower)
    const hasGovernance = this.hasGovernanceLanguage(lower)

    // Well-formed decision question with an implied preference → state 2
    // (Has implicit structure even if no institutional keywords)
    const isWellFormedQuestion =
      lower.startsWith('should') ||
      lower.startsWith('can') ||
      lower.startsWith('would it') ||
      /^(which|what|how|when|where) (should|would|can|could|will|shall)/.test(lower)

    if (!hasStructure && !isWellFormedQuestion) return 1
    if (!hasDiagnosis) return 2
    if (!hasPath) return 3
    if (!hasGovernance) return 4
    return 4
  }

  private hasMisclassifiedStakes(lower: string): boolean {
    // High-consequence signals present alongside trivialising language
    const highConsequenceSignals = [
      'fine', 'penalty', 'court', 'statutory', 'compliance', 'hmrc',
      'legal obligation', 'must file', 'board approval', 'fiduciary',
    ]
    const trivialLanguage = [
      'minor', 'simple', 'quick', 'small', 'easy', "shouldn't take long",
      'just a', 'only a', 'not a big deal',
    ]
    const hasHighConsequence = highConsequenceSignals.some(s => lower.includes(s))
    const hasTrivial = trivialLanguage.some(s => lower.includes(s))

    // Low classification + explicit high-stakes content
    const looksLowStakes =
      ['personal preference', 'which one', 'nice to have', 'no deadline', 'no budget'].some(s =>
        lower.includes(s),
      )
    const containsHighStakes =
      ['million', 'billion', 'board', 'director', 'regulatory', 'legal', 'penalty'].some(s =>
        lower.includes(s),
      )

    return (hasHighConsequence && hasTrivial) || (looksLowStakes && containsHighStakes)
  }

  private hasInstitutionalStructure(lower: string): boolean {
    return [
      'decision', 'deadline', 'obligation', 'board', 'authority',
      'contract', 'compliance', 'filing', 'governance', 'stakeholder',
      'director', 'company', 'organisation', 'committee',
      // Tax / financial filing signals
      'tax', 'accounts', 'turnover', 'revenue', 'fine', 'penalty',
      // Legal
      'legal', 'court', 'tribunal',
    ].some(s => lower.includes(s))
  }

  private hasDiagnosticLanguage(lower: string): boolean {
    return [
      'because', 'cause', 'reason', 'driver', 'root', 'source',
      'due to', 'arising from', 'triggered by', 'result of',
    ].some(s => lower.includes(s))
  }

  private hasPathLanguage(lower: string): boolean {
    return [
      'option', 'path', 'approach', 'strategy', 'plan', 'next step',
      'way forward', 'resolution', 'remedy', 'solution',
    ].some(s => lower.includes(s))
  }

  private hasGovernanceLanguage(lower: string): boolean {
    return [
      'governance', 'oversight', 'review', 'approval', 'ratification',
      'board resolution', 'committee', 'fiduciary', 'sign-off', 'approved',
    ].some(s => lower.includes(s))
  }

  // ─── Multi-class scoring ────────────────────────────────────────────────────

  /**
   * Scores all 12 decision classes and returns sorted results.
   * Uses additive scoring to preserve alternatives — not first-match.
   */
  private scoreDecisionClasses(lower: string): ClassScore[] {
    const scores: ClassScore[] = [
      { cls: 'COMPLIANCE_AND_FILING',     score: 0 },
      { cls: 'GOVERNANCE_AND_BOARD',      score: 0 },
      { cls: 'COMMERCIAL_AND_MARKET',     score: 0 },
      { cls: 'OPERATIONAL_AND_EXECUTION', score: 0 },
      { cls: 'STRATEGIC_AND_POSITIONING', score: 0 },
      { cls: 'REPUTATIONAL_AND_EXPOSURE', score: 0 },
      { cls: 'FINANCIAL_AND_CAPITAL',     score: 0 },
      { cls: 'LEGAL_AND_CONTRACTUAL',     score: 0 },
      { cls: 'PEOPLE_AND_AUTHORITY',      score: 0 },
      { cls: 'TECHNOLOGY_AND_DEPENDENCY', score: 0 },
      { cls: 'CONTINUITY_AND_TRANSITION', score: 0 },
      { cls: 'LOW_STAKES_PREFERENCE',     score: 0 },
    ]

    const boost = (cls: DecisionClass, pts: number) => {
      const e = scores.find(s => s.cls === cls)
      if (e) e.score += pts
    }

    // Check LOW_STAKES first — only when no high-stakes signals present
    if (this.isLowStakesPreference(lower)) {
      boost('LOW_STAKES_PREFERENCE', 20)
    }

    // COMPLIANCE_AND_FILING
    if (this.matchesAny(lower, ['hmrc', 'companies house', 'company tax', 'corporation tax', 'ct600', 'vat return', 'tax return', 'statutory accounts', 'annual accounts', 'annual return', 'confirmation statement', 'paye', 'national insurance', 'inland revenue', 'irs', 'ato', 'cra', 'self-assessment'])) boost('COMPLIANCE_AND_FILING', 10)
    // "file my tax", "file the accounts", "file a return" etc.
    if (this.matchesAny(lower, ['file accounts', 'file tax', 'file my tax', 'file the tax', 'file a return', 'submit accounts', 'regulatory filing', 'compliance deadline'])) boost('COMPLIANCE_AND_FILING', 6)
    if (this.matchesAny(lower, ['filing', 'file accounts'])) boost('COMPLIANCE_AND_FILING', 3)
    if (/\bfile\b/.test(lower) && /\btax\b/.test(lower)) boost('COMPLIANCE_AND_FILING', 6)
    if (this.matchesAny(lower, ['statutory', 'statutory obligation', 'statutory deadline', 'must file', 'legally required', 'compliance implications', 'compliance requirement', 'compliance obligation'])) boost('COMPLIANCE_AND_FILING', 5)

    // GOVERNANCE_AND_BOARD — must not match 'onboarding', 'dashboard', 'keyboard', 'skateboard' etc.
    // Using specific phrases rather than bare 'board' to avoid false positives
    if (this.matchesAny(lower, ['board of directors', 'board approval', 'board decision', 'board meeting', 'board pack', 'board resolution', 'board vote', 'board needs to', 'board is', 'board has', 'board will', 'board member', 'board level', 'board paper', 'board room', 'board agenda', 'board minute', 'governance', 'director duty', 'fiduciary', 'non-executive', 'nxd', 'chairman', 'agm', 'egm'])) boost('GOVERNANCE_AND_BOARD', 10)
    if (this.matchesAny(lower, ['signs off', 'sign-off', 'ratification'])) boost('GOVERNANCE_AND_BOARD', 5)

    // COMMERCIAL_AND_MARKET
    if (this.matchesAny(lower, ['market claim', 'positioning', 'pricing strategy', 'go-to-market', 'distribution deal', 'exclusive deal', 'competitive positioning', 'customer acquisition', 'sales strategy', 'contract negotiation', 'partnership terms', 'investor pitch', 'pitching to investors', 'pitch deck', 'investor presentation'])) boost('COMMERCIAL_AND_MARKET', 10)
    if (this.matchesAny(lower, ['competitor', 'market share', 'customer', 'revenue model', 'commercial terms', 'buyer proof', 'traction', 'growth claim', 'year-on-year', 'pitching'])) boost('COMMERCIAL_AND_MARKET', 4)

    // OPERATIONAL_AND_EXECUTION
    if (this.matchesAny(lower, ['release', 'deploy', 'launch', 'ship', 'go-live', 'production deploy', 'rollback', 'staging', 'outage', 'system down', 'operational failure'])) boost('OPERATIONAL_AND_EXECUTION', 10)
    if (this.matchesAny(lower, ['testing', 'qa', 'sign-off', 'monitoring', 'delivery', 'timeline', 'execution plan'])) boost('OPERATIONAL_AND_EXECUTION', 4)

    // STRATEGIC_AND_POSITIONING
    if (this.matchesAny(lower, ['strategy', 'strategic direction', 'market entry', 'pivot', 'repositioning', 'competitive advantage', 'long-term direction', 'strategic bet', 'exclusive distribution', 'lose ability to sell direct'])) boost('STRATEGIC_AND_POSITIONING', 8)
    if (this.matchesAny(lower, ['strategic', 'direction', 'vision', 'transformation', 'restructure', 'reorganisation', 'expansion', 'positioning'])) boost('STRATEGIC_AND_POSITIONING', 5)
    // Asymmetric partnerships where one party has disproportionate power
    if (this.matchesAny(lower, ['much larger company', 'asymmetric', 'power imbalance', 'dominant partner'])) boost('STRATEGIC_AND_POSITIONING', 6)

    // REPUTATIONAL_AND_EXPOSURE
    if (this.matchesAny(lower, ['reputation', 'reputational', 'crisis', 'brand damage', 'public statement', 'press release', 'media coverage', 'scandal', 'allegation', 'pr crisis', 'public perception'])) boost('REPUTATIONAL_AND_EXPOSURE', 10)
    if (this.matchesAny(lower, ['press', 'media', 'public', 'trust', 'credibility'])) boost('REPUTATIONAL_AND_EXPOSURE', 3)

    // FINANCIAL_AND_CAPITAL
    if (this.matchesAny(lower, ['investment decision', 'funding round', 'bridge round', 'equity raise', 'loan', 'term sheet', 'runway', 'weeks of runway', 'months of runway', 'capital raise', 'balance sheet', 'wind down', 'insolvency', 'solvency'])) boost('FINANCIAL_AND_CAPITAL', 10)
    if (this.matchesAny(lower, ['cash', 'budget', 'cost', 'funding', 'liquidity', 'expenditure', 'profit'])) boost('FINANCIAL_AND_CAPITAL', 4)

    // LEGAL_AND_CONTRACTUAL
    if (this.matchesAny(lower, ['lawsuit', 'litigation', 'court', 'tribunal', 'gdpr', 'data protection', 'contract dispute', 'breach of contract', 'legal obligation', 'legal dispute', 'legal issue', 'legal matter', 'legal action', 'legal claim', 'legal contract', 'legal implications', 'solicitor', 'barrister', 'letter before claim'])) boost('LEGAL_AND_CONTRACTUAL', 10)
    if (this.matchesAny(lower, ['legal', 'contractual', 'liability', 'indemnity', 'warranty', 'breach', 'termination', 'dispute'])) boost('LEGAL_AND_CONTRACTUAL', 4)

    // PEOPLE_AND_AUTHORITY — "team" alone is too generic; require more specific signals
    if (this.matchesAny(lower, ['hire', 'hiring', 'fire', 'firing', 'redundancy', 'dismiss', 'performance management', 'succession planning', 'leadership change', 'authority delegation', 'mandate delegation'])) boost('PEOPLE_AND_AUTHORITY', 10)
    if (this.matchesAny(lower, ['succession', 'handover', 'delegation', 'reporting line', 'authority structure'])) boost('PEOPLE_AND_AUTHORITY', 5)
    // "team" without high-stakes context is weak signal — do not score it

    // TECHNOLOGY_AND_DEPENDENCY
    if (this.matchesAny(lower, ['vendor lock', 'supplier dependency', 'critical supplier', 'no alternative supplier', 'sole supplier', 'system migration', 'platform migration', 'technical debt', 'infrastructure change', 'cyber risk', 'security breach'])) boost('TECHNOLOGY_AND_DEPENDENCY', 10)
    if (this.matchesAny(lower, ['technology', 'software', 'system', 'platform', 'data', 'infrastructure', 'it', 'migration'])) boost('TECHNOLOGY_AND_DEPENDENCY', 3)

    // CONTINUITY_AND_TRANSITION
    if (this.matchesAny(lower, ['succession', 'handover plan', 'business continuity', 'winding down', 'closure', 'exit plan', 'institutional memory', 'what happens when', 'after i leave', 'after we close'])) boost('CONTINUITY_AND_TRANSITION', 10)
    if (this.matchesAny(lower, ['transition', 'continuity', 'wind-down', 'exit'])) boost('CONTINUITY_AND_TRANSITION', 4)

    return scores.sort((a, b) => b.score - a.score)
  }

  private buildAlternatives(scores: ClassScore[]): DecisionClassCandidate[] {
    const top = scores[0]?.score ?? 0
    return scores
      .slice(1, 4)
      .filter(s => s.score > 0 && s.score >= Math.max(1, top * 0.35)) // Within 35% of top score
      .map(s => ({
        decisionClass: s.cls,
        confidence: (s.score >= top * 0.7 ? 'HIGH' : s.score >= top * 0.5 ? 'MEDIUM' : 'LOW') as ConfidenceLevel,
        reason: `Score ${s.score} vs primary ${top}`,
      }))
  }

  private classConfidenceFromScores(scores: ClassScore[]): ConfidenceLevel {
    const top = scores[0]?.score ?? 0
    const runner = scores[1]?.score ?? 0
    if (top === 0) return 'LOW'
    if (top >= 10 && runner === 0) return 'HIGH'
    if (top >= 10 && top - runner >= 6) return 'HIGH'
    if (top >= 6 && top - runner >= 3) return 'MEDIUM'
    return 'LOW'
  }

  private matchesAny(text: string, patterns: string[]): boolean {
    return patterns.some(p => text.includes(p))
  }

  private isLowStakesPreference(text: string): boolean {
    const lowSignals = [
      'preference', 'which one', 'opinion', 'nice to have',
      'personal choice', 'not urgent', 'no deadline', 'no budget',
      'no customer impact', 'team preference', 'purely',
      'decide which', 'trying to decide',
      'should we move', 'should we change', 'should we switch', 'should we reschedule',
      'should i move', 'should i change', 'should i switch',
      'move the meeting', 'reschedule the', 'rename the',
    ]
    const highSignals = [
      'obligation', 'critical', 'consequence', 'risk', 'exposure',
      'liability', 'penalty', 'board', 'director', 'fiduciary',
      'compliance', 'regulatory', 'filing', 'legal', 'contract',
      'litigation', 'funding', 'investment', 'revenue', 'crisis',
    ]
    const hasLow = lowSignals.some(s => text.includes(s))
    const hasHigh = highSignals.some(s => {
      const regex = new RegExp(`(?:^|\\s)${s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}(?:$|\\s|[.,;!?])`, 'i')
      return regex.test(text) && !text.includes(`no ${s}`) && !text.includes(`not ${s}`)
    })
    return hasLow && !hasHigh
  }

  // ─── Structured signal detection ────────────────────────────────────────────

  /**
   * Detects structured signals used by downstream logic.
   * Format: "dimension:signal" — e.g. "constraint:cash", "obligation:deadline"
   */
  private detectStructuredSignals(lower: string, cls: DecisionClass): string[] {
    const signals: string[] = []

    // Cash constraint — must not match negated patterns like "no budget constraint" (meaning budget is NOT a constraint)
    const cashConstraintSignals = ['no funds', 'no money', 'cannot afford', "can't afford", 'limited budget', 'do not have funds', 'runway', 'not sure i can afford', 'may not be able to afford']
    const hasCashConstraint = cashConstraintSignals.some(s => lower.includes(s))
    // Also check for "no budget" but only if it's not followed by "constraint" or "issue" (which would negate it)
    const hasNoBudget = lower.includes('no budget') && !lower.includes('no budget constraint') && !lower.includes('no budget issue')
    if (hasCashConstraint || hasNoBudget) {
      signals.push('constraint:cash')
    }

    // Capability gap
    if (this.matchesAny(lower, ['no accountant', 'no solicitor', 'no lawyer', 'no expertise', 'complicated', 'complex accounts', 'no professional', 'cannot do this myself', "don't know how"])) {
      signals.push('constraint:capability')
    }

    // Records incomplete
    if (this.matchesAny(lower, ['placeholder', 'provisional filing', 'missing records', 'no records', 'incomplete records'])) {
      signals.push('constraint:records_incomplete')
    }

    // External deadline
    if (
      this.matchesAny(lower, [
        'deadline', 'must file by', 'must respond', 'by end of', 'by next',
        'within days', 'within weeks', 'within \d+ days', 'next week', 'next month',
        'overdue', 'filing due', 'response due', 'court date',
        'till june', 'till july', 'till august', 'till september', 'till october',
        'till november', 'till december', 'till january', 'till february', 'till march',
        'till april', 'till may',
        'respond within', 'days to respond', 'days to file',
      ]) ||
      /till \w+ \d{4}/.test(lower) ||
      /within \d+ (day|week|month)/.test(lower)
    ) {
      signals.push('obligation:deadline')
    }

    // Statutory obligation
    if (
      cls === 'COMPLIANCE_AND_FILING' ||
      this.matchesAny(lower, ['hmrc', 'statutory', 'must file', 'legally required', 'companies house', 'annual accounts']) ||
      (/\bfile\b/.test(lower) && /\btax\b/.test(lower))
    ) {
      signals.push('obligation:statutory')
    }

    // Penalty exposure
    if (this.matchesAny(lower, ['fine', 'penalty', 'fined', 'penalised', 'enforcement', 'sanction', '£', 'huge fine', 'large fine']) && !this.matchesAny(lower, ['seems fine', 'is fine', 'all fine', 'quite fine'])) {
      signals.push('consequence:penalty')
    }

    // Authority unclear
    if (this.matchesAny(lower, ['not sure who', 'unclear who', 'who decides', "don't know who", 'no approval yet', 'not confirmed', 'signs off'])) {
      signals.push('authority:unclear')
    }

    // Board authority required
    if (cls === 'GOVERNANCE_AND_BOARD' || this.matchesAny(lower, ['board approval', 'board needs to', 'board must', 'shareholder approval'])) {
      signals.push('authority:board_required')
    }

    // Evidence present
    if (this.matchesAny(lower, ['data', 'evidence', 'research', 'analysis', 'report', 'study', 'survey', 'benchmark'])) {
      signals.push('evidence:present')
    }

    // Evidence assumed
    if (this.matchesAny(lower, ['assume', 'believe', 'thinks', 'probably', 'maybe', 'projection', 'projections', 'unvalidated', 'internally'])) {
      signals.push('evidence:assumed')
    }

    // Dependency unresolved
    if (this.matchesAny(lower, ['waiting for', 'blocked by', 'depends on', 'pending approval', 'pending review', 'pending data'])) {
      signals.push('dependency:unresolved')
    }

    // Irreversible
    if (this.matchesAny(lower, ['irreversible', "can't undo", 'no going back', 'irrevocable', 'once filed', 'once signed'])) {
      signals.push('reversibility:irreversible')
    }

    return signals
  }

  /**
   * Converts structured signals to short display labels.
   * "constraint:cash" → "financial", "obligation:deadline" → "timing", etc.
   */
  private buildDisplayDimensions(signals: string[], cls: DecisionClass): string[] {
    const dims = new Set<string>()
    // Low-stakes decisions should not surface institutional dimensions
    if (cls === 'LOW_STAKES_PREFERENCE') return []
    const map: Record<string, string> = {
      'constraint:cash': 'financial',
      'constraint:capability': 'capability',
      'constraint:records_incomplete': 'records',
      'obligation:deadline': 'timing',
      'obligation:statutory': 'obligation',
      'consequence:penalty': 'consequence',
      'authority:unclear': 'authority',
      'authority:board_required': 'authority',
      'evidence:present': 'evidence',
      'evidence:assumed': 'evidence',
      'dependency:unresolved': 'dependency',
      'reversibility:irreversible': 'reversibility',
    }
    for (const s of signals) {
      const display = map[s]
      if (display) dims.add(display)
    }
    return [...dims]
  }

  // ─── Actor extraction ───────────────────────────────────────────────────────

  private extractActors(lower: string): ActorCandidate[] {
    const actors: ActorCandidate[] = []

    const patterns: Array<{ pattern: RegExp; role: string; name: string }> = [
      { pattern: /\b(ceo)\b/i, role: 'executive', name: 'ceo' },
      { pattern: /\b(cfo)\b/i, role: 'executive', name: 'cfo' },
      { pattern: /\b(coo)\b/i, role: 'executive', name: 'coo' },
      { pattern: /\b(cto)\b/i, role: 'executive', name: 'cto' },
      { pattern: /\b(board|directors?|chairman|non.executive|nxd)\b/i, role: 'board', name: 'board' },
      { pattern: /\b(hmrc)\b/i, role: 'regulator', name: 'hmrc' },
      { pattern: /\b(companies house)\b/i, role: 'regulator', name: 'companies house' },
      { pattern: /\b(court)\b/i, role: 'regulator', name: 'court' },
      { pattern: /\b(solicitor|barrister|lawyer|legal)\b/i, role: 'advisor', name: 'legal advisor' },
      { pattern: /\b(accountant)\b/i, role: 'advisor', name: 'accountant' },
      { pattern: /\b(founder|owner|principal)\b/i, role: 'principal', name: 'founder' },
      { pattern: /\b(shareholder|investor)\b/i, role: 'stakeholder', name: 'investor' },
    ]

    // Also infer HMRC when tax filing context is present
    if (this.matchesAny(lower, ['tax return', 'tax filing', 'file tax', 'file my tax', 'corporation tax', 'hmrc'])) {
      if (!actors.some(a => a.name === 'hmrc')) {
        actors.push({ name: 'hmrc', role: 'regulator', confidence: 'HIGH', source: 'inferred_from_context' })
      }
    }

    for (const { pattern, role, name } of patterns) {
      if (pattern.test(lower) && !actors.some(a => a.name === name)) {
        actors.push({ name, role, confidence: 'HIGH', source: 'user_reported' })
      }
    }

    return actors
  }

  // ─── Ambiguity detection ────────────────────────────────────────────────────

  private detectAmbiguities(lower: string, cls: DecisionClass, confidence: ConfidenceLevel): string[] {
    const ambiguities: string[] = []

    // LOW_STAKES decisions do not generate authority/obligation/timing ambiguities
    if (cls === 'LOW_STAKES_PREFERENCE') {
      return ambiguities
    }

    if (confidence !== 'HIGH') {
      ambiguities.push('decision_class_uncertain')
    }

    const authorityConfirmed = this.matchesAny(lower, [
      'approved by', 'authorised by', 'authority confirmed', 'board has decided', 'signed off by',
      'approved the', 'team lead approved', 'manager approved', 'everyone agrees', 'agreed by',
      'board has authority', 'authority is clear', 'authority is established',
    ])
    if (!authorityConfirmed) {
      ambiguities.push('authority_structure')
    }

    const obligationSignals = this.matchesAny(lower, [
      'obligation', 'must', 'required by law', 'statutory', 'legally required',
      'duty', 'filing', 'file', 'submit',
    ])
    if (!obligationSignals && ['COMPLIANCE_AND_FILING', 'GOVERNANCE_AND_BOARD', 'LEGAL_AND_CONTRACTUAL'].includes(cls)) {
      ambiguities.push('obligation_landscape')
    }

    const constraintSignals = this.matchesAny(lower, [
      'constraint', 'cannot', 'no budget', 'no funds', 'no time', 'limited',
      'runway', 'afford', 'cash', 'capacity',
    ])
    if (!constraintSignals) {
      ambiguities.push('constraint_landscape')
    }

    const timingSignals = this.matchesAny(lower, [
      'deadline', 'urgent', 'asap', 'timeframe', 'by end of', 'within', 'due date',
      'till', 'next week', 'next month', 'by next', 'days to', 'respond by',
    ])
    if (!timingSignals) {
      ambiguities.push('timing_pressure')
    }

    return ambiguities
  }

  // ─── Hidden stakes ──────────────────────────────────────────────────────────

  private detectHiddenStakes(lower: string, cls: DecisionClass): boolean {
    // Pattern 1: Compliance/legal obligation trivialised as minor/simple
    const highConsequence = ['fine', 'penalty', 'court', 'statutory', 'compliance', 'hmrc', 'legal obligation', 'must file', 'board approval', 'fiduciary']
    const trivial = ['minor', 'simple', 'quick', 'small', 'easy', "shouldn't take long", 'just a', 'only a', 'not a big deal']
    if (highConsequence.some(s => lower.includes(s)) && trivial.some(s => lower.includes(s))) return true

    // Pattern 2: Financial magnitude mismatch
    if (cls !== 'FINANCIAL_AND_CAPITAL' && ['million', 'billion', 'significant investment', 'material loss'].some(s => lower.includes(s))) return true

    // Pattern 3: Reputational signal mismatch
    if (cls !== 'REPUTATIONAL_AND_EXPOSURE' && ['reputation', 'brand damage', 'crisis', 'scandal', 'allegation'].some(s => lower.includes(s))) return true

    // Pattern 4: Low-stakes classification but high-stakes language present
    // Must not match negated patterns like 'no deadline' (which means deadline is NOT present)
    if (cls === 'LOW_STAKES_PREFERENCE') {
      const highStakesTerms = ['penalty', 'legal', 'regulatory', 'board', 'director', 'compliance', 'filing']
      const hasHighStakes = highStakesTerms.some(s => lower.includes(s))
      // For 'deadline', check it's not negated
      const hasDeadline = lower.includes('deadline') && !lower.includes('no deadline')
      if (hasHighStakes || hasDeadline) return true
    }

    return false
  }

  // ─── Clarification questions ────────────────────────────────────────────────

  private generateClarifications(
    vocabularyState: number,
    cls: DecisionClass,
    ambiguities: string[],
    hiddenStakes: boolean,
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = []

    if (vocabularyState === 1) {
      questions.push({
        domain: 'structure',
        question: 'To map this situation accurately, what kind of decision is this — a statutory filing obligation, a board decision, a commercial negotiation, a legal dispute, or something else?',
        rationale: 'Without structural context the system cannot select the appropriate analysis lenses.',
      })
    }

    if (ambiguities.includes('authority_structure')) {
      questions.push({
        domain: 'authority',
        question: 'To map the authority structure accurately: is the board being asked to approve the decision, ratify one already made, or receive information after management has already acted?',
        rationale: 'Authority structure determines whether the decision is valid and who can challenge it.',
      })
    }

    if (ambiguities.includes('obligation_landscape')) {
      questions.push({
        domain: 'obligation',
        question: 'Are there contractual, regulatory, or statutory obligations that apply? For example: filing deadlines, service level agreements, director duties, or investor commitments?',
        rationale: 'Obligations define what must be performed regardless of preference or convenience.',
      })
    }

    if (ambiguities.includes('constraint_landscape')) {
      questions.push({
        domain: 'constraint',
        question: 'What makes the ideal path impossible? Common constraints: insufficient cash, time, authority, legal restrictions, or capability.',
        rationale: 'Without constraints the system may recommend an inaccessible path.',
      })
    }

    if (ambiguities.includes('timing_pressure')) {
      questions.push({
        domain: 'timing',
        question: 'Is there a specific deadline or time pressure? Is it statutory, contractual, or self-imposed?',
        rationale: 'Timing determines whether the response should be immediate, urgent, or considered.',
      })
    }

    if (hiddenStakes) {
      questions.push({
        domain: 'stakes',
        question: 'The situation appears to contain higher stakes than initially described. Is there a financial, legal, or reputational exposure that makes this more than a routine decision?',
        rationale: 'Misclassified stakes lead to inappropriate lens selection and inadequate output depth.',
      })
    }

    return questions.slice(0, 3)
  }

  // ─── Summary and interpretation ─────────────────────────────────────────────

  private generateSummary(raw: string, cls: DecisionClass, signals: string[]): string {
    const classLabels: Partial<Record<DecisionClass, string>> = {
      COMPLIANCE_AND_FILING: 'a statutory or regulatory filing situation',
      GOVERNANCE_AND_BOARD: 'a board-level governance decision',
      COMMERCIAL_AND_MARKET: 'a commercial or market positioning decision',
      OPERATIONAL_AND_EXECUTION: 'an operational or release decision',
      LEGAL_AND_CONTRACTUAL: 'a legal or contractual matter',
      FINANCIAL_AND_CAPITAL: 'a financial or capital commitment decision',
      REPUTATIONAL_AND_EXPOSURE: 'a reputational or exposure situation',
      STRATEGIC_AND_POSITIONING: 'a strategic positioning decision',
      PEOPLE_AND_AUTHORITY: 'a people or authority decision',
      TECHNOLOGY_AND_DEPENDENCY: 'a technology or dependency situation',
      CONTINUITY_AND_TRANSITION: 'a continuity or transition matter',
      LOW_STAKES_PREFERENCE: 'a low-stakes preference decision',
    }
    const classLabel = classLabels[cls] ?? 'a decision requiring structured analysis'
    // For low-stakes decisions, do not add constraint/deadline notes even if signals are present
    // (signals may be false positives from negated language like 'no deadline')
    if (cls === 'LOW_STAKES_PREFERENCE') {
      return `This is ${classLabel}.`
    }
    const constraintNote = signals.includes('constraint:cash') ? ' Financial constraint present.' : ''
    const deadlineNote = signals.includes('obligation:deadline') ? ' A deadline is referenced.' : ''
    return `This is ${classLabel}.${constraintNote}${deadlineNote}`
  }

  private generateInterpretation(lower: string, cls: DecisionClass, signals: string[]): string {
    const classDescriptions: Record<DecisionClass, string> = {
      COMPLIANCE_AND_FILING: 'a compliance or filing obligation with a defined deadline and consequence for missing it',
      GOVERNANCE_AND_BOARD: 'a governance or board-level decision requiring proper process, documentation, and fiduciary consideration',
      COMMERCIAL_AND_MARKET: 'a commercial or market decision where positioning, pricing, or partnership terms are at stake',
      OPERATIONAL_AND_EXECUTION: 'an operational or execution decision where delivery, capacity, or process reliability is the primary concern',
      STRATEGIC_AND_POSITIONING: 'a strategic or positioning decision where direction, structure, or competitive posture is being set',
      REPUTATIONAL_AND_EXPOSURE: 'a reputational or exposure decision where public perception, trust, or brand integrity is at risk',
      FINANCIAL_AND_CAPITAL: 'a financial or capital decision where cash, funding, or balance sheet capacity constrains the feasible set',
      LEGAL_AND_CONTRACTUAL: 'a legal or contractual decision where rights, obligations, or liabilities are being determined or disputed',
      PEOPLE_AND_AUTHORITY: 'a people or authority decision where mandate, leadership, or organisational structure is the primary variable',
      TECHNOLOGY_AND_DEPENDENCY: 'a technology or dependency decision where system reliability, migration, or technical debt is the binding constraint',
      CONTINUITY_AND_TRANSITION: 'a continuity or transition decision where succession, handover, or business continuity is the primary concern',
      LOW_STAKES_PREFERENCE: 'a low-stakes preference decision where the primary variable is personal or organisational preference',
    }

    const base = `The system interprets this situation as ${classDescriptions[cls]}.`

    // Add constraint-specific interpretation
    const hasCashConstraint = signals.includes('constraint:cash')
    const hasStatutory = signals.includes('obligation:statutory')
    const hasDeadline = signals.includes('obligation:deadline')

    if (cls === 'COMPLIANCE_AND_FILING' && hasCashConstraint && hasDeadline) {
      return `${base} The primary institutional question is not whether to comply — the obligation is legal. The question is what is the minimum viable rescue path given the resource constraint.`
    }
    if (cls === 'COMPLIANCE_AND_FILING' && hasStatutory) {
      return `${base} The obligation is externally imposed and non-negotiable. The governing questions are: what exactly is required, by when, and what is the evidence and records state.`
    }
    if (signals.includes('authority:unclear')) {
      return `${base} The primary failure risk is not in the decision itself but in the mandate. Proceeding without confirmed authority creates reversal risk.`
    }
    if (hasCashConstraint && hasDeadline) {
      return `${base} Resource constraint meets external deadline. The system maps the minimum viable path rather than the ideal path.`
    }

    // For low-stakes decisions, do not add dimension text (avoids overengineering)
    if (cls === 'LOW_STAKES_PREFERENCE') {
      return `${base} No binding constraints, obligations, or consequences are at stake.`
    }
    const dimensionText = signals.length > 0 ? ` Dimensions surfaced: ${[...new Set(signals.map(s => s.split(':')[0]))].join(', ')}.` : ''
    return `${base}${dimensionText}`
  }

  // ─── Confidence ─────────────────────────────────────────────────────────────

  /**
   * Confidence is based on class score gap and ambiguity count,
   * NOT on vocabulary state. State 4 means "incomplete structure" — not high confidence.
   */
  private calculateConfidence(
    scores: ClassScore[],
    ambiguities: string[],
    vocabularyState: number,
  ): ConfidenceLevel {
    const classConf = this.classConfidenceFromScores(scores)

    // Too many ambiguities → downgrade
    if (ambiguities.length >= 4) return 'LOW'
    if (ambiguities.length >= 2 && classConf !== 'HIGH') return 'LOW'

    // Very low vocabulary state → low confidence regardless
    if (vocabularyState === 1) return 'LOW'

    return classConf
  }
}
