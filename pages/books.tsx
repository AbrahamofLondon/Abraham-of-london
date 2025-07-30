// pages/books.tsx
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { getAllBooks, BookMeta } from '../lib/books'; // Make sure BookMeta is imported here!
import BookCard from '../components/BookCard';
import Layout from '../components/Layout';

interface BooksPageProps {
  books: BookMeta[]; // Use BookMeta here
}

const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  return (
    <Layout>
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
                  downloadLink={book.downloadLink} // CORRECTED: Pass the prop correctly
                  author={book.author} // Pass author prop
                  genre={book.genre}   // Pass genre prop
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No books found yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'buyLink',
    'downloadLink', // Make sure this is fetched from MDX
    'author',
    'genre',
    // Include any other fields you need for the BookCard or the page
  ]);

  return {
    props: {
      books,
    },
    revalidate: 1, // Revalidate every 1 second (ISR)
  };
};

export default BooksPage;