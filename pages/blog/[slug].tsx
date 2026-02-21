/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/[slug].tsx — EXPORT-SAFE (No Layout, No next/router usage, Client-only unlock) */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import { Loader2 } from "lucide-react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

// Content
import { getPostBySlug, getPublishedPosts } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";
import { resolveTantalizer, type Tantalizer } from "@/lib/content/tantalizer-resolver";
import { getSeriesData } from "@/lib/content/series-provider";

// ✅ IMPORTANT: do NOT import Layout / Sidebar / Gate / Chain here.
// Those are the usual router-mount landmines in prerender.

type AccessLevel = "public" | "inner-circle" | "private";

interface BlogProps {
  post: {
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    accessLevel: AccessLevel;
    category: string;
    wordCount: number;
    tags: string[];
    readingTime: string;
  };
  tantalizer: Tantalizer;
  series: any | null;
  initialSource: MDXRemoteSerializeResult | null;
  jsonLd: any;
}

function safeString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function countWords(raw: string) {
  return raw.split(/\s+/).filter(Boolean).length;
}

function minutesToRead(words: number) {
  return `${Math.max(1, Math.ceil(words / 225))} min`;
}

const BlogSlugPage: NextPage<BlogProps> = ({ post, tantalizer, initialSource, jsonLd }) => {
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(post.accessLevel === "public");

  // Client-only unlock: user clicks + server verifies via API
  const unlock = React.useCallback(async () => {
    if (post.accessLevel === "public") return;

    setLoadingContent(true);
    try {
      // 1) ask backend if user is authorized
      const v = await fetch("/api/access/verify", { method: "POST" }).then((r) => r.json()).catch(() => null);

      if (!v?.ok) {
        setUnlocked(false);
        return;
      }

      setUnlocked(true);

      // 2) fetch secure MDX payload
      const res = await fetch(`/api/canon/${encodeURIComponent(post.slug)}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.source) setSource(json.source);
    } catch {
      setUnlocked(false);
    } finally {
      setLoadingContent(false);
    }
  }, [post.slug, post.accessLevel]);

  const showTantalizer = post.accessLevel !== "public" && !unlocked;

  return (
    <>
      <Head>
        <title>{post.title} | Abraham of London</title>
        <meta name="description" content={post.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || ""} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/blog/${post.slug}`} />
        {jsonLd ? (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
      </Head>

      <div className="min-h-screen bg-black text-white selection:bg-amber-500/30">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <header className="border-b border-white/5 pb-14 mb-14">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                Intelligence Dispatch
              </span>
              <span className="h-[1px] w-12 bg-white/10" />
              <span className="text-zinc-500 font-mono uppercase tracking-widest text-[9px]">
                {post.date} • {post.readingTime} • {post.wordCount.toLocaleString()} words
              </span>
              <span className="h-[1px] w-12 bg-white/10" />
              <span className="text-zinc-600 font-mono text-[9px] uppercase tracking-widest">
                Clearance: {post.accessLevel}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif italic text-white mb-6">{post.title}</h1>
            <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">{post.excerpt}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
            <article className="lg:col-span-8 min-w-0">
              {showTantalizer ? (
                <div className="relative">
                  <div className="prose prose-invert prose-amber max-w-none opacity-40 select-none pointer-events-none">
                    <p className="text-xl leading-relaxed italic text-zinc-300 mb-8">{post.excerpt}</p>
                    <div className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{tantalizer.content}</div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/90 to-transparent" />

                  <div className="relative z-10 -mt-28 pt-10">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-6 flex-wrap">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400">
                            Classified Transmission
                          </div>
                          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
                            This analysis is restricted. Elevate clearance to access the remaining{" "}
                            {Math.max(0, post.wordCount - tantalizer.wordCount).toLocaleString()} words.
                          </p>
                        </div>

                        <button
                          onClick={unlock}
                          disabled={loadingContent}
                          className="rounded-2xl bg-white px-6 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-black hover:bg-amber-500 transition-all disabled:opacity-40"
                        >
                          {loadingContent ? "Verifying…" : "Unlock"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative min-h-[400px]">
                  {loadingContent ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 py-20 text-amber-500 z-50 bg-black/90 backdrop-blur-sm border border-white/5 rounded-2xl">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.5em]">
                        Decrypting Transmission...
                      </span>
                    </div>
                  ) : null}

                  <div className={loadingContent ? "opacity-20 blur-md grayscale" : "opacity-100 transition-all duration-700"}>
                    {source ? (
                      <div className="prose prose-invert prose-amber max-w-none">
                        <MDXRemote {...source} />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-white/60">
                        No content payload available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>

            <aside className="lg:col-span-4">
              <div className="sticky top-10 space-y-6">
                <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-7">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Metadata</div>
                  <div className="mt-5 space-y-3 text-sm text-zinc-400">
                    <div className="flex justify-between gap-6">
                      <span className="text-zinc-500">Category</span>
                      <span className="text-zinc-300">{post.category}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-zinc-500">Reading time</span>
                      <span className="text-zinc-300">{post.readingTime}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-zinc-500">Words</span>
                      <span className="text-zinc-300">{post.wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-zinc-500">Clearance</span>
                      <span className="text-amber-400">{post.accessLevel}</span>
                    </div>
                  </div>
                </div>

                {post.tags?.length ? (
                  <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-7">
                    <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                      Markers
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono text-white/25 border border-white/5 px-3 py-2 rounded-full"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts() || [];
  const paths = posts.map((p: any) => ({
    params: {
      slug: normalizeSlug(p.slug || p._raw?.flattenedPath || "").replace(/^blog\//i, ""),
    },
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BlogProps> = async ({ params }) => {
  const slug = safeString(params?.slug || "").trim();
  const postRaw: any = getPostBySlug(slug);

  if (!postRaw || postRaw.draft) return { notFound: true };

  const rawBody = safeString(postRaw.body?.raw || "");
  const tantalizer = resolveTantalizer(postRaw);
  const wordCount = countWords(rawBody);

  const accessLevel = (postRaw.accessLevel || "inner-circle") as AccessLevel;

  const post = {
    title: safeString(postRaw.title, "Untitled Intelligence"),
    excerpt: safeString(postRaw.excerpt, ""),
    date: postRaw.date ? safeString(postRaw.date) : "2026-ARCHIVE",
    slug,
    accessLevel,
    category: safeString(postRaw.category, "Strategic Briefing"),
    wordCount,
    tags: Array.isArray(postRaw.tags) ? postRaw.tags : [],
    readingTime: minutesToRead(wordCount),
  };

  const series = getSeriesData(slug);
  const jsonLd = postRaw.structuredData ? JSON.parse(JSON.stringify(postRaw.structuredData)) : null;

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (accessLevel === "public" && rawBody) {
    initialSource = await serialize(rawBody, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
    });
  }

  return {
    props: {
      post,
      tantalizer,
      series,
      initialSource,
      jsonLd,
    },
    revalidate: 1800,
  };
};

export default BlogSlugPage;