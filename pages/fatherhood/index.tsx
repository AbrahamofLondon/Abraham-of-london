// pages/fatherhood/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { BlogPostCard, BookCard } from "@/components/Cards";
import {
  getPublishedPosts,
  getAllBooks,
  getAllCanons,
} from "@/lib/contentlayer-helper";
import type { Post, Book, Canon } from "contentlayer/generated";

type FatherhoodPageProps = {
  posts: Post[];
  books: Book[];
  canons: Canon[];
};

function hasTagLike(doc: { tags?: string[] }, needles: string[]): boolean {
  const tags = (doc.tags || []).map((t) => t.toLowerCase());
  return needles.some((needle) =>
    tags.some((t) => t.includes(needle.toLowerCase())),
  );
}

export const getStaticProps: GetStaticProps<FatherhoodPageProps> = async () => {
  const posts = getPublishedPosts().filter((p) =>
    hasTagLike(p, ["father", "fatherhood", "family"]),
  );
  const books = getAllBooks().filter((b) =>
    hasTagLike(b, ["father", "fatherhood"]),
  );
  const canons = getAllCanons().filter((c) =>
    hasTagLike(c, ["father", "fatherhood"]),
  );

  return {
    props: { posts, books, canons },
    revalidate: 3600,
  };
};

const FatherhoodPage: NextPage<FatherhoodPageProps> = ({
  posts,
  books,
  canons,
}) => {
  return (
    <Layout
      title="Fatherhood Frameworks"
      description="Faith-rooted frameworks and tools for men carrying the weight of fatherhood."
    >
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Fatherhood · Frameworks
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Fatherhood without disappearing
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            A focused stream of essays, canon entries, and long-form projects
            for men who want to carry fatherhood with courage, clarity, and
            conviction — not sentimentality.
          </p>
        </header>

        {/* Canon section */}
        <section className="mb-12 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Canon &amp; structural pieces
            </h2>
            <Link
              href="/canon"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              Enter the Canon ↠
            </Link>
          </div>
          {canons.length === 0 ? (
            <p className="text-sm text-gray-400">
              Canon entries touching fatherhood will surface here as they go
              live.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {canons.map((canon) => (
                <article
                  key={canon._id}
                  className="rounded-xl border border-gold/20 bg-night/60 p-4 shadow-sm"
                >
                  <h3 className="font-serif text-lg text-cream">
                    <Link href={`/canon/${canon.slug}`}>{canon.title}</Link>
                  </h3>
                  {canon.excerpt && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                      {canon.excerpt}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Books */}
        <section className="mb-12 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Books in development
            </h2>
            <Link
              href="/books"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              View all books ↠
            </Link>
          </div>
          {books.length === 0 ? (
            <p className="text-sm text-gray-400">
              Fatherhood-focused book projects will surface here as they’re
              registered in the Canon.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* Essays */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Essays &amp; field notes
            </h2>
            <Link
              href="/blog"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              All essays ↠
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-400">
              Fatherhood essays will appear here as they are published. For now,
              explore the wider{" "}
              <Link
                href="/content"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                content library
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default FatherhoodPage;