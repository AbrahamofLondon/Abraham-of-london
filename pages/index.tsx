// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { GetStaticProps } from "next";
import { motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  PackageCheck,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Star,
  Shield,
  Target,
  Crown,
  Users,
  Calendar,
  Download,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import { HeroBanner } from "@/components/InteractiveElements";
import NewsletterForm from "@/components/NewsletterForm";
import { pickEnvUrl, ENV_KEYS } from "@/lib/utils";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

const siteTitle = "Abraham of London";
const siteTagline =
  "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";

// ============================================================================
// TYPES
// ============================================================================

type HomePagePost = {
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  readTime: string | null;
  image: string | null;
  featured?: boolean;
};

type HomePageProps = {
  posts: HomePagePost[];
};

// ============================================================================
// PREMIUM CONTENT DATA (FALLBACKS)
// ============================================================================

const fallbackFeaturedPosts: HomePagePost[] = [
  {
    slug: "when-the-storm-finds-you",
    title: "When the Storm Finds You",
    excerpt:
      "Life's deepest storms don't wait for your consent. What you build before the rain determines if you'll still be standing after it passes.",
    tag: "Resilience",
    readTime: "8 min",
    image: "/assets/images/storm-finds-you-preview.jpg",
    featured: true,
  },
  {
    slug: "lessons-from-noah",
    title: "Lessons from Noah – Fathers Who Listen, Hear, and Build",
    excerpt:
      "Noah was a listener, a builder, and a father. Patterns for today's man who still believes in covenant and consequence.",
    tag: "Fatherhood",
    readTime: "12 min",
    image: "/assets/images/noah-lessons-preview.jpg",
    featured: true,
  },
  {
    slug: "the-brotherhood-code",
    title: "The Brotherhood Code",
    excerpt:
      "How to build circles of accountability that withstand pressure and produce legacy.",
    tag: "Brotherhood",
    readTime: "6 min",
    image: "/assets/images/brotherhood-code-preview.jpg",
    featured: false,
  },
];

const featuredBooks = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    subtitle: "The Story They Thought They Knew",
    status: "In Development",
    blurb:
      "A real memoir before it becomes an ecosystem – a father navigating injustice, identity, legacy, and the system that hoped he'd disappear quietly.",
    coverImage: "/assets/images/book-fathering-without-fear.jpg",
    progress: 65,
  },
];

const featuredEvents = [
  {
    slug: "leadership-workshop",
    title: "Strategic Leadership Workshop",
    dateLabel: "12 Sep 2026 · London",
    location: "London, UK",
    blurb:
      "A masterclass on strategy for founders and leaders who want clarity, not clichés.",
    status: "Limited Spots",
    image: "/assets/images/event-leadership-workshop.jpg",
  },
  {
    slug: "fathers-and-futures",
    title: "Fathers & Futures Panel",
    dateLabel: "11 Nov 2026 · Online",
    location: "Online",
    blurb:
      "A live virtual conversation exploring fatherhood, system shocks, and building legacy in a culture fighting against both.",
    status: "Free Access",
    image: "/assets/images/event-fathers-futures.jpg",
  },
];

const featuredDownloads = [
  {
    slug: "entrepreneur-survival-checklist",
    title: "Entrepreneur Survival Checklist",
    tag: "Execution",
    blurb:
      "Stay grounded and effective when everything goes wrong at once. Principles over panic.",
    icon: Shield,
    format: "PDF",
    pages: 12,
  },
  {
    slug: "brotherhood-covenant",
    title: "Brotherhood Covenant",
    tag: "Brotherhood",
    blurb:
      "Turn a casual men's meetup into a circle of accountability that fights for each other's future.",
    icon: Users,
    format: "Template",
    pages: 8,
  },
  {
    slug: "principles-for-my-son",
    title: "Principles for My Son",
    tag: "Fatherhood",
    blurb:
      "A working set of principles for raising a boy who becomes a man of conviction in a confused age.",
    icon: Crown,
    format: "Guide",
    pages: 16,
  },
];

