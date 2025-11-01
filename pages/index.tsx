// pages/index.tsx
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- Local Component Imports ---
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import EventCard from "@/components/events/EventCard";
import DownloadsGrid from "@/components/downloads/DownloadsGrid";
import { getAllContent } from "@/lib/mdx";
import { getActiveBanner } from "@/lib/hero-banners";
import type { PostMeta } from "@/types/post";

// --- Type Definitions ---
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
const HeroBanner = dynamic(() => import("@/components/homepage/HeroBanner"), { ssr: false });
type HomeProps = InferGetStaticPropsType<typeof getStaticProps>;

// --- [ Component Rendering ] ---
const Home: NextPage<HomeProps> = ({ posts, books, events }) => {
  const banner: BannerConfig = React.useMemo(() => {
    const raw = getActiveBanner() ?? {};
    return {
      poster: raw.poster || "/assets/images/abraham-of-london-banner@2560.webp",
      videoSources: raw.videoSources ?? [
        { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
        { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
      ],
      overlay: raw.overlay ?? null,
      mobileObjectPositionClass: raw.mobileObjectPositionClass ?? "object-center",
      heightClassName: raw.heightClassName ?? "min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh]",
    };
  }, []);

  const overlayNode: React.ReactNode = banner.overlay ? (
    <>
      {banner.overlay.eyebrow && (
        <span className="inline-block rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs uppercase tracking-widest">
          {banner.overlay.eyebrow}
        </span>
      )}
      {banner.overlay.title && (
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {banner.overlay.title}
        </h1>
      )}
      {banner.overlay.body && (
        <p className="mt-3 max-w-prose text-sm text-white/80">{banner.overlay.body}</p>
      )}
      {banner.overlay.cta && (
        <div className="mt-5">
          <Link
            href={banner.overlay.cta.href}
            className="rounded-full bg-muted-gold px-5 py-2 text-sm font-semibold text-deep-forest transition hover:opacity-90"
            prefetch={false}
          >
            {banner.overlay.cta.label}
          </Link>
        </div>
      )}
    </>
  ) : undefined;

  const downloads = React.useMemo(
    () => [
      { href: "/downloads/brotherhood-covenant", title: "Brotherhood Covenant (Printable)", sub: "A4 / US Letter" },
      { href: "/downloads/leaders-cue-card", title: "Leader’s Cue Card (A6, Two-Up)", sub: "Pocket reference" },
    ],
    []
  );

  return (
    <Layout pageTitle="Home" hideCTA>
      <Head>
        <meta name="description" content="Principled strategy, writing, and ventures that prioritise signal over noise."/>
        <meta property="og:type" content="website" />
        <link rel="preload" as="image" href={banner.poster} fetchPriority="high" />
        {banner.videoSources?.map((s, i) => (
          <link key={i} rel="preload" as="video" href={s.src} type={s.type} />
        ))}
      </Head>

      <HeroBanner {...banner} overlay={overlayNode} />

      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-[color:var(--color-on-secondary)/0.7]">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:text-deepCharcoal" prefetch={false}>Home</Link></li>
              <li aria-hidden>/</li>
              <li className="text-[color:var(--color-on-secondary)/0.8]">Overview</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/books" className="rounded-full border border-lightGrey bg-white px-3 py-1 text-[color:var(--color-on-secondary)/0.85] hover:text-deepCharcoal">
              Books <span className="ml-1 text-[color:var(--color-on-secondary)/0.6]">({books.length})</span>
            </Link>
            <Link href="/blog" className="rounded-full border border-lightGrey bg-white px-3 py-1 text-[color:var(--color-on-secondary)/0.85] hover:text-deepCharcoal">
              Insights <span className="ml-1 text-[color:var(--color-on-secondary)/0.6]">({posts.length})</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-warmWhite px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Featured Insights</h2>
            <Link href="/blog" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold">
              Read the blog
            </Link>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogPostCard key={p.slug} {...p} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Featured Books</h2>
            <Link href="/books" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold">
              View all
            </Link>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book.slug}
                slug={book.slug}
                title={book.title}
                author={book.author}
                excerpt={book.excerpt}
                coverImage={book.coverImage}
                genre={book.category} // Pass category as genre
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-4">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h2 className="font-serif text-2xl font-semibold text-deepCharcoal">Downloads</h2>
            <p className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
              Practical tools to help you lead with clarity.
            </p>
          </header>
          <DownloadsGrid items={downloads} columns={2} className="mt-2" />
        </div>
      </section>

      <section className="bg-white px-4 pb-4 pt-2">
        <div className="mx-auto max-w-7xl">
          <header className="mb-2 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-soft-charcoal">Upcoming Events</h2>
            <Link href="/events" className="text-sm font-medium text-soft-charcoal underline decoration-muted-gold/50 underline-offset-4 hover:decoration-muted-gold">
              View all
            </Link>
          </header>
          <p className="mb-6 text-xs text-[color:var(--color-on-secondary)/0.6]">
            Select sessions run as Chatham Rooms (off the record).
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <li key={ev.slug}>
                <EventCard
                  {...ev}
                  description={ev.summary} // Map summary to description
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  );
};
export default Home;

// --- [ SSG + ISR: Data Fetching ] ---
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const allPosts = getAllContent('blog');
  const allBooks = getAllContent('books');
  const allEvents = getAllContent('events');

  const sanitize = (item: Partial<PostMeta>): PostMeta => {
    return JSON.parse(JSON.stringify(item));
  };
  
  const todayKey = new Date().toISOString().split('T')[0];

  const upcomingEvents = allEvents
    .filter((e) => e.date && e.date.split('T')[0] >= todayKey)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return {
    props: {
      posts: allPosts.map(sanitize).slice(0, 3), 
      books: allBooks.map(sanitize), 
      events: upcomingEvents.map(sanitize).slice(0, 3),
    },
    revalidate: 3600, // Rebuild every hour
  };
};