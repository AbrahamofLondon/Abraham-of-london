// pages/book/index.tsx

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllBooks, BookMeta } from '../../lib/books';
import BookCard from '../../components/BookCard';

interface BookPageProps {
  books: BookMeta[];
}

export const getStaticProps: GetStaticProps<BookPageProps> = async () => {
  const books = getAllBooks();
  return {
    props: { books },
  };
};

export default function BookPage({ books }: BookPageProps) {
  return (
    <>
      <Head>
        <title>Books | Abraham of London</title>
        <meta
          name="description"
          content="Explore published works by Abraham Adaramola on fatherhood, leadership, and social justice."
        />
        <meta property="og:title" content="Books | Abraham of London" />
        <meta
          property="og:description"
          content="Browse Abraham of London's transformative books on identity, leadership, and family legacy."
        />
        <meta property="og:image" content="/assets/social/books-og-image.jpg" />
        <meta property="og:url" content="https://abraham-of-london.netlify.app/book" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Books by Abraham</h1>

        {books.length === 0 ? (
          <p className="text-center text-gray-600">No books available at this time.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
