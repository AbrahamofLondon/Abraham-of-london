// pages/index.tsx
import React, { useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';

import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import SocialLinks from '../components/SocialLinks';
import FeaturedBook from '../components/FeaturedBook';
import NewsletterForm from '../components/NewsletterForm';

import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';

// Narrow, required shapes we actually render on the homepage
type Post =
  Required<Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>>;

type Book =
  Required<Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>> & { genre: string };

interface HomeProps {
  posts: Post[];
  books: Book[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // Pull minimal fields needed for the homepage cards
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

  // POSTS — retain image paths if provided, otherwise fall back to your blog default
  const posts: Post[] = postsData.map((p) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  // BOOKS — keep original paths; default to your /assets image if missing
  const books: Book[] = booksData.map((b) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || `/books/${b.slug || ''}`, // free “buy”: route to the book page when missing
    // Normalize string|string[] to a presentable string
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : (b.genre || 'Uncategorized'),
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
  // JSON-LD for Books and Posts to help SEO
  const bookJsonLd = useMemo(() => {
    if (books.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: books.map((book, index) => ({
        '@type': 'Book',
        position: index + 1,
        name: book.title,
        url: `/books/${book.slug}`,
        image: book.coverImage,
        author: { '@type': 'Person', name: book.author },
      })),
    };
  }, [books]);

  const postJsonLd = useMemo(() => {
    if (posts.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'BlogPosting',
        position: index + 1,
        headline: post.title,
        url: `/blog/${post.slug}`,
        image: post.coverImage,
        author: { '@type': 'Person', name: post.author },
      })),
    };
  }, [posts]);

  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta
          property="og:description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/assets/social/twitter-image.webp" />
        {bookJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
        )}
        {postJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        )}
      </Head>

      {/* HERO */}
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
        {/* ABOUT + SOCIAL */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">About Abraham</h2>
            <p className="mb-4 text-deepCharcoal">
              Abraham of London is an author, strategist, and fatherhood advocate passionate about
              family, leadership, and legacy.
            </p>
            <SocialLinks />
          </div>

          <div className="relative w-64 h-64 mx-auto">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Portrait of Abraham of London"
              fill
              className="rounded-full shadow-card object-cover"
              sizes="256px"
              priority={false}
            />
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* FEATURED BOOK (uses the first book if present) */}
        {books.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Featured Book</h2>
            <FeaturedBook
              slug={books[0].slug}
              title={books[0].title}
              author={books[0].author}
              excerpt={books[0].excerpt}
              coverImage={books[0].coverImage}
              ctaHref={`/books/${books[0].slug}`}
            />
          </section>
        )}

        {/* BOOKS */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* POSTS */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* NEWSLETTER (Netlify Forms) */}
        <section className="mb-8">
          <NewsletterForm />
        </section>
      </main>
    </Layout>
  );
}
