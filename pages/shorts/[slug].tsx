/* eslint-disable @typescript-eslint/no-explicit-any */

// pages/shorts/[slug].tsx — HARRODS-LEVEL PREMIUM (Export-safe)
// Router-free to prevent "NextRouter was not mounted" during prerender/export.

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Share2,
  ArrowLeft,
  Shield,
  Bookmark,
  Clock,
  Eye,
  Sparkles,
  TrendingUp,
  Award,
  Feather,
  Volume2,
} from "lucide-react";

// ✅ INSTITUTIONAL IMPORTS
import Layout from "@/components/Layout";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

// 💡 Content utilities (server-side safe in GSP)
import { getAllContentlayerDocs, getDocBySlug, normalizeSlug, sanitizeData } from "@/lib/content/server";
import { isDraftContent } from "@/lib/content/shared";

// ✅ DYNAMIC UI COMPONENTS (lazy-loaded for performance)
const ShortComments = dynamic(() => import("@/components/shorts/ShortComments"), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-2xl" />,
});
const ShortNavigation = dynamic(() => import("@/components/shorts/ShortNavigation"), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse bg-white/5 rounded-2xl" />,
});

/* -----------------------------------------------------------------------------
  UTILITIES
----------------------------------------------------------------------------- */
function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function cleanSlugForURL(slug: string): string {
  if (!slug) return "";
  return slug
    .replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
    .replace(/^shorts\//i, "") // Remove 'shorts/' prefix
    .replace(/\/+/g, "/") // Remove duplicate slashes
    .trim();
}

function toAbsoluteUrl(pathOrUrl: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
  const p = safeString(pathOrUrl);
  if (!p) return base;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Short = {
  title: string;
  excerpt: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  url: string;
  slugPath: string;
  readTime: string | null;
  theme: string | null;
  views: number;
  category?: string;
  intensity?: 1 | 2 | 3 | 4 | 5;
  lineage?: string;
};

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  PREMIUM COMPONENTS
----------------------------------------------------------------------------- */
const SignalStrength = ({ level = 3 }: { level?: 1 | 2 | 3 | 4 | 5 }) => {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-0.5 h-3 rounded-full transition-all ${bar <= level ? "bg-amber-500" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
};

const ReadingProgress = ({ progress }: { progress: string }) => (
  <motion.div
    style={{ width: progress }}
    className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 z-[100] shadow-lg shadow-amber-500/20"
  />
);

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const ShortPage: NextPage<Props> = ({ short, source, mdxRaw }) => {
  const { scrollYProgress } = useScroll();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [showShareTooltip, setShowShareTooltip] = React.useState(false);

  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: false,
      }),
    [mdxRaw]
  );

  // 🎯 IMPRINT SYSTEM: localStorage view tracking (client-only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const IMPRINT_KEY = "aol_shorts_imprint_last";
      const now = Date.now();
      const HOURS_72 = 72 * 60 * 60 * 1000;

      const imprint = {
        slug: short.slugPath,
        title: short.title,
        ts: now,
        expiresAt: now + HOURS_72,
      };

      localStorage.setItem(IMPRINT_KEY, JSON.stringify(imprint));

      const historyKey = "aol_shorts_imprint_history";
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const filteredHistory = existingHistory.filter((item: any) => item.slug !== short.slugPath);
      const newHistory = [imprint, ...filteredHistory.slice(0, 4)];
      localStorage.setItem(historyKey, JSON.stringify(newHistory));

      const bookmarks = JSON.parse(localStorage.getItem("aol_shorts_bookmarks") || "[]");
      setIsBookmarked(bookmarks.some((b: any) => b.slug === short.slugPath));
    } catch {
      // non-critical
    }
  }, [short.slugPath, short.title]);

  const handleBookmark = () => {
    if (typeof window === "undefined") return;

    try {
      const current = JSON.parse(localStorage.getItem("aol_shorts_bookmarks") || "[]");

      if (!isBookmarked) {
        const next = [
          ...current,
          {
            slug: short.slugPath,
            title: short.title,
            date: new Date().toISOString(),
          },
        ];
        localStorage.setItem("aol_shorts_bookmarks", JSON.stringify(next));
        setIsBookmarked(true);
      } else {
        const next = current.filter((b: any) => b.slug !== short.slugPath);
        localStorage.setItem("aol_shorts_bookmarks", JSON.stringify(next));
        setIsBookmarked(false);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    } catch {}
  };

  const canonical = toAbsoluteUrl(`/shorts/${encodeURIComponent(short.slugPath)}`);

  return (
    <Layout title={`${short.title} | Field Note`} className="bg-black" canonicalUrl={`/shorts/${short.slugPath}`}>
      <Head>
        <title>{short.title} | Shorts // Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={short.title} />
        <meta property="og:description" content={short.excerpt || ""} />
        {short.coverImage ? <meta property="og:image" content={toAbsoluteUrl(short.coverImage)} /> : null}
        <link rel="canonical" href={canonical} />
      </Head>

      <ReadingProgress progress={progressLine as any} />

      {/* Premium navigation */}
      <motion.nav
        style={{ opacity: navOpacity }}
        className="fixed top-0 inset-x-0 z-50 px-6 md:px-12 py-6 flex justify-between items-center pointer-events-none"
      >
        <Link
          href="/shorts"
          className="p-3 bg-black/40 backdrop-blur-md border border-white/5 rounded-full hover:border-amber-500/30 transition-all duration-300 group pointer-events-auto inline-flex"
          aria-label="Back to Shorts"
        >
          <ArrowLeft className="h-4 w-4 text-white/40 group-hover:text-amber-500" />
        </Link>

        <div className="flex items-center gap-4 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-full">
          <Shield size={12} className="text-amber-500/40" />
          <span className="font-mono text-[8px] tracking-[0.4em] text-white/30 uppercase">Secure Briefing</span>
          <SignalStrength level={short.intensity || 3} />
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {showShareTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
              >
                <span className="text-[10px] font-mono text-amber-500">Link copied</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-black/40 backdrop-blur-md border border-white/5 rounded-full hover:border-amber-500/30 transition-all duration-300 group pointer-events-auto"
            onClick={handleShare}
          >
            <Share2 size={16} className="text-white/40 group-hover:text-amber-500" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-black/40 backdrop-blur-md border border-white/5 rounded-full hover:border-amber-500/30 transition-all duration-300 group pointer-events-auto"
            onClick={handleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark
              size={16}
              className={`transition-colors ${
                isBookmarked ? "text-amber-500 fill-amber-500" : "text-white/40 group-hover:text-amber-500"
              }`}
            />
          </motion.button>
        </div>
      </motion.nav>

      {/* Premium header section */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        {short.coverImage ? (
          <>
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={short.coverImage} alt="" className="h-full w-full object-cover opacity-30" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-black to-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.15),transparent_50%)]" />
          </div>
        )}

        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/3 rounded-full blur-[120px]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-full mb-8"
            >
              <Feather className="h-3 w-3 text-amber-500/60" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
                {short.category || "Tactical Intelligence"}
              </span>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <Clock size={10} className="text-white/30" />
              <span className="font-mono text-[10px] text-white/30">{short.readTime || "3 min"}</span>
              {short.views > 0 && (
                <>
                  <div className="w-1 h-1 bg-white/20 rounded-full" />
                  <Eye size={10} className="text-white/30" />
                  <span className="font-mono text-[10px] text-white/30">{short.views.toLocaleString()}</span>
                </>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-5xl md:text-7xl italic leading-tight text-white mb-8 tracking-tight text-balance"
            >
              {short.title}
            </motion.h1>

            {short.excerpt && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto text-balance"
              >
                {short.excerpt}
              </motion.p>
            )}

            {short.lineage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-full"
              >
                <Volume2 className="h-3 w-3 text-amber-500/40" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-amber-500/60 uppercase">
                  Canon lineage: {short.lineage}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[8px] tracking-[0.4em] text-white/20 uppercase">Continue</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-24">
        <article className="prose prose-invert prose-amber max-w-none prose-p:text-white/60 prose-p:text-lg prose-p:leading-[1.8] prose-p:font-light prose-headings:text-white prose-headings:font-serif prose-headings:italic prose-h2:text-3xl prose-h2:mt-16 prose-h3:text-2xl prose-h3:mt-12 prose-ul:list-none prose-li:text-white/60 prose-li:font-light prose-strong:text-amber-500 prose-strong:font-normal">
          {source ? <MDXRemote {...source} components={safeComponents as any} /> : null}
        </article>

        {/* Tags */}
        {short.tags.length > 0 && (
          <div className="mt-16 pt-16 border-t border-white/[0.02]">
            <div className="font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase mb-6">
              Intelligence markers
            </div>
            <div className="flex flex-wrap gap-2">
              {short.tags.map((tag) => (
                <motion.span
                  key={tag}
                  whileHover={{ scale: 1.05 }}
                  className="text-[10px] font-mono text-white/20 border border-white/5 px-4 py-2 rounded-full hover:border-amber-500/20 hover:text-amber-500/40 transition-all cursor-default"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 space-y-24">
          <ShortNavigation currentSlug={short.slugPath} />
          <ShortComments shortId={short.slugPath} comments={[]} />

          <div className="relative pt-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            </div>
            <div className="relative flex flex-col items-center gap-4">
              <div className="px-6 py-3 bg-black/40 backdrop-blur-md border border-white/5 rounded-full">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-3 w-3 text-amber-500/40" />
                  <span className="font-mono text-[8px] tracking-[0.4em] text-white/20 uppercase">
                    Imprint recorded • Return when ready
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-amber-500/20" />
                <span className="font-mono text-[8px] text-white/10">Signal strength: {short.intensity || 3}/5</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  ROUTING & DATA FETCHING
----------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs() || [];

  const shorts = docs.filter((d: any) => {
    const type = String(d?.type || d?._raw?.sourceFilePath?.split("/")?.[0] || "").toLowerCase();
    return type.includes("short");
  });

  const paths = shorts
    .filter((s: any) => !isDraftContent(s))
    .map((s: any) => {
      const raw = s.slug || s?._raw?.flattenedPath || "";
      const bare = cleanSlugForURL(normalizeSlug(String(raw)));
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean);

  return { paths: paths as any, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const rawSlug = String(params?.slug || "").trim();
    if (!rawSlug) return { notFound: true };

    const slug = cleanSlugForURL(rawSlug);

    const data = getDocBySlug(`shorts/${slug}`) || getDocBySlug(slug);
    if (!data || isDraftContent(data)) return { notFound: true };

    const mdxRaw = String(data?.body?.raw || "");

    const source = mdxRaw
      ? await serialize(mdxRaw, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        })
      : null;

    const short: Short = {
      title: data?.title || "Untitled Brief",
      excerpt: data?.excerpt || data?.description || null,
      date: data?.date ? String(data.date) : null,
      coverImage: data?.coverImage || null,
      tags: Array.isArray(data?.tags) ? data.tags : [],
      author: data?.author || "Abraham of London",
      url: `/shorts/${slug}`,
      slugPath: slug,
      readTime: (data as any)?.readTime || "3 min",
      theme: (data as any)?.theme || null,
      views: Number((data as any)?.views || 0),
      category: (data as any)?.category || "Intel",
      intensity: (data as any)?.intensity || 3,
      lineage: (data as any)?.lineage || null,
    };

    return {
      props: sanitizeData({ short, source, mdxRaw }),
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Shorts Build Error:", err);
    return { notFound: true };
  }
};

export default ShortPage;