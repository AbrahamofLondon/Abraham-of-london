/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (FULL REWRITE, QUIET LUXURY / EXPENSIVE HERO)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Grid,
  List,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import ShortCard from "@/components/ShortCard";
import {
  getAllShorts,
  getAllCombinedDocs,
  sanitizeData,
} from "@/lib/content/server";
import {
  readImprint,
  writeImprint,
  computeWhisper,
  getOrCreateSeed,
  updateStreak,
  updateVisitCount,
} from "@/lib/shorts/brand";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
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
  date: string | null;
};

type FeaturedItem = {
  id: string;
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
};

type ShortsIndexProps = {
  shorts: ShortIndexItem[];
  totalCount: number;
};

/* -----------------------------------------------------------------------------
  SAFETY + NORMALIZATION
----------------------------------------------------------------------------- */
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
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  return source.toLowerCase().startsWith(normalizedPrefix)
    ? source.slice(normalizedPrefix.length)
    : source;
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

    if (s.toLowerCase().startsWith("content/")) {
      s = s.slice("content/".length);
    }

    if (s.toLowerCase().startsWith("shorts/")) {
      s = stripPrefixOnce(s, "shorts");
    } else if (s.toLowerCase().startsWith("/shorts/")) {
      s = s.replace(/^\/?shorts\//i, "");
    }

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

  const title = safeString(doc.title).trim() || "Untitled";
  const excerpt =
    safeString(doc.excerpt).trim() ||
    safeString(doc.description).trim() ||
    "";

  const intensityRaw = safeNumber(doc.intensity, 3);
  const intensity = clamp(intensityRaw, 1, 5) as 1 | 2 | 3 | 4 | 5;

  return {
    id: safeString(doc._id) || `short-${slug}`,
    title,
    excerpt,
    category: safeString(doc.category).trim() || "Intel",
    readTime:
      safeString(doc.readTime).trim() ||
      safeString(doc.readTimeSafe).trim() ||
      "2 min",
    slug,
    href: `/shorts/${slug}`,
    coverImage:
      safeString(doc.coverImage).trim() ||
      safeString(doc.image).trim() ||
      null,
    views: safeNumber(doc.views, 0),
    likes: safeNumber(doc.likes, 0),
    saves: safeNumber(doc.saves, 0),
    intensity,
    lineage: safeString(doc.lineage).trim() || null,
    date: safeString(doc.date).trim() || null,
  };
}

/* -----------------------------------------------------------------------------
  DESIGN HELPERS
----------------------------------------------------------------------------- */
function Hairline({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={[
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          : "bg-gradient-to-r from-transparent via-[#C9A96A]/30 to-transparent",
      ].join(" ")}
    />
  );
}

/* -----------------------------------------------------------------------------
  HERO BACKDROP — QUIET LUXURY / GALLERY DARK
----------------------------------------------------------------------------- */
function LuxuryBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[#020202]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0.00)_18%,rgba(0,0,0,0.00)_58%,rgba(0,0,0,0.22)_100%)]" />

      <div className="absolute left-[-10%] top-[-12%] h-[580px] w-[980px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,169,106,0.08)_0%,rgba(201,169,106,0.035)_24%,rgba(201,169,106,0.012)_46%,transparent_72%)] blur-[120px]" />
      <div className="absolute right-[-4%] top-[8%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.012)_28%,transparent_72%)] blur-[120px]" />
      <div className="absolute bottom-[-26%] left-[16%] h-[340px] w-[680px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,169,106,0.028)_0%,rgba(201,169,106,0.01)_36%,transparent_74%)] blur-[120px]" />

      <div className="absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-white/[0.045] to-transparent xl:block" />
      <div className="absolute inset-y-0 right-[8%] hidden w-px bg-gradient-to-b from-transparent via-white/[0.035] to-transparent xl:block" />
      <div className="absolute inset-x-0 top-[28%] h-px bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
      <div className="absolute inset-x-0 bottom-[18%] h-px bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />

      <div className="absolute right-[12%] top-[16%] h-[280px] w-[420px] rounded-[38px] border border-white/[0.05]" />
      <div className="absolute right-[14%] top-[19%] h-[220px] w-[350px] rounded-[30px] border border-white/[0.035]" />
      <div className="absolute right-[16%] top-[22%] h-[160px] w-[280px] rounded-[24px] border border-white/[0.03]" />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.05) 0.5px, transparent 0.5px)",
          backgroundSize: "120px 120px",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.35) 0.4px, transparent 0.9px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="absolute inset-0 aol-grain opacity-[0.012]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.1)_66%,rgba(0,0,0,0.26)_100%)]" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HERO ELEMENTS
