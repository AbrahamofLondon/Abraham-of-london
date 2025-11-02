// pages/books.tsx (FINAL ROBUST CODE)
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
    // CRITICAL FIX: Explicitly coalesce properties to empty strings where strings are expected
    const safeBook = {
        ...book,
        // Guarantee string values for rendering/comparison in components
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '',      
        excerpt: book.excerpt ?? '',    
        category: book.category ?? '',  // Guarantees string for 'genre'
        
        // Ensure image path is null or a string (as expected by Image component logic)
        coverImage: book.coverImage ?? null,
    };
    return safeBook;
  });

  // Final JSON-safe operation. This ensures full serialization integrity for Next.js.
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
              // CRITICAL FINAL FIX: Using String() cast in JSX is the last line of defense 
              // against minimized JavaScript runtime errors on null/undefined properties.
              key={String(book.slug)}
              slug={String(book.slug)}
              title={String(book.title)}
              author={String(book.author)}
              excerpt={String(book.excerpt)}
              coverImage={book.coverImage}
              genre={String(book.category)} // Final guarantee of string type
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}