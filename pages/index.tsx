// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  PackageCheck,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import { HeroBanner } from "@/components/InteractiveElements";
import NewsletterForm from "@/components/NewsletterForm";
import { pickEnvUrl, ENV_KEYS } from "@/lib/utils";

const siteTitle = "Abraham of London";
const siteTagline =
  "Faith-rooted strategy for fathers, founders, and board-level leaders who refuse to outsource responsibility.";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";

// ============================================================================
// FEATURED CONTENT (fallbacks, used only if no posts are found at build time)
// ============================================================================

// Fallback blog posts – used only if Contentlayer has no posts
const fallbackFeaturedPosts = [
  {
    slug: "when-the-storm-finds-you",
    title: "When the Storm Finds You",
    excerpt:
      "Life's deepest storms don't wait for your consent. What you build before the rain determines if you'll still be standing after it passes.",
    tag: "Resilience",
  },
  {
    slug: "lessons-from-noah",
    title: "Lessons from Noah – Fathers Who Listen, Hear, and Build",
    excerpt:
      "Noah was a listener, a builder, and a father. Patterns for today's man who still believes in covenant and consequence.",
    tag: "Fatherhood",
  },
];

// Books
const featuredBooks = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear: The Story They Thought They Knew",
    status: "In development",
    blurb:
      "A real memoir before it becomes an ecosystem – a father navigating injustice, identity, legacy, and the system that hoped he'd disappear quietly.",
  },
];

// Events
const featuredEvents = [
  {
    slug: "leadership-workshop",
    title: "Strategic Leadership Workshop",
    dateLabel: "12 Sep 2026 · London",
    location: "London, UK",
    blurb:
      "A masterclass on strategy for founders and leaders who want clarity, not clichés.",
  },
  {
    slug: "fathers-and-futures",
    title: "Fathers & Futures Panel",
    dateLabel: "11 Nov 2026 · Online",
    location: "Online",
    blurb:
      "A live virtual conversation exploring fatherhood, system shocks, and building legacy in a culture fighting against both.",
  },
];

// Downloads & resources
const featuredDownloads = [
  {
    slug: "entrepreneur-survival-checklist",
    title: "Entrepreneur Survival Checklist",
    tag: "Execution",
    blurb:
      "Stay grounded and effective when everything goes wrong at once. Principles over panic.",
  },
  {
    slug: "brotherhood-covenant",
    title: "Brotherhood Covenant",
    tag: "Brotherhood",
    blurb:
      "Turn a casual men's meetup into a circle of accountability that fights for each other's future.",
  },
  {
    slug: "principles-for-my-son",
    title: "Principles for My Son",
    tag: "Fatherhood",
    blurb:
      "A working set of principles for raising a boy who becomes a man of conviction in a confused age.",
  },
];

// ============================================================================
// Support content: ventures, testimonials etc.
// ============================================================================

// Venture URLs (live or fallback)
const alomaradaUrl = pickEnvUrl(
  [ENV_KEYS.ALOMARADA_URL],
  "https://alomarada.com/",
);

const endureluxeUrl = pickEnvUrl(
  [ENV_KEYS.ENDURELUXE_URL],
  "https://alomarada.com/endureluxe",
);

const innovateHubUrl = pickEnvUrl(
  [ENV_KEYS.INNOVATEHUB_URL, ENV_KEYS.INNOVATEHUB_ALT_URL],
  "https://alomarada.com/hub",
);

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
      "Durable luxury performance gear for people who build, train, and endure – without compromising on quality or aesthetics.",
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

// Framer Motion variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// ============================================================================
// Types & data loading
// ============================================================================

type HomePagePost = {
  slug: string;
  title: string;
  excerpt: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[] | null;
};

type HomePageProps = {
  posts: HomePagePost[];
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Return empty posts array - fallback content will be displayed
  return {
    props: { posts: [] },
    revalidate: 3600,
  };
};

// ============================================================================
// Page component
// ============================================================================

