// pages/books.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import { getAllBooks, BookMeta } from '../lib/books';
import { siteConfig } from '../lib/siteConfig';
=======
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import { getAllBooks, BookMeta } from '@/lib/books';
import { siteConfig } from '@/lib/siteConfig';
>>>>>>> d54087d627626892f4290f80053b938be47650b8

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

// Enhanced asset validation with multiple fallbacks
const ASSETS = {
  heroBanner: '/assets/images/books-hero-banner.webp',
  booksCollage: '/assets/images/books-collection.webp',
  profilePortrait: '/assets/images/profile-portrait.webp',
  ogImage: '/assets/images/social/books-og-image.jpg',
  twitterImage: '/assets/images/social/books-twitter.webp',
  defaultBookCover: '/assets/images/default-book.jpg',
  // Fallback chain for critical images
  fallbacks: {
    hero: ['/assets/images/books-hero-banner.webp', '/assets/images/books-collection.webp', '/assets/images/profile-portrait.webp'],
    collection: ['/assets/images/books-collection.webp', '/assets/images/profile-portrait.webp', '/assets/images/default-book.jpg'],
  }
} as const;

// ---------- Types ----------
type Book = Required<
  Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>
> & {
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  publishedDate?: string;
  isbn?: string;
  pages?: number;
  rating?: number;
  tags?: string[];
};

interface BooksProps {
  books: Book[];
  featuredBooks: Book[];
  categories: string[];
}

// Enhanced Animation Variants with Micro-interactions
const microAnimations = {
  // Book shelf effect
  bookShelf: {
    initial: { rotateX: -10, y: 20, opacity: 0 },
    animate: { 
      rotateX: 0, 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  },

  // Floating book effect
  floatingBook: {
    animate: { 
      y: [-5, 5, -5],
      rotateY: [-2, 2, -2],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Page turn effect
  pageTurn: {
    whileHover: {
      rotateY: [0, 5, -2, 0],
      scale: 1.05,
      transition: {
        rotateY: { duration: 0.8, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 300, damping: 20 }
      }
    }
  },

  // Shimmer effect for loading
  shimmer: {
    initial: { backgroundPosition: '200% 0' },
    animate: {
      backgroundPosition: ['-200% 0', '200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },

  // Category tag hover
  categoryTag: {
    whileHover: {
      scale: 1.1,
      rotateZ: [0, -1, 1, 0],
      transition: {
        rotateZ: { duration: 0.5, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 400, damping: 17 }
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
      staggerChildren: 0.1,
      delayChildren: 0.2
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

// Enhanced parallax animation
const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(smoothProgress, [0, 1], ['0%', '30%']);
  const yBackground = useTransform(smoothProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  
  return { yHero, yBackground, opacity };
};

// ---------- Enhanced Image Component ----------
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
        className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

// ---------- Filter Component ----------
const BookFilter: React.FC<{
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}> = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <motion.div
      className="flex flex-wrap gap-3 justify-center mb-12"
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
    >
      {['All', ...categories].map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category === 'All' ? '' : category)}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
            (category === 'All' && selectedCategory === '') || selectedCategory === category
              ? 'bg-forest text-cream shadow-lg scale-105'
              : 'bg-lightGrey/30 text-deepCharcoal hover:bg-lightGrey/50 hover:scale-105'
          }`}
          variants={microAnimations.categoryTag}
          whileHover="whileHover"
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`${category}-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {category}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      ))}
    </motion.div>
  );
};

// ---------- Data Fetching ----------
export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  try {
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
      'publishedDate',
      'isbn',
      'pages',
      'rating',
      'tags',
    ]);

    const books: Book[] = booksData
      .filter(b => b && b.slug)
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
        publishedDate: b.publishedDate || new Date().toISOString().split('T')[0],
        isbn: b.isbn || undefined,
        pages: b.pages || undefined,
        rating: b.rating || undefined,
        tags: Array.isArray(b.tags) ? b.tags : b.tags ? [b.tags] : [],
      }))
      .sort((a, b) => new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime());

    // Extract unique categories
    const categories = Array.from(new Set(books.map(book => book.genre).filter(Boolean)))
      .sort();

    // Featured books (latest 3)
    const featuredBooks = books.slice(0, 3);

    return {
      props: {
        books,
        featuredBooks,
        categories,
      },
      revalidate: 3600,
    };
  } catch (_error) {
    console.error('Error in getStaticProps:', _error);
    return {
      props: {
        books: [],
        featuredBooks: [],
        categories: [],
      },
      revalidate: 300,
    };
  }
};

