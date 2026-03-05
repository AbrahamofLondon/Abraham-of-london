/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (HARRODS × SILENT CINEMA)
// Hero = EMPTY VELVET THRONE (felt, not seen). No overlaps. No noise.

import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Grid, List, ArrowDownRight, Sparkles, ArrowUpRight } from "lucide-react";

import Layout from "@/components/Layout";
import ShortCard from "@/components/ShortCard";
import { getAllCombinedDocs, normalizeSlug, sanitizeData } from "@/lib/content/server";

import {
  readImprint,
  writeImprint,
  computeWhisper,
  getOrCreateSeed,
  updateStreak,
  updateVisitCount,
  cleanSlugForURL,
} from "@/lib/shorts/brand";

/* -----------------------------------------------------------------------------
  UTILITIES
----------------------------------------------------------------------------- */
function safeStartsWith(v: unknown, prefix: string) {
  return typeof v === "string" && v.startsWith(prefix);
}
function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function safeNumber(n: unknown, fallback = 0) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/* -----------------------------------------------------------------------------
  HERO — EMPTY VELVET BACKDROP (looks empty, feels premium)
  - No visible blobs / no “particles” / no shapes competing with text
  - Edge-only microfield via masking
  - Soft center lift + vignette + micro-grain (NOT tv snow)
----------------------------------------------------------------------------- */
function VelvetBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0 bg-black" />

      {/* Center lift (subtle, clean) */}
      <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,0.06),transparent_62%)]" />

      {/* Warmth hint (subtle) */}
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_50%_48%,rgba(245,158,11,0.10),transparent_72%)]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_80%,rgba(0,0,0,0.92)_100%)]" />

      {/* Edge-only microfield (masked away from center throne) */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 52%, transparent 0%, transparent 42%, rgba(0,0,0,1) 72%, rgba(0,0,0,1) 100%)",
          maskImage:
            "radial-gradient(ellipse at 50% 52%, transparent 0%, transparent 42%, rgba(0,0,0,1) 72%, rgba(0,0,0,1) 100%)",
        }}
      >
        <div className="absolute inset-0 aol-velvet-smoke" />
        <div className="absolute inset-0 aol-velvet-dust" />
      </div>

      {/* Micro-grain (low frequency, not harsh) */}
      <div className="absolute inset-0 aol-velvet-grain" />

      <style jsx global>{`
        /* Edge smoke: sub-threshold drift */
        .aol-velvet-smoke {
          opacity: 0.010;
          background:
            radial-gradient(900px 420px at 16% 22%, rgba(245,158,11,0.55), transparent 68%),
            radial-gradient(820px 420px at 86% 34%, rgba(255,255,255,0.38), transparent 70%),
            radial-gradient(980px 520px at 55% 92%, rgba(255,255,255,0.28), transparent 72%);
          filter: blur(30px);
          animation: aolVelvetDrift 22s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes aolVelvetDrift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-10px,-14px,0) scale(1.05); }
        }

        /* Dust: low frequency turbulence, very faint */
        .aol-velvet-dust {
          opacity: 0.008;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='380'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
          background-size: 380px 380px;
          mix-blend-mode: soft-light;
          animation: aolVelvetShift 20s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes aolVelvetShift {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(12px,-8px,0); }
        }

        /* Grain: extremely subtle, not TV snow */
        .aol-velvet-grain {
          opacity: 0.012;
          mix-blend-mode: soft-light;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 420 420' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.28' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
          background-size: 420px 420px;
        }

        @media (prefers-reduced-motion: reduce) {
          .aol-velvet-smoke,
          .aol-velvet-dust {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Stats Ribbon (single pill)
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
      transition={{ duration: 1.0, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/[0.08] bg-black/[0.22] backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="relative flex items-center justify-center w-2 h-2 mr-1">
        <div className="absolute w-2 h-2 bg-amber-500/30 rounded-full animate-ping" style={{ animationDuration: "2.6s" }} />
        <div className="relative w-1.5 h-1.5 bg-amber-500/85 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.25)]" />
      </div>

      <span className="text-[8px] font-mono tracking-[0.28em] text-white/45 uppercase font-light">
        Indexed
      </span>
      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono text-white/88 tabular-nums font-medium">{totalCount}</span>
        <span className="text-[8px] font-mono tracking-[0.18em] text-white/40 font-light uppercase">notes</span>
      </div>

      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono text-white/88 tabular-nums font-medium">{streak}</span>
        <span className="text-[8px] font-mono tracking-[0.18em] text-white/40 font-light uppercase">streak</span>
      </div>

      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono text-white/88 tabular-nums font-medium">{visits}</span>
        <span className="text-[8px] font-mono tracking-[0.18em] text-white/40 font-light uppercase">visits</span>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Whisper (bottom row, never overlaps)
----------------------------------------------------------------------------- */
function WhisperPill({ text, rare }: { text: string; rare: boolean }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, delay: 0.55, ease: [0.19, 1, 0.22, 1] }}
      className={[
        "inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.35)]",
        rare ? "border border-amber-500/[0.18] bg-amber-500/[0.04]" : "border border-white/[0.08] bg-black/[0.18]",
      ].join(" ")}
    >
      <Sparkles className={`h-3 w-3 ${rare ? "text-amber-500/70" : "text-white/25"}`} strokeWidth={1.5} />
      <span className={`text-[10px] font-light ${rare ? "text-amber-500/85" : "text-white/55"}`}>
        {text}
      </span>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Empty Velvet Throne (3-row grid: no overlap)
----------------------------------------------------------------------------- */
function ShortsHeroEmptyVelvet({
  streak,
  totalCount,
  visits,
  whisper,
  isRareWhisper,
  onStartReading,
}: {
  streak: number;
  totalCount: number;
  visits: number;
  whisper: string;
  isRareWhisper: boolean;
  onStartReading: () => void;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="relative"
        style={{
          height: "52vh",
          minHeight: 420,
          maxHeight: 600,
        }}
      >
        <VelvetBackdrop />

        <div
          className="relative z-10 h-full mx-auto max-w-7xl px-6"
          style={{
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            paddingTop: 84, // clears header
            paddingBottom: 28,
          }}
        >
          {/* Row 1 */}
          <div className="flex justify-center">
            <EliteStatsRibbon streak={streak} totalCount={totalCount} visits={visits} />
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
                className="mb-10"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/[0.08] bg-black/[0.16] backdrop-blur-2xl">
                  <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-amber-500/75 font-light">
                    Shorts Chamber
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden />
                  <span className="text-[9px] font-mono tracking-[0.22em] uppercase text-white/45 font-light">
                    Notes · Alignment · Signal
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
                className="font-serif font-extralight text-white"
                style={{
                  fontSize: "clamp(3.25rem, 10vw, 7.25rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.028em",
                }}
              >
                Shorts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.26, ease: [0.19, 1, 0.22, 1] }}
                className="mt-8 font-light max-w-2xl mx-auto"
                style={{
                  fontSize: "clamp(1.05rem, 1.85vw, 1.32rem)",
                  lineHeight: 1.68,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                Small doses. Clean alignment.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.6, delay: 0.42, ease: [0.19, 1, 0.22, 1] }}
                className="mt-10"
              >
                <button
                  type="button"
                  onClick={onStartReading}
                  className="group inline-flex items-center gap-3 px-9 py-4 rounded-full border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.16] transition-all duration-700 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                >
                  <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/75 group-hover:text-white transition-colors">
                    Start Reading
                  </span>
                  <ArrowDownRight className="h-4 w-4 text-white/45 group-hover:text-white/65 transition-colors" strokeWidth={1.5} />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.8, delay: 0.62, ease: [0.19, 1, 0.22, 1] }}
                className="mt-10 mx-auto max-w-sm"
                style={{ transformOrigin: "center" }}
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </motion.div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex justify-center">
            <WhisperPill text={whisper} rare={isRareWhisper} />
          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  IMPRINT LINE — aftercare
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
    <div className="border-t border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono tracking-[0.25em] text-white/25 uppercase">Last Read</span>
          <span className="text-[9px] font-mono text-white/18">
            {hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h ago` : "fading"}
          </span>
        </div>
        <p className="font-serif text-lg text-white/45 text-center italic leading-relaxed" style={{ opacity }}>
          "{imprintTitle}"
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  FEATURED NOTES
----------------------------------------------------------------------------- */
type FeaturedItem = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
};

