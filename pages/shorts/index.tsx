/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/index.tsx — SHORTS CHAMBER (intentional restrained edition)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Grid, List, Sparkles, ArrowUpRight } from "lucide-react";

import Layout from "@/components/Layout";
import ShortCard from "@/components/ShortCard";
import {
  getAllCombinedDocs,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";
import {
  readImprint,
  writeImprint,
  computeWhisper,
  getOrCreateSeed,
  updateStreak,
  updateVisitCount,
  cleanSlugForURL,
} from "@/lib/shorts/brand";

/* -----------------------------------------------------------------------------
  UTILITIES
----------------------------------------------------------------------------- */
function safeStartsWith(v: unknown, prefix: string) {
  return typeof v === "string" && v.startsWith(prefix);
}

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(n: unknown, fallback = 0) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function toShortUrlSlug(input: unknown) {
  return cleanSlugForURL(normalizeSlug(safeString(input)));
}

/* -----------------------------------------------------------------------------
  HERO — PARTICULATE / SMOKED-GLASS BACKDROP
----------------------------------------------------------------------------- */
function VelvetBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.028),transparent_28%),radial-gradient(circle_at_18%_24%,rgba(245,158,11,0.085),transparent_24%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.038),transparent_20%),radial-gradient(circle_at_50%_78%,rgba(245,158,11,0.038),transparent_28%),linear-gradient(180deg,rgba(8,8,9,0.97)_0%,rgba(4,4,5,0.99)_56%,rgba(0,0,0,1)_100%)]" />

      <div className="absolute inset-0 opacity-[0.38]">
        <div className="absolute left-1/2 top-[16%] h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-white/[0.028] blur-[110px]" />
        <div className="absolute left-[15%] top-[23%] h-[16rem] w-[16rem] rounded-full bg-amber-400/[0.055] blur-[108px]" />
        <div className="absolute right-[13%] top-[18%] h-[14rem] w-[14rem] rounded-full bg-white/[0.03] blur-[96px]" />
        <div className="absolute bottom-[8%] left-1/2 h-[12rem] w-[32rem] -translate-x-1/2 rounded-full bg-amber-300/[0.03] blur-[110px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 20%, rgba(255,255,255,0.84) 0.6px, transparent 1.2px),
            radial-gradient(circle at 24% 72%, rgba(255,255,255,0.58) 0.7px, transparent 1.4px),
            radial-gradient(circle at 38% 34%, rgba(251,191,36,0.66) 0.7px, transparent 1.5px),
            radial-gradient(circle at 52% 18%, rgba(255,255,255,0.68) 0.8px, transparent 1.5px),
            radial-gradient(circle at 68% 62%, rgba(255,255,255,0.64) 0.65px, transparent 1.3px),
            radial-gradient(circle at 82% 28%, rgba(251,191,36,0.56) 0.75px, transparent 1.5px),
            radial-gradient(circle at 90% 78%, rgba(255,255,255,0.72) 0.6px, transparent 1.3px)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 0.45px, transparent 0.95px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(circle at 50% 38%, black, rgba(0,0,0,0.75) 40%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 38%, black, rgba(0,0,0,0.75) 40%, transparent 82%)",
        }}
      />

      <motion.div
        className="absolute inset-0 opacity-[0.06]"
        animate={{ y: [0, -4, 0], opacity: [0.05, 0.075, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.76) 0.45px, transparent 0.95px)",
          backgroundSize: "30px 30px",
          maskImage:
            "radial-gradient(circle at 50% 36%, black, rgba(0,0,0,0.72) 40%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 36%, black, rgba(0,0,0,0.72) 40%, transparent 82%)",
        }}
      />

      <div className="absolute inset-0">
        <div className="absolute left-[16%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
        <div className="absolute left-[34%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.035] to-transparent" />
        <div className="absolute right-[28%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
        <div className="absolute right-[12%] top-0 h-full w-px bg-gradient-to-b from-transparent via-amber-400/[0.06] to-transparent" />
      </div>

      <div className="absolute inset-x-[7%] top-[18%] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-[10%] bottom-[14%] h-px bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />

      <div className="absolute inset-[4.5%] border border-white/[0.045]" />
      <div className="absolute inset-x-[8%] inset-y-[10%] border border-white/[0.025]" />

      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.02)_34%,transparent_52%,transparent_100%)]" />

      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/46 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="absolute inset-0 aol-velvet-grain" />

      <style jsx global>{`
        .aol-velvet-grain {
          opacity: 0.013;
          mix-blend-mode: soft-light;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 420 420' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.22' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E");
          background-size: 420px 420px;
        }
      `}</style>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Stats Ribbon
