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
    props: {
      books,
    },
  };
};

export default function BookPage({ books }: BookPageProps) {
  return (
    <>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Explore published works by Abraham Adaramola on fatherhood, leadership, and social justice." />
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8">Books by Abraham</h1>
        {books.length === 0 ? (
          <p>No books available at this time.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        )}
        <div className="mt-10">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
