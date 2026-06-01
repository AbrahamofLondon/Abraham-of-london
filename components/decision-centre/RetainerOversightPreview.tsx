/**
 * components/decision-centre/RetainerOversightPreview.tsx
 *
 * A preview surface for retainer oversight readiness within the Decision Centre.
 * Shows when a case qualifies for oversight consideration without exposing
 * the full internal oversight artifact publicly.
 *
 * Allowed states:
 *   - brief-ready
 *   - oversight review available
 *   - internal review pending
 *
 * Not allowed:
 *   - public retainer dashboard
 *   - full monthly report without access validation
 *   - price-led upsell copy
 */

import React from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react'

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

export type OversightReadinessLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface RetainerOversightPreviewProps {
  level: OversightReadinessLevel
  reason: string
  signals?: string[]
  cadenceStatus?: string
  /** The href for the oversite brief if available */
  briefHref?: string
  /** Whether an oversite brief is composable */
  briefReady?: boolean
}

function readinessColor(level: OversightReadinessLevel): string {
  switch (level) {
    case 'HIGH': return `${GOLD}AA`
    case 'MEDIUM': return `${AMBER}AA`
    case 'LOW': return 'rgba(255,255,255,0.22)'
  }
}

function readinessLabel(level: OversightReadinessLevel): string {
  switch (level) {
    case 'HIGH': return 'Oversight consideration warranted'
    case 'MEDIUM': return 'Pattern emerging — monitor'
    case 'LOW': return 'No oversight signal detected'
  }
}

export function RetainerOversightPreview({
  level,
  reason,
  signals,
  cadenceStatus,
  briefHref,
  briefReady,
}: RetainerOversightPreviewProps) {
  const color = readinessColor(level)

  // Do not render if level is LOW — no signal to show
  if (level === 'LOW') return null

  return (
    <div
      className="border p-5"
      style={{
        borderColor: level === 'HIGH' ? `${GOLD}25` : `${AMBER}15`,
        backgroundColor: level === 'HIGH' ? 'rgba(201,169,110,0.04)' : 'rgba(245,158,11,0.03)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw className="h-4 w-4" style={{ color }} />
        <div>
          <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
            {readinessLabel(level)}
          </p>
        </div>
      </div>

      {/* Reason */}
      <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {reason}
      </p>

      {/* Signals */}
      {signals && signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <span
              key={signal}
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${GOLD}77`,
                border: `1px solid ${GOLD}15`,
                padding: '2px 8px',
              }}
            >
              {signal}
            </span>
          ))}
        </div>
      )}

      {/* Cadence status */}
      {cadenceStatus && (
        <p className="mt-3 text-[11px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Cadence:{' '}
          </span>
          {cadenceStatus}
        </p>
      )}

      {/* Brief preview state */}
      {briefReady && briefHref ? (
        <div className="mt-4">
          <Link
            href={briefHref}
            className="group inline-flex items-center gap-2"
            style={{
              ...mono,
              fontSize: '8px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: `${GOLD}CC`,
              textDecoration: 'none',
              border: `1px solid ${GOLD}30`,
              padding: '8px 14px',
            }}
          >
            <ShieldCheck className="h-3 w-3" />
            Review oversight brief
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : briefReady ? (
        <div className="mt-4">
          <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}77` }}>
            Oversight brief composable — available upon request
          </p>
        </div>
      ) : level === 'HIGH' ? (
        <div className="mt-4">
          <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Internal review pending
          </p>
        </div>
      ) : null}

      {/* Link to retained oversight info */}
      {level === 'HIGH' && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Link
            href="/engagements/retained-oversight"
            style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
          >
            About retained oversight →
          </Link>
        </div>
      )}
    </div>
  )
}
