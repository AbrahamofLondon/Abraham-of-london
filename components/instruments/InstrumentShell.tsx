/**
 * InstrumentShell — shared wrapper for all interactive instrument runners.
 * Handles: entitlement check, layout, progress, PDF secondary CTA,
 *          value receipt, and signal authority block (P5 — signal supremacy).
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import Layout from "@/components/Layout";
import type { InstrumentSignalAuthority } from "@/lib/product/instrument-signal-authority";
import { severityColor, severityBg } from "@/lib/product/instrument-signal-authority";
import ConsequencePath from "@/components/product/ConsequencePath";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type InstrumentValueReceiptItem = {
  label: string;
  value: string;
};

export type InstrumentShellProps = {
  title: string;
  slug: string;
  children: React.ReactNode;
  completed?: boolean;
  pdfHref?: string;
  nextStepLabel?: string;
  nextStepHref?: string;
  /** What the instrument produced — shown as a value receipt when completed */
  valueReceipt?: InstrumentValueReceiptItem[];
  /**
   * Signal authority block — the 7-question result architecture.
   * Shown when completed and present. Built via buildInstrumentSignalAuthority().
   */
  signalAuthority?: InstrumentSignalAuthority;
};

export default function InstrumentShell({
  title,
  slug,
  children,
  completed,
  pdfHref,
  nextStepLabel,
  nextStepHref,
  valueReceipt,
  signalAuthority,
}: InstrumentShellProps) {
  return (
    <Layout title={`${title} | Abraham of London`} description={`Interactive ${title} — live scoring engine.`}>
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
            {title} · Decision instrument
          </span>

          <div className="mt-6">
            {children}
          </div>

          {completed && (
            <>
              {/* SIGNAL AUTHORITY BLOCK — 7-question result architecture */}
              {signalAuthority && (
                <div className="mt-8 space-y-3">
                  {/* 1 + 2: What was found + why it matters */}
                  <div style={{
                    border: `1px solid ${severityColor(signalAuthority.severity)}30`,
                    backgroundColor: severityBg(signalAuthority.severity),
                    padding: "1.25rem 1.5rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: severityColor(signalAuthority.severity) }}>
                        {signalAuthority.severity}
                      </span>
                      <span style={{ height: "1px", flex: 1, backgroundColor: `${severityColor(signalAuthority.severity)}25` }} />
                      {signalAuthority.comparisonBand && (
                        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                          {signalAuthority.comparisonBand}
                        </span>
                      )}
                    </div>
                    {signalAuthority.comparisonBasisLabel && signalAuthority.comparisonMaturityLevel !== null && (
                      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>
                        Comparison basis: {signalAuthority.comparisonBasisLabel} · Distribution maturity {signalAuthority.comparisonMaturityLevel}/5
                      </p>
                    )}
                    <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.3, color: "rgba(255,255,255,0.90)", marginBottom: "0.4rem" }}>
                      {signalAuthority.conditionName}
                    </p>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.42)", fontStyle: "italic" }}>
                      {signalAuthority.patternTag}
                    </p>
                  </div>

                  {/* 4: What happens if nothing changes — consequence path (P4 ConsequencePath component) */}
                  <ConsequencePath
                    currentCondition={signalAuthority.conditionName}
                    thirtyDays={signalAuthority.consequence.thirtyDays}
                    sixtyDays={signalAuthority.consequence.sixtyDays}
                    ninetyDays={signalAuthority.consequence.ninetyDays}
                    compoundingPoint={null}
                    correctionPoint={null}
                    caveat={signalAuthority.caveat}
                  />

                  {/* 5 + 6: Differentiator + next admissible move */}
                  <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1rem 1.25rem" }}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.26)", marginBottom: "0.3rem" }}>
                        What changes the outcome
                      </p>
                      <p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "rgba(255,255,255,0.52)" }}>
                        {signalAuthority.differentiator}
                      </p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.3rem" }}>
                        Next admissible move
                      </p>
                      <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
                        {signalAuthority.nextMove}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VALUE RECEIPT — what the instrument produced */}
              {valueReceipt && valueReceipt.length > 0 && (
                <div className="mt-6" style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06`, padding: "16px 20px" }}>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
                    This instrument produced
                  </div>
                  <div className="mt-3 grid gap-2">
                    {valueReceipt.map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}60`, minWidth: "100px", paddingTop: "2px" }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
                    Result saved · Governed memory written
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {nextStepHref && nextStepLabel && (
                  <Link href={nextStepHref} className="flex items-center justify-between w-full" style={{ padding: "14px 18px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                    {nextStepLabel}
                    <ArrowRight style={{ width: 11, height: 11 }} />
                  </Link>
                )}
                {pdfHref && (
                  <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full" style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)", ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    <Download style={{ width: 10, height: 10 }} />
                    Download dossier (PDF)
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
