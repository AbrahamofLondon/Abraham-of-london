// pages/books/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import BookCard from "@/components/BookCard";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import { CTA_PRESETS } from "@/components/mdx/ctas";
import { getAllBooks } from "@/lib/books";

type BookMetaSafe = {
  slug: string;
  title: string | null;
  author: string | null;
  excerpt: string | null;
  coverImage: string | null;
  buyLink: string | null;
  genre: string | null;
  downloadPdf: string | null;
  downloadEpub: string | null;
};

type Props = { books: BookMetaSafe[] };

// Optionally pin one or more featured titles by slug
const FEATURED_SLUGS = ["the-fiction-adaptation"];

/** Compact genre “shelves” with counts (popular first), clickable to filter */
function GenreShelves({
  books,
  active,
  onSelect,
}: {
  books: { genre: string | null }[];
  active: string;
  onSelect: (g: string) => void;
}) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of books) {
      const g = b.genre || "Uncategorized";
      map.set(g, (map.get(g) || 0) + 1);
    }
    // Popular first, then A→Z
    return Array.from(map.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
  }, [books]);

  const total = books.length;

  const Pill = ({
    label,
    count,
    selected,
    onClick,
  }: {
    label: string;
    count: number;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-cream"
          : "whitespace-nowrap rounded-full border border-lightGrey bg-white px-3 py-1.5 text-xs font-medium text-deepCharcoal/85 hover:bg-warmWhite"
      }
      aria-pressed={selected}
    >
      {label} <span className="ml-1.5 opacity-70">({count})</span>
    </button>
  );

  return (
    <div
      aria-label="Series shelves by genre"
      className="not-prose mb-4 overflow-x-auto rounded-xl border border-lightGrey bg-warmWhite/60 p-3"
    >
      <div className="flex min-w-max items-center gap-6 px-1">
        <Pill
          label="All"
          count={total}
          selected={active === "All"}
          onClick={() => onSelect("All")}
        />
        {counts.map(([g, c]) => (
          <Pill
            key={g}
            label={g}
            count={c}
            selected={active === g}
            onClick={() => onSelect(g)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BooksIndex({ books }: Props) {
  const router = useRouter();

  // --- Genres
  const genres = React.useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genre && set.add(b.genre));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [books]);

  // --- Initial state from URL
  const initialQ = typeof router.query.q === "string" ? router.query.q : "";
  const initialGenre =
    typeof router.query.genre === "string" && genres.includes(router.query.genre)
      ? router.query.genre
      : "All";

  const [q, setQ] = React.useState(initialQ);
  const [genre, setGenre] = React.useState(initialGenre);

  const hasFilters = q !== "" || genre !== "All";

  // --- Keep URL in sync (shallow)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre && genre !== "All") params.set("genre", genre);
    router.replace(params.toString() ? `/books?${params}` : "/books", undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, genre]);

  // --- Filtering
  const filtered = React.useMemo(
    () =>
      books.filter((b) => {
        const matchesGenre = genre === "All" || b.genre === genre;
        const needle = q.trim().toLowerCase();
        const matchesQ =
          !needle ||
          (b.title ?? "").toLowerCase().includes(needle) ||
          (b.excerpt ?? "").toLowerCase().includes(needle) ||
          (b.author ?? "").toLowerCase().includes(needle);
        return matchesGenre && matchesQ;
      }),
    [books, q, genre]
  );

  // --- Featured pick (first matching from FEATURED_SLUGS, else first filtered)
  const featured = React.useMemo(() => {
    const bySlug =
      FEATURED_SLUGS.map((s) => filtered.find((b) => b.slug === s)).find(Boolean) || null;
    return bySlug || filtered[0] || null;
  }, [filtered]);

  const leadershipCTA = CTA_PRESETS.leadership;

  // --- UI helpers
  const resetFilters = () => {
    setQ("");
    setGenre("All");
  };

  // JSON-LD ItemList for SEO
  const itemList = filtered.map((b, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `/books/${b.slug}`,
    name: b.title ?? "Untitled",
  }));

  return (
    <Layout pageTitle="Books">
      <Head>
        <title>Books | Abraham of London</title>
        <meta
          name="description"
          content="Books by Abraham of London — clarity, conviction, endurance."
        />
        {/* JSON-LD: ItemList */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Books",
              itemListElement: itemList,
            }),
          }}
        />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Top bar */}
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Books" }]} />
            <p className="text-xs text-deepCharcoal/60">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>

          {/* Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Books</h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              Works of memoir, conviction, and craftsmanship. Written to endure.
            </p>
          </header>

          {/* Featured Book */}
          {featured && (
            <section
              aria-labelledby="featured-book"
              className="mb-10 overflow-hidden rounded-2xl border border-lightGrey bg-warmWhite p-5 shadow-card"
            >
              <h2 id="featured-book" className="mb-3 text-sm font-semibold uppercase tracking-wide text-deepCharcoal/70">
                Featured
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="md:col-span-2">
                  <h3 className="font-serif text-2xl text-forest">
                    <Link href={`/books/${featured.slug}`} className="luxury-link">
                      {featured.title ?? "Untitled"}
                    </Link>
                  </h3>
                  {featured.excerpt && (
                    <p className="mt-2 text-deepCharcoal/80">{featured.excerpt}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link href={`/books/${featured.slug}`} className="aol-btn rounded-full px-4 py-2">
                      Read overview
                    </Link>
                    {featured.buyLink && (
                      <a
                        href={featured.buyLink}
                        className="rounded-full border border-lightGrey px-4 py-2 hover:bg-warmWhite"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buy
                      </a>
                    )}
                    {featured.downloadPdf && (
                      <a
                        href={featured.downloadPdf}
                        className="rounded-full border border-lightGrey px-4 py-2 hover:bg-warmWhite"
                      >
                        PDF
                      </a>
                    )}
                    {featured.downloadEpub && (
                      <a
                        href={featured.downloadEpub}
                        className="rounded-full border border-lightGrey px-4 py-2 hover:bg-warmWhite"
                      >
                        EPUB
                      </a>
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 text-sm text-deepCharcoal/80">
                  <p className="mb-2 font-semibold">Why this book</p>
                  <p>
                    A distilled entry point into the themes readers ask for most:
                    principled love, pressure-tested faith, and the craft of staying.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search books…"
                className="w-full rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
                aria-label="Search books"
              />
            </div>

            {/* Genre pills */}
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const active = genre === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={
                      active
                        ? "rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-cream"
                        : "rounded-full border border-lightGrey px-3 py-1.5 text-xs font-medium text-deepCharcoal/80 hover:bg-warmWhite"
                    }
                    aria-pressed={active}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genre Shelves (popular-first, quick filter) */}
          <GenreShelves
            books={books}
            active={genre}
            onSelect={(g) => {
              setGenre(g);
              // Optional: clear search when switching shelves
              // setQ("");
            }}
          />

          {/* Results count + clear */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-deepCharcoal/60">
              Showing {filtered.length} of {books.length}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-lightGrey px-3 py-1.5 text-xs font-medium text-deepCharcoal/80 hover:bg-warmWhite"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b, i) => (
              <BookCard
                key={b.slug}
                slug={b.slug}
                title={b.title ?? "Untitled"}
                author={b.author ?? "Abraham of London"}
                excerpt={b.excerpt ?? ""}
                coverImage={b.coverImage ?? undefined}
                buyLink={b.buyLink ?? undefined}
                downloadPdf={b.downloadPdf ?? undefined}
                downloadEpub={b.downloadEpub ?? undefined}
                genre={b.genre ?? "Uncategorized"}
                featured={false}
                motionProps={{
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.25 },
                  transition: { duration: 0.5, delay: i * 0.03 },
                }}
              />
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="mt-10 rounded-xl border border-lightGrey bg-warmWhite p-6 text-center text-sm text-deepCharcoal/80">
              <p className="mb-2 font-medium">No books match your filters yet.</p>
              <p>
                Try{" "}
                <button onClick={resetFilters} className="luxury-link">
                  clearing filters
                </button>{" "}
                or start with{" "}
                <Link href="/books/the-fiction-adaptation" className="luxury-link">
                  The Fiction Adaptation
                </Link>
                .
              </p>
            </div>
          )}

          {/* Contextual CTA */}
          <section className="mx-auto mt-12 max-w-3xl">
            <ResourcesCTA
              title={leadershipCTA.title}
              reads={leadershipCTA.reads}
              downloads={leadershipCTA.downloads}
            />
          </section>
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps() {
  const books = getAllBooks([
    "slug",
    "title",
    "author",
    "excerpt",
    "coverImage",
    "buyLink",
    "genre",
    "downloadPdf",
    "downloadEpub",
  ]);

  // JSON-safe: NEVER return undefined
  const safe = books.map((b: any) => ({
    slug: String(b.slug),
    title: b.title ?? null,
    author: b.author ?? null,
    excerpt: b.excerpt ?? null,
    coverImage: b.coverImage ?? null,
    buyLink: b.buyLink ?? null,
    genre: b.genre ?? null,
    downloadPdf: b.downloadPdf ?? null,
    downloadEpub: b.downloadEpub ?? null,
  }));

  return { props: { books: safe }, revalidate: 60 };
}
