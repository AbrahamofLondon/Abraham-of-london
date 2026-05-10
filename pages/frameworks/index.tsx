import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import { getAllPlaybooks, getAllResources } from "@/lib/content/server";
import { INSTRUMENT_REGISTRY, type InstrumentSlug } from "@/lib/instruments/governed-instrument-contract";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type ContentItem = { title: string; href: string; description: string; tier?: string };

type Props = {
  featuredFrameworks: ContentItem[];
  featuredPlaybooks: ContentItem[];
};

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSlug(value: unknown): string {
  return safeString(value).replace(/^\/+|\/+$/g, "").replace(/^playbooks\//i, "").replace(/^resources\/strategic-frameworks\//i, "");
}

// ── Instrument card ──
function InstrumentCard({ slug }: { slug: InstrumentSlug }) {
  const meta = INSTRUMENT_REGISTRY[slug];
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem" }}>
      <div className="flex items-baseline justify-between gap-3">
        <Link href={`/decision-instruments/${slug}`} className="text-sm text-white/80 hover:underline underline-offset-4">{meta.title}</Link>
        <span style={{ ...mono, fontSize: "11px", color: GOLD }}>{meta.price}</span>
      </div>
      <p className="mt-1.5 text-xs text-white/40">{meta.whatItTests}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}70` }}>Paid instrument</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)" }}>{meta.timeEstimate}</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.40)" }}>Writes to memory</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.40)" }}>Dossier eligible</span>
      </div>
    </div>
  );
}

// ── Playbook card ──
function PlaybookCard({ title, href, description, tier }: ContentItem) {
  const isFree = !tier || tier === "public" || tier === "member";
  const label = isFree ? "Free method brief" : tier === "architect" || tier === "owner" ? "Restricted architect material" : "Governed playbook";
  return (
    <div style={{ borderLeft: `1px solid ${isFree ? "rgba(110,231,183,0.25)" : `${GOLD}32`}`, paddingLeft: "12px" }}>
      <div className="flex items-baseline justify-between gap-3">
        <Link href={href} className="text-sm text-white/80 hover:underline underline-offset-4">{title}</Link>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: isFree ? "rgba(110,231,183,0.50)" : `${GOLD}70` }}>{label}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
    </div>
  );
}

// ── Pack card ──
function PackCard({ name, price, count, status }: { name: string; price: string; count: number; status: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem" }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-white/70">{name}</span>
        <span style={{ ...mono, fontSize: "11px", color: GOLD }}>{price}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}70` }}>Pack</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>{count} instruments</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(253,186,116,0.40)" }}>{status}</span>
      </div>
    </div>
  );
}

