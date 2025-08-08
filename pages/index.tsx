import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { getAllPosts } from '../lib/posts';
import { getAllBooks } from '../lib/books';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
}

interface Book {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
}

interface HomeProps {
  posts: Post[];
  books: Book[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const posts = getAllPosts([
    'slug',
    'title',
    'date',
    'excerpt',
    'coverImage',
  ]);
  const books = getAllBooks([
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
  ]);
  return {
    props: {
      posts,
      books,
    },
  };
};

export default function Home({ posts, books }: HomeProps) {
  return (
    <>
      <Head>
        <title>Abraham of London</title>
        <meta name="description" content="Official site of Abraham Adaramola – author, speaker, and fatherhood advocate." />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Official site of Abraham Adaramola – author, speaker, and fatherhood advocate." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/assets/social/twitter-image.webp" />
      </Head>

      <header className="bg-gray-900 text-white">
        <div className="relative w-full h-64 sm:h-96">
          <Image
            src="/assets/images/abraham-of-london-banner.webp"
            alt="Abraham of London Banner"
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-center">Abraham of London</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">About Abraham</h2>
            <p className="mb-4">
              Abraham Adaramola is an author, fatherhood advocate, and speaker passionate about family, leadership, and personal growth.
            </p>
            <div className="flex space-x-4">
              <Link href="mailto:info@abrahamoflondon.org" aria-label="Email">
                <Image src="/assets/logo/email.svg" alt="Email" width={24} height={24} />
              </Link>
              <Link href="tel:+441234567890" aria-label="Phone">
                <Image src="/assets/logo/phone.svg" alt="Phone" width={24} height={24} />
              </Link>
              <Link href="https://www.linkedin.com/in/abrahamadaramola" target="_blank" aria-label="LinkedIn">
                <Image src="/assets/logo/linkedin.svg" alt="LinkedIn" width={24} height={24} />
              </Link>
              <Link href="https://twitter.com/abrahamlondon" target="_blank" aria-label="Twitter">
                <Image src="/assets/logo/twitter.svg" alt="Twitter" width={24} height={24} />
              </Link>
              <Link href="https://facebook.com/abrahamlondon" target="_blank" aria-label="Facebook">
                <Image src="/assets/logo/facebook.svg" alt="Facebook" width={24} height={24} />
              </Link>
              <Link href="https://wa.me/441234567890" target="_blank" aria-label="WhatsApp">
                <Image src="/assets/logo/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
              </Link>
            </div>
          </div>
          <div className="relative w-64 h-64 mx-auto">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham Adaramola"
              layout="fill"
              objectFit="cover"
              className="rounded-full shadow-lg"
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div key={book.slug} className="border rounded-lg overflow-hidden shadow-sm">
                <Image
                  src={book.coverImage || '/assets/images/default-book.jpg'}
                  alt={book.title}
                  width={500}
                  height={700}
                  objectFit="cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="mb-4 text-gray-700">{book.excerpt}</p>
                  <Link href={`/books/${book.slug}`} className="text-blue-600 font-semibold">
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.slug} className="border rounded-lg overflow-hidden shadow-sm">
                <Image
                  src={post.coverImage || '/assets/images/og-image.jpg'}
                  alt={post.title}
                  width={500}
                  height={300}
                  objectFit="cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="mb-4 text-gray-700">{post.excerpt}</p>
                  <Link href={`/posts/${post.slug}`} className="text-blue-600 font-semibold">
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-6 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
      </footer>
    </>
  );
}
