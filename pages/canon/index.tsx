/* pages/canon/index.tsx — THE CANON ARCHIVE */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Lock } from "lucide-react";

import Layout from "@/components/Layout";
import { normalizeSlug } from "@/lib/content/shared";
import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";

type AccessLevel = "public" | "inner-circle" | "restricted";

type CanonItem = {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  href: string;
  requiredTier: AccessTier;
  accessLevel: AccessLevel;
  coverImage: string | null;
  dateISO: string | null;
  readTime: string | null;
  tags: string[];
  category: string | null;
  featured: boolean;
  isTeachingEdition: boolean;
  volumeNumber: number | null;
  series: string;
  originalFilename: string;
};

type CanonSeries = {
  volume: string;
  title: string;
  description: string;
  items: CanonItem[];
};

type CanonIndexProps = {
  items: CanonItem[];
  counts: {
    total: number;
    public: number;
    innerCircle: number;
    restricted: number;
  };
  series: CanonSeries[];
  featuredItems: CanonItem[];
  error?: string;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const EYEBROW = "rgba(201,169,110,0.8)";
const RULE = "rgba(255,255,255,0.08)";

function collapseSlashes(s: string): string {
  return String(s || "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function normalizeBareCanonSlug(input: unknown): string {
  let s = String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const p = prefix.toLowerCase();
    if (s.toLowerCase().startsWith(p)) {
      s = s.slice(prefix.length).replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content/") || changed;
    changed = stripOnce("vault/") || changed;
    changed = stripOnce("canon/") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";

  const segments = s
    .split("/")
    .filter(Boolean)
    .map((seg) => normalizeSlug(seg))
    .filter(Boolean);

  return segments[segments.length - 1] || "";
}

function classifyAccess(requiredTier: AccessTier): AccessLevel {
  const r = String(tiers.normalizeRequired(requiredTier));
  if (r === "public") return "public";
  if (r === "inner-circle") return "inner-circle";
  return "restricted";
}

function extractVolumeNumber(title: string): number | null {
  const romanMatch = title.match(/Volume[-\s]([IVXLCDM]+)/i);
  if (romanMatch && romanMatch[1]) {
    const roman = romanMatch[1].toUpperCase();
    const values: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };

    let total = 0;
    let prev = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
      const ch = roman[i] ?? "";
      const cur = values[ch] ?? 0;
      total += cur < prev ? -cur : cur;
      prev = cur;
    }

    return total || null;
  }

  const numMatch = title.match(/Volume[-\s](\d+)/i);
  return numMatch && numMatch[1] ? parseInt(numMatch[1], 10) : null;
}

function extractSeries(title: string, filename: string): string {
  if (title.includes("Foundations") || filename.includes("volume-i-foundations")) return "Volume I";
  if (title.includes("Governance") || filename.includes("volume-ii-governance")) return "Volume II";
  if (title.includes("Civilisation") || filename.includes("volume-x-the-arc")) return "Volume X";
  if (filename.includes("builders-catechism")) return "Catechism";
  if (filename.includes("canon-campaign")) return "Campaign";
  if (filename.includes("canon-introduction-letter")) return "Introduction";
  if (filename.includes("canon-master-index-preview")) return "Index";
  if (filename.includes("volume-iii")) return "Volume III";
  if (filename.includes("volume-iv")) return "Volume IV";
  if (filename.includes("volume-x-")) return "Volume X";
  return "General";
}

function getSeriesTitle(series: string): string {
  switch (series) {
    case "Volume I": return "Foundations of Purpose";
    case "Volume II": return "Governance & Formation";
    case "Volume III": return "Civilisation & Legacy";
    case "Volume IV": return "Future Volumes";
    case "Volume X": return "The Arc of Future Civilisation";
    case "Catechism": return "Builders Catechism";
    case "Campaign": return "Canon Campaign";
    case "Introduction": return "Introduction to the Canon";
    case "Index": return "Master Index";
    default: return "Canonical Works";
  }
}

function getSeriesDescription(series: string): string {
  switch (series) {
    case "Volume I":
      return "First principles: purpose, mandate, meaning, and moral architecture.";
    case "Volume II":
      return "Rules, routines, and structures that survive pressure and personality.";
    case "Volume III":
      return "Institutions, continuity, and generational systems.";
    case "Volume IV":
      return "Emerging frameworks and forthcoming volumes.";
    case "Volume X":
      return "Speculative architecture for future civilisation.";
    case "Catechism":
      return "Foundational questions and answers for builders.";
    case "Campaign":
      return "Strategic initiatives and canonical outreach.";
    case "Introduction":
      return "A letter on the purpose and structure of the Canon.";
    case "Index":
      return "Complete guide to all canonical works.";
    default:
      return "Canonical volumes and supplementary materials.";
  }
}

function safeHref(path: string): string {
  const p = collapseSlashes(String(path || "/")).replace(/\/{2,}/g, "/");
  return p.startsWith("/") ? p : `/${p}`;
}

function formatSeriesLabel(item: CanonItem) {
  if (item.volumeNumber) return `${item.series} · ${String(item.volumeNumber).padStart(2, "0")}`;
  return item.series;
}

function accessLabel(item: CanonItem) {
  if (item.accessLevel === "public") return "Public";
  if (item.accessLevel === "inner-circle") return "Inner Circle";
  return "Restricted";
}

function readingTimeLabel(item: CanonItem) {
  return item.readTime || "10 min";
}

function CanonRow({ item, primary }: { item: CanonItem; primary: boolean }) {
  const locked = item.accessLevel !== "public";

  return (
    <Link
      href={item.href}
      className="group grid gap-3 border-b px-0 py-5 transition-colors duration-200 md:grid-cols-[13rem_1fr_5rem]"
      style={{ borderBottomColor: "rgba(255,255,255,0.048)" }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className="font-mono text-[7px] uppercase tracking-[0.32em]"
          style={{ color: primary ? "#C9A96E" : "rgba(255,255,255,0.22)" }}
        >
          {formatSeriesLabel(item)}
        </span>
        <span
          className="font-mono text-[7px] uppercase tracking-[0.26em]"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          {item.category || "General"}
        </span>
        {locked ? (
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.24em]"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            <Lock className="h-3 w-3 text-[#C9A96E]" />
            Inner Circle
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <h2
          className="truncate font-serif text-[1.1rem] italic transition-colors duration-200 group-hover:text-white"
          style={{ color: locked ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.8)" }}
        >
          {item.title}
        </h2>
        <p className="mt-1 truncate text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>
          {item.excerpt || item.subtitle || getSeriesDescription(item.series)}
        </p>
      </div>

      <div className="text-left md:text-right">
        <span className="font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {readingTimeLabel(item)}
        </span>
        <div className="mt-2 font-mono text-[7px] uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.22)" }}>
          {accessLabel(item)}
        </div>
      </div>
    </Link>
  );
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  console.log("[BUILD_TRACE] START pages/canon/index.tsx getStaticProps");
  try {
  try {
    const { getAllCanons, sanitizeData } = await import("@/lib/content/server");
    const rawDocs = getAllCanons() || [];
    const seenSlugs = new Set<string>();

    const items = (rawDocs
      .filter((doc: any) => !doc?.draft)
      .map((doc: any) => {
        const raw =
          doc?.urlSlug ||
          doc?.collectionSlug ||
          doc?.slug ||
          doc?._raw?.flattenedPath ||
          "";

        const bare = normalizeBareCanonSlug(raw);
        if (!bare) return null;

        if (seenSlugs.has(bare)) return null;
        seenSlugs.add(bare);

        const title = safeString(doc?.title, "Untitled Volume");
        const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
        const accessLevel = classifyAccess(requiredTier);
        const dateISO =
          doc?.date && Number.isFinite(Date.parse(String(doc.date)))
            ? new Date(doc.date).toISOString()
            : null;
        const filename = String(doc?._raw?.sourceFilePath || "").split(/[\/\\]/).pop() || "";

        return {
          title,
          subtitle: doc?.subtitle ? String(doc.subtitle) : null,
          excerpt: doc?.excerpt || doc?.description ? String(doc.excerpt || doc.description) : null,
          slug: bare,
          href: safeHref(`/canon/${bare}`),
          requiredTier,
          accessLevel,
          coverImage: doc?.coverImage ? String(doc.coverImage) : null,
          dateISO,
          readTime: doc?.readTime ? String(doc.readTime) : "10 min",
          tags: Array.isArray(doc?.tags) ? doc.tags.filter(Boolean).map(String) : [],
          category: doc?.category ? String(doc.category) : "General",
          featured: Boolean(doc?.featured),
          isTeachingEdition: title.toLowerCase().includes("teaching edition"),
          volumeNumber: extractVolumeNumber(title),
          series: String(doc?.series || extractSeries(title, filename)),
          originalFilename: filename,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => {
        const av = (a as CanonItem).volumeNumber ?? 999;
        const bv = (b as CanonItem).volumeNumber ?? 999;
        if (av !== bv) return av - bv;
        return (a as CanonItem).title.localeCompare((b as CanonItem).title);
      })) as CanonItem[];

    const counts = items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.accessLevel === "public") acc.public += 1;
        else if (item.accessLevel === "inner-circle") acc.innerCircle += 1;
        else acc.restricted += 1;
        return acc;
      },
      { total: 0, public: 0, innerCircle: 0, restricted: 0 }
    );

    const seriesMap = new Map<string, CanonSeries>();

    items.forEach((item) => {
      if (!seriesMap.has(item.series)) {
        seriesMap.set(item.series, {
          volume: item.series,
          title: getSeriesTitle(item.series),
          description: getSeriesDescription(item.series),
          items: [],
        });
      }

      const existing = seriesMap.get(item.series);
      if (existing) existing.items.push(item);
    });

    const series = Array.from(seriesMap.values()).filter((s) => s.items.length > 0);

    return {
      props: sanitizeData({
        items,
        counts,
        series,
        featuredItems: items.filter((i) => i.featured).slice(0, 4),
      }),
      revalidate: 60,
    };
  } catch (error) {
    console.error("[CANON_INDEX_FAILURE]", error);

    return {
      props: {
        items: [],
        counts: { total: 0, public: 0, innerCircle: 0, restricted: 0 },
        series: [],
        featuredItems: [],
        error: "Failed to load Canon documents",
      },
      revalidate: 60,
    };
  }

  } finally {
    console.log("[BUILD_TRACE] END pages/canon/index.tsx getStaticProps");
  }
};

const CanonIndexPage: NextPage<CanonIndexProps> = ({
  items,
  counts,
  series,
  error,
}) => {
  return (
    <Layout
      title="The Canon"
      description="Doctrine, purpose, governance, and civilisation — compressed into one spine."
      className="bg-black text-white"
      fullWidth
    >
      <Head>
        <link rel="canonical" href={`${SITE}/canon`} />
        <meta property="og:title" content="The Canon | Abraham of London" />
        <meta
          property="og:description"
          content="Doctrine, purpose, governance, and civilisation — compressed into one spine."
        />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="border-b" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-20 lg:px-10 lg:pb-10 lg:pt-24">
            <div className="flex items-center gap-3">
              <span style={{ width: 1, height: 20, backgroundColor: "rgba(201,169,110,0.45)", display: "inline-block" }} />
              <span className="font-mono text-[7.5px] uppercase tracking-[0.4em]" style={{ color: EYEBROW }}>
                THE CANON · CONSTITUTIONAL ARCHIVE
              </span>
            </div>

            <h1
              className="mt-6 max-w-3xl font-serif italic"
              style={{
                fontWeight: 300,
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              The foundational texts.
            </h1>

            <p
              className="mt-5 font-mono text-[8px] uppercase tracking-[0.34em]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              The intellectual frame from which all structured products derive their authority.
            </p>

            <div className="mt-6 h-px w-full" style={{ backgroundColor: RULE }} />

            {series.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {series.map((entry, index) => (
                  <a
                    key={entry.volume}
                    href={`#${normalizeSlug(entry.volume)}`}
                    className="font-mono text-[8px] uppercase tracking-[0.3em] transition-colors"
                    style={{
                      color: index === 0 ? "#C9A96E" : "rgba(255,255,255,0.3)",
                      textDecoration: index === 0 ? "underline" : "none",
                      textUnderlineOffset: "0.35rem",
                    }}
                  >
                    {entry.volume}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            {error ? (
              <div className="border px-5 py-4" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.05)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>{error}</p>
              </div>
            ) : null}

            {!error ? (
              <div className="mb-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.22)" }}>
                <span>{counts.total} works indexed</span>
                <span>{counts.public} public</span>
                <span>{counts.innerCircle} inner circle</span>
                <span>{counts.restricted} restricted</span>
              </div>
            ) : null}

            {items.length === 0 ? (
              <div className="border px-6 py-16 text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.24)" }}>
                  No volumes resolved in registry
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {series.map((entry, index) => (
                  <section key={entry.volume} id={normalizeSlug(entry.volume)}>
                    <div className="mb-4 border-b pb-3" style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <div
                            className="font-mono text-[7px] uppercase tracking-[0.34em]"
                            style={{ color: index === 0 ? "#C9A96E" : "rgba(255,255,255,0.22)" }}
                          >
                            {entry.volume}
                          </div>
                          <h2 className="mt-2 font-serif text-[1.4rem] italic" style={{ color: "rgba(255,255,255,0.84)" }}>
                            {entry.title}
                          </h2>
                        </div>
                        <div className="font-mono text-[7px] uppercase tracking-[0.26em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                          {entry.items.length} texts
                        </div>
                      </div>
                      <p className="mt-2 text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>
                        {entry.description}
                      </p>
                    </div>

                    <div>
                      {entry.items.map((item) => (
                        <CanonRow key={item.slug} item={item} primary={index === 0} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonIndexPage;
