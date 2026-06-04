/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/briefs/index.tsx — Intelligence Briefs: Formal Library */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";
import { trackBriefSeriesViewed } from "@/lib/analytics/briefs-analytics";

type BriefListItem = {
  title: string;
  subtitle: string | null;
  description: string | null;
  date: string | null;
  href: string;
  series: string | null;
  briefId: string | null;
  category: string | null;
};

type Props = {
  institutionalAlpha: BriefListItem[];
  sovereignIntelligence: BriefListItem[];
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

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
  const source = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();
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

function isPublishedBrief(doc: any): boolean {
  return safeString(doc?.publicationStatus).toLowerCase().trim() === "published";
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

function toBriefListItem(doc: any): BriefListItem | null {
  const slug = publicBriefSlugForDoc(doc);
  if (!slug) return null;
  return {
    title: safeString(doc?.title) || "Untitled Brief",
    subtitle: safeString(doc?.subtitle) || null,
    description: safeString(doc?.description || doc?.summary || doc?.excerpt) || null,
    date: safeString(doc?.date) || null,
    href: `/briefs/${slug}`,
    series: seriesFromDoc(doc, slug),
    briefId: safeString(doc?.briefId || doc?.institutionalId) || null,
    category: safeString(doc?.category) || null,
  };
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllBriefs, sanitizeData } = await import("@/lib/content/server");

  const all = (getAllBriefs() || [])
    .filter(isRenderablePublicBrief)
    .filter(isPublishedBrief)
    .map(toBriefListItem)
    .filter((b): b is BriefListItem => b !== null && b.href !== "/briefs/")
    .sort((a, b) => {
      if (!a.date && !b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return {
    props: sanitizeData({
      institutionalAlpha: all.filter((b) => b.series === "institutional-alpha"),
      sovereignIntelligence: all.filter((b) => b.series === "sovereign-intelligence"),
    }),
    revalidate: 1800,
  };
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SeriesCard({
  label,
  count,
  description,
  href,
  accent,
}: {
  label: string;
  count: number;
  description: string;
  href: string;
  accent: string;
}) {
  return (
    <Link href={href} className="block border border-white/10 bg-white/[0.015] p-6 transition hover:bg-white/[0.03]">
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: accent }}>
        Intelligence Series
      </p>
      <h2 className="mt-3 font-serif text-2xl text-white">{label}</h2>
      <p className="mt-2 text-sm leading-7 text-white/52">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          {count} briefs
        </span>
        <span style={{ color: `${GOLD}CC`, fontSize: "14px" }}>→</span>
      </div>
    </Link>
  );
}

function BriefCard({ brief }: { brief: BriefListItem }) {
  const formattedDate = brief.date
    ? new Date(brief.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const seriesLabel =
    brief.series === "institutional-alpha" ? "Institutional Alpha" :
    brief.series === "sovereign-intelligence" ? "Sovereign Intelligence" :
    null;

  const seriesColor =
    brief.series === "institutional-alpha" ? "#7CB8E8" :
    brief.series === "sovereign-intelligence" ? "#9B8EC4" :
    GOLD;

  return (
    <article className="border border-white/10 bg-white/[0.015] p-5">
      <div className="flex flex-wrap items-center gap-2">
        {seriesLabel ? (
          <span
            className="border px-2 py-1 text-[8px] uppercase tracking-[0.18em]"
            style={{ ...mono, borderColor: `${seriesColor}30`, backgroundColor: `${seriesColor}12`, color: seriesColor }}
          >
            {seriesLabel}
          </span>
        ) : null}
        {brief.briefId ? (
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            {brief.briefId}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-xl leading-tight text-white">{brief.title}</h3>
      {brief.description ? (
        <p className="mt-3 text-sm leading-7 text-white/52">{brief.description}</p>
      ) : null}
      {formattedDate ? (
        <p className="mt-3 text-[8px] uppercase tracking-[0.18em] text-white/28" style={mono}>
          {formattedDate}
        </p>
      ) : null}
      <Link
        href={brief.href}
        className="mt-4 inline-flex items-center gap-2 transition hover:opacity-80"
        style={{ color: `${GOLD}DD` }}
      >
        <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Read brief
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const IntelligenceBriefsPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  institutionalAlpha,
  sovereignIntelligence,
}) => {
  const total = institutionalAlpha.length + sovereignIntelligence.length;

  React.useEffect(() => {
    trackBriefSeriesViewed("all");
  }, []);

  return (
    <Layout
      title="Intelligence Briefs | Abraham of London"
      description="The public Evidence Base: 50 diagnostic intelligence briefs demonstrating Abraham of London's analytical authority across institutional and sovereign intelligence."
      canonicalUrl="/briefs"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-24 text-white" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-6xl space-y-16">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <header className="border border-white/10 bg-white/[0.02] p-8">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Evidence Base
            </p>
            <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Intelligence Briefs
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
              {total} public analytical briefs organised across two series. Each brief examines a
              specific pattern of institutional failure, sovereign exposure, or decision-intelligence
              breakdown — drawn from the diagnostic framework used across Abraham of London engagements.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/45">
              These briefs prove the diagnostic method. Application of that method — to real
              institutions, households, and firms — is the work of the Inner Circle.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/vault/briefs"
                className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-white/70 transition hover:border-white/30 hover:text-white"
                style={mono}
              >
                <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Explore the Canon</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 border px-4 py-2 transition hover:opacity-90"
                style={{ ...mono, borderColor: `${GOLD}40`, color: `${GOLD}DD` }}
              >
                <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Join Inner Circle</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </header>

          {/* ── Series overview ───────────────────────────────────── */}
          <section>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "1.25rem" }}>
              Series
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <SeriesCard
                label="Institutional Alpha"
                count={institutionalAlpha.length}
                description="Intelligence failure, reporting decay, false confidence, and the discipline of decision-grade insight inside established institutions."
                href="/briefs/institutional-alpha"
                accent="#7CB8E8"
              />
              <SeriesCard
                label="Sovereign Intelligence"
                count={sovereignIntelligence.length}
                description="Sovereignty, dependence, institutional autonomy, strategic exposure, and the structural conditions that erode an institution's freedom to act."
                href="/briefs/sovereign-intelligence"
                accent="#9B8EC4"
              />
            </div>
          </section>

          {/* ── Institutional Alpha preview ───────────────────────── */}
          {institutionalAlpha.length > 0 ? (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#7CB8E8" }}>
                    Series I
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-white">Institutional Alpha</h2>
                </div>
                <Link
                  href="/briefs/institutional-alpha"
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}BB` }}
                  className="transition hover:opacity-80"
                >
                  View all {institutionalAlpha.length} →
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {institutionalAlpha.slice(0, 6).map((brief) => (
                  <BriefCard key={brief.href} brief={brief} />
                ))}
              </div>
              {institutionalAlpha.length > 6 ? (
                <div className="mt-6 text-center">
                  <Link
                    href="/briefs/institutional-alpha"
                    className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-white/60 transition hover:border-white/30 hover:text-white"
                    style={mono}
                  >
                    <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      View all {institutionalAlpha.length} Institutional Alpha briefs
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ── Sovereign Intelligence preview ────────────────────── */}
          {sovereignIntelligence.length > 0 ? (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#9B8EC4" }}>
                    Series II
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-white">Sovereign Intelligence</h2>
                </div>
                <Link
                  href="/briefs/sovereign-intelligence"
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}BB` }}
                  className="transition hover:opacity-80"
                >
                  View all {sovereignIntelligence.length} →
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {sovereignIntelligence.slice(0, 6).map((brief) => (
                  <BriefCard key={brief.href} brief={brief} />
                ))}
              </div>
              {sovereignIntelligence.length > 6 ? (
                <div className="mt-6 text-center">
                  <Link
                    href="/briefs/sovereign-intelligence"
                    className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-white/60 transition hover:border-white/30 hover:text-white"
                    style={mono}
                  >
                    <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      View all {sovereignIntelligence.length} Sovereign Intelligence briefs
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ── Inner Circle boundary ─────────────────────────────── */}
          <section className="border border-white/10 bg-white/[0.02] p-8">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}BB`, marginBottom: "1rem" }}>
              Inner Circle
            </p>
            <h2 style={{ ...serif, fontSize: "1.6rem", color: "rgba(255,255,255,0.88)" }}>
              Diagnosis is public. Application is not.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
              These briefs identify the pattern. The Inner Circle applies the framework — to real
              institutions, households, and leadership situations — through private diagnostics,
              scorecards, application protocols, case interpretation, and live briefings.
            </p>
            <Link
              href="/inner-circle"
              className="mt-6 inline-flex items-center gap-2 border px-5 py-2.5 transition hover:opacity-90"
              style={{ ...mono, borderColor: `${GOLD}40`, color: `${GOLD}DD` }}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Join Inner Circle</span>
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          {/* ── Bridge CTAs ───────────────────────────────────────── */}
          <footer className="grid gap-5 border-t border-white/10 pt-10 md:grid-cols-3">
            {[
              { label: "Foundational Canon", sub: "12 pillar briefs", href: "/vault/briefs" },
              { label: "Run a Diagnostic", sub: "Decision Infrastructure", href: "/diagnostic" },
              { label: "Editorial", sub: "Intelligence front door", href: "/editorial/intelligence-briefs" },
            ].map(({ label, sub, href }) => (
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
};

export default IntelligenceBriefsPage;
