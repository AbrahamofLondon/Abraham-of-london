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
        {/* Hero Section with subliminal "6-second hug" backdrop */}
<section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
  {/* INTELLIGENT, SUBLIMINAL BACKDROP - CREATES "6-SECOND HUG" FEELING */}
  <div className="pointer-events-none absolute inset-0">
    {/* Base gradient for warmth and depth */}
    <div className="absolute inset-0 bg-gradient-to-b from-amber-50/10 via-white to-cyan-50/10 dark:from-amber-950/20 dark:via-black dark:to-cyan-950/20" />

    {/* "Breathing" concentric circles - creates subconscious focus */}
    <div className="absolute inset-0">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${50 + i * 30}%`,
            height: `${50 + i * 30}%`,
            borderColor: `rgba(251, 191, 36, ${0.1 - i * 0.02})`,
          }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}
    </div>

    {/* Warm golden pulse at the center - subliminal reward system */}
    <motion.div
      className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 blur-3xl"
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />

    {/* Micro-dot matrix - creates texture without noise */}
    <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.4) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>

    {/* Diagonal energy lines - subtle directional flow */}
    <div className="absolute inset-0 opacity-[0.03]">
      <div className="h-full w-full bg-[linear-gradient(45deg,transparent_49%,rgba(251,191,36,0.3)_50%,transparent_51%)] bg-[length:100px_100px]" />
    </div>

    {/* Floating micro-elements - creates life and motion */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute h-px w-px rounded-full bg-amber-400/40"
        style={{
          left: `${10 + i * 12}%`,
          top: `${30 + Math.sin(i) * 40}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.5,
        }}
      />
    ))}

    {/* Textural overlay - subtle paper/grain effect */}
    <div className="absolute inset-0 opacity-[0.02] mix-blend-multiply dark:opacity-[0.01]">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.2'/%3E%3C/svg%3E")`,
        }}
      />
    </div>

    {/* Light beam accents - creates depth and focus */}
    <div className="absolute inset-0 opacity-[0.15] mix-blend-soft-light">
      <div className="absolute left-1/4 top-1/3 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-br from-amber-200/30 via-transparent to-cyan-200/30 blur-xl" />
      <div className="absolute right-1/4 top-2/3 h-48 w-48 -translate-y-1/2 rotate-12 bg-gradient-to-tl from-orange-200/20 via-transparent to-amber-200/20 blur-xl" />
    </div>
  </div>

  {/* INTERACTIVE GLOW ON MOUSE MOVE - Subliminal reward */}
  <motion.div
    className="pointer-events-none absolute inset-0 z-0"
    animate={{
      background: [
        'radial-gradient(circle at 30% 50%, rgba(251, 191, 36, 0.15), transparent 60%)',
        'radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.15), transparent 60%)',
        'radial-gradient(circle at 30% 50%, rgba(251, 191, 36, 0.15), transparent 60%)',
      ],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />

  {/* SUBTLE PARALLAX LAYERS - Creates depth perception */}
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent blur-2xl"
      animate={{
        x: [0, 20, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-cyan-500/5 to-transparent blur-2xl"
      animate={{
        x: [0, -15, 0],
        y: [0, 15, 0],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>

  {/* THE HERO CONTENT - Now with micro-interactions */}
  <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      {/* Enhanced badge with interactive glow */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="group relative mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-2 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="absolute -inset-1 rounded-full bg-amber-500/20 blur-lg opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />
        <Sparkles className="relative z-10 h-4 w-4 text-amber-500 animate-pulse" />
        <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Scrollable Wisdom
        </span>
        {/* Micro-interaction: Sparkle trail on hover */}
        <div className="absolute -right-2 -top-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-amber-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
                x: [0, 20],
                y: [0, -20],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Main title with breathing animation */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
      >
        Shorts
        <motion.span
          className="mt-2 block text-lg font-normal text-gray-600 dark:text-gray-300"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          Bite-sized wisdom for scrolling brains
        </motion.span>
        <motion.span
          className="mt-1 block text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/90 dark:text-amber-400/90"
          whileHover={{ letterSpacing: "0.4em" }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          Sharp. Brief. Undeniable.
        </motion.span>
      </motion.h1>

      {/* Enhanced description with interactive underline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300"
      >
        For when your brain is fried, your feed is empty, and you still
        want to{" "}
        <span className="relative inline-block">
          <span className="relative z-10 font-semibold text-amber-600 dark:text-amber-400">
            think meaningfully
          </span>
          <motion.span
            className="absolute bottom-0 left-0 h-0.5 w-full bg-amber-400/30"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            viewport={{ once: true }}
          />
        </span>
        . No fluff, just fuel.
      </motion.p>

      {/* Stats with micro-interactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-auto mb-8 flex max-w-md flex-wrap justify-center gap-6"
      >
        <div className="group/stat relative">
          <motion.div
            className="relative rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <motion.span
                className="text-sm font-semibold text-gray-900 dark:text-white"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {totalReads.toLocaleString()}
              </motion.span>
              <span className="text-xs text-gray-500">reads</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-amber-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
          </motion.div>
          <div className="absolute -inset-1 rounded-xl bg-amber-500/10 blur-md opacity-0 transition-opacity group-hover/stat:opacity-50" />
        </div>

        <div className="group/stat relative">
          <motion.div
            className="relative rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <motion.span
                className="text-sm font-semibold text-gray-900 dark:text-white"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {totalLikes.toLocaleString()}
              </motion.span>
              <span className="text-xs text-gray-500">likes</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-amber-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
          <div className="absolute -inset-1 rounded-xl bg-amber-500/10 blur-md opacity-0 transition-opacity group-hover/stat:opacity-50" />
        </div>

        <div className="group/stat relative">
          <motion.div
            className="relative rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <motion.span
                className="text-sm font-semibold text-gray-900 dark:text-white"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {totalSaves.toLocaleString()}
              </motion.span>
              <span className="text-xs text-gray-500">saved</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-amber-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
          <div className="absolute -inset-1 rounded-xl bg-amber-500/10 blur-md opacity-0 transition-opacity group-hover/stat:opacity-50" />
        </div>
      </motion.div>

      {/* Enhanced CTA with multiple interaction layers */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="inline-block"
      >
        <Link
          href="#shorts-grid"
          className="group/cta relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40 active:scale-95"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%]"
            animate={{
              x: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
          />

          {/* Content with sparkles */}
          <span className="relative z-10 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Start Reading
            <Sparkles className="h-4 w-4 transition-transform group-hover/cta:rotate-12" />
          </span>

          {/* Particle burst on hover */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-white"
                initial={{ scale: 0, opacity: 0 }}
                variants={{
                  hover: {
                    scale: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                    x: [0, (Math.cos(i * 45 * (Math.PI / 180)) * 40)],
                    y: [0, (Math.sin(i * 45 * (Math.PI / 180)) * 40)],
                    transition: {
                      duration: 0.6,
                      delay: i * 0.05,
                    }
                  }
                }}
              />
            ))}
          </div>
        </Link>

        {/* Micro-instruction with gentle pulse */}
        <motion.p
          className="mt-3 text-xs text-gray-500 dark:text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          (Scroll gently – the wisdom finds you)
        </motion.p>
      </motion.div>
    </motion.div>
  </div>

  {/* Scroll hint */}
  <div className="scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2">
    <div className="relative h-10 w-6 rounded-full border border-amber-500/30">
      <motion.div
        className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-amber-500/60"
        animate={{
          y: [0, 16, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  </div>

  <style jsx global>{`
    @keyframes gentlePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.005); }
    }
    
    .pulse-gentle {
      animation: gentlePulse 0.6s ease-in-out;
    }
  `}</style>
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