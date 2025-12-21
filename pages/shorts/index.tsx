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
  Flame,
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

const STREAK_LAST_READ_KEY = "aol_shorts_last_read";
const STREAK_COUNT_KEY = "aol_shorts_streak";

// Optional: if you want to track “read” only when opening a short, you can also set this key in [slug].tsx
// with slug + date. For now, we keep streak based on “visiting shorts page daily”.
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

  // REAL streak (local only): “accountability + encouragement”
  const [streakDays, setStreakDays] = React.useState<number>(0);
  const [subtitleVisible, setSubtitleVisible] = React.useState(false);

  // Your chosen line
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

  // Streak + subtitle arrival
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // subtitle arrives late, calm curve
    if (reduceMotion) {
      setSubtitleVisible(true);
    } else {
      const t = window.setTimeout(() => setSubtitleVisible(true), 1200);
      // cleanup
      // eslint-disable-next-line consistent-return
      return () => window.clearTimeout(t);
    }
  }, [reduceMotion]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const todayKey = formatISO(new Date());
    const lastKey = window.localStorage.getItem(STREAK_LAST_READ_KEY);
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

    window.localStorage.setItem(STREAK_LAST_READ_KEY, todayKey);
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
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/shorts/${slug}`
        : `${"https://www.abrahamoflondon.org"}/shorts/${slug}`;
    const text = `"${title}" — Abraham of London`;

    // Native share first
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

    // Clipboard fallback
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        return;
      }
    } catch {
      // fall through
    }

    // Final fallback: twitter intent
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

  // Motion settings for subtitle: calm “settling” curve
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
        {/* HERO: “heavenly home” — slow warmth, not flashy theatre */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
          <div className="absolute inset-0" aria-hidden="true">
            {/* Base wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/7 via-transparent to-purple-500/7" />
            <div className="absolute -top-44 -right-44 h-[28rem] w-[28rem] rounded-full bg-amber-500/12 blur-3xl" />
            <div className="absolute -bottom-44 -left-44 h-[28rem] w-[28rem] rounded-full bg-blue-500/12 blur-3xl" />

            {/* Smoke drift (slow, quiet) */}
            {!reduceMotion ? (
              <>
                <motion.div
                  className="absolute -left-1/4 top-1/3 h-80 w-80 rounded-full bg-white/7 blur-3xl dark:bg-white/6"
                  animate={{ x: [0, 110, 0], y: [0, -28, 0], opacity: [0.16, 0.26, 0.16] }}
                  transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  className="absolute -right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"
                  animate={{ x: [0, -105, 0], y: [0, 26, 0], opacity: [0.13, 0.23, 0.13] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  className="absolute left-1/2 top-10 h-28 w-[720px] -translate-x-1/2 rotate-[-9deg] bg-gradient-to-r from-transparent via-white/12 to-transparent blur-md dark:via-white/10"
                  animate={{ opacity: [0, 0.55, 0], x: ["-12%", "12%", "-12%"] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  style={{ willChange: "transform, opacity" }}
                />
              </>
            ) : null}

            {/* Microflames: intermittent warmth, low drama */}
            {!reduceMotion ? (
              <>
                <motion.div
                  className="absolute bottom-10 left-[18%] h-14 w-14 rounded-full bg-amber-500/20 blur-2xl"
                  animate={{ opacity: [0, 0.22, 0], scale: [0.95, 1.08, 0.95] }}
                  transition={{ duration: 6.0, repeat: Infinity, ease: "easeInOut", repeatDelay: 3.4 }}
                />
                <motion.div
                  className="absolute bottom-14 left-[52%] h-12 w-12 rounded-full bg-orange-500/18 blur-2xl"
                  animate={{ opacity: [0, 0.18, 0], scale: [0.94, 1.06, 0.94] }}
                  transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 3.9 }}
                />
                <motion.div
                  className="absolute bottom-12 right-[16%] h-16 w-16 rounded-full bg-amber-400/16 blur-2xl"
                  animate={{ opacity: [0, 0.16, 0], scale: [0.95, 1.07, 0.95] }}
                  transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 4.6 }}
                />
              </>
            ) : null}

            {/* Quiet vignette so it feels like a room, not a billboard */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-black/25" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-2 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Shorts
                </span>
              </motion.div>

              <h1 className="mb-2 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Shorts
              </h1>

              {/* Subtitle: arrives late (1200ms), calm curve */}
              <AnimatePresence>
                {subtitleVisible ? (
                  <motion.p
                    {...subtitleMotion}
                    transition={
                      reduceMotion
                        ? { duration: 0.01 }
                        : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                    }
                    className="mx-auto mt-3 max-w-xl text-base text-gray-600 dark:text-gray-300 sm:text-lg"
                  >
                    {subtitle}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              {/* REAL streak badge (cute + accountable) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex justify-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/50 px-4 py-2 text-xs text-gray-700 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">
                    {streakDays > 0 ? `${streakDays}-day streak` : "Start your streak"}
                  </span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-80">quiet consistency wins</span>
                </div>
              </motion.div>

              {/* CTA + tiny cue */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 inline-flex flex-col items-center gap-5"
              >
                <Link
                  href="#shorts-grid"
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-amber-500/40 active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  Start Reading
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                </Link>

                <motion.a
                  href="#shorts-grid"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/35 px-4 py-2 text-xs text-gray-600 backdrop-blur-sm hover:bg-white/45 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>Under a minute each</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
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
                            <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{short.excerpt}</p>
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
                                  // lightweight local “like” feel without fake counters
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

            {/* “Daily Habit” (below the fold, not cluttering the hero) */}
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
                      <Flame className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-400">
                        Daily Habit
                      </span>
                    </div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">Keep it simple</h3>
                    <p className="text-gray-300">One short a day. Quiet consistency beats motivational bursts.</p>
                    <p className="mt-3 text-sm text-gray-400">
                      Current streak:{" "}
                      <span className="font-semibold text-amber-300">{streakDays} day</span>
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

            {/* Share Section */}
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

                  <h4 className="mb-3 font-serif text-xl font-semibold text-gray-900 dark:text-white">When something helps, it should travel.</h4>
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