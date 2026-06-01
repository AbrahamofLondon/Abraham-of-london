/**
 * pages/decision-pressure.tsx - Low-friction public pressure signal.
 *
 * Free output only. The result deliberately does not render or share the raw
 * submitted decision text.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowRight, Check, Copy, RefreshCw, Share2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { track } from '@/lib/analytics/track'

const GOLD = '#C9A96E'
const GREEN = '#6EE7B7'
const AMBER = '#F59E0B'
const RED = '#FB7185'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

type PressureBand = 'Green' | 'Amber' | 'Red'

interface PressureSignal {
  band: PressureBand
  bandReason: string
  missingEvidence: string[]
  authorityOwnershipRisk: string | null
  consequenceDelayRisk: string
  nextAdmissibleMove: string
  compactSummary: string
}

interface PressureRefusal {
  reason: string
  nextAdmissibleInput: string
}

const BAND_COLORS: Record<PressureBand, string> = {
  Green: GREEN,
  Amber: AMBER,
  Red: RED,
}

function hasAny(input: string, words: RegExp): boolean {
  return words.test(input)
}

function computePressureSignal(rawInput: string): { signal: PressureSignal } | { refusal: PressureRefusal } {
  const input = rawInput.trim()
  const words = input.split(/\s+/).filter(Boolean)

  if (input.length < 44 || words.length < 9) {
    return {
      refusal: {
        reason: 'The input is too vague to produce a responsible pressure signal.',
        nextAdmissibleInput:
          'Name the decision, who can decide it, what is blocking it, what evidence is missing, and what happens if it is delayed.',
      },
    }
  }

  const hasDecisionShape = hasAny(input, /\b(decide|decision|choose|approve|reject|hire|fire|launch|stop|delay|buy|sell|sign|commit|invest|acquire|settle|escalate)\b/i)
  const hasOwner = hasAny(input, /\b(i|we|our|me|board|ceo|founder|director|partner|owner|committee|team|client|investor|legal|finance|ops|manager|lead)\b/i)
  const hasStakes = hasAny(input, /\b(risk|cost|loss|revenue|client|legal|regulator|compliance|deadline|penalty|delay|damage|reputation|cash|runway|exposure|consequence)\b/i)

  if (!hasDecisionShape) {
    return {
      refusal: {
        reason: 'The system can see concern, but not a concrete decision.',
        nextAdmissibleInput:
          'Rewrite it as: "We need to decide whether to [specific action], but [blocker], because [consequence if delayed]."',
      },
    }
  }

  if (!hasOwner || !hasStakes) {
    return {
      refusal: {
        reason: 'The decision lacks either a clear owner or a consequence of delay.',
        nextAdmissibleInput:
          'Add who has authority to decide, who can block, and what material consequence appears if no decision is made.',
      },
    }
  }

  const urgent = (input.match(/\b(today|tomorrow|urgent|asap|overdue|deadline|critical|immediate|this week|late)\b/gi) ?? []).length
  const highStakes = (input.match(/\b(board|investor|legal|regulator|compliance|revenue|cash|runway|client|reputation|penalty|lawsuit|breach|acquire|funding)\b/gi) ?? []).length
  const stuck = (input.match(/\b(avoiding|delaying|stuck|blocked|split|unclear|waiting|stalling|cannot decide|can't decide|disagree|conflict)\b/gi) ?? []).length
  const weakEvidence = (input.match(/\b(assume|guess|not sure|unclear|unknown|missing|no evidence|lack|unproven|still reviewing|waiting for data)\b/gi) ?? []).length
  const authoritySignals = (input.match(/\b(authority|owner|approval|sign.?off|mandate|permission|who decides|accountable|responsible|board|ceo|committee|legal)\b/gi) ?? []).length

  const score = urgent * 3 + highStakes * 2 + stuck * 2 + weakEvidence + authoritySignals
  const band: PressureBand = score >= 11 ? 'Red' : score >= 5 ? 'Amber' : 'Green'

  const missingEvidence = [
    !hasAny(input, /\b(data|evidence|proof|numbers|forecast|model|contract|terms|legal review|review|quote|customer|market|financial|cash|runway)\b/i)
      ? 'Decision evidence standard: what proof would change the decision.'
      : null,
    !hasAny(input, /\b(deadline|today|tomorrow|this week|date|by friday|month|quarter|overdue)\b/i)
      ? 'Real decision clock: whether the deadline is external, internal, or manufactured.'
      : null,
    !hasAny(input, /\b(owner|authority|approval|sign.?off|mandate|accountable|responsible|board|ceo|director|committee)\b/i)
      ? 'Named decision authority: who can decide and who can block.'
      : null,
  ].filter((item): item is string => Boolean(item))

  if (missingEvidence.length === 0 && weakEvidence > 0) {
    missingEvidence.push('Evidence quality: whether the current evidence is decision-grade or only directional.')
  }

  const authorityOwnershipRisk =
    authoritySignals > 0 || hasAny(input, /\b(split|committee|legal|board|approval|sign.?off|who|accountable|responsible)\b/i)
      ? 'Authority or ownership may be unclear. Confirm the accountable decider and the blockers before treating this as an execution problem.'
      : null

  const consequenceDelayRisk =
    band === 'Red'
      ? 'Delay is likely compounding. Options may narrow, costs may rise, and the decision may move from choice to damage control.'
      : band === 'Amber'
        ? 'Delay is becoming material. The main risk is letting uncertainty harden into a default decision.'
        : 'Delay is not yet structurally dangerous, but the unresolved evidence and ownership questions should be closed before momentum builds.'

  const nextAdmissibleMove =
    missingEvidence.some((item) => item.includes('authority')) || authorityOwnershipRisk
      ? 'Write a one-line decision mandate: named decider, blockers, deadline, and evidence required to proceed.'
      : missingEvidence.length > 0
        ? 'Name the missing evidence that would change the decision, then obtain or explicitly waive it.'
        : 'Set the smallest reversible move, owner, and review point before the decision drifts again.'

  const bandReason =
    band === 'Red'
      ? 'High pressure: urgency, stakes, and unresolved ownership or evidence are present together.'
      : band === 'Amber'
        ? 'Live pressure: delay has a material cost, but the decision is still recoverable with a tighter mandate.'
        : 'Lower pressure: the decision is not yet critical, but it still needs evidence and ownership discipline.'

  return {
    signal: {
      band,
      bandReason,
      missingEvidence: missingEvidence.length > 0 ? missingEvidence : ['No major evidence gap detected from the submitted wording.'],
      authorityOwnershipRisk,
      consequenceDelayRisk,
      nextAdmissibleMove,
      compactSummary: `Pressure band: ${band}. ${bandReason} Next admissible move: ${nextAdmissibleMove}`,
    },
  }
}

function buildShareText(signal: PressureSignal): string {
  return [
    'Decision Pressure Signal',
    `Pressure band: ${signal.band}`,
    `Missing evidence: ${signal.missingEvidence[0]}`,
    `Delay risk: ${signal.consequenceDelayRisk}`,
    `Next move: ${signal.nextAdmissibleMove}`,
    'Run your own signal: https://abrahamoflondon.com/decision-pressure',
  ].join('\n')
}

export default function DecisionPressurePage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<PressureSignal | null>(null)
  const [refusal, setRefusal] = useState<PressureRefusal | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const shareText = useMemo(() => (result ? buildShareText(result) : ''), [result])

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return

    setLoading(true)
    setCopied(false)

    window.setTimeout(() => {
      const computed = computePressureSignal(input)

      if ('signal' in computed) {
        setResult(computed.signal)
        setRefusal(null)
        track('decision_pressure_completed', { pressureBand: computed.signal.band })
      } else {
        setRefusal(computed.refusal)
        setResult(null)
        track('decision_pressure_refused', { reason: computed.refusal.reason })
      }

      setLoading(false)
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }, 350)
  }, [input])

  const handleReset = useCallback(() => {
    setInput('')
    setResult(null)
    setRefusal(null)
    setCopied(false)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!shareText) return

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
      }
      track('decision_pressure_shared', { pressureBand: result?.band })
    } catch {
      // Sharing is optional; keep the result visible if the browser blocks it.
    }
  }, [result?.band, shareText])

  return (
    <Layout
      title="Decision Pressure Signal | Abraham of London"
      description="Paste the decision you are avoiding. Get a free pressure band, missing evidence, risk signal, and next admissible move."
      canonicalUrl="/decision-pressure"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="Paste the decision you are avoiding. The system will show the pressure band, missing evidence, and next admissible move."
        />
        <meta property="og:title" content="Decision Pressure Signal - Abraham of London" />
        <meta
          property="og:description"
          content="A low-friction free pressure signal for avoided decisions."
        />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        <section className="px-6 pb-14 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
              Free Decision Pressure Signal
            </p>
            <h1
              className="mt-6"
              style={{
                ...serif,
                fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                lineHeight: 1.02,
                color: '#F5F5F5',
                fontStyle: 'italic',
              }}
            >
              Paste the decision you are avoiding.
            </h1>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.52)' }}>
              The system will show the pressure band, missing evidence, and next admissible move. No account required.
            </p>

            <div className="mt-8">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Example: We need to decide whether to sign the new client contract this week, but legal is still reviewing liability and the founder wants to proceed before the board call."
                rows={5}
                className="w-full border bg-white/[0.02] p-5 text-[14px] leading-[1.7] text-white placeholder:text-white/22 focus:outline-none"
                style={{
                  borderColor: input.trim() ? `${GOLD}40` : 'rgba(255,255,255,0.10)',
                  resize: 'vertical',
                  ...mono,
                }}
              />
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
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
                  {loading ? 'Reading pressure...' : 'Show pressure signal'}
                  {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                </button>

                {(result || refusal) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2"
                    style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try another
                  </button>
                )}
              </div>
            </div>

            <p className="mt-6 max-w-[60ch] text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              The public result is a derived signal only. It does not display your pasted decision back to you.
            </p>
          </div>
        </section>

        {(result || refusal) && (
          <section ref={resultRef} className="border-t px-6 py-14" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.012)' }}>
            <div className="mx-auto max-w-[760px]">
              {refusal && (
                <div className="border p-6 md:p-7" style={{ borderColor: 'rgba(248,113,113,0.22)', backgroundColor: 'rgba(248,113,113,0.035)' }}>
                  <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.82)' }}>
                    Useful refusal
                  </p>
                  <h2 className="mt-4" style={{ ...serif, fontSize: '1.8rem', lineHeight: 1.1, color: '#F5F5F5', fontStyle: 'italic' }}>
                    The input is not yet decision-grade.
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.68)' }}>
                    {refusal.reason}
                  </p>
                  <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      Next admissible input
                    </p>
                    <p className="mt-2 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.66)' }}>
                      {refusal.nextAdmissibleInput}
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div>
                  <div className="border p-6 md:p-8" style={{ borderColor: `${BAND_COLORS[result.band]}35`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>
                          Pressure band
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAND_COLORS[result.band] }} />
                          <span style={{ ...mono, fontSize: '18px', letterSpacing: '0.08em', textTransform: 'uppercase', color: BAND_COLORS[result.band] }}>
                            {result.band}
                          </span>
                        </div>
                      </div>
                      <p className="max-w-[420px] text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {result.bandReason}
                      </p>
                    </div>

                    <ResultSection label="Missing evidence">
                      <ul className="space-y-2">
                        {result.missingEvidence.map((item) => (
                          <li key={item} className="flex gap-3 text-[14px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.68)' }}>
                            <span style={{ color: `${GOLD}AA` }}>-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ResultSection>

                    <ResultSection label="Authority / ownership risk">
                      <p className="text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.68)' }}>
                        {result.authorityOwnershipRisk ?? 'No explicit authority or ownership risk was detected from the submitted wording.'}
                      </p>
                    </ResultSection>

                    <ResultSection label="Consequence / delay risk">
                      <p className="text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.68)' }}>
                        {result.consequenceDelayRisk}
                      </p>
                    </ResultSection>

                    <ResultSection label="Next admissible move">
                      <p className="text-[15px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                        {result.nextAdmissibleMove}
                      </p>
                    </ResultSection>
                  </div>

                  <div className="mt-5 border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                          Shareable compact result
                        </p>
                        <p className="mt-3 max-w-[560px] text-[13px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                          {result.compactSummary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex min-h-[40px] items-center gap-2 border px-4 py-2 transition-all hover:-translate-y-0.5"
                        style={{
                          borderColor: `${GOLD}35`,
                          color: `${GOLD}CC`,
                          ...mono,
                          fontSize: '9px',
                          letterSpacing: '0.13em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : navigatorCanShareIcon()}
                        {copied ? 'Copied' : 'Copy / share'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href="/boardroom-brief"
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
                      Generate Boardroom Brief
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/products"
                      className="inline-flex min-h-[48px] items-center gap-3 border px-7 py-3 transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: 'rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.62)',
                        ...mono,
                        fontSize: '10px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                      }}
                    >
                      View Products
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2"
                      style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share text
                    </button>
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

function navigatorCanShareIcon() {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    return <Share2 className="h-3.5 w-3.5" />
  }

  return <Copy className="h-3.5 w-3.5" />
}

function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}90`, marginBottom: '0.65rem' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
