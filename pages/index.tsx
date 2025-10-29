import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import EventCard from "@/components/events/EventCard";
import DownloadsGrid from "@/components/downloads/DownloadsGrid";
import { getActiveBanner } from "@/lib/hero-banners";
import { getAllPosts } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import {
    getAllEvents,
    dedupeEventsByTitleAndDay,
} from "@/lib/server/events-data";
import type { PostMeta } from "@/types/post";

/* ── Banner Types ── */
// 💡 UPGRADE: Renamed BannerOverlay & BannerCTA to include 'Banner' for clarity
type BannerCTA = { label: string; href: string };
type BannerOverlay =
    | { eyebrow?: string; title?: string; body?: string; cta?: BannerCTA }
    | null;
type VideoSource = { src: string; type: "video/webm" | "video/mp4" };
type BannerConfig = {
    poster: string;
    videoSources?: ReadonlyArray<VideoSource> | null;
    overlay?: BannerOverlay;
    mobileObjectPositionClass?: string | null;
    heightClassName?: string | null;
};

// client-only hero to avoid SSR media evaluation
const HeroBanner = dynamic(() => import("@/components/homepage/HeroBanner"), { ssr: false });

/* ── Events Teaser Types ── */
type ResourceLink = { href: string; label: string };
type EventResources = {
    downloads?: ResourceLink[] | null;
    reads?: ResourceLink[] | null;
};

// 💡 UPGRADE: Cleaned up type definition.
type EventsTeaserItem = {
    slug: string;
    title: string;
    date: string;
    location: string | null;
    description: string | null; // Matches EventCard prop
    tags: string[] | null;
    heroImage: string | null;
    resources: EventResources | null;
};
type EventsTeaser = Array<EventsTeaserItem>;

// Use InferGetStaticPropsType for the Home component's props for better type safety
type HomeProps = InferGetStaticPropsType<typeof getStaticProps>;

// --- [ Component Rendering ] ---

