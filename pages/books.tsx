import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import type { ReactElement } from "react";

// Example: you can later fetch these dynamically
const BOOKS = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    author: "Abraham of London",
    excerpt:
      "A bold memoir reclaiming fatherhood—clarity, discipline, and standards that endure.",
    genre: "Memoir",
    coverImage: "/assets/images/books/fathering-without-fear.jpg",
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    author: "Abraham of London",
    excerpt:
      "A dramatized reimagining of lived conviction—raw, luminous, and cinematic.",
    genre: "Drama",
    coverImage: "/assets/images/books/fiction-adaptation.jpg",
  },
];

export default function BooksPage(): ReactElement {
  return (
    <Layout pageTitle="Books">
      <Head>
        <meta
          name="description"
          content="Books by Abraham of London — memoir and fiction that embody clarity, conviction, and endurance."
        />
      </Head>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-bold text-deepCharcoal sm:text-5xl">
              Books
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-deepCharcoal/70">
              Conviction rendered in print — stories and strategies that endure
              beyond trends.
            </p>
            <div className="mx-auto mt-5 h-0.5 w-20 bg-softGold/60" />
          </header>

          {/* Filter bar (non-functional placeholder) */}
          <div className="mb-12 flex justify-center gap-4 text-sm">
            {["All", "Memoir", "Drama"].map((cat) => (
              <button
                key={cat}
                className="rounded-full border border-lightGrey px-4 py-2 text-deepCharcoal transition hover:bg-warmWhite"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of books */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BOOKS.map((b) => (
              <BookCard key={b.slug} {...b} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
