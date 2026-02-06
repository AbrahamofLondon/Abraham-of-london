/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — WELLNESS-CENTRE (Cathedral Hero + Aftercare Imprint + Return Loop)

import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Clock, Search, Grid, List } from "lucide-react";

import Layout from "@/components/Layout";
import { getAllCombinedDocs, normalizeSlug, sanitizeData } from "@/lib/content/server";

/* -----------------------------------------------------------------------------
  UTILITIES
----------------------------------------------------------------------------- */
function safeStartsWith(v: unknown, prefix: string) {
  return typeof v === "string" && v.startsWith(prefix);
}

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

// Helper to clean slugs for URLs (removes duplicates and ensures proper format)
function cleanSlugForURL(slug: string): string {
  if (!slug) return "";
  return slug
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/^shorts\//i, '') // Remove 'shorts/' prefix
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .trim();
}

/* -----------------------------------------------------------------------------
  WHISPERS & TIME-BASED MESSAGING
----------------------------------------------------------------------------- */
const WHISPERS = [
  "Stay. Something is settling.",
  "You don't need all of it today.",
  "Most people rush past this part.",
  "This works better when revisited.",
  "Clarity accumulates quietly.",
  "Take one. Leave. Return.",
  "This is not content. It's conditioning.",
  "Your nervous system recognises this.",
  "A single dose is enough.",
  "The work happens after you close this tab.",
  "Come back when you're ready, not when you're desperate.",
  "The silence between visits is also part of the protocol.",
];

type TimeBucket = "morning" | "afternoon" | "evening" | "night";

const TIME_WHISPERS: Record<TimeBucket, string[]> = {
  morning: ["Start clean. Don't negotiate with fog.", "One note. Then order your day.", "Quiet first. Noise later."],
  afternoon: ["If you feel thin, return for oxygen.", "Re-centre. Then execute.", "You're not behind. You're recalibrating."],
  evening: ["Close the loop. Let today end well.", "Review the day without self-hate.", "Repair before rest."],
  night: ["Don't spiral. Come back to baseline.", "The mind lies at night. Breathe and simplify.", "Sleep is strategy. So is letting go."],
};

const RARE_LINES = [
  "Today you don't have to be strong. Only honest.",
  "You have permission to begin again — properly.",
  "God is not rushed. Neither are you.",
  "This is a hinge-day. Do the next right thing.",
];

function getTimeBucket(d: Date): TimeBucket {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function computeWhisper(opts: { seed: number; visitCount: number; now: Date }): { text: string; isRare: boolean } {
  const { seed, visitCount, now } = opts;

  const rareDay = (seed % 365) + 1;
  const today = dayOfYear(now);
  const isRare = today === rareDay;

  if (isRare) {
    const bucket = getTimeBucket(now);
    const base = pick(RARE_LINES, seed + today);
    const timeNudge = pick(TIME_WHISPERS[bucket], seed + today + 77);
    return { text: seed % 2 === 0 ? base : timeNudge, isRare: true };
  }

  // rotate only after 3 visits (3,6,9…)
  const rotationIndex = Math.floor(Math.max(1, visitCount) / 3);
  const base = pick(WHISPERS, seed + rotationIndex);

  const bucket = getTimeBucket(now);
  const timeLine = pick(TIME_WHISPERS[bucket], seed + rotationIndex + 13);

  const chooseTime = (seed + rotationIndex) % 4 === 0; // ~25%
  return { text: chooseTime ? timeLine : base, isRare: false };
}

/* -----------------------------------------------------------------------------
  INVISIBLE HEAVY LIFT — for the "empty beautiful space"
----------------------------------------------------------------------------- */
const CathedralBackdrop = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* empty-space emphasis: big soft gradients far away from the word */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(212,175,55,0.10)_0%,transparent_55%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.035)_0%,transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.05)_0%,transparent_55%)]" />

    {/* faint "architect grid" */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
        backgroundSize: "120px 120px",
      }}
    />

    {/* film-grain banding (barely there) */}
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
      style={{
        backgroundImage: "linear-gradient(transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
        backgroundSize: "100% 6px",
      }}
    />

    {/* "pillar" — draws the eye without being seen */}
    <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[1px] bg-gradient-to-b from-gold/20 via-white/5 to-transparent" />
  </div>
);

