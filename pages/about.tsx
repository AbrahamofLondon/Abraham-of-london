// pages/about.tsx - Fully Polished, Legible, Sectioned (Dark-first, crisp separation)
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
  accent: "amber" | "blue" | "purple" | "emerald" | "rose" | "indigo";
}

// ============================================================================
// MOTION
// ============================================================================

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

// ============================================================================
// DATA
// ============================================================================

const WORKSTREAMS: Workstream[] = [
  {
    title: "Canon - the philosophical spine",
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
    accent: "amber",
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
    accent: "blue",
  },
  {
    title: "Strategy rooms for founders & boards",
    description:
      "Market positioning, narrative, operating cadence, and execution design for builders.",
    outcomes: ["Sharper mandate + market focus", "Governance and operating rhythm", "Execution that survives reality"],
    href: "/consulting",
    icon: Briefcase,
    tag: "Vision → Execution",
    accent: "purple",
  },
  {
    title: "Resources - templates, playbooks, toolkits",
    description:
      "Practical assets you can deploy immediately: diagnostics and field-ready frameworks.",
    outcomes: ["Faster implementation cycles", "Reusable frameworks for teams", "Consistency without bureaucracy"],
    href: "/downloads",
    icon: BookOpen,
    tag: "Tools → Deployment",
    accent: "emerald",
  },
  {
    title: "Inner Circle - closed rooms & applied work",
    description:
      "Small rooms, higher signal for serious builders who want accountability, not applause.",
    outcomes: ["Direct access to selective work", "Closed-room discussions", "Applied thinking with feedback loops"],
    href: "/inner-circle",
    icon: Shield,
    tag: "Access → Accountability",
    accent: "rose",
  },
  {
    title: "Civic & institutional thinking",
    description:
      "Governance, nation-building, and institutional design - upstream work for downstream outcomes.",
    outcomes: ["Institutional patterns and reform logic", "Cultural analysis with strategic implications", "Economic and governance frameworks"],
    href: "/strategy",
    icon: Landmark,
    tag: "Principles → Policy",
    accent: "indigo",
  },
];

// ============================================================================
// STYLE HELPERS
// ============================================================================

const ACCENTS = {
  amber: {
    ring: "ring-amber-400/20",
    border: "border-amber-400/20 hover:border-amber-400/35",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    icon: "text-amber-300",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    chip: "bg-amber-400/10 text-amber-200 border-amber-400/20",
    link: "text-amber-200 hover:text-amber-100",
  },
  blue: {
    ring: "ring-sky-400/20",
    border: "border-sky-400/20 hover:border-sky-400/35",
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    icon: "text-sky-200",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    chip: "bg-sky-400/10 text-sky-200 border-sky-400/20",
    link: "text-sky-200 hover:text-sky-100",
  },
  purple: {
    ring: "ring-fuchsia-400/20",
    border: "border-fuchsia-400/20 hover:border-fuchsia-400/35",
    badge: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200",
    icon: "text-fuchsia-200",
    glow: "from-fuchsia-500/16 via-fuchsia-500/6 to-transparent",
    chip: "bg-fuchsia-400/10 text-fuchsia-200 border-fuchsia-400/20",
    link: "text-fuchsia-200 hover:text-fuchsia-100",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    icon: "text-emerald-200",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    chip: "bg-emerald-400/10 text-emerald-200 border-emerald-400/20",
    link: "text-emerald-200 hover:text-emerald-100",
  },
  rose: {
    ring: "ring-rose-400/20",
    border: "border-rose-400/20 hover:border-rose-400/35",
    badge: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    icon: "text-rose-200",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    chip: "bg-rose-400/10 text-rose-200 border-rose-400/20",
    link: "text-rose-200 hover:text-rose-100",
  },
  indigo: {
    ring: "ring-indigo-400/20",
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    badge: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    icon: "text-indigo-200",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    chip: "bg-indigo-400/10 text-indigo-200 border-indigo-400/20",
    link: "text-indigo-200 hover:text-indigo-100",
  },
} as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ============================================================================
// PAGE
// ============================================================================

