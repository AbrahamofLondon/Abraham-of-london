// pages/content/[slug].tsx – THE PALACE READING ROOM

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowLeft,
  BookOpen,
  Share2,
  Bookmark,
  User,
  ChevronRight,
} from "lucide-react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { BlogPostCard } from "@/components/Cards";

import {
  getAllPosts,
  getPostBySlug,
  type PostWithContent,
  type Post,
} from "@/lib/content";

type Props = {
  post: PostWithContent & {
    title: string;
    slug: string;
    description: string;
    excerpt: string;
    author: string;
    coverImage: string;
    category: string;
    readTime: string;
    date: string;
    tags: string[];
    draft: boolean;
    featured: boolean;
  };
  mdxSource: MDXRemoteSerializeResult | null;
  relatedPosts: Post[];
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION                                                          */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();
  const paths =
    posts?.map((post) => ({
      params: { slug: post.slug },
    })) ?? [];

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string | undefined;

  if (!slug) {
    return { notFound: true };
  }

  const rawPost = getPostBySlug(slug) as PostWithContent | null;

  if (!rawPost) {
    return { notFound: true };
  }

  let mdxSource: MDXRemoteSerializeResult | null = null;

  if (rawPost.content) {
    mdxSource = await serialize(rawPost.content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    });
  }

  const serializablePost = {
    ...rawPost,
    title: rawPost.title || "Untitled essay",
    slug: rawPost.slug || slug,
    description: rawPost.description || "",
    excerpt: rawPost.excerpt || "",
    author: (rawPost as any).author || "Abraham of London",
    coverImage: rawPost.coverImage || "/assets/images/writing-desk.webp",
    category: (rawPost as any).category || "Strategic Essay",
    readTime: (rawPost as any).readTime || "8 min read",
    date: rawPost.date
      ? new Date(rawPost.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    tags: rawPost.tags || [],
    draft: rawPost.draft || false,
    featured: rawPost.featured || false,
  };

  const allPosts = getAllPosts().filter(
    (p) => p.slug !== serializablePost.slug && !p.draft
  );

  const relatedByTag: Post[] = [];
  const tagsSet = new Set(serializablePost.tags);

  for (const p of allPosts) {
    if (relatedByTag.length >= 3) break;
    if (!p.tags || p.tags.length === 0) continue;

    const overlap = p.tags.some((t) => tagsSet.has(t));
    if (overlap) relatedByTag.push(p);
  }

  const related =
    relatedByTag.length > 0
      ? relatedByTag
      : allPosts.slice(0, Math.min(3, allPosts.length));

  return {
    props: {
      post: serializablePost,
      mdxSource,
      relatedPosts: related,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT – THE PALACE READING ROOM                                   */
/* -------------------------------------------------------------------------- */

const ContentPostPage: NextPage<Props> = ({
  post,
  mdxSource,
  relatedPosts,
}) => {
  const router = useRouter();

  const canonicalUrl = `${siteUrl}/content/${post.slug}`;
  const description =
    post.excerpt ||
    post.description ||
    "Strategic essay from Abraham of London.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: post.coverImage,
    datePublished: post.date || undefined,
    author: {
      "@type": "Person",
      name: post.author || "Abraham of London",
    },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/images/abraham-logo.jpg`,
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  const handleShare = React.useCallback(() => {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: description,
          url: canonicalUrl,
        })
        .catch(() => {
          // User cancelled, no action needed
        });
    } else {
      navigator.clipboard.writeText(canonicalUrl);
      // Could add toast notification here
    }
  }, [post.title, description, canonicalUrl]);

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Loading…
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={post.title}
      description={description}
      image={post.coverImage}
      structuredData={structuredData}
      ogType="article"
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={post.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <main className="bg-white">
        {/* REFINED NAVIGATION BAR */}
        <nav className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-6 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/content")}
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Archive</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-2 text-xs uppercase tracking-[0.15em] text-neutral-400 sm:flex">
                  <span>{post.category}</span>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ARTICLE CONTAINER */}
        <article className="mx-auto max-w-4xl px-6 py-16 lg:px-8 lg:py-20">
          {/* HEADER */}
          <header className="mb-12">
            {/* Category badge */}
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm">
              <BookOpen className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-6 font-serif text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="mb-8 text-xl leading-relaxed text-neutral-700">
                {post.excerpt}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-y border-neutral-200 py-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-md">
                  AL
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {post.author}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Canon · Strategy · Fatherhood
                  </p>
                </div>
              </div>

              {/* Date & Reading time */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                {post.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span>{post.date}</span>
                  </div>
                )}
                {post.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span>{post.readTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* HERO IMAGE */}
          {post.coverImage && (
            <figure className="mb-12 overflow-hidden rounded-2xl border border-neutral-200 shadow-lg">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 900px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </figure>
          )}

          {/* BODY CONTENT */}
          <div className="prose prose-lg prose-neutral mx-auto max-w-none prose-headings:scroll-mt-28 prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-relaxed prose-a:font-medium prose-a:text-amber-700 prose-a:no-underline hover:prose-a:text-amber-800 hover:prose-a:underline prose-strong:font-semibold prose-strong:text-neutral-900 prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50/50 prose-blockquote:py-1 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-neutral-800 prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-code:text-neutral-900 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-ol:list-decimal prose-ul:list-disc">
            {mdxSource ? (
              <MDXRemote {...mdxSource} components={mdxComponents} />
            ) : post.description ? (
              <div className="space-y-6 text-lg leading-relaxed text-neutral-800">
                {post.description.split("\n\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                <p className="text-base text-neutral-600">
                  Full content for this essay is being prepared.
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <footer className="mt-16 border-t border-neutral-200 pt-12">
            {/* Call to action */}
            <div className="mb-12 rounded-2xl border border-amber-200 bg-amber-50 p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Bookmark className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-2 font-serif text-xl font-semibold text-neutral-900">
                    Worth revisiting
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-700">
                    This essay rewards multiple readings. Bookmark it and return
                    in a week to see what new insights emerge.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/content")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 transition hover:text-amber-900"
                  >
                    Explore more essays
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Related Essays */}
            {relatedPosts && relatedPosts.length > 0 && (
              <section>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-neutral-900">
                    Related essays
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push("/content")}
                    className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
                  >
                    View all →
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {relatedPosts.slice(0, 3).map((rel) => (
                    <BlogPostCard
                      key={rel.slug}
                      post={rel as any}
                      href={`/content/${rel.slug}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Back button */}
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => router.push("/content")}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to archive
              </button>
            </div>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export default ContentPostPage;