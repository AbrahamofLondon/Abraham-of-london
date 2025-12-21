// pages/shorts/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
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

const themeGradients = {
  faith: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  resilience: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  purpose: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  leadership: "from-purple-500/10 to-pink-500/5 border-purple-500/20",
  fatherhood: "from-rose-500/10 to-red-500/5 border-rose-500/20",
  strategy: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
} as const;

const themeIcons = {
  faith: "🙏",
  resilience: "💪",
  purpose: "🎯",
  leadership: "👑",
  fatherhood: "👨‍👦",
  strategy: "♟️",
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
  hover: {
    y: -3,
    scale: 1.01,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  tap: { scale: 0.99 },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function seeded(n: number): number {
  // deterministic-ish pseudo random (stable across renders for fixed n)
  const x = Math.sin(n * 9999) * 10000;
  return x - Math.floor(x);
}

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");

  const [interactions, setInteractions] = React.useState<
    Record<string, { likes: number; shares: number; reads: number; saves: number }>
  >({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  // Initialize interactions (kept for card UI only; NOT used to clutter hero)
  React.useEffect(() => {
    const mock: Record<
      string,
      { likes: number; shares: number; reads: number; saves: number }
    > = {};

    shorts.forEach((short, index) => {
      const baseReads = 100 + index * 50 + Math.floor(Math.random() * 100);
      const baseLikes = Math.floor(baseReads * 0.15) + Math.floor(Math.random() * 30);
      const baseShares = Math.floor(baseLikes * 0.3) + Math.floor(Math.random() * 10);

      mock[short._id] = {
        reads: baseReads,
        likes: baseLikes,
        shares: baseShares,
        saves: Math.floor(baseReads * 0.08) + Math.floor(Math.random() * 5),
      };
    });

    setInteractions(mock);
  }, [shorts]);

  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((short) => {
      if (short.theme) allThemes.add(short.theme);
    });
    return ["all", ...Array.from(allThemes)].sort();
  }, [shorts]);

  const filteredShorts = React.useMemo(() => {
    return shorts.filter((short) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        short.title.toLowerCase().includes(q) ||
        short.excerpt?.toLowerCase().includes(q) ||
        short.tags?.some((tag) => tag.toLowerCase().includes(q));

      const matchesTheme = selectedTheme === "all" || short.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractions((prev) => ({
      ...prev,
      [id]: { ...prev[id], likes: (prev[id]?.likes ?? 0) + 1 },
    }));
  };

  const handleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setInteractions((p) => ({
          ...p,
          [id]: { ...p[id], saves: Math.max(0, (p[id]?.saves ?? 1) - 1) },
        }));
      } else {
        next.add(id);
        setInteractions((p) => ({
          ...p,
          [id]: { ...p[id], saves: (p[id]?.saves ?? 0) + 1 },
        }));
      }
      return next;
    });
  };

  const handleShare = async (id: string, slug: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/shorts/${slug}`
        : `https://www.abrahamoflondon.org/shorts/${slug}`;

    const text = `"${title}" - A short from Abraham of London.`;

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${title} · Abraham of London`,
          text,
          url,
        });
        setInteractions((prev) => ({
          ...prev,
          [id]: { ...prev[id], shares: (prev[id]?.shares ?? 0) + 1 },
        }));
        return;
      } catch {
        // fall through
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
      }
      setInteractions((prev) => ({
        ...prev,
        [id]: { ...prev[id], shares: (prev[id]?.shares ?? 0) + 1 },
      }));
    } catch {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sharePage = async (platform?: string) => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const text = "Abraham of London · Shorts";

    if (platform === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (platform === "whatsapp") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Shorts · Abraham of London", text, url });
      } catch {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(`${text}\n${url}`);
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  };

  // micro particles (sparse, subtle, deterministic)
  const particles = React.useMemo(() => {
    const count = 10; // keep sparse
    return Array.from({ length: count }).map((_, i) => {
      const r1 = seeded(i + 1);
      const r2 = seeded(i + 19);
      const r3 = seeded(i + 77);

      return {
        id: i,
        leftPct: Math.round(r1 * 100),
        topPct: Math.round(r2 * 70) + 10,
        size: Math.round(2 + r3 * 3), // 2–5px
        driftX: Math.round((seeded(i + 7) - 0.5) * 60),
        driftY: Math.round((seeded(i + 33) - 0.5) * 26),
        duration: Math.round(14 + seeded(i + 55) * 12),
        delay: Math.round(seeded(i + 101) * 6),
        opacity: 0.08 + seeded(i + 88) * 0.08, // 0.08–0.16
      };
    });
  }, []);

  return (
    <Layout
      title="Shorts"
      description="Short, high-signal reflections."
    >
      <Head>
        <title>Shorts · Abraham of London</title>
        <meta
          name="description"
          content="Short, high-signal reflections from Abraham of London."
        />
        <meta property="og:title" content="Shorts · Abraham of London" />
        <meta
          property="og:description"
          content="Short, high-signal reflections."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.abrahamoflondon.org/api/og/shorts" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/shorts" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* HERO — subliminal, no new visible words */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
          {/* Background field */}
          <div className="absolute inset-0">
            {/* base wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-indigo-500/6" />

            {/* slow drift blobs (barely there) */}
            <motion.div
              aria-hidden="true"
              className="absolute -top-48 -right-48 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-3xl"
              animate={{ x: [0, -26, 0], y: [0, 18, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "transform" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute -bottom-56 -left-56 h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "transform" }}
            />

            {/* soft shimmer band */}
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-10 h-16 w-[880px] -translate-x-1/2 rotate-[-10deg] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md dark:via-white/8"
              animate={{ opacity: [0, 0.35, 0], x: ["-10%", "10%", "-10%"] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "transform, opacity" }}
            />

            {/* micro particles */}
            <div aria-hidden="true" className="absolute inset-0">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-black dark:bg-white"
                  style={{
                    left: `${p.leftPct}%`,
                    top: `${p.topPct}%`,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity,
                    filter: "blur(0.2px)",
                  }}
                  animate={{
                    x: [0, p.driftX, 0],
                    y: [0, p.driftY, 0],
                    opacity: [p.opacity * 0.6, p.opacity, p.opacity * 0.6],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* bottom hairline + pulse dot (silent scroll cue) */}
            <div aria-hidden="true" className="absolute bottom-0 left-0 right-0">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative h-10">
                  <div className="absolute bottom-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-gray-700/60" />
                  <motion.div
                    className="absolute bottom-[18px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-500/70"
                    animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.35, 1] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero content — minimal */}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
              >
                Shorts
              </motion.h1>

              {/* No extra words. Keep whitespace. */}
              <div className="mt-10 flex justify-center">
                <Link
                  href="#shorts-grid"
                  aria-label="Jump to shorts"
                  className="group inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/40 px-6 py-3 text-sm font-semibold text-gray-900 backdrop-blur-sm transition-all hover:bg-white/60 dark:border-gray-800 dark:bg-gray-900/35 dark:text-white"
                >
                  {/* Keep it quiet: icon only + existing semantics via aria-label */}
                  <motion.span
                    className="inline-flex"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-90" />
                  </motion.span>
                </Link>
              </div>
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
                  placeholder="Search..."
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
                    {themes.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme === "all"
                          ? "All"
                          : theme.charAt(0).toUpperCase() + theme.slice(1)}
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
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No results</h3>
                <p className="text-gray-600 dark:text-gray-400">Adjust search or filters.</p>
                {(searchQuery || selectedTheme !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTheme("all");
                    }}
                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    type="button"
                  >
                    Clear
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
                      {filteredShorts.length} item{filteredShorts.length !== 1 ? "s" : ""}
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
                      Clear
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={
                      viewMode === "grid"
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                    }
                  >
                    {filteredShorts.map((short) => {
                      const themeKey = (short.theme as keyof typeof themeGradients) || "faith";
                      const gradient = themeGradients[themeKey] || themeGradients.faith;
                      const icon = themeIcons[themeKey as keyof typeof themeIcons] || "💭";

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
                            <span>{short.readTime || "3 min"} read</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/20 pt-4">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={(e) => handleLike(short._id, e)}
                                className="group/like flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400"
                              >
                                <Heart className="h-4 w-4 transition-transform group-hover/like:scale-110" />
                                <span>{interactions[short._id]?.likes ?? 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleBookmark(short._id, e)}
                                className={`group/bookmark flex items-center gap-1.5 text-xs transition-colors ${
                                  bookmarks.has(short._id)
                                    ? "text-amber-500"
                                    : "text-gray-500 hover:text-amber-500 dark:text-gray-400"
                                }`}
                              >
                                <Bookmark className="h-4 w-4 transition-transform group-hover/bookmark:scale-110" />
                                <span>{interactions[short._id]?.saves ?? 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleShare(short._id, short.slug, short.title, e)}
                                className="group/share flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400"
                              >
                                <Share2 className="h-4 w-4 transition-transform group-hover/share:scale-110" />
                                <span>{interactions[short._id]?.shares ?? 0}</span>
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

            {/* Share block stays (not in hero); if you want this subliminal too, say so */}
            {filteredShorts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-center">
                  <h4 className="mb-3 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                    Share
                  </h4>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => sharePage("twitter")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      type="button"
                    >
                      <TrendingUp className="h-4 w-4" />
                      X
                    </button>
                    <button
                      onClick={() => sharePage("whatsapp")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      type="button"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => sharePage()}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm font-medium text-amber-600 transition-all hover:scale-105 hover:bg-amber-500/10 dark:text-amber-400"
                      type="button"
                    >
                      <Share2 className="h-4 w-4" />
                      Copy
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

export const getStaticProps: GetStaticProps = async () => {
  const shorts = getPublishedShorts();
  return { props: { shorts }, revalidate: 3600 };
};

export default ShortsIndexPage;