// pages/books.tsx (ABSOLUTE FINAL FIX - Focusing ONLY on Data Types)
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
    // CRITICAL FIX: Explicitly ensure ALL properties used in string functions 
    // are coerced to a non-null string ("") or array.
    const safeBook = {
        // Spread the book data first
        ...book,
        
        // --- Guaranteed Non-Null String Coercion ---
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '',      // Ensures safe string for component
        excerpt: book.excerpt ?? '',    // Ensures safe string for component
        category: book.category ?? '',  // Ensures safe string for component (resolves .toLowerCase crash)
        
        // Ensure image path is either string or null
        coverImage: book.coverImage ?? null,

        // All other properties remain handled by the robust lib/mdx.ts null-coalescing
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
      {/* ... (Head section remains the same) */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Books
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.slug}
              // Pass the safely coerced properties—guaranteed non-null strings
              slug={book.slug}
              title={book.title}
              author={book.author}
              excerpt={book.excerpt}
              coverImage={book.coverImage}
              genre={book.category} 
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}