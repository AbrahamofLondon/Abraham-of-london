// pages/books.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
// Imports the unified data fetcher
import { getAllContent } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

// We use PostMeta as a base, ensuring required fields are non-null later
type BookData = PostMeta; 
type BooksProps = InferGetStaticPropsType<typeof getStaticProps>;

// ------------------------------------------------------------------
// ✅ CRITICAL FIX: getStaticProps (Ensures data integrity and crash prevention)
// ------------------------------------------------------------------
export const getStaticProps: GetStaticProps = async () => {
  const allBooks = getAllContent('books');

  const books = allBooks.map((book) => {
    // CRITICAL FIX: Coalesce all properties used in string methods or JSX attributes 
    // to an empty string ("") if they are null or undefined.
    const safeBook = {
        ...book,
        // Properties MUST be guaranteed strings to prevent .toLowerCase() crash
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '', // FIX: Coalesce to ""
        excerpt: book.excerpt ?? '', // FIX: Coalesce to ""
        category: book.category ?? '', // FIX: Coalesce to "" (Used as 'genre' in BookCard)
        
        // Optional fields that are safe as null for serialization:
        date: book.date ?? null,
        summary: (book as any).summary ?? null, 
        tags: book.tags ?? null,
    };
    return safeBook;
  });

  // Final JSON-safe operation. This ensures full data integrity for SSG.
  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 3600,
  };
};

// ------------------------------------------------------------------
// Component uses the safely coerced data
// ------------------------------------------------------------------
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
              // Pass the safely coerced properties
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