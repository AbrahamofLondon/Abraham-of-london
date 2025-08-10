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
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';

type Post = Required<
  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
>;
type Book = Required<
  Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>
> & { genre: string };

interface HomeProps {
  posts: Post[];
  books: Book[];
}

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

  const posts: Post[] = postsData.map((p) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    // Your blog images live in /public/images/blog
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  const books: Book[] = booksData.map((b) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    // Your book art can be in /images/books or use explicit paths from MDX
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    // If empty, we’ll link to the book page (free “buy”)
    buyLink: b.buyLink || `/books/${b.slug || ''}`,
    // Normalize string|string[] to a readable string
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
  const siteUrl = 'https://abraham-of-london.netlify.app'; // change to your custom domain when ready

  // JSON-LD for Books
  const bookJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: books.map((book, index) => ({
        '@type': 'Book',
        position: index + 1,
        name: book.title,
        url: `${siteUrl}/books/${book.slug}`,
        image: `${siteUrl}${book.coverImage.startsWith('/') ? '' : '/'}${book.coverImage}`,
        author: { '@type': 'Person', name: book.author },
      })),
    }),
    [books, siteUrl]
  );

  // JSON-LD for Posts
  const postJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'BlogPosting',
        position: index + 1,
        headline: post.title,
        url: `${siteUrl}/blog/${post.slug}`,
        image: `${siteUrl}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`,
        author: { '@type': 'Person', name: post.author },
      })),
    }),
    [posts, siteUrl]
  );

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
        {books.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
        )}
        {posts.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        )}
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
            <SocialLinks />
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl tracking-brand text-forest">Latest Books</h2>
            <Link href="/books" className="text-forest hover:text-softGold underline underline-offset-4">
              Browse all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl tracking-brand text-forest">Latest Posts</h2>
            <Link href="/blog" className="text-forest hover:text-softGold underline underline-offset-4">
              Read all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
