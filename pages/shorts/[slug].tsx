/* eslint-disable @typescript-eslint/no-explicit-any */

// pages/shorts/[slug].tsx — HARDENED (Netlify-Resilient / Export-Interop Proof) + Imprint System

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { motion, useScroll, useTransform } from "framer-motion";
import { Share2, ArrowLeft, Shield, Loader2, Bookmark, Clock, Eye } from "lucide-react";

// ✅ INSTITUTIONAL IMPORTS
import Layout from "@/components/Layout";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

// 💡 FIX: Import directly from the source file rather than an index barrel
import { 
  getAllContentlayerDocs, 
  getDocBySlug, 
  normalizeSlug, 
  sanitizeData 
} from "@/lib/content/server";
import { isDraftContent } from "@/lib/content/shared";

// ✅ DYNAMIC UI COMPONENTS
const ShortComments = dynamic(() => import("@/components/shorts/ShortComments"), { ssr: false });
const ShortNavigation = dynamic(() => import("@/components/shorts/ShortNavigation"), { ssr: false });

/* -----------------------------------------------------------------------------
  UTILITIES
----------------------------------------------------------------------------- */
function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

// Helper to clean slugs for URLs (removes duplicates and ensures proper format)
function cleanSlugForURL(slug: string): string {
  if (!slug) return "";
  return slug
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/^shorts\//i, '') // Remove 'shorts/' prefix
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .trim();
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
};

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const ShortPage: NextPage<Props> = ({ short, source, mdxRaw }) => {
  const router = useRouter();
  const { scrollYProgress } = useScroll();

  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: false,
      }),
    [mdxRaw]
  );

  // 🎯 IMPRINT SYSTEM: Write to localStorage on every view
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
        expiresAt: now + HOURS_72
      };
      
      localStorage.setItem(IMPRINT_KEY, JSON.stringify(imprint));
      
      // Also add to history (keep last 5)
      const historyKey = "aol_shorts_imprint_history";
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const filteredHistory = existingHistory.filter((item: any) => item.slug !== short.slugPath);
      const newHistory = [imprint, ...filteredHistory.slice(0, 4)]; // Keep 5 most recent
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
      
    } catch {
      // Silent fail — imprint system is non-critical
    }
  }, [short.slugPath, short.title, short.excerpt, short.date]);

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <Layout title={`${short.title} | Field Note`} className="bg-black">
      <Head>
        <title>{short.title} | Shorts // Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/shorts/${short.slugPath}`} />
      </Head>

      {/* Reading progress indicator */}
      <motion.div style={{ width: progressLine }} className="fixed top-0 left-0 h-[1px] bg-amber-500 z-[100]" />

      {/* Minimal navigation */}
      <motion.nav
        style={{ opacity: navOpacity }}
        className="fixed top-0 inset-x-0 z-50 px-8 py-10 flex justify-between items-center pointer-events-none"
      >
        <button
          onClick={() => router.push("/shorts")}
          className="p-3 hover:bg-white/5 rounded-full transition-colors group pointer-events-auto"
        >
          <ArrowLeft className="h-5 w-5 text-white/30 group-hover:text-amber-500" />
        </button>

        <div className="font-mono text-[9px] tracking-[0.5em] text-white/10 uppercase flex items-center gap-2">
          <Shield size={12} className="text-amber-500/20" /> Secure Briefing
        </div>

        <button 
          className="p-3 hover:bg-white/5 rounded-full group pointer-events-auto" 
          aria-label="Save for later"
          onClick={() => {
            try {
              const bookmarks = JSON.parse(localStorage.getItem("aol_shorts_bookmarks") || "[]");
              if (!bookmarks.some((b: any) => b.slug === short.slugPath)) {
                bookmarks.push({
                  slug: short.slugPath,
                  title: short.title,
                  date: new Date().toISOString()
                });
                localStorage.setItem("aol_shorts_bookmarks", JSON.stringify(bookmarks));
              }
            } catch {}
          }}
        >
          <Bookmark size={16} className="text-white/30 group-hover:text-amber-500" />
        </button>
      </motion.nav>

      <main className="max-w-2xl mx-auto px-6 pt-56 pb-40">
        {/* Header with metadata */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="font-mono text-[10px] text-amber-500/60 uppercase tracking-[0.6em]">
              {short.category || "Tactical"}
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <div className="flex items-center gap-2 text-white/30 font-mono text-[10px] tracking-wider">
              <Clock size={10} />
              {short.readTime || "3 min"}
            </div>
            {short.views > 0 && (
              <>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="flex items-center gap-2 text-white/30 font-mono text-[10px] tracking-wider">
                  <Eye size={10} />
                  {short.views.toLocaleString()}
                </div>
              </>
            )}
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl italic leading-tight text-white mb-8 tracking-tight">
            {short.title}
          </h1>
          
          {short.excerpt && (
            <p className="text-white/50 text-lg font-light leading-relaxed max-w-3xl mb-6">
              {short.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-wider">
              {short.date || "Undated"}
            </div>
            <button 
              className="p-2 hover:bg-white/5 rounded transition-colors group"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              <Share2 size={14} className="text-white/20 group-hover:text-amber-500" />
            </button>
          </div>
        </header>

        {/* Article content */}
        <article className="prose prose-invert prose-amber max-w-none prose-p:text-white/60 prose-p:text-lg prose-p:leading-[1.8] prose-p:font-light prose-headings:text-white prose-headings:font-serif prose-headings:italic">
          {source && <MDXRemote {...source} components={safeComponents as any} />}
        </article>

        {/* Footer with tags and navigation */}
        <footer className="mt-32 pt-16 border-t border-white/[0.05]">
          {short.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-16">
              {short.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono text-white/20 border border-white/5 px-3 py-1 rounded-full hover:border-amber-500/20 hover:text-amber-500/40 transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-24">
            <ShortNavigation currentSlug={short.slugPath} />
            <ShortComments shortId={short.slugPath} comments={[]} />
          </div>

          {/* Imprint indicator (subtle) */}
          <div className="mt-24 pt-12 border-t border-white/[0.02]">
            <div className="font-mono text-[10px] text-white/10 uppercase tracking-[0.5em] text-center">
              Imprint recorded • Return when ready
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
  // Ensure the docs are fetched at build time correctly
  const docs = getAllContentlayerDocs() || [];

  const shorts = docs.filter((d: any) => {
    const type = String(d?.type || d?._raw?.sourceFilePath?.split('/')[0] || "").toLowerCase();
    return type.includes("short");
  });

  const paths = shorts
    .filter((s: any) => !isDraftContent(s))
    .map((s: any) => {
      const raw = s.slug || s._raw.flattenedPath;
      const bare = cleanSlugForURL(normalizeSlug(raw));
      
      // Skip empty or invalid slugs
      if (!bare) return null;
      
      return { params: { slug: bare } };
    })
    .filter(Boolean); // Remove null entries

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const rawSlug = String(params?.slug || "").trim();
    if (!rawSlug) return { notFound: true };
    
    // FIX: Clean the incoming slug parameter
    const slug = cleanSlugForURL(rawSlug);
    
    // Unified lookup through your routing utility
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
      slugPath: slug, // Use cleaned slug
      readTime: (data as any)?.readTime || "3 min",
      theme: (data as any)?.theme || null,
      views: Number((data as any)?.views || 0),
      category: (data as any)?.category || "Intel",
    };

    return {
      props: sanitizeData({
        short,
        source,
        mdxRaw,
      }),
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Shorts Build Error:", err);
    return { notFound: true };
  }
};

export default ShortPage;