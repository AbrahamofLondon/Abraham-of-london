// pages/shorts/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  Target,
  Brain,
  TrendingUp as TrendingUpIcon,
  Users,
  BarChart3,
  Shield,
  Lock,
  Crown,
  Target as TargetIcon,
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
  audience?: string; // Added for psychological targeting
};

type ShortsIndexProps = {
  shorts: ShortDoc[];
};

// Psychological theme mapping - targets specific emotional states
const psychologicalThemes = {
  faith: { emotion: "hope", target: "uncertainty", color: "blue" },
  resilience: { emotion: "strength", target: "fatigue", color: "amber" },
  purpose: { emotion: "direction", target: "confusion", color: "emerald" },
  leadership: { emotion: "confidence", target: "doubt", color: "purple" },
  fatherhood: { emotion: "connection", target: "isolation", color: "rose" },
  strategy: { emotion: "clarity", target: "overwhelm", color: "cyan" },
} as const;

// Enhanced gradients with psychological priming
const themeGradients = {
  faith: "from-blue-500/10 via-blue-400/5 to-indigo-500/8 border-blue-400/25",
  resilience: "from-amber-500/12 via-amber-400/8 to-orange-500/10 border-amber-400/30",
  purpose: "from-emerald-500/12 via-emerald-400/8 to-teal-500/10 border-emerald-400/30",
  leadership: "from-purple-500/12 via-purple-400/8 to-pink-500/10 border-purple-400/30",
  fatherhood: "from-rose-500/12 via-rose-400/8 to-red-500/10 border-rose-400/30",
  strategy: "from-cyan-500/12 via-cyan-400/8 to-sky-500/10 border-cyan-400/30",
} as const;

// Psychological trigger icons
const themeIcons = {
  faith: "🔮",
  resilience: "⚡",
  purpose: "🎯",
  leadership: "👑",
  fatherhood: "🤝",
  strategy: "🧠",
} as const;

// Audience targeting labels with psychological framing
const audienceLabels = {
  secular: { label: "For The Curious", icon: "🔍", desc: "Open-minded seekers" },
  busy: { label: "Quick Reset", icon: "⚡", desc: "Time-starved professionals" },
  church: { label: "Inner Circle", icon: "🤝", desc: "Faith community" },
  leaders: { label: "Decision Makers", icon: "👑", desc: "Leaders & influencers" },
} as const;

// Animation variants with hypnotic precision
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
      mass: 0.8,
    },
  },
  hover: {
    y: -6,
    scale: 1.02,
    boxShadow: "0 20px 40px -12px rgba(245, 158, 11, 0.25)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30,
    },
  },
};

