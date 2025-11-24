// pages/downloads/[slug].tsx
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Layout from "@/components/Layout";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from "@/components/mdx-components";

import { getDownloadBySlug, getDownloadSlugs } from "@/lib/downloads";

type DownloadPageProps = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  fileUrl?: string | null;
  fileSize?: string | null;
  mdxSource: MDXRemoteSerializeResult;
  featured?: boolean;
};

interface RawDownload {
  slug?: unknown;
  title?: unknown;
  excerpt?: unknown;
  description?: unknown;
  coverImage?: unknown;
  heroImage?: unknown;
  downloadFile?: unknown;
  fileUrl?: unknown;
  fileSize?: unknown;
  category?: unknown;
  type?: unknown;
  tags?: unknown;
  date?: unknown;
  readTime?: unknown;
  body?: unknown;
  content?: unknown;
  featured?: unknown;
}

function normaliseDownload(raw: RawDownload, slugFallback: string) {
  const safeSlug = String(raw?.slug ?? slugFallback);
  const title = String(raw?.title ?? "Untitled download");

  const coverImage =
    typeof raw?.coverImage === "string" && raw.coverImage.trim().length
      ? raw.coverImage
      : typeof raw?.heroImage === "string" && raw.heroImage.trim().length
      ? raw.heroImage
      : null;

  const fileUrl =
    typeof raw?.fileUrl === "string" && raw.fileUrl.trim().length
      ? raw.fileUrl
      : null;

  const fileSize =
    typeof raw?.fileSize === "string" && raw.fileSize.trim().length
      ? raw.fileSize
      : null;

  return {
    slug: safeSlug,
    title,
    excerpt: raw?.excerpt ?? raw?.description ?? null,
    coverImage,
    category: raw?.category ?? null,
    tags: Array.isArray(raw?.tags) ? raw.tags : null,
    readTime: raw?.readTime ?? null,
    fileUrl,
    fileSize,
    featured: Boolean(raw?.featured),
    body:
      typeof raw?.body === "string"
        ? raw.body
        : typeof raw?.content === "string"
        ? raw.content
        : "# Content coming soon\n\nThis download is being prepared.",
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const slugs = getDownloadSlugs();

    const paths =
      slugs?.map((slug) => ({
        params: { slug },
      })) ?? [];

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.error("Error in getStaticPaths for downloads:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

export const getStaticProps: GetStaticProps<DownloadPageProps> = async (
  ctx,
) => {
  try {
    const slugParam = ctx.params?.slug;
    const slug = Array.isArray(slugParam)
      ? slugParam[0]
      : (slugParam as string | undefined) ?? "";

    if (!slug) {
      return { notFound: true };
    }

    const raw = await Promise.resolve(getDownloadBySlug(slug));

    if (!raw) {
      return { notFound: true };
    }

    const normalised = normaliseDownload(raw, slug);

    const content =
      normalised.body?.trim() ||
      "# Content coming soon\n\nThis download is being prepared.";

    const mdxSource = await serialize(content, {
      mdxOptions: {
        development: process.env.NODE_ENV === "development",
      },
    });

    return {
      props: {
        slug: normalised.slug,
        title: normalised.title,
        excerpt: normalised.excerpt,
        coverImage: normalised.coverImage,
        category: normalised.category,
        tags: normalised.tags,
        readTime: normalised.readTime,
        fileUrl: normalised.fileUrl,
        fileSize: normalised.fileSize,
        featured: normalised.featured,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for downloads:", error);
    return { notFound: true };
  }
};

export default function DownloadPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const pageTitle = props.title || "Download";

  useEffect(() => {
    if (isDownloading) {
      const timer = setTimeout(() => setIsDownloading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDownloading]);

  const handleDownload = () => {
    if (props.fileUrl) {
      setIsDownloading(true);
      window.open(props.fileUrl, '_blank');
    }
  };

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {props.excerpt && <meta name="description" content={props.excerpt} />}
        <meta property="og:title" content={pageTitle} />
        {props.excerpt && <meta property="og:description" content={props.excerpt} />}
        {props.coverImage && <meta property="og:image" content={props.coverImage} />}
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <header className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {props.featured && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                    Featured
                  </span>
                )}
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                  Premium Resource
                </span>
              </div>
              <button
                onClick={() => router.back()}
                className="rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-700/50 hover:scale-105"
              >
                ← Back
              </button>
            </div>

            <h1 className="font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              {props.title}
            </h1>

            {(props.category || props.readTime || props.tags?.length) && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {props.category && (
                  <span className="rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300">
                    {props.category}
                  </span>
                )}
                {props.readTime && (
                  <span className="rounded-full bg-slate-700 px-4 py-2 text-sm text-slate-300">
                    {props.readTime}
                  </span>
                )}
                {props.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {props.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-700/50 px-3 py-1.5 text-xs text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {props.excerpt && (
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                {props.excerpt}
              </p>
            )}

            {props.fileUrl && (
              <div className="mt-8">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white transition-all ${
                    isDownloading
                      ? 'bg-emerald-600 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Resource
                      {props.fileSize ? ` (${props.fileSize})` : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </header>

          {/* Enhanced Content */}
          <article className="rounded-2xl border border-slate-700 bg-slate-800/30 backdrop-blur-sm">
            <div className="p-8">
              <div className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-white
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-strong:text-white prose-strong:font-semibold
                prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
                prose-ul:text-slate-300 prose-ol:text-slate-300
                prose-blockquote:border-l-amber-400 prose-blockquote:text-slate-400
                prose-hr:border-slate-600
                prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
                prose-code:text-amber-300 prose-code:bg-slate-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-img:rounded-xl prose-img:shadow-2xl">
                <MDXRemote {...props.mdxSource} components={mdxComponents} />
              </div>
            </div>
          </article>

          {/* Additional Resources */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">Explore more premium resources</p>
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/50 px-6 py-3 text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-700/50 hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              View All Resources
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}