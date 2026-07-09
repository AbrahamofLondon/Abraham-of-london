import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { ArrowRight, ShieldCheck, FileText, LockKeyhole, CheckCircle2, TrendingUp, BarChart3, Globe } from "lucide-react";

import Layout from "@/components/Layout";
import {
  getCurrentPublishedMarketIntelligenceReport,
  getUpcomingMarketIntelligenceReport,
  getPublishedArchiveMarketIntelligenceReports,
  getMarketIntelligenceRecord,
  MARKET_INTELLIGENCE_LIFECYCLE,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import { getCallsForReport } from "@/lib/intelligence/market-intelligence-call-ledger";
import {
  ink, ledger, paper, warm, graphite, evidenceGrey, brass, brassLight,
  mono, serif, StateBadge, EvidenceMeta, SectionLedger, AuthorityStamp,
  RelationshipNavigator,
} from "@/components/institutional";

type GatewayEdition = {
  editionId: string;
  shortTitle: string;
  headline: string;
  publishedAt: string | null;
  lifecycleState: string;
  isCurrent: boolean;
  isPurchasable: boolean;
  isPublic: boolean;
  href: string | null;
  checkoutHref: string | null;
};

type Props = {
  current: GatewayEdition | null;
  reference: GatewayEdition[];
  upcoming: GatewayEdition | null;
  callsReviewed: number;
  callsHeld: number;
  callsRevised: number;
  callsFalsified: number;
  pendingReview: number;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : value;
}

function GatewayCover({ current, upcoming, reference }: { current: GatewayEdition | null; upcoming: GatewayEdition | null; reference: GatewayEdition[] }) {
  return (
    <section className="px-6 pb-20 pt-28" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Global Market Intelligence</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.96] md:text-7xl" style={{ color: 'rgba(255,255,255,0.94)' }}>
          Market judgement with a memory.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8" style={{ color: 'rgba(255,255,255,0.58)' }}>
          Quarterly intelligence for boards, founders and operators making consequential decisions under fragmentation, capital selectivity, policy divergence and structural uncertainty.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          {current ? (
            <div className="flex items-center gap-3">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Current</span>
              <span className="font-mono text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>{current.shortTitle}</span>
            </div>
          ) : null}
          {upcoming ? (
            <div className="flex items-center gap-3">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: evidenceGrey }}>Next</span>
              <span className="font-mono text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{upcoming.shortTitle} · In preparation</span>
            </div>
          ) : null}
          {reference.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: evidenceGrey }}>Record</span>
              <span className="font-mono text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{reference[0]?.shortTitle ?? ""} · Reference edition</span>
            </div>
          ) : null}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          {current?.href ? (
            <Link href={current.href} className="inline-flex min-h-12 items-center gap-3 bg-white px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white/90">
              View current edition <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
          <Link href="#record" className="inline-flex min-h-12 items-center gap-3 border px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] transition hover:opacity-80" style={{ borderColor: brass + '40', color: brassLight }}>
            Inspect the record <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CurrentEdition({ edition }: { edition: GatewayEdition }) {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>Current edition</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.20em]" style={{ color: graphite }}>{edition.shortTitle}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl" style={{ color: '#11161C' }}>{edition.headline}</h2>
            <div className="mt-6 flex flex-wrap gap-6">
              <EvidenceMeta label="Published" value={formatDate(edition.publishedAt)} />
              <StateBadge state={edition.lifecycleState} />
              {edition.isPurchasable ? <span className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: graphite }}>Purchasable</span> : null}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              {edition.href ? (
                <Link href={edition.href} className="inline-flex min-h-11 items-center gap-2 border px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] transition hover:opacity-80" style={{ borderColor: brass + '45', color: graphite }}>
                  Explore {edition.shortTitle} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
              {edition.checkoutHref ? (
                <Link href={edition.checkoutHref} className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90" style={{ backgroundColor: brass }}>
                  Acquire {edition.shortTitle} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicationLine({ current, reference, upcoming }: { current: GatewayEdition | null; reference: GatewayEdition[]; upcoming: GatewayEdition | null }) {
  const allEditions = [
    ...reference.map(e => ({ ...e, role: 'REFERENCE' as const })),
    ...(current ? [{ ...current, role: 'CURRENT' as const }] : []),
    ...(upcoming ? [{ ...upcoming, role: 'UPCOMING' as const }] : []),
  ].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#11161C' }}>
      <div className="mx-auto max-w-4xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>The publication line</p>
        <div className="mt-10 space-y-0">
          {allEditions.map((ed, i) => (
            <div key={ed.editionId} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: ed.role === 'CURRENT' ? brass : ed.role === 'REFERENCE' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="font-mono text-[11px] font-bold" style={{ color: ed.role === 'CURRENT' ? '#11161C' : evidenceGrey }}>{ed.shortTitle.replace('Q', '').replace(' ', '')}</span>
                </div>
                {i < allEditions.length - 1 ? <div className="w-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} /> : null}
              </div>
              <div className="pb-10 pt-1">
                <div className="flex items-center gap-3">
                  <p className="font-serif text-xl" style={{ color: ed.role === 'CURRENT' ? 'rgba(255,255,255,0.92)' : ed.role === 'REFERENCE' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)' }}>{String(ed.shortTitle)}</p>
                  <StateBadge state={ed.role} />
                </div>
                <p className="mt-1 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>{ed.headline}</p>
                <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>
                  {ed.publishedAt ? `Published ${formatDate(ed.publishedAt)}` : 'In preparation'}
                </p>
                {ed.href && ed.role !== 'UPCOMING' ? (
                  <Link href={ed.href} className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                    {ed.role === 'CURRENT' ? 'View edition' : 'Inspect record'} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompoundingPrinciples() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: warm }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>Why the intelligence compounds</p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-5xl" style={{ color: '#11161C' }}>This intelligence line compounds through verification, not just publication.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            { num: '01', title: 'Every edition has a state', text: 'Current, reference, draft and release conditions remain explicit. No edition is published without passing governed gates.' },
            { num: '02', title: 'Every major call has a review path', text: 'Calls can hold, strengthen, weaken, revise or fail. Each outcome is recorded in the call ledger before the next edition is released.' },
            { num: '03', title: 'Evidence and judgement are separated', text: 'Observed evidence is not confused with interpretation. Every claim carries a posture label — Confirmed, Directional, Monitoring, or Scenario assumption.' },
            { num: '04', title: 'The record remains inspectable', text: 'Historical judgement is retained rather than quietly overwritten. Past editions remain visible so the current edition can be judged against a visible prior record.' },
          ].map((p) => (
            <div key={p.num} className="border-t pt-4" style={{ borderColor: brass + '45' }}>
              <p className="font-mono text-[12px] font-bold" style={{ color: brass }}>{p.num}</p>
              <h3 className="mt-2 font-serif text-xl" style={{ color: '#11161C' }}>{p.title}</h3>
              <p className="mt-2 text-sm leading-7" style={{ color: graphite }}>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountabilityEvidence({ current, reference, callsReviewed, callsHeld, callsRevised, callsFalsified, pendingReview }: Props) {
  const priorEdition = reference[0];
  return (
    <section className="px-6 py-20" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Accountability</p>
            <h2 className="mt-4 font-serif text-3xl text-white">What happened to the previous edition's calls?</h2>
            <div className="mt-6 space-y-4">
              <EvidenceMeta label="Prior edition" value={priorEdition?.shortTitle ?? 'None'} />
              <EvidenceMeta label="Successor review" value={current?.shortTitle ?? 'None'} />
              <EvidenceMeta label="Calls reviewed" value={String(callsReviewed)} />
              <EvidenceMeta label="Held / strengthened" value={String(callsHeld)} />
              <EvidenceMeta label="Revised / weakened" value={String(callsRevised)} />
              <EvidenceMeta label="Falsified" value={String(callsFalsified)} />
              <EvidenceMeta label="Pending review" value={String(pendingReview)} />
            </div>
          </div>
          <div>
            <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Evidence</p>
            <h2 className="mt-4 font-serif text-3xl text-white">What supports the current edition?</h2>
            <div className="mt-6 space-y-4">
              <EvidenceMeta label="Current edition" value={current?.shortTitle ?? 'None'} />
              <EvidenceMeta label="Published" value={formatDate(current?.publishedAt ?? null)} />
              <EvidenceMeta label="State" value={current?.lifecycleState?.replace(/_/g, ' ') ?? 'Unknown'} />
              <EvidenceMeta label="Access" value={current?.isPublic ? 'Public' : 'Restricted'} />
              {current?.isPurchasable ? <EvidenceMeta label="Acquisition" value="Available" /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MethodologyTrust() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: paper }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: '#7A6A4C' }}>How GMI is governed</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Cross-Edition Review', href: '/market-intelligence/cross-edition-review', desc: 'What changed between editions.' },
            { label: 'Decision Integrity Index', href: '/market-intelligence/dii', desc: 'How disciplined judgement is measured.' },
            { label: 'Learning Log', href: '/market-intelligence/learning-log', desc: 'What the system learned from outcomes.' },
            { label: 'Trust Centre', href: '/trust-centre', desc: 'What can be claimed, sold, released or withheld.' },
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

function Record({ current, reference, upcoming }: { current: GatewayEdition | null; reference: GatewayEdition[]; upcoming: GatewayEdition | null }) {
  return (
    <section id="record" className="px-6 py-20" style={{ backgroundColor: ink }}>
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>The record</p>
        <div className="mt-8 space-y-4">
          {current ? (
            <div className="flex items-center justify-between gap-4 border-l-2 py-3 pl-5" style={{ borderColor: brass }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: brassLight }}>Current</span>
                  <span className="font-mono text-[12px]" style={{ color: evidenceGrey }}>{current.editionId}</span>
                </div>
                <p className="mt-1 font-serif text-xl text-white">{current.shortTitle}</p>
                <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{current.publishedAt ? `Published ${formatDate(current.publishedAt)}` : ''}</p>
              </div>
              {current.href ? (
                <Link href={current.href} className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                  Explore edition <ArrowRight className="inline h-3 w-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}
          {reference.map((ed) => (
            <div key={ed.editionId} className="flex items-center justify-between gap-4 border-l-2 py-3 pl-5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: evidenceGrey }}>Reference</span>
                  <span className="font-mono text-[12px]" style={{ color: evidenceGrey }}>{ed.editionId}</span>
                </div>
                <p className="mt-1 font-serif text-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>{ed.shortTitle}</p>
                <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>{ed.publishedAt ? `Published ${formatDate(ed.publishedAt)}` : ''}</p>
              </div>
              {ed.href ? (
                <Link href={ed.href} className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: evidenceGrey }}>
                  Inspect record <ArrowRight className="inline h-3 w-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          ))}
          {upcoming ? (
            <div className="flex items-center justify-between gap-4 border-l-2 border-dashed py-3 pl-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: evidenceGrey }}>Next</span>
                  <span className="font-mono text-[12px]" style={{ color: evidenceGrey }}>{upcoming.editionId}</span>
                </div>
                <p className="mt-1 font-serif text-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>{upcoming.shortTitle}</p>
                <p className="font-mono text-[11px]" style={{ color: evidenceGrey }}>In preparation</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-10">
          <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>Accountability pathways</p>
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              { label: 'Cross-Edition Review', href: '/market-intelligence/cross-edition-review' },
              { label: 'Decision Integrity Index', href: '/market-intelligence/dii' },
              { label: 'Learning Log', href: '/market-intelligence/learning-log' },
              { label: 'Trust Centre', href: '/trust-centre' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="font-mono text-[11px] uppercase tracking-[0.14em] transition hover:opacity-70" style={{ color: brassLight }}>
                {item.label} <ArrowRight className="inline h-3 w-3" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const currentRecord = getCurrentPublishedMarketIntelligenceReport() as any;
  const upcomingRecord = getUpcomingMarketIntelligenceReport();
  const archiveRecords = getPublishedArchiveMarketIntelligenceReports();

  const toGateway = (r: typeof currentRecord): GatewayEdition | null => {
    if (!r) return null;
    return {
      editionId: r.id,
      shortTitle: `${r.quarter} ${r.year}`,
      headline: r.title.replace('Global Market Intelligence ', ''),
      publishedAt: r.publishedAt ?? null,
      lifecycleState: r.lifecycleState,
      isCurrent: r.id === currentRecord?.id,
      isPurchasable: r.purchasable,
      isPublic: r.publicVisible,
      href: r.publicHref ?? null,
      checkoutHref: r.purchasable ? `/api/billing/checkout?productCode=gmi_${r.id.toLowerCase().replace(/-/g, '_')}` : null,
    };
  };

  const current = toGateway(currentRecord);
  const reference = archiveRecords.map(toGateway).filter((e): e is GatewayEdition => e !== null);
  const upcoming = toGateway(upcomingRecord);

  // Call review data from the current edition's predecessor
  const priorId = currentRecord?.replaces;
  const priorCalls = priorId ? (getCallsForReport(priorId) as any[]) : [];
  const callsReviewed = priorCalls.filter((c: any) => c.score !== null && c.score !== undefined).length;
  const callsHeld = priorCalls.filter((c: any) => c.score !== null && c.score !== undefined && c.score >= 3).length;
  const callsRevised = priorCalls.filter((c: any) => c.score !== null && c.score !== undefined && c.score === 2).length;
  const callsFalsified = priorCalls.filter((c: any) => c.outcomeStatus === 'DISCONFIRMED').length;
  const pendingReview = priorCalls.filter((c: any) => c.score === null || c.score === undefined).length;

  return {
    props: {
      current,
      reference,
      upcoming,
      callsReviewed,
      callsHeld,
      callsRevised,
      callsFalsified,
      pendingReview,
    },
    revalidate: 1800,
  };
};

const IntelligenceMarketPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  return (
    <Layout
      title="Global Market Intelligence | Abraham of London"
      description="The GMI publication family — current edition, reference archive, forthcoming releases, and accountability record."
      canonicalUrl="/intelligence/market"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen" style={{ backgroundColor: ink, color: 'rgba(255,255,255,0.92)' }}>
        <GatewayCover current={props.current} upcoming={props.upcoming} reference={props.reference} />
        {props.current ? <CurrentEdition edition={props.current} /> : null}
        <PublicationLine current={props.current} reference={props.reference} upcoming={props.upcoming} />
        <CompoundingPrinciples />
        <AccountabilityEvidence {...props} />
        <MethodologyTrust />
        <Record current={props.current} reference={props.reference} upcoming={props.upcoming} />
      </main>
    </Layout>
  );
};

export default IntelligenceMarketPage;
