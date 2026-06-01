/**
 * lib/product/user-language-interpretation.ts
 *
 * Connects quoted user language to derived decision intelligence.
 * Every interpretation must connect the quote to a decision issue:
 * authority, evidence, consequence, execution, timing, obligation,
 * contradiction, or stakeholder risk.
 *
 * Rules:
 * - Do not fabricate facts.
 * - Do not merely paraphrase the quote.
 * - If the system cannot interpret a quote, show the quote only
 *   paired with "No reliable interpretation yet."
 * - Prefer fewer, stronger interpretations over many weak ones.
 * - Limit to 3.
 * - Do not expose internal scores or taxonomy keys.
 * - Require diagnostic context to confirm strong interpretations.
 * - Informational stakeholder mentions must not become authority gaps.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type InterpretationConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export type UserLanguageInterpretation = {
  quote: string
  interpretation: string
  confidence: InterpretationConfidence
  exposedContradiction?: string
  riskImplication?: string
  nextAdmissibleMove?: string
}

export type BuildInterpretationsParams = {
  quotes: string[]
  situationClass?: string | null
  primaryFailurePoint?: string | null
  governingTension?: string | null
  consequenceClass?: string | null
  directionOfMinimumViableMove?: string | null
  detectedSignals?: Array<{ label: string; value?: string; severity?: string }>
}

// ─── Signal Detection Helpers ────────────────────────────────────────────────
//
// These detect surface-level signals in the quote text.
// They are necessary but not sufficient for strong interpretation.
// Diagnostic context (primaryFailurePoint, governingTension, etc.)
// must also support the interpretation for HIGH/MEDIUM confidence.

/** Authority-seeking language — someone needs to approve or decide */
function hasAuthoritySeekingSignal(quote: string): boolean {
  return /\b(approve|approval|approved|approving|authoris|authoriz|permission|sign.?off|authority|mandate|who can|who will|needs? to decide|waiting on .* (decision|approval|signoff))\b/i.test(quote)
}

/** Mentions of decision-makers — informational, not necessarily an authority gap */
function hasStakeholderMention(quote: string): boolean {
  return /\b(board|ceo|founder|director|manager|lead|owner|committee|executive|senior)\b/i.test(quote)
}

/** Evidence gap language — uncertainty about facts or data */
function hasEvidenceGapSignal(quote: string): boolean {
  return /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess|waiting on|still reviewing|not yet (known|confirmed|verified)|haven't (seen|confirmed|verified))\b/i.test(quote)
}

/** Consequence language — cost, risk, penalty, loss */
function hasConsequenceSignal(quote: string): boolean {
  return /\b(cost|risk|exposure|penalty|loss|damage|liability|expensive|at stake|on the line)\b/i.test(quote)
}

/** Timing/deadline language — specific time pressure */
function hasTimingSignal(quote: string): boolean {
  return /\b(deadline|urgent|immediate|overdue|asap|by (end of|next|this|monday|tuesday|wednesday|thursday|friday))\b/i.test(quote)
}

