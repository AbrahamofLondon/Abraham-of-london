// pages/index.tsx
import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import BookCard from '@/components/BookCard';
import { getAllBooks } from '@/lib/books';

export default function Home({ books }: { books: Book[] }) {
  return (
    <>
      <Head>
        <title>Abraham of London</title>
        <meta name="description" content="Author, Fatherhood Advocate, and Mentor. Discover books, thoughts, and resources by Abraham Adaramola." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="max-w-5xl mx-auto px-4">
        {/* Hero Banner */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] mb-8">
          <Image
            src="/assets/images/abraham-of-London-banner.webp"
            alt="Abraham of London Hero Banner"
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>

        {/* Profile Section */}
        <section className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <Image
            src="/assets/images/profile-portrait.webp"
            alt="Abraham Adaramola portrait"
            width={200}
            height={200}
            className="rounded-full shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">Abraham Adaramola</h1>
            <p className="text-lg">
              Author, fatherhood mentor, and social entrepreneur. Sharing stories, building legacies, and reclaiming the narrative.
            </p>
          </div>
        </section>

        {/* Books */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.slug} {...book} />
          ))}
        </section>
      </main>
    </>
  );
}

import { GetStaticProps } from 'next';
import { Book } from '@/types/book';

export const getStaticProps: GetStaticProps = async () => {
  const books = getAllBooks();
  return {
    props: {
      books,
    },
  };
};
