import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getAllBooks, BookMeta } from '../lib/books';
import BookCard from '../components/BookCard';

interface BooksPageProps {
  books: BookMeta[];
}

export default function BooksPage({ books }: BooksPageProps) {
  return (
    <>
      <Head>
        <title>Abraham of London - Books</title>
        <meta name="description" content="Explore books by Abraham of London on fatherhood, faith, and legacy." />
      </Head>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">My Books</h1>
          {books && books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {books.map((book) => (
                <BookCard key={book.slug} {...book} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No books found yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'author',
    'genre',
    'buyLink',
    'downloadLink',
    'downloadEpubLink',
  ]);
  return {
    props: { books },
  };
};
