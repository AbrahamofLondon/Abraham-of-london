/**
 * pages/lab/living-case.tsx — Living Layer v1.7 Lab Surface
 *
 * Private/internal test surface for the live case loop.
 * Not linked from the homepage or public funnel.
 *
 * Uses the Living Layer Stream hook for governed stage streaming,
 * the view model builder for safe UI data, and the LivingLayerShell
 * to render the existing living components from real runtime data.
 *
 * The lab page now demonstrates:
 * - governed runtime trace showing stage progression
 * - the user's words being interpreted
 * - the case state changing across turns
 * - evidence strength moving carefully
 * - simulation paths being reflected in governed action
 * - next layer unlock logic
 * - decision memory beginning to appear
 */

import React, { useCallback, useRef } from 'react'
import Head from 'next/head'
import { ArrowRight, RefreshCw, Layers, Eye, GitBranch, AlertTriangle, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { WhatSystemNoticedBlock } from '@/components/kernel/WhatSystemNoticedBlock'
import LivingLayerShell from '@/components/living/LivingLayerShell'
import { useLivingLayerStream } from '@/hooks/useLivingLayerStream'
import type { LivingStreamStage } from '@/lib/kernel/living-stream-events'

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

// ─── Stage Display Configuration ─────────────────────────────────────────────

const STAGE_DISPLAY: Record<LivingStreamStage, { label: string; order: number }> = {
  received: { label: 'Input received', order: 1 },
  interpreting: { label: 'Interpreting situation', order: 2 },
  signals_detected: { label: 'Signals detected', order: 3 },
  continuity_checked: { label: 'Continuity checked', order: 4 },
  simulation_running: { label: 'Comparing possible paths', order: 5 },
  synthesis_running: { label: 'Synthesising next admissible move', order: 6 },
  completed: { label: 'Result ready', order: 7 },
  refused: { label: 'Result ready', order: 7 },
  error: { label: 'Error', order: 99 },
}

const STAGE_ORDER: LivingStreamStage[] = [
  'received',
  'interpreting',
  'signals_detected',
  'continuity_checked',
  'simulation_running',
  'synthesis_running',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function LivingCaseLabPage() {
  const [input, setInput] = React.useState('')
  const [showDebug, setShowDebug] = React.useState(false)
  const { state, submitTurn, resetSession } = useLivingLayerStream()
  const resultRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const turnCount = state.context?.turns.filter(t => t.role === 'user').length ?? 0

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || state.isStreaming) return

    await submitTurn(input.trim())
    setInput('')

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }, [input, state.isStreaming, submitTurn])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleReset = useCallback(() => {
    resetSession()
    setInput('')
    setShowDebug(false)
  }, [resetSession])

  const riskColor = state.synthesis?.currentRisk === 'CRITICAL' ? ROSE :
    state.synthesis?.currentRisk === 'HIGH' ? AMBER :
    state.synthesis?.currentRisk === 'MEDIUM' ? `${GOLD}CC` :
    EMERALD

  // Determine which stages are completed, current, or pending
  const completedStages = new Set(
    state.events
      .filter(e => e.type === 'stage')
      .map(e => (e as any).stage as LivingStreamStage)
  )

  return (
    <Layout
      title="Living Case Lab | Abraham of London"
      description="Internal test surface for the Living Layer v1.7"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        {/* Header */}
        <section className="px-6 pb-6 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[760px]">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4" style={{ color: `${GOLD}88` }} />
              <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                Living Case Lab
              </span>
              <span className="border px-2 py-0.5" style={{ ...mono, fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.10)' }}>
                v1.7
              </span>
            </div>
            <h1
              className="mt-4"
              style={{
                ...serif,
                fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                lineHeight: 1.04,
                color: '#F5F5F5',
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
              }}
            >
              Test the governed decision loop
            </h1>
            <p className="mt-3 text-[14px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              This is an internal test surface. Submit a decision description, then refine it across turns.
              The system remembers what you said, detects what changed, simulates consequences, and recommends the next move.
            </p>
            {state.context && (
              <div className="mt-4 flex items-center gap-4">
                <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.30)' }}>
                  Session: {state.context.sessionId}
                </span>
                <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.30)' }}>
                  Turns: {turnCount}
                </span>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5"
                  style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}AA` }}
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset session
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Input */}
        <section className="border-t px-6 py-8" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="mx-auto max-w-[760px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={turnCount === 0
                ? 'Describe a decision you are facing... e.g. "We need to decide whether to acquire the competitor, but the board is split and the CEO wants to move fast while legal is still reviewing the exposure."'
                : 'Add more detail, clarify a point, or answer the system\'s question...'}
              rows={4}
              className="w-full border bg-white/[0.02] p-5 text-[14px] leading-[1.7] text-white placeholder:text-white/20 focus:outline-none"
              style={{
                borderColor: input.trim() ? `${GOLD}40` : 'rgba(255,255,255,0.10)',
                resize: 'vertical',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '12px',
              }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || state.isStreaming}
                className="group inline-flex min-h-[44px] items-center gap-3 border px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  borderColor: `${GOLD}50`,
                  backgroundColor: `${GOLD}15`,
                  color: '#F5F5F5',
                  ...mono,
                  fontSize: '9px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {state.isStreaming ? 'Processing...' : turnCount === 0 ? 'Start case' : 'Refine case'}
                {!state.isStreaming && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
              </button>
              <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.20)' }}>
                {turnCount === 0 ? 'First turn' : `Turn ${turnCount + 1}`} · {state.context ? 'Context active' : 'No context'}
              </span>
            </div>
            {state.error && (
              <div className="mt-4 border p-4" style={{ borderColor: `${ROSE}30`, backgroundColor: `${ROSE}08` }}>
                <p className="text-[13px] leading-[1.6]" style={{ color: `${ROSE}CC` }}>{state.error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Governed Runtime Trace — shown while streaming or after result */}
        {(state.isStreaming || state.viewModel) && (
          <section className="border-t px-6 py-8" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="mx-auto max-w-[760px]">
              <div className="border p-5" style={{ borderColor: `${GOLD}20`, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <Layers className="h-3.5 w-3.5" style={{ color: `${GOLD}AA` }} />
                  <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    Governed runtime trace
                  </span>
                </div>

                <div className="space-y-2">
                  {STAGE_ORDER.map((stageKey) => {
                    const display = STAGE_DISPLAY[stageKey]
                    const isCompleted = completedStages.has(stageKey)
                    const isCurrent = state.currentStage === stageKey && state.isStreaming
                    const isPending = !isCompleted && !isCurrent

                    return (
                      <div key={stageKey} className="flex items-center gap-3">
                        {/* Status indicator */}
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5" style={{ color: EMERALD }} />
                          ) : isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: GOLD }} />
                          ) : (
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                          )}
                        </div>

                        {/* Label */}
                        <span
                          style={{
                            ...mono,
                            fontSize: '9px',
                            letterSpacing: '0.12em',
                            color: isCompleted ? EMERALD : isCurrent ? GOLD : 'rgba(255,255,255,0.25)',
                            transition: 'color 0.3s ease',
                          }}
                        >
                          {display.label}
                        </span>

                        {/* Current indicator */}
                        {isCurrent && (
                          <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.1em', color: `${GOLD}66` }}>
                            Current stage
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {/* Final result indicator */}
                  {state.viewModel && !state.isStreaming && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] mt-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Check className="h-3.5 w-3.5" style={{ color: EMERALD }} />
                      </div>
                      <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.12em', color: EMERALD }}>
                        {STAGE_DISPLAY[state.synthesis?.shouldRefuse ? 'refused' : 'completed'].label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {state.viewModel && state.noticed && state.synthesis && (
          <section ref={resultRef} className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <div className="mx-auto max-w-[760px] space-y-8">
              {/* Risk badge */}
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskColor }} />
                <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: riskColor }}>
                  {state.synthesis.currentRisk}
                </span>
                {state.synthesis.shouldRefuse && (
                  <span className="border px-2 py-0.5" style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${ROSE}AA`, borderColor: `${ROSE}30` }}>
                    Refusal triggered
                  </span>
                )}
              </div>

              {/* What the system noticed */}
              <WhatSystemNoticedBlock
                variant="compact"
                situationSummary={state.noticed.situationSummary}
                actors={state.noticed.actors}
                detectedSignals={state.noticed.detectedSignals}
                hiddenStakes={state.noticed.hiddenStakes}
                ambiguities={state.noticed.ambiguities}
                underestimatedRisk={state.noticed.underestimatedRisk}
                nextDiagnosticWouldMap={state.noticed.deeperAnalysisWouldMap}
              />

              {/* Living Layer Shell — the living components powered by real runtime data */}
              <LivingLayerShell viewModel={state.viewModel} />

              {/* Debug section — collapsible, behind <details> */}
              <details
                className="border"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                open={showDebug}
                onToggle={(e) => setShowDebug((e.target as HTMLDetailsElement).open)}
              >
                <summary
                  className="flex cursor-pointer items-center gap-2 p-4 text-[11px]"
                  style={{ ...mono, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.30)' }}
                >
                  {showDebug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Raw debug data
                </summary>
                <div className="border-t p-4 space-y-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {/* What changed (synthesis) */}
                  {state.synthesis.whatChanged && (
                    <div className="border p-4" style={{ borderColor: `${GOLD}15`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3" style={{ color: `${GOLD}77` }} />
                        <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}77` }}>
                          What changed (synthesis)
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                        {state.synthesis.whatChanged}
                      </p>
                    </div>
                  )}

                  {/* Simulation paths */}
                  {state.simulation && state.simulation.paths.length > 0 && (
                    <div className="border p-4" style={{ borderColor: `${GOLD}15`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3" style={{ color: `${GOLD}77` }} />
                        <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}77` }}>
                          Simulation paths
                        </span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {state.simulation.paths.map((path, i) => (
                          <div key={path.assumptionId} className="border-l-2 pl-3 py-2" style={{ borderColor: path.shouldProceed ? `${EMERALD}40` : `${ROSE}30` }}>
                            <div className="flex items-center gap-2">
                              <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: path.shouldProceed ? `${EMERALD}AA` : `${ROSE}AA` }}>
                                Path {i + 1}: {path.assumptionLabel}
                              </span>
                              <span style={{ ...mono, fontSize: '7px', color: 'rgba(255,255,255,0.25)' }}>
                                Risk: {path.riskShift}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              {path.likelyOutcome}
                            </p>
                            {!path.shouldProceed && path.refusalReason && (
                              <p className="mt-0.5 text-[11px] leading-[1.5]" style={{ color: `${ROSE}99` }}>
                                ⚠ {path.refusalReason}
                              </p>
                            )}
                            <p className="mt-0.5 text-[11px] leading-[1.5]" style={{ color: `${GOLD}99` }}>
                              Next: {path.nextAdmissibleMove}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Synthesis detail */}
                  <div className="border p-4" style={{ borderColor: `${GOLD}15`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div className="flex items-center gap-2">
                      <Layers className="h-3 w-3" style={{ color: `${GOLD}77` }} />
                      <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}77` }}>
                        Synthesis
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {state.synthesis.situationRead}
                    </p>
                    {state.synthesis.nextQuestion && (
                      <div className="mt-2 flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" style={{ color: `${GOLD}66` }} />
                        <p className="text-[12px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {state.synthesis.nextQuestion}
                        </p>
                      </div>
                    )}
                    <div className="mt-2">
                      <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', color: `${GOLD}88` }}>
                        Next admissible move:
                      </span>
                      <p className="text-[12px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                        {state.synthesis.nextAdmissibleMove}
                      </p>
                    </div>
                    {state.synthesis.shouldRefuse && state.synthesis.refusalReason && (
                      <div className="mt-2 border p-3" style={{ borderColor: `${ROSE}20`, backgroundColor: `${ROSE}04` }}>
                        <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${ROSE}AA` }}>
                          System refusal
                        </span>
                        <p className="mt-0.5 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                          {state.synthesis.refusalReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Turn history */}
                  {state.context && state.context.turns.length > 0 && (
                    <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                        Turn history ({state.context.turns.length})
                      </span>
                      <div className="mt-2 space-y-1.5">
                        {state.context.turns.map((turn) => (
                          <div
                            key={turn.id}
                            className="border-l-2 p-2.5"
                            style={{
                              borderColor: turn.role === 'user' ? `${GOLD}30` : 'rgba(255,255,255,0.08)',
                              backgroundColor: turn.role === 'user' ? 'rgba(255,255,255,0.015)' : 'transparent',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: turn.role === 'user' ? `${GOLD}88` : 'rgba(255,255,255,0.30)' }}>
                                {turn.role === 'user' ? 'You' : 'System'}
                              </span>
                              <span style={{ ...mono, fontSize: '7px', color: 'rgba(255,255,255,0.15)' }}>
                                {new Date(turn.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-[1.5]" style={{ color: turn.role === 'user' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.40)' }}>
                              {turn.content.length > 200 ? turn.content.slice(0, 200) + '...' : turn.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
