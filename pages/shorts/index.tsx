/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx
// Design: Private Library Luxury — The Reading Chamber
// Audience: Sovereign fund allocators, managing directors, board-level operators
// Principle: Enter. Read. Leave with something. No friction anywhere.
//
// Removed from previous version:
//   - FeaturedGrid (duplicates hero rail — executives don't need the same
//     content shown twice)
//   - Ghost watermarks and decorative redundancy
//   - "Archive note", "Indexed", platform name in card footers
//   - Rounded corners on filter bar (signals SaaS, not institution)
//   - bg-black class (replaced with design token)
//   - amber-500 accents (replaced with softGold #C9A96E)
//
// Added / upgraded:
//   - Category filter pills — faster than a search box for scanners
//   - List mode with tighter card density — respects the executive's time
//   - Empty state that matches the reading chamber tone
//   - Section rhythm: void hero → whisper strip → chamber → close

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
// ShortsCard available at @/components/shorts/ShortsCard for grid layouts.
// This page uses tabular rows — card component is not needed here.
import TodaysShort from "@/components/shorts/TodaysShort";
import type { TodaysShortModel, RelatedShortModel } from "@/components/shorts/TodaysShort";
import { readImprint, updateStreak } from "@/lib/shorts/brand";
import type { Imprint } from "@/lib/shorts/brand";
import { resolveDocCoverImage } from "@/lib/content/shared";
import { computeReadTime, estimateWordCount } from "@/lib/shorts/read-time";
import { renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";

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
  theme?: string | null;
  _raw?: {
    flattenedPath?: string | null;
    sourceFilePath?: string | null;
  } | null;
};

type ShortIndexItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  slug: string;
  href: string;
  coverImage: string | null;
  views: number;
  likes: number;
  saves: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  lineage: string | null;
  theme: string;
  date: string | null;
};

type ShortsIndexProps = {
  shorts: ShortIndexItem[];
  totalCount: number;
  // The single daily short, selected server-side (carries static body HTML).
  todaysShort: TodaysShortModel | null;
  // Metadata-only related list for the daily short.
  relatedShorts: RelatedShortModel[];
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
  // Exclude future-dated shorts
  if (doc.date) {
    try {
      const d = new Date(doc.date);
      if (Number.isFinite(d.getTime()) && d > new Date()) return false;
    } catch {
      // Ignore parse errors
    }
  }
  return true;
}

function estimateWordCountFromDoc(doc: RawShortDoc): number {
  // Prefer the markdown source for word count; fall back to excerpt/description.
  const raw = (doc as any)?.body?.raw || "";
  if (raw) return estimateWordCount(raw);
  const text = safeString(doc.excerpt) || safeString(doc.description) || "";
  return estimateWordCount(text);
}

