/**
 * components/living/WhatTheSystemHeard.tsx
 *
 * Renders direct quotes from the user's input with derived interpretations.
 * Every quote is connected to a decision issue: authority, evidence,
 * consequence, execution, timing, obligation, contradiction, or stakeholder risk.
 *
 * Rules:
 * - Limit to 3 quotes.
 * - Never show empty quotes.
 * - Never show sensitive-looking raw personal data.
 * - Do not over-style it.
 * - It should feel evidential, not decorative.
 *
 * Variants:
 * - dark: used in living/lab surfaces (dark background, light text)
 * - light: used in diagnostic result surfaces (light background, dark text)
 */

import React from 'react'
import type { UserLanguageInterpretation } from '@/lib/product/user-language-interpretation'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type WhatTheSystemHeardProps = {
  quotes: string[]
  interpretations?: UserLanguageInterpretation[]
  contextLabel?: string
  variant?: 'dark' | 'light'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhatTheSystemHeard({
  quotes,
  interpretations,
  contextLabel,
  variant = 'dark',
}: WhatTheSystemHeardProps) {
  const safeQuotes = quotes
    .filter(q => Boolean(q) && q.trim().length > 0)
    .slice(0, 3)

  if (safeQuotes.length === 0) return null

  const isDark = variant === 'dark'

  // Build a map of quote -> interpretation for quick lookup
  const interpretationMap = new Map<string, UserLanguageInterpretation>()
  if (interpretations) {
    for (const interp of interpretations) {
      interpretationMap.set(interp.quote, interp)
    }
  }

  return (
    <div
      className="border p-4"
      style={{
        borderColor: isDark ? 'rgba(201,169,110,0.15)' : 'rgba(201,169,110,0.25)',
        backgroundColor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(201,169,110,0.04)',
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: '8px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isDark ? 'rgba(201,169,110,0.75)' : 'rgba(138,106,47,0.70)',
          marginBottom: '10px',
        }}
      >
        {contextLabel ?? 'What the system heard'}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {safeQuotes.map((quote, i) => {
          const interp = interpretationMap.get(quote)

          return (
            <div key={i}>
              {/* Quote */}
              <div
                style={{
                  borderLeft: `1px solid ${isDark ? 'rgba(201,169,110,0.30)' : 'rgba(201,169,110,0.40)'}`,
                  paddingLeft: '12px',
                }}
              >
                <p
                  style={{
                    ...serif,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(64,64,64,0.85)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  &ldquo;{quote.length > 200 ? quote.slice(0, 197) + '...' : quote}&rdquo;
                </p>
              </div>

              {/* Interpretation */}
              {interp && (
                <div className="mt-2 space-y-1.5" style={{ paddingLeft: '12px' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(64,64,64,0.65)',
                      margin: 0,
                    }}
                  >
                    {interp.interpretation}
                  </p>

                  {interp.exposedContradiction && (
                    <p
                      style={{
                        ...mono,
                        fontSize: '9px',
                        lineHeight: 1.5,
                        color: isDark ? 'rgba(251,191,36,0.55)' : 'rgba(180,130,30,0.65)',
                        margin: 0,
                      }}
                    >
                      Contradiction: {interp.exposedContradiction}
                    </p>
                  )}

                  {interp.riskImplication && (
                    <p
                      style={{
                        ...mono,
                        fontSize: '9px',
                        lineHeight: 1.5,
                        color: isDark ? 'rgba(252,165,165,0.55)' : 'rgba(180,50,50,0.65)',
                        margin: 0,
                      }}
                    >
                      Risk: {interp.riskImplication}
                    </p>
                  )}

                  {interp.nextAdmissibleMove && (
                    <p
                      style={{
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: isDark ? 'rgba(201,169,110,0.70)' : 'rgba(138,106,47,0.75)',
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      Next: {interp.nextAdmissibleMove}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
