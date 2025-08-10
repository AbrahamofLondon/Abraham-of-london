import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';

type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
};

type Book = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
};

type HomeProps = { posts: Post[]; books: Book[] };

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsData = getAllPosts([
    'slug',
    'title',
    'date',
    'publishedAt',
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

  const posts: Post[] = postsData.map((p: Partial<PostMeta>) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    // Blog covers live in /public/images/blog
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  const books: Book[] = booksData.map((b: Partial<BookMeta>) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    // Book covers live in /public/images/books (fallback to asset default)
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || '#',
    // Normalize string|string[] → comma-separated string
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Uncategorized',
  }));

  return {
    props: {
      posts: posts.slice(0, 3),
      books: books.slice(0, 3),
    },
    revalidate: 60,
  };
};

export default function Home({ posts, books }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Official site of Abraham of London – author, strategist, and fatherhood advocate." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/assets/social/twitter-image.webp" />
      </Head>

      {/* Hero */}
      <header className="bg-forest text-cream">
        <div className="relative w-full h-64 sm:h-96">
          <Image
            src="/assets/images/abraham-of-london-banner.webp"
            alt="Abraham of London — strategic leadership and fatherhood advocacy"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="font-serif tracking-brand text-3xl sm:text-5xl font-bold text-center">
              Abraham of London
            </h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12">
        {/* About */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">About Abraham</h2>
            <p className="mb-4 text-deepCharcoal">
              Abraham of London is an author, strategist, and fatherhood advocate passionate about
              family, leadership, and legacy.
            </p>
            <div className="flex gap-4">
              <Link href="mailto:info@abrahamoflondon.org" aria-label="Email">
                <Image src="/assets/social/email.svg" alt="Email" width={24} height={24} loading="lazy" />
              </Link>
              <Link href="tel:+442086225909" aria-label="Phone">
                <Image src="/assets/social/phone.svg" alt="Phone" width={24} height={24} loading="lazy" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Image src="/assets/social/linkedin.svg" alt="LinkedIn" width={24} height={24} loading="lazy" />
              </Link>
              <Link
                href="https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
              >
                <Image src="/assets/social/twitter.svg" alt="X (Twitter)" width={24} height={24} loading="lazy" />
              </Link>
              <Link
                href="https://www.facebook.com/share/1MRrKpUzMG/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Image src="/assets/social/facebook.svg" alt="Facebook" width={24} height={24} loading="lazy" />
              </Link>
              <Link
                href="https://wa.me/+447496334022"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <Image src="/assets/social/whatsapp.svg" alt="WhatsApp" width={24} height={24} loading="lazy" />
              </Link>
            </div>
          </div>

          <div className="relative w-64 h-64 mx-auto">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Portrait of Abraham of London"
              fill
              className="rounded-full shadow-card object-cover"
              sizes="256px"
            />
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Books */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Posts */}
        <section>
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
      </footer>
    </Layout>
  );
}
