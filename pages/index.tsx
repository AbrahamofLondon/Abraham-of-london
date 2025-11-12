<<<<<<< HEAD
import React from 'react';
// pages/index.tsx (ABSOLUTELY CLEAN, SYNCHRONIZED AND ERROR-FREE STRUCTURE)
=======
// pages/index.tsx (UPGRADED WITH QUICK WINS & ROBUST FALLBACKS)
>>>>>>> test-netlify-fix
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// Components
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import EventCard from "@/components/events/EventCard";
import DownloadsGrid from "@/components/downloads/DownloadsGrid";

// Data utilities
import { getActiveBanner } from "@/lib/hero-banners";
import { getAllPosts, getAllContent } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import { 
    getAllEvents, 
    dedupeEventsByTitleAndDay 
} from "@/lib/events";

// Types
import type { PostMeta } from "@/types/post";
import type { DownloadItem } from "@/lib/downloads";
import type { EventMeta, EventResources } from "@/types/event";

// ✅ QUICK WIN: Dynamic imports for better performance
const HeroBanner = dynamic(
  () => import("@/components/homepage/HeroBanner"),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh] bg-gray-200 animate-pulse" />
    )
  }
);

const SocialFollowStrip = dynamic(
  () => import("@/components/SocialFollowStrip"),
  { ssr: true }
);

// ---------- Enhanced Banner types with fallbacks ----------
type BannerCTA = { 
  label: string; 
  href: string;
  variant?: 'primary' | 'secondary';
};

type BannerOverlay = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: BannerCTA;
} | null;

type VideoSource = { 
  src: string; 
  type: "video/webm" | "video/mp4";
  fallback?: string;
};

type BannerConfig = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  overlay?: BannerOverlay;
  mobileObjectPositionClass?: string | null;
  heightClassName?: string | null;
};

// ---------- Enhanced Events teaser types ----------
type EventsTeaserItem = {
  slug: string;
  title: string;
  date: string;
  location: string | null;
  description?: string | null;
  tags?: string[] | null;
  heroImage?: string | null;
  resources?: EventResources | null;
  isChathamRoom?: boolean;
};

type EventsTeaser = Array<EventsTeaserItem>;

// ---------- Robust Helpers with Fallbacks ----------
function onlyUpcoming(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  
  try {
    const dt = new Date(dateString);
    if (Number.isNaN(+dt)) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt >= today;
  } catch {
    return false;
  }
}

function safeSlice<T>(array: T[], start: number, end: number): T[] {
  if (!Array.isArray(array)) return [];
  return array.slice(start, end);
}

function getFallbackImage(slug: string, type: 'event' | 'post' | 'book' = 'post'): string {
  const baseName = String(slug).replace(/[–—].*$/, "").trim() || 'default';
  
  const fallbacks = {
    event: `/assets/images/events/${baseName}.jpg`,
    post: `/assets/images/blog/${baseName}.jpg`,
    book: `/assets/images/books/${baseName}.jpg`,
  };
  
  return fallbacks[type] || `/assets/images/fallbacks/${type}.jpg`;
}

// ✅ QUICK WIN: Resource link validation
function validateResourceLink(link: any): boolean {
  return link && 
         typeof link.href === 'string' && 
         typeof link.label === 'string' &&
         link.href.startsWith('/');
}

// ---------- Page props ----------
type HomeProps = {
  posts: PostMeta[];
  booksCount: number;
  eventsTeaser: EventsTeaser;
  downloads: DownloadItem[];
  resources: PostMeta[];
  totalPostsCount: number;
  hasUpcomingEvents: boolean;
};

