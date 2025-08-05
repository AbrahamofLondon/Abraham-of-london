// pages/books.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getAllBooks, BookMeta } from '../lib/books';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';

interface BooksProps {
  books: BookMeta[];
}

export default function Books({ books }: BooksProps) {
  const pageTitle = 'Abraham of London - Books';
  const pageDescription = 'Explore the collection of books by Abraham of London, focusing on leadership, legacy, and purpose.';
  const siteUrl = 'https://abrahamoflondon.org';

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/books`} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/books`} />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-10 text-center">All Books</h1>
        {books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg">Books will be added soon.</p>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'author',
    'description',
    'category',
    'tags',
  ]);

  return {
    props: {
      books,
    },
    revalidate: 86400,
  };
};