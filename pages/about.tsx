// pages/about.tsx — ADULT / EXECUTIVE ABOUT (FOCUSED ON WORKSTREAMS)
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
  Briefcase,
  Landmark,
  ScrollText,
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
    transition: { duration: 0.6, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

// ---------------------------------------------------------------------------
// Workstreams (adult framing, not “downloads”)
// ---------------------------------------------------------------------------

type Workstream = {
  title: string;
  description: string;
  outcomes: string[];
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tag: string;
};

const workstreams: Workstream[] = [
  {
    title: "Canon — the philosophical spine",
    description:
      "Long-form doctrine, strategy, and civilisation analysis designed to outlive platform cycles. Not vibes. Architecture.",
    outcomes: [
      "Clear worldview + operating philosophy",
      "Decision frameworks for leadership under pressure",
      "Language for conviction in hostile cultural climates",
    ],
    href: "/canon",
    icon: ScrollText,
    tag: "Ideas → Institutions",
  },
  {
    title: "Fatherhood & household architecture",
    description:
      "Tools and standards for men building homes that don’t outsource authority to trends. Practical fathering under modern pressure.",
    outcomes: [
      "Household rhythms, roles, and boundaries",
      "Father-led legacy planning (values + systems)",
      "Mentorship-grade discipline and formation",
    ],
    href: "/brands/fathering-without-fear",
    icon: Users,
    tag: "Men → Families",
  },
  {
    title: "Strategy rooms for founders & boards",
    description:
      "Market positioning, narrative, operating cadence, and execution design. Built for builders, not spectators.",
    outcomes: [
      "Sharper mandate + market focus",
      "Governance and operating rhythm",
      "Execution strategy that survives reality",
    ],
    href: "/consulting",
    icon: Briefcase,
    tag: "Vision → Execution",
  },
  {
    title: "Resources — templates, playbooks, toolkits",
    description:
      "Practical assets you can deploy immediately: diagnostics, operating packs, and field-ready frameworks.",
    outcomes: [
      "Faster implementation cycles",
      "Reusable frameworks for teams and households",
      "Consistency without bureaucracy",
    ],
    href: "/downloads",
    icon: BookOpen,
    tag: "Tools → Deployment",
  },
  {
    title: "Inner Circle — closed rooms & applied work",
    description:
      "Small rooms, higher signal. A tighter layer for serious builders who want accountability, not applause.",
    outcomes: [
      "Direct access to selective work and releases",
      "Closed-room discussions and working sessions",
      "Applied thinking with feedback loops",
    ],
    href: "/inner-circle",
    icon: Shield,
    tag: "Access → Accountability",
  },
  {
    title: "Civic & institutional thinking",
    description:
      "Governance, nation-building, and institutional design — the upstream work behind downstream outcomes.",
    outcomes: [
      "Institutional patterns and reform logic",
      "Cultural analysis with strategic implications",
      "Economic and governance frameworks (macro lens)",
    ],
    href: "/strategy",
    icon: Landmark,
    tag: "Principles → Policy",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aof-theme");
      if (stored === "light" || stored === "dark") {
        setIsDark(stored === "dark");
        return;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aof-theme", next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-gray-100" />
      </Layout>
    );
  }

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

  const brandCfg = (siteConfig as unknown as { brand?: { values?: string[] } }).brand;
  const brandValues = brandCfg?.values ?? [];
  const leftValues = brandValues.slice(0, Math.ceil(brandValues.length / 2));
  const rightValues = brandValues.slice(Math.ceil(brandValues.length / 2));

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London — Strategy, Fatherhood, Legacy</title>
        <meta
          name="description"
          content="Abraham of London builds faith-rooted strategy, fatherhood tools, and legacy frameworks for serious men, founders, and leaders."
        />
        <meta property="og:title" content="About Abraham of London — Strategy, Fatherhood, Legacy" />
        <meta
          property="og:description"
          content="High-signal workstreams: Canon, strategy rooms, household architecture, tools, and Inner Circle accountability."
        />
        <meta property="og:url" content="https://www.abrahamoflondon.org/about" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content={isDark ? "#0f172a" : "#f7f5ee"} />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <div className={shellClass}>
        {/* Top bar */}
        <div className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentTextClass}`}>
                Strategic stewardship — adult work, durable outcomes
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
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero */}
        <section
          className={`py-18 sm:py-20 ${
            isDark ? "bg-gradient-to-b from-black to-deepCharcoal" : "bg-gradient-to-b from-warmWhite to-cream"
          }`}
        >
          <div className="mx-auto max-w-6xl px-4">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
              <motion.h1
                variants={itemVariants}
                className={`mb-6 font-serif text-4xl font-semibold md:text-5xl lg:text-6xl ${primaryTextClass}`}
              >
                Strategy for men who actually carry responsibility.
                <span className={`mt-4 block ${accentTextClass}`}>Faith-rooted. Field-tested. Built to last.</span>
              </motion.h1>

              <motion.p variants={itemVariants} className={`mx-auto max-w-3xl text-xl leading-relaxed ${secondaryTextClass}`}>
                Abraham of London exists to turn conviction into operating systems — for households, ventures, and institutions.
                If you’re looking for motivational content, wrong building.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/canon" className={`rounded-full px-6 py-3 font-semibold transition-all ${buttonClass}`}>
                  Enter the Canon
                </Link>
                <Link
                  href="/consulting"
                  className={`rounded-full border px-6 py-3 font-semibold transition-all ${secondaryButtonClass}`}
                >
                  Work with Abraham
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Portrait + positioning */}
        <section className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                <h2 className={`mb-6 font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}>What this is</h2>

                <div className={`space-y-4 text-lg leading-relaxed ${secondaryTextClass}`}>
                  <p>
                    This platform is a strategic workshop — not a content feed. It exists to help serious men build: a
                    household, a venture, and an internal governance structure that does not collapse under pressure.
                  </p>
                  <p>
                    The operating assumption is simple: <strong>truth exists</strong>, conviction matters, and leadership
                    without moral architecture becomes manipulation.
                  </p>
                  <p>
                    Everything here is built on conservative Christian conviction. Not as decoration — as the foundation.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/downloads" className={`rounded-full px-6 py-3 font-semibold transition-all ${buttonClass}`}>
                    Deploy the tools
                  </Link>
                  <Link
                    href="/inner-circle"
                    className={`rounded-full border px-6 py-3 font-semibold transition-all ${secondaryButtonClass}`}
                  >
                    Inner Circle access
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative"
              >
                <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${isDark ? "ring-1 ring-white/10" : "ring-1 ring-lightGrey"}`}>
                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London — founder and strategic leader"
                    width={600}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-black/45 to-transparent" : "from-white/25 to-transparent"}`} />
                </div>

                <div className={`absolute -bottom-6 -left-6 rounded-lg px-6 py-3 shadow-lg ${isDark ? "bg-softGold text-deepCharcoal" : "bg-forest text-cream"}`}>
                  <p className="font-semibold">Abraham of London</p>
                  <p className="text-sm opacity-90">Strategy · Fatherhood · Legacy</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Workstreams */}
        <section className={`py-16 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
          <div className="mx-auto max-w-6xl px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
              <h2 className={`mb-4 font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}>
                What we build (workstreams)
              </h2>
              <p className={`mx-auto max-w-3xl text-xl ${secondaryTextClass}`}>
                Not “content.” Deliverables. Systems. Frameworks. Rooms where real decisions get made.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {workstreams.map((ws, idx) => {
                const Icon = ws.icon;
                return (
                  <motion.div
                    key={ws.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: idx * 0.06 }}
                    className={`rounded-2xl border p-6 ${cardClass}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                        <Icon className={isDark ? "h-6 w-6 text-softGold" : "h-6 w-6 text-forest"} />
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        isDark ? "border-white/15 text-gray-300" : "border-lightGrey text-slate-700"
                      }`}>
                        {ws.tag}
                      </span>
                    </div>

                    <h3 className={`mb-3 font-serif text-xl font-semibold ${primaryTextClass}`}>{ws.title}</h3>
                    <p className={`mb-5 text-sm leading-relaxed ${secondaryTextClass}`}>{ws.description}</p>

                    <ul className={`mb-6 space-y-2 text-sm ${secondaryTextClass}`}>
                      {ws.outcomes.map((o) => (
                        <li key={o} className="flex gap-2">
                          <span className={accentTextClass}>•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={ws.href} className={`inline-flex items-center text-sm font-semibold hover:underline ${accentTextClass}`}>
                      Explore <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}>
          <div className="mx-auto max-w-4xl px-4">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-12 text-center font-serif text-3xl font-semibold md:text-4xl ${primaryTextClass}`}
            >
              Non-negotiables
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-6">
                  {chunk.map((value, idx) => (
                    <motion.div
                      key={value}
                      initial={{ opacity: 0, x: colIdx === 0 ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className={`rounded-2xl border p-6 ${cardClass}`}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                          <Star className={isDark ? "h-4 w-4 text-softGold" : "h-4 w-4 text-forest"} />
                        </div>
                        <h3 className={`text-xl font-semibold ${primaryTextClass}`}>{value}</h3>
                      </div>
                      <p className={secondaryTextClass}>
                        This value governs how we design strategy, build households, and steward influence over time.
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={`py-16 text-center ${isDark ? "bg-gradient-to-r from-forest to-softGold" : "bg-gradient-to-r from-forest to-forest/90"}`}>
          <div className="mx-auto max-w-2xl px-4">
            <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 font-serif text-3xl font-semibold text-white md:text-4xl">
              Build, don’t drift.
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-8 text-xl text-white/90">
              If you’re serious: start with the Canon, deploy a tool, or book a strategy conversation.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="flex flex-wrap justify-center gap-4">
              <Link
                href="/canon"
                className="inline-flex items-center rounded-lg bg-white px-8 py-4 font-semibold text-deepCharcoal shadow-lg transition-colors hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Enter the Canon
              </Link>
              <Link
                href="/consulting"
                className="inline-flex items-center rounded-lg border-2 border-white px-8 py-4 font-semibold text-white transition-colors hover:-translate-y-0.5 hover:bg-white hover:text-deepCharcoal"
              >
                Strategy room
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;