const HomePage: React.FC<HomePageProps> = ({ posts }) => {
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

  return (
    <Layout title={siteTitle}>
      <Head>
        <title>
          {siteTitle} | Faithful Strategy for Builders, Founders & Fathers
        </title>
        <meta name="description" content={siteTagline} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* HERO BANNER */}
      <main className="min-h-screen bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
        <HeroBanner
          title="Strategy for kings, fathers & builders."
          subtitle="A premium hub for board-level thinking, founder discipline, and unapologetic fatherhood – for men who still believe in duty, consequence, and legacy."
          backgroundImage="/assets/images/abraham-of-london-banner.webp"
          overlayOpacity={0.6}
          height="85vh"
          ctaText="Access strategic downloads"
          ctaOnClick={handleHeroCTAClick}
          textAlign="left"
          eyebrow="Abraham of London"
        />

        {/* PRIORITY CONTENT */}
        <section className="mx-auto max-w-6xl space-y-16 px-4 py-24">
          {/* 1. BLOG POSTS (Priority) */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-white">
                Latest writing
              </h2>
              <Link
                href="/content"
                className="text-sm font-semibold text-softGold underline-offset-4 hover:underline"
              >
                View all posts
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {fallbackFeaturedPosts.map((post) => (
                <motion.article
                  key={post.slug}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                    {post.tag}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-200">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/${post.slug}`}
                    className="mt-4 inline-flex items-center text-xs font-semibold text-softGold underline-offset-4 hover:underline"
                  >
                    Read article
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>

          {/* 2. BOOKS */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-white">
                Books & manuscripts
              </h2>
              <Link
                href="/books"
                className="text-sm font-semibold text-softGold underline-offset-4 hover:underline"
              >
                View all books
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {featuredBooks.map((book) => (
                <motion.article
                  key={book.slug}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-softGold" />
                      <h3 className="font-serif text-lg font-semibold text-white">
                        {book.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-amber-100/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      {book.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-200">{book.blurb}</p>
                  <Link
                    href={`/books/${book.slug}`}
                    className="mt-4 inline-flex items-center text-xs font-semibold text-softGold underline-offset-4 hover:underline"
                  >
                    View book page
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>

          {/* 3. EVENTS */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-white">
                Events & gatherings
              </h2>
              <Link
                href="/events"
                className="text-sm font-semibold text-softGold underline-offset-4 hover:underline"
              >
                View all events
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {featuredEvents.map((ev) => (
                <motion.article
                  key={ev.slug}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-300">
                    {ev.dateLabel}
                  </p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-white">
                    {ev.title}
                  </h3>
                  {ev.location && (
                    <p className="mt-1 text-xs text-gray-300">
                      <span aria-hidden>📍 </span>
                      {ev.location}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-gray-200">{ev.blurb}</p>
                  <Link
                    href={`/events/${ev.slug}`}
                    className="mt-4 inline-flex items-center text-xs font-semibold text-softGold underline-offset-4 hover:underline"
                  >
                    View event
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>

          {/* 4. DOWNLOADS */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-white">
                Strategic downloads
              </h2>
              <Link
                href="/downloads"
                className="text-sm font-semibold text-softGold underline-offset-4 hover:underline"
              >
                View all downloads
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredDownloads.map((dl) => (
                <motion.article
                  key={dl.slug}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-softGold">
                    {dl.tag}
                  </p>
                  <h3 className="mt-2 font-serif text-base font-semibold text-white">
                    {dl.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs text-gray-200">
                    {dl.blurb}
                  </p>
                  <Link
                    href={`/downloads/${dl.slug}`}
                    className="mt-3 inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-softGold underline-offset-4 hover:underline"
                  >
                    Open download page
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* STRATEGIC VENTURES */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Strategic Ventures
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
              Disciplined, faith-rooted initiatives built to create lasting
              impact, not just headlines. Every venture is a conviction in
              action.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {ventures.map((venture) => (
              <motion.div
                key={venture.slug}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-softGold/10 p-3">
                    <venture.icon className="h-6 w-6 text-softGold" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      venture.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : venture.status === "Emerging"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {venture.status}
                  </span>
                </div>

                <h3 className="mb-2 font-serif text-xl font-semibold text-white">
                  {venture.name}
                </h3>
                <p className="mb-4 text-sm text-gray-300">
                  {venture.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-softGold">
                    {venture.focus}
                  </span>
                  <a
                    href={venture.href}
                    className="group inline-flex items-center text-sm font-semibold text-softGold hover:text-softGold/80"
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
        </section>

        {/* NEWSLETTER */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-deepCharcoal via-black to-forest/40 p-8 text-center shadow-2xl shadow-black/70">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-softGold" />
            <h2 className="mb-3 font-serif text-2xl font-semibold text-white md:text-3xl">
              Weekly building notes
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-gray-200 md:text-base">
              Get early access to new frameworks, tools, and insights on faith,
              fatherhood, and legacy-driven leadership.
            </p>

            <NewsletterForm />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default HomePage;