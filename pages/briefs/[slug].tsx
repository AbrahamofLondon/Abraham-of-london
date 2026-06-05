/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/briefs/[slug].tsx — PUBLIC BRIEF READER */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";
import {
  trackBriefViewed,
  trackBriefToProductClick,
  trackBriefToCanonClick,
  trackBriefToInnerCircleClick,
} from "@/lib/analytics/briefs-analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductRoute = {
  label: string;
  href: string;
  reason: string;
};

type PublicBrief = {
  title: string;
  subtitle: string | null;
  description: string | null;
  summary: string | null;
  date: string | null;
  readTime: string | null;
  category: string | null;
  tags: string[];
  series: string | null;
  briefId: string | null;
  season: string | null;
  editorialCluster: string | null;
  innerCircleBridge: string | null;
  staticHtml: string;
  productRoutes: ProductRoute[];
};

type Props = {
  brief: PublicBrief;
  bareSlug: string;
};

// ─── Product routing map ─────────────────────────────────────────────────────

const CATEGORY_ROUTES: Record<string, ProductRoute[]> = {
  analytics: [
    { label: "Decision Pressure Signal", href: "/decision-pressure", reason: "Surface metric distortions before they reach the board." },
    { label: "Executive Reporting", href: "/boardroom", reason: "Reframe how performance data is presented to leadership." },
  ],
  governance: [
    { label: "Boardroom Brief", href: "/boardroom-brief", reason: "Governance diagnostics for boards and senior leadership." },
    { label: "Strategy Room", href: "/strategy-room", reason: "Structured governance review and realignment." },
  ],
  risk: [
    { label: "Decision Pressure Signal", href: "/decision-pressure", reason: "Map emerging risk before it moves faster than your reporting." },
    { label: "Boardroom Brief", href: "/boardroom-brief", reason: "Bring risk into the governance conversation." },
  ],
  leadership: [
    { label: "Strategy Room", href: "/strategy-room", reason: "Leadership clarity and decision-right clarification." },
    { label: "Inner Circle", href: "/inner-circle", reason: "Private application with Abraham of London." },
  ],
  sovereignty: [
    { label: "Strategy Room", href: "/strategy-room", reason: "Strategic exposure mapping and sovereignty restoration." },
    { label: "Inner Circle", href: "/inner-circle", reason: "Bespoke diagnostic for your institution." },
  ],
};

const DEFAULT_ROUTES: ProductRoute[] = [
  { label: "Foundational Canon", href: "/vault/briefs", reason: "Read the doctrine these briefs draw from." },
  { label: "Inner Circle", href: "/inner-circle", reason: "Apply the diagnostic to your specific situation." },
];