function toShortIndexItem(doc: RawShortDoc): ShortIndexItem | null {
  const slug = resolveShortSlug(doc);
  if (!slug) return null;
  const intensityRaw = safeNumber(doc.intensity, 3);
  const intensity = clamp(intensityRaw, 1, 5) as 1 | 2 | 3 | 4 | 5;
  const wordCount = estimateWordCountFromDoc(doc);
  return {
    id:        safeString(doc._id) || `short-${slug}`,
    title:     safeString(doc.title).trim() || "Untitled",
    excerpt:   safeString(doc.excerpt).trim() || safeString(doc.description).trim() || "",
    category:  safeString(doc.category).trim() || "Intel",
    readTime:  computeReadTime(wordCount),
    slug,
    href:      `/shorts/${slug}`,
    coverImage: resolveDocCoverImage(doc, { contentType: 'SHORT' }),
    views:     safeNumber(doc.views, 0),
    likes:     safeNumber(doc.likes, 0),
    saves:     safeNumber(doc.saves, 0),
    intensity,
    lineage:   safeString(doc.lineage).trim() || null,
    theme:     safeString(doc.theme).trim().toLowerCase() || "purpose",
    date:      safeString(doc.date).trim() || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD  = "var(--ds-accent)";
const VOID  = "var(--ds-background)";

// ─────────────────────────────────────────────────────────────────────────────
// THEME CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const THEME_ORDER = [
  "faith",
  "purpose",
  "hard-truths",
  "inner-life",
  "outer-life",
  "relationships",
  "authority",
  "gentle",
] as const;

type ThemeKey = (typeof THEME_ORDER)[number];

const THEME_META: Record<ThemeKey, { label: string; subtitle: string; image: string }> = {
  faith:         { label: "Faith",         subtitle: "The unseen architecture.",               image: "/assets/images/shorts/themes/faith.jpg" },
  purpose:       { label: "Purpose",       subtitle: "Direction before ambition.",              image: "/assets/images/shorts/themes/purpose.jpg" },
  "hard-truths": { label: "Hard Truths",   subtitle: "What nobody else will say.",             image: "/assets/images/shorts/themes/hard-truths.jpg" },
  "inner-life":  { label: "Inner Life",    subtitle: "The conversation beneath the surface.",  image: "/assets/images/shorts/themes/inner-life.jpg" },
  "outer-life":  { label: "Outer Life",    subtitle: "Work, systems, and visible consequence.", image: "/assets/images/shorts/themes/outer-life.jpg" },
  relationships: { label: "Relationships", subtitle: "People, boundaries, and belonging.",     image: "/assets/images/shorts/themes/relationships.jpg" },
  authority:     { label: "Authority",     subtitle: "The right to decide.",                   image: "/assets/images/shorts/themes/outer-life.jpg" },
  gentle:        { label: "Gentle",        subtitle: "Permission to be human.",                image: "/assets/images/shorts/themes/gentle.jpg" },
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPRINT — last read, fading memory
// ─────────────────────────────────────────────────────────────────────────────

function ImprintStrip({
  title,
  hoursRemaining,
  fadePercent,
}: {
  title?: string;
  hoursRemaining?: number;
  fadePercent?: number;
}) {
  if (!title) return null;

  const opacity = clamp(1 - (fadePercent ?? 0) / 115, 0.18, 0.78);

  return (
    <div
      className="border-y"
      style={{
        borderColor: "rgba(255,255,255,0.05)",
        backgroundColor: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="flex items-center justify-between gap-6">
          {/* Left: label */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}40, transparent)` }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "11px",
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)",
              }}
            >
              Last read
            </span>
          </div>

          {/* Centre: the fading title */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)",
              fontStyle: "italic",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.55)",
              opacity,
              textAlign: "center",
              flex: 1,
            }}
          >
            "{title}"
          </p>

          {/* Right: time since */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "11px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.16)",
              flexShrink: 0,
            }}
          >
            {hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h ago` : "fading"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

function extractShortRaw(doc: RawShortDoc): string {
  return (doc as any)?.body?.raw || "";
}

// Full model for THE daily short only. The body is rendered to STATIC HTML at
// build time via renderDocBodyToStaticHtml (the same sanctioned path the detail
// page uses) — we never ship compiled MDX `body.code`, which breaks SSG because
// the compiled-MDX runtime evaluator runs `new Function(code)` on ESM-formatted code.
function toTodaysShortModel(doc: RawShortDoc): TodaysShortModel | null {
  const slug = resolveShortSlug(doc);
  if (!slug) return null;

  const raw = extractShortRaw(doc);
  const metaReadTime =
    safeString(doc.readTime).trim() || safeString(doc.readTimeSafe).trim();
  const readTime = metaReadTime || (raw ? computeReadTime(estimateWordCount(raw)) : "");

  const { html: bodyHtml } = renderDocBodyToStaticHtml(doc);

  return {
    slug,
    title: safeString(doc.title).trim() || "Untitled",
    excerpt: safeString(doc.excerpt).trim() || safeString(doc.description).trim() || "",
    bodyHtml: bodyHtml || "",
    raw,
    theme: safeString(doc.theme).trim().toLowerCase() || "purpose",
    category: safeString(doc.category).trim() || "Signal",
    readTime,
    date: safeString(doc.date).trim() || "",
  };
}

// Metadata-only model for related shorts (NO body payload).
function toRelatedShortModel(doc: RawShortDoc): RelatedShortModel | null {
  const slug = resolveShortSlug(doc);
  if (!slug) return null;
  return {
    slug,
    title: safeString(doc.title).trim() || "Untitled",
    excerpt: safeString(doc.excerpt).trim() || safeString(doc.description).trim() || "",
    theme: safeString(doc.theme).trim().toLowerCase() || "purpose",
    category: safeString(doc.category).trim() || "Signal",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY SELECTION (server-side, deterministic) — shared daily pick
// ─────────────────────────────────────────────────────────────────────────────

// Curated pool for the "first" slot. Validated against published slugs at
// use-time so a renamed/unpublished slug cannot break selection.
const CURATED_FIRST_SHORTS = [
  "authority-is-the-missing-layer",
  "when-the-dashboard-lies-politely",
  "the-discipline-of-bounded-adaptation",
  "clarity-is-not-a-feeling",
  "the-cost-of-living-in-escalation",
];

function dailyHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function dailySeedString(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

// Deterministic daily pick over the published docs (same for every visitor on a
// given day). Prefers the curated pool when its slugs survive validation.
function selectDailyDoc(docs: RawShortDoc[]): RawShortDoc | null {
  if (docs.length === 0) return null;

  const seed = Math.abs(dailyHash(dailySeedString(new Date())));

  const curated = docs.filter((d) => {
    const slug = resolveShortSlug(d);
    return slug ? CURATED_FIRST_SHORTS.includes(slug) : false;
  });

  const pool = curated.length > 0 ? curated : docs;
  return pool[seed % pool.length] ?? null;
}

function selectRelatedDocs(
  current: TodaysShortModel,
  docs: RawShortDoc[],
  count = 3,
): RelatedShortModel[] {
  const candidates = docs
    .map(toRelatedShortModel)
    .filter(Boolean) as RelatedShortModel[];

  const sameTheme = candidates.filter(
    (s) => s.theme === current.theme && s.slug !== current.slug,
  );
  const other = candidates.filter(
    (s) => s.theme !== current.theme && s.slug !== current.slug,
  );

  return [...sameTheme, ...other].slice(0, count);
}

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

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts, todaysShort, relatedShorts }) => {
  const [activeTheme, setActiveTheme] = React.useState<string>("");

  // ── Slim retention surface (client-only) ────────────────────────────────
  // Update the daily-return streak and read back the last-read imprint. All
  // localStorage access lives here in an effect — never in render/useMemo.
  const [streak, setStreak] = React.useState(0);
  const [lastRead, setLastRead] = React.useState<Imprint | null>(null);

  React.useEffect(() => {
    setStreak(updateStreak());
    setLastRead(readImprint());
  }, []);

  const groupedByTheme = React.useMemo(() => {
    const map = new Map<string, ShortIndexItem[]>();
    for (const theme of THEME_ORDER) map.set(theme, []);
    for (const short of shorts) {
      const bucket = map.get(short.theme) || map.get("purpose")!;
      bucket.push(short);
    }
    return map;
  }, [shorts]);

  return (
    <Layout
      title="Shorts — Abraham of London"
      description="Compressed thinking for people who read fast."
      className="min-h-screen text-white"
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

      <main className="ds-surface-shorts min-h-screen" style={{ backgroundColor: VOID }}>
        <header
          className="border-b px-6 pb-12 pt-16 lg:px-10 lg:pb-16 lg:pt-28"
          style={{ borderColor: "var(--ds-border)" }}
        >
          <div className="mx-auto max-w-5xl">
            {/* Entry mark — SHORTS · ABRAHAM OF LONDON */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <span
                  className="font-serif font-light"
                  style={{
                    fontSize: "clamp(1.8rem, 3.2vw, 3rem)",
                    lineHeight: 1,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ds-text)",
                  }}
                >
                  SHORTS
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "clamp(0.55rem, 0.7vw, 0.7rem)",
                    letterSpacing: "0.50em",
                    textTransform: "uppercase",
                    color: "var(--ds-accent)",
                    paddingTop: "0.35rem",
                  }}
                >
                  ABRAHAM OF LONDON
                </span>
              </div>
              <div
                className="mt-3 h-px w-16"
                style={{ background: "linear-gradient(to right, var(--ds-accent), transparent)" }}
              />
            </div>

            {/* Headline — stunning but controlled */}
            <h1
              className="mt-5 max-w-[18ch] font-serif font-light italic"
              style={{
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                color: "var(--ds-text)",
              }}
            >
              Compressed thinking for people who read fast.
            </h1>

            {/* Gold rule */}
            <div
              className="my-6 h-px w-10"
              style={{ background: "linear-gradient(to right, var(--ds-accent), transparent)" }}
            />

            {/* Subline */}
            <div
              className="font-mono text-[8px] uppercase tracking-[0.42em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Signal. Pattern. Decision.
            </div>
            <p
              className="mt-4 max-w-xl text-sm leading-6"
              style={{ color: "var(--ds-text-muted)" }}
            >
              Short-form recognition for operators moving from pattern to diagnostic action.
            </p>

            {/* Count */}
            <div
              className="mt-6 font-mono text-[7px] uppercase tracking-[0.30em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              {shorts.length} dispatches indexed
            </div>
          </div>
        </header>

        {/* Today's Short — selected server-side; sits below the hero for sane hierarchy */}
        {todaysShort && (
          <TodaysShort todaysShort={todaysShort} relatedShorts={relatedShorts} />
        )}

        {/* Slim retention surface — daily-return streak + last-read imprint */}
        {streak > 1 && (
          <div
            className="border-b"
            style={{
              borderColor: "rgba(255,255,255,0.05)",
              backgroundColor: "rgba(0,0,0,0.30)",
            }}
          >
            <div className="mx-auto max-w-5xl px-6 py-3 lg:px-10">
              <span
                className="font-mono text-[7.5px] uppercase tracking-[0.34em]"
                style={{ color: "var(--ds-accent)" }}
              >
                {streak} day return streak
              </span>
            </div>
          </div>
        )}
        {lastRead && (
          <ImprintStrip
            title={lastRead.title}
            hoursRemaining={lastRead._hoursRemaining}
            fadePercent={lastRead._fadePercent}
          />
        )}

        {/* Theme navigation strip */}
        <nav className="border-b px-6 py-5 lg:px-10" style={{ borderColor: "var(--ds-border)" }}>
          <div className="mx-auto max-w-5xl overflow-x-auto">
            <div className="inline-flex min-w-full gap-8">
              <button
                type="button"
                onClick={() => setActiveTheme("")}
                className="cursor-pointer whitespace-nowrap border-none bg-transparent pb-1 font-mono text-[8px] uppercase tracking-[0.30em]"
                style={{
                  borderBottom: `1px solid ${!activeTheme ? "var(--ds-accent)" : "transparent"}`,
                  color: !activeTheme ? "var(--ds-accent)" : "var(--ds-text-subtle)",
                }}
              >
                All
              </button>
              {THEME_ORDER.map((theme) => {
                const meta = THEME_META[theme];
                const count = groupedByTheme.get(theme)?.length || 0;
                const isActive = activeTheme === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setActiveTheme(theme)}
                    className="cursor-pointer whitespace-nowrap border-none bg-transparent pb-1 font-mono text-[8px] uppercase tracking-[0.30em]"
                    style={{
                      borderBottom: `1px solid ${isActive ? "var(--ds-accent)" : "transparent"}`,
                      color: isActive ? "var(--ds-accent)" : "var(--ds-text-subtle)",
                    }}
                  >
                    {meta.label} <span style={{ opacity: 0.5 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Theme sections */}
        <section>
          {THEME_ORDER
            .filter((theme) => !activeTheme || activeTheme === theme)
            .map((theme) => {
              const meta = THEME_META[theme];
              const items = groupedByTheme.get(theme) || [];
              if (items.length === 0) return null;

              return (
                <div key={theme} id={`theme-${theme}`}>
                  {/* Theme header with cover image */}
                  <div
                    className="relative overflow-hidden border-b"
                    style={{ borderColor: "var(--ds-border)" }}
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={meta.image}
                        alt=""
                        fill
                        className="object-cover opacity-[0.12]"
                        sizes="100vw"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to right, var(--ds-background) 30%, transparent 70%)" }}
                      />
                    </div>
                    <div className="relative mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-4 w-px" style={{ backgroundColor: "var(--ds-accent)", opacity: 0.5 }} />
                        <span
                          className="font-mono text-[7px] uppercase tracking-[0.40em]"
                          style={{ color: "var(--ds-accent)" }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="font-mono text-[7px] uppercase tracking-[0.26em]"
                          style={{ color: "var(--ds-text-subtle)" }}
                        >
                          · {items.length} {items.length === 1 ? "dispatch" : "dispatches"}
                        </span>
                      </div>
                      <p
                        className="mt-3 max-w-md font-serif font-light italic"
                        style={{
                          fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                          lineHeight: 1.15,
                          color: "var(--ds-text)",
                        }}
                      >
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Shorts list within theme */}
                  {items.map((short) => {
                    const excerpt = firstSentence(short.excerpt);
                    return (
                      <Link
                        key={short.id}
                        href={short.href}
                        className="group block border-b px-6 py-6 transition-colors lg:px-10"
                        style={{ borderColor: "var(--ds-border)" }}
                      >
                        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[80px_minmax(0,1fr)_80px] md:items-start">
                          <div
                            className="font-mono text-[8px] uppercase tracking-[0.12em]"
                            style={{ color: "var(--ds-text-subtle)" }}
                          >
                            {short.readTime}
                          </div>

                          <div className="min-w-0">
                            <h2
                              className="font-serif font-light italic transition-colors group-hover:text-white"
                              style={{
                                fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                                lineHeight: 1.08,
                                color: "var(--ds-text)",
                              }}
                            >
                              {short.title}
                            </h2>
                            {excerpt ? (
                              <p
                                className="mt-2 truncate font-serif font-light"
                                style={{
                                  fontSize: "0.875rem",
                                  lineHeight: 1.45,
                                  color: "var(--ds-text-muted)",
                                }}
                              >
                                {excerpt}
                              </p>
                            ) : null}
                          </div>

                          <div
                            className="font-mono text-[7.5px] uppercase tracking-[0.12em] md:text-right"
                            style={{ color: "var(--ds-text-subtle)" }}
                          >
                            {formatShortDate(short.date)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
        </section>

        <footer className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-5xl border-t pt-6" style={{ borderColor: "var(--ds-border)" }}>
            <div
              className="font-mono text-[7.5px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-text-subtle)" }}
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
// DATA — daily short picked server-side; archive shipped as metadata only
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const { getAllShorts, sanitizeData } = await import(
    "@/lib/content/server"
  );
  const fromShorts = (getAllShorts() || []) as RawShortDoc[];

  const publishedDocs = fromShorts.filter(isPublishedShort);

  // Archive list — metadata only (NO body payload).
  const shorts = publishedDocs
    .map(toShortIndexItem)
    .filter(Boolean) as ShortIndexItem[];

  shorts.sort((a, b) => {
    const aT = a.date ? new Date(a.date).getTime() : 0;
    const bT = b.date ? new Date(b.date).getTime() : 0;
    return bT - aT;
  });

  // Deterministic shared daily pick — only THIS short carries the body (as
  // build-time static HTML).
  const dailyDoc = selectDailyDoc(publishedDocs);
  const todaysShort = dailyDoc ? toTodaysShortModel(dailyDoc) : null;

  // Related shorts — metadata only.
  const relatedShorts = todaysShort
    ? selectRelatedDocs(todaysShort, publishedDocs, 3)
    : [];

  return {
    props: {
      shorts:        sanitizeData(shorts),
      totalCount:    shorts.length,
      todaysShort:   todaysShort ? sanitizeData(todaysShort) : null,
      relatedShorts: sanitizeData(relatedShorts),
    },
    revalidate: 3600,
  };
};
