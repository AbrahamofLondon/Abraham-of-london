/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (HARRODS × SILENT CINEMA)
// Hero = magnetic silence. Subliminal elements do the work. No shouting.

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
  SHORTS_BRAND,
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

/* -----------------------------------------------------------------------------
  BACKDROP — SUBLIMINAL MAGNETISM (particles, light, depth)
----------------------------------------------------------------------------- */
const ChamberBackdrop = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Deep black foundation */}
    <div className="absolute inset-0 bg-black" />

    {/* Subtle radial light pools (asymmetric, natural) */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_15%,rgba(245,158,11,0.06)_0%,transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_35%,rgba(255,255,255,0.03)_0%,transparent_45%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_85%,rgba(245,158,11,0.04)_0%,transparent_55%)]" />

    {/* Floating particles (CSS animation, no JS) */}
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-white/5 rounded-full"
          style={{
            left: `${15 + i * 7}%`,
            top: `${20 + (i % 3) * 25}%`,
            width: `${2 + (i % 4)}px`,
            animation: `float-particle ${8 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>

    {/* Vertical light beams (subtle, architectural) */}
    <div className="absolute left-[15%] top-0 w-px h-full bg-gradient-to-b from-transparent via-amber-500/8 to-transparent" />
    <div className="absolute left-[50%] top-0 w-px h-full bg-gradient-to-b from-transparent via-white/4 to-transparent" />
    <div className="absolute left-[85%] top-0 w-px h-full bg-gradient-to-b from-transparent via-amber-500/6 to-transparent" />

    {/* Breathing ambient glow (slow, hypnotic) */}
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[200px] bg-amber-500/8"
      style={{ animation: 'breathe 12s ease-in-out infinite' }}
    />

    {/* Film grain texture (adds depth, prevents flatness) */}
    <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

    {/* Edge vignette (draws eye to center) */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_85%,rgba(0,0,0,0.8)_100%)]" />
  </div>
);

/* -----------------------------------------------------------------------------
  MAGNETIC STATS BAR — floats above hero, pulses with life
----------------------------------------------------------------------------- */
function MagneticStats({ 
  streak, 
  totalCount, 
  visits 
}: { 
  streak: number; 
  totalCount: number; 
  visits: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
    >
      <div className="flex items-center gap-1 px-4 py-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-xl">
        {/* Pulse indicator */}
        <div className="relative flex items-center justify-center w-2 h-2 mr-2">
          <div className="absolute w-2 h-2 bg-amber-500/60 rounded-full animate-ping" />
          <div className="relative w-1.5 h-1.5 bg-amber-500 rounded-full" />
        </div>

        <span className="text-[9px] font-mono tracking-[0.2em] text-white/25 uppercase">Live</span>
        <span className="mx-2 text-white/10">•</span>
        <span className="text-[9px] font-mono text-white/40">{totalCount}</span>
        <span className="text-[9px] font-mono tracking-wider text-white/20">notes</span>
        <span className="mx-2 text-white/10">•</span>
        <span className="text-[9px] font-mono text-white/40">{streak}</span>
        <span className="text-[9px] font-mono tracking-wider text-white/20">streak</span>
        <span className="mx-2 text-white/10">•</span>
        <span className="text-[9px] font-mono text-white/40">{visits}</span>
        <span className="text-[9px] font-mono tracking-wider text-white/20">visits</span>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  WHISPER ELEMENT — rare, sacred, appears only when earned
----------------------------------------------------------------------------- */
function WhisperElement({ text, rare }: { text: string; rare: boolean }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
    >
      <div className={`
        px-5 py-2.5 rounded-full 
        border backdrop-blur-xl
        ${rare 
          ? 'border-amber-500/30 bg-amber-500/5' 
          : 'border-white/8 bg-black/30'
        }
      `}>
        <div className="flex items-center gap-2.5">
          <Sparkles className={`h-3 w-3 ${rare ? 'text-amber-500/70' : 'text-white/20'}`} />
          <span className={`text-[10px] font-light tracking-wide ${rare ? 'text-amber-500/80' : 'text-white/35'}`}>
            {text}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  IMPRINT LINE — aftercare (quiet, below hero)
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
    <div className="border-t border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono tracking-[0.25em] text-white/20 uppercase">Last Read</span>
          <span className="text-[9px] font-mono text-white/15">
            {hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h ago` : 'fading'}
          </span>
        </div>
        <p 
          className="font-serif text-lg text-white/40 text-center italic leading-relaxed"
          style={{ opacity }}
        >
          "{imprintTitle}"
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  FEATURED NOTES — elegant grid below hero
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
      className="group block border-l border-white/5 pl-6 py-4 transition-all duration-500 hover:border-amber-500/30 hover:pl-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono tracking-wider uppercase text-amber-500/50">
              {item.category || "Intel"}
            </span>
            <span className="text-white/10">•</span>
            <span className="text-[9px] text-white/25">{item.readTime || "2 min"}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-base text-white/80 mb-2 group-hover:text-white transition-colors leading-snug">
            {item.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-white/35 leading-relaxed line-clamp-2 group-hover:text-white/45 transition-colors">
            {item.excerpt}
          </p>
        </div>

        <ArrowUpRight className="h-4 w-4 text-white/15 group-hover:text-amber-500/60 transition-all shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function FeaturedGrid({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-y border-white/5 bg-black/20">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/30">
            Featured Notes
          </h2>
          <span className="text-[9px] font-mono text-white/15">
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
  HERO — STUNNING SILENCE (subliminal magnetism)
----------------------------------------------------------------------------- */
function StunningHero({
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
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="relative" style={{ height: '85vh', minHeight: 600, maxHeight: 900 }}>
        <ChamberBackdrop />

        {/* Floating stats */}
        <MagneticStats streak={streak} totalCount={totalCount} visits={visits} />

        {/* Main content */}
        <div className="relative h-full flex items-center justify-center z-[2]">
          <div className="mx-auto max-w-4xl px-6 text-center">
            
            {/* Title — massive, elegant */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif font-light text-white tracking-tight"
              style={{ 
                fontSize: 'clamp(4rem, 12vw, 9rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.02em'
              }}
            >
              Shorts
            </motion.h1>

            {/* Subtitle — whisper thin */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 font-light text-white/35 tracking-wide"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)' }}
            >
              Small doses. Clean alignment.
            </motion.p>

            {/* Action — minimal, magnetic */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <button
                type="button"
                onClick={onStartReading}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 backdrop-blur-xl"
              >
                <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-white/60 group-hover:text-white/80 transition-colors">
                  Start Reading
                </span>
                <ArrowDownRight className="h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors" />
              </button>
            </motion.div>

          </div>
        </div>

        {/* Whisper (bottom, sacred) */}
        <WhisperElement text={whisper} rare={isRareWhisper} />

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent" />
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

      {/* HERO — Stunning, subliminal */}
      <StunningHero
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

      {/* FEATURED GRID */}
      <FeaturedGrid items={featured} />

      {/* FILTER BAR (sticky) */}
      <div ref={listRef} className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/40 transition-colors" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/25 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-all ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-white/25 hover:text-white/40"
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-all ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-white/25 hover:text-white/40"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
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
                    views: Number(short?.views || 0),
                    intensity: (short?.intensity || 3) as 1 | 2 | 3 | 4 | 5,
                    lineage: safeString(short?.lineage || "") || null,
                    coverImage: safeString(short?.coverImage || "") || null,
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

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
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
      };
    });

  return {
    props: { shorts: sanitizeData(shorts), totalCount: shorts.length },
    revalidate: 3600,
  };
};
