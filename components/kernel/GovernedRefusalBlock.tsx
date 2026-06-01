/**
 * components/kernel/GovernedRefusalBlock.tsx
 *
 * A reusable refusal display component.
 * Makes the system's ability to refuse weak inputs visible as a trust signal.
 *
 * Refusal categories:
 *   1. Vague decision
 *   2. Missing owner
 *   3. Missing consequence
 *   4. Missing evidence
 *   5. Unsupported authority claim
 *   6. Premature escalation
 *   7. Conflicting facts
 *   8. Insufficient organisational context
 *   9. Unclear stakeholder map
 *  10. No admissible next move
 */

import React from 'react'

const GOLD = '#C9A96E'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

export type RefusalCategory =
  | 'VAGUE_DECISION'
  | 'MISSING_OWNER'
  | 'MISSING_CONSEQUENCE'
  | 'MISSING_EVIDENCE'
  | 'UNSUPPORTED_AUTHORITY_CLAIM'
  | 'PREMATURE_ESCALATION'
  | 'CONFLICTING_FACTS'
  | 'INSUFFICIENT_ORGANISATIONAL_CONTEXT'
  | 'UNCLEAR_STAKEHOLDER_MAP'
  | 'NO_ADMISSIBLE_NEXT_MOVE'

const REFUSAL_META: Record<RefusalCategory, { label: string; explanation: string; risk: string; nextMove: string }> = {
  VAGUE_DECISION: {
    label: 'Vague decision',
    explanation: 'The decision described is too general for a reliable reading. The system needs a specific decision with a named actor and a defined consequence.',
    risk: 'A vague input produces a vague output — which looks like an answer but is not actionable. False confidence is more dangerous than no answer.',
    nextMove: 'Name the specific decision, who is responsible, and what happens if it is not made.',
  },
  MISSING_OWNER: {
    label: 'Missing owner',
    explanation: 'The decision has been described but no accountable owner has been identified. Without an owner, the system cannot assess authority alignment or execution readiness.',
    risk: 'Decisions without named owners do not resolve — they drift until someone is forced to act, usually at higher cost.',
    nextMove: 'Assign one accountable owner before proceeding with the diagnostic.',
  },
  MISSING_CONSEQUENCE: {
    label: 'Missing consequence',
    explanation: 'The decision is described without reference to what depends on it. The system needs to understand what is at stake to assess pressure and priority.',
    risk: 'Without a priced consequence, the system cannot distinguish between a genuine decision emergency and a distraction.',
    nextMove: 'Describe what happens if this decision is delayed by 30 days.',
  },
  MISSING_EVIDENCE: {
    label: 'Missing evidence',
    explanation: 'The claim or situation described lacks supporting evidence. The system grades evidence quality and cannot produce a reliable finding on self-report alone.',
    risk: 'Acting on unsupported claims creates liability. The system protects the record from premature conclusions.',
    nextMove: 'Provide the evidence that supports this claim, or flag it as unconfirmed.',
  },
  UNSUPPORTED_AUTHORITY_CLAIM: {
    label: 'Unsupported authority claim',
    explanation: 'The stated authority to decide does not match the operating reality. The person who claims to own the decision may not have the mandate to execute it.',
    risk: 'Authority mismatches are the most common cause of decision failure. Proceeding without resolving this creates execution risk.',
    nextMove: 'Confirm in writing who holds the authority to decide and who can block the decision.',
  },
  PREMATURE_ESCALATION: {
    label: 'Premature escalation',
    explanation: 'The case has been presented for escalation before the evidence threshold has been met. The system will not promote a case that cannot sustain scrutiny.',
    risk: 'Premature escalation wastes executive attention and damages credibility. The system protects the escalation path by enforcing evidence standards.',
    nextMove: 'Complete the prerequisite diagnostic surfaces first, then re-submit for escalation review.',
  },
  CONFLICTING_FACTS: {
    label: 'Conflicting facts',
    explanation: 'The information provided contains internal contradictions that prevent a coherent reading. The system cannot resolve the conflict without clarification.',
    risk: 'Proceeding with conflicting facts produces unreliable output. The system stops rather than guessing.',
    nextMove: 'Resolve the factual conflict before proceeding. Identify which source is authoritative.',
  },
  INSUFFICIENT_ORGANISATIONAL_CONTEXT: {
    label: 'Insufficient organisational context',
    explanation: 'The decision appears to involve multiple stakeholders or organisational units, but the context provided is individual-only. The system needs the broader picture.',
    risk: 'Individual-level analysis of an organisational decision misses structural dynamics. The output would be incomplete.',
    nextMove: 'Run the Team Assessment or Enterprise Assessment to capture the full organisational context.',
  },
  UNCLEAR_STAKEHOLDER_MAP: {
    label: 'Unclear stakeholder map',
    explanation: 'The decision involves multiple parties but their roles, interests, and authorities are not clearly defined. The system cannot assess alignment without this map.',
    risk: 'Unmapped stakeholders create blind spots. A decision that looks ready may be blocked by an unmapped veto holder.',
    nextMove: 'Map all stakeholders: who decides, who advises, who approves, who executes, who can block.',
  },
  NO_ADMISSIBLE_NEXT_MOVE: {
    label: 'No admissible next move',
    explanation: 'The system has assessed the available evidence and cannot identify a responsible next action within the current evidence posture.',
    risk: 'Forcing a recommendation when none is warranted produces false direction. The system refuses rather than fabricates.',
    nextMove: 'Gather additional evidence or clarify the decision parameters, then re-submit.',
  },
}

