/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/briefs/sovereign-intelligence.tsx — Sovereign Intelligence Series */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { trackBriefSeriesViewed } from "@/lib/analytics/briefs-analytics";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BriefItem = {
  title: string;
  subtitle: string | null;
  description: string | null;
  date: string | null;
  href: string;
  briefId: string | null;
  category: string | null;
};

type Props = { briefs: BriefItem[] };

const GOLD = "#C9A96E";
const ACCENT = "#9B8EC4";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function normPath(v: unknown): string {
  return safeString(v).trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/").replace(/\.(md|mdx)$/i, "");
}
function bareSlug(v: unknown): string {
  const n = normPath(v).replace(/^content\//i, "").replace(/^briefs\//i, "");
  if (!n || n.includes("..")) return "";
  const parts = n.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}
function isPublicBriefSource(doc: any): boolean {
  const fp = normPath(doc?._raw?.flattenedPath).toLowerCase();
  const src = normPath(doc?._raw?.sourceFilePath).toLowerCase();
  return fp.startsWith("briefs/") || src.startsWith("briefs/") || fp.startsWith("content/briefs/") || src.startsWith("content/briefs/");
}
function isPublic(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (!isPublicBriefSource(doc)) return false;
  if (safeString(doc?.status).trim().toLowerCase() !== "canonical") return false;
  return normalizeRequiredTier(requiredTierFromDoc(doc)) === "public";
}
function isPublishedBrief(doc: any): boolean {
  return safeString(doc?.publicationStatus).toLowerCase().trim() === "published";
}
function slugForDoc(doc: any): string {
  return bareSlug(doc?.urlSlug) || bareSlug(doc?.slugSafe) || bareSlug(doc?.slugComputed) || bareSlug(doc?.slug) || bareSlug(doc?._raw?.flattenedPath) || bareSlug(doc?._raw?.sourceFilePath) || "";
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllBriefs, sanitizeData } = await import("@/lib/content/server");
  const briefs = (getAllBriefs() || [])
    .filter(isPublic)
    .filter(isPublishedBrief)
    .filter((doc: any) => {
      const sl = slugForDoc(doc);
      const series = safeString(doc?.series).toLowerCase();
      return sl.startsWith("sovereign-intelligence") || series === "sovereign-intelligence";
    })
    .map((doc: any) => {
      const sl = slugForDoc(doc);
      return {
        title: safeString(doc?.title) || "Untitled Brief",
        subtitle: safeString(doc?.subtitle) || null,
        description: safeString(doc?.description || doc?.summary || doc?.excerpt) || null,
        date: safeString(doc?.date) || null,
        href: `/briefs/${sl}`,
        briefId: safeString(doc?.briefId || doc?.institutionalId) || null,
        category: safeString(doc?.category) || null,
      };
    })
    .filter((b: BriefItem) => b.href !== "/briefs/")
    .sort((a: BriefItem, b: BriefItem) => {
      if (!a.date && !b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return { props: sanitizeData({ briefs }), revalidate: 1800 };
};

const SovereignIntelligencePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ briefs }) => (
  <Layout
    title="Sovereign Intelligence | Intelligence Briefs | Abraham of London"
    description="25 intelligence briefs on sovereignty, institutional dependence, strategic autonomy, and the structural conditions that erode an institution's freedom to act."
    canonicalUrl="/briefs/sovereign-intelligence"
    fullWidth
    headerTransparent
  >
    <Head>
      <meta name="robots" content="index,follow" />
      <meta property="og:image" content="https://www.abrahamoflondon.org/assets/images/covers/briefs/sovereign-intelligence-cover.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Abraham of London — Sovereign Intelligence" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="https://www.abrahamoflondon.org/assets/images/covers/briefs/sovereign-intelligence-cover.webp" />
      <meta name="twitter:image:alt" content="Abraham of London — Sovereign Intelligence" />
    </Head>

    <main className="min-h-screen px-6 py-24 text-white" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-6xl space-y-12">

        {/* Breadcrumb */}
        <nav style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <Link href="/briefs" style={{ color: "rgba(255,255,255,0.38)" }} className="transition hover:text-white/60">
            Intelligence Briefs
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 0.5rem" }}>›</span>
          <span style={{ color: ACCENT }}>Sovereign Intelligence</span>
        </nav>

        {/* Hero */}
        <header className="border border-white/10 bg-white/[0.02] p-8">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: ACCENT }}>
            Series II — Intelligence Briefs
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "rgba(255,255,255,0.92)" }}>
            Sovereign Intelligence
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
            {briefs.length} briefs examining the structural conditions that erode institutional
            sovereignty. Covers dependence disguised as partnership, the governance cost of permanent
            exception, alignment without real decision ownership, and the strategic consequences of
            weak exit paths.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/40">
            Each brief diagnoses a specific sovereignty risk. The Canon defines what genuine
            institutional self-government requires. The Inner Circle maps these diagnostics to
            specific institutions and leadership situations.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/briefs/institutional-alpha"
              className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-white/60 transition hover:border-white/30 hover:text-white"
              style={mono}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Institutional Alpha Series</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/vault/briefs"
              className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-white/60 transition hover:border-white/30 hover:text-white"
              style={mono}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Foundational Canon</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* Brief grid */}
        {briefs.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2">
            {briefs.map((brief) => {
              const date = brief.date
                ? new Date(brief.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : null;
              return (
                <article key={brief.href} className="border border-white/10 bg-white/[0.015] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="border px-2 py-1 text-[8px] uppercase tracking-[0.18em]"
                      style={{ ...mono, borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}12`, color: ACCENT }}
                    >
                      Sovereign Intelligence
                    </span>
                    {brief.briefId ? (
                      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                        {brief.briefId}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 font-serif text-xl leading-tight text-white">{brief.title}</h2>
                  {brief.description ? (
                    <p className="mt-3 text-sm leading-7 text-white/52">{brief.description}</p>
                  ) : null}
                  {date ? (
                    <p className="mt-3 text-[8px] uppercase tracking-[0.18em] text-white/28" style={mono}>{date}</p>
                  ) : null}
                  <Link
                    href={brief.href}
                    className="mt-4 inline-flex items-center gap-2 transition hover:opacity-80"
                    style={{ color: `${GOLD}DD` }}
                  >
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Read brief</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </section>
        ) : (
          <p className="text-sm text-white/40">No briefs available.</p>
        )}

        {/* Footer CTAs */}
        <footer className="grid gap-5 border-t border-white/10 pt-8 md:grid-cols-3">
          {[
            { label: "All Intelligence Briefs", href: "/briefs", sub: "Evidence Base" },
            { label: "Institutional Alpha", href: "/briefs/institutional-alpha", sub: "Series I" },
            { label: "Join Inner Circle", href: "/inner-circle", sub: "Application" },
          ].map(({ label, href, sub }) => (
            <Link key={href} href={href} className="border border-white/10 p-5 transition hover:bg-white/[0.02]">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99`, marginBottom: "0.5rem" }}>
                {sub}
              </p>
              <p className="font-serif text-lg text-white">{label} →</p>
            </Link>
          ))}
        </footer>

      </div>
    </main>
  </Layout>
);

export default SovereignIntelligencePage;
