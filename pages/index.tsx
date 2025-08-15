// pages/index.tsx
import React, { useMemo, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { motion, useScroll, useSpring } from "framer-motion";

import Layout from "@/components/Layout";
import { getAllPosts, PostMeta } from "@/lib/posts";
import { getAllBooks, BookMeta } from "@/lib/books";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import EmailSignup from "@/components/EmailSignup";

// Above-the-fold SSR sections
const HeroSection = dynamic(() => import("@/components/homepage/HeroSection"), {
  ssr: true,
});
const AboutSection = dynamic(
  () => import("@/components/homepage/AboutSection"),
  { ssr: true },
);
const VenturesSection = dynamic(
  () => import("@/components/homepage/VenturesSection"),
  { ssr: true },
);
const ContentShowcase = dynamic(
  () => import("@/components/homepage/ContentShowcase"),
  { ssr: true },
);

// Animation-heavy sections (defer to client)
const TestimonialsSection = dynamic(
  () => import("@/components/homepage/TestimonialsSection"),
  { ssr: false },
);
const MilestonesTimeline = dynamic(
  () => import("@/components/homepage/MilestonesTimeline"),
  { ssr: false },
);
const EventsSection = dynamic(
  () => import("@/components/homepage/EventsSection"),
  { ssr: false },
);

// ---------- Constants ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const ASSETS = {
  profilePortrait: "/assets/images/profile-portrait.webp",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  defaultBookCover: "/assets/images/default-book.jpg",
  defaultBlogCover: "/assets/images/blog/default-blog-cover.jpg",
  logo: "/assets/images/logo/abraham-of-london-logo.svg",
} as const;

// ---------- Types ----------
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

// ---------- Small shared “Surface” wrapper for high contrast ----------
const SectionSurface: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className = "", children }) => (
  <section
    className={`mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-10 sm:py-12 bg-white text-deepCharcoal rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-black/5 ${className}`}
  >
    {children}
  </section>
);

// ---------- Scroll progress ----------
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
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
            ? p.coverImage
            : ASSETS.defaultBlogCover,
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
            ? b.coverImage
            : ASSETS.defaultBookCover,
        buyLink: b.buyLink || "#",
        genre: Array.isArray(b.genre)
          ? (b.genre as string[]).filter(Boolean).join(", ")
          : (b.genre as string) || "Personal Development",
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    const achievements: Achievement[] = [
      { title: "Self-advocate & Thought Leader", description: "Legal matters & civic engagement", year: 2010 },
      { title: "Global Leadership Award", description: "Recognized for innovative leadership", year: 2027 },
      { title: "Best-Selling Author", description: "Wide international readership", year: 2026 },
      { title: "Featured", description: "Lonely Heroes initiative", year: 2025 },
    ];

    return { props: { posts, books, achievements }, revalidate: 3600 };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { posts: [], books: [], achievements: [] }, revalidate: 300 };
  }
};

