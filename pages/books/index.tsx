// pages/books/index.tsx
import * as React from "react";
import type {
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Layout from "@/components/Layout";

import {
  allBooks,
  getPublishedDocuments,
  type BookDocument as Book,
} from "@/lib/contentlayer-helper";

// Card system
import { BookCard } from "@/components/Cards";

type Props = {
  books: Book[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const books = getPublishedDocuments(allBooks as Book[]);

  return {
    props: {
      books,
    },
    revalidate: 3600, // 1 hour
  };
};

const BooksIndexPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ books }) => {
  return (
    <Layout title="Books">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon · Volumes & Works
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Books & Canon Volumes
          </h1>
          <p className="text-sm text-gray-300">
            Memoir, theology and strategy for builders who want to carry weight
            in history, not just comment on it.
          </p>
        </header>

        {(!books || books.length === 0) && (
          <p className="text-sm text-gray-400">
            No books are published yet. The shelves are being stocked.
          </p>
        )}

        {books && books.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book._id}
                // Again, cast to any at the boundary – your internal Card
                // component can expect its own shape.
                book={book as any}
              />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default BooksIndexPage;