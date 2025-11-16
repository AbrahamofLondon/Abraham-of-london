// pages/index.tsx

import * as React from "react";
import type {
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen,
  Quote,
  Building2,
  PackageCheck,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import { HeroBanner } from "@/components/InteractiveElements";
import NewsletterForm from "@/components/NewsletterForm";
import AnimatedCounter from "@/components/AnimatedCounter";

// Content components
import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";
import DownloadCard from "@/components/DownloadCard";

// Data loaders
import { getAllPosts } from "@/lib/posts";
import { getAllBooks } from "@/lib/books";
import { getAllEvents } from "@/lib/events";
import { getAllDownloads } from "@/lib/downloads";

import { pickEnvUrl, ENV_KEYS } from "@/lib/utils";

const siteTitle = "Abraham of London";
const siteTagline =
  "Faith-rooted strategy for fathers, founders, and board-level leaders who refuse to outsource responsibility.";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* Types & normalisers                                                        */
/* -------------------------------------------------------------------------- */

type HomePost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  tags?: string[] | null;
  author?:
    | { name?: string | null; picture?: string | null }
    | string
    | null;
};

type HomeBook = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | null;
  buyLink?: string | null;
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  featured?: boolean;
};

type HomeEvent = {
  slug: string;
  title: string;
  date?: string | null;
  location?: string | null;
  description?: string | null;
};

type HomeDownload = {
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  coverImage?: string | null;
};

type HomeStaticProps = {
  posts: HomePost[];
  books: HomeBook[];
  events: HomeEvent[];
  downloads: HomeDownload[];
};

function ensureArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toIsoDate(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (input instanceof Date) return input.toISOString();
  return null;
}

function normalisePosts(input: unknown): HomePost[] {
  return ensureArray<any>(input)
    .map((p) => {
      const slug = p?.slug;
      if (!slug || typeof slug !== "string") return null;

      const date = toIsoDate(p.date ?? p.publishedAt);
      const author =
        typeof p.author === "string"
          ? p.author
          : p.author && typeof p.author === "object"
          ? {
              name: p.author.name ?? "Abraham of London",
              picture: p.author.picture ?? null,
            }
          : "Abraham of London";

      return {
        slug,
        title: String(p.title ?? "Untitled"),
        excerpt: p.excerpt ?? null,
        coverImage:
          typeof p.coverImage === "string" ? p.coverImage : null,
        date,
        readTime:
          typeof p.readTime === "number" || typeof p.readTime === "string"
            ? p.readTime
            : null,
        tags: Array.isArray(p.tags)
          ? p.tags.map((t: any) => String(t))
          : null,
        author,
      } satisfies HomePost;
    })
    .filter(Boolean) as HomePost[];
}

function normaliseBooks(input: unknown): HomeBook[] {
  return ensureArray<any>(input)
    .map((b) => {
      const slug = b?.slug;
      if (!slug || typeof slug !== "string") return null;

      return {
        slug,
        title: String(b.title ?? "Untitled"),
        author: String(b.author ?? "Abraham of London"),
        excerpt: String(
          b.excerpt ??
            b.description ??
            "Forthcoming title from Abraham of London."
        ),
        coverImage:
          typeof b.coverImage === "string" ? b.coverImage : null,
        buyLink: typeof b.buyLink === "string" ? b.buyLink : null,
        genre: String(b.genre ?? "Legacy & Leadership"),
        downloadPdf:
          typeof b.downloadPdf === "string" ? b.downloadPdf : null,
        downloadEpub:
          typeof b.downloadEpub === "string" ? b.downloadEpub : null,
        featured: Boolean(b.featured),
      } satisfies HomeBook;
    })
    .filter(Boolean) as HomeBook[];
}

function normaliseEvents(input: unknown): HomeEvent[] {
  return ensureArray<any>(input)
    .map((e) => {
      const slug = e?.slug;
      if (!slug || typeof slug !== "string") return null;

      return {
        slug,
        title: String(e.title ?? "Event"),
        date: toIsoDate(e.date ?? e.startDate),
        location:
          typeof e.location === "string"
            ? e.location
            : typeof e.venue === "string"
            ? e.venue
            : null,
        description:
          typeof e.description === "string"
            ? e.description
            : typeof e.excerpt === "string"
            ? e.excerpt
            : null,
      } satisfies HomeEvent;
    })
    .filter(Boolean) as HomeEvent[];
}

