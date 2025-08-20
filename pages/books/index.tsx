// pages/books/index.tsx
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import BookCard from "@/components/BookCard";
import { getAllBooks, type BookMeta } from "@/lib/books";

type Props = { books: Partial<BookMeta>[] };

export default function BooksIndex({ books }: Props) {
  const router = useRouter();

  const genres = React.useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genre && set.add(b.genre));
    return ["All", ...Array.from(set)];
  }, [books]);

  const initialQ = typeof router.query.q === "string" ? router.query.q : "";
  const initialGenre =
    typeof router.query.genre === "string" && genres.includes(router.query.genre)
      ? router.query.genre
      : "All";

  const [q, setQ] = React.useState(initialQ);
  const [genre, setGenre] = React.useState(initialGenre);

  const hasFilters = q !== "" || genre !== "All";

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre && genre !== "All") params.set("genre", genre);
    router.replace(params.toString() ? `/books?${params}` : "/books", undefined, {
      shallow: true,
    });
  }, [q, genre]); // eslint-disable-line react-hooks/exhaustive-deps

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
    [books, q, genre],
  );

  const resetFilters = () => {
    setQ("");
    setGenre("All");
  };

  return (
    <Layout pageTitle="Books">
      <Head>
        <meta
          name="description"
          content="Books by Abraham of London — clarity, conviction, endurance."
        />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Page header bar */}
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Books" }]} />
            <p className="text-xs text-deepCharcoal/60">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>

          <header className="mb-8">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Books</h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              Works of memoir and conviction. Written to endure.
            </p>
          </header>

          {/* Controls */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search books…"
                className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
              />
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <div className="hidden sm:block" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-deepCharcoal/60">
                Showing {filtered.length} of {books.length}
              </span>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-lightGrey px-3 py-1.5 text-xs font-medium text-deepCharcoal/80 hover:bg-warmWhite"
                  aria-label="Clear filters"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b, i) => (
              <BookCard
                key={b.slug!}
                slug={b.slug!}
                title={b.title ?? "Untitled"}
                author={b.author ?? "Abraham of London"}
                excerpt={b.excerpt ?? ""}
                coverImage={b.coverImage ?? undefined}
                buyLink={b.buyLink ?? undefined}
                genre={b.genre ?? "Uncategorized"}
                downloadPdf={b.downloadPdf ?? undefined}
                downloadEpub={b.downloadEpub ?? undefined}
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

          {filtered.length === 0 && (
            <p className="mt-10 text-center text-sm text-deepCharcoal/70">
              No books match your filters yet.
            </p>
          )}
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

  const safe = books.map((b) => ({
    ...b,
    excerpt: b.excerpt ?? undefined,
    author: b.author ?? undefined,
    coverImage: b.coverImage ?? undefined,
    buyLink: b.buyLink ?? undefined,
    genre: b.genre ?? undefined,
    downloadPdf: b.downloadPdf ?? undefined,
    downloadEpub: b.downloadEpub ?? undefined,
  }));

  return { props: { books: safe }, revalidate: 60 };
}
