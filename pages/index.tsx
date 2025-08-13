// pages/index.tsx
import React, { useMemo } from 'react';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';
import { siteConfig } from '../lib/siteConfig';

// --- NEW Components & Hooks ---
import HeroSection from '../components/homepage/HeroSection';
import AboutSection from '../components/homepage/AboutSection';
import ContentShowcase from '../components/homepage/ContentShowcase';
import NewsletterSection from '../components/homepage/NewsletterSection';
import { ThemeProvider } from '../lib/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// --- Exported Types for Reusability ---
export type Post = Required<
  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
>;

export type Book = Required<
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

// --- Animation Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.5, ease: "easeIn" } },
};

// --- Data Fetching ---
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const postsData = getAllPosts([
      'slug', 'title', 'date', 'publishedAt', 'excerpt', 'coverImage', 'author', 'readTime', 'category',
    ]);
    const booksData = getAllBooks([
      'slug', 'title', 'author', 'excerpt', 'coverImage', 'buyLink', 'genre', 'downloadPdf', 'downloadEpub',
    ]);

    const posts: Post[] = postsData
      .filter(p => p && p.slug)
      .slice(0, 3)
      .map((p, i) => ({
        slug: p.slug || `post-${i}`,
        title: p.title || 'Untitled Post',
        date: (p.date || p.publishedAt || new Date().toISOString()) as string,
        excerpt: p.excerpt || 'Discover insights and wisdom in this compelling read.',
        coverImage: p.coverImage || '/assets/images/blog/default-blog-cover.jpg',
        author: p.author || siteConfig.author,
        readTime: p.readTime || '5 min read',
        category: p.category || 'Insights',
      }));

    const books: Book[] = booksData
      .filter(b => b && b.slug)
      .slice(0, 4)
      .map((b, i) => ({
        slug: b.slug || `book-${i}`,
        title: b.title || 'Untitled Book',
        author: b.author || siteConfig.author,
        excerpt: b.excerpt || 'A compelling read that will transform your perspective.',
        coverImage: b.coverImage || '/assets/images/default-book.jpg',
        buyLink: b.buyLink || '#',
        genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Personal Development',
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    return {
      props: { posts, books },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { props: { posts: [], books: [] }, revalidate: 300 };
  }
};

// --- Transformed Page Component ---
export default function Home({ posts, books }: HomeProps) {
  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
    const currentYear = new Date().getFullYear();

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': siteConfig.title,
        'url': baseUrl,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': siteConfig.title,
        'url': baseUrl,
        'logo': abs('/assets/images/abraham-of-london-logo.svg'),
        'sameAs': siteConfig.socialLinks.map(link => link.href),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': siteConfig.author,
        'url': baseUrl,
        'image': abs('/assets/images/profile-portrait.webp'),
        'sameAs': siteConfig.socialLinks.map(link => link.href),
      },
      ...posts.map(post => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'image': abs(post.coverImage),
        'datePublished': post.date,
        'dateModified': post.date,
        'author': {
          '@type': 'Person',
          'name': post.author,
        },
        'publisher': {
          '@type': 'Organization',
          'name': siteConfig.title,
          'logo': {
            '@type': 'ImageObject',
            'url': abs('/assets/images/abraham-of-london-logo.svg'),
          }
        },
        'description': post.excerpt,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': abs(`/blog/${post.slug}`),
        },
      })),
      ...books.map(book => ({
        '@context': 'https://schema.org',
        '@type': 'Book',
        'name': book.title,
        'author': {
          '@type': 'Person',
          'name': book.author,
        },
        'isbn': 'N/A', // Update with actual ISBN if available
        'bookFormat': 'https://schema.org/EBook',
        'image': abs(book.coverImage),
        'publisher': siteConfig.title,
        'description': book.excerpt,
        'inLanguage': 'en-GB',
        'url': abs(`/books/${book.slug}`),
      })),
    ];
  }, [books, posts]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <ThemeProvider>
      <Head>
        <title>{siteConfig.title} - Fatherhood, Leadership & Life Lessons | Author & Strategist</title>
        <meta name="description" content={`${siteConfig.description} Join thousands of men on the journey to better fatherhood and leadership.`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={`${siteConfig.description} Join thousands of men on the journey to better fatherhood and leadership.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={abs('/assets/images/abraham-of-london-banner.webp')} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={`${siteConfig.description} Join thousands of men on the journey to better fatherhood and leadership.`} />
        <meta name="twitter:image" content={abs('/assets/images/abraham-of-london-banner.webp')} />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        
        {structuredData.map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
      </Head>

      <Layout>
        <ThemeToggle className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg" />

        <motion.div
          className="relative min-h-screen"
          initial="initial"
          animate="animate"
          variants={pageVariants}
        >
          <HeroSection />
          
          <AboutSection />
          
          {hasPosts && (
            <ContentShowcase
              title="Latest Insights"
              subtitle="Practical wisdom for the modern man."
              items={posts}
              type="post"
              link="/blog"
              linkText="View all articles"
            />
          )}

          {hasBooks && (
            <ContentShowcase
              title="A Library of Legacy"
              subtitle="My books on fatherhood and leadership."
              items={books}
              type="book"
              link="/books"
              linkText="Explore the entire collection"
            />
          )}

          <NewsletterSection />
        </motion.div>
      </Layout>
    </ThemeProvider>
  );
}