----------------------------------------------------------------------------- */
function EliteStatsRibbon({
  streak,
  totalCount,
  visits,
}: {
  streak: number;
  totalCount: number;
  visits: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.82, delay: 0.05, ease: [0.19, 1, 0.22, 1] }}
      className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.02] px-5 py-2.5 backdrop-blur-xl"
    >
      <span className="text-[8px] font-mono uppercase tracking-[0.28em] text-white/36">
        Indexed
      </span>
      <span className="text-white/[0.10]">•</span>
      <span className="text-[11px] font-mono text-white/82">{totalCount}</span>
      <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/30">
        notes
      </span>
      <span className="text-white/[0.10]">•</span>
      <span className="text-[11px] font-mono text-white/82">{streak}</span>
      <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/30">
        streak
      </span>
      <span className="text-white/[0.10]">•</span>
      <span className="text-[11px] font-mono text-white/82">{visits}</span>
      <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/30">
        visits
      </span>
    </motion.div>
  );
}

function WhisperPill({ text, rare }: { text: string; rare: boolean }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.26, ease: [0.19, 1, 0.22, 1] }}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md",
        rare
          ? "border border-amber-500/18 bg-amber-500/[0.045]"
          : "border border-white/[0.07] bg-white/[0.02]",
      ].join(" ")}
    >
      <Sparkles
        className={`h-3 w-3 ${rare ? "text-amber-400/56" : "text-white/20"}`}
        strokeWidth={1.5}
      />
      <span
        className={`text-[10px] ${
          rare ? "text-amber-300/66" : "text-white/40"
        }`}
      >
        {text}
      </span>
    </motion.div>
  );
}