const corePillars = [
  {
    title: "Strategic Fatherhood",
    description:
      "Turning presence, discipline, and affection into a repeatable pattern your children can stand on.",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    stats: "15+ field frameworks",
  },
  {
    title: "Founder Discipline",
    description:
      "Board-level thinking and operating cadence for founders who are tired of firefighting and drift.",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    stats: "12+ years in the trenches",
  },
  {
    title: "Faith-Rooted Leadership",
    description:
      "Conviction over convenience: historic Christian faith applied to modern leadership, without theatrics.",
    icon: Shield,
    color: "from-emerald-500 to-green-500",
    stats: "1000+ leaders served",
  },
];

// Venture URLs
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
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    description:
      "Durable luxury performance gear for people who build, train, and endure – without compromising on quality or aesthetics.",
    icon: PackageCheck,
    href: endureluxeUrl,
    status: "In Development",
    focus: "Performance & Durable Luxury",
    externalLabel: "Explore Endureluxe",
    gradient: "from-orange-500 to-red-500",
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
    gradient: "from-blue-500 to-cyan-500",
  },
];

// "Start here" tiles mapped to existing content
const startHereTiles = [
  {
    label: "If you’re a father",
    title: "Lead at home first",
    description:
      "Start with principles, presence, and patterns your children can feel — not just speeches they can quote.",
    href: "/downloads/principles-for-my-son",
    cta: "Get Fatherhood Blueprint",
    icon: Crown,
  },
  {
    label: "If you’re a founder",
    title: "Build with discipline",
    description:
      "Move from firefighting to operating cadence. Simple, repeatable tools for founders who carry real weight.",
    href: "/downloads/entrepreneur-survival-checklist",
    cta: "Use Survival Checklist",
    icon: Target,
  },
  {
    label: "If you’re a board-level leader",
    title: "Think in systems",
    description:
      "Clarify narrative, focus on value, and steward trust with clean, board-ready communication.",
    href: "/downloads/board-investor-onepager",
    cta: "Download Board One-Pager",
    icon: BookOpen,
  },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// ============================================================================
// DATA: getStaticProps – Safe build without Contentlayer
// ============================================================================

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Return empty posts array - fallback content will be used
  return {
    props: { posts: [] },
    revalidate: 3600,
  };
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

const HomePage: React.FC<HomePageProps> = ({ posts: _posts }) => {
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
  };

  // Use fallback posts for now (until Contentlayer is set up)
  const sourcePosts: HomePagePost[] = fallbackFeaturedPosts;

  const heroPosts = sourcePosts.slice(0, 2);
  const extraPosts = sourcePosts.slice(2);

  const handleHeroCTAClick = () => {
    // Smooth scroll to downloads section
    if (typeof document === "undefined") return;
    const downloadsSection = document.getElementById("start-here");
    downloadsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout title={siteTitle}>
      <Head>
        <title>
          {siteTitle} | Faithful Strategy for Builders, Founders & Fathers
        </title>
        <meta name="description" content={siteTagline} />
        <meta property="og:image" content="/assets/images/og-homepage.jpg" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* PREMIUM HERO SECTION */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-deepCharcoal to-forest/20">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-softGold/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse rounded-full bg-forest/10 blur-3xl delay-1000" />
        </div>

        <HeroBanner
          title={
            <span>
              Strategy for{" "}
              <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                fathers, founders &amp; builders
              </span>
            </span>
          }
          subtitle={
            <>
              A focused home for board-level thinking, founder discipline, and
              unapologetic fatherhood — for men who still believe in duty,
              consequence, and covenant.
            </>
          }
          backgroundImage="/assets/images/abraham-of-london-banner.webp"
          overlayOpacity={0.5}
          height="100vh"
          ctaText="Start with the right tools"
          ctaOnClick={handleHeroCTAClick}
          textAlign="center"
          eyebrow={
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-softGold" />
              Faith · Strategy · Fatherhood
              <Sparkles className="h-4 w-4 text-softGold" />
            </span>
          }
          additionalCTAs={[
            {
              text: "View Latest Writing",
              href: "/content",
              variant: "outline",
            },
          ]}
        />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-softGold/50">
            <div className="mt-2 h-3 w-1 rounded-full bg-softGold/70" />
          </div>
        </motion.div>
      </div>

      {/* SIGNATURE STRIP */}
      <section className="bg-black/95 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-softGold">
              Abraham of London
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl">
              A father, strategist, and board-level advisor who still believes
              character is a calling.
            </h2>
            <p className="mt-3 text-sm text-gray-300 md:text-base">
              I work with men who carry responsibility — for families, teams,
              and markets — and need a clear, faith-anchored way to build
              without losing their soul, their standard, or their sons.
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-2 text-sm text-gray-300 md:mt-0 md:text-right">
            <p>
              <span className="font-semibold text-softGold">Who it’s for:</span>{" "}
              fathers, founders, and board-level leaders.
            </p>
            <p>
              <span className="font-semibold text-softGold">
                What you’ll get:
              </span>{" "}
              field-ready frameworks, not vague motivation.
            </p>
          </div>
        </div>
      </section>

      {/* START HERE SECTION */}
      <section
        id="start-here"
        className="bg-gradient-to-b from-black to-deepCharcoal py-20"
      >
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="mb-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
              Start Where It Matters Most
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-300">
              Whether you’re leading a home, a company, or a boardroom, start
              with one concrete move you can make this week.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {startHereTiles.map((tile) => (
              <motion.div
                key={tile.title}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-softGold/40">
                  <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                    <tile.icon className="h-4 w-4" />
                    <span>{tile.label}</span>
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-bold text-white">
                    {tile.title}
                  </h3>
                  <p className="mb-6 flex-1 text-sm text-gray-300">
                    {tile.description}
                  </p>
                  <Link
                    href={tile.href}
                    className="group/link inline-flex items-center gap-2 text-sm font-semibold text-softGold"
                  >
                    {tile.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CORE PILLARS SECTION */}
      <section className="relative bg-gradient-to-b from-deepCharcoal to-black py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="mb-6 font-serif text-4xl font-bold text-white md:text-5xl">
              Three Pillars of{" "}
              <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                Faithful Strategy
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              One integrated operating system for your{" "}
              <span className="font-semibold text-softGold">
                home, enterprise, and inner life
              </span>{" "}
              — so you stop living three different lives.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {corePillars.map((pillar) => (
              <motion.div
                key={pillar.title}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-softGold/30">
                  {/* Gradient orb */}
                  <div
                    className={`absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${pillar.color} blur-2xl opacity-20 transition-opacity group-hover:opacity-30`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${pillar.color}`}
                    >
                      <pillar.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                      {pillar.title}
                    </h3>

                    <p className="mb-6 leading-relaxed text-gray-300">
                      {pillar.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-softGold">
                        {pillar.stats}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10 transition-colors group-hover:bg-softGold/20">
                        <ArrowRight className="h-4 w-4 text-softGold" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURED WRITING SECTION */}
      <section className="bg-gradient-to-b from-black to-deepCharcoal py-24">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="mb-16 flex items-end justify-between"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div>
              <h2 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
                Latest <span className="text-softGold">Writing</span>
              </h2>
              <p className="max-w-2xl text-xl text-gray-300">
                Strategic insights on fatherhood, leadership, and building
                lasting legacy.
              </p>
            </div>
            <Link
              href="/content"
              className="group hidden items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-6 py-3 text-sm font-semibold text-softGold transition-all hover:bg-softGold/20 hover:gap-3 md:flex"
            >
              View All Articles
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Hero posts (2) */}
          {heroPosts.length > 0 && (
            <motion.div
              className="mb-12 grid gap-8 lg:grid-cols-2"
              variants={staggerChildren}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {heroPosts.map((post) => {
                const imageSrc =
                  post.image ||
                  "/assets/images/abraham-of-london-banner-premium.jpg";

                return (
                  <motion.article
                    key={post.slug}
                    variants={fadeInUp}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-softGold/30"
                  >
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="relative h-80 overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {post.featured && (
                        <div className="absolute left-4 top-4 z-20">
                          <span className="flex items-center gap-1 rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold text-black">
                            <Star className="h-3 w-3" />
                            Featured
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-20 p-8">
                      <div className="mb-4 flex items-center gap-4">
                        {post.tag && (
                          <span className="rounded-full bg-softGold/10 px-3 py-1 text-xs font-semibold text-softGold">
                            {post.tag}
                          </span>
                        )}
                        {post.readTime && (
                          <span className="text-sm text-gray-400">
                            {post.readTime}
                          </span>
                        )}
                      </div>

                      <h3 className="mb-4 font-serif text-2xl font-bold text-white transition-colors group-hover:text-softGold">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="mb-6 line-clamp-2 text-gray-300">
                          {post.excerpt}
                        </p>
                      )}

                      <Link
                        href={`/blog/${post.slug}`}
                        className="group/link inline-flex items-center gap-2 font-semibold text-softGold"
                      >
                        Read Article
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}

          {/* Additional posts grid */}
          {extraPosts.length > 0 && (
            <motion.div
              className="grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              {extraPosts.map((post) => (
                <motion.article
                  key={post.slug}
                  variants={scaleIn}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-softGold/30"
                >
                  <div className="mb-4 flex items-center gap-3">
                    {post.tag && (
                      <span className="rounded-full bg-softGold/10 px-2 py-1 text-xs font-semibold text-softGold">
                        {post.tag}
                      </span>
                    )}
                    {post.readTime && (
                      <span className="text-xs text-gray-400">
                        {post.readTime}
                      </span>
                    )}
                  </div>

                  <h4 className="mb-3 font-serif text-lg font-bold text-white transition-colors group-hover:text-softGold">
                    {post.title}
                  </h4>

                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                      {post.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="group/link inline-flex items-center gap-1 text-sm font-semibold text-softGold"
                  >
                    Read More
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}

          {/* Mobile CTA */}
          <div className="mt-12 text-center md:hidden">
            <Link
              href="/content"
              className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-6 py-3 font-semibold text-softGold transition-all hover:bg-softGold/20"
            >
              View All Articles
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED DOWNLOADS SECTION */}
      <section
        id="featured-downloads"
        className="bg-gradient-to-b from-deepCharcoal to-black py-24"
      >
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
              Strategic <span className="text-softGold">Field Tools</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">
              Plug-and-play PDFs, checklists, and covenants for men who need
              something they can{" "}
              <span className="font-semibold text-softGold">
                print, run, and repeat
              </span>{" "}
              — not just think about.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {featuredDownloads.map((download) => (
              <motion.div
                key={download.slug}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-softGold/30">
                  {/* Icon with gradient */}
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-softGold to-amber-200">
                    <download.icon className="h-7 w-7 text-black" />
                  </div>

                  <div className="flex-1">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-full bg-softGold/10 px-3 py-1 text-xs font-semibold text-softGold">
                        {download.tag}
                      </span>
                      <span className="text-xs text-gray-400">
                        {download.format} • {download.pages} pages
                      </span>
                    </div>

                    <h3 className="mb-4 font-serif text-xl font-bold text-white transition-colors group-hover:text-softGold">
                      {download.title}
                    </h3>

                    <p className="mb-6 flex-1 text-gray-300">
                      {download.blurb}
                    </p>
                  </div>

                  <Link
                    href={`/downloads/${download.slug}`}
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl border border-softGold/30 bg-softGold/10 px-6 py-3 font-semibold text-softGold transition-all hover:bg-softGold/20"
                  >
                    <Download className="h-4 w-4" />
                    Download Resource
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Link
              href="/downloads"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-softGold to-amber-200 px-8 py-4 font-bold text-black transition-all hover:shadow-lg hover:shadow-softGold/25"
            >
              Explore All Resources
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BOOKS & EVENTS SECTION */}
      <section className="bg-gradient-to-b from-black to-deepCharcoal py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Books */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="mb-8 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-softGold" />
                <h2 className="font-serif text-3xl font-bold text-white">
                  Books &amp; Manuscripts
                </h2>
              </div>

              {featuredBooks.map((book) => (
                <motion.article
                  key={book.slug}
                  variants={scaleIn}
                  className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-softGold/30"
                >
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex h-32 w-24 items-center justify-center rounded-xl border border-softGold/30 bg-gradient-to-br from-softGold/20 to-softGold/10">
                        <BookOpen className="h-8 w-8 text-softGold" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="font-serif text-xl font-bold text-white transition-colors group-hover:text-softGold">
                          {book.title}
                        </h3>
                        <span className="rounded-full bg-amber-100/10 px-3 py-1 text-xs font-semibold text-amber-200">
                          {book.status}
                        </span>
                      </div>

                      <p className="mb-4 text-sm text-gray-300">
                        {book.subtitle}
                      </p>

                      <p className="mb-6 text-gray-300">{book.blurb}</p>

                      {/* Progress bar */}
                      <div className="mb-6">
                        <div className="mb-2 flex justify-between text-xs text-gray-400">
                          <span>Writing Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-softGold to-amber-200 transition-all duration-1000"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/books/${book.slug}`}
                        className="group/link inline-flex items-center gap-2 font-semibold text-softGold"
                      >
                        View Book Details
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Events */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="mb-8 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-softGold" />
                <h2 className="font-serif text-3xl font-bold text-white">
                  Events &amp; Gatherings
                </h2>
              </div>

              <div className="space-y-6">
                {featuredEvents.map((event) => (
                  <motion.article
                    key={event.slug}
                    variants={scaleIn}
                    className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-softGold/30"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-2 font-serif text-lg font-bold text-white transition-colors group-hover:text-softGold">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {event.dateLabel}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-100/10 px-3 py-1 text-xs font-semibold text-green-300">
                        {event.status}
                      </span>
                    </div>

                    <p className="mb-4 text-sm text-gray-300">
                      {event.blurb}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        📍 {event.location}
                      </span>
                      <Link
                        href={`/events/${event.slug}`}
                        className="group/link inline-flex items-center gap-1 text-sm font-semibold text-softGold"
                      >
                        Event Details
                        <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STRATEGIC VENTURES SECTION */}
      <section className="bg-gradient-to-b from-deepCharcoal to-black py-24">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
              Strategic <span className="text-softGold">Ventures</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              Each venture is a different front of the same mission:{" "}
              <span className="font-semibold text-softGold">
                raise the standard, build real value, and leave something worth
                inheriting
              </span>
              . No hype, no gimmicks, just disciplined execution.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {ventures.map((venture) => (
              <motion.div
                key={venture.slug}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-softGold/30">
                  {/* Gradient background effect */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${venture.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
                  />
                  <div className="relative z-10">
                    <div className="mb-6 flex items-start justify-between">
                      <div
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${venture.gradient}`}
                      >
                        <venture.icon className="h-7 w-7 text-white" />
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

                    <h3 className="mb-4 font-serif text-xl font-bold text-white transition-colors group-hover:text-softGold">
                      {venture.name}
                    </h3>

                    <p className="mb-6 flex-1 text-gray-300">
                      {venture.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-semibold text-softGold">
                        {venture.focus}
                      </span>
                      <a
                        href={venture.href}
                        className="group/link inline-flex items-center text-sm font-semibold text-softGold hover:text-softGold/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {venture.externalLabel}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PREMIUM NEWSLETTER SECTION */}
      <section className="bg-gradient-to-b from-black to-deepCharcoal py-24">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            className="relative overflow-hidden rounded-3xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            {/* Background with gradient and pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-deepCharcoal to-forest/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent" />

            {/* Border gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-softGold/30 via-forest/30 to-softGold/30 p-px" />

            <div className="relative rounded-3xl bg-white/5 p-12 text-center backdrop-blur-sm">
              <motion.div
                variants={scaleIn}
                className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-softGold to-amber-200"
              >
                <BookOpen className="h-10 w-10 text-black" />
              </motion.div>

              <motion.h2
                variants={fadeInUp}
                className="mb-4 font-serif text-3xl font-bold text-white md:text-4xl"
              >
                Join the <span className="text-softGold">Inner Circle</span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="mx-auto mb-8 max-w-2xl text-xl text-gray-300"
              >
                Occasional, high-signal emails with new frameworks, case
                studies, and private invites — designed for men who would
                rather build in reality than posture online.
              </motion.p>

              <motion.div variants={fadeInUp} className="mx-auto max-w-md">
                <NewsletterForm
                  variant="premium"
                  placeholder="Enter your email address..."
                  buttonText="Join Inner Circle"
                />
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-6 text-sm text-gray-400"
              >
                No fluff. No spam. Just field-tested insight you can put to work
                in your home, your company, and your walk with God.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;