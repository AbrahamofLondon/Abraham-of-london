// pages/index.tsx
import React from 'react';
import Head from 'next/head';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import SocialLinks from '../components/SocialLinks';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';

// ---- Static image imports (safe fix for missing/typo’d paths) ----
import heroBanner from '../public/assets/images/abraham-of-london-banner.webp';
import profilePortrait from '../public/assets/images/profile-portrait.webp';

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  ''
).replace(/\/$/, '');

const abs = (path: string) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// Convert StaticImageData | string to absolute URL string (for JSON-LD, meta)
const imgToUrl = (img: string | StaticImageData) =>
  typeof img === 'string' ? abs(img) : abs(img.src);

const hasData = <T,>(arr?: T[] | null): arr is T[] => Array.isArray(arr) && arr.length > 0;

type SocialMetaLink = { href: string; label: string; icon: string; external?: boolean };

const siteConfig = {
  socialLinks: [
    { href: 'mailto:info@abrahamoflondon.org', label: 'Email', icon: '/assets/images/social/email.svg' },
    { href: 'tel:+442086225909', label: 'Phone', icon: '/assets/images/social/phone.svg' },
    {
      href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
      label: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      external: true,
    },
    {
      href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
      label: 'X',
      icon: '/assets/images/social/twitter.svg',
      external: true,
    },
    {
      href: 'https://www.facebook.com/share/1MRrKpUzMG/',
      label: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      external: true,
    },
    {
      href: 'https://wa.me/447496334022',
      label: 'WhatsApp',
      icon: '/assets/images/social/whatsapp.svg',
      external: true,
    },
  ] as SocialMetaLink[],
  assets: {
    heroBanner,                    // Static import (reliable)
    profilePortrait,               // Static import (fixes failing portrait)
    ogImage: '/assets/social/og-image.jpg', // Stays as a path for OG/Twitter
  } as {
    heroBanner: StaticImageData;
    profilePortrait: StaticImageData;
    ogImage: string;
  },
};

// ---------- Types ----------
type Post = Required<
  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
>;

type Book = Required<Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>> & {
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

interface HomeProps {
  posts: Post[];
  books: Book[];
}

// ---------- Data Fetching ----------
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsData = getAllPosts([
    'slug', 'title', 'date', 'publishedAt', 'excerpt', 'coverImage',
    'author', 'readTime', 'category',
  ]);

  const booksData = getAllBooks([
    'slug', 'title', 'author', 'excerpt', 'coverImage', 'buyLink',
    'genre', 'downloadPdf', 'downloadEpub',
  ]);

  const posts: Post[] = postsData.map((p, i) => ({
    slug: p.slug || `post-${i}`,
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || new Date().toISOString()) as string,
    excerpt: p.excerpt || 'Read more for full details.',
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/assets/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  const books: Book[] = booksData.map((b, i) => ({
    slug: b.slug || `book-${i}`,
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || '#',
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Uncategorized',
    downloadPdf: b.downloadPdf ?? null,
    downloadEpub: b.downloadEpub ?? null,
  }));

  return {
    props: {
      posts: posts.slice(0, 3),
      books: books.slice(0, 3),
    },
    revalidate: 60,
  };
};

// ---------- Page Component ----------
export default function Home({ posts, books }: HomeProps) {
  const featured = books[0];

  const sameAsLinks = siteConfig.socialLinks
    .filter((link) => Boolean(link.external) && /^https?:\/\//i.test(link.href))
    .map((link) => link.href);

  // JSON-LD
  const bookJsonLd = hasData(books)
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: books.map((book, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: abs(`/books/${book.slug}`),
        })),
      }
    : null;

  const postJsonLd = hasData(posts)
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: posts.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: abs(`/blog/${post.slug}`),
        })),
      }
    : null;

  const websiteJsonLd = SITE_URL
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Abraham of London',
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }
    : null;

  const orgJsonLd = SITE_URL
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Abraham of London',
        url: SITE_URL,
        logo: imgToUrl(siteConfig.assets.profilePortrait),
        sameAs: sameAsLinks,
      }
    : null;

  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />

        {/* Canonical */}
        {SITE_URL && <link rel="canonical" href={SITE_URL} />}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        {SITE_URL && <meta property="og:url" content={SITE_URL} />}
        <meta property="og:title" content="Abraham of London" />
        <meta
          property="og:description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:image" content={abs(siteConfig.assets.ogImage)} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Abraham of London" />
        <meta
          name="twitter:description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta name="twitter:image" content={abs(siteConfig.assets.ogImage)} />

        {/* JSON-LD */}
        {bookJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
        )}
        {postJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        )}
        {websiteJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        )}
        {orgJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        )}
      </Head>

      {/* Hero */}
      <header className="bg-forest text-cream">
        <div className="relative w-full h-64 sm:h-96">
          <Image
            src={siteConfig.assets.heroBanner}
            alt="Abraham of London — strategic leadership and fatherhood advocacy"
            fill
            className="object-cover"
            priority
            placeholder="blur"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="font-serif tracking-brand text-3xl sm:text-5xl font-bold text-center">Abraham of London</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12">
        {/* About + Social */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">About Abraham</h2>
            <p className="mb-4 text-deepCharcoal">
              Abraham of London is an author, strategist, and fatherhood advocate passionate about family, leadership,
              and legacy.
            </p>
            <SocialLinks links={siteConfig.socialLinks} />
          </div>

          <div className="relative w-64 h-64 mx-auto">
            <Image
              src={siteConfig.assets.profilePortrait}
              alt="Portrait of Abraham of London"
              fill
              className="rounded-full shadow-card object-cover"
              sizes="256px"
              placeholder="blur"
              priority={false}
            />
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Featured Book */}
        {featured && (
          <section className="mb-16">
            <div className="rounded-2xl border border-lightGrey bg-white p-6 shadow-card">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="relative w-full h-72 rounded-lg overflow-hidden">
                  <Image
                    src={featured.coverImage || '/assets/images/default-book.jpg'}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-forest mb-1">Featured Book</h3>
                  <h4 className="text-xl font-semibold text-deepCharcoal mb-1">{featured.title}</h4>
                  <p className="text-sm text-deepCharcoal/70 mb-4">By {featured.author}</p>
                  <p className="text-deepCharcoal mb-6">{featured.excerpt}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/books/${featured.slug}`}
                      className="bg-forest text-cream px-4 py-2 rounded-[6px] hover:bg-midGreen transition-colors cursor-pointer"
                    >
                      Learn more
                    </Link>
                    {featured.downloadPdf && (
                      <a
                        href={featured.downloadPdf}
                        className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition-colors cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download PDF of ${featured.title}`}
                      >
                        Download PDF
                      </a>
                    )}
                    {featured.downloadEpub && (
                      <a
                        href={featured.downloadEpub}
                        className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition-colors cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download EPUB of ${featured.title}`}
                      >
                        Download EPUB
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <hr className="my-12 border-lightGrey" />

        {/* Books */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book, idx) => (
              <BookCard key={`${book.slug}-${idx}`} {...book} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Posts */}
        <section>
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => (
              <BlogPostCard key={`${post.slug}-${idx}`} {...post} />
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
