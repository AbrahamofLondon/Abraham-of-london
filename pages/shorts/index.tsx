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

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");

  // NOTE: interactions are now keyed by SHORT SLUG (was _id before, causing bugs)
  const [interactions, setInteractions] = React.useState<
    Record<string, { likes: number; shares: number; reads: number; saves: number }>
  >({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  // Initialize interactions with realistic data – CLIENT SIDE ONLY
  React.useEffect(() => {
    const mockInteractions: Record<
      string,
      { likes: number; shares: number; reads: number; saves: number }
    > = {};

    shorts.forEach((short, index) => {
      const baseReads = 100 + index * 50 + Math.floor(Math.random() * 100);
      const baseLikes = Math.floor(baseReads * 0.15) + Math.floor(Math.random() * 30);
      const baseShares = Math.floor(baseLikes * 0.3) + Math.floor(Math.random() * 10);

      mockInteractions[short.slug] = {
        reads: baseReads,
        likes: baseLikes,
        shares: baseShares,
        saves: Math.floor(baseReads * 0.08) + Math.floor(Math.random() * 5),
      };
    });

    setInteractions(mockInteractions);
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

      const matchesTheme =
        selectedTheme === "all" || short.theme === selectedTheme;

      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  const totalReads = Object.values(interactions).reduce(
    (sum, i) => sum + i.reads,
    0
  );
  const totalLikes = Object.values(interactions).reduce(
    (sum, i) => sum + i.likes,
    0
  );
  const totalSaves = Object.values(interactions).reduce(
    (sum, i) => sum + i.saves,
    0
  );

  const handleLike = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractions((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        likes: (prev[slug]?.likes ?? 0) + 1,
      },
    }));
  };

  const handleBookmark = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        setInteractions((prev) => ({
          ...prev,
          [slug]: {
            ...prev[slug],
            saves: Math.max(0, (prev[slug]?.saves ?? 1) - 1),
          },
        }));
      } else {
        next.add(slug);
        setInteractions((prev) => ({
          ...prev,
          [slug]: {
            ...prev[slug],
            saves: (prev[slug]?.saves ?? 0) + 1,
          },
        }));
      }
      return next;
    });
  };

  // Working share function – now correctly updates shares keyed by slug
  const handleShare = async (
    slug: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const url = `${window.location.origin}/shorts/${slug}`;
    const text = `"${title}" - A short from Abraham of London.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} · Abraham of London`,
          text,
          url,
        });
        setInteractions((prev) => ({
          ...prev,
          [slug]: {
            ...prev[slug],
            shares: (prev[slug]?.shares || 0) + 1,
          },
        }));
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      const btn = e.currentTarget as HTMLButtonElement;
      const originalText = btn.textContent;
      btn.textContent = "✓ Copied";
      setTimeout(() => {
        if (btn) btn.textContent = originalText;
      }, 2000);

      setInteractions((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          shares: (prev[slug]?.shares || 0) + 1,
        },
      }));
    } catch {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sharePage = async (platform?: string) => {
    const url = window.location.href;
    const text =
      "Insightful shorts for busy minds – Abraham of London";

    if (platform === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (platform === "whatsapp") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        text + " " + url
      )}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shorts · Abraham of London",
          text,
          url,
        });
      } catch {
        navigator.clipboard.writeText(`${text}\n${url}`);
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
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
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* Hero Section with subtle, intelligent backdrop */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
          {/* Intelligent, subliminal backdrop */}
          <div className="pointer-events-none absolute inset-0">
            {/* Base light/dark gradient for calm */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950" />

            {/* Warm–cool radial glows (belonging + depth) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_58%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.20),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.30),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.26),_transparent_60%)]" />

            {/* Subtle grid to signal structure + thought */}
            <div className="absolute inset-0 opacity-[0.12] mix-blend-soft-light bg-[linear-gradient(to_right,rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.35)_1px,transparent_1px)] bg-[size:120px_120px]" />

            {/* Vertical “pilgrimage” line anchoring the eye */}
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />
          </div>

          {/* Hero content */}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
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
                {/* Brand hook: the tagline you’re building around */}
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/90 dark:text-amber-400/90">
                  Sharp. Brief. Undeniable.
                </span>
              </motion.h1>

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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mb-8 flex max-w-md flex-wrap justify-center gap-6"
              >
                <div className="rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalReads.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">reads</span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalLikes.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">likes</span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalSaves.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">saved</span>
                  </div>
                </div>
              </motion.div>

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
        </section>

        {/* Controls Section */}
        <section className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          ? "All Themes"
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
                    : "New shorts are being prepared. Check back soon."}
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
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                      Daily Feed
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {filteredShorts.length} short
                      {filteredShorts.length !== 1 ? "s" : ""} ready
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
                        themeIcons[themeKey as keyof typeof themeIcons] || "💭";

                      const stats = interactions[short.slug] || {
                        likes: 0,
                        reads: 0,
                        shares: 0,
                        saves: 0,
                      };

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

                          {short.excerpt && (
                            <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                              {short.excerpt}
                            </p>
                          )}

                          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{short.readTime || "3 min"} read</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/20 pt-4">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={(e) => handleLike(short.slug, e)}
                                className="group/like flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400"
                              >
                                <Heart
                                  className={`h-4 w-4 transition-transform group-hover/like:scale-110 ${
                                    stats.likes > 0
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }`}
                                />
                                <span>{stats.likes}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleBookmark(short.slug, e)}
                                className={`group/bookmark flex items-center gap-1.5 text-xs transition-colors ${
                                  bookmarks.has(short.slug)
                                    ? "text-amber-500"
                                    : "text-gray-500 hover:text-amber-500 dark:text-gray-400"
                                }`}
                              >
                                <Bookmark className="h-4 w-4 transition-transform group-hover/bookmark:scale-110" />
                                <span>{stats.saves}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleShare(short.slug, short.title, e)
                                }
                                className="group/share flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400"
                              >
                                <Share2 className="h-4 w-4 transition-transform group-hover/share:scale-110" />
                                <span>{stats.shares}</span>
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

            {/* Daily Habit */}
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
                        Daily Habit
                      </span>
                    </div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                      Make it consistent
                    </h3>
                    <p className="text-gray-300">
                      Read one short every day. Let five minutes of clarity cut
                      through twenty-four hours of noise. Quietly join the
                      cohort of fathers, founders, and thinkers who refuse to
                      outsource their minds.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("shorts-grid");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start Daily Reading
                    </button>
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
            )}

            {/* Working Share Section */}
            {filteredShorts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                    <Share2 className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
                      Shared {totalSaves.toLocaleString()}+ times
                    </span>
                  </div>

                  <h4 className="mb-3 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                    When something lands, people pass it on
                  </h4>
                  <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
                    These are the pieces people forward to the one friend who
                    needs a nudge, a warning, or a word in season.
                  </p>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => sharePage("twitter")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => sharePage("whatsapp")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Share on WhatsApp
                    </button>
                    <button
                      onClick={() => sharePage()}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm font-medium text-amber-600 transition-all hover:scale-105 hover:bg-amber-500/10 dark:text-amber-400"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Anywhere
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Each share quietly pulls one more person out of the scroll
                    and back into reality.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const shorts = getPublishedShorts();

  return {
    props: {
      shorts,
    },
    revalidate: 3600,
  };
};

export default ShortsIndexPage;