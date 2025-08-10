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
  Pick<
    PostMeta,
    'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'
  >
>;

type Book = Required<
  Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>
> & {
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

interface HomeProps {
  posts: Post[];
  books: Book[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // POSTS
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

  const posts: Post[] = postsData.map((p) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    // Your default blog cover lives here based on your screenshots
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  // BOOKS
  const booksData = getAllBooks([
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
    'buyLink',
    'genre',
    'downloadPdf',
    'downloadEpub',
  ]);

  const books: Book[] = booksData.map((b) => {
    // Keep your existing covers. If missing, prefer your real asset names first, else fallback.
    const cover =
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : // If you add more books later, you can add slug-specific fallbacks here:
          b.slug === 'fathering-without-fear'
          ? '/assets/images/fathering-without-fear.jpg'
          : '/assets/images/default-book.jpg';

    return {
      slug: b.slug || '',
      title: b.title || 'Untitled Book',
      author: b.author || 'Abraham of London',
      excerpt: b.excerpt || 'Read more for full details.',
      coverImage: cover,
      // “Buy” goes to the book’s page so users can read/download (free)
      buyLink: b.buyLink || `/books/${b.slug || ''}`,
      genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : (b.genre || 'Uncategorized'),
      downloadPdf: b.downloadPdf ?? null,   // e.g. /downloads/fathering-without-fear.pdf
      downloadEpub: b.downloadEpub ?? null, // e.g. /downloads/fathering-without-fear.epub
    };
  });

  return {
    props: { posts: posts.slice(0, 3), books: books.slice(0, 3) },
    revalidate: 60,
  };
};

export default function Home({ posts, books }: HomeProps) {
  // JSON-LD
  const bookJsonLd = useMemo(
    () => ({
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
    }),
    [books]
  );

  const postJsonLd = useMemo(
    () => ({
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
    }),
    [posts]
  );

  const featured = books[0];

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
        {/* This file exists per your folder: public/assets/images/social/og-image.jpg */}
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Keep this too */}
        <meta name="twitter:image" content="/assets/images/social/twitter-image.webp" />
        {books.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
        )}
        {posts.length > 0 && (
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
            />
          </div>
        </section>

        {/* FEATURED BOOK */}
        {featured && (
          <>
            <hr className="my-12 border-lightGrey" />
            <section className="mb-16">
              <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Featured Book</h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <Link href={`/books/${featured.slug}`} className="block relative w-full h-80 rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(max-width:768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </Link>

                <div>
                  <h3 className="text-3xl font-serif text-forest mb-2">{featured.title}</h3>
                  <p className="text-deepCharcoal mb-4">By {featured.author}</p>
                  <p className="text-deepCharcoal/90 mb-6">{featured.excerpt}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/books/${featured.slug}`}
                      className="bg-forest text-cream px-5 py-2 rounded-[6px] tracking-brand hover:bg-softGold hover:text-forest transition"
                    >
                      Read / Buy (free)
                    </Link>
                    {featured.downloadPdf && (
                      <a
                        href={featured.downloadPdf}
                        className="border-2 border-forest text-forest px-5 py-2 rounded-[6px] tracking-brand hover:bg-forest hover:text-cream transition"
                        download
                      >
                        Download PDF
                      </a>
                    )}
                    {featured.downloadEpub && (
                      <a
                        href={featured.downloadEpub}
                        className="border-2 border-forest text-forest px-5 py-2 rounded-[6px] tracking-brand hover:bg-forest hover:text-cream transition"
                        download
                      >
                        Download EPUB
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <hr className="my-12 border-lightGrey" />

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

        {/* NEWSLETTER (Netlify Forms) */}
        <section className="mb-20">
          <div className="rounded-xl border border-lightGrey p-6 md:p-8 bg-warmWhite shadow-card">
            <h3 className="font-serif text-xl md:text-2xl text-forest mb-2">Join the newsletter</h3>
            <p className="text-deepCharcoal/80 mb-4">Essays, book drops, and field notes—no fluff.</p>
            <form
              name="newsletter"
              method="POST"
              data-netlify="true"
              className="flex flex-col sm:flex-row gap-3"
            >
              <input type="hidden" name="form-name" value="newsletter" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="flex-1 rounded-md border border-lightGrey px-4 py-3 outline-none focus:ring-2 focus:ring-midGreen"
              />
              <button
                type="submit"
                className="bg-forest text-cream px-5 py-3 rounded-md tracking-brand hover:bg-softGold hover:text-forest transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
    </Layout>
  );
}
