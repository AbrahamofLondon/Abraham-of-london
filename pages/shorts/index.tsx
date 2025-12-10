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
  Users,
  Brain,
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
  const [interactions, setInteractions] = React.useState<
    Record<string, { likes: number; shares: number; reads: number; saves: number }>
  >({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  // Initialize interactions with realistic data (client-only feel)
  React.useEffect(() => {
    const mockInteractions: Record<
      string,
      { likes: number; shares: number; reads: number; saves: number }
    > = {};
    shorts.forEach((short, index) => {
      const baseReads = 100 + index * 50 + Math.floor(Math.random() * 100);
      const baseLikes = Math.floor(baseReads * 0.15) + Math.floor(Math.random() * 30);
      const baseShares = Math.floor(baseLikes * 0.3) + Math.floor(Math.random() * 10);

      mockInteractions[short._id] = {
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
    0,
  );
  const totalLikes = Object.values(interactions).reduce(
    (sum, i) => sum + i.likes,
    0,
  );
  const totalSaves = Object.values(interactions).reduce(
    (sum, i) => sum + i.saves,
    0,
  );

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        likes: (prev[id]?.likes ?? 0) + 1,
      },
    }));
  };

  const handleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setInteractions((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saves: Math.max(0, (prev[id]?.saves ?? 1) - 1),
          },
        }));
      } else {
        next.add(id);
        setInteractions((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saves: (prev[id]?.saves ?? 0) + 1,
          },
        }));
      }
      return next;
    });
  };

  const handleShare = async (slug: string, title: string, e: React.MouseEvent) => {
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
        // ignore, fall through
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
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sharePage = async (platform?: string) => {
    const url = window.location.href;
    const text = "Daily 3-minute reckonings for people who are done with pretending.";

    if (platform === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (platform === "whatsapp") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        text + " " + url,
      )}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "short · Daily 3-minute reckonings",
          text,
          url,
        });
        return;
      } catch {
        // fall through
      }
    }

    navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied to clipboard!");
  };

  return (
    <Layout
      title="short · Daily 3-Minute Reckonings"
      description="Frank, quiet reflections for people who are tired of noise but not ready to give up on meaning."
    >
      <Head>
        <title>short · Daily 3-Minute Reckonings</title>
        <meta
          name="description"
          content="A quiet corner in a loud world. Honest, 3-minute reflections on the things you feel but rarely say out loud."
        />
        <meta property="og:title" content="short · Daily 3-Minute Reckonings" />
        <meta
          property="og:description"
          content="Secular, soul-aware reflections for those seeking sense in the middle of the noise."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.abrahamoflondon.org/api/og/shorts"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* HERO – “Pilgrimage” feel */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
          {/* Subliminal field behind text */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_60%)]" />
            <div className="absolute inset-0 opacity-[0.18] mix-blend-soft-light dark:opacity-20 bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:120px_120px]" />
            <div className="absolute -left-40 top-24 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
              {/* Left: proposition */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 backdrop-blur-sm dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>SHORT · DAILY 3-MINUTE RECKONINGS</span>
                </div>

                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="font-serif text-4xl font-semibold tracking-tight text-gray-900 dark:text-cream sm:text-5xl lg:text-6xl"
                  >
                    A quiet corner{" "}
                    <span className="block text-3xl font-normal text-gray-600 dark:text-gray-300 sm:text-4xl">
                      for people who are loud inside.
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="max-w-xl text-base text-gray-600 dark:text-gray-300 sm:text-lg"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      short
                    </span>{" "}
                    is where you come when motivational noise stops working.
                    3-minute reflections on the tension between who you are,
                    who you perform, and who you were meant to be.
                    Frank. Gentle. Uncompromising.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  <Link
                    href="#shorts-grid"
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"
                  >
                    <Zap className="h-4 w-4" />
                    Read today&apos;s short
                    <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => sharePage()}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300/70 bg-white/70 px-6 py-2.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:border-amber-500/40 hover:text-amber-700 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:border-amber-400/60 dark:hover:text-amber-300"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share this refuge with someone tired
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-wrap items-center gap-6 text-xs text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {totalReads.toLocaleString()}
                    </span>
                    <span>quiet reads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {totalLikes.toLocaleString()}
                    </span>
                    <span>unspoken amens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    <span>A small, growing circle of people who refuse to fake it.</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: “sample short” as object / shrine */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                {/* Soft halo behind card */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-300/16" />
                </div>

                <motion.div
                  whileHover={{ y: -4, rotate: -0.3 }}
                  className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-xl shadow-gray-900/5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90 dark:shadow-black/40"
                >
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <Brain className="h-3.5 w-3.5" />
                      For when your convictions feel like costumes
                    </span>
                    <span className="text-[0.7rem] uppercase tracking-[0.18em]">
                      ~3 min read
                    </span>
                  </div>

                  <h2 className="mb-2 font-serif text-lg font-semibold text-gray-900 dark:text-cream">
                    “Your beliefs look polished. But somewhere along the line, the
                    truth stopped fitting you.”
                  </h2>

                  <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    You still say all the right things. You still preach the values
                    you inherited. But in the unguarded moments, they feel borrowed.
                    The mirror starts to look like a stranger wearing your convictions
                    like theatre clothes.
                  </p>

                  <div className="mb-4 rounded-2xl bg-gray-50/80 p-4 text-xs leading-relaxed text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
                    <p className="mb-1 font-semibold text-gray-800 dark:text-gray-100">
                      Here is the mercy in the discomfort:
                    </p>
                    <p className="italic">
                      The gap is not your enemy. Pretending there is no gap is.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>One honest short. One small act of courage.</span>
                    <Link
                      href="#shorts-grid"
                      className="inline-flex items-center gap-1 font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Step into today&apos;s short
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>

                {/* Floating “whispers” around the card */}
                <div className="pointer-events-none absolute -left-4 top-6 hidden flex-col gap-2 text-[0.65rem] text-gray-500/70 dark:text-gray-400/60 sm:flex">
                  <span className="rounded-full bg-white/60 px-3 py-1 shadow-sm backdrop-blur-sm dark:bg-gray-900/70">
                    authenticity over performance
                  </span>
                  <span className="rounded-full bg-white/60 px-3 py-1 shadow-sm backdrop-blur-sm dark:bg-gray-900/70">
                    faith without theatrics
                  </span>
                </div>
                <div className="pointer-events-none absolute -right-3 bottom-10 hidden flex-col gap-2 text-[0.65rem] text-gray-500/70 dark:text-gray-400/60 md:flex">
                  <span className="rounded-full bg-white/60 px-3 py-1 shadow-sm backdrop-blur-sm dark:bg-gray-900/70">
                    courage in the quiet
                  </span>
                  <span className="rounded-full bg-white/60 px-3 py-1 shadow-sm backdrop-blur-sm dark:bg-gray-900/70">
                    a refuge from performance
                  </span>
                </div>
              </motion.div>
            </div>
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
                  placeholder="Search shorts by topic or word that won’t leave you alone..."
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
                    ? "Try adjusting your search or filter criteria."
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
                                onClick={(e) => handleLike(short._id, e)}
                                className="group/like flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400"
                              >
                                <Heart
                                  className={`h-4 w-4 transition-transform group-hover/like:scale-110 ${
                                    (interactions[short._id]?.likes ?? 0) > 0
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }`}
                                />
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
                                onClick={(e) =>
                                  handleShare(short.slug, short.title, e)
                                }
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
                      Make it a quiet ritual
                    </h3>
                    <p className="text-gray-300">
                      Read one short every day. Not to perform, not to impress
                      anyone — just to stay honest with yourself. Small,
                      consistent reckonings change trajectories.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
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
                      Invite a friend into the rhythm
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Share Section */}
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
                      Shared {totalSaves.toLocaleString()}+ Times
                    </span>
                  </div>

                  <h4 className="mb-3 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                    When something finally names what you&apos;ve been feeling,
                    you don&apos;t keep it to yourself.
                  </h4>
                  <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
                    People share what cuts through the noise. If a short lands,
                    passing it on might be the interruption someone else is
                    secretly waiting for.
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
                    Each share is one more mind pulled away from the noise, even
                    if just for three minutes.
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