// pages/books.tsx (HYPER-ROBUST FINAL CODE)
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
    // CRITICAL FIX: Ensure ALL properties used are coerced to safe values
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

  // Final JSON-safe operation.
  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 3600,
  };
};

export default function Books({ books }: BooksProps) {
  return (
    <Layout pageTitle="Books">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Books
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={String(book.slug)} // Use String() on key for max safety
              slug={String(book.slug)}
              title={String(book.title)}
              author={String(book.author)}
              excerpt={String(book.excerpt)}
              coverImage={book.coverImage}
              genre={String(book.category)} // Final target of the crash
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}