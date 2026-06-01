/**
 * pages/enterprise-decision-scan.tsx — Organisational Decision Scan
 *
 * A separate B2B entry path for CEOs, COOs, founders, boards, chiefs of staff,
 * transformation leads, and operating partners.
 *
 * Does not force enterprise buyers through the individual diagnostic ladder.
 * Returns a board-facing summary and recommended entry path.
 */

import React, { useState, useCallback, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowRight, RefreshCw, FileText, Users, Building2, Crown, ShieldCheck } from 'lucide-react'
import Layout from '@/components/Layout'
import { track } from '@/lib/analytics/track'

const GOLD = '#C9A96E'
const EMERALD = '#6EE7B7'
const AMBER = '#F59E0B'
const ROSE = '#FB7185'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

type OrgLevel = 'INDIVIDUAL' | 'TEAM' | 'BOARD' | 'ENTERPRISE'
type ExposureType = 'NONE' | 'DEADLINE' | 'FINANCIAL' | 'CLIENT' | 'LEGAL' | 'REPUTATIONAL' | 'EXISTENTIAL'
type CostBand = 'LOW' | 'MATERIAL' | 'SERIOUS' | 'BOARD_LEVEL' | 'EXISTENTIAL'

interface ScanInput {
  unresolvedDecision: string
  owner: string
  blocker: string
  delayConsequence: string
  existingEvidence: string
  missingEvidence: string
  disagreement: string
  whatHasBeenTried: string
  orgLevel: OrgLevel
  exposureType: ExposureType
}

interface ScanResult {
  topDecisionRisk: string
  primaryContradiction: string
  costBand: CostBand
  recommendedPath: string
  recommendedHref: string
  boardSummary: string
}

const COST_LABELS: Record<CostBand, string> = {
  LOW: 'Low',
  MATERIAL: 'Material',
  SERIOUS: 'Serious',
  BOARD_LEVEL: 'Board-level',
  EXISTENTIAL: 'Existential',
}

const COST_COLORS: Record<CostBand, string> = {
  LOW: EMERALD,
  MATERIAL: `${GOLD}CC`,
  SERIOUS: AMBER,
  BOARD_LEVEL: ROSE,
  EXISTENTIAL: '#EF4444',
}

