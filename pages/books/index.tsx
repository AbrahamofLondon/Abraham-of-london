// pages/books/index.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllBooks, type Book } from "@/lib/books";

type SerializedBook = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  date: string | null;
};

type BooksIndexProps = {
  books: SerializedBook[];
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  const rawBooks = (getAllBooks() ?? []) as Book[];

  const books: SerializedBook[] = rawBooks.map((b: any) => {
    const rawDate = b.date ?? null;
    const date =
      rawDate instanceof Date
        ? rawDate.toISOString()
        : typeof rawDate === "string"
        ? rawDate
        : null;

    return {
      slug: String(b.slug ?? ""),
      title: String(b.title ?? "Untitled Book"),
      excerpt:
        typeof b.excerpt === "string" && b.excerpt.trim().length
          ? b.excerpt
          : null,
      coverImage:
        typeof b.coverImage === "string" && b.coverImage.trim().length
          ? b.coverImage
          : null,
      date,
    };
  });

  return {
    props: {
      books,
    },
    revalidate: 3600,
  };
};

export default function BooksIndexPage({
  books,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = "Books";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        <meta
          name="description"
          content="Books by Abraham of London on fatherhood, legacy, and strategy."
        />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Library
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            Books
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Long-form projects that carry the Fathering Without Fear and
            Kingdom legacy work into pages people can live with.
          </p>
        </header>

        {(!books || books.length === 0) && (
          <p className="text-sm text-gray-600">
            No books are published yet. Please check back soon.
          </p>
        )}

        {books && books.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {books.map((book) => {
              const href = `/books/${book.slug}`;
              return (
                <article
                  key={book.slug}
                  className="overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:border-softGold/40 hover:shadow-cardHover"
                >
                  {book.coverImage && (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <h2 className="font-serif text-xl font-semibold text-deepCharcoal mb-1">
                      <Link
                        href={href}
                        className="hover:text-softGold transition-colors"
                      >
                        {book.title}
                      </Link>
                    </h2>

                    {book.excerpt && (
                      <p className="mb-3 text-sm text-gray-600 line-clamp-3">
                        {book.excerpt}
                      </p>
                    )}

                    <Link
                      href={href}
                      className="inline-flex items-center text-sm font-medium text-forest hover:text-deepCharcoal underline-offset-4 hover:underline"
                    >
                      View book
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </Layout>
  );
}