// ===================================================================
// getStaticProps — Enhanced with robust error handling
// ===================================================================
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    // ✅ QUICK WIN: Parallel data fetching for better performance
    const [allPosts, allDownloads, allResources, allEvents, allBooks] = await Promise.allSettled([
      // Posts
      (() => {
        try {
          const posts = getAllPosts();
          return safeSlice(posts, 0, 3).map((p: any): PostMeta => ({
            slug: p.slug || '',
            title: p.title || 'Untitled',
            excerpt: p.excerpt ?? null,
            date: p.date ?? null,
            coverImage: p.coverImage ?? getFallbackImage(p.slug, 'post'),
            readTime: p.readTime ?? null,
            category: p.category ?? null,
            author: p.author ?? null,
            tags: p.tags ?? null,
            coverAspect: p.coverAspect ?? 'book',
            coverFit: p.coverFit ?? (p.coverAspect === 'book' ? 'contain' : 'cover'),
            coverPosition: p.coverPosition ?? 'center',
          }));
        } catch {
          return [];
        }
      })(),

      // Downloads
      (() => {
        try {
          const downloads = getAllContent("downloads", { includeDrafts: false }) as DownloadItem[];
          return safeSlice(downloads, 0, 6).map(d => ({
            ...d,
            href: d.href?.startsWith('/') ? d.href : `/downloads${d.href || ''}`,
          }));
        } catch {
          return [];
        }
      })(),

      // Resources
      (() => {
        try {
          const resources = getAllContent("resources", { includeDrafts: false }) as PostMeta[];
          return safeSlice(resources, 0, 6);
        } catch {
          return [];
        }
      })(),

      // Events
      (() => {
        try {
          const rawEvents = getAllEvents([
            "slug", "title", "date", "location", "summary", 
            "tags", "resources", "heroImage", "isChathamRoom"
          ]);
          const deduped = dedupeEventsByTitleAndDay(rawEvents);
          const upcomingSorted = deduped
            .filter((e: any) => onlyUpcoming(e.date))
            .sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

          return safeSlice(upcomingSorted, 0, 3).map((e: any): EventsTeaserItem => {
            const heroImage = e.heroImage || getFallbackImage(e.slug, 'event');
            const resources = e.resources ? {
              downloads: Array.isArray(e.resources.downloads) ? e.resources.downloads.filter(validateResourceLink) : null,
              reads: Array.isArray(e.resources.reads) ? e.resources.reads.filter(validateResourceLink) : null,
            } : null;

            return {
              slug: e.slug || '',
              title: e.title || 'Untitled Event',
              date: e.date || new Date().toISOString(),
              location: e.location ?? null,
              description: e.summary ?? null,
              tags: Array.isArray(e.tags) ? e.tags : null,
              heroImage,
              resources,
              isChathamRoom: Boolean(e.isChathamRoom),
            };
          });
        } catch {
          return [];
        }
      })(),

      // Books count
      (() => {
        try {
          return getAllBooks(["slug"]).length;
        } catch {
          return 0;
        }
      })(),
    ]);

    // ✅ QUICK WIN: Extract values with fallbacks
    const posts = allPosts.status === 'fulfilled' ? allPosts.value : [];
    const downloads = allDownloads.status === 'fulfilled' ? allDownloads.value : [];
    const resources = allResources.status === 'fulfilled' ? allResources.value : [];
    const eventsTeaser = allEvents.status === 'fulfilled' ? allEvents.value : [];
    const booksCount = allBooks.status === 'fulfilled' ? allBooks.value : 0;
    const totalPostsCount = allPosts.status === 'fulfilled' ? getAllPosts().length : 0;

    return {
      props: { 
        posts, 
        booksCount, 
        eventsTeaser, 
        downloads, 
        resources,
        totalPostsCount,
        hasUpcomingEvents: eventsTeaser.length > 0,
      },
      revalidate: 3600, // 1 hour
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    // ✅ QUICK WIN: Robust fallback for complete failure
    return {
      props: {
        posts: [],
        booksCount: 0,
        eventsTeaser: [],
        downloads: [],
        resources: [],
        totalPostsCount: 0,
        hasUpcomingEvents: false,
      },
      revalidate: 300, // 5 minutes on error
    };
  }
};

