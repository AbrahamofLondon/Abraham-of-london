/**
 * pages/decision-pressure.tsx — Decision Pressure Signal
 *
 * A fast, viral, shareable public signal that gives users an immediate "aha" moment
 * without requiring them to understand the full product.
 *
 * This is the top-of-funnel engine.
 *
 * Free output:
 *   1. Pressure Band (Low / Live / Escalating / Critical)
 *   2. Primary Friction
 *   3. One-line consequence
 *   4. Minimum viable move
 *   5. Adversarial challenge
 *   6. Refusal state where input is too vague
 *
 * No account required. No email wall. No payment wall.
 */

import React, { useState, useCallback, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowRight, RefreshCw, Share2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { GovernedRefusalBlock, type RefusalCategory } from '@/components/kernel/GovernedRefusalBlock'
import { WhatSystemNoticedBlock } from '@/components/kernel/WhatSystemNoticedBlock'
import { buildPressureSignalTranslation, buildRefusalMessage } from '@/lib/kernel/public-situation-translation'
import { track } from '@/lib/analytics/track'

const GOLD = '#C9A96E'
const AMBER = '#F59E0B'
const EMERALD = '#6EE7B7'
const ROSE = '#FB7185'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

type PressureBand = 'LOW' | 'LIVE' | 'ESCALATING' | 'CRITICAL'

type FrictionType =
  | 'EVIDENCE_GAP'
  | 'AUTHORITY_GAP'
  | 'EXECUTION_DRIFT'
  | 'INCENTIVE_CONFLICT'
  | 'MANDATE_AMBIGUITY'
  | 'TIMING_PRESSURE'
  | 'STAKEHOLDER_CONTRADICTION'

interface SignalOutput {
  pressureBand: PressureBand
  primaryFriction: FrictionType
  frictionLabel: string
  consequence: string
  minimumViableMove: string
  adversarialChallenge: string
}

const FRICTION_META: Record<FrictionType, string> = {
  EVIDENCE_GAP: 'Evidence gap',
  AUTHORITY_GAP: 'Authority gap',
  EXECUTION_DRIFT: 'Execution drift',
  INCENTIVE_CONFLICT: 'Incentive conflict',
  MANDATE_AMBIGUITY: 'Mandate ambiguity',
  TIMING_PRESSURE: 'Timing pressure',
  STAKEHOLDER_CONTRADICTION: 'Stakeholder contradiction',
}

const BAND_COLORS: Record<PressureBand, string> = {
  LOW: EMERALD,
  LIVE: `${GOLD}CC`,
  ESCALATING: AMBER,
  CRITICAL: ROSE,
}

const BAND_LABELS: Record<PressureBand, string> = {
  LOW: 'Low',
  LIVE: 'Live',
  ESCALATING: 'Escalating',
  CRITICAL: 'Critical',
}

function computeSignal(input: string): { output: SignalOutput } | { refusal: RefusalCategory } {
  const trimmed = input.trim()
  const wordCount = trimmed.split(/\s+/).length

  // Refusal: too vague
  if (wordCount < 8 || trimmed.length < 40) {
    return { refusal: 'VAGUE_DECISION' }
  }

  // Refusal: no decision owner mentioned
  const hasOwner = /\b(I|we|the\s+(board|ceo|founder|team|director|lead|head|manager|owner|committee|executive))\b/i.test(trimmed)
  if (!hasOwner) {
    return { refusal: 'MISSING_OWNER' }
  }

  // Refusal: no consequence mentioned
  const hasConsequence = /\b(cost|risk|exposure|deadline|penalty|loss|damage|fail|consequence|delay|urgent|pressure|liability)\b/i.test(trimmed)
  if (!hasConsequence) {
    return { refusal: 'MISSING_CONSEQUENCE' }
  }

  // --- Signal computation ---

  // Pressure indicators
  const urgencyWords = /\b(urgent|immediate|today|tomorrow|deadline|critical|emergency|ASAP|overdue)\b/gi
  const urgencyMatches = (trimmed.match(urgencyWords) || []).length

  const stakeWords = /\b(board|investor|regulator|client|revenue|legal|compliance|reputation|existential)\b/gi
  const stakeMatches = (trimmed.match(stakeWords) || []).length

  const stuckWords = /\b(stuck|blocked|avoiding|delaying|circling|stalled|frozen|can't decide|unresolved)\b/gi
  const stuckMatches = (trimmed.match(stuckWords) || []).length

  const compositeScore = urgencyMatches * 3 + stakeMatches * 2 + stuckMatches * 2

  const pressureBand: PressureBand =
    compositeScore >= 10 ? 'CRITICAL' :
    compositeScore >= 6 ? 'ESCALATING' :
    compositeScore >= 3 ? 'LIVE' :
    'LOW'

  // Determine primary friction
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess)\b/i.test(trimmed)
  const hasAuthorityGap = /\b(who|approval|permission|sign.?off|authority|mandate|escalat)\b/i.test(trimmed)
  const hasExecutionDrift = /\b(plan|execute|action|implement|done|progress|stalled|stuck|delay)\b/i.test(trimmed)
  const hasIncentiveConflict = /\b(but|however|conflict|disagree|oppose|resist|politics|agenda)\b/i.test(trimmed)
  const hasMandateAmbiguity = /\b(role|responsible|accountable|job|supposed to|who should)\b/i.test(trimmed)
  const hasTimingPressure = /\b(time|deadline|urgent|soon|quick|fast|immediate|overdue|late)\b/i.test(trimmed)

  const frictions: Array<{ type: FrictionType; score: number }> = [
    { type: 'EVIDENCE_GAP', score: hasEvidenceGap ? 3 : 0 },
    { type: 'AUTHORITY_GAP', score: hasAuthorityGap ? 4 : 0 },
    { type: 'EXECUTION_DRIFT', score: hasExecutionDrift ? 2 : 0 },
    { type: 'INCENTIVE_CONFLICT', score: hasIncentiveConflict ? 3 : 0 },
    { type: 'MANDATE_AMBIGUITY', score: hasMandateAmbiguity ? 2 : 0 },
    { type: 'TIMING_PRESSURE', score: hasTimingPressure ? 1 : 0 },
    { type: 'STAKEHOLDER_CONTRADICTION', score: (hasAuthorityGap && hasIncentiveConflict) ? 5 : 0 },
  ]
  frictions.sort((a, b) => b.score - a.score)
  const topFriction = frictions[0]
  const primaryFriction: FrictionType = topFriction ? topFriction.type : 'AUTHORITY_GAP'

  // Consequence lines
  const CONSEQUENCES: Record<PressureBand, string[]> = {
    LOW: [
      'This decision is not yet under pressure, but unresolved low-stakes decisions compound into structural problems.',
      'No immediate consequence — but the pattern of deferral is worth noting before it becomes habitual.',
    ],
    LIVE: [
      'This will not fail because the idea is weak. It will fail because ownership is unclear.',
      'The decision is being delayed because the evidence standard has not been named.',
      'You are treating an authority problem as a planning problem.',
    ],
    ESCALATING: [
      'The cost of delay is now measurable. In 30 days, it will be materially higher than it is today.',
      'This decision is approaching a threshold where options begin to close. The window is narrowing.',
      'What started as a simple decision is becoming a structural risk because no one has forced resolution.',
    ],
    CRITICAL: [
      'The consequence window is closing. What is at stake may no longer be recoverable if delayed further.',
      'This decision appears overdue. Delay is compounding daily — the cost is no longer linear.',
      'The system detects an unresolved decision at critical pressure. Immediate structured intervention is warranted.',
    ],
  }

  const consequenceOptions = CONSEQUENCES[pressureBand]
  const consequence: string = consequenceOptions[0]!

  // Minimum viable moves
  const MOVES: Record<FrictionType, string[]> = {
    EVIDENCE_GAP: [
      'Name the evidence that would change this decision. Then find it before deciding.',
      'Run the Decision Exposure Instrument to price what you do not yet know.',
    ],
    AUTHORITY_GAP: [
      'Confirm in writing who holds the authority to decide and who can block. Until then, the decision is not ready.',
      'Map the decision authority chain before proceeding further.',
    ],
    EXECUTION_DRIFT: [
      'Assign one accountable owner and one deadline. Without both, the decision will continue to drift.',
      'Run the Fast Diagnostic to identify where execution is breaking from intent.',
    ],
    INCENTIVE_CONFLICT: [
      'Surface the conflicting incentives openly before attempting to resolve the decision. Hidden conflicts will resurface.',
      'Map who benefits from the status quo and who benefits from the decision. The conflict will not resolve until incentives align.',
    ],
    MANDATE_AMBIGUITY: [
      'Clarify the mandate in writing. A decision made without clear mandate is vulnerable to challenge regardless of its merits.',
      'Define who is responsible, who is accountable, who must be consulted, and who must be informed.',
    ],
    TIMING_PRESSURE: [
      'Separate genuine deadlines from manufactured urgency. Then decide whether the timeline is real or imposed.',
      'Price the cost of moving faster versus the cost of delay. The optimal pace is rarely the fastest.',
    ],
    STAKEHOLDER_CONTRADICTION: [
      'Map all stakeholders and their stated positions. The contradiction will not resolve until each position is tested against evidence.',
      'Run the Team Assessment to surface the stakeholder contradictions that individual analysis cannot detect.',
    ],
  }

  const moveOptions = MOVES[primaryFriction]
  const minimumViableMove: string = moveOptions[0]!

  // Adversarial challenge
  const CHALLENGES: Record<PressureBand, string[]> = {
    LOW: [
      'A reviewer would ask: "What evidence supports the claim that this decision needs attention at all?"',
    ],
    LIVE: [
      'A reviewer would ask: "Who specifically owns this decision, and what authority do they have to execute it?"',
    ],
    ESCALATING: [
      'A reviewer would ask: "What has changed in the last 30 days that makes this more urgent than it was?"',
    ],
    CRITICAL: [
      'A reviewer would ask: "Why has this not been resolved already, and is the reason still valid today?"',
    ],
  }

  const challengeOptions = CHALLENGES[pressureBand]
  const adversarialChallenge: string = challengeOptions[0]!

  return {
    output: {
      pressureBand,
      primaryFriction,
      frictionLabel: FRICTION_META[primaryFriction],
      consequence,
      minimumViableMove,
      adversarialChallenge,
    },
  }
}

function getNextHref(band: PressureBand): string {
  switch (band) {
    case 'LOW':
    case 'LIVE':
      return '/diagnostics/fast'
    case 'ESCALATING':
      return '/diagnostics/fast'
    case 'CRITICAL':
      return '/decision-centre'
  }
}

function getNextLabel(band: PressureBand): string {
  switch (band) {
    case 'LOW':
    case 'LIVE':
      return 'Run the Fast Diagnostic'
    case 'ESCALATING':
      return 'Map the contradiction properly'
    case 'CRITICAL':
      return 'Enter the Decision Centre'
  }
}

export default function DecisionPressurePage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<SignalOutput | null>(null)
  const [refusal, setRefusal] = useState<RefusalCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return

    setLoading(true)
    // Simulate brief processing delay for perceived depth
    setTimeout(() => {
      const computed = computeSignal(input)
      if ('output' in computed) {
        setResult(computed.output)
        setRefusal(null)
        track('decision_pressure_completed', { pressureBand: computed.output.pressureBand, friction: computed.output.primaryFriction })
      } else {
        setRefusal(computed.refusal)
        setResult(null)
        track('decision_pressure_refused', { category: computed.refusal })
      }
      setLoading(false)
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }, 600)
  }, [input])

  const handleReset = useCallback(() => {
    setResult(null)
    setRefusal(null)
    setInput('')
  }, [])

  const handleShare = useCallback(() => {
    if (!result) return
    const text = `Decision Pressure: ${BAND_LABELS[result.pressureBand]}\nFriction: ${result.frictionLabel}\n${result.consequence}\n\nTest your decision pressure: https://abrahamoflondon.com/decision-pressure`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    track('decision_pressure_shared', { pressureBand: result.pressureBand })
  }, [result])

  const bandColor = result ? BAND_COLORS[result.pressureBand] : GOLD

  return (
    <Layout
      title="Decision Pressure Signal | Abraham of London"
      description="Describe a decision you are avoiding, delaying, or struggling to land. Get an immediate pressure reading — free, no account required."
      canonicalUrl="/decision-pressure"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="Describe a decision under pressure. Get an immediate signal: pressure band, primary friction, consequence, and next move. Free. No account required." />
        <meta property="og:title" content="Decision Pressure Signal — Abraham of London" />
        <meta property="og:description" content="Test your decision pressure. Free signal in under 45 seconds." />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        {/* Hero / Input section */}
        <section className="px-6 pb-16 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[700px]">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
              Decision Pressure Signal
            </p>
            <h1
              className="mt-6"
              style={{
                ...serif,
                fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                lineHeight: 1.02,
                color: '#F5F5F5',
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
              }}
            >
              Describe the decision you are avoiding, delaying, or struggling to land.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              One sentence minimum. No account required. The system will read your decision pressure and return a signal — or refuse if the input is too vague.
            </p>

            {/* Input */}
            <div className="mt-8">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. We need to decide whether to acquire the competitor, but the board is split and the CEO wants to move fast while legal is still reviewing the exposure..."
                rows={4}
                className="w-full border bg-white/[0.02] p-5 text-[15px] leading-[1.7] text-white placeholder:text-white/20 focus:outline-none"
                style={{
                  borderColor: input.trim() ? `${GOLD}40` : 'rgba(255,255,255,0.10)',
                  resize: 'vertical',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '13px',
                }}
              />
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="group inline-flex min-h-[48px] items-center gap-3 border px-7 py-3 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    borderColor: `${GOLD}50`,
                    backgroundColor: `${GOLD}15`,
                    color: '#F5F5F5',
                    ...mono,
                    fontSize: '10px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  {loading ? 'Reading...' : 'Read my decision pressure'}
                  {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                </button>
                {result || refusal ? (
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2"
                    style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try another
                  </button>
                ) : null}
              </div>
            </div>

            {/* Trust signal */}
            <p className="mt-6 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              This system is designed to refuse weak inputs before they become expensive decisions. The refusal is the feature.
            </p>
          </div>
        </section>

        {/* Result section */}
        {(result || refusal) && (
          <section ref={resultRef} className="border-t px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <div className="mx-auto max-w-[700px]">
              {/* Refusal state */}
              {refusal && (() => {
                const refusalMsg = buildRefusalMessage(refusal, input)
                return (
                  <div>
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
                          {refusalMsg.reason}
                        </p>
                      </div>

                      {/* Next admissible input */}
                      <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                          Next admissible input
                        </p>
                        <p className="mt-1 whitespace-pre-line text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.70)' }}>
                          {refusalMsg.nextAdmissibleInput}
                        </p>
                      </div>

                      {/* Market framing footer */}
                      <p className="mt-6 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        The refusal is the feature. It protects the decision from false confidence.
                      </p>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setInput('')
                          setRefusal(null)
                          document.querySelector('textarea')?.focus()
                        }}
                        className="inline-flex items-center gap-2"
                        style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}CC` }}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Rewrite the decision with evidence
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Signal result */}
              {result && (
                <div>
                  {/* Shareable signal card */}
                  <div
                    className="border p-6 md:p-8"
                    style={{
                      borderColor: `${bandColor}30`,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {/* Pressure band */}
                    <div className="flex items-center justify-between">
                      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                        Decision pressure band
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: bandColor }} />
                        <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: bandColor }}>
                          {BAND_LABELS[result.pressureBand]}
                        </span>
                      </div>
                    </div>

                    {/* Primary friction */}
                    <div className="mt-6">
                      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                        Primary friction
                      </p>
                      <p className="mt-1 text-[16px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.80), ...serif' }}>
                        {result.frictionLabel}
                      </p>
                    </div>

                    {/* Consequence */}
                    <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                        One-line consequence
                      </p>
                      <p className="mt-2 text-[15px] leading-[1.75] italic" style={{ color: 'rgba(255,255,255,0.70)' }}>
                        "{result.consequence}"
                      </p>
                    </div>

                    {/* Minimum viable move */}
                    <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                        Minimum viable move
                      </p>
                      <p className="mt-2 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {result.minimumViableMove}
                      </p>
                    </div>

                    {/* Adversarial challenge */}
                    <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.60)' }}>
                        How this would be attacked
                      </p>
                      <p className="mt-2 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {result.adversarialChallenge}
                      </p>
                    </div>

                    {/* Evidence posture */}
                    <div className="mt-6 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)' }}>
                        Evidence posture: USER_REPORTED — this is a first signal, not a full diagnosis
                      </p>
                    </div>
                  </div>

                  {/* What the system noticed — compact variant */}
                  <div className="mt-6">
                    <WhatSystemNoticedBlock
                      variant="compact"
                      {...buildPressureSignalTranslation(
                        input,
                        result.pressureBand,
                        result.frictionLabel,
                        result.consequence,
                        result.minimumViableMove,
                        result.adversarialChallenge,
                      )}
                    />
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href={getNextHref(result.pressureBand)}
                      className="group inline-flex min-h-[48px] items-center gap-3 border px-7 py-3 transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: `${GOLD}50`,
                        backgroundColor: `${GOLD}15`,
                        color: '#F5F5F5',
                        ...mono,
                        fontSize: '10px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {getNextLabel(result.pressureBand)}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2"
                      style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share signal
                    </button>
                  </div>

                  {/* Pathway link */}
                  <div className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      This is a first signal, not a full diagnosis.{' '}
                      <Link href="/decision-pathway" style={{ color: `${GOLD}CC`, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                        View the full decision pathway
                      </Link>{' '}
                      to see what the system can detect at each level.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
