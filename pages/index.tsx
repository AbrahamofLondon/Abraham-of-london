// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetStaticProps } from "next";

import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";
import MandateStatement from "@/components/MandateStatement";
import { HeroBanner } from "@/components/InteractiveElements";

type HomePageProps = {
  featuredPosts: any[];
  featuredBooks: any[];
  featuredEvents: any[];
  featuredDownloads: any[];
};

// ============================================================================
// ARCHITECTURAL COMPONENTS
// ============================================================================

interface PathwayPortalProps {
  title: string;
  description: string;
  stats: string;
  href: string;
  color: string;
  delay: number;
}

const PathwayPortal: React.FC<PathwayPortalProps> = ({
  title,
  description,
  stats,
  href,
  color,
  delay,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative h-full cursor-pointer rounded-2xl border shadow-lg transition-all duration-500 hover:-translate-y-2 ${
          isHovered ? "shadow-2xl" : "shadow-lg"
        }`}
        style={{
          borderColor: `${color}30`,
          backgroundColor: `${color}05`,
          transitionDelay: `${delay}ms`,
        }}
      >
        {/* Background Architecture */}
        <div
          className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${color} 0%, transparent 55%)`,
          }}
        />

        {/* Content */}
        <div className="relative p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: color }}
              />
              <div
                className="text-xs tracking-[0.25em] uppercase"
                style={{ color }}
              >
                Pathway
              </div>
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs"
              style={{ borderColor: `${color}30`, color, borderWidth: 1 }}
            >
              {stats}
            </div>
          </div>

          {/* Title */}
          <h3 className="mb-4 text-2xl font-light transition-colors group-hover:text-white">
            {title}
          </h3>

          {/* Description */}
          <p className="mb-8 leading-relaxed text-[#999]">{description}</p>

          {/* CTA */}
          <div
            className="flex items-center justify-between border-t pt-6 text-sm"
            style={{ borderColor: `${color}15`, color }}
          >
            <div>Enter Pathway</div>
            <div className="transform transition-transform group-hover:translate-x-2">
              →
            </div>
          </div>
        </div>

        {/* Hover Glow */}
        <div
          className="pointer-events-none absolute -inset-4 opacity-0 transition-opacity duration-500 group-hover:opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
          }}
        />
      </div>
    </Link>
  );
};

interface StructuralCardProps {
  title: string;
  description: string;
  meta: string;
  href: string;
  type: "post" | "event" | "book" | "download";
  featured?: boolean;
  delay?: number;
}

