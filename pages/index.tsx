// pages/index.tsx
import React, { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

import Layout from '@/components/Layout';
import { getAllPosts, PostMeta } from '@/lib/posts';
import { getAllBooks, BookMeta } from '@/lib/books';
import { siteConfig, absUrl } from '@/lib/siteConfig';

// Keep core-above-the-fold SSR; defer heavier/animated sections:
const HeroSection = dynamic(() => import('@/components/homepage/HeroSection'), { ssr: true });
const AboutSection = dynamic(() => import('@/components/homepage/AboutSection'), { ssr: true });
const VenturesSection = dynamic(() => import('@/components/homepage/VenturesSection'), { ssr: true });
const ContentShowcase = dynamic(() => import('@/components/homepage/ContentShowcase'), { ssr: true });

// Non-critical; animation-heavy → defer client-side:
const NewsletterSection = dynamic(() => import('@/components/homepage/NewsletterSection'), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/homepage/TestimonialsSection'), { ssr: false });
const MilestonesTimeline = dynamic(() => import('@/components/homepage/MilestonesTimeline'), { ssr: false });
const EventsSection = dynamic(() => import('@/components/homepage/EventsSection'), { ssr: false });

// ---- Static image imports for LCP (auto blur, correct MIME, no 404s) ----
import heroBanner from '@/public/assets/images/abraham-of-london-banner.webp';
import profilePortrait from '@/public/assets/images/profile-portrait.webp';

// ---------- Constants ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const ASSETS = {
  heroBanner, // StaticImageData
  profilePortrait, // StaticImageData
  ogImage: '/assets/images/social/og-image.jpg',
  twitterImage: '/assets/images/social/twitter-image.webp',
  defaultBookCover: '/assets/images/default-book.jpg',
  defaultBlogCover: '/assets/images/blog/default-blog-cover.jpg',
  logo: '/assets/images/logo.svg',
} as const;

// ---------- Types ----------
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

interface Achievement {
  title: string;
  description: string;
  year: number;
}

interface HomeProps {
  posts: Post[];
  books: Book[];
  achievements: Achievement[];
}

// ---------- Micro Interactions ----------
const micro = {
  shimmer: {
    initial: { backgroundPosition: '200% 0' as const },
    animate: {
      backgroundPosition: ['-200% 0', '200% 0'] as const,
      transition: { duration: 3, repeat: Infinity, ease: 'linear' as const },
    },
  },
};

const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(smooth, [0, 1], ['0%', '50%']);
  const yParallax = useTransform(smooth, [0, 1], ['0%', '30%']);
  const opacity = useTransform(smooth, [0, 0.3], [1, 0]);
  return { yHero, yParallax, opacity };
};

const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1 bg-forest origin-left z-50" style={{ scaleX }} />;
};

