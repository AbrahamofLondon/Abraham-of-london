/**
 * InstrumentShell — shared wrapper for all interactive instrument runners.
 * Handles: entitlement check, layout, progress, PDF secondary CTA.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type InstrumentShellProps = {
  title: string;
  slug: string;
  children: React.ReactNode;
  completed?: boolean;
  pdfHref?: string;
  nextStepLabel?: string;
  nextStepHref?: string;
};

export default function InstrumentShell({ title, slug, children, completed, pdfHref, nextStepLabel, nextStepHref }: InstrumentShellProps) {
  return (
    <Layout title={`${title} | Abraham of London`} description={`Interactive ${title} — live scoring engine.`}>
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
            {title} · Interactive instrument
          </span>

          <div className="mt-6">
            {children}
          </div>

          {completed && (
            <div className="mt-8 space-y-3">
              {nextStepHref && nextStepLabel && (
                <Link href={nextStepHref} className="flex items-center justify-between w-full" style={{ padding: "14px 18px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  {nextStepLabel}
                  <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              )}
              {pdfHref && (
                <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full" style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)", ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  <Download style={{ width: 10, height: 10 }} />
                  Download PDF worksheet
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
