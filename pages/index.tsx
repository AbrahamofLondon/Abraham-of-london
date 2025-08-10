// pages/index.tsx
import React, { useMemo, useState } from 'react';
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
  tags?: string[];
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
    'tags',
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
    // Blog covers stored here:
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
    tags: Array.isArray(p.tags) ? p.tags : [],
  }));

  const books: Book[] = booksData.map((b: Partial<BookMeta>) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    // Book covers folder; fallback lives in /assets/images
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || '#',
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Uncategorized',
  }));

  return {
    props: {
      posts: posts.slice(0, 6),
      books: books.slice(0, 6),
    },
    revalidate: 60,
  };
};

export default function Home({ posts, books }: HomeProps) {
  // Featured items (first of each list)
  const featuredPost = posts[0];
  const featuredBook = books[0];

  // Unique topic chips from posts
  const topics = useMemo(() => {
    const set = new Set<string>();
    posts.slice(0, 6).forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 10);
  }, [posts]);

  // Newsletter stub
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle');

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      setStatus('loading');
      // Wire this route later; we simulate success:
      await new Promise((r) => setTimeout(r, 600));
      setStatus('ok');
      setEmail('');
    } catch {
      setStatus('err');
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Abraham of London',
    url: 'https://abrahamoflondon.org',
    sameAs: [
      'https://www.linkedin.com/in/abraham-adaramola-06630321/',
      'https://x.com/AbrahamAda48634',
      'https://www.facebook.com/share/1MRrKpUzMG/',
    ],
  };

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {/* Hero */}
      <header className="bg-forest text-cream">
        <div className="relative w-full h-[22rem] sm:h-[28rem]">
          <Image
            src="/assets/images/abraham-of-london-banner.webp"
            alt="Abraham of London — strategic leadership and fatherhood advocacy"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center px-4 text-center">
            <h1 className="font-serif tracking-brand text-4xl sm:text-5xl font-bold">
              Abraham of London
            </h1>
            <p className="mt-3 max-w-2xl text-cream/90">
              Leadership, fatherhood, and legacy—told with conviction and built for change.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <Link href="/books" className="btn-primary">
                Explore Books
              </Link>
              <Link href="/blog" className="btn-secondary">
                Read the Blog
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12">
        {/* Social proof */}
        <section className="mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center opacity-80">
            <Image src="/assets/images/alomarada-ltd.webp" alt="Alomarada" width={160} height={64} />
            <Image src="/assets/images/endlureluxe-ltd.webp" alt="Endureluxe" width={160} height={64} />
            <Image src="/assets/images/abraham-logo.jpg" alt="Abraham of London Mark" width={160} height={64} />
            <Image src="/assets/images/default-book.jpg" alt="Publishing" width={160} height={64} />
          </div>
        </section>

        {/* Featured */}
        <section className="mb-16 grid lg:grid-cols-2 gap-10">
          {featuredBook && (
            <div className="card">
              <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">Featured Book</h2>
              <BookCard {...featuredBook} />
              <div className="mt-4">
                <Link href="/books" className="text-forest hover:text-softGold">See all books →</Link>
              </div>
            </div>
          )}
          {featuredPost && (
            <div className="card">
              <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">Featured Post</h2>
              <BlogPostCard
                slug={featuredPost.slug}
                title={featuredPost.title}
                date={featuredPost.date}
                excerpt={featuredPost.excerpt}
                coverImage={featuredPost.coverImage}
                author={featuredPost.author}
                readTime={featuredPost.readTime}
                category={featuredPost.category}
              />
              <div className="mt-4">
                <Link href="/blog" className="text-forest hover:text-softGold">Browse all posts →</Link>
              </div>
            </div>
          )}
        </section>

        {/* Topics */}
        {topics.length > 0 && (
          <section className="mb-12">
            <h3 className="font-serif text-xl tracking-brand text-forest mb-4">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <span key={t} className="px-3 py-1 text-sm border border-lightGrey text-forest">
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Books */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.slice(0, 6).map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        {/* Posts */}
        <section>
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.slice(0, 6).map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="mt-16 card">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-3">
            Join the newsletter
          </h2>
          <p className="text-deepCharcoal mb-4">
            Essays, book drops, and field notes—no fluff.
          </p>
          <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-lightGrey px-4 py-3 outline-none focus:ring-1 focus:ring-forest"
              aria-label="Email address"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          {status === 'ok' && <p className="mt-2 text-sm text-green-700">You’re in—check your inbox.</p>}
          {status === 'err' && <p className="mt-2 text-sm text-red-700">Something went wrong. Try again.</p>}
        </section>
      </main>

      <footer className="site-footer text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
      </footer>
    </Layout>
  );
}
