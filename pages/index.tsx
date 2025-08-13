// pages/index.tsx
import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import SocialLinks from '../components/SocialLinks';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';
import { siteConfig } from '../lib/siteConfig';

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

// Asset validation with fallbacks
const ASSETS = {
  heroBanner: '/assets/images/abraham-of-london-banner.webp',
  profilePortrait: '/assets/images/profile-portrait.webp',
  ogImage: '/assets/images/social/og-image.jpg',
  twitterImage: '/assets/images/social/twitter-image.webp',
  defaultBookCover: '/assets/images/default-book.jpg',
  defaultBlogCover: '/assets/images/blog/default-blog-cover.jpg',
  logo: '/assets/images/logo.svg',
  abrahamLogo: '/assets/images/abraham-logo.jpg',
} as const;

// ---------- Types ----------
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

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
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

    const posts: Post[] = postsData
      .filter(p => p && p.slug) // Filter out invalid posts
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
      .filter(b => b && b.slug) // Filter out invalid books
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

    return {
      props: {
        posts: posts.slice(0, 3),
        books: books.slice(0, 4), // Show more books
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (_error) {
    console.error('Error in getStaticProps:', _error);
    return {
      props: {
        posts: [],
        books: [],
      },
      revalidate: 60,
    };
  }
};

// ---------- Newsletter Component ----------
const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    
    try {
      // Replace with your actual newsletter signup endpoint
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing!');
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (_error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <motion.section
      className="bg-forest text-cream py-16 px-8 rounded-2xl shadow-card mb-12"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 tracking-brand">
          Stay Connected
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Receive exclusive insights on fatherhood, leadership, and life lessons directly in your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 rounded-full text-deepCharcoal focus:outline-none focus:ring-2 focus:ring-cream transition-all"
              required
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="px-8 py-3 bg-cream text-forest font-bold rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
          
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-sm ${
                status === 'success' ? 'text-cream' : 'text-red-200'
              }`}
            >
              {message}
            </motion.p>
          )}
        </form>
      </div>
    </motion.section>
  );
};

// ---------- Page Component ----------
export default function Home({ posts, books }: HomeProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const featured = books[0];

  // Enhanced JSON-LD with proper error handling
  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
    const sameAsLinks = siteConfig.socialLinks
      .filter(l => l.external && /^https?:\/\//i.test(l.href))
      .map(l => l.href);
    
    return [
      // Website schema
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        description: siteConfig.description,
        url: baseUrl,
        author: {
          '@type': 'Person',
          name: siteConfig.author,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      // Organization schema
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.title,
        url: baseUrl,
        logo: abs(ASSETS.logo),
        image: abs(ASSETS.profilePortrait),
        description: siteConfig.description,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: siteConfig.email,
            telephone: siteConfig.phone,
            contactType: 'Customer Service',
          },
        ],
        sameAs: sameAsLinks,
      },
      // Person schema
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: siteConfig.author,
        alternateName: siteConfig.title,
        description: siteConfig.description,
        url: baseUrl,
        image: abs(ASSETS.profilePortrait),
        email: siteConfig.email,
        telephone: siteConfig.phone,
        jobTitle: 'Author & Fatherhood Advocate',
        sameAs: sameAsLinks,
      },
    ];
  }, []);

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src));
  };

  const getImageSrc = (src: string, fallback: string) => {
    return imageErrors.has(src) ? fallback : src;
  };

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} - Fatherhood, Leadership & Life Lessons</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="author" content={siteConfig.author} />
        <meta name="keywords" content="fatherhood, leadership, parenting, men, family, Abraham Adaramola, books, author" />
        
        {/* Enhanced meta tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={SITE_URL} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={`${siteConfig.title} - Fatherhood, Leadership & Life Lessons`} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:image" content={abs(ASSETS.ogImage)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${siteConfig.title} - Author and Father`} />
        <meta property="og:locale" content="en_GB" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AbrahamAda48634" />
        <meta name="twitter:creator" content="@AbrahamAda48634" />
        <meta name="twitter:title" content={`${siteConfig.title} - Fatherhood, Leadership & Life Lessons`} />
        <meta name="twitter:description" content={siteConfig.description} />
        <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />
        <meta name="twitter:image:alt" content={`${siteConfig.title} - Author and Father`} />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1a5f3f" />

        {/* Structured Data */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      {/* Enhanced Hero Section */}
      <motion.header
        className="bg-forest text-cream relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="relative w-full h-64 sm:h-96 lg:h-[32rem]">
          <Image
            src={getImageSrc(ASSETS.heroBanner, ASSETS.profilePortrait)}
            alt={`${siteConfig.title} — strategic leadership and fatherhood advocacy`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
            onError={() => handleImageError(ASSETS.heroBanner)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div>
              <h1 className="font-serif tracking-brand text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 text-cream drop-shadow-lg">
                {siteConfig.title}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-cream/90 max-w-2xl mx-auto leading-relaxed">
                {siteConfig.description}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.header>

      <main className="container px-4 py-12 max-w-6xl mx-auto">
        {/* Enhanced About + Social Section */}
        <motion.section
          className="grid md:grid-cols-2 gap-12 items-center mb-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={staggerItem}>
            <h2 className="font-serif text-3xl md:text-4xl tracking-brand text-forest mb-6">
              About Abraham
            </h2>
            <div className="prose prose-lg text-deepCharcoal">
              <p className="mb-4">
                Abraham of London is an author, strategist, and fatherhood advocate passionate about
                family, leadership, and legacy. Through his writing and speaking, he empowers men
                to embrace their roles with confidence and compassion.
              </p>
              <p className="mb-6">
                His mission is to inspire fathers to navigate life&apos;s challenges with resilience
                while building strong, lasting relationships with their children and families.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <SocialLinks links={siteConfig.socialLinks} />
            </motion.div>
          </motion.div>

          <motion.div
            className="relative w-80 h-80 mx-auto"
            variants={staggerItem}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={getImageSrc(ASSETS.profilePortrait, ASSETS.defaultBookCover)}
              alt={`Portrait of ${siteConfig.author}`}
              fill
              className="rounded-full shadow-card object-cover border-4 border-cream"
              sizes="320px"
              quality={85}
              onError={() => handleImageError(ASSETS.profilePortrait)}
            />
            <div className="absolute inset-0 rounded-full ring-8 ring-forest/10" />
          </motion.div>
        </motion.section>

        <hr className="my-16 border-lightGrey" />

        {/* Enhanced Featured Book */}
        {featured && (
          <motion.section
            className="mb-20"
            {...fadeInUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="rounded-2xl border border-lightGrey bg-white p-8 shadow-card hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <motion.div
                  className="relative w-full h-80 rounded-lg overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={getImageSrc(featured.coverImage, ASSETS.defaultBookCover)}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                    onError={() => handleImageError(featured.coverImage)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                
                <div>
                  <motion.h3
                    className="font-serif text-3xl text-forest mb-2 tracking-brand"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    Featured Book
                  </motion.h3>
                  <h4 className="text-2xl font-bold text-deepCharcoal mb-2">{featured.title}</h4>
                  <p className="text-deepCharcoal/70 mb-1">By {featured.author}</p>
                  <p className="text-sm text-midGreen font-medium mb-4">{featured.genre}</p>
                  <p className="text-deepCharcoal mb-8 leading-relaxed">{featured.excerpt}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={`/books/${featured.slug}`}
                      className="bg-forest text-cream px-6 py-3 rounded-lg font-semibold hover:bg-midGreen transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      Learn More
                    </Link>
                    {featured.buyLink && featured.buyLink !== '#' && (
                      <a
                        href={featured.buyLink}
                        className="border-2 border-forest text-forest px-6 py-3 rounded-lg font-semibold hover:bg-forest hover:text-cream transition-all duration-300"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buy ${featured.title}`}
                      >
                        Buy Now
                      </a>
                    )}
                    {featured.downloadPdf && (
                      <a
                        href={featured.downloadPdf}
                        className="text-forest hover:text-midGreen underline font-medium flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download PDF of ${featured.title}`}
                      >
                        📄 Download PDF
                      </a>
                    )}
                    {featured.downloadEpub && (
                      <a
                        href={featured.downloadEpub}
                        className="text-forest hover:text-midGreen underline font-medium flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download EPUB of ${featured.title}`}
                      >
                        📱 Download EPUB
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <hr className="my-16 border-lightGrey" />

        {/* Enhanced Books Section */}
        <motion.section
          className="mb-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className="flex justify-between items-center mb-12"
            variants={staggerItem}
          >
            <h2 className="font-serif text-3xl md:text-4xl tracking-brand text-forest">
              Latest Books
            </h2>
            <Link
              href="/books"
              className="text-forest hover:text-midGreen font-semibold flex items-center gap-2 group transition-colors"
            >
              View All Books
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
          
          {hasData(books) ? (
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              variants={staggerContainer}
            >
              {books.map((book, idx) => (
                <motion.div key={`${book.slug}-${idx}`} variants={staggerItem}>
                  <BookCard {...book} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12 text-deepCharcoal/70"
              variants={staggerItem}
            >
              <p>New books coming soon. Stay tuned for exciting releases!</p>
            </motion.div>
          )}
        </motion.section>

        <hr className="my-16 border-lightGrey" />

        {/* Enhanced Posts Section */}
        <motion.section
          className="mb-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className="flex justify-between items-center mb-12"
            variants={staggerItem}
          >
            <h2 className="font-serif text-3xl md:text-4xl tracking-brand text-forest">
              Latest Insights
            </h2>
            <Link
              href="/blog"
              className="text-forest hover:text-midGreen font-semibold flex items-center gap-2 group transition-colors"
            >
              View All Posts
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
          
          {hasData(posts) ? (
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {posts.map((post, idx) => (
                <motion.div key={`${post.slug}-${idx}`} variants={staggerItem}>
                  <BlogPostCard {...post} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12 text-deepCharcoal/70"
              variants={staggerItem}
            >
              <p>New content coming soon. Check back for fresh insights and perspectives!</p>
            </motion.div>
          )}
        </motion.section>

        <hr className="my-16 border-lightGrey" />

        {/* Newsletter Signup */}
        <NewsletterSignup />
      </main>
    </Layout>
  );
}