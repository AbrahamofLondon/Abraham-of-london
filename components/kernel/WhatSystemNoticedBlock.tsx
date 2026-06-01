/**
 * components/kernel/WhatSystemNoticedBlock.tsx — First "Wow" Moment
 *
 * A reusable component that receives translated situation data and renders
 * a user-facing interpretation. Makes the user feel seen by reflecting back
 * what the system detected from their own words.
 *
 * Two variants:
 *   compact — Used on /decision-pressure after the free result card
 *   full    — Used on structured signal and diagnostic result surfaces
 *
 * Does not expose engine internals, formulas, thresholds, scoring rules,
 * or raw classifier mechanics.
 */

import React from 'react'
import { Eye, Users, AlertTriangle, HelpCircle, BarChart3, ArrowRight } from 'lucide-react'

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

export type WhatSystemNoticedItem = {
  label: string
  value: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export type WhatSystemNoticedBlockProps = {
  situationSummary: string
  actors?: string[]
  detectedSignals?: WhatSystemNoticedItem[]
  hiddenStakes?: string[]
  ambiguities?: string[]
  underestimatedRisk?: string | null
  nextDiagnosticWouldMap?: string[]
  variant?: 'compact' | 'full'
}

function SeverityDot({ severity }: { severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
  const color = severity === 'CRITICAL' ? ROSE : severity === 'HIGH' ? AMBER : severity === 'MEDIUM' ? `${GOLD}CC` : EMERALD
  return <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

export function WhatSystemNoticedBlock({
  situationSummary,
  actors = [],
  detectedSignals = [],
  hiddenStakes = [],
  ambiguities = [],
  underestimatedRisk,
  nextDiagnosticWouldMap = [],
  variant = 'compact',
}: WhatSystemNoticedBlockProps) {
  const hasContent = situationSummary || actors.length > 0 || detectedSignals.length > 0 || hiddenStakes.length > 0 || ambiguities.length > 0 || underestimatedRisk

  if (!hasContent) return null

  return (
    <div
      className="border p-5 md:p-6"
      style={{
        borderColor: `${GOLD}20`,
        backgroundColor: 'rgba(255,255,255,0.015)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Eye className="h-3.5 w-3.5" style={{ color: `${GOLD}AA` }} />
        <span
          style={{
            ...mono,
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: `${GOLD}AA`,
          }}
        >
          What the system noticed
        </span>
      </div>

      {/* Situation summary */}
      <p
        className="mt-3 text-[14px] leading-[1.75]"
        style={{ color: 'rgba(255,255,255,0.72)' }}
      >
        {situationSummary}
      </p>

      {/* Actors */}
      {actors.length > 0 && (
        <div className="mt-4 flex items-start gap-2.5">
          <Users className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${GOLD}77` }} />
          <div>
            <span
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.30)',
              }}
            >
              Involves
            </span>
            <p className="mt-0.5 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {actors.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Detected signals */}
      {detectedSignals.length > 0 && (
        <div className="mt-4">
          <span
            style={{
              ...mono,
              fontSize: '7px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.30)',
            }}
          >
            Detected
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {detectedSignals.map((signal, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 border px-2.5 py-1"
                style={{
                  borderColor: signal.severity === 'CRITICAL' ? `${ROSE}30` : signal.severity === 'HIGH' ? `${AMBER}25` : `${GOLD}20`,
                  backgroundColor: signal.severity === 'CRITICAL' ? `${ROSE}08` : signal.severity === 'HIGH' ? `${AMBER}06` : `${GOLD}06`,
                }}
              >
                <SeverityDot severity={signal.severity} />
                <span
                  style={{
                    ...mono,
                    fontSize: '8px',
                    letterSpacing: '0.1em',
                    color: signal.severity === 'CRITICAL' ? `${ROSE}CC` : signal.severity === 'HIGH' ? `${AMBER}CC` : 'rgba(255,255,255,0.60)',
                  }}
                >
                  {signal.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden stakes */}
      {hiddenStakes.length > 0 && (
        <div className="mt-4 flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${AMBER}AA` }} />
          <div>
            <span
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: `${AMBER}AA`,
              }}
            >
              Possible hidden stake
            </span>
            {hiddenStakes.map((hs, i) => (
              <p key={i} className="mt-0.5 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {hs}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Underestimated risk */}
      {underestimatedRisk && (
        <div className="mt-4 flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${ROSE}AA` }} />
          <div>
            <span
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: `${ROSE}AA`,
              }}
            >
              Possible underestimated risk
            </span>
            <p className="mt-0.5 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {underestimatedRisk}
            </p>
          </div>
        </div>
      )}

      {/* Ambiguities */}
      {ambiguities.length > 0 && (
        <div className="mt-4 flex items-start gap-2.5">
          <HelpCircle className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${GOLD}77` }} />
          <div>
            <span
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.30)',
              }}
            >
              What is still unclear
            </span>
            <ul className="mt-1 space-y-1">
              {ambiguities.map((amb, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  <span style={{ color: `${GOLD}66` }}>→</span>
                  {amb}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Deeper analysis preview */}
      {nextDiagnosticWouldMap.length > 0 && (
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3" style={{ color: `${GOLD}88` }} />
            <span
              style={{
                ...mono,
                fontSize: '7px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: `${GOLD}88`,
              }}
            >
              What deeper analysis would add
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {nextDiagnosticWouldMap.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                <ArrowRight className="mt-0.5 h-2.5 w-2.5 shrink-0" style={{ color: `${GOLD}66` }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
