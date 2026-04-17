import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import { BookListCard } from "@/components/books/BookListCard";
import { getAllBooks } from "@/lib/content/server";
import { resolveDocCoverImage } from "@/lib/content/shared";

type BookDoc = {
  slug?: string;
  url?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  category?: string | null;
  date?: string | null;
  readingTime?: string | null;
  featured?: boolean | null;
};

type BookItem = {
  slug: string;
  url: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  tags: string[];
  category: string;
  date: string;
  readingTime: string;
  featured: boolean;
};

type BooksPageProps = {
  books: BookItem[];
  featured: BookItem[];
  library: BookItem[];
  tags: string[];
  heroBook: BookItem | null;
};

const FALLBACK_BOOK_COVER =
  "/assets/images/books/the-architecture-of-human-purpose.jpg";

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function normalizeBook(doc: BookDoc): BookItem {
  const slug = safeString(doc.slug, "untitled-book");
  const url = safeString(doc.url, `/books/${slug}`);
  const title = safeString(doc.title, "Untitled Volume");
  const subtitle = safeString(doc.subtitle, "");
  const description = safeString(
    doc.description,
    safeString(doc.excerpt, "A long-form work from Abraham of London."),
  );

  const resolvedCover = safeString(
    resolveDocCoverImage(doc as never, { contentType: "BOOK" }),
    FALLBACK_BOOK_COVER,
  );

  return {
    slug,
    url,
    title,
    subtitle,
    description,
    coverImage: resolvedCover || FALLBACK_BOOK_COVER,
    tags: safeArray(doc.tags),
    category: safeString(doc.category, "Book"),
    date: safeString(doc.date, ""),
    readingTime: safeString(doc.readingTime, ""),
    featured: Boolean(doc.featured),
  };
}

function formatEyebrowCount(count: number): string {
  return `${count} ${count === 1 ? "title" : "titles"}`;
}

function HeroPanel({ heroBook }: { heroBook: BookItem | null }) {
  if (!heroBook) {
    return (
      <div
        className="relative overflow-hidden rounded-[2rem] border"
        style={{
          borderColor: "var(--ds-border)",
          background:
            "linear-gradient(180deg, var(--ds-panel-alt) 0%, var(--ds-panel) 100%)",
        }}
      >
        <div className="grid min-h-[420px] place-items-center px-8 py-12 text-center">
          <div className="max-w-xl">
            <div
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Catalogue Banner
            </div>
            <h2
              className="font-serif text-4xl leading-[0.95] md:text-5xl"
              style={{ color: "var(--ds-text)" }}
            >
              Built for builders who govern what they touch.
            </h2>
            <p
              className="mt-5 text-base leading-8"
              style={{ color: "var(--ds-text-muted)" }}
            >
              Premium long-form works, ordered for clarity, memory, and return
              value.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border"
      style={{
        borderColor: "var(--ds-border)",
        background:
          "linear-gradient(180deg, var(--ds-panel-alt) 0%, var(--ds-panel) 100%)",
      }}
    >
      <div className="grid min-h-[420px] gap-0 md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative flex items-end overflow-hidden px-8 py-8 md:px-10 md:py-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 18% 18%, rgba(201,169,110,0.12) 0%, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <div
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em]"
              style={{ color: "var(--ds-accent)" }}
            >
              Featured Volume
            </div>

            <h2
              className="font-serif text-4xl leading-[0.94] md:text-6xl"
              style={{ color: "var(--ds-text)" }}
            >
              {heroBook.title}
            </h2>

            {heroBook.subtitle ? (
              <p
                className="mt-4 max-w-[34ch] font-serif text-xl leading-8 md:text-2xl"
                style={{ color: "var(--ds-text-muted)" }}
              >
                {heroBook.subtitle}
              </p>
            ) : null}

            <p
              className="mt-6 max-w-[40ch] text-base leading-8"
              style={{ color: "var(--ds-text-muted)" }}
            >
              {heroBook.description}
            </p>

            <div
              className="mt-8 flex flex-wrap items-center gap-5 text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              {heroBook.date ? <span>{heroBook.date}</span> : null}
              {heroBook.readingTime ? <span>{heroBook.readingTime}</span> : null}
              {heroBook.category ? <span>{heroBook.category}</span> : null}
            </div>

            <div className="mt-8">
              <Link
                href={heroBook.url}
                className="inline-flex items-center gap-3 border px-6 py-4 transition"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                Read Volume
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[320px] md:min-h-full">
          <div
            className="absolute inset-6 overflow-hidden rounded-[1.6rem] border"
            style={{
              borderColor: "var(--ds-border)",
              backgroundColor: "var(--ds-background-muted)",
            }}
          >
            <Image
              src={heroBook.coverImage || FALLBACK_BOOK_COVER}
              alt={heroBook.title}
              fill
              sizes="(max-width: 768px) 100vw, 38vw"
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(3,3,5,0.08) 0%, rgba(3,3,5,0.18) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <div
          className="mb-3 font-mono text-[10px] uppercase tracking-[0.34em]"
          style={{ color: "var(--ds-accent)" }}
        >
          {eyebrow}
        </div>
        <h2
          className="font-serif text-3xl leading-none md:text-4xl"
          style={{ color: "var(--ds-text)" }}
        >
          {title}
        </h2>
      </div>

      {count ? (
        <div
          className="hidden font-mono text-[10px] uppercase tracking-[0.32em] md:block"
          style={{ color: "var(--ds-text-subtle)" }}
        >
          {count}
        </div>
      ) : null}
    </div>
  );
}