function productRoutesForBrief(category: string | null, series: string | null, tags: string[]): ProductRoute[] {
  const found: ProductRoute[] = [];
  const cat = (category || "").toLowerCase();
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  const catRoutes = CATEGORY_ROUTES[cat];
  if (catRoutes) found.push(...catRoutes);

  if (found.length === 0) {
    const sovereignRoutes = CATEGORY_ROUTES["sovereignty"];
    const analyticsRoutes = CATEGORY_ROUTES["analytics"];
    const govRoutes = CATEGORY_ROUTES["governance"];
    if (tagSet.has("sovereignty") || tagSet.has("autonomy") || series === "sovereign-intelligence") {
      if (sovereignRoutes) found.push(...sovereignRoutes);
    } else if (tagSet.has("metrics") || tagSet.has("analytics") || tagSet.has("aggregation")) {
      if (analyticsRoutes) found.push(...analyticsRoutes);
    } else if (tagSet.has("governance") || tagSet.has("decision-rights")) {
      if (govRoutes) found.push(...govRoutes);
    }
  }

  return found.length > 0 ? found.slice(0, 2) : DEFAULT_ROUTES;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function publicBriefBareSlug(input: unknown): string {
  const normalized = normalizePathish(input)
    .replace(/^content\//i, "")
    .replace(/^briefs\//i, "");
  if (!normalized || normalized.includes("..")) return "";
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isPublicBriefSource(doc: any): boolean {
  const flattened = normalizePathish(doc?._raw?.flattenedPath).toLowerCase();
  const source    = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();
  return (
    flattened.startsWith("briefs/") ||
    source.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    source.startsWith("content/briefs/")
  );
}

function isRenderablePublicBrief(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (!isPublicBriefSource(doc)) return false;
  if (safeString(doc?.status).trim().toLowerCase() !== "canonical") return false;
  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  return requiredTier === "public";
}

function publicBriefSlugForDoc(doc: any): string {
  return (
    publicBriefBareSlug(doc?.urlSlug) ||
    publicBriefBareSlug(doc?.slugSafe) ||
    publicBriefBareSlug(doc?.slugComputed) ||
    publicBriefBareSlug(doc?.slug) ||
    publicBriefBareSlug(doc?._raw?.flattenedPath) ||
    publicBriefBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

function seriesFromDoc(doc: any, slug: string): string | null {
  const explicit = safeString(doc?.series).toLowerCase().trim();
  if (explicit === "institutional-alpha" || explicit === "sovereign-intelligence") return explicit;
  if (slug.startsWith("institutional-alpha")) return "institutional-alpha";
  if (slug.startsWith("sovereign-intelligence")) return "sovereign-intelligence";
  return null;
}

function isPublishedBrief(doc: any): boolean {
  return safeString(doc?.publicationStatus).toLowerCase().trim() === "published";
}

function toPublicBrief(doc: any, slug: string): PublicBrief {
  const { html: staticHtml } = renderDocBodyToStaticHtml(doc);
  const category = safeString(doc?.category) || null;
  const series = seriesFromDoc(doc, slug);
  const tags = Array.isArray(doc?.tags) ? doc.tags.map((t: unknown) => safeString(t)).filter(Boolean) : [];

  return {
    title:       safeString(doc?.title) || "Untitled Brief",
    subtitle:    safeString(doc?.subtitle) || null,
    description: safeString(doc?.description || doc?.excerpt) || null,
    summary:     safeString(doc?.summary || doc?.excerpt || doc?.description) || null,
    date:        safeString(doc?.date) || null,
    readTime:    safeString(doc?.readTime || doc?.readingTime) || null,
    category,
    tags,
    series,
    briefId:          safeString(doc?.briefId || doc?.institutionalId) || null,
    season:           safeString(doc?.season) || null,
    editorialCluster: safeString(doc?.editorialCluster) || null,
    innerCircleBridge: safeString(doc?.innerCircleBridge) || null,
    staticHtml,
    productRoutes: productRoutesForBrief(category, series, tags),
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

const seriesConfig: Record<string, { label: string; href: string; color: string }> = {
  "institutional-alpha": { label: "Institutional Alpha", href: "/briefs/institutional-alpha", color: "#7CB8E8" },
  "sovereign-intelligence": { label: "Sovereign Intelligence", href: "/briefs/sovereign-intelligence", color: "#9B8EC4" },
};

const PublicBriefPage: NextPage<Props> = ({ brief, bareSlug }) => {
  const canonicalUrl  = `/briefs/${bareSlug}`;
  const formattedDate = brief.date
    ? new Date(brief.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const seriesInfo = brief.series ? seriesConfig[brief.series] : null;

  React.useEffect(() => {
    trackBriefViewed({
      slug: bareSlug,
      series: brief.series,
      briefId: brief.briefId,
      season: brief.season,
      editorialCluster: brief.editorialCluster,
    });
  }, [bareSlug, brief.series, brief.briefId, brief.season, brief.editorialCluster]);

  return (
    <Layout
      title={`${brief.title} | Abraham of London`}
      description={brief.description || brief.summary || undefined}
      canonicalUrl={canonicalUrl}
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index,follow" />
        {/* P3 — OG cover image mapping */}
        {(() => {
          const coverMap: Record<string, string> = {
            "institutional-alpha": "institutional-alpha-cover.webp",
            "sovereign-intelligence": "sovereign-intelligence-cover.webp",
          };
          const prefix = bareSlug.startsWith("institutional-alpha") ? "institutional-alpha" : bareSlug.startsWith("sovereign-intelligence") ? "sovereign-intelligence" : null;
          const coverFile = prefix ? coverMap[prefix] : "intelligence-briefs-cover.webp";
          const coverUrl = `https://www.abrahamoflondon.org/assets/images/covers/briefs/${coverFile}`;
          return (
            <>
              <meta property="og:image" content={coverUrl} />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:image" content={coverUrl} />
            </>
          );
        })()}
      </Head>

      <main className="min-h-screen bg-black px-6 pb-24 pt-24 text-white">
        <article className="mx-auto max-w-4xl">

          {/* ── Breadcrumb ───────────────────────────────────────── */}
          <nav className="mb-10 flex flex-wrap items-center gap-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            <Link href="/briefs" style={{ color: "rgba(255,255,255,0.38)" }} className="transition hover:text-white/60">
              Intelligence Briefs
            </Link>
            {seriesInfo ? (
              <>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                <Link href={seriesInfo.href} style={{ color: seriesInfo.color }} className="transition hover:opacity-80">
                  {seriesInfo.label}
                </Link>
              </>
            ) : null}
          </nav>

          {/* ── Meta bar ─────────────────────────────────────────── */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-3" style={{ ...mono, fontSize: "10px" }}>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-emerald-200">
                Public
              </span>
              {seriesInfo ? (
                <span
                  className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em]"
                  style={{ borderColor: `${seriesInfo.color}30`, backgroundColor: `${seriesInfo.color}12`, color: seriesInfo.color }}
                >
                  {seriesInfo.label}
                </span>
              ) : null}
              {brief.briefId ? (
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{brief.briefId}</span>
              ) : null}
              {brief.category ? <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{brief.category}</span> : null}
              {formattedDate  ? <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{formattedDate}</span>  : null}
              {brief.readTime ? <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{brief.readTime}</span> : null}
            </div>
          </div>

          {/* ── Title block ──────────────────────────────────────── */}
          <header className="mb-12">
            <p className="mb-5" style={{ ...mono, fontSize: "10px", letterSpacing: "0.34em", textTransform: "uppercase", color: `${GOLD}CC` }}>
              Intelligence Brief
            </p>
            <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
              {brief.title}
            </h1>
            {brief.subtitle ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{brief.subtitle}</p>
            ) : null}
            {brief.summary ? (
              <p
                className="mt-6 max-w-3xl border-l pl-5 text-base leading-8 text-white/58"
                style={{ borderColor: `${GOLD}35` }}
              >
                {brief.summary}
              </p>
            ) : null}
          </header>

          {/* ── Tags ─────────────────────────────────────────────── */}
          {brief.tags.length > 0 ? (
            <div className="mb-10 flex flex-wrap gap-2">
              {brief.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* ── Body ─────────────────────────────────────────────── */}
          <div className="prose prose-invert max-w-none">
            <StaticMDXRenderer html={brief.staticHtml} />
          </div>

          {/* ── Inner Circle bridge ──────────────────────────────── */}
          {brief.innerCircleBridge ? (
            <aside className="mt-10 border-l-2 pl-5" style={{ borderColor: `${GOLD}40` }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}99`, marginBottom: "0.5rem" }}>
                Inner Circle application
              </p>
              <p className="text-sm leading-7 text-white/58">{brief.innerCircleBridge}</p>
            </aside>
          ) : null}

          {/* ── Product routes ───────────────────────────────────── */}
          <section className="mt-12 border border-white/10 bg-white/[0.02] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "1rem" }}>
              Next step
            </p>
            <p className="mb-4 text-sm text-white/40">
              Public briefs diagnose the pattern. Inner Circle applies the framework.
            </p>
            <div className="space-y-4">
              {brief.productRoutes.map((route) => {
                const isInnerCircle = route.href.includes("inner-circle");
                const isCanon = route.href.includes("vault");
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className="flex items-start gap-4 border border-white/10 p-4 transition hover:bg-white/[0.03]"
                    onClick={() => {
                      if (isInnerCircle) {
                        trackBriefToInnerCircleClick({ slug: bareSlug, series: brief.series, briefId: brief.briefId });
                      } else if (isCanon) {
                        trackBriefToCanonClick({ slug: bareSlug, series: brief.series, briefId: brief.briefId, destination: route.href, destinationLabel: route.label });
                      } else {
                        trackBriefToProductClick({ slug: bareSlug, series: brief.series, briefId: brief.briefId, destination: route.href, destinationLabel: route.label });
                      }
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-serif text-lg text-white">{route.label}</p>
                      <p className="mt-1 text-sm text-white/50">{route.reason}</p>
                    </div>
                    <span style={{ color: `${GOLD}CC`, flexShrink: 0 }}>→</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Footer ───────────────────────────────────────────── */}
          <footer className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-wrap gap-6 text-sm text-white/45">
              <Link href="/briefs" className="transition hover:text-white/70">
                ← All Intelligence Briefs
              </Link>
              {seriesInfo ? (
                <Link href={seriesInfo.href} className="transition hover:text-white/70" style={{ color: seriesInfo.color }}>
                  ← {seriesInfo.label} Series
                </Link>
              ) : null}
              <Link
                href="/vault/briefs"
                className="transition hover:text-white/70"
                onClick={() => trackBriefToCanonClick({ slug: bareSlug, series: brief.series, briefId: brief.briefId, destination: "/vault/briefs", destinationLabel: "Foundational Canon" })}
              >
                Foundational Canon
              </Link>
              <Link
                href="/pressure"
                style={{ color: `${GOLD}CC` }}
                className="transition hover:opacity-80"
                onClick={() => trackBriefToInnerCircleClick({ slug: bareSlug, series: brief.series, briefId: brief.briefId })}
              >
                Move from reading to diagnosis
              </Link>
            </div>
          </footer>

        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getAllBriefs } = await import("@/lib/content/server");
  const docs = (getAllBriefs() || [])
    .filter(isRenderablePublicBrief)
    .filter(isPublishedBrief);

  const paths = docs
    .map((doc: any) => publicBriefSlugForDoc(doc))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bareSlug = publicBriefBareSlug(params?.slug);
  if (!bareSlug) return { notFound: true };

  const { getAllBriefs, sanitizeData } = await import("@/lib/content/server");
  const rawDoc =
    (getAllBriefs() || []).find(
      (doc: any) =>
        isRenderablePublicBrief(doc) &&
        isPublishedBrief(doc) &&
        publicBriefSlugForDoc(doc) === bareSlug,
    ) || null;

  if (!rawDoc) return { notFound: true };

  return {
    props: sanitizeData({ brief: toPublicBrief(rawDoc, bareSlug), bareSlug }),
  };
};

export default PublicBriefPage;
