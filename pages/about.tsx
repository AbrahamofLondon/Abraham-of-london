// pages/about.tsx — Clean, Crisp, Legible (Final)
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
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
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Quote,
  Compass,
} from "lucide-react";

import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/imports";

// ============================================================================
// TYPES
// ============================================================================

interface Workstream {
  title: string;
  description: string;
  outcomes: string[];
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tag: string;
  gradient: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const WORKSTREAMS: Workstream[] = [
  {
    title: "Canon — the philosophical spine",
    description:
      "Long-form doctrine, strategy, and civilisation analysis designed to outlive platform cycles.",
    outcomes: [
      "Clear worldview + operating philosophy",
      "Decision frameworks for leadership under pressure",
      "Language for conviction in hostile cultural climates",
    ],
    href: "/canon",
    icon: ScrollText,
    tag: "Ideas → Institutions",
    gradient: "from-amber-500/12 to-orange-500/6",
  },
  {
    title: "Fatherhood & household architecture",
    description:
      "Tools and standards for men building homes that don't outsource authority to trends.",
    outcomes: [
      "Household rhythms, roles, and boundaries",
      "Father-led legacy planning",
      "Mentorship-grade discipline and formation",
    ],
    href: "/brands/fathering-without-fear",
    icon: Users,
    tag: "Men → Families",
    gradient: "from-blue-500/12 to-cyan-500/6",
  },
  {
    title: "Strategy rooms for founders & boards",
    description:
      "Market positioning, narrative, operating cadence, and execution design for builders.",
    outcomes: [
      "Sharper mandate + market focus",
      "Governance and operating rhythm",
      "Execution strategy that survives reality",
    ],
    href: "/consulting",
    icon: Briefcase,
    tag: "Vision → Execution",
    gradient: "from-purple-500/12 to-pink-500/6",
  },
  {
    title: "Resources — templates, playbooks, toolkits",
    description:
      "Practical assets you can deploy immediately: diagnostics and field-ready frameworks.",
    outcomes: ["Faster implementation cycles", "Reusable frameworks for teams", "Consistency without bureaucracy"],
    href: "/downloads",
    icon: BookOpen,
    tag: "Tools → Deployment",
    gradient: "from-emerald-500/12 to-teal-500/6",
  },
  {
    title: "Inner Circle — closed rooms & applied work",
    description:
      "Small rooms, higher signal for serious builders who want accountability, not applause.",
    outcomes: ["Direct access to selective work", "Closed-room discussions", "Applied thinking with feedback loops"],
    href: "/inner-circle",
    icon: Shield,
    tag: "Access → Accountability",
    gradient: "from-rose-500/12 to-red-500/6",
  },
  {
    title: "Civic & institutional thinking",
    description:
      "Governance, nation-building, and institutional design — upstream work for downstream outcomes.",
    outcomes: [
      "Institutional patterns and reform logic",
      "Cultural analysis with strategic implications",
      "Economic and governance frameworks",
    ],
    href: "/strategy",
    icon: Landmark,
    tag: "Principles → Policy",
    gradient: "from-indigo-500/12 to-violet-500/6",
  },
];

const THEME_KEY = "aof-theme";

// ============================================================================
// HELPERS
// ============================================================================

function setHtmlTheme(isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Tailwind convention
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

function safeReadTheme(): "dark" | "light" | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return null;
  } catch {
    return null;
  }
}