function normaliseDownloads(input: unknown): HomeDownload[] {
  return ensureArray<any>(input)
    .map((d) => {
      const slug = d?.slug;
      if (!slug || typeof slug !== "string") return null;

      return {
        slug,
        title: String(d.title ?? "Download"),
        description:
          typeof d.description === "string"
            ? d.description
            : typeof d.excerpt === "string"
            ? d.excerpt
            : null,
        category:
          typeof d.category === "string"
            ? d.category
            : typeof d.type === "string"
            ? d.type
            : null,
        coverImage:
          typeof d.coverImage === "string" ? d.coverImage : null,
      } satisfies HomeDownload;
    })
    .filter(Boolean) as HomeDownload[];
}

/* -------------------------------------------------------------------------- */
/* getStaticProps                                                             */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomeStaticProps> = async () => {
  const [postsRaw, booksRaw, eventsRaw, downloadsRaw] = await Promise.all([
    Promise.resolve(getAllPosts?.() ?? []),
    Promise.resolve(getAllBooks?.() ?? []),
    Promise.resolve(getAllEvents?.() ?? []),
    Promise.resolve(getAllDownloads?.() ?? []),
  ]);

  // Sort posts by date desc, events by date asc
  const posts = normalisePosts(postsRaw).sort((a, b) => {
    const ka = a.date ? new Date(a.date).valueOf() : 0;
    const kb = b.date ? new Date(b.date).valueOf() : 0;
    return kb - ka;
  });

  const books = normaliseBooks(booksRaw);
  const events = normaliseEvents(eventsRaw).sort((a, b) => {
    const ka = a.date ? new Date(a.date).valueOf() : Number.MAX_SAFE_INTEGER;
    const kb = b.date ? new Date(b.date).valueOf() : Number.MAX_SAFE_INTEGER;
    return ka - kb;
  });

  const downloads = normaliseDownloads(downloadsRaw);

  return {
    props: {
      posts,
      books,
      events,
      downloads,
    },
    revalidate: 1800, // 30 minutes
  };
};

/* -------------------------------------------------------------------------- */
/* Static venture config                                                      */
/* -------------------------------------------------------------------------- */

// Venture URLs with environment-aware fallbacks
const alomaradaUrl = pickEnvUrl(
  [ENV_KEYS.ALOMARADA_URL],
  "https://alomarada.com/"
);

const endureluxeUrl = pickEnvUrl(
  [ENV_KEYS.ENDURELUXE_URL],
  "https://alomarada.com/endureluxe"
);

const innovateHubUrl = pickEnvUrl(
  [ENV_KEYS.INNOVATEHUB_URL, ENV_KEYS.INNOVATEHUB_ALT_URL],
  "https://alomarada.com/hub"
);

// Venture data structure
const ventures = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    description:
      "Board-level advisory, operating systems, and market-entry strategy for Africa-focused founders, boards, and institutions.",
    icon: Building2,
    href: alomaradaUrl,
    status: "Active",
    focus: "Strategic Advisory & Market Systems",
    externalLabel: "Visit Alomarada.com",
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    description:
      "Durable luxury performance gear for people who train, build, and endure – without compromising on quality or aesthetics.",
    icon: PackageCheck,
    href: endureluxeUrl,
    status: "In development",
    focus: "Performance & Durable Luxury",
    externalLabel: "Explore Endureluxe",
  },
  {
    name: "Innovative Hub",
    slug: "innovative-hub",
    description:
      "A practical innovation lab – content, cohorts, and tools for builders who want to test ideas, ship value, and stay accountable.",
    icon: Lightbulb,
    href: innovateHubUrl,
    status: "Emerging",
    focus: "Innovation & Capability Building",
    externalLabel: "Enter the Hub",
  },
];

