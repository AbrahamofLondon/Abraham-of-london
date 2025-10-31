// pages/books.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { getAllContent } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type BooksProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allBooks = getAllContent('books');

  // Sanitize data for serialization
  const books = allBooks.map(book => JSON.parse(JSON.stringify(book)));

  return {
    props: { books },
    revalidate: 3600, // Rebuild every hour
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
          {/* ✅ FIX: This now maps over your books and renders the full card */}
          {books.map((book) => (
            <BookCard
              key={book.slug}
              slug={book.slug}
              title={book.title}
              author={book.author}
              excerpt={book.excerpt}
              coverImage={book.coverImage}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}