function safeWriteTheme(t: "dark" | "light") {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    // ignore
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

const AboutPage: NextPage = () => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.32], [1, 0]);

  React.useEffect(() => {
    setMounted(true);

    // Determine theme once on mount, then apply to <html>
    const stored = safeReadTheme();
    if (stored) {
      const dark = stored === "dark";
      setIsDark(dark);
      setHtmlTheme(dark);
      return;
    }

    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
      setIsDark(prefersDark);
      setHtmlTheme(prefersDark);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      setHtmlTheme(next);
      safeWriteTheme(next ? "dark" : "light");
      return next;
    });
  }, []);

  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const brandValues: string[] =
    ((siteConfig as any)?.brand?.values as string[] | undefined) ?? [
      "Truth over trend",
      "Responsibility over performance",
      "Order over chaos",
      "Faith over fear",
      "Legacy over applause",
      "Execution over excuses",
    ];

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
        <meta name="theme-color" content="#0b0b10" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Theme Toggle (real: toggles HTML dark class) */}
        <motion.button
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0.01 } : { delay: 0.4, duration: 0.6 }}
          onClick={toggleTheme}
          className="fixed right-6 top-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-gold/30 hover:bg-black"
          aria-label="Toggle theme"
          type="button"
        >
          {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="tabular-nums">{isDark ? "Light" : "Dark"}</span>
        </motion.button>

        {/* HERO */}
        <motion.section
          style={reduceMotion ? undefined : { opacity: heroOpacity }}
          className="relative min-h-[92vh] overflow-hidden border-b border-white/10"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.10),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_80%)]" />

          {!reduceMotion ? (
            <>
              <motion.div
                className="absolute -top-1/2 right-1/4 h-[640px] w-[640px] rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(245,158,11,0.09) 35%, transparent 70%)",
                }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-[-20%] left-1/4 h-[560px] w-[560px] rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(14,165,233,0.08) 35%, transparent 72%)",
                }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />
              <motion.div
                className="absolute left-1/2 top-10 h-24 w-[900px] -translate-x-1/2 rotate-[-9deg] bg-gradient-to-r from-transparent via-white/8 to-transparent blur-xl"
                animate={{ opacity: [0, 0.65, 0], x: ["-18%", "18%", "-18%"] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          ) : null}

          <div className="relative flex min-h-[92vh] items-center">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center">
                {/* Badge */}
                <motion.div variants={fadeIn} className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">
                      Strategic Stewardship
                    </span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.h1 variants={fadeIn} className="mx-auto mb-6 max-w-4xl">
                  <span className="font-serif text-5xl font-semibold leading-[1.06] text-white md:text-6xl lg:text-7xl">
                    Strategy for men who{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
                        actually carry
                      </span>
                      {!reduceMotion ? (
                        <motion.span
                          className="absolute inset-0 -z-0 bg-gradient-to-r from-gold/20 to-amber-200/20 blur-xl"
                          animate={{ opacity: [0.25, 0.55, 0.25] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : null}
                    </span>{" "}
                    responsibility.
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeIn}
                  className="mx-auto mb-4 max-w-3xl text-lg leading-relaxed text-gray-200 md:text-xl"
                >
                  Faith-rooted. Field-tested. Built to last.
                </motion.p>

                <motion.p variants={fadeIn} className="mx-auto max-w-2xl text-base leading-relaxed text-gray-300">
                  Abraham of London turns conviction into operating systems — for households, ventures, and institutions.
                </motion.p>

                {/* Primary actions */}
                <motion.div variants={fadeIn} className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/canon"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-sm font-semibold text-black shadow-lg shadow-gold/25 transition hover:scale-[1.02] hover:shadow-xl"
                  >
                    Enter the Canon
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/consulting"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10"
                  >
                    Work with Abraham
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                {/* Quick “start here” strip (legible, practical) */}
                <motion.div variants={fadeIn} className="mx-auto mt-10 max-w-3xl">
                  <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md md:grid-cols-3">
                    <Link
                      href="/shorts"
                      className="group rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:bg-black/40"
                    >
                      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                        <Compass className="h-4 w-4 text-gold/90" />
                        Start light
                      </div>
                      <div className="font-serif text-lg text-white">Shorts</div>
                      <div className="mt-1 text-sm text-gray-300">One minute. One point.</div>
                      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                        Open <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>

                    <Link
                      href="/downloads"
                      className="group rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:bg-black/40"
                    >
                      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                        <CheckCircle2 className="h-4 w-4 text-gold/90" />
                        Start practical
                      </div>
                      <div className="font-serif text-lg text-white">Resources</div>
                      <div className="mt-1 text-sm text-gray-300">Tools you can deploy today.</div>
                      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                        Browse <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>

                    <Link
                      href="/inner-circle"
                      className="group rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:bg-black/40"
                    >
                      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                        <Shield className="h-4 w-4 text-gold/90" />
                        Start serious
                      </div>
                      <div className="font-serif text-lg text-white">Inner Circle</div>
                      <div className="mt-1 text-sm text-gray-300">Accountability, not applause.</div>
                      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                        Request <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="h-12 w-8 rounded-full border border-white/15 p-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-gold"
                animate={reduceMotion ? undefined : { y: [0, 16, 0] }}
                transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.section>

        {/* SECTION: Portrait + Core Thesis */}
        <section className="relative py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Copy */}
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5">
                  <Target className="h-4 w-4 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">
                    What This Is
                  </span>
                </div>

                <h2 className="mb-6 font-serif text-4xl font-semibold leading-tight text-white lg:text-5xl">
                  A strategic workshop, <span className="text-gold">not a content feed</span>
                </h2>

                <div className="space-y-4 text-base leading-relaxed text-gray-200 md:text-lg">
                  <p>
                    This platform is built for people who don’t want motivational noise — they want a compass, a standard,
                    and a way to execute.
                  </p>
                  <p>
                    <strong className="font-semibold text-white">Truth exists</strong>. Conviction matters. Leadership without moral
                    architecture becomes manipulation — and the bill always shows up later.
                  </p>

                  <div className="rounded-2xl border border-gold/25 bg-gold/10 p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">
                      Foundation
                    </p>
                    <p className="text-gray-200">
                      Everything here is built on conservative Christian conviction — not as decoration, as load-bearing structure.
                    </p>
                  </div>
                </div>

                {/* What you get (crisp + scannable) */}
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    What you get here
                  </div>
                  <ul className="space-y-3 text-sm leading-relaxed text-gray-200">
                    {[
                      "Clarity: worldview and operating philosophy that reduces decision fatigue.",
                      "Structure: frameworks for households, teams, and institutions.",
                      "Execution: cadence, governance, and field-ready tools.",
                      "Signal: fewer posts, higher weight.",
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-none rounded-full bg-gold/90" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/downloads"
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-gold/90"
                  >
                    Deploy the tools
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10"
                  >
                    Inner Circle access
                    <Shield className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Portrait */}
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London — founder and strategic leader"
                    width={720}
                    height={900}
                    className="h-auto w-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="rounded-2xl border border-white/10 bg-black/70 p-5 backdrop-blur-md">
                      <p className="font-serif text-xl text-white">Abraham of London</p>
                      <p className="mt-1 text-sm text-gray-200">Strategy · Fatherhood · Legacy</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {[
                          { label: "Signal", value: "High" },
                          { label: "Standard", value: "Firm" },
                          { label: "Goal", value: "Legacy" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs uppercase tracking-[0.22em] text-gray-300">{s.label}</div>
                            <div className="mt-1 text-sm font-semibold text-white">{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle quote card for warmth + credibility */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-gray-200 backdrop-blur-md">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">
                    <Quote className="h-4 w-4" />
                    Operating Principle
                  </div>
                  <p className="text-base leading-relaxed">
                    “Build what still works when the lights go out: character, competence, covenant, and cadence.”
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION: Workstreams */}
        <section className="relative py-20">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5">
                <Briefcase className="h-4 w-4 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">Workstreams</span>
              </div>

              <h2 className="mb-4 font-serif text-4xl font-semibold text-white lg:text-5xl">What we build</h2>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-200 md:text-lg">
                Not “content.” Deliverables. Systems. Rooms where real decisions get made.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {WORKSTREAMS.map((ws, idx) => {
                const Icon = ws.icon;
                return (
                  <motion.div
                    key={ws.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.55, delay: idx * 0.05 }}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                    className={[
                      "group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-6 backdrop-blur-sm",
                      ws.gradient,
                      "transition hover:border-gold/25 hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.08),transparent_65%)]" />
                    </div>

                    <div className="relative">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <Icon className="h-6 w-6 text-gold" />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">
                          {ws.tag}
                        </span>
                      </div>

                      <h3 className="mb-3 font-serif text-2xl font-semibold text-white group-hover:text-gold">
                        {ws.title}
                      </h3>

                      <p className="mb-5 text-sm leading-relaxed text-gray-200">{ws.description}</p>

                      <ul className="mb-6 space-y-2 text-sm text-gray-200">
                        {ws.outcomes.map((o) => (
                          <li key={o} className="flex gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold/90" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={ws.href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-gold/90"
                      >
                        Explore <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* A crisp “if you only do one thing” line */}
            <div className="mx-auto mt-10 max-w-3xl text-center text-sm text-gray-300">
              If you only do one thing: start with the <Link href="/canon" className="font-semibold text-gold hover:text-gold/90">Canon</Link>.
              It sets the standard for everything else.
            </div>
          </div>
        </section>

        {/* SECTION: Values */}
        <section className="relative py-20">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5">
                <Star className="h-4 w-4 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/95">Non-Negotiables</span>
              </div>

              <h2 className="font-serif text-4xl font-semibold text-white lg:text-5xl">Foundation stones</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-200 md:text-lg">
                These aren’t slogans. They’re constraints — the kind that keep a man stable when pressure spikes.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-4">
                  {chunk.map((value, idx) => (
                    <motion.div
                      key={value}
                      initial={{ opacity: 0, x: colIdx === 0 ? -10 : 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.5, delay: idx * 0.05 }}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:border-gold/25"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-2xl border border-gold/20 bg-gold/10 p-2.5">
                          <Star className="h-4 w-4 text-gold" />
                        </div>
                        <h3 className="font-serif text-2xl font-semibold text-white">{value}</h3>
                      </div>

                      <p className="text-sm leading-relaxed text-gray-200">
                        This value governs how we design strategy, build households, and steward influence over time.
                        No theatrics — just a standard you can live inside.
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden bg-gradient-to-r from-gold to-amber-500 py-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-6 font-serif text-4xl font-semibold text-black lg:text-5xl">Build, don’t drift.</h2>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-black/90 md:text-lg">
                Start with the Canon, deploy a tool, or book a strategy conversation.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Enter the Canon
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                >
                  Strategy room
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mx-auto mt-8 max-w-xl text-xs font-semibold uppercase tracking-[0.22em] text-black/70">
                High signal. Low noise. Real outcomes.
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;