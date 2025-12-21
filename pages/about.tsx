// pages/about.tsx — Clean, Crisp, Legible Version
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
  gradient: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const WORKSTREAMS: Workstream[] = [
  {
    title: "Canon — the philosophical spine",
    description: "Long-form doctrine, strategy, and civilisation analysis designed to outlive platform cycles.",
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
    description: "Tools and standards for men building homes that don't outsource authority to trends.",
    outcomes: [
      "Household rhythms, roles, and boundaries",
      "Father-led legacy planning",
      "Mentorship-grade discipline and formation",
    ],
    href: "/brands/fathering-without-fear",
    icon: Users,
    tag: "Men → Families",
    gradient: "from-blue-500/10 to-cyan-500/5",
  },
  {
    title: "Strategy rooms for founders & boards",
    description: "Market positioning, narrative, operating cadence, and execution design for builders.",
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
    description: "Practical assets you can deploy immediately: diagnostics and field-ready frameworks.",
    outcomes: [
      "Faster implementation cycles",
      "Reusable frameworks for teams",
      "Consistency without bureaucracy",
    ],
    href: "/downloads",
    icon: BookOpen,
    tag: "Tools → Deployment",
    gradient: "from-emerald-500/10 to-teal-500/5",
  },
  {
    title: "Inner Circle — closed rooms & applied work",
    description: "Small rooms, higher signal for serious builders who want accountability, not applause.",
    outcomes: [
      "Direct access to selective work",
      "Closed-room discussions",
      "Applied thinking with feedback loops",
    ],
    href: "/inner-circle",
    icon: Shield,
    tag: "Access → Accountability",
    gradient: "from-rose-500/10 to-red-500/5",
  },
  {
    title: "Civic & institutional thinking",
    description: "Governance, nation-building, and institutional design — upstream work for downstream outcomes.",
    outcomes: [
      "Institutional patterns and reform logic",
      "Cultural analysis with strategic implications",
      "Economic and governance frameworks",
    ],
    href: "/strategy",
    icon: Landmark,
    tag: "Principles → Policy",
    gradient: "from-indigo-500/10 to-violet-500/5",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  React.useEffect(() => {
    setMounted(true);
    // Safe theme detection
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem("aof-theme");
        if (stored === "light" || stored === "dark") {
          setIsDark(stored === "dark");
          return;
        }
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(prefersDark);
      } catch {
        // Fallback to dark
        setIsDark(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      localStorage.setItem("aof-theme", newTheme ? "dark" : "light");
    } catch {
      // Ignore storage errors
    }
  };

  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const brandValues = (siteConfig as any)?.brand?.values || [];
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

      <div className="min-h-screen bg-black text-white">
        {/* Theme Toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={toggleTheme}
          className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-gold/30 hover:bg-black"
          aria-label="Toggle theme"
        >
          {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDark ? "Light" : "Dark"}</span>
        </motion.button>

        {/* Hero Section */}
        <motion.section 
          style={reduceMotion ? {} : { opacity: heroOpacity }}
          className="relative min-h-[90vh] overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          
          {!reduceMotion && (
            <>
              <motion.div
                className="absolute -top-1/2 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-radial from-amber-500/15 via-transparent to-transparent blur-3xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-radial from-blue-500/12 via-transparent to-transparent blur-3xl"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              />
            </>
          )}

          <div className="relative flex min-h-[90vh] items-center">
            <div className="mx-auto max-w-6xl px-6 py-20">
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="text-center"
              >
                {/* Badge */}
                <motion.div variants={fadeIn} className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                      Strategic Stewardship
                    </span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.h1 variants={fadeIn} className="mb-6">
                  <div className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
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
                  </div>
                </motion.h1>

                {/* Subheadings */}
                <motion.p variants={fadeIn} className="mx-auto mb-4 max-w-3xl text-xl text-gray-300 md:text-2xl">
                  Faith-rooted. Field-tested. Built to last.
                </motion.p>

                <motion.p variants={fadeIn} className="mx-auto max-w-2xl text-lg text-gray-400">
                  Abraham of London turns conviction into operating systems — for households, ventures, and institutions.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div variants={fadeIn} className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link 
                    href="/canon" 
                    className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-8 py-4 font-semibold text-black shadow-lg shadow-gold/25 transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Enter the Canon
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <Link
                    href="/consulting"
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    Work with Abraham
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="h-12 w-8 rounded-full border border-white/20 p-2">
              <motion.div 
                className="h-2 w-2 rounded-full bg-gold"
                animate={reduceMotion ? {} : { y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.section>

        {/* Portrait Section */}
        <section className="relative py-20 bg-black">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                    <Target className="h-3.5 w-3.5 text-gold" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                      What This Is
                    </span>
                  </div>
                </div>

                <h2 className="mb-6 font-serif text-4xl font-bold text-white lg:text-5xl">
                  A strategic workshop,{" "}
                  <span className="text-gold">not a content feed</span>
                </h2>

                <div className="space-y-4 text-lg leading-relaxed text-gray-300">
                  <p>
                    This platform helps serious men build: a household, a venture, and an internal governance structure 
                    that withstands pressure.
                  </p>
                  <p>
                    <strong className="font-semibold text-white">Truth exists</strong>, conviction matters, 
                    and leadership without moral architecture becomes manipulation.
                  </p>
                  <div className="rounded-lg border border-gold/30 bg-gold/10 p-4">
                    <p className="font-semibold text-gold mb-1">Foundation:</p>
                    <p className="text-gray-300">
                      Everything here is built on conservative Christian conviction. Not as decoration — as the foundation.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link 
                    href="/downloads" 
                    className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-black transition-all hover:bg-gold/90"
                  >
                    Deploy the tools
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    Inner Circle access
                    <Shield className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Portrait */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London — founder and strategic leader"
                    width={600}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-6 left-6 rounded-lg bg-black/90 px-6 py-3 backdrop-blur-sm"
                  >
                    <p className="font-semibold text-white">Abraham of London</p>
                    <p className="text-sm text-gray-400">Strategy · Fatherhood · Legacy</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Workstreams Section */}
        <section className="relative py-20 bg-black">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                <Briefcase className="h-3.5 w-3.5 text-gold" />
                <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                  Workstreams
                </span>
              </div>

              <h2 className="mb-4 font-serif text-4xl font-bold text-white lg:text-5xl">
                What we build
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-400">
                Not "content." Deliverables. Systems. Frameworks. Rooms where real decisions get made.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {WORKSTREAMS.map((ws, idx) => {
                const Icon = ws.icon;
                return (
                  <motion.div
                    key={ws.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${ws.gradient} p-6 backdrop-blur-sm transition-all hover:border-gold/30`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                        <Icon className="h-6 w-6 text-gold" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-gray-400">
                        {ws.tag}
                      </span>
                    </div>

                    <h3 className="mb-3 text-xl font-bold text-white group-hover:text-gold">
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
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="relative py-20 bg-black">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-12 text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                <Star className="h-3.5 w-3.5 text-gold" />
                <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                  Non-Negotiables
                </span>
              </div>

              <h2 className="font-serif text-4xl font-bold text-white lg:text-5xl">
                Foundation stones
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-4">
                  {chunk.map((value, idx) => (
                    <motion.div
                      key={value}
                      initial={{ opacity: 0, x: colIdx === 0 ? -10 : 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="rounded-lg border border-white/20 bg-gray-900/50 p-5 backdrop-blur-sm hover:border-gold/30 transition-colors"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-lg bg-gold/10 p-2">
                          <Star className="h-4 w-4 text-gold" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {value}
                        </h3>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed">
                        This value governs how we design strategy, build households, and steward influence over time.
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative bg-gradient-to-r from-gold to-amber-500 py-16 text-center">
          <div className="relative mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 font-serif text-4xl font-bold text-black lg:text-5xl">
                Build, don't drift.
              </h2>
              <p className="mb-10 text-xl text-black/90">
                Start with the Canon, deploy a tool, or book a strategy conversation.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/canon"
                  className="flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-1"
                >
                  Enter the Canon
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/consulting"
                  className="flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 font-semibold text-black transition-all hover:bg-black hover:text-white"
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