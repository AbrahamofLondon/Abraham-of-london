// pages/index.tsx (ABSOLUTELY CLEAN, SYNCHRONIZED AND ERROR-FREE STRUCTURE)
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { format } from "date-fns";

// CRITICAL: Import all necessary components and utilities
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import EventCard from "@/components/events/EventCard";
import DownloadsGrid from "@/components/downloads/DownloadsGrid";
import { getActiveBanner } from "@/lib/hero-banners";
import { getAllPosts, getAllContent } from "@/lib/mdx"; 
import { getAllBooks } from "@/lib/books"; 
import {
    getAllEvents, 
    dedupeEventsByTitleAndDay,
} from "@/lib/server/events-data";
import type { PostMeta } from "@/types/post";
import type { DownloadItem } from "@/lib/downloads"; 

/* ── banner types ── */
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
const HeroBanner = dynamic(() => import("@/components/homepage/HeroBanner"), { ssr: false });

/* ── events teaser types ── */
type ResourceLink = { href: string; label: string };
type EventResources = {
    downloads?: ResourceLink[] | null;
    reads?: ResourceLink[] | null;
};
type EventsTeaserItem = {
    slug: string;
    title: string;
    date: string;
    location: string | null;
    description?: string | null;
    tags?: string[] | null;
    heroImage?: string | null;
    resources?: EventResources | null;
};
type EventsTeaser = Array<EventsTeaserItem>;

// --- Data Filtering Utility ---
function onlyUpcoming(dateString: string | undefined | null): boolean {
    if (!dateString) return false;
    const dt = new Date(dateString);
    if (Number.isNaN(+dt)) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return dt >= today;
}
// ------------------------------

type HomeProps = { 
    posts: PostMeta[]; 
    booksCount: number; 
    eventsTeaser: EventsTeaser;
    downloads: DownloadItem[]; 
    resources: PostMeta[];
};

// -----------------------------------------------------------------------------------
// 1) getStaticProps - Feeds data into Homepage widgets (CLOSED CLEANLY)
// -----------------------------------------------------------------------------------
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
    // Downloads and Resources
    const downloads = getAllContent("downloads", { includeDrafts: false }).slice(0, 6) as DownloadItem[];
    const resources = getAllContent("resources", { includeDrafts: false }).slice(0, 6) as PostMeta[];

    // Posts: Fetch 3 featured posts
    const allPosts = getAllPosts();
    const limitedPosts = allPosts.slice(0, 3);
    const safePosts = limitedPosts.map((p) => ({
        ...p,
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
    }));
    const postsCount = allPosts.length;


    // Events: Filter for upcoming, sort by date (soonest first), and limit to 3
    const rawEvents = getAllEvents(["slug", "title", "date", "location", "summary", "tags", "resources", "heroImage"]);
    const deduped = dedupeEventsByTitleAndDay(rawEvents);

    const upcomingSorted = deduped
        .filter((e) => onlyUpcoming(e.date))
        .sort((a, b) => (new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()));

    // Construct EventsTeaser items using robust data mapping
    const eventsTeaser: EventsTeaser = upcomingSorted.slice(0, 3).map((e: any) => {
        const baseForImage = String(e.slug).replace(/[–—].*$/, "");
        const heroImage = e.heroImage ?? `/assets/images/events/${baseForImage}.jpg`;
        const resources: EventResources | null = (e.resources ?? null);
        
        const safeResources = resources ? {
            downloads: resources.downloads ?? null,
            reads: resources.reads ?? null,
        } : null;

        return { 
            slug: e.slug,
            title: e.title,
            date: e.date,
            location: e.location ?? null,
            description: e.summary ?? null,
            tags: Array.isArray(e.tags) ? e.tags : null,
            heroImage,
            resources: safeResources, 
        } as EventsTeaserItem; 
    });

    const booksCount = getAllBooks(["slug"]).length;

    // CRITICAL: This is the final object return, ending the function block
    return { 
        props: { posts: safePosts, booksCount, eventsTeaser, downloads, resources }, 
        revalidate: 3600 
    };
};
// -----------------------------------------------------------------------------------


