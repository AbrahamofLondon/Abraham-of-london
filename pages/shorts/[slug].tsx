/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/shorts/[slug].tsx — PREMIUM BRIEFING (CINEMATIC STAGE UPGRADE + FIXED TIER NORMALIZATION)

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Share2, ArrowLeft, Shield, Bookmark, Clock, Eye, Lock } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

import { getAllContentlayerDocs, getDocBySlug, normalizeSlug, sanitizeData } from "@/lib/content/server";
import { isDraftContent } from "@/lib/content/shared";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

// DYNAMIC UI COMPONENTS
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
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "")
    .replace(/\/+/g, "/")
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
  lineage?: string | null;
};

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
  requiredTier: AccessTier;
}

/* -----------------------------------------------------------------------------
  UI
----------------------------------------------------------------------------- */
const SignalStrength = ({ level = 3 }: { level?: 1 | 2 | 3 | 4 | 5 }) => {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {bars.map((bar) => (
        <div
          key={bar}
          className={[
            "w-0.5 h-3 rounded-full transition-all",
            bar <= level ? "bg-amber-500/80" : "bg-white/10",
          ].join(" ")}
        />
      ))}
    </div>
  );
};

const ReadingProgress = ({ progress }: { progress: string }) => (
  <motion.div
    style={{ width: progress }}
    className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 z-[100] shadow-lg shadow-amber-500/15"
  />
);

function MicroPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-2xl backdrop-fix">
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
  CINEMATIC STAGE (VELVET BLACK - CLEAN, READABLE)
