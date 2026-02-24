/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (Premium, airy, transparent hero. Index-only.)

import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Grid, List, ArrowDownRight, Sparkles } from "lucide-react";

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

/* -----------------------------------------------------------------------------
  HERO BACKDROP — quiet luxury (index only)
----------------------------------------------------------------------------- */
const ChamberBackdrop = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Base blacks */}
    <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />

    {/* Subtle geometry */}
    <div className="absolute inset-0 aol-grid opacity-[0.14]" />

    {/* Light pools (subtle) */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(245,158,11,0.10)_0%,transparent_55%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.04)_0%,transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(245,158,11,0.06)_0%,transparent_60%)]" />

    {/* Chamber vignette + grain */}
    <div className="absolute inset-0 aol-vignette" />
    <div className="absolute inset-0 aol-grain opacity-[0.07] mix-blend-soft-light" />

    {/* Signature hairline */}
    <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-gradient-to-b from-amber-500/10 via-white/5 to-transparent" />

    {/* Slow “breathing” glow */}
    <div className="absolute -top-24 left-10 h-72 w-72 rounded-full blur-[120px] bg-amber-500/10 aol-breath" />
    <div className="absolute -bottom-28 right-10 h-96 w-96 rounded-full blur-[150px] bg-white/5 aol-breath" />
  </div>
);