// Motion variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const testimonials = [
  {
    quote:
      "Abraham has walked these paths, forged in fire, yet still leads with kindness and truth. Every interaction with him – in how he lives, works, and loves – challenges me to reject what is popular but wrong and refuse the comfort of an average life.",
    author: "Moyosore A",
    role: "Senior Internal Auditor, Bank of Canada",
  },
  {
    quote:
      "The entrepreneur survival checklist kept my head straight in a quarter where everything broke at once. No fluff – just disciplined execution.",
    author: "James R.",
    role: "Founder, Tech Startup",
  },
  {
    quote:
      "It's rare to see faith, fatherhood, and board-level strategy handled with this level of clarity and honesty.",
    author: "Michael T.",
    role: "Executive Director",
  },
  {
    quote:
      "The brotherhood covenant turned a casual men's group into a committed circle of accountability.",
    author: "David L.",
    role: "Church Leader",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Page component                                                             */
/* -------------------------------------------------------------------------- */

type HomePageProps = InferGetStaticPropsType<typeof getStaticProps>;

const HomePage: React.FC<HomePageProps> = ({
  posts,
  books,
  events,
  downloads,
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteTitle,
    url: siteUrl,
    description: siteTagline,
    founder: {
      "@type": "Person",
      name: "Abraham of London",
    },
    knowsAbout: [
      "Christian leadership",
      "Strategic planning",
      "Fatherhood",
      "Legacy building",
      "Business strategy",
      "Faith-based entrepreneurship",
    ],
    makesOffer: {
      "@type": "Service",
      name: "Strategic Resources for Leaders, Fathers and Builders",
      description: siteTagline,
    },
  };

  const handleHeroCTAClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/downloads";
    }
  };

  // Select slices for homepage display
  const latestPosts = posts.slice(0, 3);
  const featuredBooks = books.slice(0, 2);
  const nextEvents = events.slice(0, 3);
  const keyDownloads = downloads.slice(0, 4);

  return (
    <Layout title={siteTitle}>
      <Head>
        <title>
          {siteTitle} | Faithful Strategy for Builders, Founders & Fathers
        </title>
        <meta name="description" content={siteTagline} />

        {/* Open Graph */}
        <meta
          property="og:title"
          content={`${siteTitle} | Building Fathers, Founders & Faithful Leaders`}
        />
        <meta property="og:description" content={siteTagline} />
        <meta
          property="og:image"
          content={`${siteUrl}/assets/images/social/og-image.jpg`}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@abrahamoflondon" />
        <meta
          name="twitter:title"
          content={`${siteTitle} | Faithful Strategy for Builders, Founders & Fathers`}
        />
        <meta name="twitter:description" content={siteTagline} />
        <meta
          name="twitter:image"
          content={`${siteUrl}/assets/images/social/og-image.jpg`}
        />

        {/* Canonical */}
        <link rel="canonical" href={siteUrl} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
        {/* HERO BANNER SECTION */}
        <HeroBanner
          title="Strategy for kings, fathers & builders."
          subtitle="A premium hub for board-level thinking, founder discipline, and unapologetic fatherhood – for men who still believe in duty, consequence, and legacy."
          backgroundImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          overlayOpacity={0.6}
          height="85vh"
          textAlign="left"
          ctaText="Access strategic downloads"
          ctaOnClick={handleHeroCTAClick}
          showConnectionStatus={true}
          eyebrow="Abraham of London"
        >
          {/* Additional content below CTA */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300">
            <Link
              href="/about"
              className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
              prefetch={true}
            >
              About Abraham
            </Link>
            <span className="select-none text-gray-500">•</span>
            <Link
              href="/contact"
              className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
              prefetch={true}
            >
              Speak with Abraham
            </Link>
            <span className="select-none text-gray-500">•</span>
            <Link
              href="/downloads/brotherhood-starter-kit"
              className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
              prefetch={true}
            >
              Brotherhood starter kit
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-8 flex flex-wrap gap-6 border-t border-white/20 pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-softGold">
                <AnimatedCounter
                  end={25}
                  duration={2}
                  className="font-mono"
                  suffix=""
                />
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Strategic tools
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-forest">
                <AnimatedCounter
                  end={500}
                  duration={2.5}
                  className="font-mono"
                  suffix=""
                />
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Men equipped
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-softGold">
                <AnimatedCounter
                  end={12}
                  duration={1.5}
                  className="font-mono"
                  suffix=""
                />
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Brotherhood circles
              </p>
            </div>
          </div>
        </HeroBanner>

        {/* MAIN CONTENT SECTION */}
        <section className="relative z-10 -mt-20 bg-gradient-to-b from-transparent via-deepCharcoal/80 to-deepCharcoal pb-20 pt-32">
          {/* Hero card - positioned over the hero banner */}
          <motion.div
            className="mx-auto max-w-6xl px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/80 p-5 shadow-2xl shadow-black/60 backdrop-blur lg:float-right lg:-mt-64">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
                  Fathering Without Fear
                </p>
                <span className="rounded-full bg-softGold/10 px-3 py-1 text-[11px] font-medium text-softGold">
                  In development
                </span>
              </div>

              <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="/assets/images/abraham-of-london-banner.webp"
                  alt="Abraham of London – Fathering Without Fear book cover"
                  fill
                  className="object-cover opacity-0 transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    img.classList.remove("opacity-0");
                  }}
                />
              </div>

              <h2 className="mb-2 font-serif text-2xl font-semibold text-white">
                Fathering Without Fear:
                <span className="block text-softGold">
                  The story they thought they knew.
                </span>
              </h2>

              <p className="mb-4 text-sm leading-relaxed text-gray-200">
                First, a memoir – drawn from real lived experiences, life battle
                notes, and the quiet moments in between – tracing a father who
                refused to disappear quietly. From that story grows the tools,
                downloads, and brotherhood for men who still intend to stand,
                even when the system leans the other way.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/downloads/brotherhood-covenant"
                  className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-forest/30 transition-all hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-deepCharcoal"
                  prefetch={true}
                >
                  View brotherhood covenant
                </Link>
                <Link
                  href="/downloads/principles-for-my-son"
                  className="text-xs font-medium text-softGold underline-offset-4 hover:underline focus:outline-none focus:underline"
                  prefetch={true}
                >
                  Principles for my son
                </Link>
              </div>

              <p className="mt-6 select-none text-right text-[10px] font-light tracking-[0.35em] text-gray-400">
                ABRAHAMOFLONDON
              </p>
            </div>
          </motion.div>

          {/* Divider strip */}
          <div className="mx-auto mt-20 max-w-6xl border-t border-white/10 bg-black/40 px-4 py-6">
            <div className="flex flex-wrap justify-between gap-4 text-xs text-gray-300 md:text-sm">
              <p className="select-none text-xs uppercase tracking-[0.25em] text-gray-400">
                Strategy • Fatherhood • Legacy • Faith
              </p>
              <p className="select-none text-gray-500">
                Designed to be read slowly. Lived fully.
              </p>
            </div>
          </div>
        </section>

        {/* STRATEGIC VENTURES */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-12 text-center">
            <motion.h2
              className="mb-4 font-serif text-3xl font-semibold text-white md:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Strategic Ventures
            </motion.h2>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Disciplined, faith-rooted initiatives built to create sustainable
              impact, not just headlines. Each venture is a focused expression
              of the same core conviction: truth, responsibility, and legacy.
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {ventures.map((venture, index) => (
              <motion.div
                key={venture.slug}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-forest/20 p-3">
                    <venture.icon className="h-6 w-6 text-forest" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      venture.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : venture.status === "Emerging"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {venture.status}
                  </span>
                </div>

                <h3 className="mb-3 font-serif text-xl font-semibold text-white">
                  {venture.name}
                </h3>

                <p className="mb-4 leading-relaxed text-gray-300">
                  {venture.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-forest">
                    {venture.focus}
                  </span>
                  <a
                    href={venture.href}
                    className="group inline-flex items-center text-sm font-semibold text-softGold transition-colors hover:text-softGold/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {venture.externalLabel}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/ventures"
              className="inline-flex items-center rounded-full border border-softGold/40 px-6 py-3 text-sm font-semibold text-softGold transition-all hover:border-softGold hover:bg-softGold/5"
              prefetch={true}
            >
              Explore all ventures
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </section>

        {/* LATEST CONTENT: Posts + Downloads + Books + Events */}
        <section className="mx-auto max-w-6xl px-4 py-16 border-t border-white/10/50">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            {/* Left column: Insights & tools */}
            <div>
              <h2 className="mb-4 font-serif text-2xl font-semibold text-white">
                Latest insights & tools
              </h2>
              <p className="mb-6 text-sm text-gray-300">
                A running log of essays, field notes, and practical downloads
                for fathers, founders, and board-level leaders.
              </p>

              {/* Latest posts */}
              {latestPosts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Recent insights
                    </h3>
                    <Link
                      href="/blog"
                      className="text-xs font-medium text-softGold underline-offset-4 hover:underline"
                      prefetch={true}
                    >
                      View all posts
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {latestPosts.map((post) => (
                      <BlogPostCard key={post.slug} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* Key downloads */}
              {keyDownloads.length > 0 && (
                <div className="mt-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Strategic downloads
                    </h3>
                    <Link
                      href="/downloads"
                      className="text-xs font-medium text-softGold underline-offset-4 hover:underline"
                      prefetch={true}
                    >
                      View all downloads
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {keyDownloads.map((d) => (
                      <DownloadCard
                        key={d.slug}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-softGold/40 hover:bg-white/10 transition"
                      >
                        <Link
                          href={`/downloads/${encodeURIComponent(d.slug)}`}
                          prefetch={true}
                          className="block"
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                            {d.category || "Download"}
                          </p>
                          <h4 className="mt-1 font-serif text-lg text-white">
                            {d.title}
                          </h4>
                          {d.description && (
                            <p className="mt-2 line-clamp-3 text-xs text-gray-300">
                              {d.description}
                            </p>
                          )}
                        </Link>
                      </DownloadCard>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Books & events */}
            <div className="space-y-10">
              {/* Books */}
              {featuredBooks.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Forthcoming books
                  </h3>
                  <div className="space-y-4">
                    {featuredBooks.map((book) => (
                      <BookCard
                        key={book.slug}
                        slug={book.slug}
                        title={book.title}
                        author={book.author}
                        excerpt={book.excerpt}
                        coverImage={book.coverImage ?? undefined}
                        buyLink={book.buyLink}
                        genre={book.genre}
                        downloadPdf={book.downloadPdf}
                        downloadEpub={book.downloadEpub}
                        featured={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {nextEvents.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Upcoming events
                  </h3>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    {nextEvents.map((ev) => {
                      const dateLabel =
                        ev.date &&
                        new Date(ev.date).toString() !== "Invalid Date"
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(ev.date))
                          : null;

                      return (
                        <Link
                          key={ev.slug}
                          href={`/events/${encodeURIComponent(ev.slug)}`}
                          prefetch={true}
                          className="flex items-start justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white/10"
                        >
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              {dateLabel || "TBC"}
                            </p>
                            <p className="text-sm font-semibold text-white">
                              {ev.title}
                            </p>
                            {ev.location && (
                              <p className="text-xs text-gray-300">
                                {ev.location}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 text-softGold" />
                        </Link>
                      );
                    })}
                    <div className="pt-2 text-right">
                      <Link
                        href="/events/leadership-workshop"
                        className="text-xs font-medium text-softGold underline-offset-4 hover:underline"
                        prefetch={true}
                      >
                        View event details
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-center">
          <p className="select-none text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Trusted by leaders at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all hover:grayscale-0">
            <div className="h-8 w-32 rounded bg-white/10" aria-hidden="true" />
            <div className="h-8 w-32 rounded bg-white/10" aria-hidden="true" />
            <div className="h-8 w-32 rounded bg-white/10" aria-hidden="true" />
            <div className="h-8 w-32 rounded bg-white/10" aria-hidden="true" />
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mx-auto max-w-6xl space-y-8 px-4 pb-10">
          <h2 className="text-center font-serif text-2xl font-semibold text-white md:text-3xl">
            Trusted by builders and leaders
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, index) => (
              <motion.div
                key={`${t.author}-${index}`}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="absolute -top-3 left-6 rounded-full bg-black p-1">
                  <Quote
                    className="h-5 w-5 text-softGold/60"
                    aria-hidden="true"
                  />
                </div>
                <p className="mb-4 text-sm italic text-gray-100/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-softGold">
                    {t.author}
                  </p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-deepCharcoal via-black to-forest/40 p-8 text-center shadow-2xl shadow-black/70 md:p-10">
            <div className="mx-auto max-w-2xl">
              <BookOpen
                className="mx-auto mb-4 h-10 w-10 text-softGold"
                aria-hidden="true"
              />
              <h2 className="mb-3 font-serif text-2xl font-semibold text-white md:text-3xl">
                Weekly building notes
              </h2>
              <p className="mx-auto mb-6 max-w-xl text-sm text-gray-200 md:text-base">
                Get frameworks, early access to new tools, and practical
                patterns for building faith, family, and business without
                compromise.
              </p>

              <NewsletterForm />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="mx-auto max-w-3xl rounded-3xl border border-softGold/40 bg-gradient-to-r from-forest/90 via-forest to-softGold/80 px-6 py-8 text-center shadow-2xl shadow-black/60 md:px-10 md:py-12">
            <div className="mb-4 flex justify-center">
              <div className="flex -space-x-2" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-forest bg-forest/20"
                  />
                ))}
              </div>
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.25em] text-forest/90">
              You&apos;re not the only one carrying weight.
            </p>
            <p className="mb-3 text-sm text-forest/90">
              Join 500+ builders already using these tools.
            </p>
            <h2 className="mb-4 font-serif text-2xl font-semibold text-slate-950 md:text-3xl">
              You&apos;re not here by accident.
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-slate-900/90 md:text-base">
              If you&apos;re still reading, you&apos;re the type of man who doesn&apos;t
              flinch when it&apos;s time to take responsibility. Use the tools. Build
              the systems. Protect the people who carry your name.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/downloads/entrepreneur-survival-checklist"
                className="inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-softGold shadow-md shadow-black/40 transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-forest"
                prefetch={true}
              >
                Start with the survival checklist
              </Link>
              <Link
                href="/downloads/brotherhood-covenant"
                className="inline-flex items-center rounded-full border border-slate-900/60 bg-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-950 transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-forest"
                prefetch={true}
              >
                Build a brotherhood
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default HomePage;