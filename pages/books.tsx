// pages/books.tsx
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { getAllBooks, BookItem } from '../lib/books'; // <--- CHANGED BookMeta to BookItem
import BookCard from '../components/BookCard';
import Layout from '../components/Layout';

interface BooksProps {
  books: BookItem[]; // <--- CHANGED BookMeta[] to BookItem[]
}

const Books: React.FC<BooksProps> = ({ books }) => {
  return (
    <Layout>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Explore books by Abraham of London, covering theology, personal growth, and more." />
      </Head>

      <section className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-12">Our Books</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {books.map((book) => (
            <BookCard
              key={book.slug}
              slug={book.slug}
              title={book.title}
              coverImage={book.coverImage}
              excerpt={book.excerpt}
              // Pass other book properties to BookCard if it expects them
              // e.g., author={book.author}, genre={book.genre}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    // Add any other fields your BookCard needs here
    // e.g., 'author', 'genre'
  ]);

  return {
    props: {
      books,
    },
    revalidate: 1, // Optional: re-generate page every 1 second
  };
};

export default Books;