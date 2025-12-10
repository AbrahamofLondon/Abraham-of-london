// pages/shorts/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clock,
  Zap,
  Heart,
  Share2,
  Bookmark,
  Eye,
  RefreshCw,
  TrendingUp,
  Filter,
  Search,
  Grid,
  List,
  MessageCircle,
  ThumbsUp,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import { allShorts, getPublishedShorts } from "@/lib/contentlayer-helper";

// Local shape we actually use in the UI
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  tap: {
    scale: 0.98,
  },
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

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");
  const [interactions, setInteractions] = React.useState<
    Record<string, { likes: number; shares: number; reads: number }>
  >({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  // Simulate interactions for demonstration
  React.useEffect(() => {
    const mockInteractions: Record<
      string,
      { likes: number; shares: number; reads: number }
    > = {};
    shorts.forEach((short) => {
      mockInteractions[short._id] = {
        likes: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
        reads: Math.floor(Math.random() * 1000) + 100,
      };
    });
    setInteractions(mockInteractions);
  }, [shorts]);

  // Extract unique themes
  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((short) => {
      if (short.theme) allThemes.add(short.theme);
    });
    return ["all", ...Array.from(allThemes)].sort();
  }, [shorts]);

  // Filter shorts
  const filteredShorts = React.useMemo(() => {
    return shorts.filter((short) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        short.title.toLowerCase().includes(q) ||
        short.excerpt?.toLowerCase().includes(q) ||
        short.tags?.some((tag) => tag.toLowerCase().includes(q));

      const matchesTheme =
        selectedTheme === "all" || short.theme === selectedTheme;

      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  // Stats
  const totalReads = Object.values(interactions).reduce(
    (sum, i) => sum + i.reads,
    0,
  );
  const totalLikes = Object.values(interactions).reduce(
    (sum, i) => sum + i.likes,
    0,
  );

  // Handle interactions
  const handleLike = (id: string) => {
    setInteractions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        likes: (prev[id]?.likes ?? 0) + 1,
      },
    }));
  };

  const handleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = (slug: string, title: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/shorts/${slug}`
        : `/shorts/${slug}`;

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any)
        .share({
          title: `${title} · Abraham of London`,
          text: "Check out this short reflection I found meaningful",
          url,
        })
        .catch(() => {
          // ignore share cancel
        });
    } else if (
      typeof navigator !== "undefined" &&
      (navigator.clipboard as any)?.writeText
    ) {
      navigator.clipboard.writeText(url).catch(() => {
        // ignore
      });
    }
  };

  return (
    <Layout
      title="Shorts · Bite-Sized Wisdom"
      description="High-protein, low-friction reflections for when you're tired, numb, or just too busy for long form."
    >
      <Head>
        <title>Shorts · Bite-Sized Wisdom for Busy Minds</title>
        <meta
          name="description"
          content="Quick, powerful reflections for the TikTok generation who still want depth. Read one daily to stay sharp."
        />
        <meta
          property="og:title"
          content="Shorts · Wisdom for Short Attention Spans"
        />
        <meta
          property="og:description"
          content="Daily micro-wisdom for busy people who still want to think deeply. Perfect for coffee breaks."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.abrahamoflondon.org/api/og/shorts"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Shorts · Think Deeply, Read Quickly"
        />
        <meta
          name="twitter:description"
          content="Your daily dose of wisdom, designed for scrolling brains."
        />
        <link
          rel="preload"
          href="/api/shorts"
          as="fetch"
          crossOrigin="anonymous"
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
          {/* Animated background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-amber-500/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-2 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Scrollable Wisdom
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
              >
                Shorts
                <span className="mt-2 block text-lg font-normal text-gray-600 dark:text-gray-300">
                  Bite-sized wisdom for scrolling brains
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300"
              >
                For when your brain is fried, your feed is empty, and you still
                want to
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {" "}
                  think meaningfully
                </span>
                . No fluff, just fuel.
              </motion.p>

              {/* Interactive Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mb-8 flex max-w-md flex-wrap justify-center gap-6"
              >
                <div className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalReads.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">reads</span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalLikes.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">likes</span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      3 min
                    </span>
                    <span className="text-xs text-gray-500">avg read</span>
                  </div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="inline-block"
              >
                <Link
                  href="#shorts-grid"
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40 active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  Start Reading
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <div className="h-8 w-px bg-gradient-to-b from-amber-500 to-transparent" />
          </motion.div>
        </section>

        {/* Controls Section - Sticky */}
        <section className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search shorts by topic or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-amber-400"
                  aria-label="Search shorts"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Theme Filter */}
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
                          ? "All Themes"
                          : theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex rounded-xl border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-amber-500 text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    aria-label="Grid view"
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  No shorts found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || selectedTheme !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "New shorts are being prepared. Check back soon or subscribe to get notified."}
                </p>
                {(searchQuery || selectedTheme !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTheme("all");
                    }}
                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                      Daily Wisdom Feed
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {filteredShorts.length} short
                      {filteredShorts.length !== 1 ? "s" : ""} ready for your
                      coffee break
                    </p>
                  </div>
                  {filteredShorts.length < shorts.length && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedTheme("all");
                      }}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Shorts Display */}
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
                      const themeKey =
                        (short.theme as keyof typeof themeGradients) || "faith";
                      const gradient =
                        themeGradients[themeKey] || themeGradients.faith;
                      const icon =
                        themeIcons[
                          themeKey as keyof typeof themeIcons
                        ] || "💭";

                      return (
                        <motion.article
                          key={short._id}
                          layout
                          variants={cardVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-5 backdrop-blur-sm transition-all duration-300`}
                        >
                          {/* Theme Badge */}
                          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
                            <span className="text-sm">{icon}</span>
                            <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                              {short.theme || "Reflection"}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                            {short.title}
                          </h3>

                          {/* Excerpt */}
                          {short.excerpt && (
                            <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                              {short.excerpt}
                            </p>
                          )}

                          {/* Read Time */}
                          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{short.readTime || "3 min"} read</span>
                          </div>

                          {/* Interactive Actions */}
                          <div className="flex items-center justify-between border-t border-white/20 pt-4">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleLike(short._id)}
                                className="group/like flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400"
                              >
                                <Heart
                                  className={`h-4 w-4 transition-transform group-hover/like:scale-110 ${
                                    (interactions[short._id]?.likes ?? 0) > 0
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }`}
                                />
                                <span>
                                  {interactions[short._id]?.likes ?? 0}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookmark(short._id)}
                                className={`group/bookmark flex items-center gap-1.5 text-xs transition-colors ${
                                  bookmarks.has(short._id)
                                    ? "text-amber-500"
                                    : "text-gray-500 hover:text-amber-500 dark:text-gray-400"
                                }`}
                              >
                                <Bookmark className="h-4 w-4 transition-transform group-hover/bookmark:scale-110" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleShare(short.slug, short.title)
                                }
                                className="group/share flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400"
                              >
                                <Share2 className="h-4 w-4 transition-transform group-hover/share:scale-110" />
                                <span>Share</span>
                              </button>
                            </div>

                            {/* Read Link */}
                            <Link
                              href={`/shorts/${short.slug}`}
                              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                            >
                              Read
                              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>

                          {/* Glow Effect */}
                          <div className="pointer-events-none absolute -inset-1 -z-10 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                        </motion.article>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Daily Challenge */}
            {filteredShorts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-8"
              >
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-400">
                        Daily Challenge
                      </span>
                    </div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                      Make it a habit
                    </h3>
                    <p className="text-gray-300">
                      Read one short every day for 30 days. See how your
                      thinking changes. It&apos;s like a mental workout — small
                      consistent effort, big results.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start 30-Day Streak
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Subscribe for Daily Shorts
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Share Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-center"
            >
              <h4 className="mb-4 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                Found something meaningful?
              </h4>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Share it with someone who needs it today.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share on WhatsApp
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Share on Facebook
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Mobile & global tweaks */}
      <style jsx global>{`
        @media (max-width: 768px) {
          input,
          select,
          textarea {
            font-size: 16px !important;
          }

          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }

          html {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        .glitch-text {
          position: relative;
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0%,
          100% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .dark ::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: #4b5563;
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  // ✅ pull from helper, already filtered & sorted
  const shorts = getPublishedShorts();

  // If you compute stats, keep using the same array:
  const totalReads = 0;  // or your existing logic using `shorts`
  const totalLikes = 0;  // same
  const avgReadTime =
    shorts.length > 0
      ? Math.round(
          shorts.reduce((sum, s) => {
            const rt = Number((s as any).readTime || 3);
            return sum + (isNaN(rt) ? 3 : rt);
          }, 0) / shorts.length
        )
      : 3;

  return {
    props: {
      shorts,
      stats: {
        totalReads,
        totalLikes,
        avgReadTime,
      },
    },
  };
};

export default ShortsIndexPage;