export default function Home({ posts, booksCount, eventsTeaser, downloads, resources }: HomeProps) {
    const router = useRouter();
    const incomingQ = typeof router.query.q === "string" ? router.query.q.trim() : "";
    const qSuffix = incomingQ ? `?q=${encodeURIComponent(incomingQ)}` : "";
    const blogHref = `/blog?sort=newest${incomingQ ? `&q=${encodeURIComponent(incomingQ)}` : ""}`;
    const booksHref = `/books${qSuffix}`;
    const postsCount = posts.length;

    const raw = React.useMemo<BannerConfig>(() => (getActiveBanner() ?? {}) as unknown as BannerConfig, []);
    
    const banner: Required<Pick<BannerConfig, "poster">> & Omit<BannerConfig, "poster"> = {
        poster: raw?.poster || "/assets/images/abraham-of-london-banner@2560.webp",
        videoSources:
            raw?.videoSources ??
            ([
                { src: "/assets/video/brand-reel-1080p.webm", type: "video/webm" },
                { src: "/assets/video/brand-reel-1080p.mp4", type: "video/mp4" },
            ] as const),
        overlay: raw?.overlay ?? null,
        mobileObjectPositionClass: raw?.mobileObjectPositionClass ?? "object-left md:object-[30%_center] lg:object-[40%_center]",
        heightClassName: raw?.heightClassName ?? "min-h-[65svh] sm:min-h-[70svh] lg:min-h-[78svh]",
    };

    const overlayNode: React.ReactNode =
        banner.overlay ? (
            <>
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


    return (
        <Layout pageTitle="Home" hideCTA>
            <Head>
                <title>Abraham of London • Home</title>
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

            {/* HERO */}
            <HeroBanner
                poster={banner.poster}
                videoSources={banner.videoSources}
                overlay={overlayNode}
                mobileObjectPositionClass="object-left md:object-[30%_center] lg:object-[40%_center]"
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
                                slug={p.slug}
                                title={p.title}
                                date={p.date ?? undefined} 
                                excerpt={p.excerpt ?? undefined}
                                coverImage={p.coverImage ?? undefined}
                                author={p.author ?? undefined}
                                readTime={p.readTime ?? undefined}
                                category={p.category ?? undefined}
                                tags={p.tags ?? undefined}
                                coverAspect={(p.coverAspect as any) ?? "book"}
                                coverFit={(p.coverFit as any) ?? (p.coverAspect === "book" ? "contain" : "cover")}
                                coverPosition={(p.coverPosition as any) ?? "center"}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Books */}
            <section className="bg-white px-4 py-16">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-8 flex items-end justify-between">
                        <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Books</h2>
                        <Link href={booksHref} className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold" prefetch={false}>
                            View all
                        </Link>
                    </header>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Static/Manual Book Cards (assumed for styling integrity) */}
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

            {/* Downloads — grid */}
            <section className="bg-white px-4 pb-4">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-6">
                        <h2 className="font-serif text-2xl font-semibold text-deepCharcoal">Downloads</h2>
                        <p className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
                            Practical tools to help you lead with clarity.
                        </p>
                    </header>
                    
                    {downloads.length > 0 ? (
                        <DownloadsGrid items={downloads} columns={2} className="mt-2" />
                    ) : (
                         <p className="text-sm text-[color:var(--color-on-secondary)/0.7] mt-2">No downloads are currently available.</p>
                    )}
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

                    {eventsTeaser.length > 0 ? (
                        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {eventsTeaser.map((ev) => (
                                <li key={ev.slug}>
                                    <EventCard
                                        slug={ev.slug}
                                        title={ev.title}
                                        date={ev.date}
                                        location={ev.location ?? undefined}
                                        description={ev.description ?? undefined}
                                        tags={ev.tags ?? undefined}
                                        heroImage={ev.heroImage ?? undefined}
                                        resources={ev.resources ?? undefined}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-sm text-[color:var(--color-on-secondary)/0.7]">No upcoming events scheduled at this time.</p>
                    )}
                </div>
            </section>

            {/* Ventures */}
            <section className="bg-white px-4 py-16">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-8">
                        <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Ventures</h2>
                        <p className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
                            A portfolio built on craftsmanship, stewardship, and endurance.
                        </p>
                    </header>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Link href="/ventures?brand=alomarada" className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover" prefetch={false}>
                            <div className="flex items-center justify-between">
                                <p className="font-serif text-xl font-semibold text-deepCharcoal">Alomarada</p>
                                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.85]">
                                Strategy & capital—focused on durable businesses with moral clarity and operational discipline.
                            </p>
                        </Link>

                        <Link href="/ventures?brand=endureluxe" className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover" prefetch={false}>
                            <div className="flex items-center justify-between">
                                <p className="font-serif text-xl font-semibold text-deepCharcoal">Endureluxe</p>
                                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.85]">
                                Essential goods and refined experiences—engineered to last, designed to serve.
                            </p>
                        </Link>

                        <Link href="/about" className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover" prefetch={false}>
                            <div className="flex items-center justify-between">
                                <p className="font-serif text-xl font-semibold text-deepCharcoal">Abraham of London</p>
                                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.85]">
                                Writing, counsel, and cultural work at the intersection of family, enterprise, and society.
                            </p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Closing CTA */}
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
                    <h3 className="font-serif text-3xl font-semibold text-cream">Build with Clarity. Lead with Standards. Leave a Legacy.</h3>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-on-primary)/0.85]">
                        Start a conversation that moves your family, your venture, and your community forward.
                    </p>
                    <div className="mt-8">
                        <Link href="/contact" className="rounded-full bg-softGold px-7 py-3 text-sm font-semibold text-deepCharcoal transition hover:brightness-95" prefetch={false}>
                            Connect with a Strategist
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}/Layout>
    );
}{false}>
                            Connect with a Strategist
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}Image = String(e.slug).replace(/[–—].*$/, "");
        const heroImage = `/assets/images/events/${baseForImage}.jpg`;
        
        // e.resources now holds the array of ResourceLink objects (or null) because 
        // it was included in the map inside the 'deduped' variable construction above.
        const resources = (e.resources ?? null) as EventResources | null;
        
        const safeResources = resources ? {
            // Use nullish coalescing to convert any nested 'undefined' properties to 'null'
            downloads: resources.downloads ?? null,
            reads: resources.reads ?? null,
        } : null;

        return {
            slug: e.slug,
            title: e.title,
            date: e.date,
            location: e.location ?? null,
            description: e.summary ?? null,
            tags: Array.isArray(e.tags) ? e.tags : null,
            heroImage,
            resources: safeResources, // Now passes the structure expected by EventCard
        };
    });

    // Note: postsCount in the component will reflect the length of safePosts (max 3)
    return { props: { posts: safePosts, booksCount, eventsTeaser }, revalidate: 3600 };
}