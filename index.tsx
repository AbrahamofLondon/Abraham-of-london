// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Quote } from "lucide-react";
import Layout from "@/components/Layout";

const siteTitle = "Abraham of London";
const siteTagline =
  "Faithful strategy for fathers, founders, and board-level leaders who refuse to outsource responsibility.";
const siteUrl = "https://www.abrahamoflondon.org";

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Optimized animated counter with requestAnimationFrame
const AnimatedCounter: React.FC<{ end: number; duration?: number }> = ({
  end,
  duration = 2,
}) => {
  const [count, setCount] = React.useState(0);
  const frameRef = React.useRef<number>();
  const startTimeRef = React.useRef<number>();

  React.useEffect(() => {
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return <span>{count}+</span>;
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

const HomePage: React.FC = () => {
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
      "Leadership",
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

  return (
    <Layout title={siteTitle}>
      <Head>
        <title>{siteTitle} | Faithful Strategy for Builders, Founders & Fathers</title>
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
        <meta name="twitter:title" content={`${siteTitle} | Faithful Strategy for Builders, Founders & Fathers`} />
        <meta name="twitter:description" content={siteTagline} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />

        {/* Canonical */}
        <link rel="canonical" href={siteUrl} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
        {/* HERO */}
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-20 pt-16 md:flex-row md:items-stretch md:pt-24">
          {/* Left column */}
          <motion.div
            className="flex-1 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={itemVariants}
              className="text-xs uppercase tracking-[0.35em] text-softGold/80"
            >
              Abraham of London
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="font-serif text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
            >
              Strategy for{" "}
              <span className="block text-softGold">
                kings, fathers & builders.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-base leading-relaxed text-gray-200 md:text-lg"
            >
              A premium hub for board-level thinking, founder discipline, and
              unapologetic fatherhood – for men who still believe in duty,
              consequence, and legacy.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link
                href="/downloads"
                className="inline-flex items-center rounded-full bg-softGold px-6 py-3 text-sm font-semibold uppercase tracking-wide text-deepCharcoal shadow-lg shadow-softGold/30 transition-all hover:bg-softGold/90 hover:shadow-softGold/50 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-deepCharcoal"
                prefetch={true}
              >
                Access strategic downloads
              </Link>

              <Link
                href="/strategy/sample-strategy"
                className="inline-flex items-center rounded-full border border-softGold/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-softGold transition-all hover:border-softGold hover:bg-softGold/5 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-deepCharcoal"
                prefetch={true}
              >
                Explore strategy insights
              </Link>
            </motion.div>

            {/* Quick links */}
            <motion.div
              variants={itemVariants}
              className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300"
            >
              <Link
                href="/about"
                className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
                prefetch={true}
              >
                About Abraham
              </Link>
              <span className="text-gray-500 select-none">•</span>
              <Link
                href="/contact"
                className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
                prefetch={true}
              >
                Speak with Abraham
              </Link>
              <span className="text-gray-500 select-none">•</span>
              <Link
                href="/downloads/brotherhood-starter-kit"
                className="underline-offset-4 hover:text-softGold hover:underline focus:outline-none focus:text-softGold focus:underline"
                prefetch={true}
              >
                Brotherhood starter kit
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-6"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-softGold">
                  <AnimatedCounter end={25} />
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Strategic tools
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-forest">
                  <AnimatedCounter end={500} />
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Men equipped
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-softGold">
                  <AnimatedCounter end={12} />
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Brotherhood circles
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column – hero card */}
          <motion.div
            className="mt-10 flex flex-1 items-center justify-center md:mt-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/60 backdrop-blur">
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
                A multi-format ecosystem – book, downloads, and a brotherhood of
                men who refuse to apologize for leading well, loving well, and
                building with conviction.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/downloads/brotherhood-covenant"
                  className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-deepCharcoal"
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

              <p className="mt-6 text-right text-[10px] font-light tracking-[0.35em] text-gray-400 select-none">
                ABRAHAMOFLONDON
              </p>
            </div>
          </motion.div>
        </section>

        {/* Divider strip */}
        <section className="border-t border-white/10 bg-black/40">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-xs text-gray-300 md:text-sm">
            <p className="uppercase tracking-[0.25em] text-gray-400 select-none">
              Strategy • Fatherhood • Legacy • Faith
            </p>
            <p className="text-gray-500 select-none">
              Designed to be read slowly. Lived fully.
            </p>
          </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 select-none">
            Trusted by leaders at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all hover:grayscale-0">
            {/* Replace these placeholders with real logos when ready */}
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
                  <Quote className="h-5 w-5 text-softGold/60" aria-hidden="true" />
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
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-softGold" aria-hidden="true" />
              <h2 className="mb-3 font-serif text-2xl font-semibold text-white md:text-3xl">
                Weekly building notes
              </h2>
              <p className="mx-auto mb-6 max-w-xl text-sm text-gray-200 md:text-base">
                Get frameworks, early access to new tools, and practical
                patterns for building faith, family, and business without
                compromise.
              </p>

              {/* Simple HTML form (you can wire this to /api/subscribe later) */}
              <form
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Add newsletter signup logic here
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="Your best email"
                  className="flex-1 rounded-lg border border-gray-600 bg-black/60 px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-softGold focus:outline-none focus:ring-2 focus:ring-softGold/70"
                  aria-label="Email for newsletter subscription"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition-all hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-black"
                >
                  Join builders
                </button>
              </form>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                  <span>No spam, ever.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-softGold" aria-hidden="true" />
                  <span>Unsubscribe any time.</span>
                </div>
              </div>
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