----------------------------------------------------------------------------- */
function EliteStatsRibbon({
  streak,
  totalCount,
  visits,
}: {
  streak: number;
  totalCount: number;
  visits: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.08, ease: [0.19, 1, 0.22, 1] }}
      className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.10] bg-white/[0.03] px-5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      <div className="relative mr-1 flex h-2 w-2 items-center justify-center">
        <div
          className="absolute h-2 w-2 animate-ping rounded-full bg-amber-500/24"
          style={{ animationDuration: "2.6s" }}
        />
        <div className="relative h-1.5 w-1.5 rounded-full bg-amber-500/78 shadow-[0_0_10px_rgba(245,158,11,0.20)]" />
      </div>

      <span className="text-[8px] font-mono font-light uppercase tracking-[0.28em] text-white/42">
        Indexed
      </span>

      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono font-medium tabular-nums text-white/86">
          {totalCount}
        </span>
        <span className="text-[8px] font-mono font-light uppercase tracking-[0.18em] text-white/36">
          notes
        </span>
      </div>

      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono font-medium tabular-nums text-white/86">
          {streak}
        </span>
        <span className="text-[8px] font-mono font-light uppercase tracking-[0.18em] text-white/36">
          streak
        </span>
      </div>

      <span className="text-white/[0.10]" aria-hidden>
        •
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-mono font-medium tabular-nums text-white/86">
          {visits}
        </span>
        <span className="text-[8px] font-mono font-light uppercase tracking-[0.18em] text-white/36">
          visits
        </span>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Whisper
----------------------------------------------------------------------------- */
function WhisperPill({ text, rare }: { text: string; rare: boolean }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.05, delay: 0.26, ease: [0.19, 1, 0.22, 1] }}
      className={[
        "inline-flex items-center gap-3 rounded-full px-5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        rare
          ? "border border-amber-500/[0.20] bg-amber-500/[0.05]"
          : "border border-white/[0.10] bg-white/[0.028]",
      ].join(" ")}
    >
      <Sparkles
        className={`h-3 w-3 ${rare ? "text-amber-400/74" : "text-white/24"}`}
        strokeWidth={1.5}
      />
      <span
        className={`text-[10px] font-light ${
          rare ? "text-amber-300/86" : "text-white/54"
        }`}
      >
        {text}
      </span>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  HERO — Quiet page links