/* -----------------------------------------------------------------------------
  MICRO UI — chips (not panels)
----------------------------------------------------------------------------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-2xl backdrop-fix">
      {children}
    </span>
  );
}

function WhisperChip({ text, rare }: { text: string; rare: boolean }) {
  if (!text) return null;
  return (
    <Chip>
      <Sparkles className={`h-3.5 w-3.5 ${rare ? "text-amber-500/55" : "text-white/22"}`} />
      <span className={["aol-micro", rare ? "text-amber-500/45" : "text-white/28"].join(" ")}>{text}</span>
      <span className="h-1 w-1 rounded-full bg-white/15" />
      <span className="aol-micro text-white/14">protocol</span>
    </Chip>
  );
}

function MetricsChip({ streak, totalCount, visits }: { streak: number; totalCount: number; visits: number }) {
  return (
    <Chip>
      <span className="aol-micro text-white/18">return</span>
      <span className="aol-micro text-white/40">{streak}</span>
      <span className="h-1 w-1 rounded-full bg-white/12" />
      <span className="aol-micro text-white/18">notes</span>
      <span className="aol-micro text-white/40">{totalCount}</span>
      <span className="h-1 w-1 rounded-full bg-white/12" />
      <span className="aol-micro text-white/18">visit</span>
      <span className="aol-micro text-white/40">{visits}</span>
    </Chip>
  );
}

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

  const opacity = Math.max(0.18, 1 - (fadePercent || 0) / 115);

  return (
    <div className="mt-6 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/20 px-5 py-4 backdrop-blur-2xl backdrop-fix">
        <div className="flex items-center justify-between gap-6">
          <div className="aol-micro text-white/16">{SHORTS_BRAND.imprintName}</div>
          <div className="aol-micro text-white/12">{hoursRemaining && hoursRemaining > 0 ? `${hoursRemaining}h` : "fading"}</div>
        </div>
        <div className="mt-2 aol-editorial text-white/34 text-lg md:text-xl text-center" style={{ opacity }}>
          “{imprintTitle}”
        </div>
      </div>
    </div>
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

  return (
    <Layout
      title="Shorts // Abraham of London"
      className="bg-black min-h-screen text-white/90 selection:bg-amber-500/20"
      fullWidth
      headerTransparent
      canonicalUrl="/shorts"
    >
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      {/* HERO — airy, transparent, index-only */}
      <section className="relative overflow-hidden border-b border-white/[0.06] -mt-[80px] pt-[80px]">
        <div className="relative w-full" style={{ height: "86vh", minHeight: 720 }}>
          <ChamberBackdrop />

          <div className="absolute inset-0 z-[2]">
            <div className="mx-auto max-w-[1100px] px-6 md:px-10 h-full">
              <div className="h-full flex flex-col justify-center">
                {/* Top micro row */}
                <div className="flex items-center justify-between gap-4">
                  <WhisperChip text={whisper} rare={isRareWhisper} />
                  <div className="hidden md:flex">
                    <MetricsChip streak={streak} totalCount={totalCount} visits={visitCount} />
                  </div>
                </div>

                {/* Center stack (breathable) */}
                <div className="mt-10 md:mt-14 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                    className="inline-flex items-center justify-center"
                  >
                    <span className="inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-5 py-2 backdrop-blur-2xl">
                      <Sparkles className="h-4 w-4 text-amber-500/70" />
                      <span className="aol-micro text-amber-500/70 tracking-[0.42em] uppercase">
                        {SHORTS_BRAND.eyebrow}
                      </span>
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mt-8 font-serif tracking-tight text-white/90"
                    style={{ fontSize: "clamp(3.1rem, 6.4vw, 5.4rem)", lineHeight: 0.98 }}
                  >
                    Shorts
                    <span className="text-amber-500/25">.</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mt-5 text-white/45 font-light"
                    style={{ fontSize: "clamp(1.05rem, 1.4vw, 1.35rem)", lineHeight: 1.7 }}
                  >
                    {SHORTS_BRAND.heroLine}
                  </motion.p>

                  {/* Keep your existing meaning, but set it in a more editorial rhythm */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.0, delay: 0.18 }}
                    className="mt-7 text-white/35 max-w-2xl mx-auto font-light"
                    style={{ fontSize: "clamp(0.98rem, 1.25vw, 1.18rem)", lineHeight: 1.85 }}
                  >
                    For when your brain is fried, your feed is empty, and you still want to{" "}
                    <span className="text-amber-500/70 font-normal">think meaningfully</span>. No fluff — just fuel.
                  </motion.p>

                  {/* Mobile metrics (quiet) */}
                  <div className="mt-10 flex justify-center md:hidden">
                    <MetricsChip streak={streak} totalCount={totalCount} visits={visitCount} />
                  </div>

                  {/* CTA */}
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className={[
                        "group inline-flex items-center justify-center gap-3",
                        "rounded-full px-7 py-3.5",
                        "bg-amber-500/15 border border-amber-500/25",
                        "text-amber-500/90 hover:text-amber-500",
                        "hover:bg-amber-500/18 transition-all",
                        "shadow-[0_18px_60px_-40px_rgba(245,158,11,0.55)]",
                      ].join(" ")}
                    >
                      <span className="aol-micro tracking-[0.35em] uppercase">Start Reading</span>
                      <ArrowDownRight className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div className="hidden sm:flex items-center gap-3 text-white/20">
                      <span className="h-px w-10 bg-white/10" />
                      <span className="aol-micro">{SHORTS_BRAND.signature}</span>
                      <span className="h-px w-10 bg-white/10" />
                    </div>
                  </div>

                  {/* Hairline */}
                  <div className="mt-12 flex justify-center">
                    <div className="w-[240px] aol-hairline" />
                  </div>

                  {/* Imprint (quiet, centered) */}
                  <ImprintLine
                    imprintTitle={imprint?.title}
                    hoursRemaining={imprint?._hoursRemaining}
                    fadePercent={imprint?._fadePercent}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-black" />
        </div>

        {/* NAV (sticky) */}
        <nav className="sticky top-0 z-50 bg-black/65 backdrop-blur-2xl backdrop-fix border-t border-white/[0.06] border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-4 flex items-center justify-between gap-6">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter by keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none py-2 pl-8 pr-4 text-sm font-light focus:ring-0 placeholder:text-white/10 text-white"
              />
            </div>

            <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-amber-500/10 text-amber-500" : "text-white/20 hover:text-white/45"
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-amber-500/10 text-amber-500" : "text-white/20 hover:text-white/45"
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>
      </section>

      {/* CONTENT */}
      <div ref={listRef} />
      <main className="mx-auto max-w-[1600px] px-6 md:px-10 py-18 md:py-20">
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
                    excerpt: safeString(short?.excerpt) || "A short note from the archive.",
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