function FeaturedNoteCard({ item }: { item: FeaturedItem }) {
  const href = `/shorts/${item.slug}`;

  return (
    <Link
      href={href}
      className="group block border-l border-white/10 pl-6 py-4 transition-all duration-500 hover:border-amber-500/30 hover:pl-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono tracking-wider uppercase text-amber-300/60">
              {item.category || "Intel"}
            </span>
            <span className="text-white/15">•</span>
            <span className="text-[9px] text-white/30">{item.readTime || "2 min"}</span>
          </div>

          <h3 className="font-serif text-base text-white/85 mb-2 group-hover:text-white transition-colors leading-snug">
            {item.title}
          </h3>

          <p className="text-sm text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/52 transition-colors">
            {item.excerpt}
          </p>
        </div>

        <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-amber-300/75 transition-all shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function FeaturedGrid({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-y border-white/10 bg-black/25">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/35">
            Featured Notes
          </h2>
          <span className="text-[9px] font-mono text-white/18">
            Take one • Leave • Return
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
          {items.slice(0, 6).map((item) => (
            <FeaturedNoteCard key={item._id || item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
const ShortsIndexPage: NextPage<any> = ({ shorts, totalCount }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [streak, setStreak] = React.useState(1);
  const [visitCount, setVisitCount] = React.useState(1);
  const [whisper, setWhisper] = React.useState("");
  const [isRareWhisper, setIsRareWhisper] = React.useState(false);
  const [imprint, setImprint] = React.useState<any>(null);

  const listRef = React.useRef<HTMLDivElement | null>(null);

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

  const q = searchQuery.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    const list = Array.isArray(shorts) ? shorts : [];
    if (!q) return list;
    return list.filter((s: any) => {
      const t = safeString(s?.title).toLowerCase();
      const e = safeString(s?.excerpt).toLowerCase();
      const c = safeString(s?.category).toLowerCase();
      return t.includes(q) || e.includes(q) || c.includes(q);
    });
  }, [shorts, q]);

  const featured: FeaturedItem[] = React.useMemo(() => {
    const list = Array.isArray(filtered) ? filtered : [];
    return list.slice(0, 6).map((s: any) => ({
      _id: safeString(s?._id),
      slug: safeString(s?.slug),
      title: safeString(s?.title) || "Untitled",
      excerpt: safeString(s?.excerpt) || "",
      category: safeString(s?.category || "Intel"),
      readTime: safeString(s?.readTime || "2 min"),
    }));
  }, [filtered]);

  return (
    <Layout
      title="Shorts // Abraham of London"
      className="bg-black min-h-screen text-white selection:bg-amber-500/10"
      fullWidth
      headerTransparent
      canonicalUrl="/shorts"
    >
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      {/* HERO */}
      <ShortsHeroEmptyVelvet
        streak={streak}
        totalCount={totalCount}
        visits={visitCount}
        whisper={whisper}
        isRareWhisper={isRareWhisper}
        onStartReading={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      {/* IMPRINT */}
      <ImprintLine
        imprintTitle={imprint?.title}
        hoursRemaining={imprint?._hoursRemaining}
        fadePercent={imprint?._fadePercent}
      />

      {/* FEATURED */}
      <FeaturedGrid items={featured} />

      {/* FILTER BAR */}
      <div ref={listRef} className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 group-focus-within:text-white/45 transition-colors" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/25 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-all ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/55"
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-all ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/55"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "max-w-3xl mx-auto space-y-6"
            }
          >
            {filtered.map((short: any) => {
              const rawSlug = safeString(short?.slug);
              const cleanSlug = cleanSlugForURL(rawSlug);
              const key = safeString(short?._id) || cleanSlug || safeString(short?.title);

              return (
                <ShortCard
                  key={key}
                  short={{
                    slug: cleanSlug,
                    title: safeString(short?.title) || "Untitled",
                    excerpt: safeString(short?.excerpt) || "",
                    category: safeString(short?.category || "Intel"),
                    readTime: safeString(short?.readTime || "2 min"),
                    views: safeNumber(short?.views || 0),
                    intensity: (short?.intensity || 3) as 1 | 2 | 3 | 4 | 5,
                    lineage: safeString(short?.lineage || "") || null,
                    coverImage: safeString(short?.coverImage || "") || null,

                    // Optional utilities (if your ShortCard supports them)
                    metrics: {
                      likes: safeNumber(short?.likes, 0),
                      saves: safeNumber(short?.saves, 0),
                      views: safeNumber(short?.views, 0),
                    },
                    state: {
                      liked: Boolean(short?.likedByMe),
                      saved: Boolean(short?.savedByMe),
                    },
                  }}
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    writeImprint(cleanSlug, safeString(short?.title) || "Untitled");
                  }}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

/* -----------------------------------------------------------------------------
  DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps = async () => {
  const allDocuments = getAllCombinedDocs() || [];

  const shorts = allDocuments
    .filter((d: any) => safeStartsWith(d?.slug, "shorts/") || safeStartsWith(d?._raw?.flattenedPath, "shorts/"))
    .sort((a: any, b: any) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime())
    .map((s: any) => {
      const rawSlug = safeString(s?.slug || s?._raw?.flattenedPath || "");
      const clean = cleanSlugForURL(normalizeSlug(rawSlug));

      return {
        _id: s?._id || clean,
        slug: clean,
        title: safeString(s?.title) || "Untitled",
        excerpt: safeString(s?.excerpt || s?.description || ""),
        category: safeString(s?.category || "Intel"),
        readTime: safeString(s?.readTime || "2 min"),
        views: Number(s?.views || 0),
        intensity: (s?.intensity || 3) as 1 | 2 | 3 | 4 | 5,
        lineage: safeString(s?.lineage || ""),
        coverImage: safeString(s?.coverImage || ""),

        // Optional fields if they exist in your content
        likes: Number((s as any)?.likes || 0),
        saves: Number((s as any)?.saves || 0),
      };
    });

  return {
    props: { shorts: sanitizeData(shorts), totalCount: shorts.length },
    revalidate: 3600,
  };
};