interface GovernedRefusalBlockProps {
  category: RefusalCategory
  /** Optional override for the explanation text */
  explanation?: string
  /** Optional override for the next move text */
  nextMove?: string
  /** If true, renders in a compact variant */
  compact?: boolean
}

export function GovernedRefusalBlock({
  category,
  explanation,
  nextMove,
  compact = false,
}: GovernedRefusalBlockProps) {
  const meta = REFUSAL_META[category]

  if (compact) {
    return (
      <div
        className="border p-4"
        style={{
          borderColor: 'rgba(248,113,113,0.20)',
          backgroundColor: 'rgba(248,113,113,0.04)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
            style={{
              border: '1px solid rgba(248,113,113,0.30)',
              borderRadius: '50%',
            }}
          >
            <span style={{ ...mono, fontSize: '10px', color: 'rgba(248,113,113,0.70)' }}>!</span>
          </div>
          <div>
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.80)' }}>
              {meta.label}
            </p>
            <p className="mt-1 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {explanation || meta.explanation}
            </p>
            <p className="mt-2 text-[12px] leading-[1.6]" style={{ color: `${GOLD}AA` }}>
              <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                Next admissible move:{' '}
              </span>
              {nextMove || meta.nextMove}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border p-6"
      style={{
        borderColor: 'rgba(248,113,113,0.18)',
        backgroundColor: 'rgba(248,113,113,0.03)',
      }}
    >
      {/* Refusal badge */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{
            border: '1px solid rgba(248,113,113,0.30)',
            borderRadius: '50%',
          }}
        >
          <span style={{ ...mono, fontSize: '13px', color: 'rgba(248,113,113,0.70)' }}>!</span>
        </div>
        <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.80)' }}>
          The system cannot responsibly produce this output yet
        </p>
      </div>

      {/* Reason */}
      <div className="mt-5">
        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}88` }}>
          Reason
        </p>
        <p className="mt-1 text-[15px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.75)' }}>
          <span style={{ color: 'rgba(248,113,113,0.85)' }}>{meta.label}: </span>
          {explanation || meta.explanation}
        </p>
      </div>

      {/* Why it matters */}
      <div className="mt-4">
        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}88` }}>
          Why this matters
        </p>
        <p className="mt-1 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {meta.risk}
        </p>
      </div>

      {/* Next admissible move */}
      <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
          Next admissible move
        </p>
        <p className="mt-1 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {nextMove || meta.nextMove}
        </p>
      </div>

      {/* Market framing footer */}
      <p className="mt-6 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.30)' }}>
        The refusal is the feature. It protects the decision from false confidence.
      </p>
    </div>
  )
}
