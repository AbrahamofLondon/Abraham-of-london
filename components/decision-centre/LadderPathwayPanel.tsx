/**
 * components/decision-centre/LadderPathwayPanel.tsx
 *
 * Shows the user's current position on the governed decision pathway
 * within the Decision Centre. Displays which surfaces are completed,
 * available, locked, or earned — and what unlocks next.
 *
 * This turns the Decision Centre into a command console, not a records page.
 */

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Lock, Eye, ShieldCheck, FileText, Users, Building2, Crown, RefreshCw } from 'lucide-react'

const GOLD = '#C9A96E'
const EMERALD = '#6EE7B7'
const AMBER = '#F59E0B'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

export type PathwayNodeState = 'COMPLETED' | 'AVAILABLE' | 'LOCKED' | 'EARNED'

export interface PathwayNode {
  id: string
  rank: number
  title: string
  href: string
  state: PathwayNodeState
  price?: string
}

interface LadderPathwayPanelProps {
  nodes: PathwayNode[]
  /** Optional: the current active node the user is on */
  currentNodeId?: string
  /** Optional: next admissible move text */
  nextAdmissibleMove?: string
  /** Optional: evidence gap text */
  evidenceGap?: string
}

const NODE_ICONS: Record<string, React.ReactNode> = {
  'decision-pressure-signal': <Eye className="h-3 w-3" />,
  'fast-diagnostic': <ShieldCheck className="h-3 w-3" />,
  'purpose-alignment': <FileText className="h-3 w-3" />,
  'constitutional-diagnostic': <Building2 className="h-3 w-3" />,
  'team-assessment': <Users className="h-3 w-3" />,
  'enterprise-assessment': <Building2 className="h-3 w-3" />,
  'executive-reporting': <FileText className="h-3 w-3" />,
  'boardroom-mode': <Crown className="h-3 w-3" />,
  'strategy-room': <ShieldCheck className="h-3 w-3" />,
  'retainer-oversight': <RefreshCw className="h-3 w-3" />,
}

function stateColor(state: PathwayNodeState): string {
  switch (state) {
    case 'COMPLETED': return EMERALD
    case 'EARNED': return `${GOLD}CC`
    case 'AVAILABLE': return `${GOLD}AA`
    case 'LOCKED': return 'rgba(255,255,255,0.20)'
  }
}

function stateIcon(state: PathwayNodeState) {
  switch (state) {
    case 'COMPLETED': return <CheckCircle2 className="h-2.5 w-2.5" />
    case 'EARNED': return <ShieldCheck className="h-2.5 w-2.5" />
    case 'AVAILABLE': return <Eye className="h-2.5 w-2.5" />
    case 'LOCKED': return <Lock className="h-2.5 w-2.5" />
  }
}

export function LadderPathwayPanel({ nodes, currentNodeId, nextAdmissibleMove, evidenceGap }: LadderPathwayPanelProps) {
  const currentIndex = currentNodeId ? nodes.findIndex(n => n.id === currentNodeId) : -1

  return (
    <div
      className="border p-5"
      style={{
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.015)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88` }}>
          Governed decision pathway
        </p>
        <Link
          href="/decision-pathway"
          style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', textDecoration: 'none' }}
        >
          View full pathway →
        </Link>
      </div>

      {/* Current position */}
      {currentNodeId && currentIndex >= 0 && (
        <div className="mb-4 p-3" style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04` }}>
          <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '2px' }}>
            You are here
          </p>
          <p style={{ ...serif, fontSize: '0.95rem', color: 'rgba(255,255,255,0.80)', fontStyle: 'italic' }}>
            {nodes[currentIndex]?.title || 'Unknown'}
          </p>
          {evidenceGap && (
            <p className="mt-2 text-[11px] leading-[1.6]" style={{ color: `${AMBER}AA` }}>
              <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${AMBER}88` }}>
                What is not yet proven:{' '}
              </span>
              {evidenceGap}
            </p>
          )}
        </div>
      )}

      {/* Compact ladder */}
      <div className="space-y-1">
        {nodes.map((node, index) => {
          const color = stateColor(node.state)
          const isCurrent = node.id === currentNodeId
          const isLast = index === nodes.length - 1

          return (
            <div key={node.id}>
              <div
                className="flex items-center gap-3 py-1.5"
                style={{
                  opacity: node.state === 'LOCKED' ? 0.45 : 1,
                }}
              >
                {/* Rank circle */}
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                  style={{
                    border: `1px solid ${color}`,
                    backgroundColor: isCurrent ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {isCurrent ? (
                    <span style={{ ...mono, fontSize: '8px', color: `${GOLD}CC` }}>{node.rank}</span>
                  ) : node.state === 'COMPLETED' || node.state === 'EARNED' ? (
                    stateIcon(node.state)
                  ) : (
                    <span style={{ ...mono, fontSize: '8px', color }}>{node.rank}</span>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  {node.href && node.state !== 'LOCKED' ? (
                    <Link
                      href={node.href}
                      style={{
                        ...mono,
                        fontSize: '8px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color,
                        textDecoration: isCurrent ? 'underline' : 'none',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      {node.title}
                    </Link>
                  ) : (
                    <span style={{ ...mono, fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
                      {node.title}
                    </span>
                  )}
                </div>

                {/* Price / Status */}
                <div className="flex items-center gap-2 shrink-0">
                  {node.price && node.state !== 'LOCKED' && (
                    <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>
                      {node.price}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: '6px', letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
                    {node.state === 'COMPLETED' ? 'Done' : node.state === 'EARNED' ? 'Earned' : node.state === 'AVAILABLE' ? 'Open' : 'Locked'}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <div className="h-2 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Next admissible move */}
      {nextAdmissibleMove && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}AA`, marginBottom: '4px' }}>
            Next admissible move
          </p>
          <p className="text-[12px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {nextAdmissibleMove}
          </p>
        </div>
      )}

      {/* Full pathway link */}
      <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <Link
          href="/decision-pathway"
          className="inline-flex items-center gap-1.5"
          style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}77`, textDecoration: 'none' }}
        >
          Full decision pathway
          <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  )
}
