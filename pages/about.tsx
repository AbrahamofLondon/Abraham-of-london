// pages/about.tsx — ABOUT (HOUSE EDITION / ELEVATED / FINAL)

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  BookOpen,
  Briefcase,
  Landmark,
  ArrowRight,
  ChevronRight,
  Crown,
  Scale,
  Target,
  Heart,
  Leaf,
  Eye,
  Lamp,
  Pen,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
        <Crown className="relative h-4 w-4 text-amber-300/50" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
    </div>
  );
}

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[12%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.06] blur-[140px]" />
      <div className="absolute right-[10%] top-[24%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />

      <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-20 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute left-12 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent lg:block" />
      <div className="absolute right-12 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent lg:block" />

      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-soft-light"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.1\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: "400px 400px",
        }}
      />
    </div>
  );
}

function WorkstreamCard({
  icon: Icon,
  title,
  desc,
  href,
  index,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  href: string;
  index: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.03]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 180px at 0% 0%, rgba(245,158,11,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.14))",
        }}
      />

      <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-amber-400/20 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
          <Icon className="relative h-6 w-6 text-amber-400/72 transition-colors group-hover:text-amber-300" />
        </div>

        <h3 className="mt-5 font-serif text-xl text-white transition-colors group-hover:text-amber-50">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-white/48 transition-colors group-hover:text-white/55">
          {desc}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/60 transition-colors group-hover:text-amber-300">
          <span>Explore</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>

        <span className="absolute bottom-0 right-0 font-mono text-[8px] text-white/10">
          {index}
        </span>
      </div>
    </Link>
  );
}

function PrinciplePillar({
  icon: Icon,
  text,
  delay,
}: {
  icon: React.ComponentType<any>;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease }}
      className="group border border-white/[0.08] bg-white/[0.02] p-6 text-left transition-colors hover:border-amber-400/20"
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
        <Icon className="relative h-5 w-5 text-amber-400/70 transition-colors group-hover:text-amber-300" />
      </div>
      <p className="font-serif text-lg text-white transition-colors group-hover:text-amber-50">
        {text}
      </p>
    </motion.div>
  );
}

const AboutPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <Head>
        <title>About | Abraham of London</title>
        <meta
          name="description"
          content="Faith-rooted strategy, fatherhood architecture, and institutional thinking for serious builders."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <main className="relative min-h-screen bg-black text-white">
        <AmbientField />

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={reduceMotion ? { duration: 0 } : undefined}
                className="max-w-4xl"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-6 w-px bg-amber-400/30" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
                    STRATEGIC STEWARDSHIP
                  </span>
                </div>

                <h1 className="font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]">
                  Strategy for men who
                  <span className="mt-3 block text-white/58">
                    carry responsibility
                  </span>
                </h1>

                <p className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-white/56">
                  Not motivation. Not vibes. Operating systems for households,
                  ventures, and institutions.
                </p>

                <div className="mt-12 flex flex-wrap gap-4">
                  <Link
                    href="/canon"
                    className="group relative inline-flex items-center justify-center gap-3 overflow-hidden bg-white px-8 py-4 transition-all duration-500 hover:bg-amber-50"
                  >
                    <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-black">
                      Enter the Canon
                    </span>
                    <ChevronRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-100 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>

                  <Link
                    href="/consulting"
                    className="group relative inline-flex items-center justify-center gap-3 overflow-hidden border border-white/10 px-8 py-4 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 group-hover:text-white">
                      Strategy Room
                    </span>
                    <ArrowRight className="relative z-10 h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-amber-400/28 to-transparent" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    SINCE 2018
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.6, ease }
                }
                className="self-start lg:justify-self-end"
              >
                <div className="relative w-full max-w-[280px] border border-white/[0.08] bg-white/[0.02] p-4 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="absolute right-0 top-0 h-10 w-10 border-r border-t border-amber-400/20" />
                  <div className="absolute bottom-0 left-0 h-10 w-10 border-b border-l border-amber-400/20" />

                  <Image
                    src="/assets/images/profile-portrait.webp"
                    alt="Abraham of London"
                    width={420}
                    height={560}
                    className="h-auto w-full rounded-none object-cover"
                    priority
                  />

                  <div className="mt-4 border border-white/10 bg-black/45 p-4">
                    <p className="font-serif text-lg text-white">
                      Abraham of London
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Strategy · Fatherhood · Legacy
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <Pen className="h-3 w-3 text-amber-400/40" />
                      <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                        FOUNDER
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHAT THIS IS */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={reduceMotion ? { duration: 0 } : undefined}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-6 w-px bg-amber-400/30" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
                    ORIENTATION
                  </span>
                </div>

                <h2 className="font-serif text-4xl text-white md:text-5xl">
                  A strategic workshop
                  <span className="mt-2 block text-white/58">
                    not a content feed
                  </span>
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.6, ease }
                }
              >
                <div className="space-y-5 text-[1.02rem] leading-relaxed text-white/54">
                  <p>
                    Abraham of London exists to translate conviction into
                    structure. Worldview into operating cadence. Belief into
                    deployable systems.
                  </p>
                  <p>
                    This is upstream work: fatherhood, governance, strategy, and
                    institutional design. If that feels heavy, it should.
                  </p>
                </div>

                <div className="relative mt-8 border border-amber-400/18 bg-amber-400/[0.06] p-8">
                  <Lamp className="absolute right-4 top-4 h-5 w-5 text-amber-400/30" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/80">
                    Foundation
                  </p>
                  <p className="mt-3 text-white/82">
                    Conservative Christian ethics — not as ornament, but as
                    load-bearing structure.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* WORKSTREAMS */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16 text-center">
              <div className="mb-6 flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-amber-400/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
                  WORKSTREAMS
                </span>
                <div className="h-px w-12 bg-amber-400/30" />
              </div>

              <h2 className="font-serif text-4xl text-white md:text-5xl">
                What this platform builds
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <WorkstreamCard
                icon={BookOpen}
                title="Canon"
                desc="Doctrine, philosophy, and strategic architecture."
                href="/canon"
                index="01"
              />
              <WorkstreamCard
                icon={Heart}
                title="Fatherhood"
                desc="Household structure and legacy formation."
                href="/brands/fathering-without-fear"
                index="02"
              />
              <WorkstreamCard
                icon={Briefcase}
                title="Strategy Rooms"
                desc="Founder and board-level operating clarity."
                href="/consulting"
                index="03"
              />
              <WorkstreamCard
                icon={Shield}
                title="Inner Circle"
                desc="Closed rooms, accountability, applied work."
                href="/inner-circle"
                index="04"
              />
              <WorkstreamCard
                icon={Landmark}
                title="Institutional Thinking"
                desc="Governance, nation-building, and civic design."
                href="/strategy"
                index="05"
              />
              <WorkstreamCard
                icon={Target}
                title="Ventures"
                desc="Execution vehicles for real-world deployment."
                href="/ventures"
                index="06"
              />
            </div>
          </div>
        </section>

        {/* NON-NEGOTIABLES */}
        <section className="relative border-t border-white/6 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-amber-400/30" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
                NON-NEGOTIABLES
              </span>
              <div className="h-px w-12 bg-amber-400/30" />
            </div>

            <h2 className="font-serif text-4xl text-white md:text-5xl">
              Load-bearing principles
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              These are not decorative values. They are operating commitments.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Scale, text: "Truth over trend" },
                { icon: Shield, text: "Responsibility over vibes" },
                { icon: Heart, text: "Covenant over convenience" },
                { icon: Target, text: "Competence over noise" },
                { icon: Crown, text: "Legacy over ego" },
                { icon: Leaf, text: "Stewardship over status" },
              ].map(({ icon, text }, i) => (
                <PrinciplePillar key={text} icon={icon} text={text} delay={i * 0.05} />
              ))}
            </div>

            <div className="mt-16 flex justify-center">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-amber-400/30" />
                <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20">
                  FOUNDATION • 2018
                </span>
                <Eye className="h-4 w-4 text-amber-400/30" />
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative border-t border-white/6 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-8 flex justify-center">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            </div>

            <h2 className="font-serif text-4xl text-white md:text-5xl">
              Build. Don’t drift.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/52">
              Start with the Canon, deploy a tool, or book a strategy room.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link
                href="/canon"
                className="group relative inline-flex items-center gap-3 overflow-hidden bg-white px-8 py-4 transition-all duration-500 hover:bg-amber-50"
              >
                <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-black">
                  Enter the Canon
                </span>
                <ChevronRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-100 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>

              <Link
                href="/consulting"
                className="group relative inline-flex items-center gap-3 overflow-hidden border border-white/12 px-8 py-4 transition-all duration-500 hover:border-white/22 hover:bg-white/[0.04]"
              >
                <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-white">
                  Strategy Room
                </span>
                <ArrowRight className="relative z-10 h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            </div>

            <div className="mt-16 flex justify-center">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-amber-400/30 to-transparent" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;