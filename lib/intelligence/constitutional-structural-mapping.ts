/**
 * lib/intelligence/constitutional-structural-mapping.ts
 *
 * Maps constitutional diagnostic answers, report, decision, and routeSummary
 * into explicit structural fields used by the orchestrator, constitutional
 * adapter, LivingLayerViewModel, and route/admissibility synthesis.
 *
 * Rules:
 *   - Never fabricate structural facts from vague scores.
 *   - Never claim authority is established unless approvingAuthority or
 *     mandateSource supports it.
 *   - Never claim route admissibility unless the constitutional output
 *     supports it.
 *   - Never expose raw answer text where unsafe.
 *   - Use unresolved language when fields are missing.
 *   - Prefer mapping existing answers first.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConstitutionalStructuralInput = {
  /** Who owns this decision */
  decisionOwner?: string
  /** Who can approve this decision */
  approvingAuthority?: string
  /** Who can block this decision */
  blockingAuthority?: string
  /** Where the mandate for this decision comes from */
  mandateSource?: string
  /** Current decision-making approach */
  currentRoute?: string
  /** Constraint that cannot be violated */
  nonNegotiableConstraint?: string
  /** Most likely way this decision fails */
  failureMode?: string
  /** What would need to change for success */
  repairCondition?: string
}

// ---------------------------------------------------------------------------
// Answer ID patterns
// ---------------------------------------------------------------------------

/**
 * Known answer IDs from the constitutional diagnostic instrument.
 * Maps question IDs to structural field keys.
 */
const ANSWER_ID_MAP: Record<string, keyof ConstitutionalStructuralInput> = {
  'authority_clarity': 'decisionOwner',
  'authority_owner': 'decisionOwner',
  'authority_approval': 'approvingAuthority',
  'authority_blocker': 'blockingAuthority',
  'authority_mandate': 'mandateSource',
  'authority_route': 'currentRoute',
  'constraint_boundary': 'nonNegotiableConstraint',
  'failure_mode': 'failureMode',
  'repair_condition': 'repairCondition',
}

/**
 * Known text patterns in question prompts that map to structural fields.
 */
const PROMPT_PATTERNS: Array<{
  pattern: RegExp
  field: keyof ConstitutionalStructuralInput
}> = [
  { pattern: /who\s+(owns|is responsible|has authority)/i, field: 'decisionOwner' },
  { pattern: /who\s+can\s+(approve|authorise|sign)/i, field: 'approvingAuthority' },
  { pattern: /who\s+can\s+(block|veto|stop)/i, field: 'blockingAuthority' },
  { pattern: /where\s+(does|is).*mandate/i, field: 'mandateSource' },
  { pattern: /current\s+(route|approach|process)/i, field: 'currentRoute' },
  { pattern: /constraint.*(cannot|must not|violat)/i, field: 'nonNegotiableConstraint' },
  { pattern: /(failure|fail).*(mode|way|likely)/i, field: 'failureMode' },
  { pattern: /(repair|change|need|would need).*(succeed|change|fix)/i, field: 'repairCondition' },
]

// ---------------------------------------------------------------------------
// Mapping function
// ---------------------------------------------------------------------------

/**
 * Map constitutional answers, report, decision, and routeSummary into
 * explicit structural fields.
 *
 * Priority (strict order):
 *   0. structuralFacts from request body (highest — explicit user input)
 *   1. Explicit answer IDs (known question IDs mapped to structural fields)
 *   2. Prompt text patterns (regex match on question text)
 *   3. Report/decision/routeSummary fields
 *   4. Weak score support only — never structural fabrication
 *
 * Rules:
 *   - Never fabricate structural facts from vague scores.
 *   - Never claim authority is established unless approvingAuthority or
 *     mandateSource supports it.
 *   - Never treat decisionOwner as approvingAuthority.
 *   - Never expose raw unsafe answer text.
 *   - Use unresolved language when fields are missing.
 *
 * @param params.userAnswers - The raw answers from the constitutional form
 * @param params.report - The constitutional report object
 * @param params.decision - The constitutional decision object
 * @param params.routeSummary - The constitutional route summary
 * @param params.structuralFacts - Explicit structural facts from the form (Priority 0)
 * @returns ConstitutionalStructuralInput with available fields populated
 */
