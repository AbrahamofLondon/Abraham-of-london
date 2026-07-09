/**
 * components/artifacts/GmiInstitutionalArtifactRecord.tsx
 *
 * Dedicated institutional asset record for GMI-family artifacts.
 * Replaces the generic artifact detail page for the GMI product family —
 * selection is made from canonical product identity, never title strings.
 *
 * Visual family: the GMI Ledger standard. DARK (void, rgb(3,3,5)) and PAPER
 * (institutional stock) sections alternate. Serif display (Cormorant
 * Garamond 300), mono uppercase metadata, gold #C9A96E rules. No glassy
 * catalogue aesthetic, no duplicated Ledger content — the Key Calls, Regime
 * Map and Falsification Ledger live on the public record and are linked.
 */
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace" };

export type GmiArtifactAction = {
  label: string;
  href: string;
  kind: "primary" | "secondary" | "quiet";
  external?: boolean;
};

export type GmiArtifactProjection = {
  /** e.g. "GMI-Q1-2026" */
  documentId: string;
  /** e.g. "Q1 2026" */
  edition: string;
  title: string;
  /** One-line thesis of the edition, e.g. "Structural pressure replaced cyclical comfort." */
  thesis: string;
  /** e.g. "REFERENCE EDITION" | "CURRENT EDITION" | "CONTROLLED ASSET" */
  publicationRole: string;
  /** Canonical lifecycle state, e.g. "SUPERSEDED" */
  lifecycleState: string;
  supersededBy: string | null;
  publishedAtLabel: string;
  currentEditionLabel: string;
  upcomingEditionLabel: string;
  retentionNote: string;
  /** Right-hand asset record facts */
  asset: {
    format: string;
    version: string;
    classification: string;
    distribution: string;
    pages: string | null;
    fileSize: string | null;
  };
  /** Release / evidence record lines (receipt-derived where released) */
  evidenceRecord: Array<{ label: string; value: string }>;
  accessNote: string;
  entitled: boolean;
  actions: GmiArtifactAction[];
  /** Edition lineage rows with canonical (or absent) routes */
  lineage: Array<{
    edition: string;
    role: string;
    state: string;
    href: string | null;
    hrefLabel: string | null;
  }>;
  /** Public Ledger record for this edition (Key Calls, Regime Map, Falsification) */
  publicRecordHref: string | null;
};

function SectionLabel({ children, tone }: { children: React.ReactNode; tone: "dark" | "paper" }) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.28em] ${tone === "dark" ? "text-[#C9A96E]/80" : "text-[#7A6A45]"}`}
      style={mono}
    >
      {children}
    </p>
  );
}

function ActionLink({ action }: { action: GmiArtifactAction }) {
  const base = "inline-block px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors";
  const cls =
    action.kind === "primary"
      ? `${base} border border-[#C9A96E]/45 bg-[#C9A96E]/10 text-[#E6C98C] hover:bg-[#C9A96E]/20`
      : action.kind === "secondary"
        ? `${base} border border-white/15 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]`
        : `${base} border border-transparent text-white/45 underline underline-offset-4 hover:text-white/70`;
  return (
    <Link href={action.href} className={cls} style={mono}>
      {action.label}
    </Link>
  );
}

