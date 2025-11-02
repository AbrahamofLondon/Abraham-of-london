// pages/books.tsx (FULLY ROBUST FINAL VERSION)
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { getAllContent } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

type BooksProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allBooks = getAllContent('books');
  
  const books = allBooks.map((book) => {
    // CRITICAL FIX: Coalesce all properties used in string methods or JSX attributes 
    // to an empty string ("") to prevent the toLowerCase crash.
    const safeBook = {
        ...book,
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '',      // Guaranteed string
        excerpt: book.excerpt ?? '',    // Guaranteed string
        category: book.category ?? '',  // Guaranteed string (used as 'genre')
        
        // Other optional fields are safe as null for JSON serialization:
        date: book.date ?? null,
        summary: (book as any).summary ?? null, 
        tags: book.tags ?? null,
    };
    return safeBook;
  });

  // Final JSON-safe operation.
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
              genre={book.category} // Now guaranteed to be a string
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}