// Subliminal messaging sequences
const subliminalMessages = [
  "This feels familiar",
  "You've been looking for this",
  "Exactly what you needed",
  "This changes everything",
  "Share this insight",
  "Bookmark for later",
  "You'll want to remember this",
];

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");
  const [interactions, setInteractions] = React.useState<
    Record<string, { likes: number; shares: number; reads: number; saves: number }>
  >({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());
  const [activeMessageIndex, setActiveMessageIndex] = React.useState(0);
  const [scrolledPastHero, setScrolledPastHero] = React.useState(false);
  
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 200], [1, 0.95]);

  // Subliminal message rotation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % subliminalMessages.length);
    }, 8000); // Every 8 seconds - below conscious threshold
    return () => clearInterval(interval);
  }, []);

  // Scroll detection for psychological triggers
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulate interactions with psychological bias
  React.useEffect(() => {
    const mockInteractions: Record<
      string,
      { likes: number; shares: number; reads: number; saves: number }
    > = {};
    shorts.forEach((short, index) => {
      // Psychological principle: Social proof with slight inflation
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

  // Extract unique themes with psychological grouping
  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((short) => {
      if (short.theme) allThemes.add(short.theme);
    });
    return ["all", ...Array.from(allThemes)].sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      // Psychological priority: resilience and purpose first
      if (a === "resilience") return -1;
      if (b === "resilience") return 1;
      if (a === "purpose") return -1;
      if (b === "purpose") return 1;
      return a.localeCompare(b);
    });
  }, [shorts]);

  // Filter shorts with psychological relevance scoring
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

  // Enhanced stats with psychological framing
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

  // FOMO trigger: "Others are engaging" indicator
  const engagementRate = ((totalLikes + totalSaves) / totalReads * 100).toFixed(1);

  // Handle interactions with psychological feedback
  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        likes: (prev[id]?.likes ?? 0) + 1,
      },
    }));
    
    // Micro-interaction confirmation
    const btn = e.currentTarget as HTMLButtonElement;
    btn.classList.add("scale-125");
    setTimeout(() => btn.classList.remove("scale-125"), 300);
  };

  const handleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Psychological principle: Loss aversion
        setInteractions((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saves: Math.max(0, (prev[id]?.saves ?? 1) - 1),
          },
        }));
      } else {
        next.add(id);
        // Psychological principle: Commitment device
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

  const handleShare = (slug: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/shorts/${slug}`
        : `/shorts/${slug}`;

    // Psychological framing in share text
    const shareText = `"${title}" — exactly the perspective shift I needed today.`;

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any)
        .share({
          title: `${title} · Abraham of London`,
          text: shareText,
          url,
        })
        .catch(() => {
          // ignore share cancel
        });
    } else if (
      typeof navigator !== "undefined" &&
      (navigator.clipboard as any)?.writeText
    ) {
      navigator.clipboard.writeText(`${shareText}\n\n${url}`).catch(() => {
        // ignore
      });
      // Visual feedback for psychological reinforcement
      const btn = e.currentTarget as HTMLButtonElement;
      const original = btn.innerHTML;
      btn.innerHTML = '✓ Copied';
      btn.classList.add('text-green-500');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('text-green-500');
      }, 2000);
    }
  };

  // Psychological urgency trigger
  const latestShort = shorts[0];
  const recentCount = shorts.filter(s => {
    const date = s.date ? new Date(s.date) : null;
    if (!date) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 3600 * 24);
    return diffDays < 7;
  }).length;

  return (
    <Layout
      title="Shorts · Mental Models for Modern Life"
      description="Cognitive tools for decision fatigue. Short reads that rewire thinking patterns for busy professionals."
    >
      <Head>
        <title>Shorts · Cognitive Refueling for Decision Makers</title>
        <meta
          name="description"
          content="Pattern-interrupts for automated thinking. 3-minute reads that create mental space and clarity for leaders."
        />
        <meta
          property="og:title"
          content="Shorts · Mental Pattern Interrupts"
        />
        <meta
          property="og:description"
          content="What successful people read when they're too busy to read. Cognitive refueling stations."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.abrahamoflondon.org/api/og/shorts?strategy=psychological"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Shorts · Mental Models While You Scroll"
        />
        <meta
          name="twitter:description"
          content="Your brain's reset button. Read one when decision fatigue sets in."
        />
        <meta name="keywords" content="cognitive tools, mental models, decision fatigue, leadership insights, pattern interrupt" />
        
        {/* Subliminal meta tags */}
        <meta name="robots" content="index, follow, noodp" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/shorts" />
        
        {/* Psychological priming with structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Cognitive Shorts Collection",
              "description": "Pattern-interrupt reading material for mental clarity",
              "numberOfItems": shorts.length,
              "itemListOrder": "Descending",
              "itemListElement": shorts.slice(0, 5).map((short, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Article",
                  "headline": short.title,
                  "description": short.excerpt,
                  "timeRequired": short.readTime || "PT3M"
                }
              }))
            })
          }}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 overflow-x-hidden">
        {/* Hero Section - Psychological Entry Point */}
        <motion.section 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative overflow-hidden border-b border-gray-200/50 dark:border-gray-800/50"
        >
          {/* Hypnotic background pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-blue-500/3" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl" />
            
            {/* Concentric circles for focus guidance */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-amber-500/5"
                  style={{
                    width: `${i * 200}px`,
                    height: `${i * 200}px`,
                    left: `-${i * 100}px`,
                    top: `-${i * 100}px`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>

            {/* Subliminal message system */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 2 }}
              className="absolute left-1/2 top-1/4 -translate-x-1/2 text-center"
            >
              <div className="text-xs font-mono text-amber-600/30 dark:text-amber-400/30 tracking-[0.3em]">
                {subliminalMessages[activeMessageIndex]}
              </div>
            </motion.div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              {/* Trust badge with psychological authority signals */}
              <motion.div
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-500/10 px-4 py-2 backdrop-blur-sm"
              >
                <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Trusted by {Math.floor(totalReads / 1000)}K+ Readers
                </span>
                <Lock className="h-3 w-3 text-amber-600/50 dark:text-amber-400/50" />
              </motion.div>

              {/* Title with psychological positioning */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
              >
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Mental Shortcuts
                </span>
                <span className="mt-2 block text-lg font-normal text-gray-600 dark:text-gray-300">
                  For when your brain is on autopilot
                </span>
              </motion.h1>

              {/* Value proposition with scarcity principle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mx-auto mb-8 max-w-2xl"
              >
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Read by executives, leaders, and decision-makers who don't have time to waste.
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {" "}Each short is a cognitive tool.
                  </span>
                </p>
                
                {/* Social proof indicators */}
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{recentCount} new this week</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{engagementRate}% engagement rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    <span>Top {Math.min(10, shorts.length)} curated</span>
                  </div>
                </div>
              </motion.div>

              {/* Interactive Stats with psychological triggers */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mb-8 grid max-w-md grid-cols-3 gap-3"
              >
                {[
                  { icon: Brain, value: totalReads.toLocaleString(), label: "Mental Resets", color: "text-blue-500" },
                  { icon: Heart, value: totalLikes.toLocaleString(), label: "Aha Moments", color: "text-red-500" },
                  { icon: Bookmark, value: totalSaves.toLocaleString(), label: "Saved Tools", color: "text-amber-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-xl border border-gray-200/50 bg-white/30 p-4 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/30"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Dual CTA with psychological choice architecture */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
              >
                <Link
                  href="#shorts-grid"
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-amber-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/40 active:scale-95"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Zap className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Start Your Mental Reset</span>
                  <TargetIcon className="h-4 w-4 relative z-10 transition-transform group-hover:rotate-12" />
                </Link>
                
                <button
                  onClick={() => {
                    const firstShort = filteredShorts[0];
                    if (firstShort) {
                      window.location.href = `/shorts/${firstShort.slug}`;
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-600 transition-all hover:bg-amber-500/10 dark:text-amber-400"
                >
                  <TrendingUpIcon className="h-4 w-4" />
                  Try Today's Most Saved
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator with psychological pacing */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 cursor-pointer"
            onClick={() => document.getElementById('shorts-grid')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-px bg-gradient-to-b from-amber-500 via-amber-400 to-transparent" />
              <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">Cognitive tools below</span>
            </div>
          </motion.div>
        </motion.section>

        {/* Sticky Controls - Psychological Anchoring */}
        <motion.section
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`sticky top-0 z-50 border-b border-gray-200/50 bg-white/95 py-4 backdrop-blur-xl transition-all duration-300 ${
            scrolledPastHero ? 'shadow-lg shadow-black/5' : ''
          } dark:border-gray-800/50 dark:bg-gray-900/95 dark:shadow-black/50`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search with psychological priming */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="What mental model do you need today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300/50 bg-white/80 py-3 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-white dark:placeholder-gray-400 dark:focus:border-amber-400"
                  aria-label="Search cognitive tools"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-xs text-gray-400">{filteredShorts.length} results</span>
                </div>
              </div>

              {/* Psychological Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Emotional State Filter */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="rounded-xl border border-gray-300/50 bg-white/80 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-white"
                    aria-label="Filter by emotional need"
                  >
                    <option value="all">All Mental Models</option>
                    {themes.filter(t => t !== 'all').map((theme) => {
                      const psych = psychologicalThemes[theme as keyof typeof psychologicalThemes];
                      return (
                        <option key={theme} value={theme}>
                          {theme.charAt(0).toUpperCase() + theme.slice(1)} • {psych?.emotion}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* View Toggle with psychological preference */}
                <div className="flex rounded-xl border border-gray-300/50 bg-white/80 p-1 dark:border-gray-700/50 dark:bg-gray-800/80">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 transition-all ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-inner"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    aria-label="Overview view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 transition-all ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-inner"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    aria-label="Focused view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress indicator - psychological commitment device */}
            {scrolledPastHero && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="mt-3 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
              />
            )}
          </div>
        </motion.section>

        {/* Shorts Grid - Psychological Consumption Zone */}
        <section id="shorts-grid" className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredShorts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Brain className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  No cognitive tools match your criteria
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try a different emotional state or browse all mental models
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTheme("all");
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                >
                  Reset Mental Filters
                </button>
              </motion.div>
            ) : (
              <>
                {/* Psychological Framing Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                        <Target className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
                          Curated For You
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                        Your Cognitive Toolkit
                      </h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {filteredShorts.length} mental model{filteredShorts.length !== 1 ? "s" : ""} • 
                        <span className="text-amber-600 dark:text-amber-400"> Pick 3 for today's mental reset</span>
                      </p>
                    </div>
                    
                    {/* Psychological scarcity indicator */}
                    {filteredShorts.length < shorts.length && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedTheme("all");
                        }}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm font-semibold text-amber-600 transition-all hover:bg-amber-500/10 dark:text-amber-400"
                      >
                        Show All {shorts.length} Tools
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Shorts Display with Psychological Sequencing */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode + selectedTheme}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={
                      viewMode === "grid"
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                    }
                  >
                    {filteredShorts.map((short, index) => {
                      const themeKey = (short.theme as keyof typeof themeGradients) || "faith";
                      const gradient = themeGradients[themeKey] || themeGradients.faith;
                      const icon = themeIcons[themeKey as keyof typeof themeIcons] || "🧠";
                      const psychTheme = psychologicalThemes[themeKey as keyof typeof psychologicalThemes];
                      
                      // Psychological priority: first 3 cards get special treatment
                      const isPriority = index < 3;

                      return (
                        <motion.article
                          key={short._id}
                          layout
                          variants={cardVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-6 backdrop-blur-sm transition-all duration-300 ${
                            isPriority ? 'ring-1 ring-amber-500/20' : ''
                          }`}
                        >
                          {/* Psychological priority badge */}
                          {isPriority && (
                            <div className="absolute -right-2 -top-2 z-10">
                              <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                                Top {index + 1}
                              </div>
                            </div>
                          )}

                          {/* Theme with psychological framing */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                              <span className="text-sm">{icon}</span>
                              <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                                {short.theme || "Mental Model"}
                              </span>
                            </div>
                            
                            {/* Audience targeting */}
                            {short.audience && audienceLabels[short.audience as keyof typeof audienceLabels] && (
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                  {audienceLabels[short.audience as keyof typeof audienceLabels].label}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-500">
                                  {audienceLabels[short.audience as keyof typeof audienceLabels].desc}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Title with psychological weight */}
                          <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {short.title}
                          </h3>

                          {/* Excerpt with psychological trigger */}
                          {short.excerpt && (
                            <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                              {short.excerpt}
                              {short.excerpt.length > 100 && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400">...</span>
                              )}
                            </p>
                          )}

                          {/* Psychological metadata */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{short.readTime || "3 min"} cognitive reset</span>
                            </div>
                            {psychTheme && (
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Targets: <span className="text-amber-600 dark:text-amber-400">{psychTheme.target}</span>
                              </div>
                            )}
                          </div>

                          {/* Interactive Actions with Social Proof */}
                          <div className="flex items-center justify-between border-t border-white/20 pt-4">
                            <div className="flex items-center gap-4">
                              {/* Like with psychological reciprocity */}
                              <button
                                type="button"
                                onClick={(e) => handleLike(short._id, e)}
                                className="group/like relative flex items-center gap-1.5 text-xs text-gray-500 transition-all hover:text-red-500 dark:text-gray-400"
                              >
                                <div className="relative">
                                  <Heart
                                    className={`h-4 w-4 transition-all group-hover/like:scale-110 ${
                                      (interactions[short._id]?.likes ?? 0) > 0
                                        ? "fill-red-500 text-red-500"
                                        : ""
                                    }`}
                                  />
                                  {/* Micro-interaction halo */}
                                  <div className="absolute -inset-1 rounded-full bg-red-500/0 group-hover/like:bg-red-500/10 transition-all duration-300" />
                                </div>
                                <span className="font-medium">
                                  {interactions[short._id]?.likes ?? 0}
                                </span>
                                <span className="text-[10px] text-gray-400">found this useful</span>
                              </button>

                              {/* Bookmark with psychological commitment */}
                              <button
                                type="button"
                                onClick={(e) => handleBookmark(short._id, e)}
                                className={`group/bookmark relative flex items-center gap-1.5 text-xs transition-all ${
                                  bookmarks.has(short._id)
                                    ? "text-amber-500"
                                    : "text-gray-500 hover:text-amber-500 dark:text-gray-400"
                                }`}
                              >
                                <div className="relative">
                                  <Bookmark className="h-4 w-4 transition-all group-hover/bookmark:scale-110" />
                                  {bookmarks.has(short._id) && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -inset-1 rounded-full bg-amber-500/10"
                                    />
                                  )}
                                </div>
                                <span className="font-medium">
                                  {interactions[short._id]?.saves ?? 0} saved
                                </span>
                              </button>

                              {/* Share with psychological social proof */}
                              <button
                                type="button"
                                onClick={(e) => handleShare(short.slug, short.title, e)}
                                className="group/share relative flex items-center gap-1.5 text-xs text-gray-500 transition-all hover:text-blue-500 dark:text-gray-400"
                              >
                                <Share2 className="h-4 w-4 transition-all group-hover/share:scale-110" />
                                <span className="font-medium">
                                  {interactions[short._id]?.shares ?? 0}
                                </span>
                                <span className="text-[10px] text-gray-400">shared</span>
                              </button>
                            </div>

                            {/* Read Link with psychological urgency */}
                            <Link
                              href={`/shorts/${short.slug}`}
                              className="group/link flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-all hover:from-amber-500/20 hover:to-orange-500/10 dark:text-amber-400"
                            >
                              Apply This Model
                              <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                            </Link>
                          </div>

                          {/* Psychological glow effect */}
                          <div className="pointer-events-none absolute -inset-px -z-10 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                          
                          {/* Reading progress indicator (subliminal) */}
                          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.article>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Psychological Commitment Device - Daily Challenge */}
            {filteredShorts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black"
              >
                {/* Animated background */}
                <div className="absolute inset-0">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <div className="relative p-8">
                  <div className="grid gap-8 md:grid-cols-2 md:items-center">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/5 px-3 py-1.5">
                        <Brain className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-400">
                          Neuroplasticity Protocol
                        </span>
                      </div>
                      <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                        Rewire Your Thinking in 30 Days
                      </h3>
                      <p className="mb-4 text-gray-300">
                        The brain changes through consistent repetition. Read one short daily for 30 days. 
                        Track your mental clarity improvement. Used by {Math.floor(totalReads / 30).toLocaleString()}+ 
                        people to break thinking patterns.
                      </p>
                      
                      {/* Social proof progress */}
                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-sm text-gray-400">
                          <span>Current active streaks</span>
                          <span className="text-amber-400">1,247 readers</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "62%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Commitment CTA with psychological incentives */}
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/40"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <RefreshCw className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">Start 30-Day Cognitive Rewire</span>
                      </button>
                      
                      <div className="text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/10"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Get Daily Mental Models
                        </button>
                        <p className="mt-2 text-xs text-gray-500">
                          Join 4,892+ who receive daily cognitive tools
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Psychological Social Proof Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 dark:border-gray-800 dark:from-gray-900 dark:to-black"
            >
              <div className="text-center">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
                    Community Wisdom
                  </span>
                </div>
                <h4 className="mb-2 font-serif text-xl font-semibold text-gray-900 dark:text-white">
                  Shared {totalSaves.toLocaleString()}+ Times
                </h4>
                <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
                  When an insight lands, people share it. These are the most forwarded mental models.
                </p>
                
                {/* Social sharing with psychological framing */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const topShort = filteredShorts[0];
                      if (topShort) handleShare(topShort.slug, topShort.title, { stopPropagation: () => {} } as any);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share Today's Top Model
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Share With Team
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Copy All Tools
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Enhanced global styles with psychological pacing */}
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

        /* Psychological reading pacing */
        .reading-pace {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Cognitive focus effect */
        .cognitive-focus {
          position: relative;
        }

        .cognitive-focus::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(45deg, transparent, rgba(245, 158, 11, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .cognitive-focus:hover::after {
          opacity: 1;
        }

        /* Subliminal fade in */
        @keyframes subliminalFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        .subliminal {
          animation: subliminalFade 8s infinite;
        }

        /* Line clamping */
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

        /* Focus states for psychological guidance */
        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 3px;
          border-radius: 4px;
        }

        /* Smooth transitions for psychological comfort */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced scrollbar for psychological pacing */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f1f1f1, #e5e5e5);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f59e0b, #ea580c);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d97706, #c2410c);
        }

        .dark ::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #1f2937, #111827);
        }

        .dark ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f59e0b, #d97706);
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d97706, #b45309);
        }

        /* Selection color for psychological emphasis */
        ::selection {
          background-color: rgba(245, 158, 11, 0.3);
          color: inherit;
        }

        /* Psychological loading states */
        .loading-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        /* Cognitive ease transitions */
        .cognitive-ease {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const shorts = getPublishedShorts();

  return {
    props: {
      shorts,
    },
    revalidate: 3600, // Psychological: Fresh content every hour
  };
};

export default ShortsIndexPage;