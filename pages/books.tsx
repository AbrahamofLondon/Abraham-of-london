// pages/books.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/books";
import { absUrl, siteConfig } from "@/lib/siteConfig";
import type { ReactElement } from "react";
import { useRouter } from "next/router";
import { useMemo } from "react";

type Book = {
  slug: string;
  title: string;
  author: string;              // required by BookCard
  excerpt?: string | null;
  genre?: string | null;
  coverImage?: string | null;
};

type BooksProps = { books: Book[] };

const FALLBACK: Book[] = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    author: siteConfig.author,
    excerpt:
      "A bold memoir reclaiming fatherhood—clarity, discipline, and standards that endure.",
    genre: "Memoir",
    coverImage: "/assets/images/books/fathering-without-fear.jpg",
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    author: siteConfig.author,
    excerpt:
      "A dramatized reimagining of lived conviction—raw, luminous, and cinematic.",
    genre: "Drama",
    coverImage: "/assets/images/books/fiction-adaptation.jpg",
  },
];

const norm = (v?: string | null) => (v ?? "").toLowerCase();
const toStr = (v?: string | null) => (typeof v === "string" ? v : "");

export default function BooksPage({ books }: BooksProps): ReactElement {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q.trim() : "";
  const genre = typeof router.query.genre === "string" ? router.query.genre.trim() : "All";
  const sort = typeof router.query.sort === "string" ? router.query.sort.trim() : "title";

  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genre && set.add(b.genre));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [books]);

  const filtered = useMemo(() => {
    let out = books.filter((b) => {
      const passQ =
        !q ||
        norm(b.title).includes(q.toLowerCase()) ||
        norm(b.excerpt).includes(q.toLowerCase()) ||
        norm(b.author).includes(q.toLowerCase());
      const passGenre = genre === "All" || norm(b.genre) === genre.toLowerCase();
      return passQ && passGenre;
    });

    if (sort === "newest" || sort === "oldest") {
      out = out.sort((a, b) => a.title.localeCompare(b.title));
      if (sort === "oldest") out.reverse();
    } else {
      out = out.sort((a, b) => a.title.localeCompare(b.title));
    }
    return out;
  }, [books, q, genre, sort]);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre && genre !== "All") params.set("genre", genre);
    if (sort && sort !== "title") params.set("sort", sort);
    if (overrides.q !== undefined) overrides.q ? params.set("q", overrides.q) : params.delete("q");
    if (overrides.genre !== undefined) {
      overrides.genre && overrides.genre !== "All"
        ? params.set("genre", overrides.genre)
        : params.delete("genre");
    }
    if (overrides.sort !== undefined) {
      overrides.sort && overrides.sort !== "title"
        ? params.set("sort", overrides.sort)
        : params.delete("sort");
    }
    const qs = params.toString();
    return qs ? `/books?${qs}` : `/books`;
  };

  const CANONICAL = absUrl("/books");
  const pageTitle = `Books | ${siteConfig.author}`;
  const pageDesc =
    "Books by Abraham of London — memoir and fiction that embody clarity, conviction, and endurance.";
  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;
  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Books", item: CANONICAL },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filtered.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Book",
        name: b.title,
        author: b.author ? { "@type": "Person", name: b.author } : undefined,
        image: b.coverImage
          ? b.coverImage.startsWith("/")
            ? absUrl(b.coverImage)
            : b.coverImage
          : undefined,
        url: absUrl(`/books/${b.slug}`),
        description: b.excerpt || undefined,
      },
    })),
  };

  return (
    <Layout pageTitle="Books">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London — books" />
          </>
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      </Head>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-bold text-deepCharcoal sm:text-5xl">Books</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-deepCharcoal/70">
              Conviction rendered in print — stories and strategies that endure beyond trends.
            </p>
            <div className="mx-auto mt-5 h-0.5 w-20 bg-softGold/60" />
          </header>

          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <form action="/books" method="get" className="flex w-full max-w-md items-center gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search books…"
                className="w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm"
                aria-label="Search books"
              />
              {genre && genre !== "All" ? <input type="hidden" name="genre" value={genre} /> : null}
              {sort && sort !== "title" ? <input type="hidden" name="sort" value={sort} /> : null}
              <button className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream">Search</button>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-deepCharcoal/70">Genre:</span>
              {genres.map((g) => (
                <Link
                  key={g}
                  href={buildHref({ genre: g })}
                  prefetch={false}
                  className={`rounded-full border px-3 py-1 ${
                    genre === g ? "border-forest bg-forest text-cream" : "border-lightGrey bg-white text-deepCharcoal"
                  }`}
                  aria-current={genre === g ? "page" : undefined}
                >
                  {g}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-deepCharcoal/70">Sort:</span>
              {[
                { key: "title", label: "Title" },
                { key: "newest", label: "Newest" },
                { key: "oldest", label: "Oldest" },
              ].map((opt) => (
                <Link
                  key={opt.key}
                  href={buildHref({ sort: opt.key })}
                  prefetch={false}
                  className={`rounded-full border px-3 py-1 ${
                    sort === opt.key ? "border-forest bg-forest text-cream" : "border-lightGrey bg-white text-deepCharcoal"
                  }`}
                  aria-current={sort === opt.key ? "page" : undefined}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <BookCard
                key={b.slug}
                slug={b.slug}
                title={b.title}
                author={b.author}
                excerpt={toStr(b.excerpt)}
                genre={toStr(b.genre)}
                coverImage={toStr(b.coverImage)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-deepCharcoal/70">
                No books match your criteria.
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

// SSG + ISR with safe fallback
export async function getStaticProps() {
  let books: Book[] = FALLBACK;
  try {
    const all = getAllBooks(["slug", "title", "author", "excerpt", "genre", "coverImage"]);
    books = all.map((b: any) => ({
      slug: String(b.slug),
      title: String(b.title),
      author: String(b.author ?? siteConfig.author),
      excerpt: b.excerpt ? String(b.excerpt) : "",
      genre: b.genre ? String(b.genre) : "",
      coverImage: b.coverImage ? String(b.coverImage) : "",
    }));
  } catch {
    // silent fallback
  }

  return {
    props: { books },
    revalidate: 3600,
  };
}
