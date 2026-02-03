/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/blog/[slug].tsx — HARDENED (The Tantalizer Terminal)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Loader2, Lock, Eye } from "lucide-react";

// ✅ INSTITUTIONAL COMPONENTS
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import RegistrySidebar from "@/components/RegistrySidebar";
import IntelligenceChain from "@/components/IntelligenceChain";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";

// ✅ UTILITIES
import { getPostBySlug, getPublishedPosts } from "@/lib/content/server";
import { resolveDocCoverImage } from "@/lib/content/client-utils";
import { normalizeSlug } from "@/lib/content/shared";
import { getSeriesData } from "@/lib/content/series-provider";
import { resolveTantalizer, Tantalizer } from "@/lib/content/tantalizer-resolver";
import { useAccess } from "@/hooks/useAccess";

interface BlogProps {
  post: {
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    accessLevel: "public" | "inner-circle" | "private";
    category: string;
    wordCount: number;
    tags: string[];
    readingTime: string;
  };
  tantalizer: Tantalizer;
  series: any | null;
  initialSource: any;
  jsonLd: any;
}

const BlogSlugPage: NextPage<BlogProps> = ({ post, tantalizer, series, initialSource, jsonLd }) => {
  const router = useRouter();
  const { hasClearance, verify, isValidating } = useAccess();
  const [source, setSource] = React.useState(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  const isAuthorized = hasClearance(post.accessLevel);

  const fetchSecureContent = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/canon/${encodeURIComponent(post.slug)}`);
      const json = await res.json();
      if (res.ok && json.source) setSource(json.source);
    } catch (e) {
      console.error("[DECRYPT_ERROR]", e);
    } finally {
      setLoadingContent(false);
    }
  }, [post.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && !source) fetchSecureContent();
  }, [isAuthorized, source, fetchSecureContent]);

  if (router.isFallback) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>;

  return (
    <Layout title={post.title} description={post.excerpt} structuredData={jsonLd}>
      {series && <IntelligenceChain {...series} />}

      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-16 py-20 lg:py-32">
        <article className="flex-1 min-w-0 selection:bg-amber-500/30">
          <header className="mb-20 border-b border-white/5 pb-16">
            <div className="flex items-center gap-6 mb-8">
               <span className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em]">Intelligence Dispatch</span>
               <span className="h-[1px] w-12 bg-white/10" />
               <div className="text-zinc-500 font-mono uppercase tracking-widest text-[9px]">{post.date}</div>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic text-white mb-8">{post.title}</h1>
          </header>
          
          <main className="relative">
            {!isAuthorized && !isValidating ? (
              <div className="space-y-0">
                {/* 🎯 THE TANTALIZER VIEW */}
                <div className="relative group">
                  <div className="prose prose-invert prose-amber max-w-none opacity-40 select-none pointer-events-none transition-opacity group-hover:opacity-50">
                    <p className="text-xl leading-relaxed italic text-zinc-300 mb-8">{post.excerpt}</p>
                    <div className="text-zinc-400 leading-relaxed font-light">
                      {tantalizer.content}
                    </div>
                  </div>
                  {/* FADE GRADIENT */}
                  <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
                </div>

                {/* CONVERSION INTERFACE */}
                <div className="relative z-20 -mt-32 pb-20">
                  <AccessGate 
                    title={post.title}
                    message={`This ${post.category} analysis is classified. Elevate clearance to access the remaining ${post.wordCount - tantalizer.wordCount} words.`}
                    requiredTier={post.accessLevel} 
                    onUnlocked={() => verify()} 
                  />
                </div>
              </div>
            ) : (
              <div className="relative min-h-[400px]">
                {loadingContent && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 py-20 text-amber-500 z-50 bg-black/90 backdrop-blur-sm border border-white/5">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.5em]">Decrypting Transmission...</span>
                  </div>
                )}
                <div className={loadingContent ? "opacity-20 blur-md grayscale" : "opacity-100 transition-all duration-1000"}>
                  <MDXLayoutRenderer source={source} />
                </div>
              </div>
            )}
          </main>
        </article>

        <RegistrySidebar 
          metadata={{
            readingTime: post.readingTime,
            wordCount: post.wordCount,
            classification: post.accessLevel,
            category: post.category,
            tags: post.tags,
            date: post.date
          }} 
        />
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts() || [];
  const paths = posts.map(p => ({
    params: { slug: normalizeSlug(p.slug || p._raw?.flattenedPath || "").replace(/^blog\//, "") }
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug || "");
  const postRaw = getPostBySlug(slug);

  if (!postRaw || postRaw.draft) return { notFound: true };

  const tantalizer = resolveTantalizer(postRaw);
  const wordCount = (postRaw.body?.raw || "").split(/\s+/).filter(Boolean).length;
  
  const post = {
    title: String(postRaw.title || "Untitled Intelligence"),
    excerpt: String(postRaw.excerpt || ""),
    date: postRaw.date ? String(postRaw.date) : "2026-ARCHIVE",
    slug,
    accessLevel: (postRaw.accessLevel || "inner-circle") as any,
    category: postRaw.category || "Strategic Briefing",
    wordCount,
    tags: postRaw.tags || [],
    readingTime: `${Math.ceil(wordCount / 225)} min`
  };

  const series = getSeriesData(slug);
  const jsonLd = postRaw.structuredData ? JSON.parse(JSON.stringify(postRaw.structuredData)) : null;

  let initialSource = null;
  if (post.accessLevel === "public" && postRaw.body?.raw) {
    initialSource = await serialize(postRaw.body.raw, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }
    });
  }

  return {
    props: { post, tantalizer, series, initialSource, jsonLd },
    revalidate: 1800
  };
};

export default BlogSlugPage;