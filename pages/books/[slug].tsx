// pages/books/[slug].tsx

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import Layout from "@/components/Layout";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import mdxComponents from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/books";

/**
 * Shape we actually need on the page – kept loose to avoid
 * fighting with server-side types.
 */
type SerializableBook = {
  slug: string;
  title?: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  date?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  mdxSource?: MDXRemoteSerializeResult | null;
  content?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

type BookPageProps = {
  book: SerializableBook;
};

/* -------------------------------------------------------------------------- */
/*  Premium Components                                                        */
/* -------------------------------------------------------------------------- */

const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (typeof document === "undefined") return;
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const windowHeight = scrollHeight - clientHeight;
      const scrolled = windowHeight > 0 ? (scrollTop / windowHeight) * 100 : 0;
      setProgress(scrolled);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", updateProgress);
      window.addEventListener("resize", updateProgress);
      updateProgress();
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", updateProgress);
        window.removeEventListener("resize", updateProgress);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/20">
      <div
        className="h-full bg-gradient-to-r from-softGold to-forest transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const PremiumDivider = () => (
  <div className="relative my-12 h-px">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-softGold/40 to-transparent" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="h-2 w-2 rotate-45 bg-softGold" />
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Static paths                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const books = await Promise.resolve(getAllBooks());

  const slugs =
    Array.isArray(books) && books.length
      ? books
          .map((b: any) => b?.slug)
          .filter(
            (s): s is string =>
              typeof s === "string" && s.trim().length > 0,
          )
      : [];

  const paths = slugs.map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

/* -------------------------------------------------------------------------- */
/*  Static props – fully JSON-safe                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<BookPageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam ?? "";

  if (!slug) {
    return { notFound: true };
  }

  const rawBook = await Promise.resolve(getBookBySlug(slug));

  if (!rawBook) {
    return { notFound: true };
  }

  // Make every Date a string so Next.js can serialise it
  const serialised = JSON.parse(
    JSON.stringify(rawBook, (_key, value) =>
      value instanceof Date ? value.toISOString() : value,
    ),
  ) as SerializableBook;

  return {
    props: {
      book: serialised,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function BookPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { book } = props;

  // Default status by slug – extend as needed
  const defaultStatusBySlug: Record<string, string> = {
    "fathering-without-fear": "In Development",
    // Add other books here as they come online
  };

  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    author,
    date,
    coverImage,
    category,
    tags,
    mdxSource,
    content,
    readTime,
    status: rawStatus,
  } = book;

  const status =
    rawStatus ||
    (slug && defaultStatusBySlug[slug]) ||
    null;

  const pageTitle = title || "Book";

  const displayDate =
    date && typeof date === "string" && !Number.isNaN(Date.parse(date))
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(date))
      : null;

  const safeCover =
    typeof coverImage === "string" && coverImage.trim().length > 0
      ? coverImage
      : null;

  const hasMdxSource =
    mdxSource &&
    typeof mdxSource === "object" &&
    "compiledSource" in mdxSource;

  const displayDescription = description || excerpt || "";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {displayDescription && (
          <meta name="description" content={displayDescription} />
        )}
      </Head>

      <ReadingProgressBar />

      {/* Premium Background Canvas */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-black via-deepCharcoal to-black" />

      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-softGold/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-forest/5 blur-3xl" />
      </div>

      <main className="relative z-10">
        {/* Enhanced Breadcrumb */}
        <nav className="fixed top-20 left-8 z-30 hidden xl:block">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Link
              href="/"
              className="group flex items-center gap-2 transition-all hover:text-softGold"
            >
              <div className="h-2 w-2 rounded-full bg-softGold/60 group-hover:bg-softGold" />
              <span>Home</span>
            </Link>
            <span className="text-softGold/40">→</span>
            <Link
              href="/books"
              className="group flex items-center gap-2 transition-all hover:text-softGold"
            >
              <div className="h-2 w-2 rounded-full bg-softGold/40 group-hover:bg-softGold" />
              <span>Books</span>
            </Link>
            {title && (
              <>
                <span className="text-softGold/40">→</span>
                <div className="group flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-softGold/20" />
                  <span className="max-w-[200px] truncate text-gray-300">
                    {title}
                  </span>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* PREMIUM HERO SECTION */}
        <section className="relative flex min-h-screen items-center justify-center px-4 pt-20 pb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-deepCharcoal via-black to-forest/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-center">
            {/* Cover Art */}
            <div className="flex justify-center lg:justify-end">
              <div className="group relative">
                <div className="absolute -inset-4 rounded-3xl bg-softGold/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">
                  {safeCover ? (
                    <div className="relative h-80 w-56 transform overflow-hidden rounded-2xl border-2 border-softGold/30 bg-black/40 shadow-2xl shadow-black/60 transition-transform duration-500 group-hover:scale-105 md:h-96 md:w-64">
                      <Image
                        src={safeCover}
                        alt={title ?? ""}
                        fill
                        sizes="(max-width: 768px) 50vw, 320px"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                  ) : (
                    <div className="relative flex h-80 w-56 transform items-center justify-center rounded-2xl border-2 border-dashed border-softGold/40 bg-black/40 shadow-xl shadow-black/60 transition-transform duration-500 group-hover:scale-105 md:h-96 md:w-64">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-softGold/10">
                          <svg
                            className="h-8 w-8 text-softGold/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <span className="px-4 text-xs font-semibold uppercase tracking-wider text-softGold/80">
                          Cover design
                          <br />
                          in progress
                        </span>
                      </div>
                    </div>
                  )}

                  {status && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <div className="rounded-full bg-softGold/90 px-4 py-1.5 shadow-lg backdrop-blur-sm">
                        <span className="text-xs font-bold uppercase tracking-widest text-deepCharcoal">
                          {status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Book Metadata */}
            <div className="flex flex-col justify-center text-center lg:text-left">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {category && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-2 backdrop-blur-sm">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-softGold" />
                    <span className="text-sm font-medium uppercase tracking-wider text-softGold">
                      {category}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="mb-4 font-serif text-4xl font-light leading-tight text-white md:text-5xl lg:text-6xl">
                {title}
              </h1>

              {subtitle && (
                <p className="mb-6 text-xl font-light leading-relaxed text-amber-100/90 md:text-2xl">
                  {subtitle}
                </p>
              )}

              {displayDescription && (
                <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-300">
                  {displayDescription}
                </p>
              )}

              <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 lg:justify-start">
                {author && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-softGold/20">
                      <svg
                        className="h-5 w-5 text-softGold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-softGold">
                        Author
                      </div>
                      <div className="text-white">{author}</div>
                    </div>
                  </div>
                )}

                {displayDate && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/20">
                      <svg
                        className="h-5 w-5 text-forest"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-forest">
                        Established
                      </div>
                      <time
                        dateTime={date || undefined}
                        className="text-white"
                      >
                        {displayDate}
                      </time>
                    </div>
                  </div>
                )}

                {readTime && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-softGold/20">
                      <svg
                        className="h-5 w-5 text-softGold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-softGold">
                        Est. Read
                      </div>
                      <div className="text-white">{readTime}</div>
                    </div>
                  </div>
                )}
              </div>

              {tags && tags.length > 0 && (
                <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm hover:border-softGold/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                <a
                  href="#book-content"
                  className="group inline-flex items-center gap-3 rounded-full bg-softGold px-8 py-4 font-medium text-deepCharcoal transition-all hover:scale-105 hover:shadow-2xl hover:shadow-softGold/30"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Read Overview
                </a>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-3 rounded-full border border-softGold px-8 py-4 font-medium text-softGold transition-all hover:scale-105 hover:bg-softGold/10"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Discuss Project
                </Link>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
              <div className="flex h-10 w-6 justify-center rounded-full border-2 border-softGold/50">
                <div className="mt-2 h-3 w-1 rounded-full bg-softGold" />
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM CONTENT SECTION */}
        <section id="book-content" className="relative -mt-20 px-4 pb-20">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="border-b border-gray-100/50 bg-gradient-to-r from-white to-gray-50/80 px-8 py-8">
                {excerpt && (
                  <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-500">
                      <div className="h-2 w-2 rounded-full bg-softGold" />
                      Project Synopsis
                    </div>
                    <p className="text-lg font-light leading-relaxed text-gray-700">
                      {excerpt}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-8 py-12">
                {hasMdxSource ? (
                  <article
                    className="prose prose-lg max-w-none 
                    prose-headings:font-serif prose-headings:text-deepCharcoal prose-headings:font-light
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-forest prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-softGold prose-blockquote:bg-softGold/5 prose-blockquote:px-6 prose-blockquote:py-4
                    prose-img:rounded-xl prose-img:shadow-lg
                    prose-strong:text-deepCharcoal prose-strong:font-semibold
                    prose-code:rounded prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1
                    prose-pre:bg-black prose-pre:text-gray-200"
                  >
                    <MDXRemote
                      {...(mdxSource as MDXRemoteSerializeResult)}
                      components={mdxComponents as any}
                    />
                  </article>
                ) : content ? (
                  <article className="prose prose-lg max-w-none whitespace-pre-wrap text-deepCharcoal prose-headings:font-serif prose-a:text-forest">
                    {String(content)}
                  </article>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-softGold/10">
                      <svg
                        className="h-10 w-10 text-softGold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-4 font-serif text-2xl font-light text-deepCharcoal">
                      Manuscript in Progress
                    </h3>
                    <p className="mx-auto max-w-md leading-relaxed text-gray-600">
                      Full details for this book are being carefully
                      crafted. The foundation is set—now we&apos;re
                      building the complete vision.
                    </p>
                  </div>
                )}

                <PremiumDivider />

                <section className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-deepCharcoal via-black to-forest/90 p-12 text-center text-white">
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                        backgroundSize: "40px 40px",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <h2 className="mb-6 font-serif text-3xl font-light md:text-4xl">
                      Beyond the Manuscript
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-300">
                      This isn&apos;t just a book—it&apos;s the
                      foundation of a living ecosystem. Connect with the
                      tools, community, and strategic work that bring
                      these ideas into daily practice.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Link
                        href="/downloads"
                        className="group inline-flex items-center gap-3 rounded-full bg-softGold px-8 py-4 font-medium text-deepCharcoal transition-all hover:scale-105 hover:shadow-2xl hover:shadow-softGold/30"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Explore Strategic Tools
                      </Link>
                      <Link
                        href="/events"
                        className="group inline-flex items-center gap-3 rounded-full border border-softGold px-8 py-4 font-medium text-softGold transition-all hover:scale-105 hover:bg-softGold/10"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        View Upcoming Events
                      </Link>
                      <Link
                        href="/contact"
                        className="group inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/5 px-8 py-4 font-medium text-white transition-all hover:scale-105 hover:bg-white/10"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        Join Inner Circle
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}