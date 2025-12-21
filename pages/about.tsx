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

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.08 }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const AboutPage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => { setMounted(true); }, []);

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

      <div className="min-h-screen bg-black text-white">
        
        {/* 1. COMPACT HERO (Reduced by 3/4) */}
        <section className="relative pt-32 pb-16 flex items-center justify-center bg-zinc-950 overflow-hidden border-b border-white/5">
          <div className="relative z-10 max-w-4xl px-6 text-center">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-4 py-2 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Strategic Stewardship</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="font-serif text-4xl font-bold leading-tight md:text-6xl text-white">
                Architecture for <span className="text-gold italic">Legacy.</span>
              </motion.h1>
            </motion.div>
          </div>
        </section>

        {/* 2. PORTRAIT & POSITIONING */}
        <section className="py-24 bg-black">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-3 py-1 backdrop-blur-sm">
                  <Target className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">What This Is</span>
                </div>
                <h2 className="mb-6 font-serif text-3xl font-semibold text-white md:text-5xl">
                  A strategic workshop, <span className="text-gold">not a feed.</span>
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed font-sans mb-6">
                  Abraham of London exists to turn conviction into operating systems. We build for men who carry responsibility for households, ventures, and institutions.
                </p>
                <div className="mt-8 flex gap-4">
                  <Link href="/consulting" className="rounded-full bg-gold px-8 py-3 font-bold text-black transition-all hover:scale-105">Strategy Room</Link>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative group">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <Image src="/assets/images/profile-portrait.webp" alt="Abraham" width={600} height={700} className="w-full grayscale group-hover:grayscale-0 transition-all duration-700" priority />
                </div>
                <div className="absolute -inset-4 -z-10 bg-gold/10 blur-3xl rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. FOUNDATION STONES (Restored) */}
        <section className="py-24 bg-zinc-950 border-t border-white/5">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-3 py-1 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Non-Negotiables</span>
              </div>
              <h2 className="font-serif text-4xl font-bold text-white">Foundation Stones</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {[leftValues, rightValues].map((chunk, colIdx) => (
                <div key={colIdx} className="space-y-6">
                  {chunk.map((value: string) => (
                    <div key={value} className="group rounded-2xl border border-white/10 bg-zinc-900/90 p-8 hover:border-gold/40 transition-all backdrop-blur-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <Star className="h-5 w-5 text-gold" />
                        <h3 className="text-xl font-bold tracking-tight text-white font-sans">{value}</h3>
                      </div>
                      <p className="text-gray-300 leading-relaxed font-sans text-sm">
                        This principle governs how we design strategy and steward influence over time.
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