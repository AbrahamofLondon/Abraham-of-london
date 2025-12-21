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
  Search,
  Filter,
  Grid,
  List,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublishedShorts } from "@/lib/contentlayer-helper";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

type ShortDoc = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
};

type Props = {
  shorts: ShortDoc[];
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

const ShortsIndexPage: NextPage<Props> = ({ shorts }) => {
  const reduceMotion = useReducedMotion();

  /* State */
  const [subtitleVisible, setSubtitleVisible] = React.useState(false);
  const [streakDays, setStreakDays] = React.useState(1);

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [search, setSearch] = React.useState("");
  const [theme, setTheme] = React.useState("all");

  /* ───────────────
     Ritual: Streak
  ──────────────── */
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const today = todayKey();
    const last = localStorage.getItem("aol_shorts_last_seen");
    const prev = Number(localStorage.getItem("aol_shorts_streak") || "0");

    let next = 1;

    if (last === today) next = Math.max(1, prev);
    else if (last) {
      const diff =
        (new Date(today).getTime() - new Date(last).getTime()) / 86400000;
      next = diff === 1 ? prev + 1 : 1;
    }

    localStorage.setItem("aol_shorts_last_seen", today);
    localStorage.setItem("aol_shorts_streak", String(next));
    setStreakDays(clamp(next, 1, 3650));

    const t = setTimeout(() => setSubtitleVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  /* ───────────────
     Filters
  ──────────────── */
  const themes = React.useMemo(() => {
    const s = new Set<string>();
    shorts.forEach((x) => x.theme && s.add(x.theme));
    return ["all", ...Array.from(s)];
  }, [shorts]);

  const filtered = shorts.filter((s) => {
    const q = search.toLowerCase();
    const okSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.excerpt?.toLowerCase().includes(q);
    const okTheme = theme === "all" || s.theme === theme;
    return okSearch && okTheme;
  });

  /* ───────────────────────────────────────────── */

  return (
    <Layout
      title="Shorts"
      description="Short reflections for wherever you are today."
    >
      <Head>
        <meta
          name="description"
          content="Short reflections for wherever you are today."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-black dark:via-black dark:to-black">
        {/* ───────────────────────────
            HERO — THE HOME
        ─────────────────────────── */}
        <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
          {/* Ambient architecture */}
          <div className="absolute inset-0" aria-hidden>
            {/* Hearth glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-indigo-500/6" />
            <div className="absolute bottom-[-20%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[120px]" />

            {/* Slow spiritual smoke */}
            {!reduceMotion && (
              <>
                <motion.div
                  className="absolute left-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-white/6 blur-[140px]"
                  animate={{ x: [0, 120, 0], opacity: [0.15, 0.28, 0.15] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute right-[-10%] top-[50%] h-[380px] w-[380px] rounded-full bg-amber-400/8 blur-[140px]"
                  animate={{ x: [0, -120, 0], opacity: [0.12, 0.22, 0.12] }}
                  transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            {/* Quiet vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/30" />
          </div>

          {/* Content */}
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
            {/* Identity marker */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold tracking-widest text-amber-600 dark:text-amber-400">
                SHORTS
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-5xl font-semibold text-gray-900 dark:text-white sm:text-6xl">
              Shorts
            </h1>

            {/* Arrival line */}
            <AnimatePresence>
              {subtitleVisible && (
                reduceMotion ? (
                  <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300">
                    For wherever you are today.
                  </p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300"
                  >
                    For wherever you are today.
                  </motion.p>
                )
              )}
            </AnimatePresence>

            {/* Primary action */}
            <div className="mt-12 flex flex-col items-center gap-6">
              <Link
                href="#shorts"
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:scale-[1.03]"
              >
                <Zap className="h-4 w-4" />
                Begin here
              </Link>

              {/* Gentle accountability */}
              <a
                href="#daily-habit"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-4 py-2 text-xs text-gray-700 backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-gray-300"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Day {streakDays} — steady
                <ChevronRight className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        </section>

        {/* ───────────────────────────
            CONTROLS
        ─────────────────────────── */}
        <section
          id="shorts"
          className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80"
        >
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shorts…"
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-4 text-sm dark:border-white/10 dark:bg-black"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                {themes.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All themes" : t}
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl border border-black/10 dark:border-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-amber-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-amber-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────
            GRID
        ─────────────────────────── */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6">
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {filtered.map((s) => (
                <Link
                  key={s._id}
                  href={`/shorts/${s.slug}`}
                  className="group rounded-2xl border border-black/10 bg-white/60 p-6 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-black/40"
                >
                  <h3 className="font-serif text-xl text-gray-900 dark:text-white">
                    {s.title}
                  </h3>
                  {s.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {s.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {s.readTime || "1 min"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────
            DAILY HABIT
        ─────────────────────────── */}
        <section
          id="daily-habit"
          className="mx-auto max-w-5xl px-6 pb-20"
        >
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black p-10 text-center">
            <h2 className="font-serif text-2xl text-white">
              One a day is enough
            </h2>
            <p className="mt-3 text-gray-300">
              No pressure. No streak anxiety. Just return.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

/* ───────────────────────────────────────────── */

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      shorts: getPublishedShorts(),
    },
    revalidate: 3600,
  };
};

export default ShortsIndexPage;