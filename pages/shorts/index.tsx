// pages/shorts/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Zap,
  Heart,
  Share2,
  Bookmark,
  TrendingUp,
  Filter,
  Search,
  Grid,
  List,
  MessageCircle,
  ChevronRight,
  Award,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublishedShorts } from "@/lib/contentlayer-helper";

type ShortDoc = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
};

type ShortsIndexProps = {
  shorts: ShortDoc[];
};

const STREAK_LAST_SEEN_KEY = "aol_shorts_last_seen";
const STREAK_COUNT_KEY = "aol_shorts_streak";

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIntSafe(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

const themeGradients: Record<string, string> = {
  faith: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  resilience: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  purpose: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  leadership: "from-purple-500/10 to-pink-500/5 border-purple-500/20",
  fatherhood: "from-rose-500/10 to-red-500/5 border-rose-500/20",
  strategy: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
};

const themeIcons: Record<string, string> = {
  faith: "🙏",
  resilience: "💪",
  purpose: "🎯",
  leadership: "👑",
  fatherhood: "👨‍👦",
  strategy: "♟️",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
  hover: {
    y: -4,
    scale: 1.015,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  tap: { scale: 0.985 },
};

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const reduceMotion = useReducedMotion();

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  const [streakDays, setStreakDays] = React.useState<number>(0);
  const [subtitleVisible, setSubtitleVisible] = React.useState(false);
  const subtitle = "For wherever you are today.";

  // Themes list
  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((s) => {
      if (s.theme) allThemes.add(s.theme);
    });
    return ["all", ...Array.from(allThemes)].sort();
  }, [shorts]);

  // Filtering
  const filteredShorts = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shorts.filter((short) => {
      const matchesSearch =
        !searchQuery ||
        short.title.toLowerCase().includes(q) ||
        short.excerpt?.toLowerCase().includes(q) ||
        short.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesTheme = selectedTheme === "all" || short.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  // Subtitle arrives late (1200ms)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (reduceMotion) {
      setSubtitleVisible(true);
      return;
    }

    const t = window.setTimeout(() => setSubtitleVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  // Streak bookkeeping (local, real)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const todayKey = formatISO(new Date());
    const lastKey = window.localStorage.getItem(STREAK_LAST_SEEN_KEY);
    const streak = parseIntSafe(window.localStorage.getItem(STREAK_COUNT_KEY));

    let next = streak ?? 0;

    if (!lastKey) {
      next = 1;
    } else if (lastKey === todayKey) {
      next = Math.max(1, next);
    } else {
      const lastDate = new Date(`${lastKey}T00:00:00`);
      const todayDate = new Date(`${todayKey}T00:00:00`);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
      next = diffDays === 1 ? next + 1 : 1;
    }

    window.localStorage.setItem(STREAK_LAST_SEEN_KEY, todayKey);
    window.localStorage.setItem(STREAK_COUNT_KEY, String(next));
    setStreakDays(Math.max(1, Math.min(3650, next)));
  }, []);

  const handleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShareCard = async (slug: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://www.abrahamoflondon.org";
    const url = `${origin}/shorts/${slug}`;
    const text = `"${title}" — Abraham of London`;

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${title} · Abraham of London`,
          text,
          url,
        });
        return;
      } catch {
        // fall through
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        return;
      }
    } catch {
      // fall through
    }

    if (typeof window !== "undefined") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sharePage = async (platform?: "twitter" | "whatsapp") => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const text = "Shorts — Abraham of London";

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
      return;
    }

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Shorts · Abraham of London", text, url });
        return;
      } catch {
        // ignore
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  };

  const subtitleMotion = reduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(2px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      };

  return (
    <Layout title="Shorts" description="Short reflections for busy minds — faith-rooted clarity without the noise.">
      <Head>
        <title>Shorts · Abraham of London</title>
        <meta
          name="description"
          content="Short reflections for busy minds — faith-rooted clarity without the noise."
        />
        <meta property="og:title" content="Shorts · Abraham of London" />
        <meta
          property="og:description"
          content="Short reflections for busy minds — faith-rooted clarity without the noise."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.abrahamoflondon.org/api/og/shorts" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* HERO: Subliminal magnetism through atmospheric depth */}
        <section className="relative overflow-hidden border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="absolute inset-0" aria-hidden="true">
            {/* Breathing foundation - subtle pulse creates subconscious rhythm */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-blue-500/6"
              animate={{
                opacity: [0.85, 1, 0.85],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: [0.45, 0, 0.55, 1],
              }}
            />

            {/* Atmospheric depth layers - creates sense of "space" */}
            {!reduceMotion ? (
              <>
                {/* Deep ambient glow - warmth without glare */}
                <motion.div
                  className="absolute -top-1/2 -right-1/3 h-[600px] w-[600px] rounded-full blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 35%, transparent 70%)",
                  }}
                  animate={{
                    x: [0, 40, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.08, 1],
                    opacity: [0.3, 0.45, 0.3],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute -bottom-1/2 -left-1/4 h-[500px] w-[500px] rounded-full blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(96,165,250,0.12) 0%, rgba(168,85,247,0.06) 40%, transparent 72%)",
                  }}
                  animate={{
                    x: [0, -35, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.06, 1],
                    opacity: [0.25, 0.4, 0.25],
                  }}
                  transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                />

                {/* Ethereal drift - creates subconscious movement */}
                <motion.div
                  className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-white/4 blur-3xl dark:bg-white/3"
                  animate={{
                    x: [0, 120, 0],
                    y: [0, -40, 0],
                    rotate: [0, 180, 360],
                    opacity: [0.15, 0.25, 0.15],
                  }}
                  transition={{
                    duration: 28,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-amber-300/8 blur-3xl"
                  animate={{
                    x: [0, -100, 0],
                    y: [0, 35, 0],
                    rotate: [360, 180, 0],
                    opacity: [0.12, 0.22, 0.12],
                  }}
                  transition={{
                    duration: 32,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 4,
                  }}
                />

                {/* Shimmer beam - catches eye without being obvious */}
                <motion.div
                  className="absolute left-1/2 top-8 h-32 w-[800px] -translate-x-1/2 rotate-[-8deg] bg-gradient-to-r from-transparent via-white/8 to-transparent blur-xl dark:via-white/6"
                  animate={{
                    opacity: [0, 0.6, 0],
                    x: ["-15%", "15%", "-15%"],
                    scaleX: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Ember particles - warmth markers for the subconscious */}
                {[
                  { left: "15%", bottom: "12%", size: "h-16 w-16", delay: 0, duration: 7.2 },
                  { left: "48%", bottom: "18%", size: "h-14 w-14", delay: 2.4, duration: 8.6 },
                  { left: "78%", bottom: "14%", size: "h-12 w-12", delay: 4.8, duration: 6.8 },
                  { left: "32%", top: "25%", size: "h-10 w-10", delay: 1.6, duration: 9.2 },
                  { right: "22%", top: "30%", size: "h-11 w-11", delay: 3.2, duration: 7.8 },
                ].map((ember, i) => (
                  <motion.div
                    key={i}
                    className={`absolute ${ember.size} rounded-full blur-2xl`}
                    style={{
                      left: ember.left,
                      right: (ember as any).right,
                      top: (ember as any).top,
                      bottom: (ember as any).bottom,
                      background: `radial-gradient(circle, ${
                        i % 2 === 0 ? "rgba(251, 191, 36, 0.18)" : "rgba(249, 115, 22, 0.15)"
                      } 0%, transparent 70%)`,
                    }}
                    animate={{
                      opacity: [0, 0.35, 0],
                      scale: [0.92, 1.12, 0.92],
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: ember.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: ember.duration * 0.6,
                      delay: ember.delay,
                    }}
                  />
                ))}

                {/* Depth field - creates 3D illusion */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/3 to-transparent dark:from-black/8"
                  animate={{ opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/2 to-transparent dark:from-black/12"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            ) : null}

            {/* Perceptual vignette - draws eye to center */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.2)_100%)]" />

            {/* Horizon glow - depth */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-amber-500/5 via-transparent to-transparent dark:from-amber-500/10" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              {/* Badge with subtle pulse */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-2 backdrop-blur-sm"
              >
                <motion.div
                  animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Shorts
                </span>
              </motion.div>

              <h1 className="mb-2 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Shorts
              </h1>

              {/* Subtitle with settling arrival */}
              <AnimatePresence>
                {subtitleVisible ? (
                  <motion.p
                    {...subtitleMotion}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-auto mt-3 max-w-xl text-base text-gray-600 dark:text-gray-300 sm:text-lg"
                  >
                    {subtitle}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              {/* Streak badge with gentle glow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex justify-center"
              >
                <motion.div
                  className="relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/50 px-4 py-2 text-xs text-gray-700 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 0 0 rgba(251, 191, 36, 0)",
                            "0 0 20px 2px rgba(251, 191, 36, 0.10)",
                            "0 0 0 0 rgba(251, 191, 36, 0)",
                          ],
                        }
                  }
                  transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={reduceMotion ? undefined : { rotate: [0, 360] }}
                    transition={reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                  </motion.div>
                  <span className="font-semibold">
                    {streakDays > 0 ? `${streakDays}-day streak` : "Start your streak"}
                  </span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-80">quiet consistency wins</span>
                </motion.div>
              </motion.div>

              {/* CTA with magnetic pull */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 inline-flex flex-col items-center gap-5"
              >
                <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="#shorts-grid"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/40"
                  >
                    {/* Shimmer effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "200%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    <Zap className="relative h-4 w-4" />
                    <span className="relative">Start Reading</span>
                    <motion.div
                      animate={reduceMotion ? undefined : { rotate: [0, 12, -8, 0] }}
                      transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="relative h-4 w-4" />
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.a
                  href="#shorts-grid"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/35 px-4 py-2 text-xs text-gray-600 backdrop-blur-sm hover:bg-white/45 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  whileHover={reduceMotion ? undefined : { y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>Under a minute each</span>
                  <motion.div
                    animate={reduceMotion ? undefined : { x: [0, 3, 0] }}
                    transition={reduceMotion ? undefined : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  </motion.div>
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Controls */}
        <section className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search shorts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-amber-400"
                  aria-label="Search shorts"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    aria-label="Filter by theme"
                  >
                    {themes.map((t) => (
                      <option key={t} value={t}>
                        {t === "all" ? "All Themes" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex rounded-xl border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-amber-500 text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    aria-label="Grid view"
                    type="button"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-amber-500 text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
        </section>

        {/* Shorts Grid */}
        <section id="shorts-grid" className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredShorts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No shorts found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter.</p>
                {(searchQuery || selectedTheme !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTheme("all");
                    }}
                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    type="button"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                      Daily Feed
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {filteredShorts.length} short{filteredShorts.length !== 1 ? "s" : ""} ready
                    </p>
                  </div>
                  {filteredShorts.length < shorts.length && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedTheme("all");
                      }}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      type="button"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}
                  >
                    {filteredShorts.map((short) => {
                      const themeKey = (short.theme || "faith").toLowerCase();
                      const gradient = themeGradients[themeKey] || themeGradients.faith;
                      const icon = themeIcons[themeKey] || "💭";

                      return (
                        <motion.article
                          key={short._id}
                          layout
                          variants={cardVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-5 backdrop-blur-sm transition-all duration-300`}
                        >
                          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
                            <span className="text-sm">{icon}</span>
                            <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                              {short.theme || "Reflection"}
                            </span>
                          </div>

                          <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                            {short.title}
                          </h3>

                          {short.excerpt ? (
                            <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                              {short.excerpt}
                            </p>
                          ) : null}

                          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{short.readTime || "1 min"} read</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/20 pt-4">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="group/like flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400"
                                aria-label="Like"
                              >
                                <Heart className="h-4 w-4 transition-transform group-hover/like:scale-110" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleBookmark(short._id, e)}
                                className={`group/bookmark flex items-center gap-1.5 text-xs transition-colors ${
                                  bookmarks.has(short._id)
                                    ? "text-amber-500"
                                    : "text-gray-500 hover:text-amber-500 dark:text-gray-400"
                                }`}
                                aria-label="Bookmark"
                              >
                                <Bookmark className="h-4 w-4 transition-transform group-hover/bookmark:scale-110" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleShareCard(short.slug, short.title, e)}
                                className="group/share flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400"
                                aria-label="Share"
                              >
                                <Share2 className="h-4 w-4 transition-transform group-hover/share:scale-110" />
                              </button>
                            </div>

                            <Link
                              href={`/shorts/${short.slug}`}
                              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                            >
                              Read
                              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Habit section */}
            {filteredShorts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mt-16 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-8"
              >
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-400">
                        Daily Habit
                      </span>
                    </div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">Keep it simple</h3>
                    <p className="text-gray-300">One short a day. Quiet consistency beats motivational bursts.</p>
                    <p className="mt-3 text-sm text-gray-400">
                      Current streak: <span className="font-semibold text-amber-300">{streakDays} day</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a
                      href="#shorts-grid"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25"
                    >
                      Start Daily Reading
                    </a>

                    <button
                      onClick={() => sharePage()}
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Share This Page
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* Share section */}
            {filteredShorts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0.01 } : { delay: 0.35, duration: 0.6 }}
                className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                    <Share2 className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
                      Pass it on
                    </span>
                  </div>

                  <h4 className="mb-3 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                    When something helps, it should travel.
                  </h4>
                  <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
                    Share the page. Let someone else find their footing.
                  </p>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => sharePage("twitter")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      type="button"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => sharePage("whatsapp")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      type="button"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Share on WhatsApp
                    </button>
                    <button
                      onClick={() => sharePage()}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm font-medium text-amber-600 transition-all hover:scale-105 hover:bg-amber-500/10 dark:text-amber-400"
                      type="button"
                    >
                      Share Anywhere
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>
    </Layout>
  );
};

// ✅ IMPORTANT: /shorts uses getStaticProps ONLY — no getStaticPaths here.
export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const shorts = getPublishedShorts();
  return { props: { shorts }, revalidate: 3600 };
};

export default ShortsIndexPage;