import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRight, ShieldCheck, FileText, LockKeyhole, TrendingUp, BarChart3, Globe, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

import Layout from "@/components/Layout";
import {
  ink, ledger, paper, warm, graphite, evidenceGrey, brass, brassLight,
  mono, serif, StateBadge, EvidenceMeta, SectionLedger, AuthorityStamp, RelationshipNavigator,
} from "@/components/institutional";

const diagnostics = [
  {
    id: "fast",
    title: "Fast Diagnostic",
    question: "Is this decision under pressure?",
    returns: "Decision classification, primary failure exposure, governing tension, minimum viable move.",
    bestFor: "One decision under pressure.",
    time: "5 min",
    access: "Free",
    href: "/diagnostics/fast",
    cta: "Test a decision",
    state: "OPEN",
  },
  {
    id: "purpose",
    title: "Personal Decision Audit",
    question: "Are my decisions aligned with my mandate?",
    returns: "Mandate reading, obligation conflict map, decision behaviour pattern.",
    bestFor: "Personal mandate or competing obligations.",
    time: "12 min",
    access: "Free reading · Paid dossier",
    href: "/diagnostics/purpose-alignment",
    cta: "Start Personal Decision Audit",
    state: "OPEN",
  },
  {
    id: "constitutional",
    title: "Constitutional Diagnostic",
    question: "Is the real issue governance, authority or trust?",
    returns: "Structural diagnosis, authority mapping, escalation pathway.",
    bestFor: "Authority, trust or governance issue.",
    time: "15 min",
    access: "Free",
    href: "/diagnostics/constitutional-diagnostic",
    cta: "Run Constitutional Diagnostic",
    state: "AVAILABLE",
  },
  {
    id: "team",
    title: "Team Assessment",
    question: "Do leadership intent and team reality describe the same organisation?",
    returns: "Leadership reading, team reality, gap magnitude, fragility state.",
    bestFor: "Leadership-team divergence.",
    time: "20 min",
    access: "Free",
    href: "/diagnostics/team-assessment",
    cta: "Open Team Assessment",
    state: "GATED",
  },
  {
    id: "enterprise",
    title: "Enterprise Assessment",
    question: "Where has organisational strain become systemic?",
    returns: "Enterprise posture, systemic strain pattern, weakest domains, governance implication.",
    bestFor: "Organisation-wide condition.",
    time: "30 min",
    access: "Free",
    href: "/diagnostics/enterprise-assessment",
    cta: "Open Enterprise Assessment",
    state: "GATED",
  },
];

const DiagnosticsIndexPage: NextPage = () => {
  return (
    <Layout
      title="Diagnostics | Abraham of London"
      description="Enter through evidence. Test a real decision, then earn the next surface only if the record justifies it."
      canonicalUrl="/diagnostics"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen" style={{ backgroundColor: ink, color: 'rgba(255,255,255,0.92)' }}>
        {/* 01 — Hero */}
        <section className="px-6 pb-20 pt-28" style={{ backgroundColor: ink }}>
          <div className="mx-auto max-w-6xl">
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Diagnostics</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.96] md:text-7xl" style={{ color: 'rgba(255,255,255,0.94)' }}>
              Enter through evidence.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8" style={{ color: 'rgba(255,255,255,0.58)' }}>
              Start with one real decision under pressure. The system will decide whether anything further is warranted.
              Each surface is earned by the evidence record, not by navigation.
            </p>
          </div>
        </section>

        {/* 02 — Decision-condition selector */}
        <section className="px-6 py-20" style={{ backgroundColor: '#11161C' }}>
          <div className="mx-auto max-w-6xl">
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Choose your entry</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {diagnostics.map((d) => (
                <Link key={d.id} href={d.href} className={`border p-5 transition hover:opacity-80 ${d.state === 'GATED' ? 'opacity-60' : ''}`} style={{ borderColor: d.state === 'GATED' ? 'rgba(255,255,255,0.06)' : brass + '20', backgroundColor: d.state === 'GATED' ? 'rgba(255,255,255,0.01)' : brass + '06' }}>
                  <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: d.state === 'GATED' ? evidenceGrey : brassLight }}>{d.title}</p>
                  <p className="mt-3 font-serif text-lg" style={{ color: d.state === 'GATED' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)' }}>{d.question}</p>
                  <p className="mt-2 text-sm leading-6" style={{ color: d.state === 'GATED' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)' }}>{d.returns}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{d.time}</span>
                    <span className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{d.access}</span>
                  </div>
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: d.state === 'GATED' ? evidenceGrey : brassLight }}>
                    {d.cta} <ArrowRight className="inline h-3 w-3" aria-hidden />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — Evidence accumulation path */}
        <section className="px-6 py-20" style={{ backgroundColor: paper }}>
          <div className="mx-auto max-w-6xl">
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>How evidence accumulates</p>
            <div className="mt-8 space-y-0">
              {[
                { num: '01', label: 'Decision', desc: 'One decision under pressure. Fast Diagnostic or Personal Decision Audit.', color: brass },
                { num: '02', label: 'Structure', desc: 'Governance, authority and trust. Constitutional Diagnostic.', color: brass },
                { num: '03', label: 'Team', desc: 'Leadership intent vs team reality. Team Assessment.', color: brass },
                { num: '04', label: 'Enterprise', desc: 'Systemic organisational strain. Enterprise Assessment.', color: brass },
                { num: '05', label: 'Controlled consequence', desc: 'Executive Reporting and Enterprise Decision Authority.', color: evidenceGrey },
              ].map((step) => (
                <div key={step.num} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: step.color }}>
                      <span className="font-mono text-[11px] font-bold" style={{ color: step.color === brass ? '#11161C' : ink }}>{step.num}</span>
                    </div>
                    <div className="w-px flex-1" style={{ backgroundColor: 'rgba(17,22,28,0.12)' }} />
                  </div>
                  <div className="pb-8 pt-1">
                    <h3 className="font-serif text-xl" style={{ color: '#11161C' }}>{step.label}</h3>
                    <p className="mt-1 text-sm leading-7" style={{ color: graphite }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — Controlled layer */}
        <section className="px-6 py-20" style={{ backgroundColor: ink }}>
          <div className="mx-auto max-w-6xl">
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Controlled consequence layer</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="border p-6" style={{ borderColor: brass + '20', backgroundColor: brass + '06' }}>
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Executive Reporting</p>
                <p className="mt-3 font-serif text-xl text-white">Earned consequence review</p>
                <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>Becomes available when the evidence shows decision stakes, consequence, and sufficient seriousness. Not a starting point.</p>
                <Link href="/diagnostics/executive-reporting" className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                  Review Executive Reporting gate <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
              <div className="border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: evidenceGrey }}>Enterprise Decision Authority</p>
                <p className="mt-3 font-serif text-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>Organisational-grade pipeline</p>
                <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Reached after individual evidence establishes that an organisational-level reading is warranted. Not an entry point.</p>
                <Link href="/enterprise-decision-authority" className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: evidenceGrey }}>
                  Learn about this surface <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — Family navigator */}
        <section className="px-6 py-14" style={{ backgroundColor: paper }}>
          <div className="mx-auto max-w-6xl">
            <RelationshipNavigator
              upstream={[{ label: "Intelligence", href: "/intelligence" }]}
              current="Diagnostics"
              downstream={[{ label: "Decision Centre", href: "/decision-centre" }, { label: "Boardroom", href: "/boardroom" }]}
            />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default DiagnosticsIndexPage;
