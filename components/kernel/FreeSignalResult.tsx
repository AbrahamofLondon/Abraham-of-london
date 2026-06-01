/**
 * components/kernel/FreeSignalResult.tsx — Public Free Signal Result Display
 *
 * Renders the FREE_SIGNAL output from the Decision Intelligence Kernel.
 * Tightly controlled: no paid dossier content, no checkout, no over-selling.
 *
 * Output structure:
 * 1. Situation Class
 * 2. What the System Saw
 * 3. Primary Failure Point
 * 4. Governing Tension
 * 5. Consequence Class
 * 6. What the Full Analysis Would Map
 * 7. Direction of Minimum Viable Move
 * 8. Boundary / Review note if relevant
 */

import React from 'react'
import type { KernelSignalResponse } from '@/pages/api/public/kernel-signal'
import WhatTheSystemHeard from '@/components/living/WhatTheSystemHeard'
import { buildUserLanguageInterpretations } from '@/lib/product/user-language-interpretation'

const GOLD = '#C9A96E'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

interface FreeSignalResultProps {
  signal: KernelSignalResponse
  onReset?: () => void
  /** Original situation text — required for progressive refinement resubmit */
  originalSituation?: string
  /** Callback when progressive refinement produces an updated result */
  onRefined?: (updated: KernelSignalResponse) => void
}

