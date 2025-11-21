// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getAllBooksMeta,
  type BookMeta,
} from "@/lib/server/books-data";

type BooksIndexProps = {
  books: BookMeta[];
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  const books = getAllBooksMeta();
  return {
    props: {
      books,
    },
    revalidate: 3600,
  };
};

export default function BooksIndex({ books }: BooksIndexProps) {
  const pageTitle = "Books & Manuscripts";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        <meta
          name="description"
          content="Books, manuscripts, and long-form projects from Abraham of London."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <header className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Library
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl">
              Books &amp; Manuscripts
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gold/70 max-w-2xl mx-auto">
              Working manuscripts, future releases, and long-form
              projects that carry the weight of fatherhood, strategy,
              and legacy.
            </p>
          </header>

          {books.length === 0 ? (
            <p className="text-center text-gold/60">
              No books are live yet. The shelves are being stocked.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => {
                const date =
                  typeof book.date === "string" && book.date
                    ? new Date(book.date)
                    : null;

                const niceDate =
                  date && !Number.isNaN(date.valueOf())
                    ? date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                return (
                  <article
                    key={book.slug}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-charcoal/70 shadow-md transition-all hover:-translate-y-2 hover:border-gold/40 hover:shadow-xl"
                  >
                    <div className="flex-1 p-6">
                      <h2 className="font-serif text-xl font-semibold text-cream mb-2">
                        <Link href={`/books/${book.slug}`}>
                          {book.title ?? book.slug}
                        </Link>
                      </h2>

                      {book.excerpt && (
                        <p className="text-sm leading-relaxed text-gold/70 line-clamp-3">
                          {String(book.excerpt)}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gold/60">
                        {book.author && <span>By {book.author}</span>}
                        {niceDate && (
                          <span className="rounded-full border border-gold/30 px-2 py-0.5">
                            {niceDate}
                          </span>
                        )}
                        {book.readTime && (
                          <span className="rounded-full border border-gold/30 px-2 py-0.5">
                            {book.readTime}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gold/20 bg-black/30 px-6 py-3 text-right">
                      <Link
                        href={`/books/${book.slug}`}
                        className="text-sm font-semibold text-gold transition-colors hover:text-amber-200"
                      >
                        Open manuscript →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}