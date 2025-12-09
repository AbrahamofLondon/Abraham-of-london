// pages/content/[slug].tsx – PREMIUM ESSAY PAGE

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Tag,
  Bookmark,
  Share2,
  ArrowLeft,
  Eye,
  BookOpen,
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

// Centralised content access
import {
  getAllPosts,
  getPostBySlug,
  type PostWithContent,
  type Post,
} from "@/lib/content";

type Props = {
  post: PostWithContent & {
    // ensure serializable
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

  return {
    paths,
    fallback: false, // ✅ required for next export
  };
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

  // Ensure all fields are serializable / non-undefined
  const serializablePost = {
    ...rawPost,
    title: rawPost.title || "Untitled essay",
    slug: rawPost.slug || slug,
    description: rawPost.description || "",
    excerpt: rawPost.excerpt || "",
    author: (rawPost as any).author || "Abraham of London",
    coverImage:
      rawPost.coverImage || "/assets/images/writing-desk.webp",
    category: (rawPost as any).category || "Strategic Essay",
    readTime: (rawPost as any).readTime || "8 min",
    date: rawPost.date
      ? new Date(rawPost.date).toISOString().split("T")[0]
      : "",
    tags: rawPost.tags || [],
    draft: rawPost.draft || false,
    featured: rawPost.featured || false,
  };

  // Related posts (very simple: same category or tag, limited to 3)
  const allPosts = getAllPosts().filter(
    (p) => p.slug !== serializablePost.slug && !p.draft,
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
    revalidate: 3600, // 1h
  };
};

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const ContentPostPage: NextPage<Props> = ({ post, mdxSource, relatedPosts }) => {
  const router = useRouter();

  const canonicalUrl = `${siteUrl}/content/${post.slug}`;
  const description =
    post.excerpt || post.description || "Strategic essay from Abraham of London.";

  // Structured data for SEO
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

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="flex min-h-screen items-center justify-center bg-black text-cream">
          <p className="text-sm tracking-[0.22em] uppercase text-softGold">
            Loading content…
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

      <main className="bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        {/* TOP STRIP / BREADCRUMB */}
        <section className="border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => router.push("/content")}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 hover:text-softGold"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to content library
            </button>
            <div className="hidden items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-gray-400 sm:flex">
              <span>Canon in Motion</span>
              <span className="h-px w-6 bg-gray-300 dark:bg-gray-600" />
              <span>{post.category || "Strategic Essay"}</span>
            </div>
          </div>
        </section>

        {/* HERO */}
        <article className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
          <header className="mb-10 lg:mb-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/70 bg-amber-50/70 px-4 py-2 dark:border-amber-900/50 dark:bg-amber-900/20">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">
                  Strategic Essay
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {post.date && (
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-softGold" />
                    <span>{post.date}</span>
                  </div>
                )}
                {post.readTime && (
                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-softGold" />
                    <span>{post.readTime}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-softGold" />
                  <span>Canon circulation</span>
                </div>
              </div>
            </div>

            <h1 className="mb-4 font-serif text-3xl font-semibold leading-tight text-deepCharcoal dark:text-cream sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-softGold/20 to-softGold/40 text-xs font-semibold text-black">
                  AO
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-700 dark:text-gray-300">
                    {post.author || "Abraham of London"}
                  </p>
                  <p className="text-[0.7rem] text-gray-500">
                    Canon · Strategy · Fatherhood
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-[0.7rem] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        text: description,
                        url: canonicalUrl,
                      });
                    } else {
                      navigator.clipboard.writeText(canonicalUrl);
                      // Simple, non-intrusive feedback
                      alert("Link copied to clipboard.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[0.7rem] font-semibold text-gray-700 hover:border-softGold hover:text-softGold dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          </header>

          {/* HERO IMAGE (optional) */}
          {post.coverImage && (
            <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 shadow-lg dark:border-gray-800">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 900px"
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </div>
            </div>
          )}

          {/* BODY */}
          <div className="prose prose-lg mx-auto max-w-none prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:text-deepCharcoal prose-a:text-softGold hover:prose-a:text-gold dark:prose-invert dark:prose-headings:text-cream">
            {mdxSource ? (
              <MDXRemote {...mdxSource} components={mdxComponents} />
            ) : post.description ? (
              <div className="space-y-4 text-gray-800 dark:text-gray-100">
                {post.description.split("\n\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Full content for this essay is being prepared.
              </p>
            )}
          </div>

          {/* FOOTER / RELATED */}
          <footer className="mt-16 border-t border-gray-200 pt-8 dark:border-gray-800">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => router.push("/content")}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-600 hover:text-softGold dark:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to all essays
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-[0.7rem] text-gray-500 dark:text-gray-400">
                  <Bookmark className="h-3.5 w-3.5 text-softGold" />
                  <span>Save this to revisit in 7 days.</span>
                </div>
              </div>
            </div>

            {relatedPosts && relatedPosts.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 font-serif text-xl font-semibold text-deepCharcoal dark:text-cream">
                  Related essays
                </h2>
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
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export default ContentPostPage;