/* -----------------------------------------------------------------------------
  AFTERCARE IMPRINT (fades over 72 hours unless they return)
----------------------------------------------------------------------------- */
type Imprint = { 
  slug: string; 
  title: string; 
  ts: number;
  expiresAt: number; // 72 hours from creation
};

const IMPRINT_KEY = "aol_shorts_imprint_last";
const VISITS_KEY = "aol_shorts_visits";
const LAST_SEEN_KEY = "aol_shorts_last_seen_session";
const SEED_KEY = "aol_shorts_whisper_seed";
const STREAK_KEY = "aol_shorts_streak";
const LAST_VISIT_KEY = "aol_shorts_last_timestamp";

function createImprint(slug: string, title: string): Imprint {
  const now = Date.now();
  const HOURS_72 = 72 * 60 * 60 * 1000;
  return {
    slug,
    title,
    ts: now,
    expiresAt: now + HOURS_72 // Expires in 72 hours
  };
}

function readImprint(): Imprint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMPRINT_KEY);
    if (!raw) return null;
    
    const imprint = JSON.parse(raw) as Imprint;
    const now = Date.now();
    
    // Check if imprint exists and hasn't expired
    if (imprint && typeof imprint.slug === "string" && 
        typeof imprint.title === "string" && 
        typeof imprint.expiresAt === "number" &&
        now < imprint.expiresAt) {
      
      // Calculate fade percentage (0-100% faded)
      const totalTime = 72 * 60 * 60 * 1000; // 72 hours in ms
      const elapsed = now - imprint.ts;
      const fadePercent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
      
      return {
        ...imprint,
        // Add fade metadata for UI
        ...(imprint as any),
        _fadePercent: fadePercent,
        _hoursRemaining: Math.max(0, Math.floor((imprint.expiresAt - now) / (60 * 60 * 1000)))
      };
    }
    
    // Imprint expired, remove it
    localStorage.removeItem(IMPRINT_KEY);
    return null;
    
  } catch {
    return null;
  }
}

