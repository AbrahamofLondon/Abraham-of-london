import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { ArrowRight, ShieldCheck, FileText, LockKeyhole, TrendingUp, BarChart3, Globe } from "lucide-react";

import Layout from "@/components/Layout";
import { getCurrentPublishedMarketIntelligenceReport } from "@/lib/intelligence/market-intelligence-lifecycle";
import {
  ink, ledger, paper, warm, graphite, evidenceGrey, brass, brassLight,
  mono, serif, StateBadge, EvidenceMeta, SectionLedger, AuthorityStamp, RelationshipNavigator,
} from "@/components/institutional";

type FeaturedEntry = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

type Props = {
  featured: FeaturedEntry | null;
  currentEdition: { shortTitle: string; headline: string; publishedAt: string | null; href: string | null } | null;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : value;
}

function IntelligenceCover() {
  return (
    <section className="px-6 pb-20 pt-28" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Intelligence</p>
        <h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[0.96] md:text-7xl" style={{ color: 'rgba(255,255,255,0.94)' }}>
          Intelligence is not the accumulation of information.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8" style={{ color: 'rgba(255,255,255,0.58)' }}>
          It is the disciplined reading of consequence before consequence becomes unavoidable.
          Abraham of London intelligence systems help boards, founders, operators and institutions
          recognise pressure, test consequential decisions, preserve decision memory and act through governed systems.
        </p>
        <div className="mt-10 flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Read</span><span className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Public intelligence</span></div>
          <div className="flex items-center gap-2"><span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Test</span><span className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Diagnostics</span></div>
          <div className="flex items-center gap-2"><span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Govern</span><span className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Decision Centre</span></div>
          <div className="flex items-center gap-2"><span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Escalate</span><span className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Boardroom Brief</span></div>
          <div className="flex items-center gap-2"><span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Continue</span><span className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Executive Reporting / Retained Continuity</span></div>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/intelligence/decision-delay-governance-cost" className="inline-flex min-h-12 items-center gap-3 bg-white px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white/90">
            Start with public intelligence <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="#architecture" className="inline-flex min-h-12 items-center gap-3 border px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] transition hover:opacity-80" style={{ borderColor: brass + '40', color: brassLight }}>
            Explore the intelligence architecture <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhereToBegin() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>Where to begin</p>
        <div className="mt-8 space-y-0">
          {[
            { num: '01', title: 'Recognise the pattern', body: 'Read public intelligence to identify a pressure, contradiction or emerging decision condition.', href: '/intelligence/decision-delay-governance-cost', label: 'Read public intelligence' },
            { num: '02', title: 'Test a real decision', body: 'Use a diagnostic when the issue becomes specific enough to test.', href: '/diagnostics/fast', label: 'Begin a diagnostic' },
            { num: '03', title: 'Preserve the decision', body: 'Move a consequential case into the Decision Centre, where evidence, state and decision memory continue.', href: '/decision-centre', label: 'Open Decision Centre' },
            { num: '04', title: 'Escalate when required', body: 'Boardroom Brief, Executive Reporting or retained continuity when the decision needs institutional treatment.', href: '/boardroom', label: 'Review escalation pathways', dim: true },
          ].map((step) => (
            <div key={step.num} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: brass }}>
                  <span className="font-mono text-[11px] font-bold" style={{ color: '#11161C' }}>{step.num}</span>
                </div>
                <div className="w-px flex-1" style={{ backgroundColor: 'rgba(17,22,28,0.12)' }} />
              </div>
              <div className="pb-10 pt-1">
                <h3 className="font-serif text-xl" style={{ color: '#11161C' }}>{step.title}</h3>
                <p className="mt-1 text-sm leading-7" style={{ color: graphite }}>{step.body}</p>
                {step.dim ? (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>{step.label}</p>
                ) : (
                  <Link href={step.href} className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brass }}>
                    {step.label} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7" style={{ color: evidenceGrey }}>The path is eligibility-driven. Not everyone should progress automatically.</p>
      </div>
    </section>
  );
}

function LiveIntelligenceNow({ featured, currentEdition }: Props) {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#11161C' }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Live intelligence now</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featured ? (
            <div className="border p-5" style={{ borderColor: brass + '20', backgroundColor: brass + '06' }}>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Featured public intelligence</p>
              <h3 className="mt-3 font-serif text-xl text-white">{featured.title}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>{featured.summary}</p>
              <Link href={featured.href} className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                Read <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          ) : null}
          {currentEdition ? (
            <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Global Market Intelligence</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>{currentEdition.shortTitle} · Current edition</p>
              <h3 className="mt-1 font-serif text-lg text-white">{currentEdition.headline}</h3>
              <p className="font-mono text-[10px]" style={{ color: evidenceGrey }}>Published {formatDate(currentEdition.publishedAt)}</p>
              {currentEdition.href ? (
                <Link href={currentEdition.href} className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                  Explore current edition <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}
          <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Test a decision</p>
            <h3 className="mt-3 font-serif text-xl text-white">Fast Diagnostic</h3>
            <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>The public entry point for a live decision under pressure.</p>
            <Link href="/diagnostics/fast" className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
              Begin diagnostic <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntelligenceArchitecture() {
  const domains = [
    { title: 'Decision Intelligence', items: [
      { label: 'Public intelligence', href: '/intelligence/decision-delay-governance-cost' },
      { label: 'Diagnostics', href: '/diagnostics' },
      { label: 'Decision Centre', href: '/decision-centre' },
      { label: 'Boardroom escalation', href: '/boardroom' },
    ]},
    { title: 'Market Intelligence', items: [
      { label: 'GMI publication family', href: '/intelligence/market' },
      { label: 'Quarterly editions', href: '/intelligence/gmi' },
      { label: 'Calls and falsification', href: '/intelligence/gmi/calls' },
      { label: 'Cross-edition accountability', href: '/market-intelligence/cross-edition-review' },
    ]},
    { title: 'Institutional Memory', items: [
      { label: 'Decision memory', href: '/intelligence/memory' },
      { label: 'Learning Log', href: '/market-intelligence/learning-log' },
      { label: 'Historical decision record', href: '/intelligence/contradictions' },
      { label: 'Continuity', href: '/retainers' },
    ]},
    { title: 'Contradiction Intelligence', items: [
      { label: 'Evidence conflict', href: '/intelligence/contradictions' },
      { label: 'Record inconsistency', href: '/market-intelligence/cross-edition-review' },
      { label: 'State divergence', href: '/trust-centre' },
      { label: 'User-safe contradiction signals', href: '/intelligence/contradictions' },
    ]},
  ];

  return (
    <section id="architecture" className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>The intelligence architecture</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {domains.map((domain) => (
            <div key={domain.title}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brass }}>{domain.title}</p>
              <div className="mt-4 space-y-2">
                {domain.items.map((item) => (
                  <Link key={item.label} href={item.href} className="block border-l-2 py-1.5 pl-3 text-sm transition hover:opacity-70" style={{ borderColor: brass + '30', color: graphite }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t pt-6" style={{ borderColor: 'rgba(17,22,28,0.1)' }}>
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brass }}>Governance and trust</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {[
              { label: 'Decision Integrity Index', href: '/market-intelligence/dii' },
              { label: 'Trust Centre', href: '/trust-centre' },
              { label: 'Provenance', href: '/provenance/demo' },
              { label: 'Release authority', href: '/trust-centre' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: graphite }}>
                {item.label} <ArrowRight className="inline h-3 w-3" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowIntelligenceBecomesAction() {
  const stages = [
    { label: 'Signal', purpose: 'Recognise a consequential condition.', doesNotImply: 'The reader has a case.', next: 'Use a diagnostic only when the issue is specific.' },
    { label: 'Public Intelligence', purpose: 'Understand the pressure pattern.', doesNotImply: 'A decision has been tested.', next: 'Move to diagnostic when the condition becomes actionable.' },
    { label: 'Diagnostic', purpose: 'Test one real decision under pressure.', doesNotImply: 'The case is under governance.', next: 'Escalate to Decision Centre when evidence justifies it.' },
    { label: 'Governed Case', purpose: 'Preserve evidence, state and decision memory.', doesNotImply: 'Boardroom escalation is warranted.', next: 'Boardroom Brief when the case qualifies.' },
    { label: 'Boardroom Decision', purpose: 'Institutional decision with accountability record.', doesNotImply: 'Continuous oversight is active.', next: 'Executive Reporting or Retained Continuity for ongoing cases.' },
    { label: 'Reporting / Continuity', purpose: 'Track outcomes, drift and recurrence over time.', doesNotImply: 'The case is closed.', next: 'Return Brief if the condition re-emerges.' },
  ];

  return (
    <section className="px-6 py-20" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>How intelligence becomes action</p>
        <div className="mt-8 space-y-0">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: i === 0 ? brass : 'rgba(255,255,255,0.1)' }}>
                  <span className="font-mono text-[10px] font-bold" style={{ color: i === 0 ? '#11161C' : evidenceGrey }}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                {i < stages.length - 1 ? <div className="w-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} /> : null}
              </div>
              <div className="pb-8 pt-1">
                <p className="font-serif text-lg text-white">{stage.label}</p>
                <p className="mt-1 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}><span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: brassLight }}>Purpose:</span> {stage.purpose}</p>
                <p className="text-sm leading-6" style={{ color: 'rgba(255,255,255,0.35)' }}><span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>Does not imply:</span> {stage.doesNotImply}</p>
                <p className="text-sm leading-6" style={{ color: 'rgba(255,255,255,0.35)' }}><span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>Next:</span> {stage.next}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountabilitySystem() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>Accountability system</p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-5xl" style={{ color: '#11161C' }}>Intelligence should leave a record of whether it was right.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Cross-Edition Review', href: '/market-intelligence/cross-edition-review', desc: 'What changed between editions.' },
            { label: 'Decision Integrity Index', href: '/market-intelligence/dii', desc: 'How judgement discipline is assessed.' },
            { label: 'Learning Log', href: '/market-intelligence/learning-log', desc: 'What outcomes changed in the model.' },
            { label: 'Trust Centre', href: '/trust-centre', desc: 'What can be claimed, released, sold or withheld.' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="border p-5 transition hover:opacity-80" style={{ borderColor: 'rgba(17,22,28,0.15)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brass }}>{item.label}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: graphite }}>{item.desc}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: brassLight }}>Open →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryAndContradiction() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Memory</p>
            <div className="mt-4 space-y-3">
              {['What changed?', 'What carried forward?', 'What did the record learn?', 'What is stale?', 'What remains unresolved?'].map((q) => (
                <p key={q} className="border-l-2 py-1 pl-3 text-sm" style={{ borderColor: brass + '40', color: 'rgba(255,255,255,0.65)' }}>{q}</p>
              ))}
            </div>
            <Link href="/intelligence/memory" className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
              Explore decision memory <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <div>
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Contradiction</p>
            <div className="mt-4 space-y-3">
              {['Where does the evidence disagree?', 'Where does the case state conflict?', 'Where does a claim no longer match the record?', 'What requires review?'].map((q) => (
                <p key={q} className="border-l-2 py-1 pl-3 text-sm" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>{q}</p>
              ))}
            </div>
            <Link href="/intelligence/contradictions" className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
              Review contradictions <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
        <p className="mt-10 max-w-3xl text-sm leading-7" style={{ color: evidenceGrey }}>
          Memory preserves continuity. Contradiction prevents continuity from becoming self-deception.
        </p>
      </div>
    </section>
  );
}

function Pathways() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>Pathways</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Public Intelligence', href: '/intelligence/decision-delay-governance-cost', role: 'Read' },
            { label: 'Market Intelligence', href: '/intelligence/market', role: 'Explore GMI' },
            { label: 'Decision Centre', href: '/decision-centre', role: 'Govern a live case' },
            { label: 'Accountability', href: '/market-intelligence/cross-edition-review', role: 'Inspect review systems' },
            { label: 'Trust', href: '/trust-centre', role: 'Inspect authority' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="border p-5 transition hover:opacity-80" style={{ borderColor: 'rgba(17,22,28,0.15)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: brass }}>{item.role}</p>
              <p className="mt-2 font-serif text-lg" style={{ color: '#11161C' }}>{item.label}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: brassLight }}>Open →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const current = getCurrentPublishedMarketIntelligenceReport();

  return {
    props: {
      featured: {
        id: "decision-delay-governance-cost",
        title: "When Delay Becomes a Governance Cost",
        summary: "A public decision-intelligence brief on how unresolved decisions create hidden governance cost, execution drag, and avoidable exposure.",
        href: "/intelligence/decision-delay-governance-cost",
      },
      currentEdition: current ? {
        shortTitle: `${current.quarter} ${current.year}`,
        headline: current.title.replace('Global Market Intelligence ', ''),
        publishedAt: current.publishedAt ?? null,
        href: current.publicHref ?? null,
      } : null,
    },
    revalidate: 1800,
  };
};

const IntelligenceIndexPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  return (
    <Layout
      title="Intelligence | Abraham of London"
      description="Decision intelligence, market intelligence, institutional memory, contradiction awareness and accountability systems."
      canonicalUrl="/intelligence"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen" style={{ backgroundColor: ink, color: 'rgba(255,255,255,0.92)' }}>
        <IntelligenceCover />
        <WhereToBegin />
        <LiveIntelligenceNow {...props} />
        <IntelligenceArchitecture />
        <HowIntelligenceBecomesAction />
        <AccountabilitySystem />
        <MemoryAndContradiction />
        <Pathways />
      </main>
    </Layout>
  );
};

export default IntelligenceIndexPage;
