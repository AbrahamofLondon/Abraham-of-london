// pages/books.tsx
import Head from 'next/head';
import { GetStaticProps } from 'next'; // <-- ENSURE THIS IS PRESENT
import { getAllBooks, BookMeta } from '../lib/books';
import BookCard from '../components/BookCard';
import Layout from '../components/Layout';

interface BooksProps {
  books: BookMeta[]; // Define the type for the 'books' prop
}

const Books: React.FC<BooksProps> = ({ books }) => {
  return (
    <Layout>
      <Head>
        <title>Our Books - Abraham of London</title>
        <meta name="description" content="Discover books by Abraham of London on fatherhood, faith, and purpose." />
        {/* Add Open Graph and Twitter Meta Tags as needed */}
        <meta property="og:title" content="Our Books - Abraham of London" />
        <meta property="og:description" content="Discover books by Abraham of London on fatherhood, faith, and purpose." />
        <meta property="og:url" content="https://www.abrahamoflondon.com/books" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/og-image.jpg" /> 
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Our Books - Abraham of London" />
        <meta name="twitter:description" content="Discover books by Abraham of London on fatherhood, faith, and purpose." />
        <meta name="twitter:image" content="/assets/images/twitter-image.jpg" />
      </Head>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Our Books</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  // getAllBooks now directly returns an array of BookMeta objects.
  // No need for '.map(({ data, slug }) => ({ ...data, slug }))' anymore.
  const books = getAllBooks([
    'title',
    'date',
    'coverImage',
    'excerpt',
    'slug',
    'author',
    'genre',
    'buyLink',
    'seo',
  ]);

  return {
    props: {
      books,
    },
  };
};

export default Books;