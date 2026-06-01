/**
 * pages/enterprise/preview.tsx — Sponsor-Safe Enterprise Preview
 *
 * A restricted preview surface for enterprise buyers who have completed
 * the Organisational Decision Scan. Shows what a full engagement would
 * produce without exposing the full internal artifact.
 *
 * This is not a public retainer dashboard. It is a preview that
 * demonstrates what the system can detect and produce.
 */

import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, FileText, Building2, RefreshCw, Eye } from 'lucide-react'
import Layout from '@/components/Layout'

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

const CAPABILITIES = [
  {
    icon: <Eye className="h-4 w-4" />,
    title: 'Decision Pressure Monitoring',
    description: 'Continuous detection of unresolved decisions, their pressure bands, and whether they are escalating or stabilising.',
    output: 'Monthly pressure signal report with trend analysis',
  },
  {
    icon: <Building2 className="h-4 w-4" />,
    title: 'Organisational Contradiction Tracking',
    description: 'Cross-surface contradiction detection that identifies where intent, evidence, authority, and execution are breaking apart across the organisation.',
    output: 'Contradiction map with severity ranking and recommended resolution path',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: 'Executive Reporting',
    description: 'Board-grade synthesis of decision risk, contradiction, evidence gaps, financial exposure, and recommended next move.',
    output: 'Executive dossier with consequence estimate and boardroom qualification',
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'Governed Intervention Sessions',
    description: 'Structured intervention sessions for consequential decisions requiring pre-read, decision framing, intervention logic, and post-session action structure.',
    output: 'Strategy Room session with checkpoint governance and return brief cycle',
  },
  {
    icon: <RefreshCw className="h-4 w-4" />,
    title: 'Retained Oversight',
    description: 'Monthly decision oversight for organisations where unresolved patterns, execution drift, or recurring contradictions create material risk.',
    output: 'Oversight brief with cadence-based governance memory and outcome verification',
  },
  {
    icon: <Building2 className="h-4 w-4" />,
    title: 'Boardroom Dossier Archive',
    description: 'Institutional-grade decision dossier archive with governance memory, decision continuity, and fiduciary risk signals.',
    output: 'Boardroom-ready dossier with full provenance chain',
  },
]

export default function EnterprisePreviewPage() {
  return (
    <Layout
      title="Enterprise Preview | Abraham of London"
      description="A preview of what a full enterprise engagement with Abraham of London produces — from decision pressure monitoring to retained oversight."
      canonicalUrl="/enterprise/preview"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="Enterprise preview — see what a full governed engagement produces: pressure monitoring, contradiction tracking, executive reporting, strategy room sessions, and retained oversight." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', minHeight: '100vh', color: 'white' }}>
        {/* Header */}
        <section className="px-6 pb-8 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: `${GOLD}77` }}>
              Enterprise Preview
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
              What a full enterprise engagement produces.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              This is a preview of the capabilities and outputs available through a governed enterprise engagement.
              Each capability builds on the evidence record and unlocks the next — from initial pressure detection
              through to retained oversight.
            </p>
            <p className="mt-3 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              This is not a live dashboard. It is a demonstration of what the system detects and produces.
              Full engagement requires an Organisational Decision Scan or operator review.
            </p>
          </div>
        </section>

        {/* Entry CTAs */}
        <section className="border-t px-6 py-8" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '1rem' }}>
              Start here
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/enterprise-decision-scan"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}12`, color: '#F5F5F5', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Run an organisational scan
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/engagements/operator-pilot"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.60)', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Request an operator review
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/decision-pathway"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.60)', ...mono, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                View the decision pathway
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities grid */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '1.5rem' }}>
              Capabilities
            </p>
            <div className="space-y-4">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.title}
                  className="border p-5"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center shrink-0" style={{ border: `1px solid ${GOLD}30`, color: `${GOLD}AA` }}>
                      {cap.icon}
                    </div>
                    <div>
                      <h3 style={{ ...serif, fontSize: '1.1rem', lineHeight: 1.2, color: 'rgba(255,255,255,0.80)', fontStyle: 'italic' }}>
                        {cap.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                        {cap.description}
                      </p>
                      <p className="mt-2 text-[12px] leading-[1.6]" style={{ color: `${GOLD}AA` }}>
                        <span style={{ ...mono, fontSize: '7px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${GOLD}77` }}>
                          Produces:{' '}
                        </span>
                        {cap.output}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Progression note */}
        <section className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="mx-auto max-w-[760px]">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}77`, marginBottom: '0.75rem' }}>
              Governed progression
            </p>
            <p className="text-[14px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Each capability is earned through evidence, not purchased from a menu. The system detects whether
              the organisational record justifies escalation to the next surface. A boardroom dossier is not
              available until Executive Reporting has been completed. Retained oversight is not warranted until
              pattern recurrence has been verified.
            </p>
            <p className="mt-4 text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              This is governed infrastructure, not a feature catalogue.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              style={{
                ...serif,
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                lineHeight: 1.05,
                color: 'rgba(255,255,255,0.85)',
                fontStyle: 'italic',
              }}
            >
              Ready to test this against a real organisational decision?
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/enterprise-decision-scan"
                className="group inline-flex min-h-[48px] items-center gap-3 border px-7 py-3 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: `${GOLD}50`, backgroundColor: `${GOLD}15`, color: '#F5F5F5', ...mono, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' }}
              >
                Run an organisational scan
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/engagements/operator-pilot"
                style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}
              >
                Request operator review
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
