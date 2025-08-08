import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import { getAllPosts } from '../lib/posts';
import { getAllBooks } from '../lib/books';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
}

interface Book {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
}

interface HomeProps {
  posts: Post[];
  books: Book[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsData = getAllPosts([
    'slug',
    'title',
    'date',
    'excerpt',
    'coverImage',
    'author',
    'readTime',
    'category',
  ]);

  const booksData = getAllBooks([
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
    'buyLink',
    'genre',
  ]);

  const processedPosts: Post[] = postsData.map(post => ({
    ...post,
    coverImage: post.coverImage || '/assets/images/default-blog-cover.jpg',
    excerpt: post.excerpt || 'Read more for full details.',
    author: post.author || 'Abraham of London',
    readTime: post.readTime || '5 min read',
    category: post.category || 'General',
  }));

  const processedBooks: Book[] = booksData.map(book => ({
    ...book,
    buyLink: book.buyLink || '#',
    genre: book.genre || 'Uncategorized',
    coverImage: book.coverImage || '/assets/images/default-book-cover.jpg',
    excerpt: book.excerpt || 'Read more for full details.',
    author: book.author || 'Abraham of London',
  }));

  return {
    props: {
      posts: processedPosts.slice(0, 3),
      books: processedBooks.slice(0, 3),
    },
    revalidate: 60,
  };
};

export default function Home({ posts, books }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta name="description" content="Official site of Abraham Adaramola – author, speaker, and fatherhood advocate." />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Official site of AbrahamofLondon – author, speaker, and fatherhood advocate." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/assets/social/twitter-image.webp" />
      </Head>

      <header className="bg-gray-900 text-white">
        <div className="relative w-full h-64 sm:h-96">
          <Image
            src="/assets/images/abraham-of-london-banner.webp"
            alt="Abraham of London Banner"
            fill
            className="object-cover"
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
                <Image src="/assets/images/logo/email.svg" alt="Email" width={24} height={24} />
              </Link>
              <Link href="tel:+442086225909" aria-label="Phone">
                <Image src="/assets/images/logo/phone.svg" alt="Phone" width={24} height={24} />
              </Link>
              <Link href="https://www.linkedin.com/in/abraham-adaramola-06630321/" target="_blank" aria-label="LinkedIn">
                <Image src="/assets/images/logo/linkedin.svg" alt="LinkedIn" width={24} height={24} />
              </Link>
              <Link href="https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09" target="_blank" aria-label="Twitter">
                <Image src="/assets/images/logo/twitter.svg" alt="Twitter" width={24} height={24} />
              </Link>
              <Link href="https://www.facebook.com/share/1MRrKpUzMG/" target="_blank" aria-label="Facebook">
                <Image src="/assets/images/logo/facebook.svg" alt="Facebook" width={24} height={24} />
              </Link>
              <Link href="https://wa.me/+447496334022" target="_blank" aria-label="WhatsApp">
                <Image src="/assets/images/logo/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
              </Link>
            </div>
          </div>
          <div className="relative w-64 h-64 mx-auto">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="AbrahamofLondon"
              fill
              className="rounded-full shadow-lg"
            />
          </div>
        </section>
        <hr className="my-12 border-gray-200" />
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>
        <hr className="my-12 border-gray-200" />
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>
      </main>
      <footer className="bg-gray-100 py-6 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
      </footer>
    </Layout>
  );
}