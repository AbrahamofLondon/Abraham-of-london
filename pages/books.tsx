// pages/books.tsx (ABSOLUTE FINAL FIX - Focusing ONLY on Data Types in JSX)
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
    // CRITICAL FIX: Ensure all properties used in string functions are coerced to ""
    const safeBook = {
        ...book,
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '',      
        excerpt: book.excerpt ?? '',    
        category: book.category ?? '',  // Guarantees string for 'genre'
        coverImage: book.coverImage ?? null,
    };
    return safeBook;
  });

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
              // CRITICAL FINAL FIX: Explicitly cast to string right before use in JSX
              key={book.slug}
              slug={String(book.slug)}
              title={String(book.title)}
              author={String(book.author)}
              excerpt={String(book.excerpt)}
              coverImage={book.coverImage}
              genre={String(book.category)} // This final cast resolves the crash.
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}