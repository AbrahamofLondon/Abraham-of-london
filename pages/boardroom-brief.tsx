/**
 * pages/boardroom-brief.tsx — Boardroom-first entry path
 *
 * Market Activation Layer Phase 1.
 *
 * Lets a user generate a boardroom-style decision brief from a single focused
 * intake, without requiring them to complete the full diagnostic corridor first.
 *
 * Strategic doctrine:
 *   - The corridor is the moat.
 *   - The first encounter is the sale.
 *   - Boardroom value must be visible early.
 *   - This is an activation/front-door surface, not a replacement for
 *     Executive Reporting, Boardroom Mode, or the paid corridor.
 *
 * Rules:
 *   - Do not weaken or bypass the paid corridor.
 *   - Do not overclaim board readiness from thin evidence.
 *   - Do not expose raw unsafe user input.
 *   - Do not describe the product as an AI tool.
 *   - Use qualified language when evidence is thin.
 */

import * as React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { buildBoardroomIntelligenceSpine } from '@/lib/constitution/boardroom-spine-builder'
import { generateBoardroomDossier, qualifiesForBoardroom } from '@/lib/constitution/boardroom-mode'
import type { BoardroomDossier } from '@/lib/constitution/boardroom-mode'

const GOLD = '#C9A96E'
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 }

type IntakeForm = {
  decision: string
  owner: string
  blocker: string
  consequence: string
  deadline: string
  evidenceAvailable: string
  authorityUncertainty: string
  costOfDelay: string
}

type PagePhase = 'intake' | 'result' | 'refused'

function s(value: string): string {
  return value.trim()
}