function PremiumFeatureRail({ featured }: { featured: FeaturedItem[] }) {
  const items = featured.slice(0, 3);

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.95, delay: 0.22, ease: [0.19, 1, 0.22, 1] }}
      className="relative mt-12 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.025),transparent_18%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/30 to-transparent" />

      <div className="relative grid grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group px-6 py-5 transition-colors duration-500 hover:bg-white/[0.02]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#D8B97F]">
                    {item.category}
                  </span>
                  <span className="text-white/[0.12]">•</span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/30">
                    {item.readTime}
                  </span>
                </div>

                <h3 className="line-clamp-2 font-serif text-[1.12rem] leading-[1.2] tracking-[-0.02em] text-white/88 transition-colors duration-500 group-hover:text-white">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-white/42 transition-colors duration-500 group-hover:text-white/56">
                  {item.excerpt}
                </p>
              </div>

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/24 transition-all duration-500 group-hover:border-[#C9A96A]/24 group-hover:bg-[#C9A96A]/[0.05] group-hover:text-[#D8B97F]">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function ShortsHeroChamber({
  streak,
  totalCount,
  visits,
  whisper,
  isRareWhisper,
  featured,
}: {
  streak: number;
  totalCount: number;
  visits: number;
  whisper: string;
  isRareWhisper: boolean;
  featured: FeaturedItem[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.05] bg-black">
      <div className="relative min-h-[520px] sm:min-h-[560px] md:min-h-[620px] lg:min-h-[680px]">
        <LuxuryBackdrop />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 sm:px-8 lg:px-10">
          <div className="pt-[112px] sm:pt-[118px] md:pt-[126px] lg:pt-[136px]">
            <EliteStatsRibbon
              streak={streak}
              totalCount={totalCount}
              visits={visits}
            />
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.72,
                  delay: 0.08,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mb-6 flex items-center gap-3"
              >
                <span className="h-px w-10 bg-gradient-to-r from-[#C9A96A]/55 to-transparent" />
                <span className="text-[9px] font-mono uppercase tracking-[0.34em] text-white/34">
                  Brief signals. Lasting weight.
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.92,
                  delay: 0.1,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="font-serif font-light text-white"
                style={{
                  fontSize: "clamp(4rem, 7.4vw, 6.9rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.078em",
                  textShadow: "0 14px 34px rgba(0,0,0,0.28)",
                }}
              >
                Shorts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.84,
                  delay: 0.18,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mt-5 max-w-2xl text-white/68"
                style={{
                  fontSize: "clamp(1rem, 1.2vw, 1.12rem)",
                  lineHeight: 1.72,
                }}
              >
                Thought distilled to its sharpest edge. Small doses of signal for
                people who want clarity without noise — serious, readable, and
                built to stay with you after the page is gone.
              </motion.p>

              {whisper ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <WhisperPill text={whisper} rare={isRareWhisper} />
                </div>
              ) : null}
            </div>

            <PremiumFeatureRail featured={featured} />
          </div>

          <div className="pb-8 md:pb-10" />
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  IMPRINT
----------------------------------------------------------------------------- */
function ImprintLine({
  imprintTitle,
  hoursRemaining,
  fadePercent,
}: {
  imprintTitle?: string;
  hoursRemaining?: number;
  fadePercent?: number;
}) {
  if (!imprintTitle) return null;

  const opacity = clamp(1 - (fadePercent || 0) / 115, 0.2, 1);

  return (
    <div className="border-t border-white/[0.06] bg-black/36 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-11">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-[0.26em] text-white/22">
            Last Read
          </span>
          <span className="text-[10px] font-mono text-white/24">
            {hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h ago` : "fading"}
          </span>
        </div>

        <p
          className="text-center font-serif text-[clamp(1.3rem,2vw,1.9rem)] italic leading-relaxed text-white/54"
          style={{ opacity }}
        >
          “{imprintTitle}”
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  FEATURED NOTES
----------------------------------------------------------------------------- */
function FeaturedNoteCard({ item }: { item: FeaturedItem }) {
  return (
    <Link href={item.href} className="group block h-full">
      <article
        className={[
          "relative h-full overflow-hidden",
          "border border-white/[0.08]",
          "bg-[linear-gradient(180deg,rgba(6,6,7,0.92)_0%,rgba(2,2,3,0.98)_100%)]",
          "transition-all duration-500 ease-out",
          "hover:-translate-y-[2px]",
          "hover:border-[#C9A96A]/24",
          "hover:shadow-[0_18px_42px_rgba(0,0,0,0.34)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_18%)] opacity-80" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/30 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-[#C9A96A]/18 bg-[#C9A96A]/[0.06] px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#D8B97F]">
                  {item.category}
                </span>

                <span className="text-white/[0.14]">•</span>

                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">
                  {item.readTime}
                </span>
              </div>

              <h3 className="font-serif text-[1.18rem] leading-[1.18] tracking-[-0.02em] text-white/88 transition-colors duration-500 group-hover:text-white">
                {item.title}
              </h3>

              <p className="mt-3 line-clamp-3 max-w-[40ch] text-[14px] leading-7 text-white/42 transition-colors duration-500 group-hover:text-white/56">
                {item.excerpt}
              </p>
            </div>

            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                "border-white/[0.09] bg-white/[0.02]",
                "text-white/24 transition-all duration-500",
                "group-hover:border-[#C9A96A]/24 group-hover:bg-[#C9A96A]/[0.06] group-hover:text-[#D8B97F]",
              ].join(" ")}
            >
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FeaturedGrid({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-y border-white/[0.06] bg-black/26">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-14">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-[#C9A96A]/42 to-transparent" />
            <h2 className="text-[9px] font-mono uppercase tracking-[0.32em] text-white/34">
              Featured Notes
            </h2>
          </div>

          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/18">
            Take one • Leave • Return
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((item, index) => {
            const addBottomBorder = index < 3;
            return (
              <div
                key={item.id}
                className={[
                  "relative border-white/[0.07]",
                  index % 2 === 0 ? "md:border-r lg:border-r-0" : "",
                  index % 3 !== 2 ? "lg:border-r" : "",
                  addBottomBorder ? "border-b" : "",
                ].join(" ")}
              >
                <FeaturedNoteCard item={item} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  FILTER BAR
----------------------------------------------------------------------------- */
function FilterBar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (value: "grid" | "list") => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/86 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="group relative max-w-md flex-1">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24 transition-colors group-focus-within:text-white/42" />
          <input
            type="text"
            placeholder="Filter by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/24 focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded p-2 transition-all ${
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/55"
            }`}
            aria-label="Grid view"
            type="button"
          >
            <Grid className="h-4 w-4" />
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={`rounded p-2 transition-all ${
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/55"
            }`}
            aria-label="List view"
            type="button"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts, totalCount }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [streak, setStreak] = React.useState(1);
  const [visitCount, setVisitCount] = React.useState(1);
  const [whisper, setWhisper] = React.useState("");
  const [isRareWhisper, setIsRareWhisper] = React.useState(false);
  const [imprint, setImprint] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setStreak(updateStreak());
    setVisitCount(updateVisitCount());
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = getOrCreateSeed();
    const out = computeWhisper({ seed, visitCount, now: new Date() });
    setWhisper(out.text);
    setIsRareWhisper(out.isRare);
  }, [visitCount]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setImprint(readImprint());
    const interval = setInterval(() => setImprint(readImprint()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = React.useMemo(() => {
    const list = Array.isArray(shorts) ? shorts : [];
    const query = searchQuery.trim().toLowerCase();

    if (!query) return list;

    return list.filter((s) => {
      const t = safeString(s?.title).toLowerCase();
      const e = safeString(s?.excerpt).toLowerCase();
      const c = safeString(s?.category).toLowerCase();
      const r = safeString(s?.readTime).toLowerCase();

      return (
        t.includes(query) ||
        e.includes(query) ||
        c.includes(query) ||
        r.includes(query)
      );
    });
  }, [shorts, searchQuery]);

  const featured: FeaturedItem[] = React.useMemo(() => {
    return shorts.slice(0, 6).map((s) => ({
      id: s.id,
      slug: s.slug,
      href: s.href,
      title: s.title,
      excerpt: s.excerpt,
      category: s.category,
      readTime: s.readTime,
    }));
  }, [shorts]);

  return (
    <Layout
      title="Shorts // Abraham of London"
      description="Small doses. Clear signal."
      className="min-h-screen bg-black text-white selection:bg-amber-500/10"
      fullWidth
      headerTransparent
      canonicalUrl="/shorts"
      showFooter={false}
      enableVaultSearch={false}
    >
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      <ShortsHeroChamber
        streak={streak}
        totalCount={totalCount}
        visits={visitCount}
        whisper={whisper}
        isRareWhisper={isRareWhisper}
        featured={featured}
      />

      <ImprintLine
        imprintTitle={imprint?.title}
        hoursRemaining={imprint?._hoursRemaining}
        fadePercent={imprint?._fadePercent}
      />

      <FeaturedGrid items={featured} />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-[#C9A96A]/42 to-transparent" />
            <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/30">
              Library
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/22">
            {filtered.length} visible
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="mx-auto max-w-2xl py-20 text-center">
            <p className="font-serif text-2xl text-white/80">No notes found.</p>
            <p className="mt-3 text-white/45">Try a broader keyword.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                  : "mx-auto max-w-3xl space-y-6"
              }
            >
              {filtered.map((short) => (
                <ShortCard
                  key={short.id}
                  short={{
                    slug: short.slug,
                    title: short.title,
                    excerpt: short.excerpt,
                    category: short.category,
                    readTime: short.readTime,
                    views: short.views,
                    intensity: short.intensity,
                    lineage: short.lineage,
                    coverImage: short.coverImage,
                    metrics: {
                      likes: short.likes,
                      saves: short.saves,
                      views: short.views,
                    },
                    state: {
                      liked: false,
                      saved: false,
                    },
                  }}
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    writeImprint(short.slug, short.title);
                  }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

/* -----------------------------------------------------------------------------
  DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const fromShorts = (getAllShorts() || []) as RawShortDoc[];
  const fromAllDocs = (getAllCombinedDocs() || []) as RawShortDoc[];

  const fallbackShorts = fromAllDocs.filter((doc) => {
    const slug =
      safeString(doc.slug) ||
      safeString(doc.slugSafe) ||
      safeString(doc?._raw?.flattenedPath) ||
      safeString(doc?._raw?.sourceFilePath);

    const docKind = safeString(
      (doc as any).docKind || (doc as any).kind || (doc as any).type
    ).toLowerCase();

    const normalizedSlug = normalizePath(slug).toLowerCase();
    return docKind === "short" || normalizedSlug.startsWith("shorts/");
  });

  const source = fromShorts.length > 0 ? fromShorts : fallbackShorts;

  const shorts = source
    .filter(isPublishedShort)
    .map(toShortIndexItem)
    .filter(Boolean) as ShortIndexItem[];

  shorts.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  return {
    props: {
      shorts: sanitizeData(shorts),
      totalCount: shorts.length,
    },
    revalidate: 3600,
  };
};