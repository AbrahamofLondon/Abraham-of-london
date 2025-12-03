// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import SiteLayout from "@/components/SiteLayout";
import { getAllBooks } from "@/lib/content";
import type { Book } from "contentlayer/generated";

type BooksPageProps = {
  books: Book[];
};

const BooksPage: NextPage<BooksPageProps> = ({ books }) => {
  const safeBooks = Array.isArray(books) ? books : [];

  const sortedBooks = React.useMemo(() => {
    const cloned = [...safeBooks];
    cloned.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (db !== da) return db - da;
      return (a.title || "").localeCompare(b.title || "");
    });
    return cloned;
  }, [safeBooks]);

  const { featured, others } = React.useMemo(() => {
    const f: Book[] = [];
    const o: Book[] = [];
    for (const book of sortedBooks) {
      if ((book as any).featured) f.push(book);
      else o.push(book);
    }
    return { featured: f, others: o };
  }, [sortedBooks]);

  const hasBooks = sortedBooks.length > 0;

  const canonicalUrl = "https://www.abrahamoflondon.org/books";

  const nonDraftCount = safeBooks.length;

  const categories = React.useMemo(
    () =>
      [
        ...new Set(
          safeBooks
            .map((b) => (b as any).category as string | undefined)
            .filter((c): c is string => !!c)
        ),
      ] as string[],
    [safeBooks]
  );

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

        <meta property="og:title" content="Books | Abraham of London" />
        <meta
          property="og:description"
          content="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Books | Abraham of London" />
        <meta
          name="twitter:description"
          content="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
        />

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
              hasPart: safeBooks.map((book) => ({
                "@type": "Book",
                name: book.title,
                description: book.excerpt ?? undefined,
                url: `https://www.abrahamoflondon.org/${
                  book.slug.startsWith("books/") ? book.slug : `books/${book.slug}`
                }`,
              })),
            }),
          }}
        />
      </Head>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {/* HEADER */}
        <header className="mb-12 text-center">
          <div className="mb-6">
            <span className="inline-flex items-center rounded-full bg-softGold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              Abraham of London · Canon
            </span>
          </div>

          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-gray-50 sm:text-5xl lg:text-6xl">
            Books &amp; Long-Form Works
          </h1>

          <div className="mx-auto mt-6 max-w-3xl">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              The canon is being built in public — one volume at a time. Here you&apos;ll
              find the books, prelude editions, and long-form projects that anchor the
              wider Abraham of London ecosystem.
            </p>
          </div>

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

        {!hasBooks && (
          <section className="mx-auto max-w-2xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Books are coming soon
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              The first volumes of the canon are in final preparation. Check back shortly,
              or join the Inner Circle to be notified when new releases go live.
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
                      {others.length} {others.length === 1 ? "work" : "works"}
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
          </div>
        )}
      </main>
    </SiteLayout>
  );
};

type BookCardProps = {
  book: Book;
  prominent?: boolean;
};

const BookCard: React.FC<BookCardProps> = ({ book, prominent = false }) => {
  const { slug, title, excerpt, coverImage, date, tags } = book;

  const href = slug.startsWith("books/") ? `/${slug}` : `/books/${slug}`;
  const label = title || "Untitled book";
  const copy = excerpt ?? "";
  const displayDate = date;
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
          <h3 className="font-serif text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-softGold dark:text-gray-50">
            {label}
          </h3>
          {copy && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {copy}
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
  const books = getAllBooks();
  return {
    props: { books },
    revalidate: process.env.NODE_ENV === "production" ? 3600 : 60,
  };
};

export default BooksPage;