export default function BoardroomBriefPage() {
  const [phase, setPhase] = React.useState<PagePhase>('intake')
  const [dossier, setDossier] = React.useState<BoardroomDossier | null>(null)
  const [refusalReason, setRefusalReason] = React.useState<string>('')
  const [missingField, setMissingField] = React.useState<string>('')
  const [form, setForm] = React.useState<IntakeForm>({
    decision: '',
    owner: '',
    blocker: '',
    consequence: '',
    deadline: '',
    evidenceAvailable: '',
    authorityUncertainty: '',
    costOfDelay: '',
  })

  function updateField(key: keyof IntakeForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const decision = s(form.decision)
    const consequence = s(form.consequence)
    const evidenceAvailable = s(form.evidenceAvailable)

    // Governed refusal: if decision, consequence, or evidence is too weak
    if (decision.length < 10) {
      setRefusalReason('The brief cannot be generated because the decision statement is too unclear.')
      setMissingField('decision')
      setPhase('refused')
      return
    }
    if (consequence.length < 10) {
      setRefusalReason('The brief cannot be generated because the consequence of delay or mishandling is not described.')
      setMissingField('consequence')
      setPhase('refused')
      return
    }
    if (evidenceAvailable.length < 5 && s(form.authorityUncertainty).length < 5) {
      setRefusalReason('The brief cannot be generated because the evidence basis or authority context is too unclear.')
      setMissingField('evidenceAvailable')
      setPhase('refused')
      return
    }

    // Build spine from intake
    const costDelay = s(form.costOfDelay)
    const parsedCost = costDelay ? parseFloat(costDelay.replace(/[^0-9.]/g, '')) : 0

    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: parsedCost > 0 ? parsedCost : undefined,
      accuracy: evidenceAvailable.length > 20 ? 'yes' : evidenceAvailable.length > 5 ? 'partial' : undefined,
      conditionClass: s(form.blocker).toLowerCase().includes('authority') || s(form.authorityUncertainty).length > 5
        ? 'authority'
        : s(form.blocker).toLowerCase().includes('execution') || s(form.blocker).toLowerCase().includes('capacity')
          ? 'execution'
          : 'definition',
      decisionText: decision,
      synthesis: {
        primaryContradiction: s(form.blocker) || 'Blocker not explicitly stated',
        blocker: s(form.blocker),
        forcedAction: consequence,
        concreteMove: `Resolve the ${s(form.blocker) || 'identified blocker'} before proceeding with the decision.`,
        nextAdmissibleMove: `Confirm decision ownership and evidence basis before escalation.`,
      },
      case: {
        claimedOwner: s(form.owner) || undefined,
        blocker: s(form.blocker) || undefined,
        decisionText: decision,
      },
      economics: {
        estimatedMonthlyCost: parsedCost > 0 ? parsedCost : undefined,
        decisionOwner: s(form.owner) || undefined,
        deadline: s(form.deadline) || undefined,
      },
      flags: {
        falseAuthority: s(form.authorityUncertainty).length > 10,
      },
      deterministic: {
        contradictionSet: s(form.blocker) ? [s(form.blocker)] : [],
        blockerClass: s(form.blocker).toLowerCase().includes('authority') ? 'authority'
          : s(form.blocker).toLowerCase().includes('evidence') ? 'evidence'
          : s(form.blocker).toLowerCase().includes('execution') ? 'execution'
          : 'unknown',
      },
    })

    const result = generateBoardroomDossier(spine as any)
    setDossier(result)
    setPhase('result')
  }

  // ── Sample data generation ────────────────────────────────────────────────

  function generateSampleBrief() {
    const sampleSpine = buildBoardroomIntelligenceSpine({
      costOfDelay: 25000,
      accuracy: 'yes',
      conditionClass: 'execution',
      decisionText: 'Whether to approve a 90-day accelerated rollout of a new enterprise onboarding platform.',
      synthesis: {
        primaryContradiction: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
        concreteMove: 'Resolve the tri-party constraint between Operations, Finance, and Customer Success before the next quarterly board meeting.',
        blocker: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
        forcedAction: 'If delayed, the company risks missing renewal-cycle commitments and losing confidence with enterprise accounts.',
        nextAdmissibleMove: 'Confirm tri-party alignment on scope, budget, and support capacity before proceeding with rollout.',
      },
      case: {
        claimedOwner: 'Chief Operating Officer',
        blocker: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
        decisionText: 'Whether to approve a 90-day accelerated rollout of a new enterprise onboarding platform.',
      },
      economics: {
        estimatedMonthlyCost: 25000,
        decisionOwner: 'Chief Operating Officer',
        deadline: 'Before the next quarterly board meeting.',
      },
      flags: {
        falseAuthority: true,
      },
      deterministic: {
        contradictionSet: [
          'Speed vs cost control conflict between Operations and Finance',
          'Customer Success support capacity not confirmed',
          'Renewal-cycle commitments at risk if delayed',
        ],
        blockerClass: 'execution',
      },
      forecast: {
        optionDecayRate: 0.35,
        structuralRiskShift: 'accelerating',
      },
    })

    const result = generateBoardroomDossier(sampleSpine as any)
    setDossier(result)
    setPhase('result')
  }

  // ── Detect sample=true query parameter ────────────────────────────────────

  const router = useRouter()

  React.useEffect(() => {
    if (router.isReady && router.query.sample === 'true') {
      generateSampleBrief()
    }
  }, [router.isReady, router.query.sample])

  function inputStyle(overrides: React.CSSProperties = {}): React.CSSProperties {
    return {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.09)',
      outline: 'none',
      minHeight: '44px',
      padding: '10px 13px',
      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
      fontWeight: 300,
      fontSize: '1rem',
      lineHeight: 1.55,
      color: 'rgba(255,255,255,0.80)',
      transition: 'border-color 250ms ease',
      ...overrides,
    }
  }

  function labelStyle(): React.CSSProperties {
    return {
      display: 'block', marginBottom: '0.45rem',
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: '7px', letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)',
    }
  }

  // ── INTAKE PHASE ──────────────────────────────────────────────────────────

  if (phase === 'intake') {
    return (
      <Layout title="Boardroom Brief | Abraham of London" description="Generate a boardroom-style decision brief to test whether your decision can survive serious challenge." canonicalUrl="/boardroom-brief" fullWidth headerTransparent>
        <Head><meta name="robots" content="index,follow" /></Head>
        <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
            <div className="max-w-2xl">
              <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
                Boardroom Brief
              </p>
              <h1 style={{ ...serif, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.02, color: 'rgba(255,255,255,0.92)', fontStyle: 'italic', marginTop: '1rem' }}>
                Test whether this decision can survive serious challenge.
              </h1>
              <p style={{ ...serif, fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', marginTop: '1rem', maxWidth: '52ch' }}>
                Answer a few questions and receive a boardroom-style decision brief showing likely objections, evidence weaknesses, trade-offs, and the next admissible move.
              </p>
              <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem' }}>
                This is not a full executive report. It is an early boardroom-readiness brief built from the evidence you provide.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5 max-w-2xl">
              <div>
                <label style={labelStyle()}>What decision is being considered?</label>
                <textarea value={form.decision} onChange={e => updateField('decision', e.target.value)}
                  rows={3} placeholder="Describe the decision — what is being decided, by whom, and why now."
                  style={inputStyle({ resize: 'none', minHeight: '44px' })}
                  onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label style={labelStyle()}>Who owns or carries this decision?</label>
                  <input type="text" value={form.owner} onChange={e => updateField('owner', e.target.value)}
                    placeholder="e.g. CEO, Department head"
                    style={inputStyle()}
                    onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
                </div>
                <div>
                  <label style={labelStyle()}>When does this need to be resolved?</label>
                  <input type="text" value={form.deadline} onChange={e => updateField('deadline', e.target.value)}
                    placeholder="e.g. End of quarter, 30 days"
                    style={inputStyle()}
                    onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle()}>What is most blocking the decision right now?</label>
                <textarea value={form.blocker} onChange={e => updateField('blocker', e.target.value)}
                  rows={2} placeholder="e.g. Unclear authority, missing approval, stakeholder resistance, weak evidence"
                  style={inputStyle({ resize: 'none', minHeight: '44px' })}
                  onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
              </div>

              <div>
                <label style={labelStyle()}>What happens if this decision is delayed or mishandled?</label>
                <textarea value={form.consequence} onChange={e => updateField('consequence', e.target.value)}
                  rows={2} placeholder="e.g. Financial exposure, client impact, regulatory risk, competitive loss"
                  style={inputStyle({ resize: 'none', minHeight: '44px' })}
                  onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label style={labelStyle()}>What evidence currently supports the decision?</label>
                  <textarea value={form.evidenceAvailable} onChange={e => updateField('evidenceAvailable', e.target.value)}
                    rows={2} placeholder="e.g. Data analysis, expert opinion, stakeholder feedback"
                    style={inputStyle({ resize: 'none', minHeight: '44px' })}
                    onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
                </div>
                <div>
                  <label style={labelStyle()}>Is there uncertainty about who can approve, block, or challenge?</label>
                  <textarea value={form.authorityUncertainty} onChange={e => updateField('authorityUncertainty', e.target.value)}
                    rows={2} placeholder="e.g. Board approval needed, legal review pending"
                    style={inputStyle({ resize: 'none', minHeight: '44px' })}
                    onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
                </div>
              </div>

              <details style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.008)' }}>
                <summary style={{ cursor: 'pointer', ...mono, fontSize: '7px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  Optional: cost of delay
                </summary>
                <div className="mt-3">
                  <label style={labelStyle()}>If known, what is the estimated cost of delay?</label>
                  <input type="text" value={form.costOfDelay} onChange={e => updateField('costOfDelay', e.target.value)}
                    placeholder="e.g. 50000 (monthly)"
                    style={inputStyle()}
                    onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35` }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} />
                </div>
              </details>

              <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
                <button type="submit"
                  style={{ padding: '13px 28px', border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: '8.5px', letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}65`; e.currentTarget.style.backgroundColor = `${GOLD}18` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${GOLD}42`; e.currentTarget.style.backgroundColor = `${GOLD}10` }}>
                  Generate brief <ArrowRight style={{ width: '12px', height: '12px' }} />
                </button>
                <Link href="/boardroom-brief?sample=true" style={{ ...mono, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)', textDecoration: 'none' }}>
                  View sample Boardroom brief
                </Link>
              </div>
            </form>

            {/* Upgrade routing */}
            <div className="mt-12 border-t border-white/[0.05] pt-8 max-w-2xl">
              <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', marginBottom: '0.75rem' }}>
                Need more than a brief?
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/test-your-decision" style={{ ...mono, fontSize: '7.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${GOLD}99`, textDecoration: 'none', border: `1px solid ${GOLD}20`, padding: '8px 14px' }}>
                  Run Quick Decision Health Check
                </Link>
                <Link href="/enterprise-decision-scan" style={{ ...mono, fontSize: '7.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 14px' }}>
                  Run organisational scan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ── REFUSED PHASE ─────────────────────────────────────────────────────────

  if (phase === 'refused') {
    return (
      <Layout title="Boardroom Brief | Abraham of London" description="Boardroom brief intake" canonicalUrl="/boardroom-brief" fullWidth headerTransparent>
        <Head><meta name="robots" content="index,follow" /></Head>
        <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
          <div className="mx-auto max-w-2xl px-6 py-20 lg:px-8">
            <div style={{ border: '1px solid rgba(252,165,165,0.20)', backgroundColor: 'rgba(252,165,165,0.04)', padding: '2rem' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle style={{ width: '14px', height: '14px', color: 'rgba(252,165,165,0.70)' }} />
                <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(252,165,165,0.70)' }}>
                  Boardroom brief — insufficient evidence
                </span>
              </div>
              <p style={{ ...serif, fontSize: '1.1rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.70)' }}>
                {refusalReason}
              </p>
              <p style={{ ...serif, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.40)', marginTop: '0.75rem' }}>
                Please provide a clearer {missingField === 'decision' ? 'decision statement' : missingField === 'consequence' ? 'description of the consequence' : 'evidence or authority context'} and try again.
              </p>
              <button onClick={() => setPhase('intake')}
                style={{ marginTop: '1.25rem', padding: '11px 22px', border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}0D`, color: `${GOLD}BB`, ...mono, fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Return to intake
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ── RESULT PHASE ──────────────────────────────────────────────────────────

  if (!dossier) return null

  const isQualified = dossier.qualifiedForBoard
  const sectionIds = dossier.sections.map(s => s.id)

  return (
    <Layout title="Boardroom Brief | Abraham of London" description="Your boardroom-style decision brief" canonicalUrl="/boardroom-brief" fullWidth headerTransparent>
      <Head><meta name="robots" content="index,follow" /></Head>
      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          {/* Header */}
          <div style={{ border: `1px solid ${isQualified ? `${GOLD}30` : 'rgba(252,165,165,0.20)'}`, backgroundColor: isQualified ? `${GOLD}06` : 'rgba(252,165,165,0.04)', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield style={{ width: '14px', height: '14px', color: isQualified ? `${GOLD}99` : 'rgba(252,165,165,0.60)' }} />
              <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.32em', textTransform: 'uppercase', color: isQualified ? `${GOLD}99` : 'rgba(252,165,165,0.60)' }}>
                {isQualified ? 'Early boardroom-readiness brief' : 'Boardroom brief — limited evidence'}
              </span>
            </div>
            <h1 style={{ ...serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', lineHeight: 1.1, color: 'rgba(255,255,255,0.88)', marginTop: '0.5rem' }}>
              {dossier.title}
            </h1>
            {!isQualified && (
              <p style={{ ...serif, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(252,165,165,0.60)', marginTop: '0.5rem' }}>
                Evidence is limited. Full Boardroom Mode requires stronger evidence carry-forward.
              </p>
            )}
          </div>

          {/* Sample disclaimer */}
          {router.query.sample === 'true' && (
            <div className="mt-6" style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: '1.25rem' }}>
              <p style={{ ...serif, fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                This is a sample Boardroom Brief using fictional demonstration data. It is provided to show the kind of decision challenge the system can produce.
              </p>
              <div className="mt-3">
                <Link href="/boardroom-brief"
                  style={{ ...mono, fontSize: '7.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${GOLD}BB`, textDecoration: 'none', border: `1px solid ${GOLD}35`, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Generate your own brief <ArrowRight style={{ width: '10px', height: '10px' }} />
                </Link>
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="mt-6 space-y-4">
            {dossier.sections.map(section => (
              <div key={section.id} style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.008)' }}>
                <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                  {section.label}
                </p>
                <p style={{ ...serif, fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-line' }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Objection handling */}
          {dossier.objectionHandling.length > 0 && (
            <div className="mt-6">
              <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>
                Likely objections
              </p>
              <div className="space-y-3">
                {dossier.objectionHandling.map((item, i) => (
                  <div key={i} style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.008)' }}>
                    <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(252,165,165,0.50)', marginBottom: '0.3rem' }}>
                      Objection
                    </p>
                    <p style={{ ...serif, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                      {item.objection}
                    </p>
                    <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(110,231,183,0.50)', marginTop: '0.5rem', marginBottom: '0.3rem' }}>
                      Response
                    </p>
                    <p style={{ ...serif, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                      {item.response}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision paths */}
          {dossier.decisionPath.length > 0 && (
            <div className="mt-6">
              <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>
                Decision paths
              </p>
              <div className="space-y-3">
                {dossier.decisionPath.map((path, i) => (
                  <div key={i} style={{ border: `1px solid ${path.recommended ? `${GOLD}25` : 'rgba(255,255,255,0.06)'}`, padding: '1rem', backgroundColor: path.recommended ? `${GOLD}04` : 'rgba(255,255,255,0.008)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      {path.recommended && <CheckCircle2 style={{ width: '12px', height: '12px', color: `${GOLD}99` }} />}
                      <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: path.recommended ? `${GOLD}CC` : 'rgba(255,255,255,0.35)' }}>
                        {path.option}
                      </span>
                    </div>
                    <p style={{ ...serif, fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.50)' }}>
                      {path.consequence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boundary footer */}
          <div className="mt-8 border-t border-white/[0.05] pt-6">
            <p style={{ ...serif, fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.30)', fontStyle: 'italic' }}>
              This brief is an early boardroom-readiness view. Executive Reporting converts the case into board-grade judgement. Full Boardroom Mode tests that judgement under deeper adversarial scrutiny.
            </p>
          </div>

          {/* Upgrade routing */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/test-your-decision"
              style={{ padding: '11px 20px', border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}0D`, color: `${GOLD}BB`, ...mono, fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Run Quick Decision Health Check <ArrowRight style={{ width: '11px', height: '11px' }} />
            </Link>
            <Link href="/enterprise-decision-scan"
              style={{ padding: '11px 20px', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', ...mono, fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Run organisational scan <ArrowRight style={{ width: '11px', height: '11px' }} />
            </Link>
            {isQualified && (
              <Link href="/diagnostics/executive-reporting"
                style={{ padding: '11px 20px', border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}0D`, color: `${GOLD}BB`, ...mono, fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Proceed to Executive Reporting <ArrowRight style={{ width: '11px', height: '11px' }} />
              </Link>
            )}
          </div>

          {/* Start fresh */}
          <div className="mt-6">
            <button onClick={() => { setPhase('intake'); setDossier(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', ...mono, fontSize: '7.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
              Start a new brief
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