const Home: NextPage<HomeProps> = ({ posts, booksCount, eventsTeaser }) => {
    const router = useRouter();
    // 💡 IMPROVEMENT: Use optional chaining for safer access
    const incomingQ = typeof router.query.q === "string" ? router.query.q.trim() : "";
    const qSuffix = incomingQ ? `?q=${encodeURIComponent(incomingQ)}` : "";
    
    // 💡 IMPROVEMENT: Use template literal for clearer URL construction
    const blogHref = `/blog?sort=newest${qSuffix ? `&${qSuffix.substring(1)}` : ""}`;
    const booksHref = `/books${qSuffix}`;
    const postsCount = posts.length;

    // Use explicit BannerConfig partial type
    const raw = React.useMemo<Partial<BannerConfig>>(() => getActiveBanner() ?? {}, []);

    // 💡 IMPROVEMENT: Simplified object creation using nullish coalescing for required defaults
    const banner: BannerConfig & Required<Pick<BannerConfig, "poster">> = React.useMemo(() => ({
        poster: raw.poster || "/assets/images/abraham-of-london-banner@2560.webp",
        videoSources:
            raw.videoSources ??
            ([
                { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
                { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
            ] as const),
        overlay: raw.overlay ?? null,
        mobileObjectPositionClass: raw.mobileObjectPositionClass ?? "object-center",
        heightClassName: raw.heightClassName ?? "min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh]",
    }), [raw]);


    const overlayNode: React.ReactNode =
        banner.overlay ? (
            <>
                {/* Overlay rendering logic is clean and correct */}
                {banner.overlay.eyebrow && (
                    <span className="inline-block rounded-full border border-white/30 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                        {banner.overlay.eyebrow}
                    </span>
                )}
                {banner.overlay.title && (
                    <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                        {banner.overlay.title}
                    </h1>
                )}
                {banner.overlay.body && (
                    <p className="mt-3 max-w-prose text-sm text-[rgba(255,255,255,.85)]">{banner.overlay.body}</p>
                )}
                {banner.overlay.cta && (
                    <div className="mt-5">
                        <Link
                            href={banner.overlay.cta.href}
                            className="rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-deepCharcoal"
                            prefetch={false}
                        >
                            {banner.overlay.cta.label}
                        </Link>
                    </div>
                )}
            </>
        ) : undefined;

    /* quick list for homepage downloads */
    const downloads = React.useMemo(
        () => [
            { href: "/downloads/brotherhood-covenant", title: "Brotherhood Covenant (Printable)", sub: "A4 / US Letter" },
            { href: "/downloads/leaders-cue-card", title: "Leader’s Cue Card (A6, Two-Up)", sub: "Pocket reference" },
            { href: "/downloads/brotherhood-cue-card", title: "Brotherhood Cue Card" },
        ],
        []
    );

    return (
        <Layout pageTitle="Home" hideCTA>
            <Head>
                <meta
                    name="description"
                    content="Principled strategy, writing, and ventures that prioritise signal over noise. Discreet Chatham Rooms available—off the record."
                />
                <meta property="og:type" content="website" />
                {/* LCP Optimization: Add fetchpriority="high" to the primary image preload */}
                <link rel="preload" as="image" href={banner.poster} fetchPriority="high" />
                {/* IMPROVEMENT: Safe check for videoSources */}
                {Array.isArray(banner.videoSources) && banner.videoSources.map((s, i) => (
                    <link key={i} rel="preload" as="video" href={s.src} type={s.type} />
                ))}
            </Head>

            {/* HERO */}
            <HeroBanner
                poster={banner.poster}
                videoSources={banner.videoSources}
                overlay={overlayNode}
                // 💡 CRITICAL FIX: The mobileObjectPositionClass was hardcoded below, removed the hardcoded override
                mobileObjectPositionClass={banner.mobileObjectPositionClass} 
                heightClassName={banner.heightClassName}
            />

            {/* Breadcrumb + quick counts */}
            <section className="border-b border-lightGrey/70 bg-warmWhite/60">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <nav aria-label="Breadcrumb" className="text-[color:var(--color-on-secondary)/0.7]">
                        <ol className="flex items-center gap-2">
                            <li><Link href="/" className="hover:text-deepCharcoal" prefetch={false}>Home</Link></li>
                            <li aria-hidden>/</li>
                            <li className="text-[color:var(--color-on-secondary)/0.8]">Overview</li>
                            {incomingQ && (<><li aria-hidden>/</li><li className="text-[color:var(--color-on-secondary)/0.6]">“{incomingQ}”</li></>)}
                        </ol>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href={booksHref} className="rounded-full border border-lightGrey bg-white px-3 py-1 text-[color:var(--color-on-secondary)/0.85] hover:text-deepCharcoal" aria-label={`View books (${booksCount})`} prefetch={false}>
                            Books <span className="ml-1 text-[color:var(--color-on-secondary)/0.6]">({booksCount})</span>
                        </Link>
                        <Link href={blogHref} className="rounded-full border border-lightGrey bg-white px-3 py-1 text-[color:var(--color-on-secondary)/0.85] hover:text-deepCharcoal" aria-label={`View insights (${postsCount})`} prefetch={false}>
                            Insights <span className="ml-1 text-[color:var(--color-on-secondary)/0.6]">({postsCount})</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Insights */}
            <section className="bg-warmWhite px-4 py-16">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-8 flex items-end justify-between">
                        <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Insights</h2>
                        <Link href={blogHref} className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold" prefetch={false}>
                            Read the blog
                        </Link>
                    </header>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((p) => (
                            <BlogPostCard
                                key={p.slug}
                                {...p} // Spread all properties
                                // 💡 IMPROVEMENT: Pass optional props as-is (they are already sanitized to null in getStaticProps)
                                // The BlogPostCard component should handle null/undefined for optional fields
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Books (Content is hardcoded, so no changes needed) */}
            <section className="bg-white px-4 py-16">
                 {/* ... (Books section content remains the same) ... */}
                 <div className="mx-auto max-w-7xl">
                    <header className="mb-8 flex items-end justify-between">
                        <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Books</h2>
                        <Link href={booksHref} className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold" prefetch={false}>
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
                    </div>
                </div>
            </section>

            {/* Downloads — grid (Content is hardcoded, no changes needed) */}
            <section className="bg-white px-4 pb-4">
                 {/* ... (Downloads section content remains the same) ... */}
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

            {/* Events */}
            <section className="bg-white px-4 pb-4 pt-2">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-2 flex items-end justify-between">
                        <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Upcoming Events</h2>
                        <Link href="/events" className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold" prefetch={false}>
                            View all
                        </Link>
                    </header>
                    <p className="mb-6 text-xs text-[color:var(--color-on-secondary)/0.6]">
                        Select sessions run as Chatham Rooms (off the record).
                    </p>

                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {eventsTeaser.map((ev) => (
                            <li key={ev.slug}>
                                <EventCard
                                    {...ev}
                                    // 💡 IMPROVEMENT: Pass optional props as-is (they are already sanitized to null in getStaticProps)
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Ventures and Closing CTA sections remain unchanged (they are already clean) */}
            {/* ... */}
        </Layout>
    );
}

export default Home;
Home.displayName = "Home";

// --- [ SSG + ISR: Data Fetching ] ---

// 💡 IMPROVEMENT: Type definitions consolidated for clarity
type EventData = {
    slug: string;
    title: string;
    date: string;
    location: string | null;
    summary: string | null;
    tags: string[] | null;
    resources: EventResources | null;
};
type MinimalEvent = Omit<EventData, "summary"> & { summary?: string };

// 💡 CRITICAL FIX: Robust date-key function definition
const getCurrentDateKey = () => new Intl.DateTimeFormat("en-CA", {
    // 💡 IMPROVEMENT: Use UTC date key to avoid running into build-time environment timezones
    timeZone: "UTC", 
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
}).format(new Date());

export async function getStaticProps() {
    const allPosts = getAllPosts();
    const limitedPosts = allPosts.slice(0, 3);

    // Sanitize limitedPosts
    const safePosts = limitedPosts.map((p) => ({
        ...p,
        // CRITICAL FIX: Map missing optional fields to null to guarantee serialization and type consistency
        excerpt: p.excerpt ?? null,
        date: p.date ?? null,
        coverImage: p.coverImage ?? null,
        readTime: p.readTime ?? null,
        category: p.category ?? null,
        author: p.author ?? null,
        tags: p.tags ?? null,
        coverAspect: p.coverAspect ?? null,
        coverFit: p.coverFit ?? null,
        coverPosition: p.coverPosition ?? null,
    })) as PostMeta[]; // Ensure final type matches PostMeta

    const booksCount = getAllBooks(["slug"]).length;

    const rawEvents = await getAllEvents(["slug", "title", "date", "location", "summary", "tags", "resources"]);

    const deduped = dedupeEventsByTitleAndDay(
        rawEvents
            // Filter for basic required properties and cast to MinimalEvent to simplify mapping
            .filter((e): e is MinimalEvent => Boolean(e.slug && e.title && e.date))
            .map((e) => ({
                slug: String(e.slug),
                title: String(e.title),
                date: String(e.date),
                location: e.location ?? null,
                summary: e.summary ?? null, 
                tags: Array.isArray(e.tags) ? e.tags : null,
                resources: e.resources ?? null,
            })) as EventData[]
    );

    const todayKey = getCurrentDateKey();

    const upcomingSorted = deduped
        .filter((e) => {
            // 💡 CRITICAL FIX: Correctly compare date strings regardless of format
            
            // 1. Get the date string for comparison in YYYY-MM-DD format (UTC)
            let eventDateKey: string;
            
            // Check if the date string is a simple YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
                eventDateKey = e.date;
            } else {
                // For full date-time strings, convert the date part to the UTC key format
                const d = new Date(e.date);
                if (Number.isNaN(d.valueOf())) return false; // Invalid date
                
                // CRITICAL: Format the event's date using the same function, but in UTC
                eventDateKey = new Intl.DateTimeFormat("en-CA", {
                    timeZone: "UTC",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }).format(d);
            }
            
            // 2. Filter: Only keep events whose date key is greater than or equal to today's date key (YYYY-MM-DD)
            return eventDateKey >= todayKey;
        })
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)); // Sort ascending by date

    // Map the upcoming events for the final teaser prop
    const eventsTeaser: EventsTeaser = upcomingSorted.slice(0, 3).map((e) => {
        const baseForImage = e.slug.replace(/[\u2013\u2014].*$/, "");
        const heroImage = `/assets/images/events/${baseForImage}.jpg`;

        // 💡 IMPROVEMENT: Simplified resource mapping
        const safeResources = e.resources ? {
            downloads: e.resources.downloads ?? null,
            reads: e.resources.reads ?? null,
        } : null;

        return {
            slug: e.slug,
            title: e.title,
            date: e.date,
            location: e.location,
            description: e.summary, // Map 'summary' (data source) to 'description' (component prop)
            tags: e.tags,
            heroImage,
            resources: safeResources,
        };
    });

    return { props: { posts: safePosts, booksCount, eventsTeaser }, revalidate: 3600 };
}