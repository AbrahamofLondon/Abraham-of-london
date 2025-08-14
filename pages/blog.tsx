// pages/blog.tsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticProps } from "next";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  type Variants,
} from "framer-motion";

import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { siteConfig } from "@/lib/siteConfig";
import ScrollProgress from "@/components/ScrollProgress";

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const abs = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
};

const hasData = <T,>(arr?: T[] | null): arr is T[] =>
  Array.isArray(arr) && arr.length > 0;

// Assets known to exist locally (adjust if needed)
const ASSETS = {
  heroBanner: "/assets/images/abraham-of-london-banner.webp",
  writingDesk: "/assets/images/writing-desk.webp",
  profilePortrait: "/assets/images/profile-portrait.webp",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  defaultBlogCover: "/assets/images/blog/default-blog-cover.jpg",
  fallbacks: {
    hero: [
      "/assets/images/abraham-of-london-banner.webp",
      "/assets/images/writing-desk.webp",
      "/assets/images/profile-portrait.webp",
    ] as const,
    writing: [
      "/assets/images/writing-desk.webp",
      "/assets/images/profile-portrait.webp",
      "/assets/images/blog/default-blog-cover.jpg",
    ] as const,
  },
} as const;

// ---------- Types ----------
type Post = Required<
  Pick<
    PostMeta,
    | "slug"
    | "title"
    | "date"
    | "excerpt"
    | "coverImage"
    | "author"
    | "readTime"
    | "category"
  >
> & {
  publishedAt?: string;
  tags?: string[];
  featured?: boolean;
  wordCount?: number;
  views?: number;
};

interface BlogProps {
  posts: Post[];
  featuredPosts: Post[];
  categories: string[];
  totalPosts: number;
  totalWords: number;
  avgReadTime: number;
}

// ---------- Animations ----------
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const staggerItem: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(smooth, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(smooth, [0, 0.3], [1, 0]);
  return { yHero, opacity };
};

// ---------- Enhanced Image with fallbacks ----------
const EnhancedImage: React.FC<{
  src: string;
  fallbacks?: ReadonlyArray<string>;
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
  const [i, setI] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    if (i + 1 < fallbacks.length) {
      const next = i + 1;
      setI(next);
      setCurrentSrc(fallbacks[next]);
      setFailed(false);
    } else {
      setFailed(true);
      onError?.();
    }
  }, [i, fallbacks, onError]);

  return failed && fallbacks.length === 0 ? (
    <div
      className={`bg-lightGrey/20 flex items-center justify-center ${className}`}
    >
      <span className="text-deepCharcoal/50 text-sm">Image not available</span>
    </div>
  ) : (
    <div className="relative">
      {loading && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 ${className}`}
          animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"} ${className}`}
        onError={handleError}
        onLoad={() => setLoading(false)}
        {...props}
      />
    </div>
  );
};

// ---------- Filter ----------
const PostFilter: React.FC<{
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}) => (
  <motion.div
    className="space-y-6 mb-12"
    variants={staggerContainer}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
  >
    <div className="flex flex-wrap gap-3 justify-center">
      {["All", ...categories].map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category === "All" ? "" : category)}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
            (category === "All" && selectedCategory === "") ||
            selectedCategory === category
              ? "bg-forest text-cream shadow-md scale-105"
              : "bg-lightGrey/30 text-deepCharcoal hover:bg-lightGrey/50 hover:scale-105"
          }`}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(26,95,63,.1)" }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`${category}-${selectedCategory}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {category}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      ))}
    </div>

    <motion.div className="flex justify-center" variants={staggerItem}>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-lightGrey focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-sm hover:shadow-md transition-all duration-300"
      >
        <option value="date">Latest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="title">Alphabetical</option>
        <option value="readTime">Quick Reads</option>
      </select>
    </motion.div>
  </motion.div>
);

