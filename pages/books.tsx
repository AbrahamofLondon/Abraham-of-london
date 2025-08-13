// pages/books.tsx
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { Fragment } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { getAllBooks, BookMeta } from '@/lib/books';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Create a new type that only includes the properties you are fetching.
// This prevents serialization errors if other fields in BookMeta are undefined.
type BookCardMeta = Pick<BookMeta, 'slug' | 'title' | 'author' | 'coverImage'>;

type PageProps = {
  books: BookCardMeta[];
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  // Fetch only the necessary fields
  const books = getAllBooks(['slug', 'title', 'author', 'coverImage']);

  const validBooks: BookCardMeta[] = books.filter(
    (book): book is BookCardMeta => typeof book.slug === 'string' && book.slug.trim() !== ''
  );

  return {
    props: { books: validBooks },
    revalidate: 86400,
  };
};

export default function BooksPage({
  books,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const meta = {
    title: 'Books',
    description: 'Browse the books written by Abraham of London.',
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
          {books.length === 0 ? (
            <p>No books found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {books.map((book) => (
                <div
                  key={book.slug}
                  className="bg-softGold rounded-lg overflow-hidden shadow-md"
                >
                  <Link href={`/books/${book.slug}`}>
                    <div className="relative h-64 w-full">
                      <Image
                        src={
                          book.coverImage?.trim()
                            ? book.coverImage
                            : '/assets/images/default-book.jpg'
                        }
                        alt={book.title || 'Book cover'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold">
                      <Link
                        href={`/books/${book.slug}`}
                        className="hover:underline"
                      >
                        {book.title}
                      </Link>
                    </h2>
                    {book.author && (
                      <p className="mt-2 text-sm text-gray-700">{book.author}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </Fragment>
  );
}