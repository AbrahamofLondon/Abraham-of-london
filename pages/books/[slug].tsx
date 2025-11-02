// pages/books.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { getAllContent } from "@/lib/mdx"; // Import unified fetcher
import type { PostMeta } from "@/types/post";

type BooksProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allBooks = getAllContent('books');
  // Use a map to ensure all critical string/link fields are guaranteed strings/nulls
  const books = allBooks.map(book => {
    // Explicitly check and convert data to be JSON-safe and prevent toLowerCase() crash
    const safeBook = {
        ...book,
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? 'Abraham of London',
        excerpt: book.excerpt ?? '',
        category: book.category ?? 'General',
        summary: book.summary ?? null, // Ensure summary is null if missing (Serialization fix)
    };
    return safeBook;
  });

  // Final JSON-safe stringify/parse to catch lingering issues
  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 3600,
  };
};

export default function Books({ books }: BooksProps) {
  return (
    <Layout pageTitle="Books">
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Books, memoirs, and field guides by Abraham of London." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Books
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.slug}
              slug={book.slug}
              title={book.title}
              author={book.author}
              excerpt={book.excerpt}
              coverImage={book.coverImage}
              genre={book.category} // category is guaranteed a string by getStaticProps
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}