// pages/about.tsx — WORLD-CLASS FINISH
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
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

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1], 
      when: "beforeChildren", 
      staggerChildren: 0.08 
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
  },
};

// ---------------------------------------------------------------------------
// Workstreams
// ---------------------------------------------------------------------------

type Workstream = {
  title: string;
  description: string;
  outcomes: string[];
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tag: string;
  gradient: string;
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
    gradient: "from-amber-500/10 to-orange-500/5",
  },
  {
    title: "Fatherhood & household architecture",
    description:
      "Tools and standards for men building homes that don't outsource authority to trends. Practical fathering under modern pressure.",
    outcomes: [
      "Household rhythms, roles, and boundaries",
      "Father-led legacy planning (values + systems)",
      "Mentorship-grade discipline and formation",
    ],
    href: "/brands/fathering-without-fear",
    icon: Users,
    tag: "Men → Families",
    gradient: "from-blue-500/10 to-cyan-500/5",
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
    gradient: "from-purple-500/10 to-pink-500/5",
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
    gradient: "from-emerald-500/10 to-teal-500/5",
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
    gradient: "from-rose-500/10 to-red-500/5",
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
    gradient: "from-indigo-500/10 to-violet-500/5",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

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
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

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
        <meta name="theme-color" content="#0f172a" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      {/* Shell */}
      <div className="min-h-screen bg-black text-cream">
        
        {/* Theme toggle - floating */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          type="button"
          onClick={toggleTheme}
          className="fixed top-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-xs font-semibold text-cream shadow-lg backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-black/70"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <>
              <SunMedium className="h-3.5 w-3.5" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5" />
              <span>Dark</span>
            </>
          )}
        </motion.button>

        {/* Hero - Atmospheric */}
        <motion.section 
          style={reduceMotion ? {} : { opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[90vh] overflow-hidden"
        >
          {/* Background atmosphere */}
          <div className="absolute inset-0" aria-hidden="true">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
            
            {/* Ambient glows */}
            {!reduceMotion && (
              <>
                <motion.div
                  className="absolute -top-1/2 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-radial from-amber-500/15 via-amber-600/8 to-transparent blur-3xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div
                  className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-radial from-blue-500/12 to-transparent blur-3xl"
                  animate={{ 
                    scale: [1, 1.08, 1],
                    opacity: [0.25, 0.4, 0.25]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                />
              </>
            )}
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>

          {/* Content */}
          <div className="relative flex min-h-[90vh] items-center">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="text-center"
              >
                {/* Badge */}
                <motion.div
                  variants={itemVariants}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2 backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                    Strategic Stewardship
                  </span>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="mb-6 font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
                >
                  Strategy for men who{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-gold to-amber-300 bg-clip-text text-transparent">
                      actually carry
                    </span>
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-gold/20 to-amber-300/20 blur-xl"
                      animate={reduceMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </span>
                  {" "}responsibility.
                </motion.h1>

                <motion.p 
                  variants={itemVariants} 
                  className="mx-auto mb-4 max-w-3xl text-xl leading-relaxed text-gray-300 sm:text-2xl"
                >
                  Faith-rooted. Field-tested. Built to last.
                </motion.p>

                <motion.p
                  variants={itemVariants}
                  className="mx-auto max-w-2xl text-lg text-gray-400"
                >
                  Abraham of London exists to turn conviction into operating systems — for households, ventures, and institutions.
                  If you're looking for motivational content, wrong building.
                </motion.p>

                <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link 
                    href="/canon" 
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-8 py-4 font-semibold text-black shadow-lg shadow-gold/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-gold/40"
                  >
                    Enter the Canon
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <Link
                    href="/consulting"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    Work with Abraham
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={reduceMotion ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-12 w-8 rounded-full border-2 border-white/20 p-2"
            >
              <motion.div 
                className="h-2 w-2 rounded-full bg-gold"
                animate={reduceMotion ? {} : { y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Portrait + positioning */}
        <section className="relative py-24 bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }} 
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                  <Target className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    What This Is
                  </span>
                </div>

                <h2 className="mb-6 font-serif text-4xl font-semibold text-white lg:text-5xl">
                  A strategic workshop,{" "}
                  <span className="text-gold">not a content feed</span>
                </h2>

                <div className="space-y-6 text-lg leading-relaxed text-gray-300">
                  <p>
                    This platform exists to help serious men build: a household, a venture, and an internal governance structure 
                    that does not collapse under pressure.
                  </p>
                  <p>
                    The operating assumption is simple: <strong className="text-white">truth exists</strong>, conviction matters, 
                    and leadership without moral architecture becomes manipulation.
                  </p>
                  <p className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-base">
                    <strong className="text-gold">Foundation:</strong> Everything here is built on conservative Christian conviction. 
                    Not as decoration — as the foundation.
                  </p>
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link 
                    href="/downloads" 
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-black transition-all hover:bg-gold/90"
                  >
                    Deploy the tools
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    Inner Circle access
                    <Shield className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Portrait */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London — founder and strategic leader"
                    width={600}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-6 left-6 rounded-xl bg-gold px-6 py-3 shadow-lg"
                  >
                    <p className="font-semibold text-black">Abraham of London</p>
                    <p className="text-sm text-black/70">Strategy · Fatherhood · Legacy</p>
                  </motion.div>
                </div>

                {/* Ambient glow */}
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-gold/20 to-amber-500/10 blur-3xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Workstreams */}
        <section className="relative py-24 bg-gradient-to-b from-black via-gray-950 to-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="mb-16 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                <Briefcase className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Workstreams
                </span>
              </div>

              <h2 className="mb-4 font-serif text-4xl font-semibold text-white lg:text-5xl">
                What we build
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-400">
                Not "content." Deliverables. Systems. Frameworks. Rooms where real decisions get made.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workstreams.map((ws, idx) => {
                const Icon = ws.icon;
                return (
                  <motion.div
                    key={ws.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${ws.gradient} p-6 backdrop-blur-sm transition-all hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:bg-gold/10 group-hover:ring-gold/20 transition-all">
                        <Icon className="h-6 w-6 text-gold" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {ws.tag}
                      </span>
                    </div>

                    <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold transition-colors">
                      {ws.title}
                    </h3>
                    
                    <p className="mb-5 text-sm leading-relaxed text-gray-400">
                      {ws.description}
                    </p>

                    <ul className="mb-6 space-y-2 text-sm text-gray-400">
                      {ws.outcomes.map((o) => (
                        <li key={o} className="flex gap-2">
                          <span className="text-gold">•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>

                    <Link 
                      href={ws.href} 
                      className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:gap-2 transition-all"
                    >
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values Section — Optimized for Contrast and Legibility */}
<section className="relative py-24 bg-black">
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="mb-16 text-center"
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
        <Star className="h-3.5 w-3.5 text-gold" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">
          Non-Negotiables
        </span>
      </div>

      <h2 className="font-serif text-4xl font-semibold text-white lg:text-5xl">
        Foundation stones
      </h2>
    </motion.div>

    <div className="grid gap-8 md:grid-cols-2">
      {[leftValues, rightValues].map((chunk, colIdx) => (
        <div key={colIdx} className="space-y-6">
          {chunk.map((value, idx) => (
            <motion.div
              key={value}
              initial={{ opacity: 0, x: colIdx === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              {/* REFINED STYLING:
                  - bg-zinc-900/60 for deep contrast
                  - border-white/20 for crisp edges
                  - Increased backdrop-blur for glassmorphism effect
              */}
              className="group relative rounded-2xl border border-white/20 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all hover:border-gold/40 hover:bg-zinc-900/80"
            >
              {/* Subtle Ambient Light Effect (blur-3xl glow) */}
              {!reduceMotion && (
                <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-gold/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-gold/10 p-2 ring-1 ring-gold/30">
                  <Star className="h-4 w-4 text-gold" />
                </div>
                {/* FONT CHOICE: 
                    - Sans-serif for rapid legibility 
                    - text-white for maximum contrast 
                */}
                <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-gold transition-colors">
                  {value}
                </h3>
              </div>
              
              <p className="text-gray-200 leading-relaxed font-medium">
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
        <section className="relative overflow-hidden bg-gradient-to-r from-gold via-amber-500 to-gold py-20 text-center">
          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
          />

          <div className="relative mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="mb-6 font-serif text-4xl font-bold text-black lg:text-5xl">
                Build, don't drift.
              </h2>
              <p className="mb-10 text-xl text-black/80">
                If you're serious: start with the Canon, deploy a tool, or book a strategy conversation.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  Enter the Canon
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 font-semibold text-black transition-all hover:-translate-y-1 hover:bg-black hover:text-white"
                >
                  Strategy room
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;