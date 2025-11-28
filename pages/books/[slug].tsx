// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";

import Quote from "@/components/Quote";
import Callout from "@/components/Callout";
import Divider from "@/components/Divider";

import { getAllBooksMeta, getBookBySlug } from "@/lib/server/books-data";
import type { BookMeta } from "@/types/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtendedBookMeta = BookMeta & {
  accessLevel?: string | null;
  lockMessage?: string | null;
  lastModified?: string | null;
  format?: string | null;
  pages?: number | null;
  rating?: number | null;
  published?: boolean | null;
  status?: string | null;
  price?: string | null;
  purchaseLink?: string | null;
};

type PageProps = {
  meta: ExtendedBookMeta;
  mdxSource: MDXRemoteSerializeResult | null;
};

// ---------------------------------------------------------------------------
// MDX component wiring (no any, fully typed)
// ---------------------------------------------------------------------------

type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
} & Record<string, unknown>;

type AnchorProps = React.ComponentPropsWithoutRef<"a">;

const mdxComponents = {
  Quote: Quote as React.ComponentType<MDXComponentProps>,
  Callout: Callout as React.ComponentType<MDXComponentProps>,
  Divider: Divider as React.ComponentType<MDXComponentProps>,
  a: ({ href, children, ...props }: AnchorProps) => {
    const safeHref = href ?? "#";
    const isInternal =
      safeHref.startsWith("/") || safeHref.startsWith("#");

    if (isInternal) {
      return (
        <Link href={safeHref} {...props}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("innerCircleAccess=true"));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BookPage({ meta, mdxSource }: PageProps) {
  const {
    title,
    subtitle,
    description,
    author,
    date,
    coverImage,
    readTime,
    category,
    publishedDate,
    pages,
    language,
    isbn,
    rating,
    price,
    purchaseLink,
    publisher,
    tags,
    accessLevel,
    lockMessage,
    slug,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(hasInnerCircleCookie());
    setCheckedAccess(true);
  }, []);

  const pageTitle = `${title} | Books`;
  const isInnerCircle = accessLevel === "inner-circle";

  const catalogueDate =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const canonicalUrl = `${SITE_URL}/books/${slug ?? ""}`;
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);

  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(
    `/books/${slug ?? ""}`,
  )}`;

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={description ?? subtitle ?? title}
        />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <article className="mx-auto max-w-6xl px-6 py-14 text-cream">
        {/* HEADER & COVER LAYOUT */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Cover Image - Left Column */}
          <div className="flex items-start justify-center lg:col-span-1">
            {coverImage && (
              <div className="relative w-full max-w-xs">
                <Image
                  src={coverImage}
                  alt={title}
                  width={320}
                  height={440}
                  className="h-auto w-full rounded-xl shadow-2xl"
                  priority
                />
              </div>
            )}
          </div>

          {/* Metadata - Right Column */}
          <div className="lg:col-span-3">
            <header className="mb-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-4xl font-bold text-cream">
                  {title}
                </h1>

                {isInnerCircle && (
                  <span className="inline-flex items-center rounded-full border border-softGold/70 bg-softGold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-softGold">
                    Inner&nbsp;Circle&nbsp;Volume
                  </span>
                )}
              </div>

              {subtitle && (
                <p className="mb-4 text-xl text-gray-300">{subtitle}</p>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                {author && (
                  <p>
                    By{" "}
                    <span className="font-semibold text-softGold">
                      {author}
                    </span>
                  </p>
                )}

                {publisher && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gray-500" />
                    <p>
                      <span className="font-semibold text-gray-300">
                        Publisher:
                      </span>{" "}
                      {publisher}
                    </p>
                  </>
                )}

                {catalogueDate && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gray-500" />
                    <p>
                      <span className="font-semibold text-gray-300">
                        Catalogue date:
                      </span>{" "}
                      {catalogueDate}
                    </p>
                  </>
                )}
              </div>

              {description && (
                <p className="mb-4 leading-relaxed text-gray-300">
                  {description}
                </p>
              )}

              {/* Inner Circle info banner */}
              {isInnerCircle && (
                <div className="mt-4 rounded-xl border border-softGold/70 bg-black/60 px-4 py-3 text-sm text-softGold">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                    Inner Circle
                  </p>
                  <p className="mt-1 text-cream">
                    {lockMessage ||
                      "This volume is catalogued as part of the Inner Circle library. Full access is reserved for Inner Circle members."}
                  </p>
                </div>
              )}
            </header>

            {/* Key Metadata */}
            <section className="mb-6 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
              {readTime && (
                <div>
                  <span className="font-semibold text-softGold">
                    Read time:
                  </span>{" "}
                  {readTime}
                </div>
              )}
              {publishedDate && (
                <div>
                  <span className="font-semibold text-softGold">
                    Published:
                  </span>{" "}
                  {publishedDate}
                </div>
              )}
              {pages && (
                <div>
                  <span className="font-semibold text-softGold">
                    Pages:
                  </span>{" "}
                  {pages}
                </div>
              )}
              {language && (
                <div>
                  <span className="font-semibold text-softGold">
                    Language:
                  </span>{" "}
                  {language}
                </div>
              )}
              {isbn && (
                <div>
                  <span className="font-semibold text-softGold">
                    ISBN:
                  </span>{" "}
                  {isbn}
                </div>
              )}
              {rating && (
                <div>
                  <span className="font-semibold text-softGold">
                    Rating:
                  </span>{" "}
                  {rating}/5
                </div>
              )}
              {category && (
                <div>
                  <span className="font-semibold text-softGold">
                    Category:
                  </span>{" "}
                  {category}
                </div>
              )}
              {price && (
                <div>
                  <span className="font-semibold text-softGold">
                    Price:
                  </span>{" "}
                  {price}
                </div>
              )}
            </section>

            {/* Purchase + Share Row */}
            <div className="flex flex-wrap items-center gap-4">
              {purchaseLink && (
                <a
                  href={purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-softGold/90 hover:shadow-xl"
                >
                  Purchase Book
                </a>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="uppercase tracking-[0.18em] text-gray-500">
                  Share:
                </span>
                <BookShare meta={meta} />
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT SECTION */}
        <section
          className="
            prose prose-invert prose-lg max-w-none
            prose-headings:font-serif prose-headings:text-cream
            prose-h1:mb-6 prose-h1:text-3xl prose-h1:font-bold
            prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-semibold
            prose-h3:mb-3 prose-h3:text-xl prose-h3:font-semibold
            prose-p:mb-4 prose-p:text-gray-200 prose-p:leading-relaxed
            prose-strong:font-semibold prose-strong:text-cream
            prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
            prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:mb-1
            prose-blockquote:border-softGold prose-blockquote:border-l-2
            prose-blockquote:bg-charcoal/50 prose-blockquote:pl-4
            prose-blockquote:py-2 prose-blockquote:italic
            prose-blockquote:text-gray-300 prose-blockquote:rounded-r
            prose-hr:my-8 prose-hr:border-gray-600
            prose-img:rounded-xl prose-img:shadow-lg
            prose-pre:border prose-pre:border-gray-700 prose-pre:bg-gray-900
          "
        >
          {isInnerCircle && isLocked ? (
            <div className="rounded-2xl border border-softGold/50 bg-black/70 px-6 py-10 text-center">
              <h3 className="mb-3 font-serif text-2xl text-cream">
                Inner Circle Volume
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-200">
                {lockMessage ||
                  "This manuscript is reserved for Inner Circle members. Unlock access to read the full volume and supporting material."}
              </p>
              <Link
                href={joinUrl}
                className="inline-block rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-black transition hover:bg-softGold/90"
              >
                Join the Inner Circle
              </Link>
            </div>
          ) : mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-600 bg-charcoal/30 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="mb-4 font-serif text-2xl text-cream">
                  Content Coming Soon
                </h3>
                <p className="mb-6 leading-relaxed text-gray-300">
                  The full manuscript of this volume is being prepared for
                  publication. This is an early catalogue entry from the
                  Abraham of London library.
                </p>
                <Link
                  href="/subscribe"
                  className="inline-block rounded-full bg-softGold px-6 py-2 text-sm font-semibold text-black transition hover:bg-softGold/90"
                >
                  Join the Founding Readers Circle
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ADDITIONAL BOOK INFO */}
        {(publisher || (tags && tags.length > 0)) && (
          <div className="mt-16 border-t border-gray-700 pt-8">
            <h3 className="mb-6 font-serif text-xl font-semibold text-cream">
              Book Details
            </h3>
            <div className="grid gap-4 text-sm text-gray-300">
              {publisher && (
                <div>
                  <span className="font-semibold text-softGold">
                    Publisher:
                  </span>{" "}
                  {publisher}
                </div>
              )}

              {tags && tags.length > 0 && (
                <div>
                  <span className="font-semibold text-softGold">
                    Tags:
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-600 bg-gray-700/50 px-3 py-1 text-xs text-gray-300"
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
      </article>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Lightweight share component (no any, no external deps)
// ---------------------------------------------------------------------------

type BookShareProps = {
  meta: ExtendedBookMeta;
};

function BookShare({ meta }: BookShareProps): JSX.Element {
  const url = `${SITE_URL}/books/${meta.slug ?? ""}`;
  const text = `“${meta.title}” — The Architecture of Human Purpose Canon`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-200 transition hover:border-softGold hover:text-softGold"
      >
        LinkedIn
      </a>
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-200 transition hover:border-softGold hover:text-softGold"
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-200 transition hover:border-softGold hover:text-softGold"
      >
        X
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const metas = getAllBooksMeta();

  const paths =
    metas
      ?.filter((book) => book.slug && book.slug.trim().length > 0)
      .map((book) => ({
        params: { slug: book.slug },
      })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug);
  const book = getBookBySlug(slug) as ExtendedBookMeta | null;

  if (!book) {
    return { notFound: true };
  }

  // Strip import lines from MDX content before serialization
  const rawContent = (book as { content?: string }).content ?? "";
  const cleanContent = rawContent
    .replace(
      /^import\s+.*?\s+from\s+["'][^"']+["'];?\s*$/gm,
      "",
    )
    .trim();

  let mdxSource: MDXRemoteSerializeResult | null = null;

  if (cleanContent.length > 0) {
    try {
      mdxSource = await serialize(cleanContent, {
        mdxOptions: {
          remarkPlugins: [],
          rehypePlugins: [],
        },
      });
    } catch {
      mdxSource = null;
    }
  }

  const safeMeta: ExtendedBookMeta = {
    ...book,
    subtitle: book.subtitle ?? null,
    description: book.description ?? null,
    excerpt: book.excerpt ?? null,
    coverImage: book.coverImage ?? null,
    date: book.date ?? null,
    author: book.author ?? null,
    readTime: book.readTime ?? null,
    lastModified: book.lastModified ?? null,
    category: book.category ?? null,
    isbn: book.isbn ?? null,
    publisher: book.publisher ?? null,
    publishedDate: book.publishedDate ?? null,
    language: book.language ?? null,
    price: book.price ?? null,
    purchaseLink: book.purchaseLink ?? null,
    tags: book.tags ?? [],
    format: book.format ?? null,
    pages: book.pages ?? null,
    rating: book.rating ?? null,
    featured: book.featured ?? false,
    published: book.published ?? false,
    draft: book.draft ?? false,
    status: book.status ?? "draft",
    accessLevel: book.accessLevel ?? null,
    lockMessage: book.lockMessage ?? null,
  };

  // Hard clean: remove all undefined values so Next.js can serialise safely
  const record: Record<string, unknown> = { ...safeMeta };
  Object.keys(record).forEach((key) => {
    if (record[key] === undefined) {
      delete record[key];
    }
  });

  return {
    props: {
      meta: safeMeta,
      mdxSource,
    },
    revalidate: 3600, // 1 hour
  };
};