/** Execution block language — stuck, blocked, stalled */
function hasExecutionSignal(quote: string): boolean {
  return /\b(stuck|blocked|avoiding|delaying|stalled|frozen|can't decide|unresolved)\b/i.test(quote)
}

/** Obligation/commitment language — must, need, required */
function hasObligationSignal(quote: string): boolean {
  return /\b(must|have to|required|obligation|commitment|promise|contractual|fiduciary)\b/i.test(quote)
}

/** Contradiction language — but, however, although */
function hasContradictionSignal(quote: string): boolean {
  return /\b(but|however|although|yet|despite|while|conflict|contradict|oppose|resist|split|disagree)\b/i.test(quote)
}

// ─── Diagnostic Context Helpers ──────────────────────────────────────────────

function contextMentionsAuthority(
  primaryFailurePoint?: string | null,
  governingTension?: string | null,
): boolean {
  return !!(
    primaryFailurePoint?.toLowerCase().includes('authority') ||
    primaryFailurePoint?.toLowerCase().includes('approval') ||
    primaryFailurePoint?.toLowerCase().includes('mandate') ||
    governingTension?.toLowerCase().includes('authority') ||
    governingTension?.toLowerCase().includes('approval') ||
    governingTension?.toLowerCase().includes('mandate')
  )
}

function contextMentionsEvidence(
  primaryFailurePoint?: string | null,
  governingTension?: string | null,
): boolean {
  return !!(
    primaryFailurePoint?.toLowerCase().includes('evidence') ||
    primaryFailurePoint?.toLowerCase().includes('information') ||
    primaryFailurePoint?.toLowerCase().includes('data') ||
    governingTension?.toLowerCase().includes('evidence') ||
    governingTension?.toLowerCase().includes('information') ||
    governingTension?.toLowerCase().includes('data')
  )
}

function contextMentionsConsequence(
  primaryFailurePoint?: string | null,
  governingTension?: string | null,
  consequenceClass?: string | null,
): boolean {
  return !!(
    consequenceClass ||
    primaryFailurePoint?.toLowerCase().includes('consequence') ||
    primaryFailurePoint?.toLowerCase().includes('cost') ||
    primaryFailurePoint?.toLowerCase().includes('risk') ||
    governingTension?.toLowerCase().includes('consequence') ||
    governingTension?.toLowerCase().includes('cost') ||
    governingTension?.toLowerCase().includes('risk')
  )
}

// ─── Interpretation Builder ──────────────────────────────────────────────────

/**
 * Build interpretations for each quote by connecting it to the system's
 * diagnostic fields (situationClass, primaryFailurePoint, governingTension,
 * consequenceClass, directionOfMinimumViableMove).
 *
 * Confidence levels:
 * - HIGH: strong quote signal + diagnostic context confirms
 * - MEDIUM: clear quote signal but limited diagnostic context
 * - LOW: weak or ambiguous signal, or informational mention only
 */
export function buildUserLanguageInterpretations(
  params: BuildInterpretationsParams,
): UserLanguageInterpretation[] {
  const {
    quotes,
    situationClass,
    primaryFailurePoint,
    governingTension,
    consequenceClass,
    directionOfMinimumViableMove,
    detectedSignals = [],
  } = params

  const safeQuotes = quotes
    .filter(q => Boolean(q) && q.trim().length > 0)
    .slice(0, 3)

  const results: UserLanguageInterpretation[] = []

  for (const quote of safeQuotes) {
    const interpretation = buildSingleInterpretation(quote, {
      situationClass,
      primaryFailurePoint,
      governingTension,
      consequenceClass,
      directionOfMinimumViableMove,
      detectedSignals,
    })
    results.push(interpretation)
  }

  return results
}

function buildSingleInterpretation(
  quote: string,
  ctx: {
    situationClass?: string | null
    primaryFailurePoint?: string | null
    governingTension?: string | null
    consequenceClass?: string | null
    directionOfMinimumViableMove?: string | null
    detectedSignals: Array<{ label: string; value?: string; severity?: string }>
  },
): UserLanguageInterpretation {
  const {
    situationClass,
    primaryFailurePoint,
    governingTension,
    consequenceClass,
    directionOfMinimumViableMove,
    detectedSignals,
  } = ctx

  // ── Detect signal categories from the quote ──────────────────────────
  const hasAuthoritySeeking = hasAuthoritySeekingSignal(quote)
  const hasStakeholder = hasStakeholderMention(quote)
  const hasEvidenceGap = hasEvidenceGapSignal(quote)
  const hasConsequence = hasConsequenceSignal(quote)
  const hasTiming = hasTimingSignal(quote)
  const hasExecution = hasExecutionSignal(quote)
  const hasObligation = hasObligationSignal(quote)
  const hasContradiction = hasContradictionSignal(quote)

  // ── Check diagnostic context ─────────────────────────────────────────
  const authorityContext = contextMentionsAuthority(primaryFailurePoint, governingTension)
  const evidenceContext = contextMentionsEvidence(primaryFailurePoint, governingTension)
  const consequenceContext = contextMentionsConsequence(primaryFailurePoint, governingTension, consequenceClass)

  // ── Build interpretation based on strongest signal + context ──────────
  let interpretation: string
  let confidence: InterpretationConfidence
  let exposedContradiction: string | undefined
  let riskImplication: string | undefined
  let nextAdmissibleMove: string | undefined

  // HIGH confidence: Authority seeking + diagnostic context confirms
  if (hasAuthoritySeeking && authorityContext) {
    confidence = 'HIGH'
    interpretation = 'This points to an authority gap, not merely an execution delay. The decision appears to be proceeding without confirmed mandate.'
    exposedContradiction = 'Action is being taken as if authority exists, but the approving actor has not been confirmed.'
    riskImplication = 'Without clear authority, the decision may be reversed or challenged after resources have been committed.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Identify who can authorise the decision and confirm whether launch can proceed without that approval.'
  }
  // MEDIUM confidence: Authority seeking without diagnostic context
  else if (hasAuthoritySeeking) {
    confidence = 'MEDIUM'
    interpretation = 'The language suggests an authority question may be present, but the system cannot confirm this from the available diagnostic data alone.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  // Informational stakeholder mention — NOT an authority gap
  else if (hasStakeholder && !hasAuthoritySeeking && !hasContradiction) {
    confidence = 'LOW'
    interpretation = 'A stakeholder is mentioned, but the system cannot determine from this statement alone whether there is an unresolved decision issue.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  // HIGH confidence: Evidence gap + diagnostic context confirms
  else if (hasEvidenceGap && evidenceContext) {
    confidence = 'HIGH'
    interpretation = 'This signals an evidence gap — the decision is being considered without confirmed supporting information.'
    exposedContradiction = 'Action is being weighed as if the evidence is sufficient, but key information remains unverified.'
    riskImplication = 'Decisions made on assumed evidence are vulnerable to challenge when the actual data arrives.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Identify the specific evidence that would change the decision and confirm it before committing.'
  }
  // MEDIUM confidence: Evidence gap without diagnostic context
  else if (hasEvidenceGap) {
    confidence = 'MEDIUM'
    interpretation = 'The language suggests uncertainty about facts or data, but the system cannot confirm this is a structural evidence gap from the available diagnostic data alone.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  // HIGH confidence: Consequence + diagnostic context confirms
  else if (hasConsequence && consequenceContext) {
    confidence = 'HIGH'
    interpretation = 'This reveals consequence awareness — the user recognises that inaction or delay carries measurable cost.'
    exposedContradiction = 'The consequence is named but has not been quantified or assigned a deadline.'
    riskImplication = consequenceClass
      ? `The system classified the consequence as ${consequenceClass.toLowerCase().replace(/_/g, ' ')}. Without action, the cost compounds.`
      : 'Unquantified consequences tend to be underestimated until they become unavoidable.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Quantify the consequence in specific terms — cost, deadline, or stakeholder impact — then assign ownership.'
  }
  // MEDIUM confidence: Consequence language without diagnostic context
  else if (hasConsequence) {
    confidence = 'MEDIUM'
    interpretation = 'The language mentions cost or risk, but the system cannot confirm the consequence structure from the available diagnostic data alone.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  // Obligation / commitment conflict
  else if (hasObligation) {
    confidence = 'MEDIUM'
    interpretation = 'This reveals an obligation or commitment that may be competing with the stated decision.'
    exposedContradiction = 'The obligation may be the hidden reason the decision is not converting into action.'
    riskImplication = 'Unresolved obligation conflicts produce pattern recurrence — the same decision returns because the underlying commitment was never renegotiated.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  // Timing / deadline pressure — requires specific deadline language
  else if (hasTiming) {
    confidence = 'MEDIUM'
    interpretation = 'This signals timing pressure — a deadline or time constraint appears to be driving the decision.'
    exposedContradiction = 'The urgency to decide may be masking an unresolved authority or evidence gap.'
    riskImplication = 'Decisions made under time pressure without resolving underlying gaps tend to produce outcomes that cost more later.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }
  else if (hasExecution) {
    confidence = 'MEDIUM'
    interpretation = 'This signals an execution block — the decision appears to be stalled despite apparent readiness.'
    exposedContradiction = 'The team believes they are ready, but something is preventing action. Readiness without execution is not readiness.'
    riskImplication = 'Prolonged execution blocks erode momentum and normalise delay as an acceptable state.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Identify the specific blocker — authority, evidence, or resource — and assign one accountable owner to resolve it.'
  }
  // Obligation / commitment conflict
  else if (hasObligation) {
    confidence = 'MEDIUM'
    interpretation = 'This reveals an obligation or commitment that may be competing with the stated decision.'
    exposedContradiction = 'The obligation may be the hidden reason the decision is not converting into action.'
    riskImplication = 'Unresolved obligation conflicts produce pattern recurrence — the same decision returns because the underlying commitment was never renegotiated.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Name the competing obligation explicitly and assess whether it can be renegotiated, removed, or directly confronted.'
  }
  // Stakeholder + contradiction
  else if (hasStakeholder && hasContradiction) {
    confidence = 'MEDIUM'
    interpretation = 'This signals possible stakeholder disagreement — the decision may be affected by conflicting interests or perspectives.'
    exposedContradiction = 'Different stakeholders appear to be operating from different assumptions about the decision.'
    riskImplication = 'Stakeholder conflicts that are not surfaced tend to resurface at the worst possible moment — during execution.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Surface the conflicting assumptions openly before attempting to resolve the decision.'
  }
  // General contradiction
  else if (hasContradiction) {
    confidence = 'MEDIUM'
    interpretation = 'This reveals an internal contradiction — the situation contains opposing forces that have not been resolved.'
    exposedContradiction = governingTension ?? 'The contradiction is between what is wanted and what is possible under current conditions.'
    riskImplication = 'Unresolved contradictions produce pattern recurrence. The same decision will return until the underlying tension is addressed.'
    nextAdmissibleMove = directionOfMinimumViableMove ?? 'Name both sides of the contradiction explicitly. The next move must address one side directly.'
  }
  // Fallback — restrained, no fabricated intelligence
  else {
    confidence = 'LOW'
    interpretation = 'This statement has been captured but the system cannot yet connect it to a specific decision issue with confidence.'
    if (situationClass) {
      interpretation += ` The overall situation was classified as ${situationClass.toLowerCase().replace(/_/g, ' ')}.`
    }
    nextAdmissibleMove = directionOfMinimumViableMove ?? undefined
  }

  return {
    quote,
    interpretation,
    confidence,
    ...(exposedContradiction ? { exposedContradiction } : {}),
    ...(riskImplication ? { riskImplication } : {}),
    ...(nextAdmissibleMove ? { nextAdmissibleMove } : {}),
  }
}