----------------------------------------------------------------------------- */
function ShortStageBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Velvet black foundation */}
      <div className="absolute inset-0 bg-black" />

      {/* Ultra-subtle top glow for depth (NOT visible, just lift) */}
      <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.12),transparent_62%)]" />

      {/* Ultra-fine grain (NOT TV noise - barely perceptible) */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='380'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.45' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_85%,rgba(0,0,0,0.92)_100%)]" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
const ShortPage: NextPage<Props> = ({ short, source, mdxRaw, requiredTier }) => {
  const { data: session, status } = useSession();
  const { scrollYProgress } = useScroll();
  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [showShareTooltip, setShowShareTooltip] = React.useState(false);

  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: false,
      }),
    [mdxRaw]
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const bookmarks = JSON.parse(localStorage.getItem("aol_shorts_bookmarks") || "[]");
      setIsBookmarked(bookmarks.some((b: any) => b.slug === short.slugPath));
    } catch {}
  }, [short.slugPath]);

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

  const handleBookmark = () => {
    if (typeof window === "undefined") return;
    try {
      const current = JSON.parse(localStorage.getItem("aol_shorts_bookmarks") || "[]");
      if (!isBookmarked) {
        const next = [...current, { slug: short.slugPath, title: short.title, date: new Date().toISOString() }];
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

  if (status === "loading") {
    return (
      <Layout title={short.title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={short.title}>
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <AccessGate
            title={short.title}
            requiredTier={required}
            message="This short requires appropriate clearance."
            onGoToJoin={() => (window.location.href = "/inner-circle")}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${short.title} | Shorts`}
      className="bg-black"
      canonicalUrl={`/shorts/${short.slugPath}`}
      headerTransparent
      fullWidth
    >
      <Head>
        <title>{short.title} | Shorts // Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={short.title} />
        <meta property="og:description" content={short.excerpt || ""} />
        {short.coverImage ? <meta property="og:image" content={toAbsoluteUrl(short.coverImage)} /> : null}
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <ReadingProgress progress={progressLine as any} />

      {/* Minimal top nav */}
      <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 pt-6 flex items-center justify-between">
          <Link
            href="/shorts"
            className="pointer-events-auto inline-flex items-center justify-center p-3 rounded-full bg-black/35 border border-white/10 backdrop-blur-2xl backdrop-fix hover:border-amber-500/25 transition-all"
            aria-label="Back to Shorts"
          >
            <ArrowLeft className="h-4 w-4 text-white/40 hover:text-amber-500 transition-colors" />
          </Link>

          <div className="pointer-events-auto flex items-center gap-2">
            <AnimatePresence>
              {showShareTooltip && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
                >
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.35em]">Link copied</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              className="pointer-events-auto p-3 rounded-full bg-black/35 border border-white/10 backdrop-blur-2xl backdrop-fix hover:border-amber-500/25 transition-all"
              onClick={handleShare}
              aria-label="Copy link"
            >
              <Share2 size={16} className="text-white/40 hover:text-amber-500 transition-colors" />
            </button>

            <button
              className="pointer-events-auto p-3 rounded-full bg-black/35 border border-white/10 backdrop-blur-2xl backdrop-fix hover:border-amber-500/25 transition-all"
              onClick={handleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark
                size={16}
                className={isBookmarked ? "text-amber-500 fill-amber-500" : "text-white/40 hover:text-amber-500"}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Velvet stage (clean, readable) */}
      <div className="relative bg-black">
        <ShortStageBackdrop />

        {/* Title block */}
        <header className="relative z-10 mx-auto max-w-[800px] px-6 md:px-10 pt-32 md:pt-36 pb-10 md:pb-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MicroPill>
              <Shield size={12} className="text-amber-500/45" />
              <span className="aol-micro text-white/30">{(short.category || "Intel").toUpperCase()}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <Clock size={12} className="text-white/25" />
              <span className="aol-micro text-white/22">{short.readTime || "3 min"}</span>
              {short.views > 0 ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <Eye size={12} className="text-white/20" />
                  <span className="aol-micro text-white/18">{short.views.toLocaleString()}</span>
                </>
              ) : null}
              {required !== "public" && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <Lock size={10} className="text-amber-500/60" />
                  <span className="aol-micro text-amber-500/60">{required}</span>
                </>
              )}
            </MicroPill>

            <MicroPill>
              <span className="aol-micro text-white/14">PROTOCOL</span>
              <SignalStrength level={short.intensity || 3} />
            </MicroPill>
          </div>

          <h1 className="mt-10 aol-editorial text-white leading-[0.95] tracking-[-0.03em] text-4xl md:text-6xl">
            {short.title}
          </h1>

          {short.excerpt ? (
            <p className="mt-5 text-white/52 text-lg md:text-xl font-light leading-relaxed max-w-[72ch]">
              {short.excerpt}
            </p>
          ) : null}

          <div className="mt-10 aol-hairline w-full" />
        </header>

        {/* Main content - reading column with perfect contrast */}
        <main className="relative z-10 mx-auto max-w-[800px] px-6 md:px-10 pb-24">
          <article className="prose prose-invert prose-amber max-w-none">
            <style jsx global>{`
              /* Make reading effortless (slug page only) */
              .prose {
                color: rgba(255,255,255,0.78);
                line-height: 2.0;
                font-size: 18px;
                max-width: 72ch;
              }
              .prose p {
                color: rgba(255,255,255,0.78);
                line-height: 2.05;
                font-weight: 300;
                margin-bottom: 1.5rem;
              }
              .prose strong {
                color: rgba(255,255,255,0.92);
                font-weight: 500;
              }
              .prose h2, .prose h3, .prose h4 {
                color: rgba(255,255,255,0.94);
                letter-spacing: -0.01em;
                font-weight: 400;
                margin-top: 2rem;
                margin-bottom: 1rem;
              }
              .prose a {
                color: rgba(245,158,11,0.80);
                text-decoration: none;
                border-bottom: 1px solid rgba(245,158,11,0.2);
                transition: all 0.2s ease;
              }
              .prose a:hover {
                color: rgba(245,158,11,0.95);
                border-bottom-color: rgba(245,158,11,0.4);
              }
              .prose blockquote {
                border-left-color: rgba(245,158,11,0.35);
                color: rgba(255,255,255,0.72);
                font-style: italic;
                padding-left: 1.5rem;
                margin-left: 0;
              }
              .prose ul, .prose ol {
                color: rgba(255,255,255,0.78);
                line-height: 1.8;
              }
              .prose li {
                margin-bottom: 0.5rem;
              }
              .prose code {
                color: rgba(245,158,11,0.8);
                background: rgba(0,0,0,0.3);
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                font-size: 0.9em;
              }
              .prose pre {
                background: rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 1rem;
              }
            `}</style>
            {source ? <MDXRemote {...source} components={safeComponents as any} /> : null}
          </article>

          {/* Tags */}
          {short.tags.length > 0 ? (
            <div className="mt-16 pt-14 border-t border-white/[0.06]">
              <div className="aol-micro text-white/18 mb-6">INTELLIGENCE MARKERS</div>
              <div className="flex flex-wrap gap-2">
                {short.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/20 border border-white/10 px-4 py-2 rounded-full hover:border-amber-500/20 hover:text-amber-500/45 transition-all cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Footer */}
          <footer className="mt-20 space-y-16">
            <ShortNavigation currentSlug={short.slugPath} />
            <ShortComments shortId={short.slugPath} comments={[]} />
          </footer>
        </main>
      </div>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  ROUTING & DATA
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

    const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(data));

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
      props: sanitizeData({
        short,
        source,
        mdxRaw,
        requiredTier,
      }),
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Shorts Build Error:", err);
    return { notFound: true };
  }
};

export default ShortPage;