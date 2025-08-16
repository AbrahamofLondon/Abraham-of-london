import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import { getAllPosts, PostMeta } from "@/lib/posts";
import { getAllBooks, BookMeta } from "@/lib/books";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import EmailSignup from "@/components/EmailSignup";
import { generatedCover } from "@/lib/og";
import achievementsData from "@/data/achievements";

// Dynamic imports
const HeroSection = dynamic(() => import("@/components/homepage/HeroSection"), { ssr: true });
const AboutSection = dynamic(() => import("@/components/homepage/AboutSection"), { ssr: true });
const VenturesSection = dynamic(() => import("@/components/homepage/VenturesSection"), { ssr: true });
const ContentShowcase = dynamic(() => import("@/components/homepage/ContentShowcase"), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/homepage/TestimonialsSection"), { ssr: false });
const MilestonesTimeline = dynamic(() => import("@/components/homepage/MilestonesTimeline"), { ssr: false });
const EventsSection = dynamic(() => import("@/components/homepage/EventsSection"), { ssr: false });

// Constants
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const ASSETS = {
  heroBanner: "/assets/images/abraham-of-london-banner.webp",
  profilePortrait: "/assets/images/profile-portrait.webp",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  defaultBookCover: "/assets/images/default-book.jpg",
  defaultBlogCover: "/assets/images/blog/default-blog-cover.jpg",
  logo: "/assets/images/logo/abraham-of-london-logo.svg",
} as const;

// Types
export type Post = Required<
  Pick<
    PostMeta,
    "slug" | "title" | "date" | "excerpt" | "coverImage" | "author" | "readTime" | "category"
  >
>;

export type Book = Required<
  Pick<BookMeta, "slug" | "title" | "author" | "excerpt" | "coverImage" | "buyLink">
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

/**
 * Reusable section wrapper with animation and high contrast styling.
 * @param {Object} props - Component props
 * @param {string} [props.className] - Optional additional CSS classes
 * @param {React.ReactNode} props.children - Section content
 */
const SectionSurface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-deepCharcoal rounded-2xl shadow-xl shadow-black/10 ring-1 ring-black/10 ${className}`}
  >
    {children}
  </motion.section>
);

// Data Fetching
/**
 * Fetches static props for the homepage including posts, books, and achievements.
 * @returns {Promise<{ props: HomeProps, revalidate: number }>} Static props and revalidation time
 */
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
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
    ]);

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
        title: p.title || "Untitled Post",
        date: (p.date || (p as any).publishedAt || new Date().toISOString()) as string,
        excerpt: p.excerpt || "Discover insights and wisdom in this compelling read.",
        coverImage:
          typeof p.coverImage === "string" && p.coverImage.trim()
            ? absUrl(p.coverImage)
            : generatedCover(p.slug || `post-${i}`),
        author: p.author || siteConfig.author,
        readTime: p.readTime || "5 min read",
        category: p.category || "Insights",
      }));

    const booksData = getAllBooks([
      "slug",
      "title",
      "author",
      "excerpt",
      "coverImage",
      "buyLink",
      "genre",
      "downloadPdf",
      "downloadEpub",
    ]);

    const books: Book[] = booksData
      .filter((b) => b && b.slug)
      .slice(0, 4)
      .map((b, i) => ({
        slug: b.slug || `book-${i}`,
        title: b.title || "Untitled Book",
        author: b.author || siteConfig.author,
        excerpt: b.excerpt || "A compelling read that will transform your perspective.",
        coverImage:
          typeof b.coverImage === "string" && b.coverImage.trim()
            ? absUrl(b.coverImage)
            : absUrl(ASSETS.defaultBookCover),
        buyLink: b.buyLink || "#",
        genre: Array.isArray(b.genre)
          ? (b.genre as string[]).filter(Boolean).join(", ")
          : (b.genre as string) || "Personal Development",
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    const achievements = achievementsData;

    return { props: { posts, books, achievements }, revalidate: 3600 };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { posts: [], books: [], achievements: [] }, revalidate: 300 };
  }
};

// Page Component
export default function Home({ posts, books, achievements }: HomeProps) {
  const [communityCount] = useState(120_000); // Static initial value, CSS animation suggested

  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL;
    return [
      createWebsiteSchema(baseUrl),
      createOrganizationSchema(baseUrl),
      createPersonSchema(baseUrl),
      ...posts.map(createPostSchema),
      ...books.map(createBookSchema),
      createBreadcrumbSchema(baseUrl),
      createFaqSchema(),
    ];
  }, [posts, books]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} — Empowering Leaders in Fatherhood & Strategy</title>
        <meta
          name="description"
          content={`${siteConfig.description} Join a global movement of over 120,000 leaders transforming fatherhood and leadership.`}
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={SITE_URL} />

        {/* Social with static description */}
        <meta property="og:title" content={siteConfig.title} />
        <meta
          property="og:description"
          content={`${siteConfig.description} Join a global movement transforming fatherhood and leadership.`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={absUrl(ASSETS.ogImage)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta
          name="twitter:description"
          content={`${siteConfig.description} Join a global movement transforming fatherhood and leadership.`}
        />
        <meta name="twitter:image" content={absUrl(ASSETS.twitterImage)} />
        <meta name="theme-color" content="#0b2e1f" />
        <meta name="color-scheme" content="dark light" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-cream focus:text-forest focus:px-4 focus:py-2 focus:rounded-md focus:shadow-card"
      >
        Skip to content
      </a>

      <div className="relative min-h-screen bg-cream text-deepCharcoal">
        <section
          className="relative w-full min-h-[70vh] sm:min-h-[85vh] overflow-hidden"
          aria-labelledby="hero-title"
        >
          <div className="absolute inset-0 -z-10">
            <Image
              src={ASSETS.heroBanner || "/assets/images/default-banner.webp"} // Fallback for missing asset
              alt="Abraham of London — Empowering leadership and fatherhood"
              fill
              priority
              fetchPriority="high"
              quality={95}
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 text-white"
          >
            <HeroSection
              title={siteConfig.title}
              subtitle="Global Strategist, Author, and Visionary Leader"
              ctaText="Join the Movement"
              ctaLink="/join"
              communityCount={communityCount}
            />
          </motion.div>
        </section>

        <main id="main-content" className="relative space-y-16 pb-16">
          <SectionSurface>
            <AboutSection
              bio="I'm Abraham of London, a recognized strategist and author dedicated to redefining leadership and fatherhood. With decades of experience across industries, I empower millions to build legacies of impact."
              achievements={achievements}
              portraitSrc={ASSETS.profilePortrait || "/assets/images/default-portrait.webp"} // Fallback for missing asset
            />
          </SectionSurface>

          <SectionSurface>
            <VenturesSection />
          </SectionSurface>

          {hasPosts && (
            <SectionSurface>
              <ContentShowcase
                title="Thought Leadership"
                subtitle="Insights shaping the future of leadership."
                items={posts}
                type="post"
                link="/blog"
                linkText="Discover More Insights"
                linkAriaLabel="Explore the full blog collection"
              />
            </SectionSurface>
          )}

          {hasBooks && (
            <SectionSurface>
              <ContentShowcase
                title="Legacy Library"
                subtitle="Transformative works for global leaders."
                items={books}
                type="book"
                link="/books"
                linkText="Explore the Collection"
                linkAriaLabel="Explore the full book collection"
              />
            </SectionSurface>
          )}

          <SectionSurface className="bg-white/90">
            <TestimonialsSection />
          </SectionSurface>

          <SectionSurface className="bg-white/90">
            <MilestonesTimeline />
          </SectionSurface>

          <SectionSurface className="bg-white/90">
            <EventsSection />
          </SectionSurface>

          <section id="email-signup" aria-labelledby="email-signup-title" className="scroll-mt-24">
            <h2 id="email-signup-title" className="sr-only">Email signup</h2>
            <SectionSurface className="bg-white/95">
              <EmailSignup />
            </SectionSurface>
          </section>
        </main>

        <section className="py-16 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-full transition hover:bg-forest/90 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
            aria-label="Contact Abraham of London"
          >
            {"Let's Build Something Enduring"}
          </Link>
        </section>
      </div>
    </Layout>
  );
}

// Structured Data Helper Functions
const createWebsiteSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.title,
  alternateName: `${siteConfig.author} - Official Website`,
  description: siteConfig.description,
  url: baseUrl,
  inLanguage: "en-GB",
  copyrightYear: new Date().getFullYear(),
  author: { "@type": "Person", name: siteConfig.author, url: baseUrl },
  publisher: { "@type": "Person", name: siteConfig.author, url: baseUrl },
  potentialAction: [
    {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    {
      "@type": "SubscribeAction",
      target: `${baseUrl}/#email-signup`,
      object: { "@type": "Service", name: "Newsletter Subscription" },
    },
  ],
});

const createOrganizationSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}#organization`,
  name: siteConfig.title,
  url: baseUrl,
  logo: { "@type": "ImageObject", url: absUrl(ASSETS.logo), width: 512, height: 512 },
  image: { "@type": "ImageObject", url: ASSETS.profilePortrait, width: 400, height: 400 },
  sameAs: siteConfig.socialLinks.filter((l) => l.external && /^https?:\/\//i.test(l.href)).map((l) => l.href),
  address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
});

const createPersonSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.author,
  url: baseUrl,
  image: ASSETS.profilePortrait,
  jobTitle: "Author & Strategist",
  sameAs: siteConfig.socialLinks.filter((l) => l.external && /^https?:\/\//i.test(l.href)).map((l) => l.href),
  worksFor: { "@type": "Organization", name: siteConfig.title },
});

const createPostSchema = (post: Post) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  image: absUrl(post.coverImage),
  datePublished: post.date,
  dateModified: post.date,
  author: { "@type": "Person", name: post.author },
  publisher: { "@type": "Organization", name: siteConfig.title, logo: { "@type": "ImageObject", url: absUrl(ASSETS.logo) } },
  description: post.excerpt,
  mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(`/blog/${post.slug}`) },
});

const createBookSchema = (book: Book) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  name: book.title,
  author: { "@type": "Person", name: book.author },
  bookFormat: "https://schema.org/EBook",
  image: absUrl(book.coverImage),
  publisher: siteConfig.title,
  description: book.excerpt,
  inLanguage: "en-GB",
  url: absUrl(`/books/${book.slug}`),
  offers: { "@type": "Offer", url: book.buyLink },
});

const createBreadcrumbSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl }],
});

const createFaqSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is Abraham of London?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${siteConfig.author} is an author, strategist, and fatherhood advocate focused on family, leadership, and legacy.`,
      },
    },
    {
      "@type": "Question",
      name: "What books has Abraham written?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Books on fatherhood, leadership, and personal development to help men build durable legacies.`,
      },
    },
    {
      "@type": "Question",
      name: "How can I join the community?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Subscribe to the newsletter or contact us through the website to become part of our global movement.",
      },
    },
  ],
});