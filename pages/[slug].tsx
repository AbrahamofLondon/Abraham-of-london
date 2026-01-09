import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import dynamic from "next/dynamic";
import { assertContentlayerHasDocs } from "@/lib/contentlayer-assert";

import Layout from "@/components/Layout";
import {
  getPublishedDocuments,
  getDocHref,
  getDocKind,
  normalizeSlug,
  resolveDocCoverImage,
  getAccessLevel,
  resolveDocDownloadUrl,
  getContentlayerData,
  type DocBase
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

// Dynamically import enhanced components (reduces bundle size)
const SafeReadingProgress = dynamic(
  () => import("@/components/enhanced/ReadingProgress").then(mod => mod.SafeReadingProgress),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

const SimpleReadTime = dynamic(
  () => import("@/components/enhanced/ReadTime").then(mod => mod.SimpleReadTime),
  { ssr: true }
);

/* -------------------------------------------------------------------------- */
/* PREMIUM COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

interface ArticleHeroProps {
  title: string;
  subtitle?: string;
  category: string;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string;
  wordCount?: number;
}

const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
  wordCount = 0
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bg = coverImage || "/assets/images/writing-desk.webp";

  return (
    <section className="relative min-h-[80vh] overflow-hidden border-b border-zinc-800 bg-black">
      {/* Enhanced background with parallax effect */}
      <div className="absolute inset-0">
        <div 
          className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-1000"
          style={{
            backgroundImage: `url(${bg})`,
            transform: `scale(${1 + scrollProgress * 0.001})`,
            opacity: 0.3
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-96 w-96 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[80vh] max-w-5xl items-end px-4 pb-20 pt-32">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Category badge with pulse */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 animate-ping rounded-full bg-amber-500/20" />
              <span className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-4 py-1.5 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <span className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
                  {category}
                </span>
              </span>
            </div>
            
            {/* Read time indicator */}
            {readTime && (
              <div className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                <span className="text-xs font-medium text-amber-300">{readTime}</span>
              </div>
            )}
          </div>

          {/* Animated title */}
          <h1 className="relative font-serif text-5xl font-bold leading-tight text-white md:text-7xl">
            {title.split(' ').map((word, index) => (
              <span
                key={index}
                className="inline-block transition-all duration-700 hover:text-amber-300 hover:scale-105"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isVisible ? 'fadeInUp 0.5s ease forwards' : 'none'
                }}
              >
                {word}&nbsp;
              </span>
            ))}
          </h1>

          {subtitle && (
            <p className="mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300 opacity-0 animate-fadeInUp animation-delay-300">
              {subtitle}
            </p>
          )}

          {/* Enhanced metadata */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
            {date && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-zinc-300">
                  {new Date(date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            
            {wordCount > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-zinc-300">
                  {Math.ceil(wordCount / 200)} min read
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-px bg-gradient-to-b from-amber-500/50 to-transparent" />
          <span className="text-xs font-medium uppercase tracking-widest text-amber-300/70">
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* TYPES & CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */

type PageMeta = {
  slug: string;
  url: string;
  kind: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  readTime: string | null;
  date: string | null;
  coverImage: string | null;
  accessLevel: string;
  lockMessage: string | null;
  author: string | null;
  downloadUrl: string | null;
  wordCount: number;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
  rawContent: string;
};

const SITE = "https://www.abrahamoflondon.org";

function isSingleSegmentHref(href: string): boolean {
  const clean = String(href ?? "").split(/[?#]/)[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);
  return parts.length === 1;
}

function countWords(text: string): number {
  return text
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<PageProps> = ({ meta, mdxSource, rawContent }) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);
  const [isTocVisible, setIsTocVisible] = React.useState(false);

  React.useEffect(() => {
    // Check for inner circle access
    setHasAccess(
      typeof document !== "undefined" &&
        document.cookie.includes("innerCircleAccess=true")
    );
    
    // Content animation
    const timer = setTimeout(() => setIsContentVisible(true), 300);
    
    // Show TOC on scroll
    const handleScroll = () => {
      setIsTocVisible(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Enhanced cursor glow
  React.useEffect(() => {
    const glow = document.getElementById("cursor-glow");
    if (!glow) return;

    const onMove = (e: MouseEvent) => {
      (glow as HTMLElement).style.left = `${e.clientX - 250}px`;
      (glow as HTMLElement).style.top = `${e.clientY - 250}px`;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const isLocked = meta.accessLevel === "inner-circle" && !hasAccess;
  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(meta.url)}`;

  return (
    <>
      <SafeReadingProgress />
      
      <Layout
        title={meta.title}
        description={meta.description || meta.excerpt || ""}
        canonicalUrl={`${SITE}${meta.url}`}
        ogImage={meta.coverImage || undefined}
        ogType="article"
      >
        <ArticleHero
          title={meta.title}
          subtitle={meta.excerpt || meta.description || undefined}
          category={meta.category || meta.tags?.[0] || "Intelligence"}
          date={meta.date}
          readTime={meta.readTime}
          coverImage={meta.coverImage || undefined}
          wordCount={meta.wordCount}
        />

        <main
          className={`relative transition-all duration-1000 delay-500 ${
            isContentVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Floating Table of Contents */}
          {isTocVisible && meta.wordCount > 500 && (
            <div className="fixed right-8 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
              <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl p-4 shadow-2xl">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-300">
                  Contents
                </h4>
                <div className="space-y-2">
                  {['Introduction', 'Analysis', 'Strategy', 'Conclusion'].map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.toLowerCase()}`}
                      className="block text-sm text-zinc-400 hover:text-amber-300 transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <article className="mx-auto max-w-4xl px-4 pb-32 pt-16">
            <div className="relative">
              {/* Enhanced Depth Indicator */}
              <div className="absolute bottom-0 left-0 top-0 hidden w-32 -translate-x-44 lg:block">
                <div className="sticky top-32">
                  <div className="relative">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                    <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full border border-amber-500/30" />
                  </div>
                  <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    Structural Depth
                  </div>
                  <div className="mt-4 h-48 w-px bg-gradient-to-b from-amber-500/60 via-amber-500/20 to-transparent" />
                </div>
              </div>

              {isLocked ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-12 text-center shadow-2xl">
                  <div className="relative mb-8">
                    <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/10 to-amber-600/10 blur-2xl rounded-full" />
                    <div className="relative text-6xl text-amber-500/30">𓃲</div>
                  </div>
                  <h3 className="mb-6 font-serif text-4xl font-bold text-white">
                    Dossier Access Restricted
                  </h3>
                  <p className="mx-auto mb-10 max-w-lg text-lg text-zinc-400">
                    {meta.lockMessage ||
                      "This architectural analysis is reserved for the Inner Circle. Unlock complete transmission access."}
                  </p>
                  <Link
                    href={joinUrl}
                    className="group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-5 font-bold text-black transition-all hover:scale-105 hover:shadow-2xl"
                  >
                    <span>Unlock Structure</span>
                    <svg className="h-5 w-5 transform transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  {/* Content header with share */}
                  <div className="mb-12 flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div className="flex items-center gap-4">
                      {meta.author && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10" />
                          <div>
                            <p className="text-sm font-medium text-zinc-300">{meta.author}</p>
                            <p className="text-xs text-zinc-500">Author</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${SITE}${meta.url}`)}
                      className="rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/10"
                    >
                      Share Analysis
                    </button>
                  </div>

                  {/* Enhanced MDX content */}
                  <div
                    className="prose prose-invert prose-amber max-w-none
                    prose-headings:font-serif prose-headings:font-bold prose-headings:relative
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-8
                    prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-lg
                    prose-blockquote:border-l-amber-500/50 prose-blockquote:bg-zinc-900/30 prose-blockquote:p-8 prose-blockquote:rounded-xl
                    prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl
                    prose-strong:text-amber-300 prose-strong:font-semibold
                    prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 hover:prose-a:underline"
                  >
                    <MDXRemote {...mdxSource} components={mdxComponents} />
                  </div>

                  {/* Enhanced footer */}
                  <div className="mt-20 border-t border-zinc-800 pt-12">
                    {meta.tags && meta.tags.length > 0 && (
                      <div className="mb-8">
                        <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {meta.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-sm font-medium text-amber-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent p-8">
                      <p className="text-center font-serif text-xl italic text-zinc-300">
                        "Strategy without architecture is just noise."
                      </p>
                      <p className="mt-4 text-center text-sm text-zinc-500">— Abraham of London</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </main>

        {/* Enhanced UI Layer */}
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <div
            id="cursor-glow"
            className="absolute h-[500px] w-[500px] rounded-full bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-purple-500/5 blur-[120px] transition-all duration-300"
          />
        </div>
      </Layout>
      
      <BackToTop />
      
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .prose pre {
          position: relative;
        }
        
        .prose pre::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
        }
      `}</style>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION (FIXED)                                                  */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const data = await getContentlayerData();
    assertContentlayerHasDocs();
    
    // FIX: getPublishedDocuments is async
    const docs = await getPublishedDocuments();
    
    const paths = docs
      .map((doc: any) => {
        try {
          const href = getDocHref(doc);
          if (!isSingleSegmentHref(href)) return null;
          
          const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
          return slug ? { params: { slug } } : null;
        } catch (error) {
          console.warn(`Error processing doc for path generation:`, doc?._id);
          return null;
        }
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { 
      paths, 
      fallback: "blocking" 
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: "blocking"
    };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slug = String(params?.slug || "");
    await getContentlayerData();

    // FIX: getPublishedDocuments is async
    const docs = await getPublishedDocuments();

    const found = docs.find(
      (d: any) => normalizeSlug(d.slug || d._raw?.flattenedPath || "") === slug
    );
    
    if (!found) {
      return { notFound: true };
    }

    const canonicalHref = getDocHref(found);

    if (!isSingleSegmentHref(canonicalHref)) {
      return { 
        redirect: { 
          destination: canonicalHref, 
          permanent: true 
        } 
      };
    }

    const rawContent = found.body?.raw || found.body || "";
    const mdxSource = await prepareMDX(rawContent);
    const wordCount = countWords(rawContent);

    const meta: PageMeta = {
      slug,
      url: canonicalHref,
      kind: getDocKind(found),
      title: found.title || "Untitled",
      excerpt: found.excerpt || found.description || null,
      description: found.description || found.excerpt || null,
      category: (found as any).category || null,
      tags: (found as any).tags || null,
      readTime: (found as any).readTime || null,
      date: found.date ? new Date(found.date).toISOString() : null,
      coverImage: resolveDocCoverImage(found),
      accessLevel: getAccessLevel(found),
      lockMessage: (found as any).lockMessage || null,
      author: (found as any).author || "Abraham of London",
      downloadUrl: resolveDocDownloadUrl(found),
      wordCount
    };

    return {
      props: sanitizeData({ 
        meta, 
        mdxSource,
        rawContent 
      }),
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return {
      notFound: true,
    };
  }
};

export default ContentPage;