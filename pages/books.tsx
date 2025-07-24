// pages/books.tsx
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { getAllBooks, BookMeta } from '../lib/books'; // Adjust path if necessary
import BookCard from '../components/BookCard'; // Assuming BookCard exists
import Layout from '../components/Layout'; // Make sure Layout is imported

interface BooksProps {
  books: BookMeta[];
}

const Books: React.FC<BooksProps> = ({ books }) => {
  return (
    <Layout> {/* Wrap with Layout */}
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Discover books and publications by Abraham of London." />
      </Head>
      <section className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-display font-bold text-primary mb-8 text-center">Our Books</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <BookCard key={book.slug} {...book} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const books = getAllBooks().map(({ data, slug }) => ({ ...data, slug }));

  return {
    props: {
      books,
    },
  };
};

export default Books;