const AboutPage: NextPage = () => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.25]);

  // NOTE: Your Layout likely already controls dark mode.
  // This toggle is purely "page mood" (subtle), not Tailwind dark: class switching.
  const [moodLight, setMoodLight] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aol-about-mood");
      if (stored === "light") setMoodLight(true);
      if (stored === "dark") setMoodLight(false);
    } catch {
      // ignore
    }
  }, []);

  const toggleMood = () => {
    setMoodLight((p) => {
      const next = !p;
      try {
        localStorage.setItem("aol-about-mood", next ? "light" : "dark");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const brandValues = ((siteConfig as any)?.brand?.values as string[]) || [
    "Truth over trend",
    "Responsibility over vibes",
    "Covenant over convenience",
    "Competence over noise",
    "Legacy over ego",
    "Stewardship over status",
  ];
  const leftValues = brandValues.slice(0, Math.ceil(brandValues.length / 2));
  const rightValues = brandValues.slice(Math.ceil(brandValues.length / 2));

  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London - Strategy, Fatherhood, Legacy</title>
        <meta
          name="description"
          content="Abraham of London builds faith-rooted strategy, fatherhood tools, and legacy frameworks for serious men, founders, and leaders."
        />
        <meta property="og:title" content="About Abraham of London - Strategy, Fatherhood, Legacy" />
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
        {/* Mood toggle (legible, never disappears) */}
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, ease: easeSettle, delay: 0.2 }}
          onClick={toggleMood}
          className={cx(
            "fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold backdrop-blur-md",
            "border-white/12 bg-black/70 text-white hover:border-white/20 hover:bg-black/80",
          )}
          aria-label="Toggle page mood"
          type="button"
        >
          {moodLight ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
          <span>{moodLight ? "Dark mood" : "Light mood"}</span>
        </motion.button>

        {/* =========================================================
            HERO (LEGIBLE + SEPARATED)
           ========================================================= */}
        <motion.section
          style={reduceMotion ? {} : { opacity: heroOpacity }}
          className="relative isolate overflow-hidden border-b border-white/8"
        >
          {/* Background: higher contrast and a "clean stage" behind text */}
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[#07070c]" />
            <div
              className={cx(
                "absolute inset-0",
                moodLight
                  ? "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]"
                  : "bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_55%)]",
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.10),transparent_55%)]" />

            {!reduceMotion ? (
              <>
                <motion.div
                  className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-amber-400/14 blur-3xl"
                  animate={{ x: [0, 30, 0], y: [0, -18, 0], opacity: [0.18, 0.32, 0.18] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-48 -left-48 h-[560px] w-[560px] rounded-full bg-blue-500/12 blur-3xl"
                  animate={{ x: [0, -24, 0], y: [0, 22, 0], opacity: [0.14, 0.26, 0.14] }}
                  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                <motion.div
                  className="absolute left-1/2 top-10 h-24 w-[860px] -translate-x-1/2 rotate-[-8deg] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl"
                  animate={{ opacity: [0, 0.55, 0], x: ["-10%", "10%", "-10%"] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            ) : null}

            {/* Text legibility plate */}
            <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
            <div
              className={cx(
                "absolute inset-0",
                moodLight
                  ? "bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.55)_75%)]"
                  : "bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.70)_78%)]",
              )}
            />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center">
              <motion.div variants={fadeUp} className="mb-7 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                    Strategic stewardship
                  </span>
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                Strategy for men who{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">
                  actually carry
                </span>{" "}
                responsibility.
              </motion.h1>

              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-3xl text-lg text-white/80 sm:text-xl">
                Faith-rooted. Field-tested. Built to last.
              </motion.p>

              <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Abraham of London turns conviction into operating systems - for households, ventures, and institutions.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/canon"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-8 py-4 font-semibold text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-amber-500/35"
                >
                  Enter the Canon
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/7 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/28 hover:bg-white/10"
                >
                  Work with Abraham
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              {/* Hero quick-start cards (separated, readable, not muddy) */}
              <motion.div variants={fadeUp} className="mx-auto mt-12 max-w-5xl">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      k: "Start light",
                      title: "Shorts",
                      desc: "One minute. One point.",
                      href: "/shorts",
                      accent: "amber" as const,
                    },
                    {
                      k: "Start practical",
                      title: "Resources",
                      desc: "Tools you can deploy today.",
                      href: "/downloads",
                      accent: "emerald" as const,
                    },
                    {
                      k: "Start serious",
                      title: "Inner Circle",
                      desc: "Accountability, not applause.",
                      href: "/inner-circle",
                      accent: "rose" as const,
                    },
                  ].map((c) => {
                    const A = ACCENTS[c.accent];
                    return (
                      <Link
                        key={c.title}
                        href={c.href}
                        className={cx(
                          "group relative overflow-hidden rounded-2xl border bg-white/[0.06] p-5 backdrop-blur-md transition",
                          "border-white/12 hover:border-white/22",
                          "hover:-translate-y-0.5",
                        )}
                      >
                        <div className={cx("absolute inset-0 opacity-70", "bg-gradient-to-br", A.glow)} />
                        <div className="relative">
                          <div className={cx("mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]", A.chip)}>
                            <span className="opacity-90">◎</span>
                            {c.k}
                          </div>
                          <div className="font-serif text-xl font-semibold text-white">{c.title}</div>
                          <p className="mt-2 text-sm text-white/72">{c.desc}</p>
                          <div className={cx("mt-4 inline-flex items-center gap-2 text-sm font-semibold", A.link)}>
                            Open <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* =========================================================
            SECTION DIVIDER (prevents "muddled together")
           ========================================================= */}
        <div className="border-b border-white/8 bg-[#0a0a11]">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <p className="text-center text-xs uppercase tracking-[0.28em] text-white/55">
              Signal over noise · Systems over vibes · Legacy over ego
            </p>
          </div>
        </div>

        {/* =========================================================
    PORTRAIT / WHAT THIS IS (UNMUDDLED + CLEAR HIERARCHY)
   ========================================================= */}
<section className="relative bg-[#070710] py-20">
  <div className="absolute inset-0" aria-hidden="true">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
  </div>

  <div className="relative mx-auto max-w-6xl px-6">
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      {/* LEFT: COPY (clean, not stacked into chaos) */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle }}
        className="relative"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1">
          <Target className="h-4 w-4 text-amber-200" />
          <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
            What this is
          </span>
        </div>

        <h2 className="font-serif text-4xl font-bold leading-tight text-white lg:text-5xl">
          A strategic workshop,{" "}
          <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
            not a content feed
          </span>
        </h2>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-white/78 sm:text-lg">
          <p>
            This platform helps serious men build: a household, a venture, and an internal governance structure
            that withstands pressure.
          </p>
          <p>
            <span className="font-semibold text-white">Truth exists</span>, conviction matters, and leadership without
            moral architecture becomes manipulation - and the bill always shows up later.
          </p>
        </div>

        {/* FOUNDATION (single, strong card) */}
        <div className="mt-7 rounded-3xl border border-amber-400/25 bg-amber-400/8 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Foundation</p>
          <p className="mt-2 text-white/82">
            Everything here is built on conservative Christian conviction - not as decoration, as load-bearing structure.
          </p>
        </div>

        {/* 3 PILLARS (clean row, no clutter) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Clarity",
              body: "Worldview + operating philosophy that reduces decision fatigue.",
            },
            {
              title: "Structure",
              body: "Frameworks for households, teams, and institutions.",
            },
            {
              title: "Execution",
              body: "Cadence, governance, and field-ready tools.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md"
            >
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 font-semibold text-black transition hover:bg-amber-200"
          >
            Deploy the tools <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/inner-circle"
            className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/7 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:border-white/28 hover:bg-white/10"
          >
            Inner Circle access <Shield className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* RIGHT: PORTRAIT (NO TEXT ON IMAGE) */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle, delay: 0.05 }}
        className="relative"
      >
        {/* Portrait card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/50">
          <div className="relative overflow-hidden rounded-2xl">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham of London - founder and strategic leader"
              width={720}
              height={900}
              className="h-auto w-full"
              priority
            />
            {/* Only a gentle gradient; NO TEXT overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>

          {/* Caption BELOW image (clean + readable) */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
            <p className="font-serif text-xl text-white">Abraham of London</p>
            <p className="mt-1 text-sm text-white/70">Strategy · Fatherhood · Legacy</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-xl border border-white/12 bg-white/7 px-3 py-2 text-[11px] font-semibold text-white/85">
                SIGNAL <span className="ml-2 font-black text-amber-200">High</span>
              </span>
              <span className="rounded-xl border border-white/12 bg-white/7 px-3 py-2 text-[11px] font-semibold text-white/85">
                STANDARD <span className="ml-2 font-black text-amber-200">Firm</span>
              </span>
              <span className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                STEWARDSHIP
              </span>
            </div>
          </div>

          {/* Operating principle BELOW caption (no stacking on photo) */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
              Operating principle
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              "Build what still works when the lights go out - character, competence, covenant, and cadence."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</section>

        {/* =========================================================
            WORKSTREAMS (distinct background + clear color coding)
           ========================================================= */}
        <section className="relative bg-[#06060c] py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-1">
                <Briefcase className="h-4 w-4 text-amber-200" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-white/75">Workstreams</span>
              </div>

              <h2 className="font-serif text-4xl font-bold text-white lg:text-5xl">What we build</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
                Not "content." Deliverables. Systems. Frameworks. Rooms where real decisions get made.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {WORKSTREAMS.map((ws, idx) => {
                const Icon = ws.icon;
                const A = ACCENTS[ws.accent];

                return (
                  <motion.div
                    key={ws.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, ease: easeSettle, delay: idx * 0.04 }}
                    whileHover={reduceMotion ? {} : { y: -4 }}
                    className={cx(
                      "group relative overflow-hidden rounded-3xl border bg-white/[0.05] p-6 backdrop-blur-md transition",
                      A.border,
                    )}
                  >
                    <div className={cx("absolute inset-0 opacity-80 bg-gradient-to-br", A.glow)} />
                    <div className="relative">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className={cx("rounded-2xl bg-white/7 p-3 ring-1", A.ring)}>
                          <Icon className={cx("h-6 w-6", A.icon)} />
                        </div>
                        <span className="rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          {ws.tag}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-semibold text-white">{ws.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{ws.description}</p>

                      <ul className="mt-5 space-y-2 text-sm text-white/70">
                        {ws.outcomes.map((o) => (
                          <li key={o} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/55" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6">
                        <Link
                          href={ws.href}
                          className={cx("inline-flex items-center gap-2 text-sm font-semibold", A.link)}
                        >
                          Explore <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            VALUES (clean columns + readable cards)
           ========================================================= */}
        <section className="relative bg-[#070710] py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_55%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1">
                <Star className="h-4 w-4 text-amber-200" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Non-negotiables
                </span>
              </div>

              <h2 className="font-serif text-4xl font-bold text-white lg:text-5xl">Foundation stones</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
                These are load-bearing. If they offend trends, good.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-4">
                  {chunk.map((value, idx) => (
                    <motion.div
                      key={`${value}-${idx}`}
                      initial={{ opacity: 0, x: colIdx === 0 ? -12 : 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.55, ease: easeSettle, delay: idx * 0.03 }}
                      className="rounded-3xl border border-white/12 bg-white/[0.05] p-6 backdrop-blur-md transition hover:border-amber-400/25"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-2xl bg-amber-400/10 p-2 ring-1 ring-amber-400/20">
                          <Star className="h-4 w-4 text-amber-200" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{value}</h3>
                      </div>

                      <p className="text-sm leading-relaxed text-white/72">
                        This governs how we design strategy, build households, and steward influence over time.
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA (high contrast)
           ========================================================= */}
        <section className="relative overflow-hidden border-t border-white/10 bg-gradient-to-r from-amber-300 to-amber-500 py-16 text-center">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.25),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle }}
            >
              <h2 className="font-serif text-4xl font-bold text-black lg:text-5xl">Build, don't drift.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-black/85 sm:text-xl">
                Start with the Canon, deploy a tool, or book a strategy conversation.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Enter the Canon <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 font-semibold text-black transition-all hover:bg-black hover:text-white"
                >
                  Strategy room <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.26em] text-black/75">
                Serious men. Serious systems.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;