// ---------- Data ----------
export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  try {
    const postsData = getAllPosts([
      "slug",
      "title",
      "date",
      "publishedAt",
      "excerpt",
      "coverImage",
      "author",
      "readTime",
      "category",
      "tags",
      "featured",
      "wordCount",
      "views",
    ]);

    const posts: Post[] = postsData
      .filter((p) => p && p.slug)
      .map((p, i) => ({
        slug: p.slug || `post-${i}`,
        title: p.title || "Untitled Post",
        date: (p.date || p.publishedAt || new Date().toISOString()) as string,
        excerpt:
          p.excerpt ||
          "Discover powerful insights and wisdom in this compelling read.",
        coverImage:
          typeof p.coverImage === "string" && p.coverImage.trim()
            ? p.coverImage
            : ASSETS.defaultBlogCover,
        author: p.author || siteConfig.author,
        readTime: p.readTime || "5 min read",
        category: p.category || "Insights",
        publishedAt: p.publishedAt || p.date,
        tags: Array.isArray(p.tags) ? p.tags : p.tags ? [p.tags] : [],
        featured: p.featured || false,
        wordCount: p.wordCount || Math.floor(Math.random() * 2000) + 500,
        views: p.views || Math.floor(Math.random() * 10000) + 100,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const categories = Array.from(
      new Set(posts.map((post) => post.category).filter(Boolean)),
    ).sort();

    const featuredPosts = posts.filter((p) => p.featured);
    if (featuredPosts.length < 2) {
      const nonFeatured = posts.filter((p) => !p.featured);
      for (let i = 0; i < 2 - featuredPosts.length; i++) {
        if (nonFeatured[i]) featuredPosts.push(nonFeatured[i]);
      }
    }

    const totalWords = posts.reduce(
      (sum, post) => sum + (post.wordCount || 0),
      0,
    );
    const avgReadTime = totalWords > 0 ? Math.round(totalWords / 200) : 0;

    return {
      props: {
        posts,
        featuredPosts: featuredPosts.slice(0, 2),
        categories,
        totalPosts: posts.length,
        totalWords,
        avgReadTime,
      },
      revalidate: 3600,
    };
  } catch (_error) {
    console.error("Error in getStaticProps:", _error);
    return {
      props: {
        posts: [],
        featuredPosts: [],
        categories: [],
        totalPosts: 0,
        totalWords: 0,
        avgReadTime: 0,
      },
      revalidate: 300,
    };
  }
};

// ---------- Page ----------
export default function BlogPage({
  posts,
  featuredPosts,
  categories,
  totalPosts,
  totalWords,
  avgReadTime,
}: BlogProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const { yHero, opacity } = useParallax();

  useEffect(() => setMounted(true), []);

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    if (selectedCategory) {
      filtered = filtered.filter((post) =>
        post.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          post.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    switch (sortBy) {
      case "date-asc":
        return [...filtered].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      case "title":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case "readTime":
        return [...filtered].sort((a, b) => {
          const aT = parseInt(a.readTime.replace(/\D/g, ""), 10) || 0;
          const bT = parseInt(b.readTime.replace(/\D/g, ""), 10) || 0;
          return aT - bT;
        });
      case "date":
      default:
        return [...filtered].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }
  }, [posts, selectedCategory, searchTerm, sortBy]);

  // IMPORTANT: hooks (like this useMemo) must be before any early return
  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL;
    const blogUrl = `${baseUrl}/blog`;

    return [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        url: blogUrl,
        name: `${siteConfig.author} - Insights & Wisdom Blog`,
        description: `Discover ${totalPosts} powerful insights on fatherhood, leadership, and personal development from ${siteConfig.author}.`,
        inLanguage: "en-GB",
        author: { "@type": "Person", name: siteConfig.author, url: baseUrl },
        publisher: { "@type": "Person", name: siteConfig.author, url: baseUrl },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${blogUrl}#webpage` },
        blogPost: posts.slice(0, 10).map((post) => ({
          "@type": "BlogPosting",
          "@id": `${baseUrl}/blog/${post.slug}#article`,
          headline: post.title,
          description: post.excerpt,
          url: `${baseUrl}/blog/${post.slug}`,
          datePublished: post.date,
          dateModified: post.publishedAt || post.date,
          author: { "@type": "Person", name: post.author },
          image: abs(post.coverImage),
          articleSection: post.category,
          wordCount: post.wordCount,
          timeRequired: post.readTime,
          keywords: post.tags?.join(", "),
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: blogUrl },
        ],
      },
    ];
  }, [posts, totalPosts]);

  if (!mounted) {
    // lightweight skeleton to avoid layout shift
    return (
      <Layout>
        <Head>
          <title>{`${siteConfig.author} - Blog`}</title>
          <meta name="robots" content="noindex,follow" />
        </Head>
        <div className="min-h-screen" />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{`${siteConfig.author} - Blog | Insights on Fatherhood, Leadership & Personal Growth`}</title>
        <meta
          name="description"
          content={`Read the latest ${totalPosts} blog posts by ${siteConfig.author}. Practical wisdom on fatherhood, leadership, and personal development.`}
        />
        <meta name="author" content={siteConfig.author} />
        <meta
          name="keywords"
          content={`Abraham Adaramola blog, fatherhood articles, leadership insights, personal growth, ${categories.join(", ")}`}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/blog`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta
          property="og:title"
          content={`${siteConfig.author} - Blog | Practical Wisdom for a Better Life`}
        />
        <meta
          property="og:description"
          content="Discover powerful insights on fatherhood, leadership, and personal growth."
        />
        <meta property="og:image" content={abs(ASSETS.ogImage)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_GB" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AbrahamAda48634" />
        <meta name="twitter:creator" content="@AbrahamAda48634" />
        <meta name="twitter:title" content={`${siteConfig.author} - Blog`} />
        <meta
          name="twitter:description"
          content="Authentic insights on fatherhood, leadership, and personal development."
        />
        <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />

        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <ScrollProgress />

      {/* HERO */}
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
            fallbacks={[...ASSETS.fallbacks.hero]}
            alt={`${siteConfig.author}'s Blog - Insights on Fatherhood, Leadership & Personal Growth`}
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
            quality={85}
          />

          {/* gentle animated dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-cream/10 select-none"
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
                aria-hidden="true"
              >
                ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
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
                Insights & Wisdom
              </motion.h1>
              <motion.p
                className="text-lg sm:text-xl lg:text-2xl text-cream/95 max-w-3xl mx-auto leading-relaxed mb-8 drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Explore my thoughts on fatherhood, leadership, and personal
                growth.
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-4 justify-center text-cream/90 text-sm font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                {categories.slice(0, 4).map((category, idx) => (
                  <motion.span
                    key={category}
                    className="bg-cream/20 backdrop-blur-sm px-4 py-2 rounded-full"
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(255,255,255,0.3)",
                    }}
                    transition={{ delay: idx * 0.1 }}
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
        {/* Featured */}
        {hasData(featuredPosts) && (
          <motion.section
            className="mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl font-bold text-deepCharcoal mb-8 text-center sm:text-left"
              variants={fadeInUp}
            >
              Featured Insights
            </motion.h2>
            <motion.div
              className="grid sm:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {featuredPosts.map((post) => (
                <motion.div key={post.slug} variants={staggerItem}>
                  <BlogPostCard {...post} isFeatured />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Stats */}
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
                {totalPosts}
              </motion.div>
              <div className="text-deepCharcoal font-medium">
                Posts Published
              </div>
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
                {avgReadTime}
              </motion.div>
              <div className="text-deepCharcoal font-medium">
                Avg. Read Time (mins)
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* All Posts */}
        <section className="mb-16">
          <motion.h2
            className="text-3xl font-bold text-deepCharcoal mb-8 text-center sm:text-left"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            All Posts
          </motion.h2>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <motion.div
              className="relative w-full max-w-sm"
              variants={staggerItem}
            >
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 pl-12 rounded-full border border-lightGrey focus:outline-none focus:ring-2 focus:ring-forest shadow-sm transition-all duration-300"
              />
              <div
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-deepCharcoal/60"
                aria-hidden="true"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="opacity-70"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="16.65"
                    y1="16.65"
                    x2="21"
                    y2="21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </motion.div>

            <PostFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
          >
            {hasData(filteredAndSortedPosts) ? (
              filteredAndSortedPosts.map((post) => (
                <motion.div key={post.slug} variants={staggerItem}>
                  <BlogPostCard {...post} />
                </motion.div>
              ))
            ) : (
              <motion.div
                className="col-span-full text-center text-deepCharcoal/60 py-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xl font-medium">No posts found.</p>
                <p className="text-md mt-2">
                  Try adjusting your filters or search terms.
                </p>
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>
    </Layout>
  );
}





