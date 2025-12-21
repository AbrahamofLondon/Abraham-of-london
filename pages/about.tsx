// pages/about.tsx — FULL ROBUST VERSION
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

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], when: "beforeChildren", staggerChildren: 0.08 }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// --- Workstreams Definition ---
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
    description: "Long-form doctrine, strategy, and civilisation analysis designed to outlive platform cycles. Not vibes. Architecture.",
    outcomes: ["Clear worldview + operating philosophy", "Decision frameworks for leadership", "Language for conviction"],
    href: "/canon",
    icon: ScrollText,
    tag: "Ideas → Institutions",
    gradient: "from-amber-500/20 to-orange-600/10",
  },
  {
    title: "Fatherhood & household architecture",
    description: "Tools and standards for men building homes that don't outsource authority to trends.",
    outcomes: ["Household rhythms & boundaries", "Father-led legacy planning", "Mentorship-grade discipline"],
    href: "/brands/fathering-without-fear",
    icon: Users,
    tag: "Men → Families",
    gradient: "from-blue-500/20 to-cyan-600/10",
  },
  {
    title: "Strategy rooms for founders & boards",
    description: "Market positioning, narrative, operating cadence, and execution design. Built for builders.",
    outcomes: ["Sharper mandate & market focus", "Governance & operating rhythm", "Execution strategy"],
    href: "/consulting",
    icon: Briefcase,
    tag: "Vision → Execution",
    gradient: "from-purple-500/20 to-pink-600/10",
  },
  {
    title: "Resources — templates & playbooks",
    description: "Practical assets you can deploy immediately: diagnostics, operating packs, and field-ready frameworks.",
    outcomes: ["Faster implementation cycles", "Reusable frameworks", "Consistency without bureaucracy"],
    href: "/downloads",
    icon: BookOpen,
    tag: "Tools → Deployment",
    gradient: "from-emerald-500/20 to-teal-600/10",
  },
  {
    title: "Inner Circle — applied work",
    description: "Small rooms, higher signal. A tighter layer for serious builders who want accountability.",
    outcomes: ["Selective work access", "Closed-room discussions", "Applied thinking loops"],
    href: "/inner-circle",
    icon: Shield,
    tag: "Access → Accountability",
    gradient: "from-rose-500/20 to-red-600/10",
  },
  {
    title: "Civic & institutional thinking",
    description: "Governance, nation-building, and institutional design — the upstream work behind downstream outcomes.",
    outcomes: ["Institutional reform logic", "Cultural analysis", "Economic frameworks"],
    href: "/strategy",
    icon: Landmark,
    tag: "Principles → Policy",
    gradient: "from-indigo-500/20 to-violet-600/10",
  },
];

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("aof-theme") || "dark";
    setIsDark(stored === "dark");
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      localStorage.setItem("aof-theme", !prev ? "dark" : "light");
      return !prev;
    });
  };

  if (!mounted) return <Layout title="About"><div className="min-h-screen bg-black" /></Layout>;

  const brandCfg = (siteConfig as any).brand;
  const brandValues = brandCfg?.values ?? [];
  const leftValues = brandValues.slice(0, Math.ceil(brandValues.length / 2));
  const rightValues = brandValues.slice(Math.ceil(brandValues.length / 2));

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London</title>
      </Head>

      <div className="min-h-screen bg-black text-white selection:bg-gold/30 selection:text-gold">
        {/* Fixed Contrast Hero */}
        <motion.section 
          style={reduceMotion ? {} : { opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
          
          <div className="relative z-10 max-w-5xl px-6 text-center">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Strategic Stewardship</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="mb-8 font-serif text-5xl font-bold leading-[1.1] md:text-7xl lg:text-8xl">
                Strategy for men who <br />
                <span className="text-gold italic">actually carry</span> responsibility.
              </motion.h1>

              <motion.p variants={itemVariants} className="mx-auto mb-12 max-w-2xl text-xl text-gray-200 md:text-2xl leading-relaxed">
                Faith-rooted. Field-tested. Built to turn conviction into operating systems.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6">
                <Link href="/canon" className="rounded-full bg-gold px-10 py-4 font-bold text-black transition-transform hover:scale-105">
                  Enter the Canon
                </Link>
                <Link href="/consulting" className="rounded-full border border-white/20 bg-white/5 px-10 py-4 font-bold text-white backdrop-blur-md hover:bg-white/10 transition-all">
                  Strategy Room
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* High Legibility Workstreams */}
        <section className="py-32 bg-black border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 text-center">
              <h2 className="font-serif text-4xl font-bold md:text-6xl mb-6">What we build</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">Not "content." Deliverables. Systems. Frameworks.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {workstreams.map((ws, i) => (
                <motion.div
                  key={ws.title}
                  whileHover={{ y: -8 }}
                  className={`group relative rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl transition-all hover:border-gold/50`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${ws.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <ws.icon className="relative z-10 h-8 w-8 text-gold mb-6" />
                  <h3 className="relative z-10 text-xl font-bold mb-4">{ws.title}</h3>
                  <p className="relative z-10 text-gray-200 text-sm leading-relaxed mb-6">{ws.description}</p>
                  <Link href={ws.href} className="relative z-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold">
                    Explore <ArrowRight className="h-3 w-3" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Foundation Stones Section */}
        <section className="py-32 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-20 text-center">
               <h2 className="font-serif text-4xl font-bold md:text-6xl">Foundation stones</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-6">
                  {chunk.map((value: string) => (
                    <div key={value} className="group rounded-2xl border border-white/10 bg-zinc-900/90 p-8 hover:border-gold/40 transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <Star className="h-5 w-5 text-gold" />
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">{value}</h3>
                      </div>
                      <p className="text-gray-200 leading-relaxed font-medium">
                        This value governs how we design strategy, build households, and steward influence.
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;