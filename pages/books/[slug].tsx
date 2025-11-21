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
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/components/mdx-components";
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
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const windowHeight = scrollHeight - clientHeight;
      const scrolled = (scrollTop / windowHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-black/20 z-50">
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

  // 🔐 Make every Date a string so Next.js can serialise it
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
    // Add other books here as they come online:
    // "fiction-adaptation": "In Concept",
    // "kingdom-legacy-principles": "Drafting",
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
      <div className="fixed inset-0 bg-gradient-to-br from-black via-deepCharcoal to-black pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-1/2 h-1/2 bg-softGold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-forest/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <main className="relative z-10">
        {/* Enhanced Breadcrumb */}
        <nav className="fixed top-20 left-8 z-30 hidden xl:block">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Link
              href="/"
              className="group flex items-center gap-2 transition-all hover:text-softGold"
            >
              <div className="w-2 h-2 bg-softGold/60 rounded-full group-hover:bg-softGold" />
              <span>Home</span>
            </Link>
            <span className="text-softGold/40">→</span>
            <Link
              href="/books"
              className="group flex items-center gap-2 transition-all hover:text-softGold"
            >
              <div className="w-2 h-2 bg-softGold/40 rounded-full group-hover:bg-softGold" />
              <span>Books</span>
            </Link>
            {title && (
              <>
                <span className="text-softGold/40">→</span>
                <div className="group flex items-center gap-2">
                  <div className="w-2 h-2 bg-softGold/20 rounded-full" />
                  <span className="text-gray-300 max-w-[200px] truncate">{title}</span>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* PREMIUM HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-deepCharcoal via-black to-forest/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
          
          <div className="relative z-10 max-w-6xl mx-auto w-full">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              
              {/* Cover Art - Premium Presentation */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  {/* Background Glow */}
                  <div className="absolute -inset-4 bg-softGold/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Book Cover Container */}
                  <div className="relative">
                    {safeCover ? (
                      <div className="relative h-80 w-56 md:h-96 md:w-64 overflow-hidden rounded-2xl border-2 border-softGold/30 bg-black/40 shadow-2xl shadow-black/60 transform group-hover:scale-105 transition-transform duration-500">
                        <Image
                          src={safeCover}
                          alt={title ?? ""}
                          fill
                          sizes="(max-width: 768px) 50vw, 320px"
                          className="object-cover"
                          priority
                        />
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    ) : (
                      <div className="relative h-80 w-56 md:h-96 md:w-64 flex items-center justify-center rounded-2xl border-2 border-dashed border-softGold/40 bg-black/40 shadow-xl shadow-black/60 transform group-hover:scale-105 transition-transform duration-500">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-softGold/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-softGold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="px-4 text-sm font-semibold uppercase tracking-wider text-softGold/80">
                            Cover Design
                            <br />
                            In Progress
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {status && (
                      <div className="absolute -top-3 -right-3 z-20">
                        <div className="rounded-full bg-softGold/90 backdrop-blur-sm px-4 py-1.5 shadow-lg">
                          <span className="text-xs font-bold uppercase tracking-widest text-deepCharcoal">
                            {status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Metadata - Premium Layout */}
              <div className="flex flex-col justify-center text-center lg:text-left">
                {/* Category & Status */}
                <div className="mb-6 flex flex-wrap justify-center lg:justify-start items-center gap-3">
                  {category && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-2 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 bg-softGold rounded-full animate-pulse" />
                      <span className="text-sm font-medium tracking-wider text-softGold uppercase">
                        {category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-tight">
                  {title}
                </h1>

                {/* Subtitle */}
                {subtitle && (
                  <p className="text-xl md:text-2xl text-amber-100/90 mb-6 leading-relaxed font-light">
                    {subtitle}
                  </p>
                )}

                {/* Description */}
                {displayDescription && (
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
                    {displayDescription}
                  </p>
                )}

                {/* Meta Information */}
                <div className="mb-8 flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-gray-400">
                  {author && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-softGold/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-softGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-softGold uppercase tracking-wider">Author</div>
                        <div className="text-white">{author}</div>
                      </div>
                    </div>
                  )}
                  
                  {displayDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-forest/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-forest uppercase tracking-wider">Established</div>
                        <time dateTime={date || undefined} className="text-white">{displayDate}</time>
                      </div>
                    </div>
                  )}

                  {readTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-softGold/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-softGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-softGold uppercase tracking-wider">Est. Read</div>
                        <div className="text-white">{readTime}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div className="mb-8 flex flex-wrap justify-center lg:justify-start gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-black/40 backdrop-blur-sm px-4 py-2 text-sm text-gray-200 border border-white/10 hover:border-softGold/30 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <a
                    href="#book-content"
                    className="group inline-flex items-center gap-3 rounded-full bg-softGold px-8 py-4 font-medium text-deepCharcoal transition-all hover:scale-105 hover:shadow-2xl hover:shadow-softGold/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Read Overview
                  </a>
                  <Link
                    href="/contact"
                    className="group inline-flex items-center gap-3 rounded-full border border-softGold px-8 py-4 font-medium text-softGold transition-all hover:bg-softGold/10 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Discuss Project
                  </Link>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-softGold/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-softGold rounded-full mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM CONTENT SECTION */}
        <section id="book-content" className="relative px-4 pb-20 -mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/30 border border-white/20 overflow-hidden">
              
              {/* Content Header */}
              <div className="border-b border-gray-100/50 px-8 py-8 bg-gradient-to-r from-white to-gray-50/80">
                {excerpt && (
                  <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-500 mb-4">
                      <div className="w-2 h-2 bg-softGold rounded-full" />
                      Project Synopsis
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed font-light">
                      {excerpt}
                    </p>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="px-8 py-12">
                {hasMdxSource ? (
                  <article className="prose prose-lg max-w-none 
                    prose-headings:font-serif prose-headings:text-deepCharcoal prose-headings:font-light
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-forest prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-softGold prose-blockquote:bg-softGold/5 prose-blockquote:py-4 prose-blockquote:px-6
                    prose-img:rounded-xl prose-img:shadow-lg
                    prose-strong:text-deepCharcoal prose-strong:font-semibold
                    prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded
                    prose-pre:bg-black prose-pre:text-gray-200">
                    <MDXRemote
                      {...(mdxSource as MDXRemoteSerializeResult)}
                      components={mdxComponents as any}
                    />
                  </article>
                ) : content ? (
                  // Basic fallback if we only have raw content but no compiled MDX
                  <article className="prose prose-lg max-w-none whitespace-pre-wrap text-deepCharcoal prose-headings:font-serif prose-a:text-forest">
                    {String(content)}
                  </article>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-softGold/10 rounded-3xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-softGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-serif font-light text-deepCharcoal mb-4">
                      Manuscript in Progress
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      Full details for this book are being carefully crafted. 
                      The foundation is set—now we're building the complete vision.
                    </p>
                  </div>
                )}

                <PremiumDivider />

                {/* PREMIUM CTA SECTION */}
                <section className="mt-16 relative overflow-hidden rounded-2xl bg-gradient-to-br from-deepCharcoal via-black to-forest/90 p-12 text-center text-white">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                      backgroundSize: '40px 40px'
                    }} />
                  </div>
                  
                  <div className="relative z-10">
                    <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
                      Beyond the Manuscript
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                      This isn't just a book—it's the foundation of a living ecosystem. 
                      Connect with the tools, community, and strategic work that bring 
                      these ideas into daily practice.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Link
                        href="/downloads"
                        className="group inline-flex items-center gap-3 rounded-full bg-softGold px-8 py-4 font-medium text-deepCharcoal transition-all hover:scale-105 hover:shadow-2xl hover:shadow-softGold/30"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Explore Strategic Tools
                      </Link>
                      <Link
                        href="/events"
                        className="group inline-flex items-center gap-3 rounded-full border border-softGold px-8 py-4 font-medium text-softGold transition-all hover:bg-softGold/10 hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        View Upcoming Events
                      </Link>
                      <Link
                        href="/contact"
                        className="group inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/5 px-8 py-4 font-medium text-white transition-all hover:bg-white/10 hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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