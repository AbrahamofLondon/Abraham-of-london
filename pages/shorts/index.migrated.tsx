/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.migrated.tsx
// Migrated Shorts index page using design system tokens
// Preserves fast, scan-friendly, low-friction character

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import ShortCard from "@/components/ShortCard.migrated";
import { ShortCardModel } from "@/components/ShortCard.migrated";
import {
  readImprint,
  writeImprint,
  computeWhisper,
  getOrCreateSeed,
  updateStreak,
  updateVisitCount,
} from "@/lib/shorts/brand";
import { resolveDocCoverImage } from "@/lib/content/shared";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type RawShortDoc = {
  _id?: string;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  category?: string | null;
  date?: string | null;
  draft?: boolean | null;
  published?: boolean | null;
  slug?: string | null;
  slugSafe?: string | null;
  hrefSafe?: string | null;
  readTime?: string | null;
  readTimeSafe?: string | null;
  coverImage?: string | null;
  image?: string | null;
  views?: number | null;
  likes?: number | null;
  saves?: number | null;
  intensity?: 1 | 2 | 3 | 4 | 5 | null;
  lineage?: string | null;
  _raw?: {
    flattenedPath?: string | null;
    sourceFilePath?: string | null;
  } | null;
};

type ShortIndexItem = ShortCardModel & {
  id: string;
  href: string;
  date: string | null;
};

