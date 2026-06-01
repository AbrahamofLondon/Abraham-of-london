/**
 * lib/kernel/public-situation-translation.ts — Public Adapter
 *
 * Converts internal SituationTranslator output into safe, user-facing display data.
 *
 * Translation law (enforced):
 * - Never expose raw scores, thresholds, or internal class names.
 * - Rewrite classification into plain language.
 * - Use actor extraction in the output.
 * - Convert detected signals into readable labels.
 * - Surface hidden stakes without sounding accusatory.
 * - Surface ambiguity as preserved uncertainty, not failure.
 * - Create paid-preview bullets for deeper analysis.
 */

import type { TranslationResult } from '@/lib/intelligence/types'

// ─── Public-facing types ─────────────────────────────────────────────────────

export type PublicSignalItem = {
  label: string
  value: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export type PublicSituationTranslation = {
  /** Plain-language summary using the user's domain */
  situationSummary: string
  /** Actors mentioned, if any */
  actors: string[]
  /** Readable signal items */
  detectedSignals: PublicSignalItem[]
  /** Hidden stakes warnings, if any */
  hiddenStakes: string[]
  /** Ambiguities the system preserved */
  ambiguities: string[]
  /** Underestimated risk warning, if applicable */
  underestimatedRisk: string | null
  /** What deeper analysis would map (paid preview) */
  deeperAnalysisWouldMap: string[]
}

// ─── Class labels (public-safe) ──────────────────────────────────────────────

const PUBLIC_CLASS_LABELS: Record<string, string> = {
  COMPLIANCE_AND_FILING: 'a statutory or regulatory filing obligation',
  GOVERNANCE_AND_BOARD: 'a board-level governance decision',
  COMMERCIAL_AND_MARKET: 'a commercial or market positioning decision',
  OPERATIONAL_AND_EXECUTION: 'an operational or release decision',
  STRATEGIC_AND_POSITIONING: 'a strategic positioning decision',
  REPUTATIONAL_AND_EXPOSURE: 'a reputational or exposure situation',
  FINANCIAL_AND_CAPITAL: 'a financial or capital commitment decision',
  LEGAL_AND_CONTRACTUAL: 'a legal or contractual matter',
  PEOPLE_AND_AUTHORITY: 'a people or authority decision',
  TECHNOLOGY_AND_DEPENDENCY: 'a technology or dependency situation',
  CONTINUITY_AND_TRANSITION: 'a continuity or transition matter',
  LOW_STAKES_PREFERENCE: 'a low-stakes preference decision',
}

// ─── Signal-to-label mapping (public-safe) ───────────────────────────────────

const SIGNAL_LABELS: Record<string, { label: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = {
  'constraint:cash': { label: 'Cash constraint', severity: 'HIGH' },
  'constraint:capability': { label: 'Capability gap', severity: 'MEDIUM' },
  'constraint:records_incomplete': { label: 'Incomplete records', severity: 'MEDIUM' },
  'obligation:deadline': { label: 'Deadline pressure', severity: 'HIGH' },
  'obligation:statutory': { label: 'Legal or statutory obligation', severity: 'CRITICAL' },
  'consequence:penalty': { label: 'Penalty exposure', severity: 'CRITICAL' },
  'authority:unclear': { label: 'Unclear authority', severity: 'HIGH' },
  'authority:board_required': { label: 'Board authority required', severity: 'HIGH' },
  'evidence:present': { label: 'Evidence available', severity: 'LOW' },
  'evidence:assumed': { label: 'Evidence assumed, not verified', severity: 'MEDIUM' },
  'dependency:unresolved': { label: 'Unresolved dependency', severity: 'MEDIUM' },
  'reversibility:irreversible': { label: 'Irreversible decision', severity: 'CRITICAL' },
}

// ─── Deeper analysis preview items (per class) ───────────────────────────────

const DEEPER_ANALYSIS_MAP: Record<string, string[]> = {
  COMPLIANCE_AND_FILING: [
    'The minimum viable compliance path given your constraints',
    'What evidence is missing before the deadline',
    'Whether professional support is unavoidable',
    'The consequence of further delay',
  ],
  GOVERNANCE_AND_BOARD: [
    'Whether the stated purpose and operating reality are aligned',
    'Which actor has authority to unblock the decision',
    'What evidence is missing before escalation',
    'Whether this is ready for executive reporting',
  ],
  COMMERCIAL_AND_MARKET: [
    'Whether the market claim is supported by evidence',
    'The buyer proof gap and how to close it',
    'Competitive positioning risk',
    'The minimum viable go-to-market path',
  ],
  OPERATIONAL_AND_EXECUTION: [
    'The binding constraint on delivery',
    'Who can authorise the decision to proceed',
    'What happens if the timeline slips',
    'The minimum viable execution path',
  ],
  STRATEGIC_AND_POSITIONING: [
    'Whether the strategic direction is supported by evidence',
    'The authority structure for the decision',
    'What would need to change for the strategy to shift',
    'The consequence of maintaining the current course',
  ],
  REPUTATIONAL_AND_EXPOSURE: [
    'The full exposure map beyond the initial description',
    'Who needs to be involved before the situation escalates',
    'What a public response would require',
    'The minimum viable containment path',
  ],
  FINANCIAL_AND_CAPITAL: [
    'The full financial picture beyond the immediate constraint',
    'Whether the available options are viable',
    'What evidence is needed before committing capital',
    'The consequence of delay or inaction',
  ],
  LEGAL_AND_CONTRACTUAL: [
    'The rights, obligations, and liabilities at stake',
    'Whether professional legal support is unavoidable',
    'The timeline pressure and consequence of missing it',
    'The minimum viable resolution path',
  ],
  PEOPLE_AND_AUTHORITY: [
    'Whether the authority structure is clear enough to proceed',
    'Who can unblock the decision',
    'What evidence is needed before restructuring',
    'The consequence of unresolved authority ambiguity',
  ],
  TECHNOLOGY_AND_DEPENDENCY: [
    'The dependency map and critical path',
    'Whether alternative suppliers or paths exist',
    'The switching cost and timeline',
    'The consequence of the dependency failing',
  ],
  CONTINUITY_AND_TRANSITION: [
    'What happens if no transition plan exists',
    'Who holds the institutional knowledge',
    'The critical path for handover',
    'What must be documented before the transition',
  ],
  LOW_STAKES_PREFERENCE: [],
}

// ─── Adapter function ────────────────────────────────────────────────────────

export function buildPublicSituationTranslation(
  translation: TranslationResult,
): PublicSituationTranslation {
  const { decisionClass, alternativeClasses, initialActors, detectedSignals, preservedAmbiguities, hiddenStakesDetected, situationSummary } = translation

  // ── 1. Situation summary ─────────────────────────────────────────────────
  const classLabel = PUBLIC_CLASS_LABELS[decisionClass] ?? 'a decision requiring structured analysis'
  const hasAlternativeClasses = alternativeClasses.length > 0

  let summary: string
  if (decisionClass === 'LOW_STAKES_PREFERENCE') {
    summary = `This appears to be ${classLabel}.`
  } else {
    summary = `This appears to be ${classLabel}.`
    if (hasAlternativeClasses) {
      const altLabels = alternativeClasses
        .slice(0, 2)
        .map(a => PUBLIC_CLASS_LABELS[a.decisionClass])
        .filter(Boolean)
      if (altLabels.length > 0) {
        summary += ` It may also involve ${altLabels.join(' or ')}.`
      }
    }
  }

  // ── 2. Actors ────────────────────────────────────────────────────────────
  const actors = initialActors
    .filter(a => a.confidence !== 'LOW')
    .map(a => a.name)

  // ── 3. Detected signals ──────────────────────────────────────────────────
  const signals: PublicSignalItem[] = []
  for (const s of detectedSignals) {
    const mapped = SIGNAL_LABELS[s]
    if (mapped) {
      signals.push({ label: mapped.label, value: s, severity: mapped.severity })
    }
  }
  // Deduplicate by label
  const seenLabels = new Set<string>()
  const uniqueSignals = signals.filter(s => {
    if (seenLabels.has(s.label)) return false
    seenLabels.add(s.label)
    return true
  })

  // ── 4. Hidden stakes ─────────────────────────────────────────────────────
  const hiddenStakes: string[] = []
  if (hiddenStakesDetected) {
    hiddenStakes.push('The situation may be more consequential than your wording suggests.')
  }

  // ── 5. Ambiguities ───────────────────────────────────────────────────────
  const ambiguityLabels: Record<string, string> = {
    decision_class_uncertain: 'The system has not collapsed this into a single category — it may involve more than one decision type.',
    authority_structure: 'Who holds the authority to decide has not been confirmed.',
    obligation_landscape: 'The obligations that apply are not yet fully clear.',
    constraint_landscape: 'The constraints on the decision are not yet fully mapped.',
    timing_pressure: 'The timing or deadline pressure is not yet clear.',
  }
  const ambiguities: string[] = preservedAmbiguities
    .map(a => ambiguityLabels[a])
    .filter((s): s is string => Boolean(s))

  // ── 6. Underestimated risk ───────────────────────────────────────────────
  let underestimatedRisk: string | null = null
  if (hiddenStakesDetected) {
    underestimatedRisk = 'The system detected a mismatch between how this was described and the apparent stakes involved.'
  }

  // ── 7. Deeper analysis preview ───────────────────────────────────────────
  const deeperAnalysisWouldMap = DEEPER_ANALYSIS_MAP[decisionClass] ?? [
    'The authority structure and who can unblock the decision',
    'What evidence is missing before escalation',
    'The consequence of delay or inaction',
    'Whether this is ready for deeper governed analysis',
  ]

  return {
    situationSummary: summary,
    actors,
    detectedSignals: uniqueSignals,
    hiddenStakes,
    ambiguities,
    underestimatedRisk,
    deeperAnalysisWouldMap,
  }
}

/**
 * Build a specific refusal message based on the refusal category and user input.
 * Makes the refusal more helpful by reflecting what the system detected.
 */
export function buildRefusalMessage(
  category: string,
  input: string,
): { reason: string; nextAdmissibleInput: string } {
  const lower = input.toLowerCase()
  const wordCount = lower.split(/\s+/).length

  const hasOwner = /\b(I|we|the\s+(board|ceo|founder|team|director|lead|head|manager|owner|committee|executive))\b/i.test(lower)
  const hasConsequence = /\b(cost|risk|exposure|deadline|penalty|loss|damage|fail|consequence|delay|urgent|pressure|liability)\b/i.test(lower)

  switch (category) {
    case 'VAGUE_DECISION':
      return {
        reason: `The system can see a decision is being described, but it cannot identify the specific decision, the owner, or the consequence. It cannot responsibly produce a pressure reading yet.`,
        nextAdmissibleInput: `Rewrite this as:\n"We need to decide whether [action] by [date], because [consequence], and [person/team] owns the decision."`,
      }
    case 'MISSING_OWNER':
      return {
        reason: `The system can detect a decision and a consequence, but no accountable owner has been identified. Without an owner, the system cannot assess authority alignment or execution readiness.`,
        nextAdmissibleInput: `Add who owns this decision — for example: "The CEO needs to decide whether to acquire the competitor by end of quarter."`,
      }
    case 'MISSING_CONSEQUENCE':
      return {
        reason: `The system can see a decision and an owner, but no consequence of delay or inaction. Without understanding what is at stake, the system cannot assess pressure or priority.`,
        nextAdmissibleInput: `Describe what happens if this decision is delayed by 30 days — for example: "If we delay, we risk losing the deal to a competitor."`,
      }
    default:
      return {
        reason: `The system cannot responsibly produce a pressure reading from this input. The decision, evidence, authority, or consequence is too vague.`,
        nextAdmissibleInput: `Rewrite this as:\n"We need to decide whether [action] by [date], because [consequence], and [person/team] owns the decision."`,
      }
  }
}

/**
 * Build a "What the system noticed" block from the existing Decision Pressure
 * signal output (which uses the simpler computeSignal function, not the full
 * SituationTranslator). This adapts the existing output to the new surface.
 */
export function buildPressureSignalTranslation(
  input: string,
  pressureBand: string,
  frictionLabel: string,
  consequence: string,
  minimumViableMove: string,
  adversarialChallenge: string,
): PublicSituationTranslation {
  const lower = input.toLowerCase()

  // Extract actors from input
  const actorPatterns = [
    /\b(ceo)\b/i, /\b(cfo)\b/i, /\b(coo)\b/i, /\b(cto)\b/i,
    /\b(board|directors?|chairman)\b/i, /\b(founder|owner|principal)\b/i,
    /\b(shareholder|investor)\b/i, /\b(team|lead|manager|head)\b/i,
    /\b(hmrc|regulator|court|legal|solicitor|lawyer)\b/i,
    /\b(client|customer|partner|supplier)\b/i,
  ]
  const foundActors = new Set<string>()
  for (const pattern of actorPatterns) {
    const match = lower.match(pattern)
    if (match && match[1]) {
      foundActors.add(match[1].toLowerCase())
    }
  }
  const actors = [...foundActors]

  // Detect signals from the input
  const signals: PublicSignalItem[] = []

  if (/\b(urgent|immediate|today|tomorrow|deadline|critical|emergency|ASAP|overdue)\b/i.test(lower)) {
    signals.push({ label: 'Deadline pressure', value: 'obligation:deadline', severity: 'HIGH' })
  }
  if (/\b(board|investor|regulator|client|revenue|legal|compliance|reputation|existential)\b/i.test(lower)) {
    signals.push({ label: 'High-stakes exposure', value: 'consequence:high_stakes', severity: 'CRITICAL' })
  }
  if (/\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess)\b/i.test(lower)) {
    signals.push({ label: 'Evidence gap', value: 'evidence:assumed', severity: 'MEDIUM' })
  }
  if (/\b(who|approval|permission|sign.?off|authority|mandate|escalat)\b/i.test(lower)) {
    signals.push({ label: 'Unclear authority', value: 'authority:unclear', severity: 'HIGH' })
  }
  if (/\b(stuck|blocked|avoiding|delaying|circling|stalled|frozen|can't decide|unresolved)\b/i.test(lower)) {
    signals.push({ label: 'Execution stuck', value: 'constraint:execution_stuck', severity: 'MEDIUM' })
  }
  if (/\b(but|however|conflict|disagree|oppose|resist|politics|agenda)\b/i.test(lower)) {
    signals.push({ label: 'Stakeholder disagreement', value: 'incentive:conflict', severity: 'MEDIUM' })
  }
  if (/\b(time|deadline|urgent|soon|quick|fast|immediate|overdue|late)\b/i.test(lower)) {
    signals.push({ label: 'Timing pressure', value: 'timing:pressure', severity: 'MEDIUM' })
  }

  // Detect hidden stakes: trivial language + high-stakes content
  const trivialLanguage = /\b(minor|simple|quick|small|easy|just a|only a|not a big deal)\b/i.test(lower)
  const highStakesContent = /\b(board|million|legal|regulatory|compliance|penalty|revenue|existential)\b/i.test(lower)
  const hiddenStakes: string[] = []
  if (trivialLanguage && highStakesContent) {
    hiddenStakes.push('The situation may be more consequential than your wording suggests.')
  }

  // Detect underestimation
  let underestimatedRisk: string | null = null
  if (pressureBand === 'CRITICAL' || pressureBand === 'ESCALATING') {
    if (trivialLanguage) {
      underestimatedRisk = 'The system detected a mismatch between how this was described and the apparent pressure level.'
    }
  }

  // Build summary
  const bandMap: Record<string, string> = {
    LOW: 'a low-pressure decision',
    LIVE: 'a live decision under moderate pressure',
    ESCALATING: 'an escalating decision approaching a threshold',
    CRITICAL: 'a critical decision under severe pressure',
  }
  const bandLabel = bandMap[pressureBand] ?? 'a decision under pressure'
  const summary = `This appears to be ${bandLabel}. The primary friction detected is ${frictionLabel.toLowerCase()}.`

  // Deeper analysis preview
  const deeperAnalysisWouldMap = [
    'Whether the stated purpose and operating reality are aligned',
    'Which actor has authority to unblock the decision',
    'What evidence is missing before escalation',
    'Whether this is ready for deeper governed analysis',
  ]

  // Ambiguities
  const ambiguities: string[] = []
  if (frictionLabel === 'Authority gap' || frictionLabel === 'Mandate ambiguity') {
    ambiguities.push('Who holds the authority to decide has not been confirmed.')
  }
  if (frictionLabel === 'Evidence gap') {
    ambiguities.push('The evidence base for this decision is not yet clear.')
  }
  if (frictionLabel === 'Timing pressure') {
    ambiguities.push('The timing or deadline pressure is present but the specific date is not clear.')
  }

  return {
    situationSummary: summary,
    actors,
    detectedSignals: signals,
    hiddenStakes,
    ambiguities,
    underestimatedRisk,
    deeperAnalysisWouldMap,
  }
}
