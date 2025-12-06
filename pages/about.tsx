// pages/about.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { motion } from "framer-motion";
import {
  Moon,
  SunMedium,
  Target,
  Users,
  Shield,
  BookOpen,
  ArrowRight,
  Star,
  Award,
} from "lucide-react";

import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/imports";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface Achievement {
  title: string;
  description: string;
  year: number;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const achievements: Achievement[] = [
  {
    title: "Founded Fathering Without Fear Movement",
    description:
      "Launched a global initiative helping men embrace intentional fatherhood and legacy building.",
    year: 2023,
    href: "/brands/fathering-without-fear",
    icon: Users,
  },
  {
    title: "Published Entrepreneur Operating System",
    description:
      "Developed strategic operating frameworks used by founders and business leaders.",
    year: 2023,
    href: "/downloads/entrepreneur-operating-pack",
    icon: Target,
  },
  {
    title: "Established Brotherhood Covenant Network",
    description:
      "Built accountability structures that foster authentic brotherhood among Christian men.",
    year: 2022,
    href: "/downloads/brotherhood-covenant",
    icon: Shield,
  },
  {
    title: "Created Family Altar Liturgy",
    description:
      "Designed practical tools for integrating faith into daily family rhythms.",
    year: 2022,
    href: "/downloads/family-altar-liturgy",
    icon: BookOpen,
  },
  {
    title: "Launched Strategic Leadership Playbook",
    description:
      "Authored leadership frameworks for executives and organisational leaders.",
    year: 2021,
    href: "/downloads/leadership-playbook",
    icon: Award,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Theme management
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aof-theme");
      if (stored === "light" || stored === "dark") {
        setIsDark(stored === "dark");
        return;
      }
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aof-theme", next ? "dark" : "light");
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-gray-100" />
      </Layout>
    );
  }

  // Theme classes
  const shellClass = isDark
    ? "min-h-screen bg-gradient-to-br from-deepCharcoal via-gray-900 to-black text-cream"
    : "min-h-screen bg-gradient-to-br from-warmWhite via-cream to-white text-ink";

  const cardClass = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-sm hover:border-softGold/30 transition-all duration-300"
    : "border-lightGrey bg-white shadow-lg hover:shadow-xl transition-all duration-300";

  const primaryTextClass = isDark ? "text-cream" : "text-deepCharcoal";
  const secondaryTextClass = isDark ? "text-gray-300" : "text-slate-700";
  const accentTextClass = isDark ? "text-softGold" : "text-forest";

  const buttonClass = isDark
    ? "bg-softGold text-deepCharcoal hover:bg-softGold/90 shadow-lg hover:shadow-softGold/25"
    : "bg-forest text-cream hover:bg-forest/90 shadow-lg hover:shadow-forest/25";

  const secondaryButtonClass = isDark
    ? "border-white/20 bg-transparent text-cream hover:bg-white/10"
    : "border-lightGrey bg-white text-ink hover:bg-warmWhite";

    // Brand values from siteConfig (tolerant of older SiteConfig typings)
  const brandCfg = (siteConfig as unknown as { brand?: { values?: string[] } }).brand;
  const brandValues = brandCfg?.values ?? [];
  const leftValues = brandValues.slice(0, Math.ceil(brandValues.length / 2));
  const rightValues = brandValues.slice(Math.ceil(brandValues.length / 2));

  return (
    <Layout title="About">
      <Head>
        <title>
          About | Abraham of London — Strategic Stewardship & Legacy Building
        </title>
        <meta
          name="description"
          content="Learn about Abraham of London's mission to equip men with faith-rooted strategy, fatherhood tools, and legacy-building frameworks."
        />
        <meta
          property="og:title"
          content="About Abraham of London — Strategic Stewardship & Legacy Building"
        />
        <meta
          property="og:description"
          content="Equipping serious men and builders with faith-rooted strategy, fatherhood tools, and legacy frameworks for generational impact."
        />
        <meta
          property="og:url"
          content="https://www.abrahamoflondon.org/about"
        />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content={isDark ? "#0f172a" : "#f7f5ee"} />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <div className={shellClass}>
        {/* Header with theme toggle */}
        <div className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-12 flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentTextClass}`}
              >
                Strategic Stewardship
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                isDark
                  ? "border-white/15 bg-white/5 text-cream hover:bg-white/10"
                  : "border-lightGrey bg-white text-ink hover:bg-warmWhite"
              }`}
              aria-label="Toggle light/dark mode"
            >
              {isDark ? (
                <>
                  <SunMedium className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section
          className={`py-20 ${
            isDark
              ? "bg-gradient-to-b from-black to-deepCharcoal"
              : "bg-gradient-to-b from-warmWhite to-cream"
          }`}
        >
          <div className="mx-auto max-w-6xl px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.h1
                variants={itemVariants}
                className={`mb-6 font-serif text-4xl font-semibold md:text-5xl lg:text-6xl ${primaryTextClass}`}
              >
                Building Fathers,
                <span className={`mt-4 block ${accentTextClass}`}>
                  Founders &amp; Faithful Leaders
                </span>
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className={`mx-auto max-w-3xl text-xl leading-relaxed ${secondaryTextClass}`}
              >
                Equipping serious men with faith-rooted strategy, tools, and
                frameworks for intentional fatherhood, disciplined leadership,
                and lasting legacy.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Bio & Portrait Section */}
        <section
          className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h2
                  className={`mb-6 font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}
                >
                  Our Purpose
                </h2>
                <div
                  className={`space-y-4 text-lg leading-relaxed ${secondaryTextClass}`}
                >
                  <p>
                    Abraham of London exists to equip serious men and builders
                    with faith-rooted strategy, tools, and frameworks for
                    intentional fatherhood, disciplined leadership, and
                    generational legacy.
                  </p>
                  <p>
                    In a culture that celebrates drift and distraction, we
                    provide language, structure, and practical resources so you
                    can build with clarity, courage, and conviction.
                  </p>
                  <p>
                    Every strategy, tool, and framework is built on conservative
                    Christian conviction. True leadership starts with
                    submission to divine wisdom.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/ventures"
                    className={`rounded-full px-6 py-3 font-semibold transition-all ${buttonClass}`}
                  >
                    Explore Ventures
                  </Link>
                  <Link
                    href="/contact"
                    className={`rounded-full border px-6 py-3 font-semibold transition-all ${secondaryButtonClass}`}
                  >
                    Start Conversation
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div
                  className={`relative overflow-hidden rounded-2xl shadow-2xl ${
                    isDark
                      ? "ring-1 ring-white/10"
                      : "ring-1 ring-lightGrey"
                  }`}
                >
                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London - Founder and Strategic Leader"
                    width={600}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      isDark
                        ? "from-black/40 to-transparent"
                        : "from-white/20 to-transparent"
                    }`}
                  />
                </div>
                <div
                  className={`absolute -bottom-6 -left-6 rounded-lg px-6 py-3 shadow-lg ${
                    isDark ? "bg-softGold text-deepCharcoal" : "bg-forest text-cream"
                  }`}
                >
                  <p className="font-semibold">Abraham of London</p>
                  <p className="text-sm opacity-90">
                    Founder &amp; Strategic Leader
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Achievements */}
        <section
          className={`py-16 ${
            isDark ? "bg-slate-900" : "bg-slate-50"
          }`}
        >
          <div className="mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2
                className={`mb-4 font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}
              >
                Strategic Milestones
              </h2>
              <p
                className={`mx-auto max-w-2xl text-xl ${secondaryTextClass}`}
              >
                Building tools and communities that help men lead with
                conviction and build lasting legacy.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        isDark ? "bg-softGold/10" : "bg-forest/10"
                      }`}
                    >
                      <IconComponent
                        className={
                          isDark
                            ? "h-6 w-6 text-softGold"
                            : "h-6 w-6 text-forest"
                        }
                      />
                    </div>
                    <div
                      className={`mb-2 text-sm font-semibold ${accentTextClass}`}
                    >
                      {achievement.year}
                    </div>
                    <h3
                      className={`mb-3 font-serif text-xl font-semibold ${primaryTextClass}`}
                    >
                      {achievement.title}
                    </h3>
                    <p
                      className={`mb-4 text-sm leading-relaxed ${secondaryTextClass}`}
                    >
                      {achievement.description}
                    </p>
                    <Link
                      href={achievement.href}
                      className={`inline-flex items-center text-sm font-semibold hover:underline ${accentTextClass}`}
                    >
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section
          className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}
        >
          <div className="mx-auto max-w-4xl px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-12 text-center font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}
            >
              Our Guiding Principles
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                {leftValues.map((value, index) => (
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isDark ? "bg-softGold/10" : "bg-forest/10"
                        }`}
                      >
                        <Star
                          className={
                            isDark
                              ? "h-4 w-4 text-softGold"
                              : "h-4 w-4 text-forest"
                          }
                        />
                      </div>
                      <h3
                        className={`text-xl font-semibold ${primaryTextClass}`}
                      >
                        {value}
                      </h3>
                    </div>
                    <p className={secondaryTextClass}>
                      {value === "Faith-rooted leadership" &&
                        "Every strategic decision and framework is anchored in Scripture and conservative Christian conviction."}
                      {value === "Strategic discipline" &&
                        "We prioritise focused execution over noise, distraction, and vanity metrics."}
                      {value === "Generational thinking" &&
                        "We build with heirs in mind, not headlines—legacy over trend cycles."}
                      {![
                        "Faith-rooted leadership",
                        "Strategic discipline",
                        "Generational thinking",
                      ].includes(value) &&
                        "This value shapes how we build systems, relationships, and long-term impact."}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-6">
                {rightValues.map((value, index) => (
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isDark ? "bg-softGold/10" : "bg-forest/10"
                        }`}
                      >
                        <Star
                          className={
                            isDark
                              ? "h-4 w-4 text-softGold"
                              : "h-4 w-4 text-forest"
                          }
                        />
                      </div>
                      <h3
                        className={`text-xl font-semibold ${primaryTextClass}`}
                      >
                        {value}
                      </h3>
                    </div>
                    <p className={secondaryTextClass}>
                      {value === "Community focus" &&
                        "We build brotherhoods and ecosystems that protect, sharpen, and strengthen men on the journey."}
                      {value === "Excellence in execution" &&
                        "Every resource is built to be battle-tested, not performative—fit for real pressure and real responsibility."}
                      {value === "Sustainable impact" &&
                        "We design for durability: spiritually, economically, and relationally, not quick wins."}
                      {![
                        "Community focus",
                        "Excellence in execution",
                        "Sustainable impact",
                      ].includes(value) &&
                        "This value informs how we show up, serve, and steward influence over time."}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={`py-16 text-center ${
            isDark
              ? "bg-gradient-to-r from-forest to-softGold"
              : "bg-gradient-to-r from-forest to-forest/90"
          }`}
        >
          <div className="mx-auto max-w-2xl px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 font-serif text-3xl font-semibold text-white md:text-4xl"
            >
              Ready to Build With Purpose?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-xl text-white/90"
            >
              Join men who are choosing conviction over convenience and
              building families, ventures, and legacies that last.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/downloads"
                className="inline-flex items-center rounded-lg bg-white px-8 py-4 font-semibold text-deepCharcoal shadow-lg transition-colors hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Explore Resources
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg border-2 border-white px-8 py-4 font-semibold text-white transition-colors hover:-translate-y-0.5 hover:bg-white hover:text-deepCharcoal"
              >
                Start a Conversation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;
