/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (MASTERPIECE, HARDENED, CANONICALIZED)

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
  BookOpen,
  Library,
  FolderKanban,
  ScrollText,
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
  CONSTANTS
----------------------------------------------------------------------------- */
const HERO_LINKS = [
  { href: "/canon", label: "Canon", icon: BookOpen },
  { href: "/books", label: "Books", icon: ScrollText },
  { href: "/editorials", label: "Editorials", icon: Library },
  { href: "/library", label: "Library", icon: Library },
  { href: "/artifacts", label: "Artifacts", icon: FolderKanban },
  { href: "/vault/briefs", label: "Briefs", icon: ScrollText },
  { href: "/ventures", label: "Ventures", icon: FolderKanban },
] as const;

/* -----------------------------------------------------------------------------
  UTILITIES
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
    intensity: clamp(safeNumber(doc.intensity, 3), 1, 5) as 1 | 2 | 3 | 4 | 5,
    lineage: safeString(doc.lineage).trim() || null,
    date: safeString(doc.date).trim() || null,
  };
}

/* -----------------------------------------------------------------------------
  VISUAL PRIMITIVES
----------------------------------------------------------------------------- */
function Hairline({
  soft = false,
  gold = false,
}: {
  soft?: boolean;
  gold?: boolean;
}) {
  const cls = gold
    ? "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
    : soft
      ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
      : "bg-gradient-to-r from-transparent via-white/16 to-transparent";

  return <div className={`h-px w-full ${cls}`} />;
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,9,0.9)_0%,rgba(3,3,4,0.98)_100%)]",
        "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_55%)]" />
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — BACKDROP
----------------------------------------------------------------------------- */
function VelvetBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[#020202]" />

      {/* Primary amber atmosphere — broad, not obvious */}
      <div className="absolute left-[-18%] top-[-8%] h-[540px] w-[780px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(184,155,110,0.12)_0%,rgba(184,155,110,0.06)_24%,rgba(184,155,110,0.02)_48%,transparent_72%)] blur-[90px]" />

      {/* Secondary buried warmth */}
      <div className="absolute left-[26%] bottom-[-24%] h-[280px] w-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(184,155,110,0.06)_0%,rgba(184,155,110,0.025)_42%,transparent_75%)] blur-[110px]" />

      {/* Cold balance on far right */}
      <div className="absolute right-[-6%] top-[10%] h-[360px] w-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.028)_0%,rgba(255,255,255,0.014)_35%,transparent_72%)] blur-[120px]" />

      {/* Central void for “silent throne” feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_24%,rgba(0,0,0,0.18)_48%,rgba(0,0,0,0.58)_78%,rgba(0,0,0,0.88)_100%)]" />

      {/* Very faint architectural verticals */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, transparent 0%, transparent 7.8%, rgba(255,255,255,0.03) 7.95%, transparent 8.1%, transparent 16.2%, rgba(255,255,255,0.018) 16.35%, transparent 16.5%, transparent 100%)",
          backgroundSize: "340px 100%",
        }}
      />

      {/* Micro-star dust */}
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.82) 0.38px, transparent 0.88px)",
          backgroundSize: "27px 27px",
        }}
      />

      {/* Smaller subliminal dust */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 0.2px, transparent 0.68px)",
          backgroundSize: "13px 13px",
        }}
      />

      {/* Long spectral trace — almost invisible */}
      <div className="absolute left-[10%] top-[22%] h-px w-[34%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent blur-[0.3px]" />

      {/* Soft veil to kill harshness */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.50)_0%,rgba(0,0,0,0.18)_22%,rgba(0,0,0,0.10)_48%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.56)_100%)]" />

      {/* Grain */}
      <div className="absolute inset-0 aol-grain opacity-[0.025]" />

      {/* Edge control */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/78 via-black/26 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/34 to-transparent" />

      {/* Bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HERO
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
      className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.016] px-5 py-2.5 backdrop-blur-xl"
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
      transition={{ duration: 0.8, delay: 0.28, ease: [0.19, 1, 0.22, 1] }}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md",
        rare
          ? "border border-amber-500/14 bg-amber-500/[0.03]"
          : "border border-white/[0.06] bg-white/[0.015]",
      ].join(" ")}
    >
      <Sparkles
        className={`h-3 w-3 ${rare ? "text-amber-400/58" : "text-white/16"}`}
        strokeWidth={1.5}
      />
      <span
        className={`text-[10px] ${
          rare ? "text-amber-300/68" : "text-white/38"
        }`}
      >
        {text}
      </span>
    </motion.div>
  );
}

function HeroPageLinks() {
  return (
    <div className="mt-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Hairline soft />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {HERO_LINKS.map((link, i) => (
            <React.Fragment key={link.href}>
              <Link
                href={link.href}
                className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/34 transition-colors duration-500 hover:text-amber-300/76"
              >
                {link.label}
              </Link>
              {i < HERO_LINKS.length - 1 ? (
                <span className="text-[9px] text-white/14">•</span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroActionRail() {
  return (
    <div className="mt-8 flex justify-center">
      <div className="inline-flex items-center gap-4 rounded-full border border-white/[0.10] bg-white/[0.026] px-5 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.16)] backdrop-blur-lg">
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/68">
          Built to survive scrutiny
        </span>
        <span className="h-3 w-px bg-gradient-to-b from-transparent via-amber-500/45 to-transparent" />
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-amber-300/82">
          Designed to ship
        </span>
      </div>
    </div>
  );
}

function ShortsHeroChamber({
  streak,
  totalCount,
  visits,
  whisper,
  isRareWhisper,
}: {
  streak: number;
  totalCount: number;
  visits: number;
  whisper: string;
  isRareWhisper: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.05] bg-black">
      <div className="relative min-h-[390px] md:min-h-[430px] lg:min-h-[470px]">
        <VelvetBackdrop />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 sm:px-8 lg:px-10">
          {/* More space from transparent header */}
          <div className="flex justify-center pt-14 md:pt-16 lg:pt-18">
            <EliteStatsRibbon
              streak={streak}
              totalCount={totalCount}
              visits={visits}
            />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="mx-auto max-w-3xl -translate-y-1 text-center md:-translate-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.1,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="font-serif font-light text-white"
                style={{
                  fontSize: "clamp(4rem, 7vw, 6.2rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.075em",
                  textShadow: "0 14px 32px rgba(0,0,0,0.24)",
                }}
              >
                Shorts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.85,
                  delay: 0.2,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mx-auto mt-5 max-w-xl text-white/72"
                style={{
                  fontSize: "clamp(1rem, 1.1vw, 1.08rem)",
                  lineHeight: 1.7,
                }}
              >
                Small doses. Clear signal.
              </motion.p>

              {whisper ? (
                <div className="mt-10 flex justify-center">
                  <WhisperPill text={whisper} rare={isRareWhisper} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="pb-6 md:pb-7" />
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
    <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.82)_100%)] backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25">
            Last Read
          </span>
          <span className="text-[9px] font-mono text-white/18">
            {hoursRemaining && hoursRemaining > 0
              ? `${hoursRemaining}h ago`
              : "fading"}
          </span>
        </div>

        <p
          className="text-center font-serif text-[1.35rem] italic leading-relaxed text-white/42"
          style={{ opacity }}
        >
          “{imprintTitle}”
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  FEATURED
----------------------------------------------------------------------------- */
function FeaturedNoteCard({ item }: { item: FeaturedItem }) {
  return (
    <Link href={item.href} className="group block h-full">
      <article
        className={[
          "relative h-full overflow-hidden",
          "border border-white/[0.08]",
          "bg-[linear-gradient(180deg,rgba(8,8,9,0.92)_0%,rgba(3,3,4,0.98)_100%)]",
          "transition-all duration-500 ease-out",
          "hover:border-[#C9A96A]/26 hover:bg-[linear-gradient(180deg,rgba(10,10,11,0.96)_0%,rgba(4,4,5,1)_100%)]",
          "hover:shadow-[0_18px_42px_rgba(0,0,0,0.34)] hover:-translate-y-[2px]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_18%)] opacity-80" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/34 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
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

              <p className="mt-3 line-clamp-3 max-w-[40ch] text-[14px] leading-7 text-white/40 transition-colors duration-500 group-hover:text-white/56">
                {item.excerpt}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.02] text-white/24 transition-all duration-500 group-hover:border-[#C9A96A]/24 group-hover:bg-[#C9A96A]/[0.06] group-hover:text-[#D8B97F]">
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
    <section className="border-y border-white/[0.08] bg-black/30">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-[#C9A96A]/45 to-transparent" />
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
            const isLastColLg = index % 3 === 2;
            const topRowLg = index < 3;
            const isEvenMd = index % 2 === 0;

            return (
              <div
                key={item.id}
                className={[
                  "relative border-white/[0.07]",
                  !isLastColLg ? "lg:border-r" : "",
                  isEvenMd ? "md:border-r lg:border-r-0" : "",
                  topRowLg ? "border-b" : "",
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
  query,
  setQuery,
  viewMode,
  setViewMode,
  count,
}: {
  query: string;
  setQuery: (v: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  count: number;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="group relative max-w-md flex-1">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-white/45" />
          <input
            type="text"
            placeholder="Filter by keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-none bg-transparent py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/25 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">
            {count} visible
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
    </div>
  );
}

/* -----------------------------------------------------------------------------
  EMPTY STATE
----------------------------------------------------------------------------- */
function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl py-20 text-center">
      <p className="font-serif text-2xl text-white/80">No notes found.</p>
      <p className="mt-3 text-white/45">Try a broader keyword.</p>
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
  const [imprint, setImprint] = React.useState<{
    title?: string;
    _hoursRemaining?: number;
    _fadePercent?: number;
  } | null>(null);

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
    const interval = window.setInterval(() => setImprint(readImprint()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const filtered = React.useMemo(() => {
    const list = Array.isArray(shorts) ? shorts : [];
    const query = searchQuery.trim().toLowerCase();

    if (!query) return list;

    return list.filter((s) => {
      const t = safeString(s.title).toLowerCase();
      const e = safeString(s.excerpt).toLowerCase();
      const c = safeString(s.category).toLowerCase();
      const r = safeString(s.readTime).toLowerCase();

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
      className="min-h-screen bg-black text-white selection:bg-amber-500/10"
      fullWidth
      headerTransparent
      canonicalUrl="/shorts"
      minimalHeader
      showFooter={false}
      enableVaultSearch={false}
    >
      <Head>
        <title>Shorts // Abraham of London</title>
        <meta
          name="description"
          content="Compact notes for alignment, thought, and direction."
        />
      </Head>

      <ShortsHeroChamber
        streak={streak}
        totalCount={totalCount}
        visits={visitCount}
        whisper={whisper}
        isRareWhisper={isRareWhisper}
      />

      <ImprintLine
        imprintTitle={imprint?.title}
        hoursRemaining={imprint?._hoursRemaining}
        fadePercent={imprint?._fadePercent}
      />

      <FeaturedGrid items={featured} />

      <FilterBar
        query={searchQuery}
        setQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        count={filtered.length}
      />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        {filtered.length === 0 ? (
          <EmptyState />
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

  console.log("[SHORTS_INDEX_GSP]", {
    fromShorts: fromShorts.length,
    fallbackShorts: fallbackShorts.length,
    final: shorts.length,
    sample: shorts.slice(0, 5).map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
    })),
  });

  return {
    props: sanitizeData({
      shorts,
      totalCount: shorts.length,
    }),
    revalidate: 3600,
  };
};