import React, { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import { getAllPosts, PostMeta } from "@/lib/posts";
import { getAllBooks, BookMeta } from "@/lib/books";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import EmailSignup from "@/components/EmailSignup";
import { generatedCover } from "@/lib/og";
import { buildHomeStructuredData } from "@/lib/seo";
import { achievements as achievementsData, Achievement } from "@/data/achievements";

// Sections
const HeroSection = dynamic(() => import("@/components/homepage/HeroSection"), { ssr: true });
const AboutSection = dynamic(() => import("@/components/homepage/AboutSection"), { ssr: true });
const VenturesSection = dynamic(() => import("@/components/homepage/VenturesSection"), { ssr: true });
const ContentShowcase = dynamic(() => import("@/components/homepage/ContentShowcase"), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/homepage/TestimonialsSection"), { ssr: false });
const MilestonesTimeline = dynamic(() => import("@/components/homepage/MilestonesTimeline"), { ssr: false });
const EventsSection = dynamic(() => import("@/components/homepage/EventsSection"), { ssr: false });

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
  logo: "/assets/images/logo/abraham-of-london-logo.svg",
} as const;

export type Post = Required<
  Pick<PostMeta, "slug" | "title" | "date" | "excerpt" | "coverImage" | "author" | "readTime" | "category">
>;

export type Book = Required<
  Pick<BookMeta, "slug" | "title" | "author" | "excerpt" | "coverImage" | "buyLink">
> & {
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

interface HomeProps {
  posts: Post[];
  books: Book[];
  achievements: Achievement[];
}

/** Animated “surface” wrapper for high-contrast cards/sections */
const SectionSurface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.55, ease: "easeOut" }}
    className={`mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-10 sm:py-12 bg-white text-deepCharcoal rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-black/5 ${className}`}
  >
    {children}
  </motion.section>
);

/** getStaticProps: gather posts/books, normalize fields, provide achievements */
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
            ? b.coverImage
            : ASSETS.defaultBookCover,
        buyLink: b.buyLink || "#",
        genre: Array.isArray(b.genre)
          ? (b.genre as string[]).filter(Boolean).join(", ")
          : (b.genre as string) || "Personal Development",
        downloadPdf: b.downloadPdf ?? null,
        downloadEpub: b.downloadEpub ?? null,
      }));

    // Pull achievements from data file (easier to manage than inlined)
    const achievements = achievementsData;

    return { props: { posts, books, achievements }, revalidate: 3600 };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { posts: [], books: [], achievements: [] }, revalidate: 300 };
  }
};

export default function Home({ posts, books, achievements }: HomeProps) {
  // Static, crisp count—no flicker. If you later have an API, fetch there.
  const communityCount = 120000;

  const sameAsLinks = useMemo(
    () => siteConfig.socialLinks.filter((l) => l.external && /^https?:\/\//i.test(l.href)).map((l) => l.href),
    []
  );

  const structuredData = useMemo(
    () =>
      buildHomeStructuredData({
        siteConfig,
        posts,
        books,
        sameAsLinks,
        baseUrl: SITE_URL,
        assets: { logo: ASSETS.logo, portrait: ASSETS.profilePortrait },
      }),
    [posts, books, sameAsLinks]
  );

  const hasPosts = posts.length > 0;
  const hasBooks = books.length > 0;

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title} — Empowering Leaders in Fatherhood & Strategy</title>
        <meta
          name="description"
          content={siteConfig.description}
        />
        <link rel="canonical" href={SITE_URL} />

        {/* Static social descriptions for stable caching */}
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={absUrl(ASSETS.ogImage)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={siteConfig.description} />
        <meta name="twitter:image" content={absUrl(ASSETS.twitterImage)} />
        <meta name="theme-color" content="#0b2e1f" />
        <meta name="color-scheme" content="dark light" />
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

      {/* Background kept simple; Hero handles its own banner + scrim */}
      <div className="relative min-h-screen">
        <HeroSection
          title={siteConfig.title}
          subtitle="Global Strategist, Author, and Visionary Leader"
          ctaText="Join the Movement"
          ctaLink="/join"
          communityCount={communityCount}
        />

        <main id="main-content" className="relative space-y-12 sm:space-y-16 pb-12">
          <SectionSurface>
            <AboutSection
              bio="I'm Abraham of London, a recognized strategist and author dedicated to redefining leadership and fatherhood. With decades of experience across industries, I empower millions to build legacies of impact."
              achievements={achievements}
              portraitSrc={ASSETS.profilePortrait}
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
                /* Ideally add aria-label inside ContentShowcase for the link element */
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
            <h2 id="email-signup-title" className="sr-only">
              Email signup
            </h2>
            <SectionSurface className="bg-white/95">
              <EmailSignup />
            </SectionSurface>
          </section>
        </main>

        <section className="py-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-full hover:bg-forest/90 transition"
            aria-label="Contact Abraham of London"
          >
            {"Let's Build Something Enduring"}
          </Link>
        </section>
      </div>
    </Layout>
  );
}