export default function GmiInstitutionalArtifactRecord({ record }: { record: GmiArtifactProjection }) {
  return (
    <>
      <Head>
        <title>{`${record.title} — Institutional Edition Record`}</title>
        <meta name="description" content={`${record.title}: ${record.publicationRole.toLowerCase()}, ${record.retentionNote}`} />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        {/* ── DARK · Edition identity ─────────────────────────────────────── */}
        <section className="px-6 pb-16 pt-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <SectionLabel tone="dark">GMI Archive · Institutional Edition</SectionLabel>
              <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: 1.02 }}>
                Global Market Intelligence
                <span className="block text-white/60">{record.edition}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60" style={serif}>
                {record.thesis}
              </p>

              <div className="mt-8 border-l-2 border-[#C9A96E]/50 pl-5">
                <p className="text-[12px] uppercase tracking-[0.24em] text-white/85" style={mono}>
                  {record.publicationRole}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  Published {record.publishedAtLabel}
                  {record.supersededBy ? ` · Superseded by ${record.supersededBy}` : ""}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/50">{record.retentionNote}</p>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {record.actions.map((action) => (
                  <ActionLink key={action.href + action.label} action={action} />
                ))}
              </div>
            </div>

            {/* Right-hand asset record */}
            <aside className="h-fit border border-white/12 bg-white/[0.018] p-6">
              <SectionLabel tone="dark">Asset Record</SectionLabel>
              <dl className="mt-5 space-y-4">
                {[
                  ["Document", record.documentId],
                  ["Format", record.asset.format],
                  ["Version", record.asset.version],
                  ["Classification", record.asset.classification],
                  ["Distribution", record.asset.distribution],
                  ...(record.asset.pages ? ([["Pages", record.asset.pages]] as const) : []),
                  ...(record.asset.fileSize ? ([["Size", record.asset.fileSize]] as const) : []),
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-white/8 pb-3">
                    <dt className="text-[10px] uppercase tracking-[0.24em] text-white/38" style={mono}>
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-white/80" style={mono}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        {/* ── PAPER · Why this record remains available ───────────────────── */}
        <section className="px-6 py-16" style={{ backgroundColor: "#F2EDE3", color: "#1A1712" }}>
          <div className="mx-auto max-w-6xl">
            <SectionLabel tone="paper">Why this record remains available</SectionLabel>
            <div className="mt-6 grid gap-10 md:grid-cols-2">
              <p className="text-xl leading-9" style={serif}>
                Global Market Intelligence keeps every published edition on the record. The judgement in a
                superseded edition is not deleted or rewritten — it is scored. Each new quarter reviews the
                prior quarter&rsquo;s material calls against observed outcomes, and the verdicts, including
                the misses, are published.
              </p>
              <div className="space-y-4 text-sm leading-7 text-[#4A4335]">
                <p>
                  This page is the institutional asset record for the {record.edition} edition: what the
                  document is, which lifecycle state it is in, and how it may be accessed. It does not
                  restate the edition&rsquo;s findings.
                </p>
                <p>
                  The scored call ledger, regime map and falsification register for this edition live on the
                  public record{record.publicRecordHref ? " linked below" : ""} — one authoritative copy, not
                  two competing ones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DARK · Release and evidence record ─────────────────────────── */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <SectionLabel tone="dark">Release &amp; Evidence Record</SectionLabel>
            <div className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {record.evidenceRecord.map((row) => (
                <div key={row.label} className="bg-[rgb(6,6,9)] p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/38" style={mono}>
                    {row.label}
                  </p>
                  <p className="mt-2 break-all text-[13px] leading-6 text-white/75" style={mono}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PAPER · Access and entitlement ──────────────────────────────── */}
        <section className="px-6 py-16" style={{ backgroundColor: "#F2EDE3", color: "#1A1712" }}>
          <div className="mx-auto max-w-6xl">
            <SectionLabel tone="paper">Access &amp; Entitlement</SectionLabel>
            <div className="mt-6 max-w-3xl">
              <p className="text-lg leading-8" style={serif}>
                {record.accessNote}
              </p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#7A6A45]" style={mono}>
                {record.entitled ? "Entitlement verified for this session" : "No entitlement on this session"}
              </p>
            </div>
          </div>
        </section>

        {/* ── DARK · Edition lineage ──────────────────────────────────────── */}
        <section className="px-6 py-16 pb-28">
          <div className="mx-auto max-w-6xl">
            <SectionLabel tone="dark">Edition Lineage</SectionLabel>
            <div className="mt-6 space-y-px border border-white/10">
              {record.lineage.map((row) => (
                <div
                  key={row.edition}
                  className="flex flex-wrap items-baseline justify-between gap-3 bg-white/[0.015] px-5 py-4"
                >
                  <div className="flex flex-wrap items-baseline gap-4">
                    <span className="text-lg text-white/85" style={serif}>
                      {row.edition}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={mono}>
                      {row.role}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#C9A96E]/70" style={mono}>
                      {row.state}
                    </span>
                  </div>
                  {row.href && row.hrefLabel ? (
                    <Link
                      href={row.href}
                      className="text-[11px] uppercase tracking-[0.2em] text-white/60 underline underline-offset-4 hover:text-white/85"
                      style={mono}
                    >
                      {row.hrefLabel}
                    </Link>
                  ) : (
                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/25" style={mono}>
                      No public route
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-6 text-white/35">
              Lineage and lifecycle states are read from the canonical publication authority. Superseded
              editions remain part of the permanent record; upcoming editions carry no public route until
              their own data lock, release clearance and owner authority complete.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
