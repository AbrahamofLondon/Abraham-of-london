// pages/books/index.tsx

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllBooks, BookMeta } from '@/lib/books';
import BookCard from '@/components/BookCard';

interface BooksPageProps {
  books: BookMeta[];
}

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  const books = getAllBooks();
  return {
    props: {
      books,
    },
  };
};

export default function BooksPage({ books }: BooksPageProps) {
  return (
    <>
      <Head>
        <title>Books | Abraham of London</title>
        <meta
          name="description"
          content="Explore insightful books by Abraham of London on fatherhood, identity, and legacy."
        />
        <meta property="og:title" content="Books | Abraham of London" />
        <meta
          property="og:description"
          content="Browse Abraham of London's books exploring fatherhood, purpose, and the journey of identity."
        />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta property="og:url" content="https://abraham-of-london.netlify.app/books" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Books by Abraham of London</h1>

        {books.length === 0 ? (
          <p className="text-center text-gray-600">
            No books available at the moment. Please check back soon.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
