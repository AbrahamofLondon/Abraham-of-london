// pages/books/index.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout'; // Path adjusted for nested folder
import BookCard from '../../components/BookCard'; // Path adjusted for nested folder

interface Book {
  slug: string;
  title: string;
  coverImage: string;
  author: string;
  excerpt: string;
}

interface BooksPageProps {
  books: Book[];
}

export const getStaticProps = async () => {
  // Replace this with your actual data fetching logic (e.g., reading from content/books)
  const books: Book[] = [
    {
      slug: 'fathering-without-fear',
      title: 'Fathering Without Fear',
      coverImage: '/assets/images/fathering-without-fear.webp',
      author: 'Abraham of London',
      excerpt: 'An impactful memoir and guide on navigating modern fatherhood with courage and intention.'
    },
    // Add more books as needed
  ];

  return {
    props: {
      books,
    },
  };
};

export default function Books({ books }: BooksPageProps) {
  return (
    <Layout>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Explore the published works of Abraham of London, including Fathering Without Fear." />
      </Head>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">My Books</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Dive into profound insights and compelling narratives.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <BookCard key={book.slug} {...book} />
          ))}
        </div>
      </div>
    </Layout>
  );
}