// pages/books.tsx
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { Fragment } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { getAllBooks, BookMeta } from '../lib/books';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Use BookMeta directly for the page props type
type PageProps = {
  books: BookMeta[];
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const books = getAllBooks(['slug', 'title', 'author', 'coverImage']);

  // Filter out any books that might be missing a slug and explicitly cast
  // to BookMeta to satisfy the type-checker.
  const validBooks: BookMeta[] = books.filter(
    (book): book is BookMeta => book.slug !== undefined
  ) as BookMeta[];
  
  return {
    props: { books: validBooks },
    revalidate: 86400, // Regenerate page every 24 hours
  };
};

export default function BooksPage({ books }: InferGetStaticPropsType<typeof getStaticProps>) {
  const meta = {
    title: 'Books',
    description: "Browse the books written by Abraham of London.",
    url: 'https://abrahamoflondon.com/books',
    image: 'https://abrahamoflondon.com/assets/images/social-card.jpg',
  };

  return (
    <Fragment>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </Head>
      <NextSeo
        title={meta.title}
        description={meta.description}
        canonical={meta.url}
        openGraph={{
          url: meta.url,
          title: meta.title,
          description: meta.description,
          images: [{ url: meta.image }],
        }}
      />
      <div className="bg-white text-forest">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6">Books</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div key={book.slug} className="bg-softGold rounded-lg overflow-hidden shadow-md">
                <Link href={`/books/${book.slug}`}>
                  <div className="relative h-64 w-full">
                    <Image
                      src={book.coverImage || '/assets/images/default-book.jpg'}
                      alt={book.title || 'Book cover'}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold">
                    <Link href={`/books/${book.slug}`} className="hover:underline">
                      {book.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </Fragment>
  );
}