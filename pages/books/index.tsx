// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  getAllBooksMeta,
  type BookMeta,
} from "@/lib/server/books-data";

interface BooksIndexProps {
  books: BookMeta[];
}

// ---------- Helpers ----------

function normaliseDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;

  if (raw instanceof Date) return raw.toISOString();

  try {
    const d = new Date(raw as any);
    if (!Number.isNaN(d.valueOf())) return d.toISOString();
  } catch {
    // ignore
  }
  return undefined;
}

function formatPrettyDate(input: string | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.valueOf())) return input;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// ---------- Page ----------

function BooksIndexPage({ books }: BooksIndexProps) {
  const hasBooks = Array.isArray(books) && books.length > 0;

  return (
    <Layout title="Books">
      <Head>
        <title>Books &amp; Manuscripts | Abraham of London</title>
        <meta
          name="description"
          content="Draft manuscripts, working papers, and future books from Abraham of London – for fathers, founders, and board-level leaders."
        />
        <link rel="canonical" href="https://www.abrahamoflondon.org/books" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <header className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
                Books &amp; Manuscripts
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl">
                Working manuscripts for{" "}
                <span className="block bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
                  fathers, founders, and boards.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gold/70 sm:text-xl">
                These are not polished marketing books. They are working
                manuscripts, future projects, and long-form thinking –
                drafts forged in real legal battles, board rooms, and
                fatherhood trenches.
              </p>
            </header>
          </div>
        </section>

        {/* BOOK GRID */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {!hasBooks && (
              <div className="mt-12 rounded-2xl border border-gold/30 bg-charcoal/60 p-8 text-center text-gold/70">
                <p className="text-lg">
                  The shelves are being stocked. The first manuscripts will
                  appear here shortly.
                </p>
              </div>
            )}

            {hasBooks && (
              <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {books.map((book, index) => {
                  const prettyDate = formatPrettyDate(
                    typeof book.date === "string" ? book.date : undefined,
                  );

                  const slug =
                    (typeof book.slug === "string" && book.slug) ||
                    `book-${index}`;

                  const href = `/books/${slug}`;

                  const cover =
                    typeof book.coverImage === "string" &&
                    book.coverImage.trim().length > 0
                      ? book.coverImage
                      : "/assets/images/default-book.jpg";

                  const altText =
                    typeof book.title === "string" && book.title.trim().length
                      ? book.title
                      : "Book cover";

                  const excerptText =
                    typeof book.excerpt === "string"
                      ? book.excerpt
                      : undefined;

                  const authorText =
                    typeof book.author === "string"
                      ? book.author
                      : undefined;

                  const readTimeText =
                    typeof book.readTime === "string"
                      ? book.readTime
                      : undefined;

                  return (
                    <article
                      key={slug}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/70 shadow-lg transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-2xl"
                    >
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image
                          src={cover}
                          alt={altText}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        {prettyDate && (
                          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold/80 backdrop-blur">
                            {prettyDate}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col px-6 py-5">
                        <h2 className="font-serif text-xl font-semibold text-cream">
                          <Link href={href} className="hover:text-gold">
                            {typeof book.title === "string"
                              ? book.title
                              : "Untitled manuscript"}
                          </Link>
                        </h2>

                        {excerptText && (
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gold/70">
                            {excerptText}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gold/60">
                          {authorText && (
                            <span className="rounded-full border border-gold/25 px-3 py-1">
                              {authorText}
                            </span>
                          )}
                          {readTimeText && (
                            <span className="rounded-full border border-gold/15 px-3 py-1">
                              {readTimeText}
                            </span>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between text-sm">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-2 text-gold transition-colors hover:text-amber-200"
                          >
                            Open manuscript
                            <span aria-hidden>↗</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Strategic CTA */}
            <div className="mt-16 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/5 via-charcoal/80 to-forest/30 p-8 text-cream">
              <h2 className="font-serif text-2xl font-semibold">
                Want to work with the ideas before the books hit the shelf?
              </h2>
              <p className="mt-4 max-w-2xl text-gold/80">
                The manuscripts sit in the same pipeline as real advisory
                work: court strategy, market entries, board interventions,
                and fatherhood frameworks. If you want implementation, not
                just reading, start a conversation.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  Explore consulting mandate
                  <span aria-hidden>↗</span>
                </Link>
                <Link
                  href="/downloads"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/60 px-6 py-3 text-sm font-semibold text-gold transition-all hover:bg-gold/10"
                >
                  Field tools &amp; downloads
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

// ---------- SSG ----------

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  try {
    const rawBooks = getAllBooksMeta?.() ?? [];

    const safeBooks: BookMeta[] = rawBooks.map((book) => {
      const safeDate = normaliseDate((book as any).date);

      const cloned = JSON.parse(JSON.stringify(book)) as BookMeta;

      return {
        ...cloned,
        date: safeDate,
      };
    });

    return {
      props: {
        books: safeBooks,
      },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /books:", error);
    return {
      props: {
        books: [],
      },
      revalidate: 600,
    };
  }
};

export default BooksIndexPage;