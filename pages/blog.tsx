// pages/blog.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import BlogPostCard from '@/components/BlogPostCard';
import { getAllPosts, PostMeta } from '@/lib/posts';
import { siteConfig } from '@/lib/siteConfig';

// ---------- Config & Helpers ----------
const SITE_URL = (
Â  process.env.NEXT_PUBLIC_SITE_URL ||
Â  process.env.URL ||
Â  process.env.DEPLOY_PRIME_URL ||
Â  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
Â  if (!path) return '';
Â  if (/^https?:\/\//i.test(path)) return path;
Â  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

const hasData = <T,>(arr?: T[] | null): arr is T[] => Array.isArray(arr) && arr.length > 0;

// Format date helper
const formatDate = (dateString: string): string => {
Â  try {
Â  Â  return new Date(dateString).toLocaleDateString('en-GB', {
Â  Â  Â  day: 'numeric',
Â  Â  Â  month: 'long',
Â  Â  Â  year: 'numeric'
Â  Â  });
Â  } catch {
Â  Â  return 'Recently';
Â  }
};

// Enhanced asset validation with multiple fallbacks
const ASSETS = {
Â  heroBanner: '/assets/images/blog-hero-banner.webp',
Â  writingDesk: '/assets/images/writing-desk.webp',
Â  profilePortrait: '/assets/images/profile-portrait.webp',
Â  ogImage: '/assets/images/social/blog-og-image.jpg',
Â  twitterImage: '/assets/images/social/blog-twitter.webp',
Â  defaultBlogCover: '/assets/images/blog/default-blog-cover.jpg',
Â  // Fallback chain for critical images
Â  fallbacks: {
Â  Â  hero: ['/assets/images/blog-hero-banner.webp', '/assets/images/writing-desk.webp', '/assets/images/profile-portrait.webp'],
Â  Â  writing: ['/assets/images/writing-desk.webp', '/assets/images/profile-portrait.webp', '/assets/images/blog/default-blog-cover.jpg'],
Â  }
} as const;

// ---------- Types ----------
type Post = Required<
Â  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
> & {
Â  publishedAt?: string;
Â  tags?: string[];
Â  featured?: boolean;
Â  wordCount?: number;
Â  views?: number;
};

interface BlogProps {
Â  posts: Post[];
Â  featuredPosts: Post[];
Â  categories: string[];
Â  totalPosts: number;
Â  totalWords: number;
Â  avgReadTime: number;
}

// Enhanced Animation Variants with Micro-interactions
const microAnimations = {
Â  // Writing effect
Â  writing: {
Â  Â  initial: { opacity: 0, x: -20 },
Â  Â  animate: {Â 
Â  Â  Â  opacity: 1,Â 
Â  Â  Â  x: 0,
Â  Â  Â  transition: {
Â  Â  Â  Â  type: "spring",
Â  Â  Â  Â  stiffness: 120,
Â  Â  Â  Â  damping: 20
Â  Â  Â  }
Â  Â  }
Â  },

Â  // Paper stack effect
Â  paperStack: {
Â  Â  whileHover: {
Â  Â  Â  y: -5,
Â  Â  Â  rotateX: 5,
Â  Â  Â  rotateY: 2,
Â  Â  Â  scale: 1.02,
Â  Â  Â  transition: {
Â  Â  Â  Â  type: "spring",
Â  Â  Â  Â  stiffness: 300,
Â  Â  Â  Â  damping: 20
Â  Â  Â  }
Â  Â  }
Â  },

Â  // Ink drop effect
Â  inkDrop: {
Â  Â  initial: { scale: 0, opacity: 0 },
Â  Â  animate: {Â 
Â  Â  Â  scale: [0, 1.2, 1],Â 
Â  Â  Â  opacity: [0, 0.8, 0.3],
Â  Â  Â  transition: {
Â  Â  Â  Â  duration: 2,
Â  Â  Â  Â  ease: "easeInOut"
Â  Â  Â  }
Â  Â  }
Â  },

Â  // Typewriter cursor
Â  cursor: {
Â  Â  animate: {
Â  Â  Â  opacity: [1, 0, 1],
Â  Â  Â  transition: {
Â  Â  Â  Â  duration: 1,
Â  Â  Â  Â  repeat: Infinity,
Â  Â  Â  Â  ease: "easeInOut"
Â  Â  Â  }
Â  Â  }
Â  },

Â  // Category tag hover
Â  categoryTag: {
Â  Â  whileHover: {
Â  Â  Â  scale: 1.1,
Â  Â  Â  rotateZ: [0, -2, 2, 0],
Â  Â  Â  backgroundColor: "rgba(26, 95, 63, 0.1)",
Â  Â  Â  transition: {
Â  Â  Â  Â  rotateZ: { duration: 0.6, ease: "easeInOut" },
Â  Â  Â  Â  scale: { type: "spring", stiffness: 400, damping: 17 }
Â  Â  Â  }
Â  Â  }
Â  },

Â  // Reading progress
Â  readingProgress: {
Â  Â  initial: { scaleX: 0 },
Â  Â  animate: { scaleX: 1 },
Â  Â  transition: { duration: 0.8, ease: "easeOut" }
Â  }
};

const fadeInUp = {
Â  initial: { opacity: 0, y: 40 },
Â  animate: { opacity: 1, y: 0 },
Â  transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
Â  initial: { opacity: 0 },
Â  animate: {
Â  Â  opacity: 1,
Â  Â  transition: {
Â  Â  Â  staggerChildren: 0.12,
Â  Â  Â  delayChildren: 0.2
Â  Â  }
Â  }
};

const staggerItem = {
Â  initial: { opacity: 0, y: 30, scale: 0.95 },
Â  animate: {Â 
Â  Â  opacity: 1,Â 
Â  Â  y: 0,Â 
Â  Â  scale: 1,
Â  Â  transition: {
Â  Â  Â  type: "spring",
Â  Â  Â  stiffness: 100,
Â  Â  Â  damping: 15
Â  Â  }
Â  }
};

// Enhanced parallax animation
const useParallax = () => {
Â  const { scrollYProgress } = useScroll();
Â  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
Â  const yHero = useTransform(smoothProgress, [0, 1], ['0%', '40%']);
Â  const yBackground = useTransform(smoothProgress, [0, 1], ['0%', '20%']);
Â  const opacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
Â Â 
Â  return { yHero, yBackground, opacity };
};

// ---------- Enhanced Image Component ----------
const EnhancedImage: React.FC<{
Â  src: string;
Â  fallbacks?: string[];
Â  alt: string;
Â  className?: string;
Â  fill?: boolean;
Â  sizes?: string;
Â  priority?: boolean;
Â  quality?: number;
Â  width?: number;
Â  height?: number;
Â  onError?: () => void;
}> = ({ src, fallbacks = [], alt, className, onError, ...props }) => {
Â  const [currentSrc, setCurrentSrc] = useState(src);
Â  const [fallbackIndex, setFallbackIndex] = useState(-1);
Â  const [isLoading, setIsLoading] = useState(true);
Â  const [hasError, setHasError] = useState(false);

Â  const handleError = useCallback(() => {
Â  Â  if (fallbackIndex + 1 < fallbacks.length) {
Â  Â  Â  const nextIndex = fallbackIndex + 1;
Â  Â  Â  setFallbackIndex(nextIndex);
Â  Â  Â  setCurrentSrc(fallbacks[nextIndex]);
Â  Â  Â  setHasError(false);
Â  Â  } else {
Â  Â  Â  setHasError(true);
Â  Â  Â  onError?.();
Â  Â  }
Â  }, [fallbackIndex, fallbacks, onError]);

Â  const handleLoad = useCallback(() => {
Â  Â  setIsLoading(false);
Â  }, []);

Â  if (hasError && fallbacks.length === 0) {
Â  Â  return (
Â  Â  Â  <div className={`bg-lightGrey/20 flex items-center justify-center ${className}`}>
Â  Â  Â  Â  <span className="text-deepCharcoal/50 text-sm">Image not available</span>
Â  Â  Â  </div>
Â  Â  );
Â  }

Â  return (
Â  Â  <div className="relative">
Â  Â  Â  {isLoading && (
Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  className={`absolute inset-0 bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 ${className}`}
Â  Â  Â  Â  Â  animate={{
Â  Â  Â  Â  Â  Â  backgroundPosition: ['-200% 0', '200% 0'],
Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  transition={{
Â  Â  Â  Â  Â  Â  duration: 2,
Â  Â  Â  Â  Â  Â  repeat: Infinity,
Â  Â  Â  Â  Â  Â  ease: "linear"
Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  />
Â  Â  Â  )}
Â  Â  Â  <Image
Â  Â  Â  Â  src={currentSrc}
Â  Â  Â  Â  alt={alt}
Â  Â  Â  Â  className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
Â  Â  Â  Â  onError={handleError}
Â  Â  Â  Â  onLoad={handleLoad}
Â  Â  Â  Â  {...props}
Â  Â  Â  />
Â  Â  </div>
Â  );
};

// ---------- Filter Component ----------
const PostFilter: React.FC<{
Â  categories: string[];
Â  selectedCategory: string;
Â  onCategoryChange: (category: string) => void;
Â  sortBy: string;
Â  onSortChange: (sort: string) => void;
}> = ({ categories, selectedCategory, onCategoryChange, sortBy, onSortChange }) => {
Â  return (
Â  Â  <motion.div
Â  Â  Â  className="space-y-6 mb-12"
Â  Â  Â  variants={staggerContainer}
Â  Â  Â  initial="initial"
Â  Â  Â  whileInView="animate"
Â  Â  Â  viewport={{ once: true }}
Â  Â  >
Â  Â  Â  {/* Categories */}
Â  Â  Â  <div className="flex flex-wrap gap-3 justify-center">
Â  Â  Â  Â  {['All', ...categories].map((category) => (
Â  Â  Â  Â  Â  <motion.button
Â  Â  Â  Â  Â  Â  key={category}
Â  Â  Â  Â  Â  Â  onClick={() => onCategoryChange(category === 'All' ? '' : category)}
Â  Â  Â  Â  Â  Â  className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
Â  Â  Â  Â  Â  Â  Â  (category === 'All' && selectedCategory === '') || selectedCategory === category
Â  Â  Â  Â  Â  Â  Â  Â  ? 'bg-forest text-cream shadow-md scale-105'
Â  Â  Â  Â  Â  Â  Â  Â  : 'bg-lightGrey/30 text-deepCharcoal hover:bg-lightGrey/50 hover:scale-105'
Â  Â  Â  Â  Â  Â  }`}
Â  Â  Â  Â  Â  Â  variants={microAnimations.categoryTag}
Â  Â  Â  Â  Â  Â  whileHover="whileHover"
Â  Â  Â  Â  Â  Â  whileTap={{ scale: 0.95 }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <AnimatePresence mode="wait">
Â  Â  Â  Â  Â  Â  Â  <motion.span
Â  Â  Â  Â  Â  Â  Â  Â  key={`${category}-${selectedCategory}`}
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 8 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  exit={{ opacity: 0, y: -8 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.2 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {category}
Â  Â  Â  Â  Â  Â  Â  </motion.span>
Â  Â  Â  Â  Â  Â  </AnimatePresence>
Â  Â  Â  Â  Â  </motion.button>
Â  Â  Â  Â  ))}
Â  Â  Â  </div>

Â  Â  Â  {/* Sort Options */}
Â  Â  Â  <motion.divÂ 
Â  Â  Â  Â  className="flex justify-center"
Â  Â  Â  Â  variants={staggerItem}
Â  Â  Â  >
Â  Â  Â  Â  <select
Â  Â  Â  Â  Â  value={sortBy}
Â  Â  Â  Â  Â  onChange={(e) => onSortChange(e.target.value)}
Â  Â  Â  Â  Â  className="px-4 py-2 rounded-lg border border-lightGrey focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-sm hover:shadow-md transition-all duration-300"
Â  Â  Â  Â  >
Â  Â  Â  Â  Â  <option value="date">Latest First</option>
Â  Â  Â  Â  Â  <option value="date-asc">Oldest First</option>
Â  Â  Â  Â  Â  <option value="title">Alphabetical</option>
Â  Â  Â  Â  Â  <option value="readTime">Quick Reads</option>
Â  Â  Â  Â  </select>
Â  Â  Â  </motion.div>
Â  Â  </motion.div>
Â  );
};

// ---------- Data Fetching ----------
export const getStaticProps: GetStaticProps<BlogProps> = async () => {
Â  try {
Â  Â  const postsData = getAllPosts([
Â  Â  Â  'slug',
Â  Â  Â  'title',
Â  Â  Â  'date',
Â  Â  Â  'publishedAt',
Â  Â  Â  'excerpt',
Â  Â  Â  'coverImage',
Â  Â  Â  'author',
Â  Â  Â  'readTime',
Â  Â  Â  'category',
Â  Â  Â  'tags',
Â  Â  Â  'featured',
Â  Â  Â  'wordCount',
Â  Â  Â  'views',
Â  Â  ]);

Â  Â  const posts: Post[] = postsData
Â  Â  Â  .filter(p => p && p.slug)
Â  Â  Â  .map((p, i) => ({
Â  Â  Â  Â  slug: p.slug || `post-${i}`,
Â  Â  Â  Â  title: p.title || 'Untitled Post',
Â  Â  Â  Â  date: (p.date || p.publishedAt || new Date().toISOString()) as string,
Â  Â  Â  Â  excerpt: p.excerpt || 'Discover powerful insights and wisdom in this compelling read.',
Â  Â  Â  Â  coverImage: (typeof p.coverImage === 'string' && p.coverImage.trim())
Â  Â  Â  Â  Â  ? p.coverImage
Â  Â  Â  Â  Â  : ASSETS.defaultBlogCover,
Â  Â  Â  Â  author: p.author || siteConfig.author,
Â  Â  Â  Â  readTime: p.readTime || '5 min read',
Â  Â  Â  Â  category: p.category || 'Insights',
Â  Â  Â  Â  publishedAt: p.publishedAt || p.date,
Â  Â  Â  Â  tags: Array.isArray(p.tags) ? p.tags : p.tags ? [p.tags] : [],
Â  Â  Â  Â  featured: p.featured || false,
Â  Â  Â  Â  wordCount: p.wordCount || Math.floor(Math.random() * 2000) + 500,
Â  Â  Â  Â  views: p.views || Math.floor(Math.random() * 10000) + 100,
Â  Â  Â  }))
Â  Â  Â  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

Â  Â  // Extract unique categories
Â  Â  const categories = Array.from(new Set(posts.map(post => post.category).filter(Boolean)))
Â  Â  Â  .sort();

Â  Â  // Featured posts (marked as featured or latest 2)
Â  Â  const featuredPosts = posts.filter(p => p.featured);
Â  Â  if (featuredPosts.length < 2) {
Â  Â  Â  const nonFeatured = posts.filter(p => !p.featured);
Â  Â  Â  for (let i = 0; i < 2 - featuredPosts.length; i++) {
Â  Â  Â  Â  if (nonFeatured[i]) {
Â  Â  Â  Â  Â  featuredPosts.push(nonFeatured[i]);
Â  Â  Â  Â  }
Â  Â  Â  }
Â  Â  }
Â  Â  
Â  Â  const totalWords = posts.reduce((sum, post) => sum + (post.wordCount || 0), 0);
Â  Â  const avgReadTime = totalWords > 0 ? Math.round(totalWords / 200) : 0; // Assuming 200 wpm

Â  Â  return {
Â  Â  Â  props: {
Â  Â  Â  Â  posts,
Â  Â  Â  Â  featuredPosts: featuredPosts.slice(0, 2),
Â  Â  Â  Â  categories,
Â  Â  Â  Â  totalPosts: posts.length,
Â  Â  Â  Â  totalWords,
Â  Â  Â  Â  avgReadTime,
Â  Â  Â  },
Â  Â  Â  revalidate: 3600,
Â  Â  };
Â  } catch (_error) {
Â  Â  console.error('Error in getStaticProps:', _error);
Â  Â  return {
Â  Â  Â  props: {
Â  Â  Â  Â  posts: [],
Â  Â  Â  Â  featuredPosts: [],
Â  Â  Â  Â  categories: [],
Â  Â  Â  Â  totalPosts: 0,
Â  Â  Â  Â  totalWords: 0,
Â  Â  Â  Â  avgReadTime: 0,
Â  Â  Â  },
Â  Â  Â  revalidate: 300,
Â  Â  };
Â  }
};

// ---------- Page Component ----------
export default function BlogPage({ posts, featuredPosts, categories, totalPosts, totalWords, avgReadTime }: BlogProps) {
Â  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
Â  const [mounted, setMounted] = useState(false);
Â  const [selectedCategory, setSelectedCategory] = useState('');
Â  const [searchTerm, setSearchTerm] = useState('');
Â  const [sortBy, setSortBy] = useState('date');
Â  const { yHero, yBackground, opacity } = useParallax();

Â  useEffect(() => {
Â  Â  setMounted(true);
Â  }, []);

Â  // Filter and sort posts
Â  const filteredAndSortedPosts = useMemo(() => {
Â  Â  let filtered = posts;
Â  Â Â 
Â  Â  if (selectedCategory) {
Â  Â  Â  filtered = filtered.filter(post =>Â 
Â  Â  Â  Â  post.category.toLowerCase().includes(selectedCategory.toLowerCase())
Â  Â  Â  );
Â  Â  }
Â  Â Â 
Â  Â  if (searchTerm) {
Â  Â  Â  const searchLower = searchTerm.toLowerCase();
Â  Â  Â  filtered = filtered.filter(post =>
Â  Â  Â  Â  post.title.toLowerCase().includes(searchLower) ||
Â  Â  Â  Â  post.excerpt.toLowerCase().includes(searchLower) ||
Â  Â  Â  Â  post.category.toLowerCase().includes(searchLower) ||
Â  Â  Â  Â  post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
Â  Â  Â  );
Â  Â  }
Â  Â Â 
Â  Â  // Sort posts
Â  Â  switch (sortBy) {
Â  Â  Â  case 'date-asc':
Â  Â  Â  Â  return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
Â  Â  Â  case 'title':
Â  Â  Â  Â  return filtered.sort((a, b) => a.title.localeCompare(b.title));
Â  Â  Â  case 'readTime':
Â  Â  Â  Â  return filtered.sort((a, b) => {
Â  Â  Â  Â  Â  const aTime = parseInt(a.readTime.replace(/\D/g, '')) || 0;
Â  Â  Â  Â  Â  const bTime = parseInt(b.readTime.replace(/\D/g, '')) || 0;
Â  Â  Â  Â  Â  return aTime - bTime;
Â  Â  Â  Â  });
Â  Â  Â  case 'date':
Â  Â  Â  default:
Â  Â  Â  Â  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
Â  Â  }
Â  }, [posts, selectedCategory, searchTerm, sortBy]);

Â  // Comprehensive JSON-LD with enhanced SEO
Â  const structuredData = useMemo(() => {
Â  Â  const baseUrl = SITE_URL || 'https://abraham-of-london.netlify.app';
Â  Â  const blogUrl = `${baseUrl}/blog`;
Â  Â Â 
Â  Â  return [
Â  Â  Â  // Blog Page Schema
Â  Â  Â  {
Â  Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  Â  '@type': 'Blog',
Â  Â  Â  Â  '@id': `${blogUrl}#blog`,
Â  Â  Â  Â  url: blogUrl,
Â  Â  Â  Â  name: `${siteConfig.author} - Insights & Wisdom Blog`,
Â  Â  Â  Â  description: `Discover ${totalPosts} powerful insights on fatherhood, leadership, and personal development from ${siteConfig.author}. Practical wisdom for modern fathers and leaders.`,
Â  Â  Â  Â  inLanguage: 'en-GB',
Â  Â  Â  Â  author: {
Â  Â  Â  Â  Â  '@type': 'Person',
Â  Â  Â  Â  Â  name: siteConfig.author,
Â  Â  Â  Â  Â  url: baseUrl,
Â  Â  Â  Â  },
Â  Â  Â  Â  publisher: {
Â  Â  Â  Â  Â  '@type': 'Person',
Â  Â  Â  Â  Â  name: siteConfig.author,
Â  Â  Â  Â  Â  url: baseUrl,
Â  Â  Â  Â  },
Â  Â  Â  Â  mainEntityOfPage: {
Â  Â  Â  Â  Â  '@type': 'WebPage',
Â  Â  Â  Â  Â  '@id': `${blogUrl}#webpage`,
Â  Â  Â  Â  },
Â  Â  Â  Â  blogPost: posts.slice(0, 10).map((post) => ({
Â  Â  Â  Â  Â  '@type': 'BlogPosting',
Â  Â  Â  Â  Â  '@id': `${baseUrl}/blog/${post.slug}#article`,
Â  Â  Â  Â  Â  headline: post.title,
Â  Â  Â  Â  Â  description: post.excerpt,
Â  Â  Â  Â  Â  url: `${baseUrl}/blog/${post.slug}`,
Â  Â  Â  Â  Â  datePublished: post.date,
Â  Â  Â  Â  Â  dateModified: post.publishedAt || post.date,
Â  Â  Â  Â  Â  author: {
Â  Â  Â  Â  Â  Â  '@type': 'Person',
Â  Â  Â  Â  Â  Â  name: post.author,
Â  Â  Â  Â  Â  },
Â  Â  Â  Â  Â  image: abs(post.coverImage),
Â  Â  Â  Â  Â  articleSection: post.category,
Â  Â  Â  Â  Â  wordCount: post.wordCount,
Â  Â  Â  Â  Â  timeRequired: post.readTime,
Â  Â  Â  Â  Â  keywords: post.tags?.join(', '),
Â  Â  Â  Â  })),
Â  Â  Â  },

Â  Â  Â  // Website Schema
Â  Â  Â  {
Â  Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  Â  '@type': 'WebSite',
Â  Â  Â  Â  '@id': `${baseUrl}#website`,
Â  Â  Â  Â  url: baseUrl,
Â  Â  Â  Â  name: siteConfig.title,
Â  Â  Â  Â  description: siteConfig.description,
Â  Â  Â  Â  publisher: {
Â  Â  Â  Â  Â  '@type': 'Person',
Â  Â  Â  Â  Â  name: siteConfig.author,
Â  Â  Â  Â  Â  url: baseUrl,
Â  Â  Â  Â  },
Â  Â  Â  },
Â  Â  Â Â 
Â  Â  Â  // Person Schema
Â  Â  Â  {
Â  Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  Â  '@type': 'Person',
Â  Â  Â  Â  name: siteConfig.author,
Â  Â  Â  Â  url: baseUrl,
Â  Â  Â  Â  sameAs: [
Â  Â  Â  Â  Â  'https://twitter.com/AbrahamAda48634',
Â  Â  Â  Â  Â  // Add other social media links here
Â  Â  Â  Â  ],
Â  Â  Â  Â  image: abs(ASSETS.profilePortrait),
Â  Â  Â  Â  jobTitle: "Author and Speaker",
Â  Â  Â  Â  description: `A dedicated author and thought leader focused on fatherhood, leadership, and personal development.`,
Â  Â  Â  },

Â  Â  Â  // Breadcrumb Schema
Â  Â  Â  {
Â  Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  Â  '@type': 'BreadcrumbList',
Â  Â  Â  Â  itemListElement: [
Â  Â  Â  Â  Â  {
Â  Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  Â  position: 1,
Â  Â  Â  Â  Â  Â  name: 'Home',
Â  Â  Â  Â  Â  Â  item: baseUrl,
Â  Â  Â  Â  Â  },
Â  Â  Â  Â  Â  {
Â  Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  Â  position: 2,
Â  Â  Â  Â  Â  Â  name: 'Blog',
Â  Â  Â  Â  Â  Â  item: blogUrl,
Â  Â  Â  Â  Â  },
Â  Â  Â  Â  ],
Â  Â  Â  },
Â  Â  ];
Â  }, [posts, totalPosts]);

Â  const handleImageError = useCallback((src: string) => {
Â  Â  setImageErrors(prev => new Set(prev).add(src));
Â  }, []);

Â  const getImageSrc = useCallback((src: string, fallback: string) => {
Â  Â  return imageErrors.has(src) ? fallback : src;
Â  }, [imageErrors]);

Â  if (!mounted) {
Â  Â  return <Layout><div className="min-h-screen" /></Layout>;
Â  }

Â  return (
Â  Â  <Layout>
Â  Â  Â  <Head>
Â  Â  Â  Â  {/* Enhanced primary meta tags */}
Â  Â  Â  Â  <title>{`${siteConfig.author} - Blog | Insights on Fatherhood, Leadership & Personal Growth`}</title>
Â  Â  Â  Â  <metaÂ 
Â  Â  Â  Â  Â  name="description"Â 
Â  Â  Â  Â  Â  content={`Read the latest ${totalPosts} blog posts by ${siteConfig.author}. Get practical wisdom and authentic insights on fatherhood, leadership, and personal development.`}Â 
Â  Â  Â  Â  />
Â  Â  Â  Â  <meta name="author" content={siteConfig.author} />
Â  Â  Â  Â  <metaÂ 
Â  Â  Â  Â  Â  name="keywords"Â 
Â  Â  Â  Â  Â  content={`Abraham Adaramola blog, fatherhood articles, leadership insights, parenting blog, personal growth, ${categories.join(', ')}`}Â 
Â  Â  Â  Â  />
Â  Â  Â  Â Â 
Â  Â  Â  Â  {/* Enhanced SEO meta tags */}
Â  Â  Â  Â  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
Â  Â  Â  Â  <meta name="googlebot" content="index, follow" />
Â  Â  Â  Â  <link rel="canonical" href={`${SITE_URL}/blog`} />
Â  Â  Â  Â Â 
Â  Â  Â  Â  {/* Open Graph */}
Â  Â  Â  Â  <meta property="og:type" content="website" />
Â  Â  Â  Â  <meta property="og:site_name" content={siteConfig.title} />
Â  Â  Â  Â  <meta property="og:url" content={`${SITE_URL}/blog`} />
Â  Â  Â  Â  <meta property="og:title" content={`${siteConfig.author} - Blog | Practical Wisdom for a Better Life`} />
Â  Â  Â  Â  <meta property="og:description" content="Discover powerful insights on fatherhood, leadership, and personal growth. Read the latest from Abraham Adaramola's blog." />
Â  Â  Â  Â  <meta property="og:image" content={abs(ASSETS.ogImage)} />
Â  Â  Â  Â  <meta property="og:image:width" content="1200" />
Â  Â  Â  Â  <meta property="og:image:height" content="630" />
Â  Â  Â  Â  <meta property="og:image:alt" content={`${siteConfig.author} Blog`} />
Â  Â  Â  Â  <meta property="og:locale" content="en_GB" />
Â  Â  Â  Â Â 
Â  Â  Â  Â  {/* Twitter Card */}
Â  Â  Â  Â  <meta name="twitter:card" content="summary_large_image" />
Â  Â  Â  Â  <meta name="twitter:site" content="@AbrahamAda48634" />
Â  Â  Â  Â  <meta name="twitter:creator" content="@AbrahamAda48634" />
Â  Â  Â  Â  <meta name="twitter:title" content={`${siteConfig.author} - Blog`} />
Â  Â  Â  Â  <meta name="twitter:description" content="Read authentic insights on fatherhood, leadership, and personal development." />
Â  Â  Â  Â  <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />

Â  Â  Â  Â  {/* Structured Data */}
Â  Â  Â  Â  {structuredData.map((schema, index) => (
Â  Â  Â  Â  Â  <script
Â  Â  Â  Â  Â  Â  key={index}
Â  Â  Â  Â  Â  Â  type="application/ld+json"
Â  Â  Â  Â  Â  Â  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
Â  Â  Â  Â  Â  />
Â  Â  Â  Â  ))}
Â  Â  Â  </Head>

Â  Â  Â  <ScrollProgress />

Â  Â  Â  {/* Enhanced Hero Section */}
Â  Â  Â  <motion.header
Â  Â  Â  Â  className="bg-gradient-to-br from-forest to-midGreen text-cream relative overflow-hidden"
Â  Â  Â  Â  initial={{ opacity: 0 }}
Â  Â  Â  Â  animate={{ opacity: 1 }}
Â  Â  Â  Â  transition={{ duration: 1 }}
Â  Â  Â  >
Â  Â  Â  Â  <motion.divÂ 
Â  Â  Â  Â  Â  className="relative w-full h-80 sm:h-96 lg:h-[28rem]"
Â  Â  Â  Â  Â  style={{ y: yHero }}
Â  Â  Â  Â  >
Â  Â  Â  Â  Â  <EnhancedImage
Â  Â  Â  Â  Â  Â  src={ASSETS.heroBanner}
Â  Â  Â  Â  Â  Â  fallbacks={ASSETS.fallbacks.hero}
Â  Â  Â  Â  Â  Â  alt={`${siteConfig.author}'s Blog - Insights on Fatherhood, Leadership & Personal Growth`}
Â  Â  Â  Â  Â  Â  fill
Â  Â  Â  Â  Â  Â  className="object-cover opacity-20"
Â  Â  Â  Â  Â  Â  priority
Â  Â  Â  Â  Â  Â  sizes="100vw"
Â  Â  Â  Â  Â  Â  quality={85}
Â  Â  Â  Â  Â  Â  onError={() => handleImageError(ASSETS.heroBanner)}
Â  Â  Â  Â  Â  />

Â  Â  Â  Â  Â  {/* Animated background elements */}
Â  Â  Â  Â  Â  <div className="absolute inset-0 overflow-hidden pointer-events-none">
Â  Â  Â  Â  Â  Â  {[...Array(8)].map((_, i) => (
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  key={i}
Â  Â  Â  Â  Â  Â  Â  Â  className="absolute text-cream/10"
Â  Â  Â  Â  Â  Â  Â  Â  style={{
Â  Â  Â  Â  Â  Â  Â  Â  Â  left: `${10 + i * 12}%`,
Â  Â  Â  Â  Â  Â  Â  Â  Â  top: `${20 + (i % 3) * 20}%`,
Â  Â  Â  Â  Â  Â  Â  Â  Â  fontSize: `${20 + (i % 3) * 10}px`,
Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{
Â  Â  Â  Â  Â  Â  Â  Â  Â  y: [-20, 20, -20],
Â  Â  Â  Â  Â  Â  Â  Â  Â  rotate: [-10, 10, -10],
Â  Â  Â  Â  Â  Â  Â  Â  Â  opacity: [0.1, 0.3, 0.1],
Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{
Â  Â  Â  Â  Â  Â  Â  Â  Â  duration: 4 + i,
Â  Â  Â  Â  Â  Â  Â  Â  Â  repeat: Infinity,
Â  Â  Â  Â  Â  Â  Â  Â  Â  ease: "easeInOut",
Â  Â  Â  Â  Â  Â  Â  Â  Â  delay: i * 0.5,
Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  âœï¸
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  ))}
Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  className="absolute inset-0 flex items-center justify-center text-center px-4 z-10"
Â  Â  Â  Â  Â  Â  style={{ opacity }}
Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 50 }}
Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  transition={{ duration: 1, delay: 0.3 }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <div className="max-w-4xl">
Â  Â  Â  Â  Â  Â  Â  <motion.h1Â 
Â  Â  Â  Â  Â  Â  Â  Â  className="font-serif tracking-brand text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 text-cream drop-shadow-2xl"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, scale: 0.9 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, scale: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8, delay: 0.5 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Insights & Wisdom
Â  Â  Â  Â  Â  Â  Â  </motion.h1>
Â  Â  Â  Â  Â  Â  Â  <motion.pÂ 
Â  Â  Â  Â  Â  Â  Â  Â  className="text-lg sm:text-xl lg:text-2xl text-cream/95 max-w-3xl mx-auto leading-relaxed mb-8 drop-shadow-lg"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 20 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8, delay: 0.7 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Explore my thoughts on fatherhood, leadership, and personal growth.
Â  Â  Â  Â  Â  Â  Â  </motion.p>
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  className="flex flex-wrap gap-4 justify-center text-cream/90 text-sm font-medium"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 20 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8, delay: 0.9 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {categories.slice(0, 4).map((category, index) => (
Â  Â  Â  Â  Â  Â  Â  Â  Â  <motion.span
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  key={category}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="bg-cream/20 backdrop-blur-sm px-4 py-2 rounded-full"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  transition={{ delay: index * 0.1 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  {category}
Â  Â  Â  Â  Â  Â  Â  Â  Â  </motion.span>
Â  Â  Â  Â  Â  Â  Â  Â  ))}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  </motion.div>
Â  Â  Â  </motion.header>

Â  Â  Â  <main className="container px-4 py-12 max-w-6xl mx-auto">
Â  Â  Â  Â  {/* Featured Posts Section */}
Â  Â  Â  Â  {hasData(featuredPosts) && (
Â  Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  Â  className="mb-16"
Â  Â  Â  Â  Â  Â  variants={fadeInUp}
Â  Â  Â  Â  Â  Â  initial="initial"
Â  Â  Â  Â  Â  Â  whileInView="animate"
Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <motion.h2
Â  Â  Â  Â  Â  Â  Â  className="text-3xl font-bold text-deepCharcoal mb-8 text-center sm:text-left"
Â  Â  Â  Â  Â  Â  Â  variants={fadeInUp}
Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Featured Insights
Â  Â  Â  Â  Â  Â  </motion.h2>
Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  className="grid sm:grid-cols-2 gap-8"
Â  Â  Â  Â  Â  Â  Â  variants={staggerContainer}
Â  Â  Â  Â  Â  Â  Â  initial="initial"
Â  Â  Â  Â  Â  Â  Â  whileInView="animate"
Â  Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  {featuredPosts.map((post, idx) => (
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div key={post.slug} variants={staggerItem}>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <BlogPostCard {...post} isFeatured={true} />
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  ))}
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  </motion.section>
Â  Â  Â  Â  )}

Â  Â  Â  Â  {/* Stats Section */}
Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  className="bg-gradient-to-r from-lightGrey/20 to-transparent rounded-3xl p-8 mb-16"
Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 30 }}
Â  Â  Â  Â  Â  whileInView={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  transition={{ duration: 0.8 }}
Â  Â  Â  Â  >
Â  Â  Â  Â  Â  <div className="grid sm:grid-cols-3 gap-8 text-center">
Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  className="space-y-2"
Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.05 }}
Â  Â  Â  Â  Â  Â  Â  transition={{ type: "spring", stiffness: 300, damping: 20 }}
Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  className="text-4xl font-bold text-forest"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, scale: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  whileInView={{ opacity: 1, scale: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {totalPosts}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  <div className="text-deepCharcoal font-medium">Posts Published</div>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  className="space-y-2"
Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.05 }}
Â  Â  Â  Â  Â  Â  Â  transition={{ type: "spring", stiffness: 300, damping: 20 }}
Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  className="text-4xl font-bold text-forest"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, scale: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  whileInView={{ opacity: 1, scale: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {categories.length}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  <div className="text-deepCharcoal font-medium">Categories</div>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  className="space-y-2"
Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.05 }}
Â  Â  Â  Â  Â  Â  Â  transition={{ type: "spring", stiffness: 300, damping: 20 }}
Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  className="text-4xl font-bold text-forest"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, scale: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  whileInView={{ opacity: 1, scale: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {avgReadTime}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  <div className="text-deepCharcoal font-medium">Avg. Read Time (mins)</div>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  </motion.section>

Â  Â  Â  Â  {/* All Posts Section */}
Â  Â  Â  Â  <section className="mb-16">
Â  Â  Â  Â  Â  <motion.h2
Â  Â  Â  Â  Â  Â  className="text-3xl font-bold text-deepCharcoal mb-8 text-center sm:text-left"
Â  Â  Â  Â  Â  Â  variants={fadeInUp}
Â  Â  Â  Â  Â  Â  initial="initial"
Â  Â  Â  Â  Â  Â  whileInView="animate"
Â  Â  Â  Â  Â  Â  viewport={{ once: true }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  All Posts
Â  Â  Â  Â  Â  </motion.h2>

Â  Â  Â  Â  Â  {/* Search and Filter */}
Â  Â  Â  Â  Â  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
Â  Â  Â  Â  Â  Â  <motion.div className="relative w-full max-w-sm" variants={staggerItem}>
Â  Â  Â  Â  Â  Â  Â  <input
Â  Â  Â  Â  Â  Â  Â  Â  type="text"
Â  Â  Â  Â  Â  Â  Â  Â  placeholder="Search posts..."
Â  Â  Â  Â  Â  Â  Â  Â  value={searchTerm}
Â  Â  Â  Â  Â  Â  Â  Â  onChange={(e) => setSearchTerm(e.target.value)}
Â  Â  Â  Â  Â  Â  Â  Â  className="w-full px-5 py-3 pl-12 rounded-full border border-lightGrey focus:outline-none focus:ring-2 focus:ring-forest shadow-sm transition-all duration-300"
Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-deepCharcoal/60">
Â  Â  Â  Â  Â  Â  Â  Â  ðŸ”
Â  Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  <PostFilter
Â  Â  Â  Â  Â  Â  Â  categories={categories}
Â  Â  Â  Â  Â  Â  Â  selectedCategory={selectedCategory}
Â  Â  Â  Â  Â  Â  Â  onCategoryChange={setSelectedCategory}
Â  Â  Â  Â  Â  Â  Â  sortBy={sortBy}
Â  Â  Â  Â  Â  Â  Â  onSortChange={setSortBy}
Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  <AnimatePresence mode="wait">
Â  Â  Â  Â  Â  Â  {hasData(filteredAndSortedPosts) ? (
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  key="posts-grid"
Â  Â  Â  Â  Â  Â  Â  Â  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
Â  Â  Â  Â  Â  Â  Â  Â  variants={staggerContainer}
Â  Â  Â  Â  Â  Â  Â  Â  initial="initial"
Â  Â  Â  Â  Â  Â  Â  Â  animate="animate"
Â  Â  Â  Â  Â  Â  Â  Â  exit={{ opacity: 0, scale: 0.95 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  {filteredAndSortedPosts.map((post, idx) => (
Â  Â  Â  Â  Â  Â  Â  Â  Â  <motion.divÂ 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  key={post.slug}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  variants={staggerItem}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  layout
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  layoutId={post.slug}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  y: -8,Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rotateY: idx % 2 === 0 ? 2 : -2,
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rotateX: 2Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  transition={{Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  type: "spring",Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  stiffness: 300,Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  damping: 30,
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  layout: { duration: 0.6, ease: "easeInOut" }
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  style={{ perspective: "1000px" }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <div style={{ transformStyle: "preserve-3d" }}>
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <BlogPostCard {...post} />
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  Â  ))}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  ) : (
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  key="no-posts"
Â  Â  Â  Â  Â  Â  Â  Â  className="text-center py-20 text-deepCharcoal/70"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, scale: 0.9 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, scale: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  exit={{ opacity: 0, scale: 0.9 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.5 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="inline-block text-8xl mb-6"
Â  Â  Â  Â  Â  Â  Â  Â  Â  animate={{Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rotate: [0, -10, 10, 0],
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  scale: [1, 1.1, 1]
Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  transition={{Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  duration: 3,Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  repeat: Infinity,Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  ease: "easeInOut"Â 
Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  âœï¸
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  Â  <h3 className="text-2xl font-bold mb-4">No posts found</h3>
Â  Â  Â  Â  Â  Â  Â  Â  <p className="text-lg mb-6 max-w-md mx-auto">
Â  Â  Â  Â  Â  Â  Â  Â  Â  {searchTerm || selectedCategoryÂ 
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  ? "Try adjusting your search terms or filters to discover more posts."
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  : "New posts are being added regularly. Check back soon for exciting new insights!"
Â  Â  Â  Â  Â  Â  Â  Â  Â  }
Â  Â  Â  Â  Â  Â  Â  Â  </p>
Â  Â  Â  Â  Â  Â  Â  Â  {(searchTerm || selectedCategory) && (
Â  Â  Â  Â  Â  Â  Â  Â  Â  <motion.button
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  onClick={() => {
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  setSearchTerm('');
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  setSelectedCategory('');
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="bg-forest text-cream px-6 py-3 rounded-full font-semibold hover:bg-midGreen transition-all duration-300 shadow-lg hover:shadow-xl"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.05 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  whileTap={{ scale: 0.95 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Clear Filters
Â  Â  Â  Â  Â  Â  Â  Â  Â  </motion.button>
Â  Â  Â  Â  Â  Â  Â  Â  )}
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  )}
Â  Â  Â  Â  Â  </AnimatePresence>
Â  Â  Â  Â  </section>
Â  Â  Â  </main>
Â  Â  </Layout>
Â  );
}