export function FreeSignalResult({ signal, onReset, originalSituation, onRefined }: FreeSignalResultProps) {
  const [refining, setRefining] = React.useState(false);
  const [refineAnswer, setRefineAnswer] = React.useState('');
  const [refiningLoading, setRefiningLoading] = React.useState(false);
  const [refined, setRefined] = React.useState(false);
  const [refineError, setRefineError] = React.useState<string | null>(null);

  async function handleRefineSubmit() {
    if (!originalSituation || !signal.decisionIntelligence?.progressiveEvidenceCapture?.nextBestCapture) return;
    const fieldKey = signal.decisionIntelligence.progressiveEvidenceCapture.nextBestCapture.fieldKey;
    if (!refineAnswer.trim()) return;

    setRefiningLoading(true);
    setRefineError(null);

    // Build client-safe previous snapshot from current result
    const di = signal.decisionIntelligence;
    const previousSnapshot = {
      situationRead: di.situationRead,
      interpretedIssue: di.interpretedIssue,
      primaryContradiction: di.primaryContradiction,
      authorityState: di.authorityState,
      evidenceState: di.evidenceState,
      consequenceState: di.consequenceState,
      nextAdmissibleMove: di.nextAdmissibleMove,
      unresolvedItems: di.unresolvedItems,
      confidence: di.confidence,
    };

    try {
      const response = await fetch('/api/public/kernel-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: originalSituation,
          progressiveEvidence: {
            fieldKey,
            answer: refineAnswer.trim(),
          },
          previousDecisionIntelligence: previousSnapshot,
        }),
      });
      const json: KernelSignalResponse = await response.json();
      if (json.error) {
        setRefineError(json.error);
      } else {
        setRefined(true);
        setRefining(false);
        if (onRefined) {
          onRefined(json);
        }
      }
    } catch {
      setRefineError('Network error');
    } finally {
      setRefiningLoading(false);
    }
  }
  return (
    <div style={{ backgroundColor: 'rgb(3,3,5)', color: 'white', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[800px] px-6 py-16">
        {/* Header */}
        <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88` }}>
          Free Signal
        </p>
        <h1
          style={{
            ...serif,
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            lineHeight: 1.05,
            color: '#F5F5F5',
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            marginTop: '0.75rem',
          }}
        >
          What the system saw
        </h1>

        {/* Clarification required */}
        {signal.clarificationRequired && signal.clarificationQuestions && (
          <div className="mt-8 border border-white/[0.08] bg-white/[0.02] p-5">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${GOLD}AA`, marginBottom: '0.75rem' }}>
              Clarification needed
            </p>
            <p className="text-[14px] leading-[1.8] text-white/60">
              To provide a more accurate reading, the system needs additional context:
            </p>
            <ul className="mt-4 space-y-3">
              {signal.clarificationQuestions.map((q, i) => (
                <li key={i} className="border-l-2 border-white/[0.08] pl-4">
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                    {q.domain}
                  </p>
                  <p className="mt-1 text-[14px] leading-[1.7] text-white/70">{q.question}</p>
                </li>
              ))}
            </ul>
            {onReset && (
              <button
                onClick={onReset}
                className="mt-5 inline-flex items-center gap-2 border px-5 py-3 text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}10`,
                  color: '#F5F5F5',
                  ...mono,
                  letterSpacing: '0.12em',
                }}
              >
                Return and clarify
              </button>
            )}
          </div>
        )}

        {/* Situation Class */}
        {signal.situationClass && !signal.clarificationRequired && (
          <Section label="Situation Class">
            <Badge>{signal.situationClass}</Badge>
          </Section>
        )}

        {/* What the System Saw */}
        {signal.whatTheSystemSaw && !signal.clarificationRequired && (
          <Section label="What the System Saw">
            <p className="text-[15px] leading-[1.85] text-white/70">{signal.whatTheSystemSaw}</p>
          </Section>
        )}

        {/* What the system heard — user's own words with derived interpretations */}
        {!signal.clarificationRequired && (() => {
          const quotes = signal.userLanguageEvidence ?? []
          const interpretations = buildUserLanguageInterpretations({
            quotes,
            situationClass: signal.situationClass,
            primaryFailurePoint: signal.primaryFailurePoint,
            governingTension: signal.governingTension,
            consequenceClass: signal.consequenceClass,
            directionOfMinimumViableMove: signal.directionOfMinimumViableMove,
          })
          return (
            <div className="mt-6">
              <WhatTheSystemHeard
                quotes={quotes}
                interpretations={interpretations}
                contextLabel="Fast Diagnostic"
                variant="dark"
              />
            </div>
          )
        })()}

        {/* Decision Intelligence — derived interpretation, contradiction, simulation */}
        {signal.decisionIntelligence && !signal.clarificationRequired && (
          <div className="mt-8 border-t border-white/[0.06] pt-6">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88`, marginBottom: '12px' }}>
              Decision intelligence
            </p>

            {/* Situation read */}
            <p className="text-[14px] leading-[1.8] text-white/70">
              {signal.decisionIntelligence.situationRead}
            </p>

            {/* Core contradiction */}
            {signal.decisionIntelligence.primaryContradiction && (
              <div className="mt-4 border-l-2 border-amber-500/30 pl-4">
                <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}88`, marginBottom: '4px' }}>
                  Core contradiction
                </p>
                <p className="text-[14px] leading-[1.8] text-white/70">
                  {signal.decisionIntelligence.primaryContradiction}
                </p>
              </div>
            )}

            {/* Simulation paths */}
            {signal.decisionIntelligence.simulationPaths.length > 0 && (
              <div className="mt-4 space-y-2">
                <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}88`, marginBottom: '4px' }}>
                  Simulated paths
                </p>
                {signal.decisionIntelligence.simulationPaths.map((path, i) => (
                  <div key={i} className="border-l-2 pl-3 py-1" style={{
                    borderColor: path.admissible ? 'rgba(110,231,183,0.30)' : 'rgba(252,165,165,0.30)',
                  }}>
                    <div className="flex items-center gap-2">
                      <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: path.admissible ? 'rgba(110,231,183,0.60)' : 'rgba(252,165,165,0.60)' }}>
                        {path.label}
                      </span>
                      <span style={{ ...mono, fontSize: '7px', color: 'rgba(255,255,255,0.25)' }}>
                        Risk: {path.riskShift.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.6] text-white/50">
                      {path.likelyOutcome}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Next admissible move */}
            <div className="mt-4 border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA`, marginBottom: '4px' }}>
                Next admissible move
              </p>
              <p className="text-[14px] leading-[1.8] text-white/75">
                {signal.decisionIntelligence.nextAdmissibleMove}
              </p>
            </div>

            {/* Unresolved items */}
            {signal.decisionIntelligence.unresolvedItems.length > 0 && (
              <div className="mt-4">
                <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: '4px' }}>
                  What remains unresolved
                </p>
                {signal.decisionIntelligence.unresolvedItems.map((item, i) => (
                  <p key={i} className="text-[12px] leading-[1.6] text-white/40">
                    {item}
                  </p>
                ))}
              </div>
            )}

            {/* Refusal */}
            {signal.decisionIntelligence.refusalReason && (
              <div className="mt-4 border border-red-500/20 bg-red-500/[0.03] p-4">
                <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(252,165,165,0.70)', marginBottom: '4px' }}>
                  System refusal
                </p>
                <p className="text-[13px] leading-[1.7] text-white/50">
                  {signal.decisionIntelligence.refusalReason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Primary Failure Point */}
        {signal.primaryFailurePoint && !signal.clarificationRequired && (
          <Section label="Primary Failure Point">
            <p className="text-[15px] leading-[1.85] text-white/70">{signal.primaryFailurePoint}</p>
          </Section>
        )}

        {/* Governing Tension */}
        {signal.governingTension && !signal.clarificationRequired && (
          <Section label="Governing Tension">
            <p className="text-[15px] leading-[1.85] text-white/70">{signal.governingTension}</p>
          </Section>
        )}

        {/* Consequence Class */}
        {signal.consequenceClass && !signal.clarificationRequired && (
          <Section label="Consequence Class">
            <Badge severity={signal.consequenceClass}>{signal.consequenceClass}</Badge>
          </Section>
        )}

        {/* What the Full Analysis Would Map */}
        {signal.whatFullAnalysisWouldMap.length > 0 && !signal.clarificationRequired && (
          <Section label="What the Full Analysis Would Map">
            <ul className="space-y-1.5">
              {signal.whatFullAnalysisWouldMap.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] leading-[1.7] text-white/60">
                  <span style={{ color: `${GOLD}88` }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Direction of Minimum Viable Move */}
        {signal.directionOfMinimumViableMove && !signal.clarificationRequired && (
          <Section label="Direction of Minimum Viable Move">
            <p className="text-[15px] leading-[1.85] text-white/70">{signal.directionOfMinimumViableMove}</p>
          </Section>
        )}

        {/* Alternative Classes */}
        {signal.alternativeClasses && signal.alternativeClasses.length > 0 && !signal.clarificationRequired && (
          <Section label="Alternative Classifications Considered">
            <div className="space-y-2">
              {signal.alternativeClasses.map((alt, i) => (
                <div key={i} className="border-l-2 border-white/[0.06] pl-3">
                  <p className="text-[13px] leading-[1.6] text-white/60">
                    <span style={{ color: `${GOLD}AA` }}>{alt.decisionClass}</span>
                    <span className="text-white/40"> ({alt.confidence})</span>
                  </p>
                  <p className="text-[12px] leading-[1.5] text-white/40">{alt.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Surfaced Dimensions */}
        {signal.surfacedDimensions.length > 0 && !signal.clarificationRequired && (
          <Section label="Dimensions Surfaced">
            <div className="flex flex-wrap gap-2">
              {signal.surfacedDimensions.map((dim, i) => (
                <span
                  key={i}
                  className="inline-block border px-3 py-1 text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor: `${GOLD}30`,
                    color: `${GOLD}AA`,
                    ...mono,
                    letterSpacing: '0.12em',
                  }}
                >
                  {dim}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Preserved Ambiguities */}
        {signal.preservedAmbiguities.length > 0 && !signal.clarificationRequired && (
          <Section label="Ambiguities Preserved">
            <p className="text-[13px] leading-[1.7] text-white/50 italic">
              The system has identified areas where the situation is not yet clear enough for a definitive classification:
            </p>
            <ul className="mt-2 space-y-1">
              {signal.preservedAmbiguities.map((amb, i) => (
                <li key={i} className="text-[13px] leading-[1.6] text-white/50">
                  • {amb.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Boundary Note */}
        {signal.boundaryNote && !signal.clarificationRequired && (
          <Section label="Regulatory Boundary">
            <div className="border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-[13px] leading-[1.7] text-amber-300/80">{signal.boundaryNote}</p>
            </div>
          </Section>
        )}

        {/* Review Note */}
        {signal.reviewNote && !signal.clarificationRequired && (
          <Section label="Review Note">
            <div className="border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-[13px] leading-[1.7] text-white/50">{signal.reviewNote}</p>
            </div>
          </Section>
        )}

        {/* Adversarial Preview — one specific challenge */}
        {signal.adversarialPreview && !signal.clarificationRequired && (
          <Section label="How this would be attacked">
            <p className="text-[13px] leading-[1.7] text-white/50 italic">
              If this decision were reviewed under pressure, this is the first weakness likely to be challenged.
            </p>
            <div className="mt-3 border-l-2 border-red-500/30 pl-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-red-400/70">
                {signal.adversarialPreview.label}
                {signal.adversarialPreview.challengedBy && (
                  <> — challenged by {signal.adversarialPreview.challengedBy}</>
                )}
              </p>
              <p className="mt-2 text-[14px] leading-[1.8] text-white/70">
                {signal.adversarialPreview.challenge}
              </p>
              <p className="mt-2 text-[12px] leading-[1.6] text-white/40">
                {signal.adversarialPreview.whyItMatters}
              </p>
            </div>
            <p className="mt-4 text-[12px] leading-[1.6] text-white/30">
              A Full Dossier maps the complete attack surface and defensive position.
            </p>
          </Section>
        )}

        {/* Progressive Evidence Capture — next best question with inline refinement */}
        {signal.decisionIntelligence?.progressiveEvidenceCapture?.nextBestCapture && !signal.clarificationRequired && !refined && (
          <Section label="To sharpen this reading">
            <div className="border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <p className="text-[15px] leading-[1.8] text-white/80" style={{ ...serif, fontStyle: 'italic' }}>
                {signal.decisionIntelligence.progressiveEvidenceCapture.nextBestCapture.question}
              </p>
              <p className="mt-3 text-[12px] leading-[1.6] text-white/40">
                {signal.decisionIntelligence.progressiveEvidenceCapture.nextBestCapture.reason}
              </p>
              {signal.decisionIntelligence.progressiveEvidenceCapture.nextBestCapture.unlocksEngines.length > 0 && (
                <p className="mt-2 text-[11px] leading-[1.5] text-white/30">
                  This would allow the system to test: {signal.decisionIntelligence.progressiveEvidenceCapture.nextBestCapture.unlocksEngines.length} additional dimension(s) of your decision situation.
                </p>
              )}

              {refining && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={refineAnswer}
                    onChange={(e) => setRefineAnswer(e.target.value)}
                    rows={2}
                    placeholder="Your answer..."
                    className="w-full border bg-white/[0.02] p-3 text-[13px] leading-[1.6] text-white/70"
                    style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical' }}
                  />
                  {refineError && (
                    <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.10em', color: 'rgba(252,165,165,0.62)' }}>
                      {refineError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setRefining(false); setRefineAnswer(''); setRefineError(null); }}
                      disabled={refiningLoading}
                      style={{
                        ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.10)',
                        backgroundColor: 'transparent', padding: '6px 12px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRefineSubmit}
                      disabled={refiningLoading || !refineAnswer.trim()}
                      style={{
                        ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: refiningLoading ? 'rgba(255,255,255,0.20)' : `${GOLD}CC`,
                        border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}0E`,
                        padding: '6px 12px', cursor: refiningLoading ? 'default' : 'pointer',
                      }}
                    >
                      {refiningLoading ? 'Sharpening...' : 'Sharpen reading'}
                    </button>
                  </div>
                </div>
              )}

              {!refining && originalSituation && (
                <button
                  type="button"
                  onClick={() => setRefining(true)}
                  style={{
                    ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: `${GOLD}AA`, border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}08`,
                    padding: '6px 12px', cursor: 'pointer', marginTop: '8px',
                  }}
                >
                  Answer this
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Refined evidence acknowledgement with result-derived delta */}
        {refined && (
          <Section label="Evidence incorporated">
            <div className="border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <p className="text-[13px] leading-[1.7] text-white/60">
                The system has incorporated this evidence into the reading.
              </p>
              {signal.decisionIntelligence?.progressiveEvidenceDelta && (
                <div className="mt-3 border-t border-emerald-500/10 pt-3">
                  <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(110,231,183,0.55)' }}>
                    What changed
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.7] text-white/60">
                    {signal.decisionIntelligence.progressiveEvidenceDelta.whatChanged}
                  </p>
                  {signal.decisionIntelligence.progressiveEvidenceDelta.changedFields.length > 0 && (
                    <p className="mt-2 text-[11px] leading-[1.5] text-white/30">
                      {signal.decisionIntelligence.progressiveEvidenceDelta.changedFields.length} aspect(s) of the reading updated.
                    </p>
                  )}
                  {signal.decisionIntelligence.progressiveEvidenceDelta.newlyEligibleEngines.length > 0 && (
                    <p className="mt-1 text-[11px] leading-[1.5] text-white/25">
                      This allowed the system to test an additional decision dimension.
                    </p>
                  )}
                  {signal.decisionIntelligence.progressiveEvidenceDelta.remainingMissingFields.length > 0 && (
                    <p className="mt-1 text-[11px] leading-[1.5] text-white/25">
                      {signal.decisionIntelligence.progressiveEvidenceDelta.remainingMissingFields.length} input(s) remain unresolved.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* CTA — restrained */}
        {!signal.clarificationRequired && (
          <div className="mt-12 border-t border-white/[0.06] pt-8">
            <p className="text-[12px] leading-[1.7] text-white/40" style={{ ...mono, fontSize: '9px', letterSpacing: '0.14em' }}>
              This is a free signal — a perception check, not a full analysis.
            </p>
            <p className="mt-2 text-[12px] leading-[1.7] text-white/30">
              A full governed analysis would map the authority structure, obligation landscape,
              constraint graph, evidence quality, adversarial challenges, and minimum viable path.
            </p>
            {onReset && (
              <button
                onClick={onReset}
                className="mt-5 inline-flex items-center gap-2 border px-5 py-3 text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: `${GOLD}30`,
                  color: `${GOLD}AA`,
                  ...mono,
                  letterSpacing: '0.12em',
                }}
              >
                Test another situation
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <p className="text-[11px] leading-[1.7] text-white/25">
            This is not professional, legal, tax, or financial advice. The system provides
            a structured perception check only. No decision should be made solely on the
            basis of this free signal. Full governed analysis requires an active case.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-white/[0.06] pt-6">
      <p
        style={{
          ...mono,
          fontSize: '8px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: `${GOLD}70`,
          marginBottom: '0.75rem',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Badge({ children, severity }: { children: React.ReactNode; severity?: string }) {
  const color = severity === 'CRITICAL' ? '#EF4444' : severity === 'HIGH' ? '#F59E0B' : severity === 'MEDIUM' ? '#3B82F6' : `${GOLD}AA`
  return (
    <span
      className="inline-block border px-3 py-1 text-[11px] uppercase tracking-wider"
      style={{
        borderColor: `${color}40`,
        color,
        ...mono,
        letterSpacing: '0.14em',
      }}
    >
      {children}
    </span>
  )
}
