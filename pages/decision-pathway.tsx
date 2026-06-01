/**
 * pages/decision-pathway.tsx — The Governed Decision Pathway
 *
 * Exposes the full Abraham of London progression path as the core UX.
 * The ladder must become visible before the user pays.
 *
 * Each node shows:
 *   - Who it is for
 *   - What it detects
 *   - What it produces
 *   - What it unlocks
 *   - Price or "priced by scope"
 *   - Status (Available / Locked / Earned / Completed)
 *
 * Locked surfaces explain why they are locked — turning gating into trust.
 */

import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Eye, Users, Building2, FileText, Crown, RefreshCw } from 'lucide-react'
import Layout from '@/components/Layout'

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

type NodeState = 'OPEN' | 'LOCKED' | 'EARNED' | 'COMPLETED'

interface LadderNode {
  id: string
  rank: number
  title: string
  forWhom: string
  detects: string
  produces: string
  unlocks: string
  price: string
  href: string
  state: NodeState
  lockReason?: string
  icon: React.ReactNode
}

const LADDER_NODES: LadderNode[] = [
  {
    id: 'decision-pressure-signal',
    rank: 1,
    title: 'Decision Pressure Signal',
    forWhom: 'Anyone facing a decision under pressure',
    detects: 'Pressure band, primary friction, consequence trajectory',
    produces: 'A shareable signal card with pressure reading, friction type, one-line consequence, and minimum viable move',
    unlocks: 'Fast Diagnostic',
    price: 'Free',
    href: '/decision-pressure',
    state: 'OPEN',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: 'fast-diagnostic',
    rank: 2,
    title: 'Fast Diagnostic',
    forWhom: 'Anyone with a live decision who needs the first governed reading',
    detects: 'Decision class, primary failure point, governing tension, consequence class',
    produces: 'A structured diagnostic finding with situation class, what the system saw, and direction of minimum viable move',
    unlocks: 'Purpose Alignment, Constitutional Diagnostic',
    price: 'Free',
    href: '/diagnostics/fast',
    state: 'OPEN',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: 'purpose-alignment',
    rank: 3,
    title: 'Purpose Alignment',
    forWhom: 'Individuals whose decision problem appears personal — mandate-related or bound up with competing obligations',
    detects: 'Mandate clarity, obligation conflicts, decision behaviour patterns, resonance vs certainty alignment',
    produces: 'A personal mandate reading with obligation conflict map and decision behaviour pattern. Free summary + paid dossier.',
    unlocks: 'Constitutional Diagnostic, Executive Reporting',
    price: '£49',
    href: '/diagnostics/purpose-alignment',
    state: 'OPEN',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: 'constitutional-diagnostic',
    rank: 4,
    title: 'Constitutional Diagnostic',
    forWhom: 'Individuals and teams who need a governance and authority posture reading',
    detects: 'Governance structure, authority distribution, decision rights, constitutional tensions',
    produces: 'A governance posture reading with authority map and constitutional tension analysis',
    unlocks: 'Team Assessment, Enterprise Assessment',
    price: 'Paid',
    href: '/diagnostics/constitutional-diagnostic',
    state: 'LOCKED',
    lockReason: 'Requires completion of Fast Diagnostic and Purpose Alignment to establish sufficient evidence for a constitutional reading.',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: 'team-assessment',
    rank: 5,
    title: 'Team Assessment',
    forWhom: 'Teams facing alignment gaps, decision deadlock, or execution drift across multiple roles',
    detects: 'Team-level alignment gaps, decision authority conflicts, multi-respondent contradiction patterns',
    produces: 'A team alignment reading with multi-respondent contradiction map and recommended intervention path',
    unlocks: 'Enterprise Assessment, Executive Reporting',
    price: 'Paid',
    href: '/diagnostics/team-assessment',
    state: 'LOCKED',
    lockReason: 'Requires constitutional context and evidence of team-level decision friction before multi-respondent assessment is warranted.',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'enterprise-assessment',
    rank: 6,
    title: 'Enterprise Assessment',
    forWhom: 'Organisations facing structural decision failure, governance pressure, or institutional contradiction',
    detects: 'Institutional decision patterns, structural contradictions, enterprise-level evidence gaps',
    produces: 'An organisational structural reading with institutional contradiction map and escalation recommendation',
    unlocks: 'Executive Reporting, Boardroom Mode',
    price: 'Paid',
    href: '/diagnostics/enterprise-assessment',
    state: 'LOCKED',
    lockReason: 'Requires team-level evidence or constitutional findings that justify enterprise-level analysis.',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: 'executive-reporting',
    rank: 7,
    title: 'Executive Reporting',
    forWhom: 'Executives, boards, and leadership teams who need a board-grade synthesis of decision risk',
    detects: 'Financial exposure, boardroom qualification, consequence estimates, escalation readiness',
    produces: 'An executive-grade dossier with consequence estimate, financial exposure analysis, and boardroom qualification',
    unlocks: 'Boardroom Mode, Strategy Room',
    price: '£295',
    href: '/diagnostics/executive-reporting',
    state: 'LOCKED',
    lockReason: 'Requires enterprise or team-level evidence to produce a responsible executive synthesis.',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: 'boardroom-mode',
    rank: 8,
    title: 'Boardroom Mode',
    forWhom: 'Boards and trustees who need institutional-grade decision dossiers with governance memory',
    detects: 'Board-level decision patterns, governance continuity, fiduciary risk signals',
    produces: 'A board-grade dossier archive with governance memory, decision continuity, and oversight readiness',
    unlocks: 'Strategy Room, Retainer Oversight',
    price: 'Premium',
    href: '/boardroom',
    state: 'LOCKED',
    lockReason: 'Requires Executive Reporting evidence and board-level qualification before boardroom access is warranted.',
    icon: <Crown className="h-4 w-4" />,
  },
  {
    id: 'strategy-room',
    rank: 9,
    title: 'Strategy Room',
    forWhom: 'Senior operators and leadership teams facing consequential decisions requiring structured intervention',
    detects: 'Execution readiness, intervention paths, checkpoint requirements, decision velocity',
    produces: 'A governed intervention session with pre-read, decision framing, intervention logic, and post-session action structure',
    unlocks: 'Retainer Oversight, Return Brief',
    price: '£750 / £1,250',
    href: '/strategy-room',
    state: 'LOCKED',
    lockReason: 'Requires evidence of execution readiness and escalation qualification. Not available without prior diagnostic evidence.',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: 'retainer-oversight',
    rank: 10,
    title: 'Retainer Oversight',
    forWhom: 'Leaders and organisations where unresolved patterns, execution drift, or recurring contradictions create material risk',
    detects: 'Pattern recurrence, decision velocity trends, checkpoint compliance, outcome verification gaps',
    produces: 'Monthly decision oversight with cadence-based governance memory, oversight briefs, and outcome verification cycles',
    unlocks: 'Return Brief cycle, institutional decision continuity',
    price: 'Monthly',
    href: '/engagements/retained-oversight',
    state: 'LOCKED',
    lockReason: 'Requires demonstrated pattern of recurring decision risk and completion of at least one Strategy Room session.',
    icon: <RefreshCw className="h-4 w-4" />,
  },
]

