// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getAllBooks } from "@/lib/content";

// Infer the book type including the aesthetic signature
type BookDoc = ReturnType<typeof getAllBooks>[number];

type BooksIndexProps = {
  books: BookDoc[];
};

const BooksIndexPage: NextPage<BooksIndexProps> = ({ books }) => {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}/books`;

  return (
    <Layout title="Curated Volumes">
      <Head>
        <title>Curated Volumes | Abraham of London</title>
        <meta
          name="description"
          content="Curated volumes from the Abraham of London Canon — bound knowledge for fathers, founders, and stewards who build with purpose and precision."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* HERO */}
        <section className="border-b border-softGold/20">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(233,200,130,0.22),_transparent_70%)]" />
            <div className="absolute inset-y-0 left-[8%] w-px bg-gradient-to-b from-softGold/70 via-softGold/0 to-transparent" />
            <div className="absolute inset-y-0 right-[12%] w-px bg-gradient-to-t from-softGold/60 via-softGold/0 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pb-14 sm:pt-20">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-softGold/80">
              Abraham of London · Canon
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
              Curated Volumes
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-gray-200 sm:text-[0.95rem]">
              Bound texts from the Canon — where memoir, strategy, theology and
              governance converge into volumes designed to outlive trends and
              outlast headlines.
            </p>
            <p className="mt-2 max-w-2xl text-[0.8rem] text-softGold/80">
              Think of it as the **shelf behind the counter**: you don&apos;t
              browse these casually; you sit with them.
            </p>
          </div>
        </section>

        {/* LIST */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          {books.length === 0 ? (
            <div className="rounded-3xl border border-softGold/30 bg-black/60 p-8 text-center text-sm text-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <p className="font-semibold text-cream">
                No volumes on this shelf yet.
              </p>
              <p className="mt-2 text-gray-300">
                As Canon volumes are finalised, they&apos;ll be catalogued
                here. For now, explore essays and execution tools from the
                Content Library.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <BookRow key={book._id} book={book} />
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

type BookRowProps = {
  book: BookDoc;
};

const BookRow: React.FC<BookRowProps> = ({ book }) => {
  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    date,
    author,
    tags,
    aesthetic,
  } = book as BookDoc & {
    aesthetic?: {
      title: string;
      icon: string;
    };
  };

  const label =
    aesthetic?.title ?? "Curated Volume";

  const categoryIcon = aesthetic?.icon ?? "◆";

  const dateLabel =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : null;

  const href = `/books/${slug}`;

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-softGold/35 bg-gradient-to-r from-charcoal/95 via-charcoal-light/95 to-charcoal/95 px-5 py-4 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-softGold/80"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-softGold/80 via-softGold/35 to-transparent" />
        <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-softGold/30 via-softGold/5 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Left: meta + title */}
        <div className="flex-1 space-y-1.5">
          <p className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
            <span>{categoryIcon}</span>
            <span>{label}</span>
          </p>
          <h2 className="font-serif text-lg font-semibold text-cream sm:text-xl">
            {title}
          </h2>
          {(subtitle || description || excerpt) && (
            <p className="max-w-3xl text-[0.8rem] text-gray-200 group-hover:text-gray-100">
              {subtitle || description || excerpt}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-gray-400">
            {author && <span>By {author}</span>}
            {tags && tags.length > 0 && (
              <>
                <span className="h-3 w-px bg-white/20" />
                <span>{tags.slice(0, 3).join(" · ")}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: date + CTA */}
        <div className="mt-1 flex items-center justify-between gap-6 sm:mt-0 sm:flex-col sm:items-end sm:justify-center sm:text-right">
          {dateLabel && (
            <span className="text-[0.75rem] text-gray-300">
              {dateLabel}
            </span>
          )}
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-softGold group-hover:text-softGold/90">
            Open Volume ↗
          </span>
        </div>
      </div>
    </Link>
  );
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  const books = getAllBooks();

  return {
    props: {
      books,
    },
    revalidate: 3600, // 1h
  };
};

export default BooksIndexPage;