export function mapConstitutionalAnswersToStructuralInput(params: {
  userAnswers?: Record<string, unknown>
  report?: Record<string, unknown>
  decision?: Record<string, unknown>
  routeSummary?: Record<string, unknown>
  /** Explicit structural facts from the form — highest priority (Priority 0) */
  structuralFacts?: Partial<ConstitutionalStructuralInput>
}): ConstitutionalStructuralInput {
  const result: ConstitutionalStructuralInput = {}

  const userAnswers = params.userAnswers ?? {}
  const report = params.report ?? {}
  const decision = params.decision ?? {}
  const routeSummary = params.routeSummary ?? {}

  // ── Priority 0: Extract from explicit structuralFacts (highest priority) ─
  // These come directly from the user's Structural Authority Check inputs.
  // They override any inferred values from answers, report, or scores.
  if (params.structuralFacts) {
    if (params.structuralFacts.decisionOwner) result.decisionOwner = params.structuralFacts.decisionOwner
    if (params.structuralFacts.approvingAuthority) result.approvingAuthority = params.structuralFacts.approvingAuthority
    if (params.structuralFacts.blockingAuthority) result.blockingAuthority = params.structuralFacts.blockingAuthority
    if (params.structuralFacts.mandateSource) result.mandateSource = params.structuralFacts.mandateSource
    if (params.structuralFacts.currentRoute) result.currentRoute = params.structuralFacts.currentRoute
    if (params.structuralFacts.nonNegotiableConstraint) result.nonNegotiableConstraint = params.structuralFacts.nonNegotiableConstraint
    if (params.structuralFacts.failureMode) result.failureMode = params.structuralFacts.failureMode
    if (params.structuralFacts.repairCondition) result.repairCondition = params.structuralFacts.repairCondition
  }

  // ── Step 1: Extract from answer IDs ──────────────────────────────────
  // Only sets fields NOT already populated by structuralFacts (Priority 0)
  for (const [answerId, fieldKey] of Object.entries(ANSWER_ID_MAP)) {
    // Skip if already set by structuralFacts
    if (result[fieldKey]) continue
    const answer = userAnswers[answerId]
    if (answer && typeof answer === 'object') {
      const answerObj = answer as Record<string, unknown>
      // Try to extract text from the answer
      const text = extractAnswerText(answerObj)
      if (text) {
        result[fieldKey] = text
      }
    }
  }

  // ── Step 2: Extract from prompt text patterns ────────────────────────
  // Only sets fields NOT already populated by structuralFacts or answer IDs
  for (const [answerId, answer] of Object.entries(userAnswers)) {
    if (answer && typeof answer === 'object') {
      const answerObj = answer as Record<string, unknown>
      const prompt = typeof answerObj['prompt'] === 'string' ? answerObj['prompt'] : ''
      if (!prompt) continue

      // Check if this answer's prompt matches a structural field pattern
      for (const { pattern, field } of PROMPT_PATTERNS) {
        if (pattern.test(prompt)) {
          // Only set if not already set by higher priority sources
          if (!result[field]) {
            const text = extractAnswerText(answerObj)
            if (text) {
              result[field] = text
            }
          }
          break
        }
      }
    }
  }

  // ── Step 3: Extract from report/decision/routeSummary ────────────────
  if (!result.decisionOwner) {
    const v = extractString(decision, 'decisionOwner')
      ?? extractString(decision, 'owner')
      ?? extractString(report, 'decisionOwner')
    if (v) result.decisionOwner = v
  }

  if (!result.approvingAuthority) {
    const v = extractString(decision, 'approvingAuthority')
      ?? extractString(decision, 'authorityType')
      ?? extractString(report, 'authorityType')
    if (v) result.approvingAuthority = v
  }

  if (!result.blockingAuthority) {
    const v = extractString(decision, 'blockingAuthority')
      ?? extractString(decision, 'blocker')
    if (v) result.blockingAuthority = v
  }

  if (!result.mandateSource) {
    const v = extractString(decision, 'mandateSource')
      ?? extractString(report, 'mandateSource')
    if (v) {
      result.mandateSource = v
    } else if (extractString(report, 'mandateFit') === 'true') {
      result.mandateSource = 'Mandate confirmed by assessment'
    }
  }

  if (!result.currentRoute) {
    const v = extractString(decision, 'route')
      ?? extractString(routeSummary, 'route')
    if (v) result.currentRoute = v
  }

  if (!result.nonNegotiableConstraint) {
    const v = extractString(decision, 'constraint')
      ?? extractString(report, 'constraint')
    if (v) result.nonNegotiableConstraint = v
  }

  if (!result.failureMode) {
    // Extract from failure modes array
    const failureModes = extractStringArray(decision, 'failureModes')
      ?? extractStringArray(decision, 'disqualifiersTriggered')
    if (failureModes && failureModes.length > 0) {
      result.failureMode = failureModes[0]
    }
  }

  if (!result.repairCondition) {
    const v = extractString(decision, 'repairCondition')
      ?? extractString(report, 'repairCondition')
      ?? extractString(routeSummary, 'description')
    if (v) result.repairCondition = v
  }

  // ── Step 4: Weak inference from scores (only as last resort) ─────────
  // Only use scores if no explicit data was found and scores are extreme
  if (!result.decisionOwner) {
    const authorityScore = extractNumber(report, 'authority') ?? extractNumber(report, 'authorityScore')
    if (authorityScore !== null && authorityScore <= 3) {
      // Low authority score suggests owner is unclear, but we don't know who
      // Leave undefined — don't fabricate
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract text from an answer object.
 * Answers can have different shapes: { value, text }, { resonance, certainty },
 * or a simple string.
 */
function extractAnswerText(answer: Record<string, unknown>): string | null {
  // Try common text fields
  const text = extractString(answer, 'text')
    ?? extractString(answer, 'value')
    ?? extractString(answer, 'label')
    ?? extractString(answer, 'answer')
  if (text) return text

  // If the answer has resonance/certainty (Likert scale), we can't extract text
  if (typeof answer['resonance'] === 'number' || typeof answer['certainty'] === 'number') {
    return null
  }

  return null
}

function extractString(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key]
  return typeof val === 'string' && val.length > 0 ? val : null
}

function extractNumber(obj: Record<string, unknown>, key: string): number | null {
  const val = obj[key]
  return typeof val === 'number' ? val : null
}

function extractStringArray(obj: Record<string, unknown>, key: string): string[] | null {
  const val = obj[key]
  if (Array.isArray(val)) {
    const strings = val.filter((v): v is string => typeof v === 'string')
    return strings.length > 0 ? strings : null
  }
  return null
}
