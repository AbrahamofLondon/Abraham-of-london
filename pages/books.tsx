// pages/books.tsx
// import Layout from '../components/Layout'; // REMOVE THIS IMPORT unless other local components use it directly

import Head from 'next/head';
import { GetStaticProps } from 'next';
import { getAllBooks, BookMeta } from '../lib/books';
import BookCard from '../components/BookCard';
// import Layout from '../components/Layout'; // Keep this line commented out or remove if not used

interface BooksPageProps {
  books: BookMeta[];
}

const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  return (
    <> {/* Use a React Fragment if you need a single root element */}
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
                <BookCard
                  key={book.slug}
                  slug={book.slug}
                  title={book.title}
                  coverImage={book.coverImage}
                  excerpt={book.excerpt}
                  buyLink={book.buyLink}
                  downloadLink={book.downloadLink}
                  downloadEpubLink={book.downloadEpubLink}
                  author={book.author}
                  genre={book.genre}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No books found yet.</p>
          )}
        </div>
      </section>
    </>
  );
};

// ... getStaticProps remains the same

export default BooksPage;