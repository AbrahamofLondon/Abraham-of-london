// pages/index.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';
import { siteConfig } from '../lib/siteConfig';

// --- NEW Components & Hooks (You'll need to create these) ---
import HeroSection from '../components/homepage/HeroSection';
import AboutSection from '../components/homepage/AboutSection';
import ContentShowcase from '../components/homepage/ContentShowcase';
import NewsletterSection from '../components/homepage/NewsletterSection';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import ThemeToggle from '../components/ThemeToggle'; // Simple component for the toggle button

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

// --- Types (Remaining from previous code) ---
type Post = Required<
  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
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

// --- Animation Variants for new design ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.5, ease: "easeIn" } },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

// --- Data Fetching (Unchanged and still great for performance) ---
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
      .slice(0, 3) // Get only the top 3 posts
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
      .slice(0, 4) // Get only the top 4 books
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

// ---------- Transformed Page Component ----------
export default function Home({ posts, books }: HomeProps) {
  const structuredData = useMemo(() => {
    // --- JSON-LD Schema remains the same, no changes needed here ---
    const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
    const currentYear = new Date().getFullYear();
    
    // ... [The rest of your structuredData object from before] ...
    // NOTE: For brevity, I've omitted the full structuredData object here,
    // as it's a direct copy from your previous code and is already excellent.
    // You should copy and paste that entire object here.
    return []; // Placeholder for the actual structured data.
  }, [books, posts]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <ThemeProvider>
      <Head>
        {/* --- SEO & Meta tags (Unchanged and excellent) --- */}
        <title>{siteConfig.title} - Fatherhood, Leadership & Life Lessons | Author & Strategist</title>
        <meta name="description" content={`${siteConfig.description} Join thousands of men on the journey to better fatherhood and leadership.`} />
        {/* ... [Rest of your meta tags] ... */}
        {structuredData.map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
      </Head>

      <Layout>
        {/* New Theme Toggle Button */}
        <ThemeToggle className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg" />

        {/* The main page content container with animations */}
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