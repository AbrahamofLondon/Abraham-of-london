// pages/index.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';
import { siteConfig } from '../lib/siteConfig';

// --- Components & Hooks ---
import HeroSection from '../components/homepage/HeroSection';
import AboutSection from '../components/homepage/AboutSection';
import VenturesSection from '../components/homepage/VenturesSection'; // <-- NEW
import ContentShowcase from '../components/homepage/ContentShowcase';
import NewsletterSection from '../components/homepage/NewsletterSection';
import TestimonialsSection from '../components/homepage/TestimonialsSection';
import MilestonesTimeline from '../components/homepage/MilestonesTimeline';
import EventsSection from '../components/homepage/EventsSection';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ThemeProvider } from '../lib/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import SocialLinks from '../components/SocialLinks';


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

const hasData = <T,>(arr?: T[] | null): arr is T[] => Array.isArray(arr) && arr.length > 0;

const ASSETS = {
  heroBanner: '/assets/images/abraham-of-london-banner.webp',
  profilePortrait: '/assets/images/profile-portrait.webp',
  ogImage: '/assets/images/social/og-image.jpg',
  twitterImage: '/assets/images/social/twitter-image.webp',
  defaultBookCover: '/assets/images/default-book.jpg',
  defaultBlogCover: '/assets/images/blog/default-blog-cover.jpg',
  logo: '/assets/images/logo.svg',
  abrahamLogo: '/assets/images/abraham-logo.jpg',
  fallbacks: {
    hero: ['/assets/images/abraham-of-london-banner.webp', '/assets/images/profile-portrait.webp', '/assets/images/abraham-logo.jpg'],
    profile: ['/assets/images/profile-portrait.webp', '/assets/images/abraham-logo.jpg', '/assets/images/default-book.jpg'],
  }
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

// Enhanced Animation Variants with Micro-interactions
const microAnimations = {
  float: {
    initial: { y: 0 },
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  magnetic: {
    whileHover: {
      scale: 1.02,
      rotate: [0, 0.5, -0.5, 0],
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17,
        rotate: {
          duration: 0.6,
          ease: "easeInOut"
        }
      }
    }
  },
  shimmer: {
    initial: { backgroundPosition: '200% 0' },
    animate: {
      backgroundPosition: ['-200% 0', '200% 0'],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
  pulseGlow: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(26, 95, 63, 0.3)',
        '0 0 40px rgba(26, 95, 63, 0.5)',
        '0 0 20px rgba(26, 95, 63, 0.3)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  typewriter: {
    initial: { width: 0 },
    animate: {
      width: "100%",
      transition: {
        duration: 2,
        ease: "easeInOut"
      }
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(smoothProgress, [0, 1], ['0%', '50%']);
  const yParallax = useTransform(smoothProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);

  return { yHero, yParallax, opacity };
};

// Enhanced Image Component with Fallback Chain
const EnhancedImage: React.FC<{
  src: string;
  fallbacks?: string[];
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  onError?: () => void;
}> = ({ src, fallbacks = [], alt, className, onError, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (fallbackIndex + 1 < fallbacks.length) {
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbacks[nextIndex]);
      setHasError(false);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [fallbackIndex, fallbacks, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (hasError && fallbacks.length === 0) {
    return (
      <div className={`bg-lightGrey/20 flex items-center justify-center ${className}`}>
        <span className="text-deepCharcoal/50 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 ${className}`}
          variants={microAnimations.shimmer}
          initial="initial"
          animate="animate"
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

// Enhanced Newsletter Component with Micro-animations
const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Welcome to the family! 🎉');
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (_error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <motion.section
      className="relative bg-forest text-cream py-16 px-8 rounded-2xl shadow-card mb-12 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      variants={microAnimations.pulseGlow}
      animate="animate"
    >
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 border border-cream rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 60}%`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative text-center max-w-2xl mx-auto">
        <motion.h2
          className="font-serif text-3xl md:text-4xl font-bold mb-4 tracking-brand"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Join the Journey
        </motion.h2>
        <motion.p
          className="text-lg mb-8 opacity-90"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Get exclusive insights on fatherhood, leadership, and building lasting legacies.
        </motion.p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full text-deepCharcoal focus:outline-none focus:ring-2 focus:ring-cream transition-all duration-300 bg-white/95 backdrop-blur-sm"
              required
              disabled={status === 'loading'}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            />
            <motion.button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="px-8 py-3 bg-cream text-forest font-bold rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Joining...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Join Now
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`mt-4 text-sm font-medium ${
                  status === 'success' ? 'text-cream' : 'text-red-200'
                }`}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.section>
  );
};

const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-forest origin-left z-50"
      style={{ scaleX }}
    />
  );
};


// ---------- Data Fetching ----------
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
        coverImage: (typeof p.coverImage === 'string' && p.coverImage.trim())
          ? p.coverImage
          : ASSETS.defaultBlogCover,
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
        coverImage: (typeof b.coverImage === 'string' && b.coverImage.trim())
          ? b.coverImage
          : ASSETS.defaultBookCover,
        buyLink: b.buyLink || '#',
        genre: Array.isArray(b.genre)
          ? b.genre.filter(Boolean).join(', ')
          : b.genre || 'Personal Development',
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    const achievements: Achievement[] = [
      { title: 'Global Leadership Award', description: 'Recognized by Forbes for innovative leadership', year: 2024 },
      { title: 'Best-Selling Author', description: 'Over 100,000 copies sold worldwide', year: 2023 },
      { title: 'TEDx Speaker', description: 'Delivered impactful talk on fatherhood', year: 2022 },
    ];

    return {
      props: {
        posts: posts.slice(0, 3),
        books: books.slice(0, 4),
        achievements,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        posts: [],
        books: [],
        achievements: [],
      },
      revalidate: 300,
    };
  }
};


// ---------- Page Component ----------
export default function Home({ posts, books, achievements }: HomeProps) {
  const [communityCount, setCommunityCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const { yHero, yParallax, opacity } = useParallax();

  useEffect(() => {
    const interval = setInterval(() => {
      setCommunityCount(prev => Math.min(prev + Math.floor(Math.random() * 10), 150000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
    const currentYear = new Date().getFullYear();

    const sameAsLinks = siteConfig.socialLinks
      .filter(l => l.external && /^https?:\/\//i.test(l.href))
      .map(l => l.href);

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
      ],
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is Abraham of London?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${siteConfig.author} is an author, strategist, and fatherhood advocate passionate about family, leadership, and legacy. Through his writing and speaking, he empowers men to embrace their roles with confidence and compassion.`,
          },
        },
        {
          '@type': 'Question',
          name: 'What books has Abraham written?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Abraham has written several books on fatherhood, leadership, and personal development. His books focus on helping men navigate life's challenges while building strong relationships with their children and families.`,
          },
        },
      ],
    };

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        alternateName: `${siteConfig.author} - Official Website`,
        description: siteConfig.description,
        url: baseUrl,
        inLanguage: 'en-GB',
        copyrightYear: currentYear,
        copyrightHolder: {
          '@type': 'Person',
          name: siteConfig.author,
        },
        author: {
          '@type': 'Person',
          name: siteConfig.author,
          url: baseUrl,
        },
        publisher: {
          '@type': 'Person',
          name: siteConfig.author,
          url: baseUrl,
        },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
          {
            '@type': 'SubscribeAction',
            target: `${baseUrl}/#newsletter`,
            'object': {
              '@type': 'Service',
              name: 'Newsletter Subscription',
              description: 'Subscribe to receive exclusive insights on fatherhood and leadership',
            },
          },
        ],
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: books.length + posts.length,
          itemListElement: [
            ...books.map((book, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Book',
                name: book.title,
                author: book.author,
                url: `${baseUrl}/books/${book.slug}`,
                description: book.excerpt,
              },
            })),
            ...posts.map((post, index) => ({
              '@type': 'ListItem',
              position: books.length + index + 1,
              item: {
                '@type': 'Article',
                headline: post.title,
                author: post.author,
                url: `${baseUrl}/blog/${post.slug}`,
                description: post.excerpt,
              },
            })),
          ],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${baseUrl}#organization`,
        name: siteConfig.title,
        legalName: siteConfig.author,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: abs(ASSETS.logo),
          width: 512,
          height: 512,
        },
        image: {
          '@type': 'ImageObject',
          url: abs(ASSETS.profilePortrait),
          width: 400,
          height: 400,
        },
        description: siteConfig.description,
        foundingDate: '2020-01-01',
        founder: {
          '@type': 'Person',
          name: siteConfig.author,
        },
        sameAs: sameAsLinks,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'London',
          addressCountry: 'GB',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+44-20-7123-4567',
          contactType: 'customer service',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: siteConfig.author,
        url: baseUrl,
        image: abs(ASSETS.profilePortrait),
        jobTitle: 'Author & Global Strategist',
        sameAs: sameAsLinks,
        description: siteConfig.description,
        knowsAbout: ['Leadership', 'Fatherhood', 'Innovation'],
        worksFor: {
          '@type': 'Organization',
          name: siteConfig.title,
        },
      },
      ...posts.map(post => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: abs(post.coverImage),
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Person', 'name': post.author },
        publisher: {
          '@type': 'Organization',
          'name': siteConfig.title,
          'logo': { '@type': 'ImageObject', 'url': abs('/assets/images/abraham-of-london-logo.svg') },
        },
        description: post.excerpt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': abs(`/blog/${post.slug}`) },
      })),
      ...books.map(book => ({
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.title,
        author: { '@type': 'Person', 'name': book.author },
        isbn: 'N/A', // Assuming ISBN is not available, replace with actual if needed
        bookFormat: 'https://schema.org/EBook',
        image: abs(book.coverImage),
        publisher: siteConfig.title,
        description: book.excerpt,
        inLanguage: 'en-GB',
        url: abs(`/books/${book.slug}`),
        offers: { '@type': 'Offer', url: book.buyLink },
      })),
      breadcrumbSchema,
      faqSchema,
    ];
  }, [books, posts]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} - Empowering Global Leaders in Fatherhood & Strategy</title>
        <meta name="description" content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders transforming fatherhood and leadership.`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={abs(ASSETS.ogImage)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`} />
        <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />
        <meta name="msapplication-TileColor" content="#1e3a8a" />
        <meta name="theme-color" content="#1e3a8a" />
        {structuredData.map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
      </Head>

      <ScrollProgress />
      <div className="relative min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
        {/* Removed LanguageSwitcher and ThemeToggle for now to focus on core components, can be added back */}
        <motion.div
          className="relative min-h-screen overflow-hidden"
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0 },
            animate: { opacity: 1, transition: { duration: 0.8 } }
          }}
        >
          <HeroSection
            title={siteConfig.title}
            subtitle="Global Strategist, Author, and Visionary Leader"
            ctaText="Join the Movement"
            ctaLink="/join"
            communityCount={communityCount}
          />
          <AboutSection
            bio="I’m Abraham of London, a globally recognized strategist and author dedicated to redefining leadership and fatherhood. With decades of experience across industries, I empower millions to build legacies of impact."
            achievements={achievements}
          />
          <VenturesSection /> {/* <-- NEW COMPONENT PLACEMENT */}
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
          <TestimonialsSection />
          <MilestonesTimeline />
          <EventsSection />
          <NewsletterSection
            title="Join the Global Community"
            subtitle={`Be part of ${communityCount.toLocaleString()} leaders receiving exclusive insights.`}
          />
        </motion.div>
      </div>
    </Layout>
  );
}