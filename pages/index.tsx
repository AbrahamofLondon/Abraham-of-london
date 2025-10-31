import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- Local Component Imports ---
// Ensure these paths match your project structure.
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import EventCard from "@/components/events/EventCard";
import { getAllContent } from "@/lib/mdx"; // ✅ The unified, robust content fetching function
import { getActiveBanner } from "@/lib/hero-banners";
import type { PostMeta } from "@/types/post";

// --- Type Definitions for Clarity & Safety ---

type BannerCTA = { label: string; href: string };
type BannerOverlay = { eyebrow?: string; title?: string; body?: string; cta?: BannerCTA } | null;
type VideoSource = { src: string; type: "video/webm" | "video/mp4" };
type BannerConfig = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  overlay?: BannerOverlay;
  mobileObjectPositionClass?: string | null;
  heightClassName?: string | null;
};

// Use InferGetStaticPropsType for the best type safety
type HomeProps = InferGetStaticPropsType<typeof getStaticProps>;

// --- Client-Side Components (for performance and compatibility) ---
const HeroBanner = dynamic(() => import("@/components/homepage/HeroBanner"), { ssr: false });

// ====================================================================================
//  HOME PAGE COMPONENT
// ====================================================================================

const Home: NextPage<HomeProps> = ({ posts, books, events }) => {
  // --- Banner Configuration ---
  const bannerConfig: BannerConfig = React.useMemo(() => {
    const activeBanner = getActiveBanner() ?? {};
    return {
      poster: activeBanner.poster || "/assets/images/abraham-of-london-banner@2560.webp",
      videoSources: activeBanner.videoSources ?? [
        { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
        { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
      ],
      overlay: activeBanner.overlay ?? null,
      mobileObjectPositionClass: activeBanner.mobileObjectPositionClass ?? "object-center",
      heightClassName: activeBanner.heightClassName ?? "min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh]",
    };
  }, []);

  const overlayNode: React.ReactNode = bannerConfig.overlay ? (
    <>
      {bannerConfig.overlay.eyebrow && (
        <span className="inline-block rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs uppercase tracking-widest">
          {bannerConfig.overlay.eyebrow}
        </span>
      )}
      {bannerConfig.overlay.title && (
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {bannerConfig.overlay.title}
        </h1>
      )}
      {bannerConfig.overlay.body && (
        <p className="mt-3 max-w-prose text-sm text-white/80">{bannerConfig.overlay.body}</p>
      )}
      {bannerConfig.overlay.cta && (
        <div className="mt-5">
          <Link
            href={bannerConfig.overlay.cta.href}
            className="rounded-full bg-muted-gold px-5 py-2 text-sm font-semibold text-deep-forest transition hover:opacity-90"
            prefetch={false}
          >
            {bannerConfig.overlay.cta.label}
          </Link>
        </div>
      )}
    </>
  ) : undefined;

  return (
    <Layout pageTitle="Home" hideCTA>
      <Head>
        <meta
          name="description"
          content="Principled strategy, writing, and ventures that prioritise signal over noise. Grounded in legacy and fatherhood."
        />
        <meta property="og:type" content="website" />
        <link rel="preload" as="image" href={bannerConfig.poster} fetchPriority="high" />
        {bannerConfig.videoSources?.map((s, i) => (
          <link key={i} rel="preload" as="video" href={s.src} type={s.type} />
        ))}
      </Head>

      {/* --- HERO BANNER SECTION --- */}
      <HeroBanner {...bannerConfig} overlay={overlayNode} />

      {/* --- FEATURED INSIGHTS SECTION --- */}
      <section className="bg-warm-cream px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Featured Insights</h2>
            <Link href="/blog" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold" prefetch={false}>
              Read the blog
            </Link>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED BOOKS SECTION --- */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Featured Books</h2>
            <Link href="/books" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold" prefetch={false}>
              View all
            </Link>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </div>
      </section>

      {/* --- UPCOMING EVENTS SECTION --- */}
      <section className="bg-warm-cream px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-2 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Upcoming Events</h2>
            <Link href="/events" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold" prefetch={false}>
              View all
            </Link>
          </header>
          <p className="mb-6 text-sm text-soft-charcoal/60">
            Select sessions run as Chatham Rooms (off the record).
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.slug}>
                <EventCard {...event} description={event.summary} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  );
};

export default Home;

// ====================================================================================
//  SERVER-SIDE DATA FETCHING (getStaticProps)
// ====================================================================================

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // ✅ FETCH all content types using the single, reliable function
  const latestPosts = getAllContent("blog", 3);
  const featuredBooks = getAllContent("books", 2);
  const upcomingEvents = getAllContent("events")
    .filter(event => event.date && new Date(event.date) >= new Date()) // Filter for today or future
    .slice(0, 3);

  // ✅ GUARANTEE SERIALIZATION: Convert any `undefined` properties to `null`
  // This is a robust safeguard that prevents Next.js build errors.
  const sanitizeForProps = (item: Partial<PostMeta>): PostMeta => {
    return JSON.parse(JSON.stringify(item));
  };

  return {
    props: {
      posts: latestPosts.map(sanitizeForProps),
      books: featuredBooks.map(sanitizeForProps), // Now dynamically fetching books
      events: upcomingEvents.map(sanitizeForProps),
    },
    revalidate: 3600, // Rebuild the homepage at most once per hour
  };
};