export default function BooksPage({
  books,
  featured,
  library,
  tags,
  heroBook,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [query, setQuery] = React.useState("");
  const [activeTag, setActiveTag] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return books.filter((book) => {
      const matchesTag =
        activeTag === "All" ||
        book.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase()) ||
        book.category.toLowerCase() === activeTag.toLowerCase();

      if (!matchesTag) return false;
      if (!q) return true;

      const haystack = [
        book.title,
        book.subtitle,
        book.description,
        book.category,
        ...book.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [books, query, activeTag]);

  const filteredFeatured = filtered.filter((book) => book.featured);
  const filteredLibrary = filtered.filter((book) => !book.featured);

  return (
    <Layout
      title="Books | Abraham of London"
      description="Premium long-form works built for builders, reformers, and serious operators."
      canonicalUrl="/books"
      fullWidth
    >
      <Head>
        <meta property="og:title" content="Books | Abraham of London" />
      </Head>

      <main
        className="ds-surface-books min-h-screen"
        style={{ backgroundColor: "var(--ds-background)" }}
      >
        <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div
                className="inline-flex items-center rounded-full border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-accent)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                Books & Manifestos · {formatEyebrowCount(books.length)}
              </div>

              <h1
                className="mt-7 font-serif text-5xl leading-[0.95] md:text-6xl"
                style={{ color: "var(--ds-text)" }}
              >
                Books
              </h1>

              <p
                className="mt-5 max-w-[24ch] text-xl leading-9"
                style={{ color: "var(--ds-text-muted)" }}
              >
                Premium long-form work — built for builders who govern what they
                touch.
              </p>

              <div className="mt-8">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search books, themes, tags..."
                  className="w-full rounded-full border bg-transparent px-5 py-4 outline-none transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    color: "var(--ds-text)",
                    backgroundColor: "var(--ds-panel)",
                  }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {["All", ...tags].map((tag) => {
                  const active = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(tag)}
                      className="rounded-full border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] transition"
                      style={{
                        borderColor: active
                          ? "var(--ds-accent-soft)"
                          : "var(--ds-border)",
                        backgroundColor: active
                          ? "var(--ds-accent-soft)"
                          : "var(--ds-panel)",
                        color: active
                          ? "var(--ds-accent)"
                          : "var(--ds-text-muted)",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <HeroPanel heroBook={heroBook} />
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-6 py-12 lg:px-12"
          style={{ borderTop: "1px solid var(--ds-border)" }}
        >
          <SectionHeading
            eyebrow="Featured"
            title="Featured Volumes"
            count={`${filteredFeatured.length} entries`}
          />

          {filteredFeatured.length ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredFeatured.map((book, idx) => (
                <BookListCard
                  key={book.slug}
                  book={{
                    url: book.url,
                    title: book.title,
                    subtitle: book.subtitle,
                    coverImage: book.coverImage || FALLBACK_BOOK_COVER,
                    date: book.date,
                    readTime: book.readingTime,
                    tags: book.tags,
                    featured: true,
                  }}
                  priority={idx === 0}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-[1.5rem] border p-8"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
                color: "var(--ds-text-muted)",
              }}
            >
              No featured volumes match the current filter.
            </div>
          )}
        </section>

        <section
          className="mx-auto max-w-7xl px-6 py-12 lg:px-12"
          style={{ borderTop: "1px solid var(--ds-border)" }}
        >
          <SectionHeading
            eyebrow="Library"
            title="Full Catalogue"
            count={`${filteredLibrary.length} volumes`}
          />

          {filteredLibrary.length ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredLibrary.map((book) => (
                <BookListCard
                  key={book.slug}
                  book={{
                    url: book.url,
                    title: book.title,
                    subtitle: book.subtitle,
                    coverImage: book.coverImage || FALLBACK_BOOK_COVER,
                    date: book.date,
                    readTime: book.readingTime,
                    tags: book.tags,
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-[1.5rem] border p-8"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
                color: "var(--ds-text-muted)",
              }}
            >
              No volumes match the current search and tag combination.
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  const rawBooks = (await getAllBooks()) as BookDoc[];

  const books = rawBooks.map(normalizeBook);

  const featured = books.filter((book) => book.featured);
  const library = books.filter((book) => !book.featured);

  const tags = Array.from(
    new Set(
      books.flatMap((book) => [book.category, ...book.tags].filter(Boolean)),
    ),
  )
    .map((tag) => String(tag))
    .sort((a, b) => a.localeCompare(b));

  const heroBook = featured[0] ?? books[0] ?? null;

  return {
    props: {
      books,
      featured,
      library,
      tags,
      heroBook,
    },
    revalidate: 300,
  };
};