function writeImprint(slug: string, title: string) {
  try {
    const cleanSlug = cleanSlugForURL(slug);
    const imprint = createImprint(cleanSlug, title);
    localStorage.setItem(IMPRINT_KEY, JSON.stringify(imprint));
  } catch {
    // ignore
  }
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const ShortsIndexPage: NextPage<any> = ({ shorts, totalCount }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [streak, setStreak] = React.useState(1);
  const [visitCount, setVisitCount] = React.useState(1);
  const [whisper, setWhisper] = React.useState("");
  const [isRareWhisper, setIsRareWhisper] = React.useState(false);
  const [imprint, setImprint] = React.useState<Imprint | null>(null);

  // Streak tracking (quiet)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || "0");
    const currentStreak = Number(localStorage.getItem(STREAK_KEY) || "1");
    const msInDay = 86_400_000;

    const sameDay =
      lastVisit > 0 &&
      new Date(lastVisit).getFullYear() === new Date(now).getFullYear() &&
      new Date(lastVisit).getMonth() === new Date(now).getMonth() &&
      new Date(lastVisit).getDate() === new Date(now).getDate();

    if (sameDay) {
      setStreak(Math.max(1, currentStreak));
      return;
    }

    const within48h = lastVisit > 0 && now - lastVisit < msInDay * 2;
    if (within48h) {
      const next = Math.max(1, currentStreak) + 1;
      localStorage.setItem(STREAK_KEY, String(next));
      localStorage.setItem(LAST_VISIT_KEY, String(now));
      setStreak(next);
      return;
    }

    localStorage.setItem(STREAK_KEY, "1");
    localStorage.setItem(LAST_VISIT_KEY, String(now));
    setStreak(1);
  }, []);

  // Visit counting (session-aware)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || "0");
    const NEW_VISIT_WINDOW = 45 * 60 * 1000;

    let visits = Number(localStorage.getItem(VISITS_KEY) || "1");
    if (!Number.isFinite(visits) || visits < 1) visits = 1;

    const isNewVisit = !lastSeen || now - lastSeen > NEW_VISIT_WINDOW;
    if (isNewVisit) {
      visits += 1;
      localStorage.setItem(VISITS_KEY, String(visits));
    }
    localStorage.setItem(LAST_SEEN_KEY, String(now));
    setVisitCount(visits);
  }, []);

  // Whisper engine
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let seed = Number(localStorage.getItem(SEED_KEY));
    if (!Number.isFinite(seed)) {
      seed = Math.floor(Math.random() * 10_000);
      localStorage.setItem(SEED_KEY, String(seed));
    }

    const now = new Date();
    const out = computeWhisper({ seed, visitCount, now });
    setWhisper(out.text);
    setIsRareWhisper(out.isRare);
  }, [visitCount]);

  // Aftercare imprint with 72-hour fade
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const currentImprint = readImprint();
    setImprint(currentImprint);
    
    // Update fade every minute
    const interval = setInterval(() => {
      const updatedImprint = readImprint();
      if (!updatedImprint || (imprint && updatedImprint.ts !== imprint.ts)) {
        setImprint(updatedImprint);
      }
    }, 60_000); // Check every minute
    
    return () => clearInterval(interval);
  }, [imprint?.ts]); // Re-run when imprint timestamp changes

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
    <Layout title="Shorts // Abraham of London" className="bg-black min-h-screen text-white/90 selection:bg-gold/30">
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      {/* HERO — bold, lean, empty space */}
      <section className="relative pt-44 pb-20 overflow-hidden border-b border-white/[0.05]">
        <CathedralBackdrop />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          {/* keep this tiny. no badges. no noise. */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center mb-10"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.65em] text-white/18">
              Restoration Stream
            </span>
          </motion.div>

          {/* The only conscious focal point */}
          <h1 className="font-serif italic tracking-[-0.05em] text-white leading-[0.78] select-none">
            <span className="block text-[18vw] md:text-[10.5rem] lg:text-[12.5rem]">SHORTS</span>
            <span className="block text-gold/18 text-[10vw] md:text-[5.0rem] lg:text-[6rem] -mt-6 md:-mt-10">
              .
            </span>
          </h1>

          {/* One line only. nothing else. */}
          <p className="mt-10 font-sans font-light text-base md:text-lg text-white/35 max-w-2xl mx-auto leading-relaxed">
            Small doses. High potency. Built for the disciplined mind — and the tired soul.
          </p>

          {/* Invisible "heavy lifting" — whisper + echo live here, faint */}
          <div className="mt-12 space-y-6">
            {whisper && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.10, 0.32, 0.10] }}
                transition={{ duration: 7, ease: "easeInOut" }}
                className={`font-mono text-[10px] uppercase tracking-[0.45em] ${
                  isRareWhisper ? "text-gold/32" : "text-white/18"
                }`}
                title={isRareWhisper ? "A rare line." : undefined}
              >
                {whisper}
              </motion.div>
            )}

            {/* Aftercare Echo — "you were here for this" with 72-hour fade */}
            {imprint?.title && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: imprint._fadePercent > 80 ? [0.02, 0.08, 0.02] : [0.06, 0.18, 0.06] }}
                transition={{ duration: 9, ease: "easeInOut" }}
                className="mx-auto max-w-3xl"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.55em] text-white/12">
                  You left with this {imprint._hoursRemaining > 0 ? `• ${imprint._hoursRemaining}h left` : "• fading"}
                </div>
                <Link
                  href={`/shorts/${imprint.slug}`}
                  className="mt-3 block font-serif italic text-xl md:text-2xl text-white/22 hover:text-white/40 transition-colors"
                  style={{
                    opacity: Math.max(0.1, 1 - (imprint._fadePercent || 0) / 100)
                  }}
                >
                  "{imprint.title}"
                </Link>
              </motion.div>
            )}

            {/* Micro metrics kept but nearly invisible */}
            <div className="flex justify-center gap-10 text-[9px] font-mono uppercase tracking-[0.45em] text-white/10">
              <span>{streak} Day Return</span>
              <span>{totalCount} Notes Kept</span>
              <span>Visit_{visitCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* NAV — functional, clean */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-6">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-gold transition-colors" />
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
                viewMode === "grid" ? "bg-gold/10 text-gold" : "text-white/20 hover:text-white/45"
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === "list" ? "bg-gold/10 text-gold" : "text-white/20 hover:text-white/45"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-6 py-24">
        {/* Protocol band stays, but quieter */}
        <div className="mx-auto max-w-3xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-3xl border border-white/[0.06] bg-white/[0.015] px-6 py-5"
          >
            <div className="text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.55em] text-white/18">
                Wellness Centre Protocol
              </div>
              <div className="mt-2 text-white/45 font-light leading-relaxed">
                Don't binge. Take one. Sit with it. Leave. Come back when you need oxygen.
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" // Compact spacing
                : "max-w-3xl mx-auto space-y-6" // Compact spacing
            }
          >
            {filtered.map((short: any) => {
              const rawSlug = safeString(short?.slug);
              const cleanSlug = cleanSlugForURL(rawSlug);
              const href = `/shorts/${cleanSlug}`;
              const key = safeString(short?._id) || cleanSlug || safeString(short?.title);

              return (
                <Link
                  key={key}
                  href={href}
                  className="group block"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const title = safeString(short?.title) || "Untitled";
                    writeImprint(cleanSlug, title);
                  }}
                >
                  <article className="h-full flex flex-col p-8 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-gold/20 transition-all duration-500">
                    <div className="flex justify-between items-center mb-12">
                      <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/20 group-hover:text-gold/55 transition-colors">
                        Entry_{safeString(short?.category || "Insight")}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-white/5 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl text-white/80 mb-6 leading-[1.08] transition-colors group-hover:text-white italic">
                      {safeString(short?.title) || "Untitled"}
                    </h2>

                    <p className="font-sans font-light text-white/40 text-base leading-relaxed line-clamp-3 mb-8">
                      {safeString(short?.excerpt) || "A short note from the archive."}
                    </p>

                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/[0.04]">
                      <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 uppercase tracking-[0.3em]">
                        <Clock className="h-3.5 w-3.5" /> {safeString(short?.readTime) || "2 min"}
                      </div>

                      <motion.div
                        aria-hidden
                        animate={{ opacity: [0.2, 0.85, 0.2] }}
                        transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
                        className="h-1.5 w-1.5 rounded-full bg-gold/25 group-hover:bg-gold/70 transition-colors"
                      />
                    </div>
                  </article>
                </Link>
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
  BUILD-SAFE DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps = async () => {
  const allDocuments = getAllCombinedDocs() || [];

  const shorts = allDocuments
    .filter((d: any) => safeStartsWith(d?.slug, "shorts/") || safeStartsWith(d?._raw?.flattenedPath, "shorts/"))
    .sort((a: any, b: any) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime())
    .map((s: any) => {
      const rawSlug = safeString(s?.slug || s?._raw?.flattenedPath || "");
      // Clean the slug properly to prevent duplicate slashes
      const clean = cleanSlugForURL(normalizeSlug(rawSlug));

      return {
        _id: s?._id || clean,
        slug: clean, // Clean slug without 'shorts/' prefix or duplicate slashes
        title: safeString(s?.title) || "Untitled",
        excerpt: safeString(s?.excerpt || s?.description || ""),
        category: safeString(s?.category || "Intel"),
        readTime: safeString(s?.readTime || "2 min"),
      };
    });

  return {
    props: { shorts: sanitizeData(shorts), totalCount: shorts.length },
    revalidate: 3600,
  };
};