// ---------- Data Fetching ----------
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
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

    // Sort newest first (ISO date or fallback)
    const sortedPosts = [...postsData].sort((a, b) => {
      const da = new Date((a.date || a.publishedAt || 0) as string).getTime();
      const db = new Date((b.date || b.publishedAt || 0) as string).getTime();
      return db - da;
    });

    const posts: Post[] = sortedPosts
      .filter((p) => p && p.slug)
      .slice(0, 3)
      .map((p, i) => ({
        slug: p.slug || `post-${i}`,
        title: p.title || 'Untitled Post',
        date: (p.date || p.publishedAt || new Date().toISOString()) as string,
        excerpt: p.excerpt || 'Discover insights and wisdom in this compelling read.',
        coverImage:
          typeof p.coverImage === 'string' && p.coverImage.trim()
            ? p.coverImage
            : ASSETS.defaultBlogCover,
        author: p.author || siteConfig.author,
        readTime: p.readTime || '5 min read',
        category: p.category || 'Insights',
      }));

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

    const books: Book[] = booksData
      .filter((b) => b && b.slug)
      .slice(0, 4)
      .map((b, i) => ({
        slug: b.slug || `book-${i}`,
        title: b.title || 'Untitled Book',
        author: b.author || siteConfig.author,
        excerpt: b.excerpt || 'A compelling read that will transform your perspective.',
        coverImage:
          typeof b.coverImage === 'string' && b.coverImage.trim()
            ? b.coverImage
            : ASSETS.defaultBookCover,
        buyLink: b.buyLink || '#',
        genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Personal Development',
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    const achievements: Achievement[] = [
      { title: 'Global Leadership Award', description: 'Recognized for innovative leadership', year: 2024 },
      { title: 'Best-Selling Author', description: 'Wide international readership', year: 2023 },
      { title: 'TEDx Speaker', description: 'Impactful talk on fatherhood', year: 2022 },
    ];

    return { props: { posts, books, achievements }, revalidate: 3600 };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { props: { posts: [], books: [], achievements: [] }, revalidate: 300 };
  }
};

// ---------- Page ----------
export default function Home({ posts, books, achievements }: HomeProps) {
  const [communityCount, setCommunityCount] = useState(0);
  const { yHero } = useParallax();

  // Gentle telemetry-esque counter to avoid hydration mismatch
  useEffect(() => {
    setCommunityCount(120_000);
    const id = setInterval(() => {
      setCommunityCount((prev) => Math.min(prev + Math.floor(Math.random() * 9) + 1, 150_000));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const sameAsLinks = useMemo(
    () => siteConfig.socialLinks.filter((l) => l.external && /^https?:\/\//i.test(l.href)).map((l) => l.href),
    [],
  );

  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL;
    const currentYear = new Date().getFullYear();

    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.title,
      alternateName: `${siteConfig.author} - Official Website`,
      description: siteConfig.description,
      url: baseUrl,
      inLanguage: 'en-GB',
      copyrightYear: currentYear,
      author: { '@type': 'Person', name: siteConfig.author, url: baseUrl },
      publisher: { '@type': 'Person', name: siteConfig.author, url: baseUrl },
      potentialAction: [
        { '@type': 'SearchAction', target: `${baseUrl}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
        { '@type': 'SubscribeAction', target: `${baseUrl}/#newsletter`, object: { '@type': 'Service', name: 'Newsletter Subscription' } },
      ],
    };

    const org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: siteConfig.title,
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: absUrl(ASSETS.logo), width: 512, height: 512 },
      image: { '@type': 'ImageObject', url: (ASSETS.profilePortrait as StaticImageData).src, width: 400, height: 400 },
      sameAs: sameAsLinks,
      address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
    };

    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: siteConfig.author,
      url: baseUrl,
      image: (ASSETS.profilePortrait as StaticImageData).src,
      jobTitle: 'Author & Global Strategist',
      sameAs: sameAsLinks,
      worksFor: { '@type': 'Organization', name: siteConfig.title },
    };

    const postSchemas = posts.map((p) => ({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      image: absUrl(p.coverImage),
      datePublished: p.date,
      dateModified: p.date,
      author: { '@type': 'Person', name: p.author },
      publisher: { '@type': 'Organization', name: siteConfig.title, logo: { '@type': 'ImageObject', url: absUrl('/assets/images/abraham-of-london-logo.svg') } },
      description: p.excerpt,
      mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(`/blog/${p.slug}`) },
    }));

    const bookSchemas = books.map((b) => ({
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: b.title,
      author: { '@type': 'Person', name: b.author },
      bookFormat: 'https://schema.org/EBook',
      image: absUrl(b.coverImage),
      publisher: siteConfig.title,
      description: b.excerpt,
      inLanguage: 'en-GB',
      url: absUrl(`/books/${b.slug}`),
      offers: { '@type': 'Offer', url: b.buyLink },
    }));

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl }],
    };

    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is Abraham of London?',
          acceptedAnswer: { '@type': 'Answer', text: `${siteConfig.author} is an author, strategist, and fatherhood advocate focused on family, leadership, and legacy.` },
        },
        {
          '@type': 'Question',
          name: 'What books has Abraham written?',
          acceptedAnswer: { '@type': 'Answer', text: `Books on fatherhood, leadership, and personal development to help men build durable legacies.` },
        },
      ],
    };

    return [website, org, person, ...postSchemas, ...bookSchemas, breadcrumb, faq];
  }, [books, posts, sameAsLinks]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} — Empowering Global Leaders in Fatherhood & Strategy</title>
        <meta
          name="description"
          content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders transforming fatherhood and leadership.`}
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={SITE_URL} />
        {/* LCP preloads */}
        <link rel="preload" as="image" href={(ASSETS.heroBanner as StaticImageData).src} imagesizes="100vw" />
        {/* OG/Twitter */}
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={absUrl(ASSETS.ogImage)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`} />
        <meta name="twitter:image" content={absUrl(ASSETS.twitterImage)} />
        <meta name="theme-color" content="#0b2e1f" />
        <meta name="color-scheme" content="dark light" />
        {/* JSON-LD */}
        {structuredData.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
        ))}
      </Head>

      <ScrollProgress />

      <div className="relative min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
        {/* HERO (SSR, LCP-optimized) */}
        <section className="relative w-full min-h-[70vh] sm:min-h-[85vh] overflow-hidden">
          {/* Parallax banner */}
          <motion.div style={{ y: yHero }} className="absolute inset-0 -z-10">
            <Image
              src={ASSETS.heroBanner}
              alt="Abraham of London — Empowering Leadership and Fatherhood Advocacy"
              fill
              priority
              fetchPriority="high"
              placeholder="blur"
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          <div className="relative z-10">
            <HeroSection
              title={siteConfig.title}
              subtitle="Global Strategist, Author, and Visionary Leader"
              ctaText="Join the Movement"
              ctaLink="/join"
              communityCount={communityCount}
            />
          </div>
        </section>

        {/* ABOUT (SSR) */}
        <AboutSection
          bio="I’m Abraham of London, a globally recognized strategist and author dedicated to redefining leadership and fatherhood. With decades of experience across industries, I empower millions to build legacies of impact."
          achievements={achievements}
          portraitSrc={(ASSETS.profilePortrait as StaticImageData).src}
        />

        {/* VENTURES (SSR) */}
        <VenturesSection />

        {/* POSTS & BOOKS (SSR for SEO) */}
        {hasPosts && (
          <ContentShowcase
            title="Thought Leadership"
            subtitle="Insights shaping the future of leadership."
            items={posts}
            type="post"
            link="/blog"
            linkText="Discover More Insights"
            className="bg-white/5 backdrop-blur-md"
          />
        )}

        {hasBooks && (
          <ContentShowcase
            title="Legacy Library"
            subtitle="Transformative works for global leaders."
            items={books}
            type="book"
            link="/books"
            linkText="Explore the Collection"
            className="bg-white/5 backdrop-blur-md"
          />
        )}

        {/* SOCIAL PROOF & ENGAGEMENT (deferred) */}
        <TestimonialsSection />
        <MilestonesTimeline />
        <EventsSection />

        {/* NEWSLETTER (deferred) */}
        <div id="newsletter">
          <NewsletterSection
            title="Join the Global Community"
            subtitle={`Be part of ${communityCount.toLocaleString()} leaders receiving exclusive insights.`}
          />
        </div>

        {/* Footer CTA */}
        <section className="py-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-full hover:bg-emerald-700 transition"
          >
            Let’s Build Something Enduring
          </Link>
        </section>
      </div>
    </Layout>
  );
}