// ===================================================================
// Component with Enhanced Error Boundaries & Fallbacks
// ===================================================================
export default function Home({
  posts,
  booksCount,
  eventsTeaser,
  downloads,
  resources,
  totalPostsCount,
  hasUpcomingEvents,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  
  // ✅ QUICK WIN: Safe query parameter handling
  const incomingQ = React.useMemo(() => {
    const q = router.query.q;
    return typeof q === "string" ? q.trim().slice(0, 100) : ""; // Limit length
  }, [router.query.q]);

  const qSuffix = incomingQ ? `?q=${encodeURIComponent(incomingQ)}` : "";
  const blogHref = `/blog?sort=newest${incomingQ ? `&q=${encodeURIComponent(incomingQ)}` : ""}`;
  const booksHref = `/books${qSuffix}`;

  // ✅ QUICK WIN: Memoized banner configuration with fallbacks
  const banner = React.useMemo(() => {
    const raw = getActiveBanner() as BannerConfig | null;
    
    const defaultBanner: Required<BannerConfig> = {
      poster: "/assets/images/abraham-of-london-banner@2560.webp",
      videoSources: [
        { 
          src: "/assets/video/brand-reel-1080p.webm", 
          type: "video/webm" as const,
          fallback: "/assets/video/brand-reel-1080p.mp4"
        },
        { 
          src: "/assets/video/brand-reel-1080p.mp4", 
          type: "video/mp4" as const 
        },
      ],
      overlay: {
        eyebrow: "Leadership & Fatherhood",
        title: "Build with Clarity. Lead with Standards.",
        body: "Principled strategy, writing, and ventures that prioritise signal over noise.",
        cta: { label: "Start the Conversation", href: "/contact", variant: "primary" as const }
      },
      mobileObjectPositionClass: "object-left md:object-[30%_center] lg:object-[40%_center]",
      heightClassName: "min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh]",
    };

    return {
      poster: raw?.poster || defaultBanner.poster,
      videoSources: raw?.videoSources || defaultBanner.videoSources,
      overlay: raw?.overlay || defaultBanner.overlay,
      mobileObjectPositionClass: raw?.mobileObjectPositionClass || defaultBanner.mobileObjectPositionClass,
      heightClassName: raw?.heightClassName || defaultBanner.heightClassName,
    };
  }, []);

  // ✅ QUICK WIN: Safe overlay rendering
  const overlayNode: React.ReactNode = React.useMemo(() => {
    if (!banner.overlay) return null;

    return (
      <div className="text-center">
        {banner.overlay.eyebrow && (
          <span className="inline-block rounded-full border border-white/30 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
            {banner.overlay.eyebrow}
          </span>
        )}
        {banner.overlay.title && (
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-white">
            {banner.overlay.title}
          </h1>
        )}
        {banner.overlay.body && (
          <p className="mt-3 max-w-prose text-sm text-white/85 mx-auto">{banner.overlay.body}</p>
        )}
        {banner.overlay.cta && (
          <div className="mt-5">
            <Link
              href={banner.overlay.cta.href}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                banner.overlay.cta.variant === 'secondary' 
                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                  : 'bg-softGold text-deepCharcoal hover:brightness-95'
              }`}
              prefetch={false}
            >
              {banner.overlay.cta.label}
            </Link>
          </div>
        )}
      </div>
    );
  }, [banner.overlay]);

  // ✅ QUICK WIN: Empty state components
  const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">{message}</p>
      {action}
    </div>
  );

  return (
    <Layout pageTitle="Home" hideCTA>
      <Head>
        <title>Abraham of London • Leadership & Fatherhood</title>
        <meta
          name="description"
          content="Principled strategy, writing, and ventures that prioritise signal over noise. Discreet Chatham Rooms available—off the record."
        />
        <meta property="og:type" content="website" />
        <link rel="preload" as="image" href={banner.poster} fetchPriority="high" />
        {banner.videoSources?.map((s, i) => (
          <link key={i} rel="preload" as="video" href={s.src} type={s.type} />
        ))}
      </Head>

      {/* HERO BANNER */}
      <HeroBanner
        poster={banner.poster}
        videoSources={banner.videoSources}
        overlay={overlayNode}
        mobileObjectPositionClass={banner.mobileObjectPositionClass}
        heightClassName={banner.heightClassName}
      />

      {/* BREADCRUMB + QUICK COUNTS */}
      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-gray-600">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-deepCharcoal transition-colors" prefetch={false}>
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-gray-400">/</li>
              <li className="text-gray-800">Overview</li>
              {incomingQ && (
                <>
                  <li aria-hidden className="text-gray-400">/</li>
                  <li className="text-gray-600">"{incomingQ}"</li>
                </>
              )}
            </ol>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={booksHref}
              className="rounded-full border border-lightGrey bg-white px-3 py-1 text-gray-700 hover:text-deepCharcoal hover:border-gray-400 transition-colors"
              aria-label={`View books (${booksCount})`}
              prefetch={false}
            >
              Books <span className="ml-1 text-gray-500">({booksCount})</span>
            </Link>
            <Link
              href={blogHref}
              className="rounded-full border border-lightGrey bg-white px-3 py-1 text-gray-700 hover:text-deepCharcoal hover:border-gray-400 transition-colors"
              aria-label={`View insights (${totalPostsCount})`}
              prefetch={false}
            >
              Insights <span className="ml-1 text-gray-500">({totalPostsCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED INSIGHTS */}
      <section className="bg-warmWhite px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Insights</h2>
              <p className="mt-2 text-sm text-gray-600">
                Latest writings on leadership, fatherhood, and principled living
              </p>
            </div>
            <Link
              href={blogHref}
              className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold transition-colors"
              prefetch={false}
            >
              Read the blog
            </Link>
          </header>

          {posts.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <EmptyState 
              message="No featured insights available at the moment."
              action={
                <Link 
                  href="/blog" 
                  className="inline-block bg-softGold text-deepCharcoal px-4 py-2 rounded-full text-sm font-medium hover:brightness-95 transition-all"
                >
                  Browse All Insights
                </Link>
              }
            />
          )}
        </div>
      </section>

      {/* FEATURED BOOKS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Books</h2>
              <p className="mt-2 text-sm text-gray-600">
                Groundbreaking works on fatherhood, leadership, and personal transformation
              </p>
            </div>
            <Link
              href={booksHref}
              className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold transition-colors"
              prefetch={false}
            >
              View all
            </Link>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <BookCard
              slug="fathering-without-fear"
              title="Fathering Without Fear"
              author="Abraham of London"
              excerpt="A bold memoir reclaiming fatherhood—clarity, discipline, and standards that endure."
              genre="Memoir"
              featured
              coverImage="/assets/images/fathering-without-fear-teaser.jpg"
            />
            <BookCard
              slug="the-fiction-adaptation"
              title="The Fiction Adaptation"
              author="Abraham of London"
              excerpt="A dramatized reimagining of lived conviction—raw, luminous, and cinematic."
              genre="Drama"
              coverImage="/assets/images/fathering-without-fear.jpg"
            />
            {/* ✅ QUICK WIN: Third book card for better grid layout */}
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
              <p className="text-gray-500 text-sm mb-2">Coming Soon</p>
              <h3 className="font-serif text-lg font-semibold text-gray-700 mb-2">New Work in Progress</h3>
              <p className="text-gray-600 text-xs">Next groundbreaking book launching soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      {downloads.length > 0 && (
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8">
              <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Downloads</h2>
              <p className="mt-2 text-sm text-gray-600">
                Practical tools, guides, and resources to help you lead with clarity
              </p>
            </header>

            <DownloadsGrid items={downloads} columns={2} className="mt-2" />
            
            <div className="text-center mt-8">
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold transition-colors"
                prefetch={false}
              >
                View all downloads
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* EVENTS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">
                Upcoming Events
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {hasUpcomingEvents 
                  ? "Join live sessions, workshops, and exclusive Chatham Rooms"
                  : "No upcoming events scheduled"
                }
              </p>
            </div>
            {hasUpcomingEvents && (
              <Link
                href="/events"
                className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold transition-colors"
                prefetch={false}
              >
                View all events
              </Link>
            )}
          </header>

          {hasUpcomingEvents ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {eventsTeaser.map((event) => (
                <EventCard
                  key={event.slug}
                  slug={event.slug}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  description={event.description}
                  tags={event.tags}
                  heroImage={event.heroImage}
                  resources={event.resources}
                  isChathamRoom={event.isChathamRoom}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              message="No upcoming events scheduled at this time."
              action={
                <Link 
                  href="/events" 
                  className="inline-block bg-softGold text-deepCharcoal px-4 py-2 rounded-full text-sm font-medium hover:brightness-95 transition-all"
                >
                  View Past Events
                </Link>
              }
            />
          )}
        </div>
      </section>

      {/* VENTURES */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Ventures</h2>
            <p className="mt-2 text-sm text-gray-600">
              A portfolio built on craftsmanship, stewardship, and endurance
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/ventures?brand=alomarada"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition-all hover:shadow-cardHover hover:border-softGold/30"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Alomarada</p>
                <span className="text-sm text-softGold transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Strategy & capital—focused on durable businesses with moral clarity and operational discipline.
              </p>
            </Link>

            <Link
              href="/ventures?brand=endureluxe"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition-all hover:shadow-cardHover hover:border-softGold/30"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Endureluxe</p>
                <span className="text-sm text-softGold transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Essential goods and refined experiences—engineered to last, designed to serve.
              </p>
            </Link>

            <Link
              href="/about"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition-all hover:shadow-cardHover hover:border-softGold/30"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Abraham of London</p>
                <span className="text-sm text-softGold transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Writing, counsel, and cultural work at the intersection of family, enterprise, and society.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL FOLLOW STRIP */}
      <SocialFollowStrip variant="light" className="my-8" />

      {/* CLOSING CTA */}
      <section className="relative isolate overflow-hidden bg-deepCharcoal">
        <div className="absolute inset-0 -z-10">
          <Image 
            src="/assets/images/cta/cta-bg.jpg" 
            alt="" 
            fill 
            sizes="100vw" 
            quality={85} 
            className="object-cover opacity-20" 
            priority={false} 
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h3 className="font-serif text-3xl font-semibold text-cream">
            Build with Clarity. Lead with Standards. Leave a Legacy.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-on-primary)/0.85]">
            Start a conversation that moves your family, your venture, and your community forward.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-7 py-3 text-sm font-semibold text-deepCharcoal transition-all hover:brightness-95 hover:scale-105"
              prefetch={false}
            >
              Connect with a Strategist
            </Link>
            <Link
              href="/brotherhood"
              className="rounded-full border border-[color:var(--color-on-primary)/0.3] bg-[color:var(--color-on-primary)/0.1] px-7 py-3 text-sm font-semibold text-cream transition-all hover:bg-[color:var(--color-on-primary)/0.2] backdrop-blur-sm"
              prefetch={false}
            >
              Join Brotherhood
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
<<<<<<< HEAD
}



=======
}
>>>>>>> test-netlify-fix