function NodeStatusBadge({ state, price }: { state: NodeState; price: string }) {
  if (state === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: EMERALD }}>
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    )
  }
  if (state === 'EARNED') {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}CC` }}>
        <ShieldCheck className="h-3 w-3" />
        Earned
      </span>
    )
  }
  if (state === 'LOCKED') {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
        <Lock className="h-3 w-3" />
        Locked
      </span>
    )
  }
  // OPEN
  return (
    <span className="inline-flex items-center gap-1.5" style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}AA` }}>
      <Eye className="h-3 w-3" />
      Available
    </span>
  )
}

function LadderNodeCard({ node, isLast }: { node: LadderNode; isLast: boolean }) {
  const isAccessible = node.state === 'OPEN' || node.state === 'EARNED' || node.state === 'COMPLETED'

  return (
    <div>
      <div
        className="border p-5 transition-all duration-200"
        style={{
          borderColor: node.state === 'LOCKED' ? 'rgba(255,255,255,0.06)' : `${GOLD}25`,
          backgroundColor: node.state === 'LOCKED' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
          opacity: node.state === 'LOCKED' ? 0.6 : 1,
        }}
      >
        {/* Header: rank + title + status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{
                border: `1px solid ${node.state === 'LOCKED' ? 'rgba(255,255,255,0.10)' : `${GOLD}40`}`,
                color: node.state === 'LOCKED' ? 'rgba(255,255,255,0.25)' : `${GOLD}AA`,
              }}
            >
              <span style={{ ...mono, fontSize: '11px' }}>{node.rank}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ color: node.state === 'LOCKED' ? 'rgba(255,255,255,0.30)' : `${GOLD}99` }}>
                  {node.icon}
                </span>
                <h3
                  style={{
                    ...serif,
                    fontSize: '1.2rem',
                    lineHeight: 1.1,
                    color: node.state === 'LOCKED' ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.85)',
                    fontStyle: 'italic',
                  }}
                >
                  {node.title}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.1em', color: node.state === 'LOCKED' ? 'rgba(255,255,255,0.20)' : `${GOLD}AA` }}>
              {node.price}
            </span>
            <NodeStatusBadge state={node.state} price={node.price} />
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div>
            <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              For
            </p>
            <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {node.forWhom}
            </p>
          </div>
          <div>
            <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              Detects
            </p>
            <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {node.detects}
            </p>
          </div>
          <div>
            <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              Produces
            </p>
            <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {node.produces}
            </p>
          </div>
          <div>
            <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              Unlocks
            </p>
            <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {node.unlocks}
            </p>
          </div>
        </div>

        {/* Lock reason (only for locked nodes) */}
        {node.state === 'LOCKED' && node.lockReason && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-[12px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}77` }}>
                Why this is locked:{' '}
              </span>
              {node.lockReason}
            </p>
          </div>
        )}

        {/* CTA for accessible nodes */}
        {isAccessible && (
          <div className="mt-4">
            <Link
              href={node.href}
              className="group inline-flex min-h-[40px] items-center gap-2 border px-5 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: `${GOLD}40`,
                backgroundColor: `${GOLD}10`,
                color: '#F5F5F5',
                ...mono,
                fontSize: '9px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {node.state === 'COMPLETED' ? 'View result' : `Enter ${node.title}`}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Connector line between nodes */}
      {!isLast && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </div>
      )}
    </div>
  )
}

export default function DecisionPathwayPage() {
  return (
    <Layout
      title="Decision Pathway | Abraham of London"
      description="The governed decision pathway — from free pressure signal to retained oversight. Enter through evidence, earn every surface."
      canonicalUrl="/decision-pathway"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="The full governed decision pathway. Start with a free pressure signal, progress through diagnostics, enterprise assessment, executive reporting, strategy room, and retained oversight. Each surface is earned, not upsold." />
        <meta property="og:title" content="Decision Pathway — Abraham of London" />
        <meta property="og:description" content="A governed progression from pressure signal to retained oversight. Each surface earned through evidence." />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        {/* Header */}
        <section className="px-6 pb-8 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}88` }}>
              Decision Pathway
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
              Enter through evidence. Earn every surface.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              This is not a catalogue of products. It is a governed progression system. Each surface is a complete instrument
              that produces a specific finding and unlocks the next — only when the evidence justifies it.
            </p>
            <p className="mt-4 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Locked surfaces are not dead ends. They are protected by evidence standards — the system will not produce
              a finding it cannot support. This is how the system earns trust.
            </p>
          </div>
        </section>

        {/* Quick entry CTAs */}
        <section className="border-t px-6 py-8" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '1rem' }}>
              Start here
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/decision-pressure"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}12`, color: '#F5F5F5', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Test your decision pressure
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/diagnostics/fast"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.60)', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Run the Fast Diagnostic
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/enterprise-decision-scan"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.60)', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Run an organisational scan
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Ladder */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[760px]">
            <div className="space-y-0">
              {LADDER_NODES.map((node, index) => (
                <LadderNodeCard key={node.id} node={node} isLast={index === LADDER_NODES.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise entry note */}
        <section className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '0.75rem' }}>
              For organisations
            </p>
            <h2
              style={{
                ...serif,
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                lineHeight: 1.05,
                color: 'rgba(255,255,255,0.85)',
                fontStyle: 'italic',
              }}
            >
              Not every organisation starts at the beginning.
            </h2>
            <p className="mt-4 max-w-[56ch] text-[14px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              If you are a CEO, COO, board member, or head of strategy facing organisational decision pressure,
              the{' '}
              <Link href="/enterprise-decision-scan" style={{ color: `${GOLD}CC`, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Organisational Decision Scan
              </Link>{' '}
              provides a separate entry path designed for leadership teams. A 15-minute scan that returns a
              board-facing summary and recommended entry path — without forcing your team through the individual ladder.
            </p>
          </div>
        </section>

        {/* Refusal framing */}
        <section className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '0.75rem' }}>
              Why surfaces are locked
            </p>
            <p className="text-[14px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Locked surfaces are not paywalls. They are evidence gates. The system will not produce a finding it cannot
              support. Every locked surface includes an explanation of what evidence is needed to unlock it. This is how
              the system protects the decision record from premature escalation — and how it earns the trust of serious
              operators.
            </p>
            <p className="mt-4 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              The refusal is the feature. It protects the decision from false confidence.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  )
}
