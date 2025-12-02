// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import Quote from "@/components/Quote";
import Callout from "@/components/Callout";
import Divider from "@/components/Divider";

// ⬇️ THIS IS THE IMPORTANT LINE
import { allBooks, type Book } from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BookPageMeta {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  author?: string | null;
  readTime?: string | null;
  tags: string[];
  featured: boolean;
  draft: boolean;
  lastModified?: string | null;

  // Extended metadata
  category?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  language?: string | null;
  price?: string | null;
  purchaseLink?: string | null;
  accessLevel?: string | null;
  lockMessage?: string | null;
  pages?: number | null;
  rating?: number | null;
  status?: string | null;
  format?: string | null;
  published?: boolean | null;
}

interface BookPageProps {
  meta: BookPageMeta;
  mdxSource: MDXRemoteSerializeResult;
}

/* -------------------------------------------------------------------------- */
/*  Slug normalisation & alias map                                            */
/* -------------------------------------------------------------------------- */

/**
 * Central place for marketing / legacy aliases.
 * LEFT  = path segment in the URL
 * RIGHT = canonical `Book.slug` in Contentlayer
 *
 * IMPORTANT:
 * Do NOT add aliases here that already have their own dedicated page file
 * under /pages/books, or you'll get Conflicting SSG paths.
 */
const BOOK_ALIAS_MAP: Record<string, string> = {
  // Example (only if no dedicated /books/the-architecture-of-human-purpose-landing.tsx file exists):
  // "the-architecture-of-human-purpose-landing": "the-architecture-of-human-purpose",
};

function normaliseSlugParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

/**
 * Resolve a requested slug to the canonical Contentlayer book
 * and the canonical slug.
 */
function resolveBookBySlug(
  requestedSlug: string
): { book: Book; canonicalSlug: string; requestedSlug: string } | null {
  const trimmed = requestedSlug.trim();
  const canonicalSlug = BOOK_ALIAS_MAP[trimmed] ?? trimmed;
  const book = allBooks.find((b) => b.slug === canonicalSlug);
  if (!book) return null;
  return { book, canonicalSlug, requestedSlug: trimmed };
}

/* -------------------------------------------------------------------------- */
/*  Helper: remove undefined                                                  */
/* -------------------------------------------------------------------------- */

function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key as keyof T] = obj[key];
    }
  });
  return result;
}

/* -------------------------------------------------------------------------- */
/*  Enhanced MDX Components                                                   */
/* -------------------------------------------------------------------------- */

type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
} & Record<string, unknown>;

type AnchorProps = React.ComponentPropsWithoutRef<"a">;