// ---------- Page ----------
export default function Home({ posts, books, achievements }: HomeProps) {
  const [communityCount, setCommunityCount] = useState(0);

  useEffect(() => {
    setCommunityCount(120_000);
    const id = setInterval(() => {
      setCommunityCount((prev) => Math.min(prev + Math.floor(Math.random() * 9) + 1, 150_000));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const sameAsLinks = useMemo(
    () =>
      siteConfig.socialLinks
        .filter((l) => l.external && /^https?:\/\//i.test(l.href))
        .map((l) => l.href),
    [],
  );

  const structuredData = useMemo(() => {
    const baseUrl = SITE_URL;
    const currentYear = new Date().getFullYear();

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.title,
      alternateName: `${siteConfig.author} - Official Website`,
      description: siteConfig.description,
      url: baseUrl,
      inLanguage: "en-GB",
      copyrightYear: currentYear,
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
          target: `${baseUrl}/#email-signup`, // updated anchor
          object: { "@type": "Service", name: "Newsletter Subscription" },
        },
      ],
    };

    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: siteConfig.title,
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: absUrl(ASSETS.logo),
        width: 512,
        height: 512,
      },
      image: {
        "@type": "ImageObject",
        url: ASSETS.profilePortrait,
        width: 400,
        height: 400,
      },
      sameAs: sameAsLinks,
      address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
    };

    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: siteConfig.author,
      url: baseUrl,
      image: ASSETS.profilePortrait,
      jobTitle: "Author & Strategist",
      sameAs: sameAsLinks,
      worksFor: { "@type": "Organization", name: siteConfig.title },
    };

    const postSchemas = posts.map((p) => ({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      image: absUrl(p.coverImage),
      datePublished: p.date,
      dateModified: p.date,
      author: { "@type": "Person", name: p.author },
      publisher: {
        "@type": "Organization",
        name: siteConfig.title,
        logo: { "@type": "ImageObject", url: absUrl(ASSETS.logo) },
      },
      description: p.excerpt,
      mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(`/blog/${p.slug}`) },
    }));

    const bookSchemas = books.map((b) => ({
      "@context": "https://schema.org",
      "@type": "Book",
      name: b.title,
      author: { "@type": "Person", name: b.author },
      bookFormat: "https://schema.org/EBook",
      image: absUrl(b.coverImage),
      publisher: siteConfig.title,
      description: b.excerpt,
      inLanguage: "en-GB",
      url: absUrl(`/books/${b.slug}`),
      offers: { "@type": "Offer", url: b.buyLink },
    }));

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl }],
    };

    const faq = {
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
      ],
    };

    return [website, org, person, ...postSchemas, ...bookSchemas, breadcrumb, faq];
  }, [books, posts, sameAsLinks]);

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} — Empowering Leaders in Fatherhood & Strategy</title>
        <meta
          name="description"
          content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders transforming fatherhood and leadership.`}
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={SITE_URL} />

        {/* Social */}
        <meta property="og:title" content={siteConfig.title} />
        <meta
          property="og:description"
          content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`}
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
          content={`${siteConfig.description} Join a global movement of over ${communityCount.toLocaleString()} leaders.`}
        />
        <meta name="twitter:image" content={absUrl(ASSETS.twitterImage)} />
        <meta name="theme-color" content="#0b2e1f" />
        <meta name="color-scheme" content="dark light" />

        {/* JSON-LD */}
        {structuredData.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
        ))}
      </Head>

      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] bg-cream text-forest px-4 py-2 rounded-md shadow-card"
      >
        Skip to content
      </a>

      <ScrollProgress />

      {/* Page background switched to cream for legibility */}
      <div className="relative min-h-screen bg-cream text-deepCharcoal">
        {/* HERO (self-contained) */}
        <section>
          <HeroSection
            title={siteConfig.title}
            subtitle="Global Strategist, Author, and Visionary Leader"
            ctaText="Join the Movement"
            ctaLink="/join"
            communityCount={communityCount}
          />
        </section>

        {/* Main content landmark */}
        <main id="main-content" className="relative space-y-12 sm:space-y-16 pb-12">
          {/* ABOUT — high-contrast surface */}
          <SectionSurface>
            <AboutSection
              bio="I'm Abraham of London, a recognized strategist and author dedicated to redefining leadership and fatherhood. With decades of experience across industries, I empower millions to build legacies of impact."
              achievements={achievements}
              portraitSrc={ASSETS.profilePortrait}
            />
          </SectionSurface>

          {/* VENTURES */}
          <SectionSurface>
            <VenturesSection />
          </SectionSurface>

          {/* POSTS & BOOKS */}
          {hasPosts && (
            <SectionSurface>
              <ContentShowcase
                title="Thought Leadership"
                subtitle="Insights shaping the future of leadership."
                items={posts}
                type="post"
                link="/blog"
                linkText="Discover More Insights"
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
              />
            </SectionSurface>
          )}

          {/* SOCIAL PROOF & ENGAGEMENT (deferred) */}
          <SectionSurface className="bg-white/90">
            <TestimonialsSection />
          </SectionSurface>

          <SectionSurface className="bg-white/90">
            <MilestonesTimeline />
          </SectionSurface>

          <SectionSurface className="bg-white/90">
            <EventsSection />
          </SectionSurface>

          {/* EMAIL SIGNUP */}
          <section id="email-signup" aria-labelledby="email-signup-title" className="scroll-mt-24">
            <h2 id="email-signup-title" className="sr-only">
              Email signup
            </h2>
            <SectionSurface className="bg-white/95">
              <EmailSignup />
            </SectionSurface>
          </section>
        </main>

        {/* Footer CTA */}
        <section className="py-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-full hover:bg-forest/90 transition"
            aria-label="Contact Abraham of London"
          >
            Let's Build Something Enduring
          </Link>
        </section>
      </div>
    </Layout>
  );
}
