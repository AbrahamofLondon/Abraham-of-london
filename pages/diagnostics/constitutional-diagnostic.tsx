// pages/diagnostics/constitutional-diagnostic.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import ConstitutionalDiagnosticSuite from "@/components/assessments/ConstitutionalDiagnosticSuite";

export default function ConstitutionalDiagnosticPage() {
  return (
    <Layout
      title="Constitutional Diagnostic"
      description="A serious first gate for route, posture, authority, and escalation fitness."
    >
      <Head>
        <title>Constitutional Diagnostic | Abraham of London</title>
        <meta name="description" content="Constitutional diagnostic — the entry gate for institutional assessment." />
      </Head>
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
            <Link href="/diagnostics" className="hover:text-white/60 transition-colors">Diagnostics</Link>
            <span>/</span>
            <span className="text-white/60">Constitutional Diagnostic</span>
          </div>
        </div>
        <ConstitutionalDiagnosticSuite />
        <div className="mx-auto max-w-7xl px-6 mt-20 pt-12 border-t border-white/[0.06] text-center pb-20">
          <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-4">Next Layer</p>
          <Link href="/diagnostics/team-assessment" className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300/70 hover:text-amber-300 transition-colors">
            Team Assessment <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </Layout>
  );
}