----------------------------------------------------------------------------- */
function HeroPageLinks() {
  const links = [
    { href: "/canon", label: "Canon" },
    { href: "/books", label: "Books" },
    { href: "/essays", label: "Essays" },
    { href: "/vault/briefs", label: "Briefs" },
    { href: "/ventures", label: "Ventures" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.05, delay: 0.24, ease: [0.19, 1, 0.22, 1] }}
      className="mt-7 flex justify-center"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {links.map((link, i) => (
          <React.Fragment key={link.href}>
            <Link
              href={link.href}
              className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/34 transition-colors duration-500 hover:text-amber-300/72"
            >
              {link.label}
            </Link>
            {i < links.length - 1 ? (
              <span className="text-[9px] text-white/14" aria-hidden>
                •
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  HERO
----------------------------------------------------------------------------- */
function ShortsHeroEmptyVelvet({
  streak,
  totalCount,
  visits,
  whisper,
  isRareWhisper,
}: {
  streak: number;
  totalCount: number;
  visits: number;
  whisper: string;
  isRareWhisper: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] bg-black">
      <div
        className="relative"
        style={{
          height: "44vh",
          minHeight: 400,
          maxHeight: 520,
        }}
      >
        <VelvetBackdrop />

        <div
          className="relative z-10 mx-auto grid h-full max-w-7xl px-6"
          style={{
            gridTemplateRows: "auto 1fr auto",
            paddingTop: 34,
            paddingBottom: 14,
          }}
        >
          <div className="flex justify-center">
            <EliteStatsRibbon
              streak={streak}
              totalCount={totalCount}
              visits={visits}
            />
          </div>

          <div className="flex items-center justify-center">
            <div className="relative mx-auto max-w-5xl text-center">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-[214px] w-[min(820px,90vw)] rounded-[34px] border border-white/[0.065] bg-white/[0.018] shadow-[0_16px_60px_rgba(0,0,0,0.28)] backdrop-blur-[7px]" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="mb-5"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.10] bg-white/[0.028] px-5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                  <span className="text-[9px] font-mono font-light uppercase tracking-[0.35em] text-amber-400/76">
                    Shorts
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/18" aria-hidden />
                  <span className="text-[9px] font-mono font-light uppercase tracking-[0.22em] text-white/42">
                    Notes · Alignment · Signal
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.95,
                  delay: 0.05,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="font-serif font-extralight text-white"
                style={{
                  fontSize: "clamp(2.9rem, 7.6vw, 5.3rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.045em",
                  textShadow: "0 10px 34px rgba(0,0,0,0.42)",
                }}
              >
                Shorts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.12,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mx-auto mt-6 max-w-3xl font-light text-white/80"
                style={{
                  fontSize: "clamp(0.98rem, 1.22vw, 1.1rem)",
                  lineHeight: 1.8,
                  textShadow: "0 8px 20px rgba(0,0,0,0.30)",
                }}
              >
                Small doses. Clear signal.
                <br />
                <span className="text-white/54">
                  Compact notes for alignment, thought, and direction.
                </span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 1.05,
                  delay: 0.18,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mt-7"
              >
                <div className="inline-flex items-center gap-4 rounded-full border border-white/[0.10] bg-white/[0.026] px-5 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.16)] backdrop-blur-lg">
                  <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/68">
                    Built to survive scrutiny
                  </span>
                  <span className="h-3 w-px bg-gradient-to-b from-transparent via-amber-500/45 to-transparent" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-amber-300/82">
                    Designed to ship
                  </span>
                </div>
              </motion.div>

              <div className="mx-auto mt-6 max-w-xl">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <HeroPageLinks />
            </div>
          </div>

          <div className="flex justify-center">
            <WhisperPill text={whisper} rare={isRareWhisper} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/58 to-transparent" />
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  IMPRINT LINE
----------------------------------------------------------------------------- */
function ImprintLine({
  imprintTitle,
  hoursRemaining,
  fadePercent,
}: {
  imprintTitle?: string;
  hoursRemaining?: number;
  fadePercent?: number;
}) {
  if (!imprintTitle) return null;

  const opacity = clamp(1 - (fadePercent || 0) / 115, 0.2, 1);

  return (
    <div className="border-t border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25">
            Last Read
          </span>
          <span className="text-[9px] font-mono text-white/18">
            {hoursRemaining && hoursRemaining > 0
              ? `${hoursRemaining}h ago`
              : "fading"}
          </span>
        </div>
        <p
          className="text-center font-serif text-lg italic leading-relaxed text-white/45"
          style={{ opacity }}
        >
          "{imprintTitle}"
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  FEATURED NOTES
----------------------------------------------------------------------------- */
type FeaturedItem = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
};

function FeaturedNoteCard({ item }: { item: FeaturedItem }) {
  const href = `/shorts/${item.slug}`;

  return (
    <Link
      href={href}
      className="group block border-l border-white/10 py-4 pl-6 transition-all duration-500 hover:border-amber-500/30 hover:pl-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300/60">
              {item.category || "Intel"}
            </span>
            <span className="text-white/15">•</span>
            <span className="text-[9px] text-white/30">
              {item.readTime || "2 min"}
            </span>
          </div>

          <h3 className="mb-2 font-serif text-base leading-snug text-white/85 transition-colors group-hover:text-white">
            {item.title}
          </h3>

          <p className="line-clamp-2 text-sm leading-relaxed text-white/40 transition-colors group-hover:text-white/52">
            {item.excerpt}
          </p>
        </div>

        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/20 transition-all group-hover:text-amber-300/75" />
      </div>
    </Link>
  );
}

function FeaturedGrid({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-y border-white/10 bg-black/25">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35">
            Featured Notes
          </h2>
          <span className="text-[9px] font-mono text-white/18">
            Take one • Leave • Return
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <FeaturedNoteCard key={item._id || item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
const ShortsIndexPage: NextPage<any> = ({ shorts, totalCount }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [streak, setStreak] = React.useState(1);
  const [visitCount, setVisitCount] = React.useState(1);
  const [whisper, setWhisper] = React.useState("");
  const [isRareWhisper, setIsRareWhisper] = React.useState(false);
  const [imprint, setImprint] = React.useState<any>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setStreak(updateStreak());
    setVisitCount(updateVisitCount());
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = getOrCreateSeed();
    const out = computeWhisper({ seed, visitCount, now: new Date() });
    setWhisper(out.text);
    setIsRareWhisper(out.isRare);
  }, [visitCount]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setImprint(readImprint());
    const interval = setInterval(() => setImprint(readImprint()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const q = searchQuery.trim().toLowerCase();

  const filtered = React.useMemo(() => {
    const list = Array.isArray(shorts) ? shorts : [];
    if (!q) return list;

    return list.filter((s: any) => {
      const t = safeString(s?.title).toLowerCase();
      const e = safeString(s?.excerpt).toLowerCase();
      const c = safeString(s?.category).toLowerCase();
      return t.includes(q) || e.includes(q) || c.includes(q);
    });
  }, [shorts, q]);

  const featured: FeaturedItem[] = React.useMemo(() => {
    const list = Array.isArray(filtered) ? filtered : [];
    return list.slice(0, 6).map((s: any) => ({
      _id: safeString(s?._id),
      slug: toShortUrlSlug(s?.slug),
      title: safeString(s?.title) || "Untitled",
      excerpt: safeString(s?.excerpt) || "",
      category: safeString(s?.category || "Intel"),
      readTime: safeString(s?.readTime || "2 min"),
    }));
  }, [filtered]);

  return (
    <Layout
      title="Shorts // Abraham of London"
      className="min-h-screen bg-black text-white selection:bg-amber-500/10"
      fullWidth
      headerTransparent
      canonicalUrl="/shorts"
      minimalHeader
      showFooter={false}
      enableVaultSearch={false}
    >
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      <ShortsHeroEmptyVelvet
        streak={streak}
        totalCount={totalCount}
        visits={visitCount}
        whisper={whisper}
        isRareWhisper={isRareWhisper}
      />

      <ImprintLine
        imprintTitle={imprint?.title}
        hoursRemaining={imprint?._hoursRemaining}
        fadePercent={imprint?._fadePercent}
      />

      <FeaturedGrid items={featured} />

      <div
        ref={listRef}
        className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="group relative max-w-md flex-1">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-white/45" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none bg-transparent py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/25 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-2 transition-all ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-white/30 hover:text-white/55"
              }`}
              aria-label="Grid view"
              type="button"
            >
              <Grid className="h-4 w-4" />
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-2 transition-all ${
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-white/30 hover:text-white/55"
              }`}
              aria-label="List view"
              type="button"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={
             viewMode === "grid"
             ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
             : "mx-auto max-w-3xl space-y-5"
              }
          >
            {filtered.map((short: any) => {
              const rawSlug = safeString(short?.slug);
              const cleanSlug = toShortUrlSlug(rawSlug);
              const key =
                safeString(short?._id) ||
                cleanSlug ||
                safeString(short?.title);

              return (
                <ShortCard
                  key={key}
                  short={{
                    slug: cleanSlug,
                    title: safeString(short?.title) || "Untitled",
                    excerpt: safeString(short?.excerpt) || "",
                    category: safeString(short?.category || "Intel"),
                    readTime: safeString(short?.readTime || "2 min"),
                    views: safeNumber(short?.views || 0),
                    intensity: (short?.intensity || 3) as 1 | 2 | 3 | 4 | 5,
                    lineage: safeString(short?.lineage || "") || null,
                    coverImage: safeString(short?.coverImage || "") || null,
                    metrics: {
                      likes: safeNumber(short?.likes, 0),
                      saves: safeNumber(short?.saves, 0),
                      views: safeNumber(short?.views, 0),
                    },
                    state: {
                      liked: Boolean(short?.likedByMe),
                      saved: Boolean(short?.savedByMe),
                    },
                  }}
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    writeImprint(
                      cleanSlug,
                      safeString(short?.title) || "Untitled"
                    );
                  }}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

/* -----------------------------------------------------------------------------
  DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps = async () => {
  const allDocuments = getAllCombinedDocs() || [];

  const shorts = allDocuments
    .filter(
      (d: any) =>
        safeStartsWith(d?.slug, "shorts/") ||
        safeStartsWith(d?._raw?.flattenedPath, "shorts/")
    )
    .sort(
      (a: any, b: any) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()
    )
    .map((s: any) => {
      const rawSlug = safeString(s?.slug || s?._raw?.flattenedPath || "");
      const clean = toShortUrlSlug(rawSlug);

      return {
        _id: s?._id || clean,
        slug: clean,
        title: safeString(s?.title) || "Untitled",
        excerpt: safeString(s?.excerpt || s?.description || ""),
        category: safeString(s?.category || "Intel"),
        readTime: safeString(s?.readTime || "2 min"),
        views: Number(s?.views || 0),
        intensity: (s?.intensity || 3) as 1 | 2 | 3 | 4 | 5,
        lineage: safeString(s?.lineage || ""),
        coverImage: safeString(s?.coverImage || ""),
        likes: Number((s as any)?.likes || 0),
        saves: Number((s as any)?.saves || 0),
      };
    });

  return {
    props: {
      shorts: sanitizeData(shorts),
      totalCount: shorts.length,
    },
    revalidate: 3600,
  };
};