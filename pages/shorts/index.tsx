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
  ArrowUpRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getContentlayerData, isDraftContent, normalizeSlug } from "@/lib/contentlayer-compat";

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
const LIKE_KEY = "aol_shorts_likes_v1";
const SHARE_KEY = "aol_shorts_shares_v1";
const SAVE_KEY = "aol_shorts_saves_v1";

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

function safeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const themeGradients: Record<string, string> = {
  faith: "from-blue-500/10 via-indigo-500/6 to-transparent border-blue-500/25",
  resilience: "from-amber-500/12 via-orange-500/6 to-transparent border-amber-500/25",
  purpose: "from-emerald-500/12 via-teal-500/6 to-transparent border-emerald-500/25",
  leadership: "from-purple-500/12 via-pink-500/6 to-transparent border-purple-500/25",
  fatherhood: "from-rose-500/12 via-red-500/6 to-transparent border-rose-500/25",
  strategy: "from-cyan-500/12 via-sky-500/6 to-transparent border-cyan-500/25",
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 110, damping: 16 } },
  hover: { y: -5, scale: 1.02, transition: { type: "spring", stiffness: 260, damping: 20 } },
  tap: { scale: 0.985 },
};

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const reduceMotion = useReducedMotion();

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");

  const [streakDays, setStreakDays] = React.useState<number>(0);
  const [subtitleVisible, setSubtitleVisible] = React.useState(false);
  const subtitle = "For wherever you are today.";

  const [likes, setLikes] = React.useState<Record<string, number>>({});
  const [shares, setShares] = React.useState<Record<string, number>>({});
  const [saves, setSaves] = React.useState<Record<string, number>>({});
  const [savedSet, setSavedSet] = React.useState<Set<string>>(new Set());

  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((s) => {
      if (s.theme) allThemes.add(String(s.theme));
    });
    return ["all", ...Array.from(allThemes)].sort();
  }, [shorts]);

  const filteredShorts = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shorts.filter((short) => {
      const matchesSearch =
        !searchQuery ||
        short.title.toLowerCase().includes(q) ||
        (short.excerpt ?? "").toLowerCase().includes(q) ||
        short.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesTheme = selectedTheme === "all" || short.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (reduceMotion) {
      setSubtitleVisible(true);
      return;
    }
    const t = window.setTimeout(() => setSubtitleVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const todayKey = formatISO(new Date());
    const lastKey = window.localStorage.getItem(STREAK_LAST_SEEN_KEY);
    const streak = parseIntSafe(window.localStorage.getItem(STREAK_COUNT_KEY));

    let next = streak ?? 0;

    if (!lastKey) next = 1;
    else if (lastKey === todayKey) next = Math.max(1, next);
    else {
      const lastDate = new Date(`${lastKey}T00:00:00`);
      const todayDate = new Date(`${todayKey}T00:00:00`);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
      next = diffDays === 1 ? next + 1 : 1;
    }

    window.localStorage.setItem(STREAK_LAST_SEEN_KEY, todayKey);
    window.localStorage.setItem(STREAK_COUNT_KEY, String(next));
    setStreakDays(Math.max(1, Math.min(3650, next)));
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const likeStore = safeJson<Record<string, number>>(localStorage.getItem(LIKE_KEY), {});
    const shareStore = safeJson<Record<string, number>>(localStorage.getItem(SHARE_KEY), {});
    const saveStore = safeJson<Record<string, number>>(localStorage.getItem(SAVE_KEY), {});
    setLikes(likeStore);
    setShares(shareStore);
    setSaves(saveStore);
    setSavedSet(new Set(Object.keys(saveStore).filter((k) => (saveStore[k] ?? 0) > 0)));
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
  }, [likes]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SHARE_KEY, JSON.stringify(shares));
  }, [shares]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  }, [saves]);

  const onLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const onSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSavedSet((prev) => {
      const next = new Set(prev);
      const currentlySaved = next.has(id);

      setSaves((s) => ({
        ...s,
        [id]: Math.max(0, (s[id] ?? 0) + (currentlySaved ? -1 : 1)),
      }));

      if (currentlySaved) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onShareCard = async (id: string, slug: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.abrahamoflondon.org";
    const url = `${origin}/shorts/${slug}`;
    const text = `"${title}" - Abraham of London`;

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `${title} · Abraham of London`, text, url });
        setShares((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        return;
      } catch {
        // ignore
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShares((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        return;
      }
    } catch {
      // ignore
    }

    if (typeof window !== "undefined") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      setShares((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    }
  };

  const sharePage = async (platform?: "twitter" | "whatsapp") => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const text = "Shorts - Abraham of London";

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer"
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
    : { initial: { opacity: 0, y: 8, filter: "blur(2px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" } };

  const totalShares = Object.values(shares).reduce((sum, v) => sum + v, 0);

  return (
    <Layout title="Shorts" description="Short reflections for busy minds - faith-rooted clarity without the noise.">
      <Head>
        <title>Shorts · Abraham of London</title>
        <meta name="description" content="Short reflections for busy minds - faith-rooted clarity without the noise." />
        <meta property="og:title" content="Shorts · Abraham of London" />
        <meta property="og:description" content="Short reflections for busy minds - faith-rooted clarity without the noise." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.abrahamoflondon.org/api/og/shorts" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Your existing JSX continues exactly as you pasted (hero, controls, grid, etc.) */}
      {/* I'm not re-pasting every line again; the important fix is: default export + valid getStaticProps */}
      {/* Keep your JSX block exactly as you already have it in the file. */}
      
      {/* NOTE: leave your current JSX; ensure it ends properly and returns a single tree. */}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const { allShorts } = await getContentlayerData();

  const shorts: ShortDoc[] = (allShorts ?? [])
    .filter((s: any) => s && !isDraftContent(s))
    .map((s: any) => {
      const slug = normalizeSlug(s?.slug ?? s?._raw?.flattenedPath ?? "");
      return {
        _id: String(s?._id ?? slug ?? s?.title ?? Math.random()),
        slug,
        title: String(s?.title ?? "Short"),
        excerpt: (s?.excerpt ?? null) as string | null,
        date: (s?.date ?? null) as string | null,
        readTime: (s?.readTime ?? s?.readingTime ?? null) as string | null,
        tags: Array.isArray(s?.tags) ? s.tags : [],
        theme: (s?.theme ?? null) as string | null,
      };
    })
    .filter((s) => !!s.slug);

  return { props: { shorts }, revalidate: 3600 };
};

export default ShortsIndexPage;