// ── Governed playbook product card ──
function GovernedPlaybookCard({ title, price, time, href, description }: { title: string; price: string; time: string; href: string; description: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem" }}>
      <div className="flex items-baseline justify-between gap-3">
        <Link href={href} className="text-sm text-white/80 hover:underline underline-offset-4">{title}</Link>
        <span style={{ ...mono, fontSize: "11px", color: GOLD }}>{price}</span>
      </div>
      <p className="mt-1.5 text-xs text-white/40">{description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}70` }}>Governed playbook</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)" }}>{time}</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.40)" }}>Checkpoint eligible</span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.40)" }}>Writes to memory</span>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const playbooks = getAllPlaybooks()
    .filter((doc: any) => doc?.draft !== true && doc?.published !== false)
    .slice(0, 6)
    .map((doc: any) => ({
      title: safeString(doc.title, "Untitled playbook"),
      href: `/playbooks/${normalizeSlug(doc.urlSlug || doc.slug)}`,
      description: safeString(doc.description || doc.summary || doc.excerpt, "Execution playbook."),
      tier: safeString(doc.tier || doc.accessTier, "public"),
    }));

  const frameworks = getAllResources()
    .filter((doc: any) => String(doc?._raw?.sourceFilePath || "").includes("strategic-frameworks"))
    .slice(0, 6)
    .map((doc: any) => ({
      title: safeString(doc.title, "Untitled framework"),
      href: `/resources/strategic-frameworks/${normalizeSlug(doc.slug || doc.url || doc._raw?.flattenedPath)}`,
      description: safeString(doc.description || doc.summary || doc.excerpt, "Strategic framework."),
      tier: safeString(doc.tier || doc.accessTier, "public"),
    }));

  return { props: { featuredFrameworks: frameworks, featuredPlaybooks: playbooks }, revalidate: 1800 };
};

const INSTRUMENT_ORDER: InstrumentSlug[] = [
  "decision-exposure-instrument",
  "escalation-readiness-scorecard",
  "structural-failure-diagnostic-canvas",
  "execution-risk-index",
  "team-alignment-gap-map",
  "mandate-clarity-framework",
  "governance-drift-detector",
  "strategic-priority-stack-builder",
  "intervention-path-selector",
  "board-brief-template",
];

const FrameworksPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  featuredFrameworks,
  featuredPlaybooks,
}) => {
  return (
    <Layout
      title="Governed Decision Intelligence | Abraham of London"
      description="Decision instruments, governed playbooks, frameworks, and operator packs."
      canonicalUrl="/frameworks"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Governed Decision Intelligence</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Instruments, playbooks, frameworks, and operator packs.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Every product tests a real decision condition, produces a source-labelled governed output, writes into institutional memory, and earns or restricts the next step.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/decision-instruments/signal" style={{ padding: "8px 16px", border: `1px solid ${GOLD}40`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                Free Decision Signal
              </Link>
              <Link href="/decision-instruments" style={{ padding: "8px 16px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)", ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                All instruments
              </Link>
            </div>
          </header>

          {/* ── DECISION INSTRUMENTS ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
            <div className="flex items-center justify-between gap-3">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Decision instruments</p>
              <Link href="/decision-instruments" className="text-xs text-white/50 underline-offset-4 hover:underline">View all &rarr;</Link>
            </div>
            <p className="mt-2 text-xs text-white/35">Paid instruments that score, classify, or map a specific decision dimension. Each writes to decision memory and produces a dossier-ready output.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {INSTRUMENT_ORDER.map((slug) => <InstrumentCard key={slug} slug={slug} />)}
            </div>
          </section>

          {/* ── GOVERNED PLAYBOOKS ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Governed playbooks</p>
            <p className="mt-2 text-xs text-white/35">Interactive methodology runs with checkpoint tracking. Playbooks guide a governed process over time — they are not static PDFs.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <GovernedPlaybookCard title="Execution Integrity Protocol" price={getProductDisplayPrice("execution_integrity_protocol")} time="15 min" href="/playbooks/execution-integrity-protocol" description="Restore execution discipline without rewriting strategy." />
              <GovernedPlaybookCard title="The Alignment Audit Playbook" price={getProductDisplayPrice("alignment_audit_playbook")} time="20 min" href="/playbooks/the-alignment-audit-playbook" description="Diagnose organisational misalignment before intervention." />
              <GovernedPlaybookCard title="The Drift Detection Framework" price={getProductDisplayPrice("drift_detection_framework")} time="12 min" href="/playbooks/the-drift-detection-framework" description="Identify silent organisational decay before it becomes structural failure." />
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* ── OPERATOR PACKS ── */}
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Operator packs</p>
              <p className="mt-2 text-xs text-white/35">Bundled instrument access. Pack checkout is controlled — available when bundle entitlement resolution is verified.</p>
              <div className="mt-4 space-y-3">
                <PackCard name="Operator Essentials" price="£129" count={4} status="Checkout controlled" />
                <PackCard name="Command Pack" price="£249" count={6} status="Checkout controlled" />
                <PackCard name="Governance Suite" price="£495" count={10} status="Checkout controlled" />
              </div>
            </section>

            {/* ── STRATEGIC FRAMEWORKS ── */}
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <div className="flex items-center justify-between gap-3">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Strategic frameworks</p>
                <Link href="/resources/strategic-frameworks" className="text-xs text-white/50 underline-offset-4 hover:underline">View all &rarr;</Link>
              </div>
              <p className="mt-2 text-xs text-white/35">Public method briefs and restricted architect material. Frameworks explain methodology — instruments deploy it.</p>
              <div className="mt-4 space-y-3">
                {featuredFrameworks.length > 0 ? featuredFrameworks.map((item) => (
                  <PlaybookCard key={item.href} {...item} />
                )) : <p className="text-xs text-white/30">No public frameworks currently indexed.</p>}
              </div>
            </section>
          </div>

          {/* ── PUBLIC PLAYBOOKS ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
            <div className="flex items-center justify-between gap-3">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Playbooks</p>
              <Link href="/playbooks" className="text-xs text-white/50 underline-offset-4 hover:underline">View all &rarr;</Link>
            </div>
            <p className="mt-2 text-xs text-white/35">Public method briefs, governed playbooks, and restricted architect material.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {featuredPlaybooks.length > 0 ? featuredPlaybooks.map((item) => (
                <PlaybookCard key={item.href} {...item} />
              )) : <p className="text-xs text-white/30">No public playbooks currently indexed.</p>}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default FrameworksPage;