function computeScan(input: ScanInput): ScanResult {
  const wordCount = input.unresolvedDecision.split(/\s+/).length
  const hasFinancialExposure = /\b(revenue|cost|budget|pricing|investment|loss|penalty|fine|liability)\b/i.test(input.unresolvedDecision + ' ' + input.delayConsequence)
  const hasLegalExposure = /\b(legal|regulatory|compliance|statute|regulation|law|solicitor|counsel|litigation)\b/i.test(input.unresolvedDecision + ' ' + input.delayConsequence)
  const hasClientExposure = /\b(client|customer|contract|obligation|service.?level|SLA|partnership)\b/i.test(input.unresolvedDecision)
  const hasReputationalExposure = /\b(reputation|public|media|press|board|investor|market|shareholder)\b/i.test(input.unresolvedDecision)
  const hasDeadline = /\b(deadline|urgent|immediate|today|tomorrow|overdue|ASAP)\b/i.test(input.unresolvedDecision)

  // Determine cost band
  let costScore = 0
  if (input.exposureType === 'EXISTENTIAL') costScore += 10
  if (input.exposureType === 'LEGAL') costScore += 7
  if (input.exposureType === 'REPUTATIONAL') costScore += 5
  if (input.exposureType === 'FINANCIAL') costScore += 4
  if (input.exposureType === 'CLIENT') costScore += 3
  if (input.exposureType === 'DEADLINE') costScore += 2
  if (hasDeadline) costScore += 1
  if (hasFinancialExposure) costScore += 2
  if (hasLegalExposure) costScore += 3
  if (hasClientExposure) costScore += 2
  if (hasReputationalExposure) costScore += 2
  if (input.orgLevel === 'ENTERPRISE') costScore += 3
  if (input.orgLevel === 'BOARD') costScore += 2

  const costBand: CostBand =
    costScore >= 12 ? 'EXISTENTIAL' :
    costScore >= 8 ? 'BOARD_LEVEL' :
    costScore >= 5 ? 'SERIOUS' :
    costScore >= 3 ? 'MATERIAL' :
    'LOW'

  // Determine primary contradiction
  const hasAuthorityGap = /\b(who|approval|permission|sign.?off|authority|mandate|escalat|block)\b/i.test(input.unresolvedDecision + ' ' + input.blocker)
  const hasEvidenceGap = input.missingEvidence.trim().length > 10
  const hasExecutionGap = /\b(stuck|stalled|delay|avoid|circl|frozen|can't|not done)\b/i.test(input.unresolvedDecision)
  const hasDisagreement = input.disagreement.trim().length > 10

  let primaryContradiction: string
  if (hasAuthorityGap && hasDisagreement) {
    primaryContradiction = 'Authority conflict combined with unresolved disagreement — the decision is blocked because no one can both decide and enforce.'
  } else if (hasAuthorityGap) {
    primaryContradiction = 'Authority gap — the decision has been identified but no accountable owner has been confirmed.'
  } else if (hasEvidenceGap) {
    primaryContradiction = 'Evidence gap — the decision is being discussed without the evidence needed to make it responsibly.'
  } else if (hasExecutionGap) {
    primaryContradiction = 'Execution drift — the decision has been made in principle but has not been translated into action.'
  } else if (hasDisagreement) {
    primaryContradiction = 'Stakeholder contradiction — the parties involved hold incompatible positions that have not been surfaced.'
  } else {
    primaryContradiction = 'Unstructured decision process — the decision is being managed informally without governed progression.'
  }

  // Determine recommended path
  let recommendedPath: string
  let recommendedHref: string

  if (costBand === 'EXISTENTIAL' || costBand === 'BOARD_LEVEL') {
    if (input.orgLevel === 'ENTERPRISE' || input.orgLevel === 'BOARD') {
      recommendedPath = 'Executive Reporting — board-grade synthesis'
      recommendedHref = '/diagnostics/executive-reporting'
    } else {
      recommendedPath = 'Strategy Room — governed intervention session'
      recommendedHref = '/strategy-room'
    }
  } else if (costBand === 'SERIOUS') {
    if (input.orgLevel === 'TEAM' || input.orgLevel === 'ENTERPRISE') {
      recommendedPath = 'Enterprise Assessment — organisational structural reading'
      recommendedHref = '/diagnostics/enterprise-assessment'
    } else {
      recommendedPath = 'Team Assessment — multi-respondent alignment'
      recommendedHref = '/diagnostics/team-assessment'
    }
  } else {
    recommendedPath = 'Fast Diagnostic — first governed reading'
    recommendedHref = '/diagnostics/fast'
  }

  // Board summary
  const boardSummary = `This organisational scan identified a ${COST_LABELS[costBand].toLowerCase()} decision risk involving "${input.unresolvedDecision.length > 80 ? input.unresolvedDecision.substring(0, 80) + '...' : input.unresolvedDecision}". The primary contradiction is: ${primaryContradiction}. The recommended entry path is ${recommendedPath}.`

  return {
    topDecisionRisk: input.unresolvedDecision.length > 100 ? input.unresolvedDecision.substring(0, 100) + '...' : input.unresolvedDecision,
    primaryContradiction,
    costBand,
    recommendedPath,
    recommendedHref,
    boardSummary,
  }
}

export default function EnterpriseDecisionScanPage() {
  const [input, setInput] = useState<ScanInput>({
    unresolvedDecision: '',
    owner: '',
    blocker: '',
    delayConsequence: '',
    existingEvidence: '',
    missingEvidence: '',
    disagreement: '',
    whatHasBeenTried: '',
    orgLevel: 'ENTERPRISE',
    exposureType: 'FINANCIAL',
  })
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const updateField = useCallback(<K extends keyof ScanInput>(field: K, value: ScanInput[K]) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!input.unresolvedDecision.trim()) return

    setLoading(true)
    setTimeout(() => {
      const r = computeScan(input)
      setResult(r)
      setLoading(false)
      track('enterprise_scan_completed', { costBand: r.costBand, orgLevel: input.orgLevel })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }, 800)
  }, [input])

  const handleReset = useCallback(() => {
    setResult(null)
    setInput({
      unresolvedDecision: '',
      owner: '',
      blocker: '',
      delayConsequence: '',
      existingEvidence: '',
      missingEvidence: '',
      disagreement: '',
      whatHasBeenTried: '',
      orgLevel: 'ENTERPRISE',
      exposureType: 'FINANCIAL',
    })
  }, [])

  const costColor = result ? COST_COLORS[result.costBand] : GOLD

  return (
    <Layout
      title="Organisational Decision Scan | Abraham of London"
      description="A 15-minute scan for leadership teams facing unresolved decisions, execution drift, or governance pressure. Returns a board-facing summary and recommended entry path."
      canonicalUrl="/enterprise-decision-scan"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="Organisational Decision Scan — a 15-minute scan for leadership teams. Returns a board-facing summary with cost band, primary contradiction, and recommended entry path." />
        <meta property="og:title" content="Organisational Decision Scan — Abraham of London" />
        <meta property="og:description" content="A 15-minute scan for leadership teams facing unresolved decisions." />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        {/* Header */}
        <section className="px-6 pb-8 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[700px]">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
              For organisations
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
              Organisational Decision Scan
            </h1>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              A 15-minute scan for leadership teams facing unresolved decisions, execution drift, or governance pressure.
              Returns a board-facing summary with cost band, primary contradiction, and recommended entry path.
            </p>
            <p className="mt-3 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              This is not a consumer quiz. It is a serious institutional intake. Tone is restrained, executive, forensic.
            </p>
          </div>
        </section>

        {/* Input form */}
        {!result && (
          <section className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="mx-auto max-w-[700px]">
              <div className="space-y-6">
                {/* Question 1 */}
                <div>
                  <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    What decision is currently unresolved?
                  </label>
                  <textarea
                    value={input.unresolvedDecision}
                    onChange={(e) => updateField('unresolvedDecision', e.target.value)}
                    rows={3}
                    className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] leading-[1.7] text-white placeholder:text-white/20 focus:outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                    placeholder="Describe the decision that is stuck, delayed, or under pressure..."
                  />
                </div>

                {/* Questions 2-3 side by side */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      Who owns it?
                    </label>
                    <input
                      type="text"
                      value={input.owner}
                      onChange={(e) => updateField('owner', e.target.value)}
                      className="mt-2 w-full border bg-white/[0.02] p-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="Named owner or 'unknown'"
                    />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      Who can block it?
                    </label>
                    <input
                      type="text"
                      value={input.blocker}
                      onChange={(e) => updateField('blocker', e.target.value)}
                      className="mt-2 w-full border bg-white/[0.02] p-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="Individual, group, or 'none'"
                    />
                  </div>
                </div>

                {/* Question 4 */}
                <div>
                  <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    What happens if it is delayed by 30 days?
                  </label>
                  <textarea
                    value={input.delayConsequence}
                    onChange={(e) => updateField('delayConsequence', e.target.value)}
                    rows={2}
                    className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                    placeholder="Financial, legal, client, or reputational exposure..."
                  />
                </div>

                {/* Questions 5-6 side by side */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      What evidence exists?
                    </label>
                    <textarea
                      value={input.existingEvidence}
                      onChange={(e) => updateField('existingEvidence', e.target.value)}
                      rows={2}
                      className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="Data, reports, analysis already available..."
                    />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      What evidence is missing?
                    </label>
                    <textarea
                      value={input.missingEvidence}
                      onChange={(e) => updateField('missingEvidence', e.target.value)}
                      rows={2}
                      className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="What you wish you had..."
                    />
                  </div>
                </div>

                {/* Questions 7-8 side by side */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      Where is the disagreement?
                    </label>
                    <textarea
                      value={input.disagreement}
                      onChange={(e) => updateField('disagreement', e.target.value)}
                      rows={2}
                      className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="Who disagrees and about what..."
                    />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                      What has already been tried?
                    </label>
                    <textarea
                      value={input.whatHasBeenTried}
                      onChange={(e) => updateField('whatHasBeenTried', e.target.value)}
                      rows={2}
                      className="mt-2 w-full border bg-white/[0.02] p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', resize: 'vertical', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '12px' }}
                      placeholder="Previous attempts to resolve..."
                    />
                  </div>
                </div>

                {/* Question 9 — Org level */}
                <div>
                  <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    Is this individual, team, board, or enterprise-level?
                  </label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(['INDIVIDUAL', 'TEAM', 'BOARD', 'ENTERPRISE'] as OrgLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => updateField('orgLevel', level)}
                        className="border px-4 py-2 text-[12px] transition-all"
                        style={{
                          borderColor: input.orgLevel === level ? `${GOLD}50` : 'rgba(255,255,255,0.10)',
                          backgroundColor: input.orgLevel === level ? `${GOLD}12` : 'transparent',
                          color: input.orgLevel === level ? `${GOLD}CC` : 'rgba(255,255,255,0.40)',
                          ...mono,
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 10 — Exposure type */}
                <div>
                  <label style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    What type of exposure is at stake?
                  </label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {([
                      { value: 'NONE', label: 'None' },
                      { value: 'DEADLINE', label: 'Deadline' },
                      { value: 'FINANCIAL', label: 'Financial' },
                      { value: 'CLIENT', label: 'Client' },
                      { value: 'LEGAL', label: 'Legal' },
                      { value: 'REPUTATIONAL', label: 'Reputational' },
                      { value: 'EXISTENTIAL', label: 'Existential' },
                    ] as { value: ExposureType; label: string }[]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateField('exposureType', value)}
                        className="border px-4 py-2 text-[12px] transition-all"
                        style={{
                          borderColor: input.exposureType === value ? `${GOLD}50` : 'rgba(255,255,255,0.10)',
                          backgroundColor: input.exposureType === value ? `${GOLD}12` : 'transparent',
                          color: input.exposureType === value ? `${GOLD}CC` : 'rgba(255,255,255,0.40)',
                          ...mono,
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!input.unresolvedDecision.trim() || loading}
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
                    {loading ? 'Analysing...' : 'Run organisational scan'}
                    {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Result */}
        {result && (
          <section ref={resultRef} className="border-t px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <div className="mx-auto max-w-[700px]">
              <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                Organisational Decision Scan — Result
              </p>

              <div className="mt-8 border p-6 md:p-8" style={{ borderColor: `${costColor}30`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {/* Cost band */}
                <div className="flex items-center justify-between">
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                    Cost-of-delay band
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: costColor }} />
                    <span style={{ ...mono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: costColor }}>
                      {COST_LABELS[result.costBand]}
                    </span>
                  </div>
                </div>

                {/* Top decision risk */}
                <div className="mt-6">
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                    Top unresolved decision risk
                  </p>
                  <p className="mt-1 text-[15px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {result.topDecisionRisk}
                  </p>
                </div>

                {/* Primary contradiction */}
                <div className="mt-5">
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${AMBER}AA` }}>
                    Primary organisational contradiction
                  </p>
                  <p className="mt-1 text-[14px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    {result.primaryContradiction}
                  </p>
                </div>

                {/* Recommended path */}
                <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
                    Recommended entry path
                  </p>
                  <p className="mt-1 text-[15px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.70) ...serif' }}>
                    {result.recommendedPath}
                  </p>
                </div>

                {/* Board-facing summary */}
                <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                    Board-facing summary
                  </p>
                  <div className="mt-2 border-l-2 p-4" style={{ borderColor: `${GOLD}30`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[14px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {result.boardSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={result.recommendedHref}
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
                  Proceed to {result.recommendedPath.split(' — ')[0]}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  onClick={() => {
                    track('enterprise_scan_request_operator_review', { costBand: result.costBand })
                    window.location.href = '/engagements/operator-pilot'
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.60)',
                    ...mono,
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Request an operator review
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2"
                  style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}
                >
                  <RefreshCw className="h-3 w-3" />
                  Run another scan
                </button>
              </div>

              {/* Pathway links */}
              <div className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  This scan is a first reading, not a full organisational diagnosis.{' '}
                  <Link href="/decision-pathway" style={{ color: `${GOLD}CC`, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    View the full decision pathway
                  </Link>{' '}
                  to see the complete governed progression.
                </p>
                <p className="mt-3 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  <Link href="/enterprise/preview" style={{ color: `${GOLD}AA`, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    See what a full enterprise engagement produces
                  </Link>{' '}
                  — a preview of capabilities from pressure monitoring to retained oversight.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