const StructuralCard: React.FC<StructuralCardProps> = ({
  title,
  description,
  meta,
  href,
  type,
  featured = false,
  delay = 0,
}) => {
  const typeConfig = {
    post: { color: "#d4af37", icon: "✍", label: "Structural Essay" },
    book: { color: "#b8941f", icon: "📚", label: "Bound Volume" },
    event: { color: "#9c7c1a", icon: "𓇯", label: "Gathering" },
    download: { color: "#806515", icon: "⚙", label: "Tool" },
  } as const;

  const config = typeConfig[type];

  return (
    <Link href={href}>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
        style={{
          borderColor: `${config.color}30`,
          backgroundColor: `${config.color}05`,
          transitionDelay: `${delay}ms`,
        }}
      >
        {/* Featured Badge */}
        {featured && (
          <div className="absolute left-4 top-4 z-10">
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
              }}
            >
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Featured
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xl opacity-70">{config.icon}</div>
              <div
                className="text-xs tracking-[0.22em] uppercase"
                style={{ color: config.color }}
              >
                {config.label}
              </div>
            </div>
            <div className="text-xs text-[#777]">{meta}</div>
          </div>

          {/* Title */}
          <h4 className="mb-3 text-lg font-medium transition-colors group-hover:text-white">
            {title}
          </h4>

          {/* Description */}
          <p className="mb-6 line-clamp-2 text-sm text-[#999]">{description}</p>

          {/* Footer */}
          <div
            className="flex items-center justify-between border-t pt-4 text-xs"
            style={{ borderColor: `${config.color}15` }}
          >
            <div className="opacity-70">Continue Reading</div>
            <div
              className="transform text-sm transition-transform group-hover:translate-x-1"
              style={{ color: config.color }}
            >
              →
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
    </Link>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const HomePage: React.FC<HomePageProps> = () => {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";
  const siteTitle = "Abraham of London";
  const siteTagline =
    "Structural thinking for fathers, founders, and builders of legacy.";

  const pathways = [
    {
      title: "For Fathers",
      description:
        "Architectural principles for building homes that withstand time, culture, and crisis.",
      stats: "12 Structures",
      href: "/content?category=fatherhood",
      color: "#d4af37",
    },
    {
      title: "For Founders",
      description:
        "Board-level thinking and operating systems for building ventures that endure.",
      stats: "18 Structures",
      href: "/content?category=founders",
      color: "#b8941f",
    },
    {
      title: "For Leaders",
      description:
        "Strategic frameworks for leading organisations through complexity and change.",
      stats: "24 Structures",
      href: "/content?category=leadership",
      color: "#9c7c1a",
    },
  ];

  const featuredContent = {
    posts: [
      {
        title: "The Architecture of Crisis",
        description:
          "How to build structures that don't just survive storms, but leverage them for growth.",
        meta: "12 min read",
        href: "/when-the-storm-finds-you",
        type: "post" as const,
        featured: true,
      },
      {
        title: "Fathering Without Fear",
        description:
          "A structural approach to fatherhood in an age of confusion and crisis.",
        meta: "18 min read",
        href: "/fathering-without-fear",
        type: "post" as const,
      },
    ],
    books: [
      {
        title: "Volume Zero: The Architecture of Human Purpose",
        description:
          "The foundational framework for understanding purpose, civilisation, and destiny.",
        meta: "Prelude Release",
        href: "/books/the-architecture-of-human-purpose-landing",
        type: "book" as const,
        featured: true,
      },
    ],
    events: [
      {
        title: "Strategic Leadership Workshop",
        description:
          "A masterclass on structural thinking for leaders building lasting organisations.",
        meta: "London · 2025",
        href: "/events/strategic-leadership-workshop",
        type: "event" as const,
      },
    ],
    downloads: [
      {
        title: "Entrepreneur Survival Framework",
        description:
          "A structural checklist for founders navigating market shifts and personal crises.",
        meta: "PDF · 12 pages",
        href: "/downloads/entrepreneur-survival-checklist",
        type: "download" as const,
      },
    ],
  };

  const ventures = [
    {
      label: "Advisory & Ventures",
      title: "Alomarada",
      description:
        "Strategic advisory and operating structures for governments, corporates, and growth-stage ventures in emerging markets.",
      href: "/ventures/alomarada",
      tag: "Market Architecture",
    },
    {
      label: "Enduring Brand",
      title: "Endureluxe",
      description:
        "A premium, durable-first brand exploring what it means to build products that outlast hype and headlines.",
      href: "/ventures/endureluxe",
      tag: "Consumer Architecture",
    },
    {
      label: "The Canon",
      title: "Architecture of Human Purpose",
      description:
        "A multi-volume canon on purpose, civilisation, governance, spiritual alignment, and human destiny.",
      href: "/books/the-architecture-of-human-purpose-landing",
      tag: "Philosophical Architecture",
    },
    {
      label: "Story Platform",
      title: "Fathering Without Fear",
      description:
        "A memoir-driven platform reclaiming fatherhood, dignity, and justice in an age determined to erase men.",
      href: "/books/fathering-without-fear",
      tag: "Narrative Architecture",
    },
    {
      label: "Inner Community",
      title: "Inner Circle",
      description:
        "Private letters, advanced frameworks, and closed-door conversations for those willing to build differently.",
      href: "/inner-circle",
      tag: "Relational Architecture",
    },
  ];

  const handleHeroCTA = () => {
    router.push("/content");
  };

  return (
    <Layout
      title={siteTitle}
      description={siteTagline}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        description: siteTagline,
        url: siteUrl,
        publisher: {
          "@type": "Organization",
          name: siteTitle,
          logo: `${siteUrl}/logo.png`,
        },
      }}
    >
      <Head>
        <title>{siteTitle} | Structural Thinking for Builders of Legacy</title>
        <meta name="description" content={siteTagline} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteTagline} />
        <meta property="og:image" content={`${siteUrl}/og-home.jpg`} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteTagline} />
        <meta name="twitter:image" content={`${siteUrl}/og-home.jpg`} />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      {/* Background Architecture */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050509] via-[#0b0b10] to-[#050509]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(212,175,55,0.12) 1px, transparent 1px),
              linear-gradient(rgba(212,175,55,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* HERO: HERO BANNER + ARCHITECTURE SNAPSHOT */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16">
        {/* Architectural Lines */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#3a3a3a]/25 to-transparent" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#3a3a3a]/20 to-transparent" />
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full border border-[#d4af37]/10" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full border border-[#d4af37]/10" />
        </div>

        <div
          className={`relative mx-auto max-w-7xl px-4 transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* HERO BANNER — PRIMARY VISUAL HERO */}
          <div className="mb-12">
            <HeroBanner />
          </div>

          {/* Under-banner architecture narrative */}
          <div className="grid gap-12 pb-6 lg:grid-cols-[3fr,2fr] lg:items-start">
            {/* Left: Core narrative + CTAs */}
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
                <span className="text-xs uppercase tracking-[0.32em] text-[#d4af37]/80">
                  Structural Canon · Abraham of London
                </span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
              </div>

              <h1 className="mb-4 text-3xl font-light leading-[1.15] tracking-tight md:text-4xl">
                Architectural thinking for fathers, founders, and leaders
                building{" "}
                <span className="text-[#d4af37]">homes, ventures, and institutions</span>{" "}
                that outlast the storm.
              </h1>

              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#b3b3b3]">
                A canon of structural essays, volumes, tools, and gatherings
                designed for men who refuse to disappear — and who insist on
                building with purpose, governance, and destiny in view.
              </p>

              {/* CTAs */}
              <div className="mb-8 flex flex-col justify-start gap-4 sm:flex-row">
                <button
                  onClick={handleHeroCTA}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative">Enter the Content Library</span>
                  <span className="relative transition-transform duration-300 group-hover:translate-x-2">
                    ↠
                  </span>
                </button>

                <Link
                  href="/books/the-architecture-of-human-purpose-landing"
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden border border-[#3a3a3a] px-8 py-4 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:border-[#d4af37]/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#151515] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative">Preview the Canon</span>
                  <span className="relative text-[#d4af37] transition-transform duration-300 group-hover:translate-x-2">
                    →
                  </span>
                </Link>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                Purpose · Civilisation · Governance · Fatherhood · Markets ·
                Destiny
              </p>
            </div>

            {/* Right: Architecture Map Snapshot */}
            <div className="relative rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#050509] via-[#0f1015] to-[#050509] p-8">
              <div className="mb-4 text-xs uppercase tracking-[0.22em] text-[#777]">
                The Architecture at a Glance
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]/80">
                      Philosophy
                    </div>
                    <p className="mt-1 text-[#cfcfcf]">
                      <span className="font-semibold">
                        Architecture of Human Purpose
                      </span>{" "}
                      — a canon on how purpose, civilisation, and destiny are
                      designed, not improvised.
                    </p>
                  </div>
                  <Link
                    href="/books"
                    className="text-[11px] text-[#d4af37] underline-offset-2 hover:underline"
                  >
                    View Volumes
                  </Link>
                </div>

                <div className="h-px bg-gradient-to-r from-[#262626] via-[#333] to-transparent" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]/80">
                      Structures
                    </div>
                    <p className="mt-1 text-[#cfcfcf]">
                      Essays, tools, and playbooks translating philosophy into{" "}
                      <span className="font-semibold">operating systems</span> for
                      fathers, founders, and leaders.
                    </p>
                  </div>
                  <Link
                    href="/content"
                    className="text-[11px] text-[#d4af37] underline-offset-2 hover:underline"
                  >
                    Enter Library
                  </Link>
                </div>

                <div className="h-px bg-gradient-to-r from-[#262626] via-[#333] to-transparent" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]/80">
                      Ventures
                    </div>
                    <p className="mt-1 text-[#cfcfcf]">
                      Alomarada, Endureluxe, Fathering Without Fear, and the
                      Inner Circle — live laboratories where the canon is
                      applied.
                    </p>
                  </div>
                  <Link
                    href="/content?category=ventures"
                    className="text-[11px] text-[#d4af37] underline-offset-2 hover:underline"
                  >
                    See the Work
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-[#888]">
                <div>
                  <div className="text-lg font-light text-[#d4af37]">80+</div>
                  <div>Structural Essays</div>
                </div>
                <div>
                  <div className="text-lg font-light text-[#d4af37]">4</div>
                  <div>Core Ventures</div>
                </div>
                <div>
                  <div className="text-lg font-light text-[#d4af37]">1</div>
                  <div>Unifying Canon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURAL PATHWAYS */}
      <section
        className={`relative py-24 transition-all duration-1000 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050509] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-light md:text-4xl">
              Three{" "}
              <span className="text-[#d4af37]">Architectural Pathways</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-[#999]">
              Choose the main theatre you are building in right now — home,
              venture, or institution — and move through the structures in
              sequence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {pathways.map((pathway, index) => (
              <PathwayPortal
                key={pathway.title}
                {...pathway}
                delay={index * 120}
              />
            ))}
          </div>
        </div>
      </section>

      {/* VENTURES & PLATFORMS */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050509] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-3xl font-light md:text-4xl">
                One philosophy.{" "}
                <span className="text-[#d4af37]">Multiple platforms.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm text-[#999]">
                The canon doesn’t stay on paper. It runs through advisory
                work, ventures, brands, stories, and a guarded community of
                men who build.
              </p>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#777]">
              Advisory · Brand · Story · Canon · Inner Circle
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ventures.map((venture, index) => (
              <Link key={venture.title} href={venture.href}>
                <div
                  className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-[#252525] bg-[#050509] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-2xl"
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#777]">
                    {venture.label}
                  </div>
                  <h3 className="mb-2 text-xl font-light text-[#f5f5f5] group-hover:text-[#ffffff]">
                    {venture.title}
                  </h3>
                  <p className="mb-4 text-sm text-[#a3a3a3]">
                    {venture.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#d4af37]">
                    <span>{venture.tag}</span>
                    <span className="transform transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20">
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-tr from-[#d4af37]/40 to-transparent blur-3xl" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MANDATE STATEMENT */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050509] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4">
          <MandateStatement />
        </div>
      </section>

      {/* FEATURED STRUCTURES (ESSAYS, BOOKS, TOOLS, EVENTS) */}
      <section className="relative py-28">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-light md:text-4xl">
                Selected{" "}
                <span className="text-[#d4af37]">structural pieces.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-[#999]">
                A sample of essays, volumes, tools, and gatherings that give a
                first taste of the canon — without giving the whole archive
                away.
              </p>
            </div>
            <Link
              href="/content"
              className="text-sm text-[#d4af37] underline-offset-4 hover:underline"
            >
              View the complete library →
            </Link>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column: Essays & Books */}
            <div className="space-y-12">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-[#d4af37] to-transparent" />
                  <h3 className="text-2xl font-light">Structural Essays</h3>
                </div>
                <div className="grid gap-6">
                  {featuredContent.posts.map((post, index) => (
                    <StructuralCard
                      key={post.title}
                      {...post}
                      delay={index * 90}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-[#b8941f] to-transparent" />
                  <h3 className="text-2xl font-light">Bound Volumes</h3>
                </div>
                <div className="grid gap-6">
                  {featuredContent.books.map((book, index) => (
                    <StructuralCard
                      key={book.title}
                      {...book}
                      delay={index * 90}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Tools & Events */}
            <div className="space-y-12">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-[#806515] to-transparent" />
                  <h3 className="text-2xl font-light">Structural Tools</h3>
                </div>
                <div className="grid gap-6">
                  {featuredContent.downloads.map((tool, index) => (
                    <StructuralCard
                      key={tool.title}
                      {...tool}
                      delay={index * 90}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-[#9c7c1a] to-transparent" />
                  <h3 className="text-2xl font-light">
                    Architectural Gatherings
                  </h3>
                </div>
                <div className="grid gap-6">
                  {featuredContent.events.map((event, index) => (
                    <StructuralCard
                      key={event.title}
                      {...event}
                      delay={index * 90}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Content CTA */}
          <div className="mt-16 border-t border-[#2a2a2a] pt-16">
            <div className="text-center">
              <Link
                href="/content"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden border border-[#2a2a2a] px-12 py-5 text-lg font-medium transition-all duration-300 hover:scale-[1.02] hover:border-[#d4af37]/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#151515] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative">Enter the Complete Structure</span>
                <span className="relative text-[#d4af37] transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </Link>
              <p className="mt-3 text-sm text-[#666]">
                80+ architectural structures across essays, volumes, tools, and
                gatherings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER / INNER CIRCLE */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050509] via-[#101017] to-[#050509]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, transparent 48%, #111827 48%, #111827 52%, transparent 52%)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-[#2a2a2a]">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.5), transparent 55%)",
              }}
            />
            <div className="relative p-10 text-center sm:p-12">
              <div className="mb-6 text-5xl text-[#d4af37]/40">∞</div>

              <h3 className="mb-4 text-3xl font-light">Join the Inner Circle</h3>

              <p className="mx-auto mb-8 max-w-2xl text-sm text-[#b0b0b0]">
                Private letters, deep dives, and structural frameworks that won’t
                live on social media — for those who don’t just want to “stay
                updated”, but to build differently.
              </p>

              <div className="mx-auto max-w-md">
                <NewsletterForm
                  variant="premium"
                  placeholder="Enter your architectural email"
                  buttonText="Enter the Inner Circle"
                />
              </div>

              <p className="mt-5 text-xs text-[#777]">
                No fluff. No spam. Just structural thinking that builds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER: STATS & CLAIM */}
      <footer
        className="relative border-t py-16"
        style={{ borderColor: "#2a2a2a" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: "80+", label: "Structural Essays" },
              { value: "4+", label: "Architectural Volumes" },
              { value: "18+", label: "Execution Tools" },
              { value: "12+", label: "Years in the Furnace" },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl font-light text-[#d4af37]">
                  {stat.value}
                </div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div
            className="mt-10 border-t pt-6 text-center text-sm text-[#666]"
            style={{ borderColor: "#2a2a2a" }}
          >
            <p>
              An architectural approach to purpose, civilisation, and human
              destiny — from courtrooms to boardrooms to the quiet work of
              fatherhood.
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div
          className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-[#d4af37]/6 to-transparent blur-3xl"
          style={{
            transform: "translate(var(--mouse-x), var(--mouse-y))",
            transition: "transform 0.1s ease-out",
          }}
        />
      </div>

      {/* Mouse Tracking Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
              document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });
          `,
        }}
      />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Placeholder: hook up real data later if needed
  return {
    props: {
      featuredPosts: [],
      featuredBooks: [],
      featuredEvents: [],
      featuredDownloads: [],
    },
    revalidate: 3600,
  };
};

export default HomePage;