type ShortsIndexProps = {
  shorts: ShortIndexItem[];
  totalCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizePath(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const p = `${prefix.toLowerCase()}/`;
  return source.toLowerCase().startsWith(p) ? source.slice(p.length) : source;
}

function resolveShortSlug(doc: RawShortDoc): string | null {
  const candidates = [
    safeString(doc.slugSafe),
    safeString(doc.slug),
    safeString(doc?._raw?.flattenedPath),
    safeString(doc?._raw?.sourceFilePath),
    safeString(doc.hrefSafe),
    safeString(doc._id),
  ].filter(Boolean);

  for (const candidate of candidates) {
    let s = normalizePath(candidate);
    if (!s) continue;
    if (s.toLowerCase().startsWith("content/")) s = s.slice("content/".length);
    if (s.toLowerCase().startsWith("shorts/"))  s = stripPrefixOnce(s, "shorts");
    else if (s.toLowerCase().startsWith("/shorts/")) s = s.replace(/^\/?shorts\//i, "");
    s = normalizePath(s);
    if (s) return s;
  }
  return null;
}

function isPublishedShort(doc: RawShortDoc): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;
  return true;
}

function toShortIndexItem(doc: RawShortDoc): ShortIndexItem | null {
  const slug = resolveShortSlug(doc);
  if (!slug) return null;
  const intensityRaw = safeNumber(doc.intensity, 3);
  const intensity = clamp(intensityRaw, 1, 5) as 1 | 2 | 3 | 4 | 5;
  return {
    id:        safeString(doc._id) || `short-${slug}`,
    title:     safeString(doc.title).trim() || "Untitled",
    excerpt:   safeString(doc.excerpt).trim() || safeString(doc.description).trim() || "",
    category:  safeString(doc.category).trim() || "Intel",
    readTime:  safeString(doc.readTime).trim() || safeString(doc.readTimeSafe).trim() || "2 min",
    slug,
    href:      `/shorts/${slug}`,
    coverImage: resolveDocCoverImage(doc, { contentType: 'SHORT' }),
    views:     safeNumber(doc.views, 0),
    likes:     safeNumber(doc.likes, 0),
    saves:     safeNumber(doc.saves, 0),
    intensity,
    lineage:   safeString(doc.lineage).trim() || null,
    date:      safeString(doc.date).trim() || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLIFIED PAGE - Using migrated ShortCard with design system tokens
// ─────────────────────────────────────────────────────────────────────────────

function formatShortDate(date: string | null): string {
  const raw = safeString(date);
  if (!raw) return "";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function firstSentence(input: string): string {
  const text = safeString(input).trim().replace(/\s+/g, " ");
  if (!text) return "";
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] || text).trim();
}

function MemoFilterStrip({
  categories,
  activeCategory,
  setActiveCategory,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (value: string) => void;
}) {
  return (
    <div className="px-6 py-6 lg:px-10 ds-bg">
      <div className="mx-auto max-w-5xl overflow-x-auto">
        <div className="inline-flex min-w-full gap-8">
          {["All", ...categories].map((category) => {
            const isActive =
              category === "All" ? activeCategory === "" : activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category === "All" ? "" : category)}
                className={`
                  pb-1 border-b transition-all duration-250
                  ${isActive 
                    ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' 
                    : 'border-transparent ds-text-subtle hover:ds-text-muted'
                  }
                `}
                style={{
                  border: "none",
                  background: "transparent",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [activeCategory, setActiveCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const set = new Set(shorts.map((short) => short.category).filter(Boolean));
    return Array.from(set).sort();
  }, [shorts]);

  const filtered = React.useMemo(() => {
    if (!activeCategory) return shorts;
    return shorts.filter((short) => short.category === activeCategory);
  }, [activeCategory, shorts]);

  return (
    <Layout
      title="Shorts — Abraham of London"
      description="Compressed thinking for people who read fast."
      className="min-h-screen ds-surface-shorts"
      fullWidth
      headerTransparent={false}
      canonicalUrl="/shorts"
      showFooter={false}
      enableVaultSearch={false}
    >
      <Head>
        <title>Shorts — Abraham of London</title>
        <meta name="description" content="Compressed thinking for people who read fast." />
      </Head>

      <main className="min-h-screen ds-bg">
        <header
          className="border-b px-6 pb-12 pt-16 lg:px-10 lg:pb-12 lg:pt-28 ds-border"
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center">
              <span
                className="w-px h-5 mr-3 align-middle ds-accent"
                style={{
                  backgroundColor: "var(--ds-accent)",
                  opacity: 0.45,
                }}
              />
              <div
                className="font-mono text-[7.5px] uppercase tracking-[0.40em] ds-accent"
                style={{
                  opacity: 0.8,
                }}
              >
                SHORTS · ABRAHAM OF LONDON
              </div>
            </div>
            <h1
              className="mt-4 font-serif font-light italic leading-[1.02] tracking-tight ds-text"
              style={{
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
              }}
            >
              Compressed thinking for people who read fast.
            </h1>
            <div
              className="w-10 h-px my-6 ds-accent"
              style={{
                backgroundColor: "var(--ds-accent)",
                opacity: 0.55,
              }}
            />
            <div
              className="font-mono text-[8px] uppercase tracking-[0.42em] ds-text-muted"
            >
              Signal. Pattern. Decision.
            </div>
          </div>
        </header>

        <MemoFilterStrip
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        {/* Grid layout for shorts */}
        <section className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((short) => (
                <ShortCard
                  key={short.id}
                  short={short}
                  listMode={false}
                />
              ))}
            </div>
            
            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-28">
                <div
                  className="mb-6 h-px w-10 bg-gradient-to-r from-transparent via-[var(--ds-accent)]/40 to-transparent"
                />
                <p
                  className="font-serif text-2xl font-light italic ds-text-muted text-center"
                >
                  Nothing found in this category
                </p>
                <p
                  className="mt-3 font-mono text-[8.5px] uppercase tracking-[0.32em] ds-text-subtle"
                >
                  Try another category
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="px-6 py-10 lg:px-10 ds-border-t">
          <div className="mx-auto max-w-5xl border-t pt-6 ds-border">
            <div
              className="font-mono text-[7.5px] uppercase tracking-[0.40em] ds-text-subtle"
            >
              Abraham of London
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

// ─────────────────────────────────────────────────────────────────────────────
// DATA — unchanged from working version
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const { getAllShorts, sanitizeData } = await import(
    "@/lib/content/server"
  );
  const fromShorts = (getAllShorts() || []) as RawShortDoc[];

  const shorts = fromShorts
    .filter(isPublishedShort)
    .map(toShortIndexItem)
    .filter(Boolean) as ShortIndexItem[];

  shorts.sort((a, b) => {
    const aT = a.date ? new Date(a.date).getTime() : 0;
    const bT = b.date ? new Date(b.date).getTime() : 0;
    return bT - aT;
  });

  return {
    props: {
      shorts:     sanitizeData(shorts),
      totalCount: shorts.length,
    },
    revalidate: 3600,
  };
};