const enhancedMdxComponents = {
  ...mdxComponents,
  Quote: (props: MDXComponentProps) => (
    <div className="my-8">
      <Quote {...props} />
    </div>
  ),
  Callout: (props: MDXComponentProps) => (
    <div className="my-6">
      <Callout {...props} />
    </div>
  ),
  Divider: (props: MDXComponentProps) => (
    <div className="my-10">
      <Divider {...props} />
    </div>
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    const safeHref = href ?? "#";
    const isInternal = safeHref.startsWith("/") || safeHref.startsWith("#");

    if (isInternal) {
      return (
        <Link
          href={safeHref}
          className="text-softGold hover:text-softGold/80 transition-colors duration-200 underline underline-offset-4"
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-softGold hover:text-softGold/80 transition-colors duration-200 underline underline-offset-4"
        {...props}
      >
        {children}
      </a>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Share Component                                                           */
/* -------------------------------------------------------------------------- */

type BookShareProps = {
  meta: BookPageMeta;
};

function BookShare({ meta }: BookShareProps): JSX.Element {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const url = `${SITE_URL}/books/${meta.slug}`;
  const text = `"${meta.title}" by Abraham of London`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const shareButtons = [
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: "👔",
    },
    {
      name: "X",
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: "🐦",
    },
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: "💬",
    },
    {
      name: "Email",
      url: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: "✉️",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs uppercase tracking-[0.18em] text-gray-500">
        Share:
      </span>
      {shareButtons.map((button) => (
        <a
          key={button.name}
          href={button.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-gray-600 
            px-3 py-1.5 text-xs text-gray-200 
            transition-all duration-200 
            hover:border-softGold hover:text-softGold 
            hover:shadow-lg hover:scale-105
          "
          title={`Share on ${button.name}`}
        >
          <span className="text-xs">{button.icon}</span>
          {button.name}
        </a>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Safe access helper functions                                              */
/* -------------------------------------------------------------------------- */

function safeSplit(str: string | undefined | null, delimiter: string): string[] {
  if (!str) return [];
  return str.split(delimiter).map(s => s.trim());
}

function safeCookieAccess(): string {
  if (typeof document === "undefined") return "";
  return document.cookie || "";
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

const BookPage = ({ meta, mdxSource }: BookPageProps): JSX.Element => {
  const {
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    author,
    readTime,
    tags = [], // Provide default value
    category,
    publishedDate,
    pages,
    language,
    isbn,
    rating,
    price,
    purchaseLink,
    publisher,
    accessLevel,
    lockMessage,
    lastModified,
    slug,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    
    const checkAccess = () => {
      if (typeof document !== "undefined") {
        try {
          const hasCookie = safeCookieAccess()
            .split(";")
            .map((part) => part.trim())
            .some((part) => part.startsWith("innerCircleAccess=true"));
          setHasAccess(hasCookie);
        } catch (error) {
          console.error("Error checking access:", error);
          setHasAccess(false);
        }
      }
      setCheckedAccess(true);
    };
    checkAccess();
  }, []);

  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);

  const displayDescription =
    description || excerpt || subtitle || "Book from Abraham of London.";

  const pageTitle = `${title} | Books | Abraham of London`;

  const catalogueDate =
    lastModified && !Number.isNaN(new Date(lastModified).getTime())
      ? new Date(lastModified).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}/books/${slug}`;

  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(
    `/books/${slug}`
  )}`;

  // Safe metadata items with null checks
  const metadataItems = [
    { label: "Read time", value: readTime },
    { label: "Published", value: publishedDate },
    { label: "Pages", value: pages },
    { label: "Language", value: language },
    { label: "ISBN", value: isbn },
    { label: "Rating", value: rating ? `${rating}/5` : null },
    { label: "Category", value: category },
    { label: "Price", value: price },
  ].filter((item) => item.value != null && item.value !== "");

  // Safe tag check
  const hasTags = tags?.length > 0;

  // Don't render until we're on the client to avoid hydration mismatch
  if (!isClient && isInnerCircle) {
    return (
      <SiteLayout pageTitle={pageTitle} metaDescription={displayDescription}>
        <div className="min-h-screen bg-charcoal flex items-center justify-center">
          <div className="text-center text-gray-400">
            Loading book...
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={displayDescription}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={displayDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta
          property="og:description"
          content={displayDescription ?? ""}
        />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        {coverImage && <meta property="og:image" content={coverImage} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta
          name="twitter:description"
          content={displayDescription ?? ""}
        />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Head>

      <article className="min-h-screen bg-gradient-to-b from-charcoal to-charcoal-dark text-cream">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/95 to-charcoal/90">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* Cover Image */}
              <div className="flex items-start justify-center lg:col-span-1">
                {coverImage && (
                  <div className="group relative">
                    <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-softGold/20 to-softGold/10 blur-xl opacity-50 transition-opacity duration-500 group-hover:opacity-75" />
                    <div className="relative">
                      <Image
                        src={coverImage}
                        alt={title}
                        width={400}
                        height={560}
                        className="h-auto w-full max-w-xs rounded-xl border-2 border-softGold/30 shadow-2xl transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata / Header Copy */}
              <div className="lg:col-span-2">
                <header className="mb-8">
                  <div className="mb-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h1 className="font-serif text-4xl font-bold leading-tight text-cream lg:text-5xl">
                        {title}
                      </h1>

                      {isInnerCircle && (
                        <span className="inline-flex items-center rounded-full border border-softGold/70 bg-softGold/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-softGold transition-transform duration-200 hover:scale-105">
                          <span className="mr-2">🔒</span>
                          Inner Circle Volume
                        </span>
                      )}
                    </div>

                    {subtitle && (
                      <p className="text-xl font-light leading-relaxed text-gray-300 lg:text-2xl">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Author & Publisher */}
                  <div className="mb-6 space-y-3">
                    {author && (
                      <p className="text-lg text-gray-300">
                        By{" "}
                        <span className="font-semibold text-softGold">
                          {author}
                        </span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      {publisher && (
                        <span className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-softGold" />
                          Published by {publisher}
                        </span>
                      )}
                      {catalogueDate && (
                        <span className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-softGold" />
                          Added {catalogueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {description && (
                    <p className="mb-6 border-l-4 border-softGold/50 pl-4 text-lg leading-relaxed text-gray-300">
                      {description}
                    </p>
                  )}

                  {/* Inner Circle Banner */}
                  {isInnerCircle && (
                    <div className="rounded-2xl border border-softGold/50 bg-black/40 p-6 backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
                        🔒 Inner Circle Exclusive
                      </p>
                      <p className="text-cream leading-relaxed">
                        {lockMessage ||
                          "This volume is catalogued as part of the Inner Circle library. Full access is reserved for members who are building the next generation of purpose-driven leadership."}
                      </p>
                    </div>
                  )}
                </header>

                {/* Metadata Grid */}
                {metadataItems.length > 0 && (
                  <section className="mb-8">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {metadataItems.map((item, index) => (
                        <div
                          key={item.label}
                          className="transform rounded-xl border border-gray-700/50 bg-black/30 p-4 text-center transition-all duration-200 hover:scale-105"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="mb-1 text-sm font-semibold text-softGold">
                            {item.label}
                          </div>
                          <div className="text-lg font-medium text-cream">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  {purchaseLink && (
                    <a
                      href={purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transform inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-4 text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:scale-105 hover:bg-softGold/90 hover:shadow-xl"
                    >
                      <span>🛒</span>
                      Purchase Book
                    </a>
                  )}

                  <div className="min-w-[200px] flex-1">
                    <BookShare meta={meta} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-4xl px-6 pb-20">
          <section
            className="
              prose prose-invert prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-cream
              prose-h1:mb-8 prose-h1:text-4xl prose-h1:font-bold prose-h1:leading-tight
              prose-h2:mb-6 prose-h2:text-3xl prose-h2:font-semibold
              prose-h3:mb-4 prose-h3:text-2xl prose-h3:font-semibold
              prose-h4:mb-4 prose-h4:text-xl prose-h4:font-semibold
              prose-p:mb-6 prose-p:text-lg prose-p:leading-relaxed prose-p:text-gray-200
              prose-strong:font-semibold prose-strong:text-cream
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-ul:text-gray-200 prose-ol:text-gray-200
              prose-li:mb-2 prose-li:leading-relaxed
              prose-blockquote:border-softGold prose-blockquote:border-l-4
              prose-blockquote:bg-charcoal/50 prose-blockquote:pl-6
              prose-blockquote:py-4 prose-blockquote:italic
              prose-blockquote:text-gray-300 prose-blockquote:rounded-r-xl
              prose-blockquote:my-8
              prose-hr:my-12 prose-hr:border-gray-600
              prose-img:mx-auto prose-img:rounded-2xl prose-img:shadow-2xl
              prose-pre:border prose-pre:border-gray-700
              prose-pre:bg-gray-900 prose-pre:p-6 prose-pre:rounded-xl
              prose-table:border-gray-600 prose-td:border-gray-600
              prose-th:bg-gray-800 prose-th:text-cream
            "
          >
            {isInnerCircle && isLocked ? (
              <div className="transform mx-auto max-w-md rounded-2xl border-2 border-softGold/50 bg-gradient-to-br from-black/70 to-charcoal/90 px-8 py-16 text-center backdrop-blur-sm transition-transform duration-500 hover:scale-[1.01]">
                <div className="mb-6 text-6xl">🔒</div>
                <h3 className="mb-4 font-serif text-3xl text-cream">
                  Inner Circle Volume
                </h3>
                <p className="mb-8 text-lg leading-relaxed text-gray-200">
                  {lockMessage ||
                    "This manuscript is reserved for Inner Circle members. Unlock access to read the full volume and join a community of builders shaping the future."}
                </p>
                <Link
                  href={joinUrl}
                  className="transform inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-softGold/90 hover:shadow-xl"
                >
                  <span>⚡</span>
                  Join the Inner Circle
                </Link>
              </div>
            ) : (
              <MDXRemote
                {...mdxSource}
                components={enhancedMdxComponents as any}
              />
            )}
          </section>

          {/* Additional Info */}
          {(publisher || hasTags) && (
            <div className="mt-20 border-t border-gray-700 pt-12">
              <h3 className="mb-8 text-center font-serif text-2xl font-semibold text-cream">
                Book Details
              </h3>
              <div className="grid gap-8 md:grid-cols-2">
                {publisher && (
                  <div className="rounded-xl border border-gray-700/50 bg-black/30 p-6 text-center">
                    <div className="mb-2 text-sm font-semibold text-softGold">
                      Publisher
                    </div>
                    <div className="text-lg text-cream">{publisher}</div>
                  </div>
                )}

                {hasTags && (
                  <div className="rounded-xl border border-gray-700/50 bg-black/30 p-6 text-center">
                    <div className="mb-4 text-sm font-semibold text-softGold">
                      Tags & Categories
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="transform rounded-full border border-gray-600 bg-gray-700/50 px-4 py-2 text-sm text-gray-300 transition-transform duration-200 hover:scale-105"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </SiteLayout>
  );
};

export default BookPage;

/* -------------------------------------------------------------------------- */
/*  Static Generation                                                         */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  // Base slugs from content — one per Book document, excluding drafts
  const baseSlugs = allBooks
    .filter((b) => !b.draft)
    .map((b) => b.slug);

  // Aliases that point to an existing base slug
  const aliasSlugs = Object.entries(BOOK_ALIAS_MAP)
    .filter(([, targetSlug]) => baseSlugs.includes(targetSlug))
    .map(([alias]) => alias);

  // Deduplicate everything to avoid Conflicting SSG paths
  const uniqueSlugs = Array.from(new Set([...baseSlugs, ...aliasSlugs]));

  const paths = uniqueSlugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({
  params,
}) => {
  const rawSlug = normaliseSlugParam(params?.slug);
  const resolved = resolveBookBySlug(rawSlug);

  if (!resolved) {
    return { notFound: true };
  }

  const { book, canonicalSlug } = resolved;

  const mdxSource = await serialize(book.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  // Build clean meta object without undefined values
  const cleanMeta = removeUndefined({
    title: book.title,
    subtitle: book.subtitle ?? null,
    description: book.description ?? null,
    excerpt: book.excerpt ?? null,
    slug: canonicalSlug,
    coverImage: book.coverImage ?? null,
    author: book.author ?? "Abraham of London",
    readTime: book.readTime ?? null,
    tags: book.tags ?? [],
    featured: !!book.featured,
    draft: !!book.draft,
    lastModified: book.lastModified ?? null,

    // Extended fields
    category: (book as any).category ?? null,
    isbn: (book as any).isbn ?? null,
    publisher: (book as any).publisher ?? null,
    publishedDate: (book as any).publishedDate ?? null,
    language: (book as any).language ?? null,
    price: (book as any).price ?? null,
    purchaseLink: (book as any).purchaseLink ?? null,
    accessLevel: (book as any).accessLevel ?? null,
    lockMessage: (book as any).lockMessage ?? null,
    pages: (book as any).pages ?? null,
    rating: (book as any).rating ?? null,
    status: (book as any).status ?? null,
    format: (book as any).format ?? null,
    published: (book as any).published ?? null,
  });

  return {
    props: {
      meta: cleanMeta as BookPageMeta,
      mdxSource,
    },
    revalidate: 3600,
  };
};