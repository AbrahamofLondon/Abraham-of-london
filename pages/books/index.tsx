// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import SiteLayout from "@/components/SiteLayout";
import { getAllBooksMeta, type BookMeta } from "@/lib/server/books-data";

type BooksPageProps = {
  books: BookMeta[];
};

const BooksPage: NextPage<BooksPageProps> = ({ books }) => {
  // ✅ Always work with a real array
  const safeBooks: BookMeta[] = Array.isArray(books) ? books : [];

  // Sort by date desc, then title for stable UX
  const sortedBooks = React.useMemo(() => {
    const cloned = [...safeBooks];

    cloned.sort((a, b) => {
      const dateA = a.publishedDate || a.date;
      const dateB = b.publishedDate || b.date;

      const da = dateA ? new Date(dateA).getTime() : 0;
      const db = dateB ? new Date(dateB).getTime() : 0;

      if (db !== da) return db - da;
      return (a.title || "").localeCompare(b.title || "");
    });

    return cloned;
  }, [safeBooks]);

  // Featured vs others (non-draft only)
  const { featured, others } = React.useMemo(() => {
    const f: BookMeta[] = [];
    const o: BookMeta[] = [];

    for (const book of sortedBooks) {
      if (book.draft || book.status === "draft") continue;

      if (book.featured) f.push(book);
      else o.push(book);
    }

    return { featured: f, others: o };
  }, [sortedBooks]);

  const hasBooks = sortedBooks.length > 0;

  // Useful derived values
  const nonDraftCount = React.useMemo(
    () => safeBooks.filter((b) => !b.draft && b.status !== "draft").length,
    [safeBooks]
  );

  const categories = React.useMemo(
    () =>
      [...new Set(safeBooks.map((b) => b.category).filter(Boolean as any))] as string[],
    [safeBooks]
  );

  const canonicalUrl = "https://www.abrahamoflondon.org/books";

  return (
    <SiteLayout
      pageTitle="Books | Abraham of London"
      metaDescription="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
    >
      <Head>
        <title>Books | Abraham of London</title>
        <meta
          name="description"
          content="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
        />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Books | Abraham of London" />
        <meta
          property="og:description"
          content="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Books | Abraham of London" />
        <meta
          name="twitter:description"
          content="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
        />

        {/* Structured Data for Collection Page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Books | Abraham of London",
              description:
                "Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy.",
              url: canonicalUrl,
              hasPart: safeBooks
                .filter((book) => !!book.slug && !!book.title)
                .map((book) => ({
                  "@type": "Book",
                  name: book.title,
                  description: book.description || book.excerpt || undefined,
                  url: `https://www.abrahamoflondon.org/${book.slug}`,
                })),
            }),
          }}
        />
      </Head>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {/* PAGE HEADER */}
        <header className="mb-12 text-center">
          <div className="mb-6">
            <span className="inline-flex items-center rounded-full bg-softGold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              Abraham of London · Canon
            </span>
          </div>

          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-gray-50 sm:text-5xl lg:text-6xl">
            Books & Long-Form Works
          </h1>

          <div className="mx-auto mt-6 max-w-3xl">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              The canon is being built in public — one volume at a time. Here
              you&apos;ll find the books, prelude editions, and long-form
              projects that anchor the wider Abraham of London ecosystem.
            </p>
          </div>

          {/* Stats */}
          {hasBooks && (
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-softGold">
                  {nonDraftCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Published Works
                </div>
              </div>

              {categories.length > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-softGold">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Categories
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* EMPTY STATE */}
        {!hasBooks && (
          <section className="mx-auto max-w-2xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Books are coming soon
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              The first volumes of the canon are in final preparation. Check
              back shortly, or join the Inner Circle to be notified when new
              releases go live.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://innercircle.abrahamoflondon.org"
                className="inline-flex items-center gap-2 rounded-lg bg-softGold px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Join Inner Circle
              </a>
            </div>
          </section>
        )}

        {hasBooks && (
          <div className="space-y-16">
            {/* FEATURED SECTION */}
            {featured.length > 0 && (
              <section>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                      Featured Releases
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Highlighted works from the collection
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {featured.length} featured{" "}
                      {featured.length === 1 ? "book" : "books"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {featured.map((book) => (
                    <BookCard key={book.slug} book={book} prominent />
                  ))}
                </div>
              </section>
            )}

            {/* OTHER BOOKS */}
            {others.length > 0 && (
              <section>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Complete Collection
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      All published works in chronological order
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {others.length}{" "}
                      {others.length === 1 ? "work" : "works"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {others.map((book) => (
                    <BookCard key={book.slug} book={book} />
                  ))}
                </div>
              </section>
            )}

            {/* CATEGORY CHIPS */}
            {hasBooks && categories.length > 0 && (
              <div className="border-t border-gray-200 pt-12 dark:border-gray-800">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-gray-50">
                      Explore by Category
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Browse books by theme and subject
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 6).map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </SiteLayout>
  );
};

type BookCardProps = {
  book: BookMeta;
  prominent?: boolean;
};

const BookCard: React.FC<BookCardProps> = ({ book, prominent = false }) => {
  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    date,
    publishedDate,
    readTime,
    tags,
    format,
    publisher,
  } = book;

  const href = `/${slug}`; // your slugs already include "books/..." where needed
  const label = title || "Untitled book";
  const copy = description || excerpt || subtitle || "";
  const displayDate = publishedDate || date;
  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [];

  return (
    <Link
      href={href}
      className={[
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-softGold/70 hover:shadow-xl dark:border-gray-800 dark:bg-gray-950/70",
        prominent ? "lg:col-span-1" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Format badge */}
      {format && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {format}
          </span>
        </div>
      )}

      {coverImage && (
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
          <Image
            src={coverImage}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-all duration-500 group-hover:scale-[1.03]"
            priority={prominent}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-serif text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-softGold dark:text-gray-50">
              {label}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {copy && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {copy}
            </p>
          )}

          {publisher && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {publisher}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-gray-600 dark:bg-gray-900 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {displayDate && (
                <span>{new Date(displayDate).getFullYear()}</span>
              )}

              {readTime && (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3 w-3"
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
                  {readTime}
                </span>
              )}
            </div>

            <span className="text-xs font-medium text-softGold transition-colors group-hover:text-amber-500">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    const books = getAllBooksMeta();

    const validBooks = books.filter((book): book is BookMeta => {
      if (!book || !book.slug || !book.title) return false;

      if (book.draft === true || book.status === "draft") {
        // Never expose drafts in production
        return process.env.NODE_ENV !== "production";
      }

      return true;
    });

    const sortedBooks = [...validBooks].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      const dateA = a.publishedDate || a.date;
      const dateB = b.publishedDate || b.date;

      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }

      return 0;
    });

    return {
      props: {
        books: sortedBooks,
      },
      revalidate: process.env.NODE_ENV === "production" ? 3600 : 60,
    };
  } catch (error) {
    console.error("Error in books page getStaticProps:", error);

    return {
      props: { books: [] },
      revalidate: 60,
    };
  }
};

export default BooksPage;