// ---------- Scroll Progress Indicator ----------
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest to-midGreen origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// ---------- Page Component ----------
export default function BooksPage({ books, featuredBooks, categories }: BooksProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { yHero, yBackground, opacity } = useParallax();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter books based on category and search
  const filteredBooks = useMemo(() => {
    let filtered = books;
    
    if (selectedCategory) {
      filtered = filtered.filter(book => 
        book.genre.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchLower) ||
        book.excerpt.toLowerCase().includes(searchLower) ||
        book.genre.toLowerCase().includes(searchLower) ||
        book.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [books, selectedCategory, searchTerm]);

  // Comprehensive JSON-LD with enhanced SEO
  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
    const booksUrl = `${baseUrl}/books`;
    
    return [
      // Books Collection Page Schema
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${booksUrl}#webpage`,
        url: booksUrl,
        name: `${siteConfig.author} - Books Collection`,
        description: `Explore all books by ${siteConfig.author}, covering fatherhood, leadership, and personal development. Transform your life through powerful storytelling and practical wisdom.`,
        inLanguage: 'en-GB',
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.title,
          url: baseUrl,
        },
        about: {
          '@type': 'Person',
          name: siteConfig.author,
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: books.length,
          itemListElement: books.map((book, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Book',
              '@id': `${baseUrl}/books/${book.slug}#book`,
              name: book.title,
              author: {
                '@type': 'Person',
                name: book.author,
              },
              description: book.excerpt,
              url: `${baseUrl}/books/${book.slug}`,
              image: abs(book.coverImage),
              genre: book.genre,
              bookFormat: 'EBook',
              isbn: book.isbn,
              numberOfPages: book.pages,
              aggregateRating: book.rating ? {
                '@type': 'AggregateRating',
                ratingValue: book.rating,
                bestRating: 5,
                ratingCount: Math.floor(Math.random() * 100) + 50, // Placeholder
              } : undefined,
            },
          })),
        },
      },
      
      // Breadcrumb Schema
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Books',
            item: booksUrl,
          },
        ],
      },

      // FAQ Schema for Books
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How many books has ${siteConfig.author} written?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${siteConfig.author} has written ${books.length} books focusing on fatherhood, leadership, and personal development. Each book offers practical wisdom and authentic insights for modern fathers and leaders.`,
            },
          },
          {
            '@type': 'Question',
            name: 'What genres does Abraham write in?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Abraham writes primarily in ${categories.join(', ')}, with a focus on empowering men to become better fathers and leaders through authentic storytelling and practical guidance.`,
            },
          },
          {
            '@type': 'Question',
            name: 'Are the books available in digital format?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, many of Abraham\'s books are available in both PDF and EPUB formats for download, in addition to being available for purchase through various retailers.',
            },
          },
        ],
      },
    ];
  }, [books, categories]);

  const handleImageError = useCallback((src: string) => {
    setImageErrors(prev => new Set(prev).add(src));
  }, []);

  const getImageSrc = useCallback((src: string, fallback: string) => {
    return imageErrors.has(src) ? fallback : src;
  }, [imageErrors]);

  if (!mounted) {
    return <Layout><div className="min-h-screen" /></Layout>;
  }

  return (
    <Layout>
      <Head>
        {/* Enhanced primary meta tags */}
        <title>{`${siteConfig.author} - Books Collection | Fatherhood, Leadership & Personal Development`}</title>
        <meta 
          name="description" 
          content={`Explore ${books.length} transformative books by ${siteConfig.author}. Discover practical wisdom on fatherhood, leadership, and personal growth. Available in digital and print formats.`} 
        />
        <meta name="author" content={siteConfig.author} />
        <meta 
          name="keywords" 
          content={`Abraham Adaramola books, fatherhood books, leadership books, parenting guide, personal development, ${categories.join(', ')}, digital downloads, PDF books, EPUB books`} 
        />
        
        {/* Enhanced SEO meta tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/books`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:url" content={`${SITE_URL}/books`} />
        <meta property="og:title" content={`${siteConfig.author} - Books Collection | Transform Your Fatherhood Journey`} />
        <meta property="og:description" content={`Discover ${books.length} powerful books on fatherhood and leadership. Practical wisdom for modern fathers.`} />
        <meta property="og:image" content={abs(ASSETS.ogImage)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${siteConfig.author} Books Collection`} />
        <meta property="og:locale" content="en_GB" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AbrahamAda48634" />
        <meta name="twitter:creator" content="@AbrahamAda48634" />
        <meta name="twitter:title" content={`${siteConfig.author} - Books Collection`} />
        <meta name="twitter:description" content="Transform your fatherhood journey with practical wisdom and authentic insights." />
        <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />

        {/* Structured Data */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <ScrollProgress />

      {/* Enhanced Hero Section */}
      <motion.header
        className="bg-gradient-to-br from-forest to-midGreen text-cream relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="relative w-full h-80 sm:h-96 lg:h-[28rem]"
          style={{ y: yHero }}
        >
          <EnhancedImage
            src={ASSETS.heroBanner}
            fallbacks={ASSETS.fallbacks.hero}
            alt={`${siteConfig.author} Books Collection - Transform Your Fatherhood Journey`}
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
            quality={85}
            onError={() => handleImageError(ASSETS.heroBanner)}
          />

          {/* Floating book icons for visual interest */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-cream/10"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  fontSize: `${20 + (i % 3) * 10}px`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  rotate: [-10, 10, -10],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              >
                ðŸ“š
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center text-center px-4 z-10"
            style={{ opacity }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="max-w-4xl">
              <motion.h1 
                className="font-serif tracking-brand text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 text-cream drop-shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Books Collection
              </motion.h1>
              <motion.p 
                className="text-lg sm:text-xl lg:text-2xl text-cream/95 max-w-3xl mx-auto leading-relaxed mb-8 drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Discover {books.length} transformative books that will reshape your approach to 
                fatherhood, leadership, and personal growth
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-4 justify-center text-cream/90 text-sm font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                {categories.slice(0, 4).map((category, index) => (
                  <motion.span
                    key={category}
                    className="bg-cream/20 backdrop-blur-sm px-4 py-2 rounded-full"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {category}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.header>

      <main className="container px-4 py-12 max-w-6xl mx-auto">
        {/* Search and Filter Section */}
        <motion.section
          className="mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div
            className="max-w-2xl mx-auto mb-8"
            variants={staggerItem}
          >
            <motion.div
              className="text-deepCharcoal/70 font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${filteredBooks.length}-${searchTerm}-${selectedCategory}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-lightGrey/30 px-4 py-2 rounded-full"
                >
                  {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {hasData(filteredBooks) ? (
              <motion.div
                key="books-grid"
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {filteredBooks.map((book, idx) => (
                  <motion.div 
                    key={book.slug}
                    variants={staggerItem}
                    layout
                    layoutId={book.slug}
                    whileHover={{ 
                      y: -8, 
                      rotateY: idx % 2 === 0 ? 3 : -3,
                      rotateX: 2 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      layout: { duration: 0.6, ease: "easeInOut" }
                    }}
                    style={{ perspective: "1000px" }}
                  >
                    <div style={{ transformStyle: "preserve-3d" }}>
                      <BookCard {...book} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-books"
                className="text-center py-20 text-deepCharcoal/70"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="inline-block text-8xl mb-6"
                  animate={{ 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  ðŸ“š
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">No books found</h3>
                <p className="text-lg mb-6 max-w-md mx-auto">
                  {searchTerm || selectedCategory 
                    ? "Try adjusting your search terms or filters to discover more books."
                    : "New books are being added regularly. Check back soon for exciting new releases!"
                  }
                </p>
                {(searchTerm || selectedCategory) && (
                  <motion.button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                    }}
                    className="bg-forest text-cream px-6 py-3 rounded-full font-semibold hover:bg-midGreen transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear Filters
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          className="bg-gradient-to-r from-lightGrey/20 to-transparent rounded-3xl p-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <motion.div
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="text-4xl font-bold text-forest"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {books.length}
              </motion.div>
              <div className="text-deepCharcoal font-medium">Books Published</div>
            </motion.div>
            
            <motion.div
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="text-4xl font-bold text-forest"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {categories.length}
              </motion.div>
              <div className="text-deepCharcoal font-medium">Categories</div>
            </motion.div>
            
            <motion.div
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="text-4xl font-bold text-forest"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {books.filter(b => b.downloadPdf || b.downloadEpub).length}
              </motion.div>
              <div className="text-deepCharcoal font-medium">Digital Downloads</div>
            </motion.div>
          </div>
        </motion.section>

        {/* Call-to-Action Section */}
        <motion.section
          className="text-center py-16 px-8 bg-gradient-to-br from-forest to-midGreen text-cream rounded-3xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-24 h-24 border border-cream rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 50}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <motion.h2
              className="font-serif text-3xl md:text-4xl tracking-brand mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Start Your Transformation Today
            </motion.h2>
            <motion.p
              className="text-lg max-w-2xl mx-auto mb-8 leading-relaxed opacity-95"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Join thousands of fathers and leaders who have transformed their lives through these powerful books. 
              Your journey to better fatherhood and authentic leadership starts with a single page.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/contact"
                  className="bg-cream text-forest px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:bg-white transition-all duration-300 flex items-center gap-2 group"
                >
                  <span>Get Personal Guidance</span>
                  <motion.span
                    className="transform group-hover:translate-x-1 transition-transform"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    â†’
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/blog"
                  className="border-2 border-cream text-cream px-8 py-4 rounded-xl font-bold hover:bg-cream hover:text-forest transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm bg-white/10"
                >
                  Read Free Insights
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </Layout>
  );
}relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <input
                type="text"
                placeholder="Search books by title, topic, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pl-12 rounded-2xl border border-lightGrey focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-lg bg-white/80 backdrop-blur-sm"
              />
              <motion.div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-deepCharcoal/50"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ðŸ”
              </motion.div>
            </motion.div>
          </motion.div>

          <BookFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </motion.section>

        {/* Featured Books Section */}
        {hasData(featuredBooks) && (
          <>
            <motion.section
              className="mb-20"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.h2 
                className="font-serif text-3xl md:text-5xl tracking-brand text-forest mb-12 text-center relative"
                variants={staggerItem}
              >
                <span className="relative z-10">Featured Reads</span>
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-forest to-midGreen rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "8rem" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </motion.h2>
              
              <motion.div
                className="grid md:grid-cols-3 gap-8"
                variants={staggerContainer}
              >
                {featuredBooks.map((book, idx) => (
                  <motion.div 
                    key={`featured-${book.slug}`}
                    variants={microAnimations.bookShelf}
                    whileHover={{ y: -10, rotateY: 2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <BookCard {...book} featured />
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            <hr className="my-16 border-lightGrey" />
          </>
        )}

        {/* All Books Section */}
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
            <motion.h2 
              className="font-serif text-3xl md:text-5xl tracking-brand text-forest relative"
              variants={microAnimations.floatingBook}
              animate="animate"
            >
              <span className="relative z-10">
                {searchTerm || selectedCategory ? 'Search Results' : 'All Books'}
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-forest to-midGreen rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "6rem" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </motion.h2>
            
            <motion.div
              className="
