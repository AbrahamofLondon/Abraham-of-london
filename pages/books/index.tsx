// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

import SiteLayout from "@/components/SiteLayout";
import { allBooks, type Book } from "@/lib/contentlayer-helper";

type BooksPageProps = {
  books: Book[];
};

const BooksPage: NextPage<BooksPageProps> = ({ books }) => {
  // ✅ Always work with a real array
  const safeBooks: Book[] = Array.isArray(books) ? books : [];

  // Sort by date desc, then title to keep UX stable
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

  return (
    <SiteLayout
      pageTitle="Books | Abraham of London"
      metaDescription="Books and long-form works from the Abraham of London canon — fatherhood, purpose, governance, and legacy."
    >
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        {/* PAGE HEADER */}
        <header className="mb-10 space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold">
            Abraham of London · Canon · Books
          </p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-50 sm:text-4xl">
            Books & Long-Form Works
          </h1>
          <p className="max-w-2xl text-sm text-gray-700 dark:text-gray-300">
            The canon is being built in public — one volume at a time. Here you&apos;ll
            find the books, prelude editions, and long-form projects that anchor the
            wider Abraham of London ecosystem.
          </p>
        </header>

        {/* EMPTY STATE (defensive) */}
        {!hasBooks && (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
            <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-50">
              Books are coming soon
            </h2>
            <p>
              The first volumes of the canon are in final preparation. Check back
              shortly, or join the Inner Circle to be notified when new releases go
              live.
            </p>
          </section>
        )}

        {hasBooks && (
          <div className="space-y-10">
            {/* FEATURED SECTION */}
            {featured.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                  Featured
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  {featured.map((book) => (
                    <BookCard key={book._id} book={book} prominent />
                  ))}
                </div>
              </section>
            )}

            {/* OTHER BOOKS */}
            {others.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  All books
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((book) => (
                    <BookCard key={book._id} book={book} />
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
  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    date,
    readTime,
    tags,
  } = book;

  const href = `/books/${slug}`;
  const label = title || "Untitled book";
  const copy = description || excerpt || subtitle || "";

  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [];

  return (
    <Link
      href={href}
      className={[
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-softGold/70 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950/70",
        prominent ? "md:col-span-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {coverImage && (
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={coverImage}
            alt={label}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02] group-hover:brightness-[1.05]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-semibold text-gray-900 transition group-hover:text-softGold dark:text-gray-50">
            {label}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
          {copy && (
            <p className="mt-1 line-clamp-3 text-xs text-gray-700 dark:text-gray-300">
              {copy}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-gray-500 dark:text-gray-400">
          {date && (
            <span>
              {new Date(date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          )}

          {readTime && (
            <span className="rounded-full border border-gray-300 px-2 py-0.5 uppercase tracking-[0.15em] dark:border-gray-700">
              {readTime}
            </span>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gray-600 dark:bg-gray-900 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  // ✅ Always return a real array
  const books = Array.isArray(allBooks)
    ? allBooks.filter((b) => !b.draft)
    : [];

  return {
    props: { books },
    // Keep your existing cadence
    revalidate: 60, // 1 minute
  };
};

export default BooksPage;