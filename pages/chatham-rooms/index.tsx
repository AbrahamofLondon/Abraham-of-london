/* pages/chatham-rooms/index.tsx — THE CHATHAM ROOMS (ADULT / SANCTUARY EDITION) */
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  Heart,
  Compass,
  Eye,
  Key,
  Flame,
  Feather,
  Scale,
  Mic2,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[14%] top-[10%] h-[26rem] w-[26rem] rounded-full bg-amber-400/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-400/28" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/62">
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
      <div className="h-1.5 w-1.5 rounded-full bg-amber-300/36" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
    </div>
  );
}

function RoomQuote({
  children,
  author,
}: {
  children: React.ReactNode;
  author?: string;
}) {
  return (
    <div className="relative my-12 border-l-2 border-amber-400/24 bg-gradient-to-r from-amber-400/[0.05] to-transparent px-6 py-8">
      <div className="absolute left-5 top-3 font-serif text-4xl italic text-amber-300/20">
        "
      </div>
      <p className="pl-4 text-lg italic leading-relaxed text-white/78 md:text-[1.25rem]">
        {children}
      </p>
      {author ? (
        <p className="mt-4 pl-4 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/52">
          — {author}
        </p>
      ) : null}
    </div>
  );
}

function PrincipleCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.article
      className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.015] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.65 }}
      viewport={{ once: true }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 180px at 0% 0%, rgba(245,158,11,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.14))",
        }}
      />
      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <Icon className="h-7 w-7 text-amber-300/68 transition-colors duration-300 group-hover:text-amber-200" />
          <span className="font-mono text-[8px] text-white/12">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-serif text-xl text-white transition-colors duration-300 group-hover:text-amber-50">
          {title}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-white/46">{description}</p>
      </div>
    </motion.article>
  );
}

export default function ChathamRoomsPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="The Chatham Rooms"
      headerTransparent
      className="bg-black text-white"
    >
      <main className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Since 2025 • London</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  The Chatham
                  <span className="mt-3 block text-white/58">Rooms</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-white/56"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  Private, off-record rooms for honest leaders and heavy fathers.
                </motion.p>

                <motion.p
                  className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-white/44"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.26 }}
                >
                  Small, curated conversations held under Chatham House Rule —
                  where founders and decision-makers speak plainly about power,
                  faith, and consequence without optics.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.34 }}
                >
                  <Link
                    href="/events"
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>See upcoming rooms</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/contact?source=chatham-rooms&intent=invitation"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Enquire about invitation</span>
                    <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-12 flex flex-wrap items-center gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.42 }}
                >
                  <div className="inline-flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Off record
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-amber-400/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      By invitation
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-12 h-px w-40 bg-gradient-to-r from-amber-400/28 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.05, delay: 0.5 }}
                  style={{ transformOrigin: "left" }}
                />
              </div>

              <motion.div
                className="self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
              >
                <div className="border border-white/[0.06] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[1px]"
                    style={{
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.45)",
                    }}
                  />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                        Room profile
                      </span>
                      <Flame className="h-4 w-4 text-amber-300/42" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <div className="border-l-0 pl-0">
                        <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                          Format
                        </div>
                        <div className="mt-2 font-serif text-lg text-white/84">
                          Closed
                        </div>
                      </div>
                      <div className="border-l border-white/6 pl-4">
                        <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                          Guests
                        </div>
                        <div className="mt-2 font-serif text-lg text-white/84">
                          6–12
                        </div>
                      </div>
                      <div className="border-l border-white/6 pl-4">
                        <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                          Rule
                        </div>
                        <div className="mt-2 font-serif text-lg text-white/84">
                          Chatham
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Facilitated dialogue around a defined theme",
                        "No social broadcasting, no performative theatre",
                        "Scripture, history, and hard strategy in one room",
                        "Contribution expected from everyone present",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-amber-300/70" />
                          <span className="text-sm text-white/56">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="relative border-t border-amber-400/10">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.035] to-transparent" />
          <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <MandateStatement />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* CORE CONTENT */}
        <section className="relative py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.03] via-transparent to-amber-400/[0.03]" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <RailLabel>The work</RailLabel>

                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  What actually happens
                  <span className="mt-2 block text-white/58">in the room</span>
                </h2>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  These are not networking events. They are working
                  conversations with those who carry real weight: decisions
                  affecting families, employees, or citizens.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    "6–12 people, carefully curated for alignment",
                    "2–3 hour facilitated dialogue around a specific theme",
                    "Zero social posting; strictly confidential",
                    "Integration of Scripture, history, and hard strategy",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-300/72" />
                      <span className="text-white/68">{item}</span>
                    </motion.div>
                  ))}
                </div>

                <RoomQuote author="Participant, 2025">
                  I have never spoken so freely about things that actually
                  matter. The room held the weight.
                </RoomQuote>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <RailLabel>The guests</RailLabel>

                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Who the room is
                  <span className="mt-2 block text-white/58">for</span>
                </h2>

                <div className="mt-10 space-y-6">
                  {[
                    { icon: Shield, text: "Owners who cannot afford fantasy" },
                    {
                      icon: Heart,
                      text: "Fathers navigating multi-generational complexity",
                    },
                    {
                      icon: Compass,
                      text: "Trustees and leaders with real consequence",
                    },
                    {
                      icon: Eye,
                      text: "Those carrying weight they cannot share elsewhere",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.text}
                        className="flex items-start gap-4"
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.5 }}
                        viewport={{ once: true }}
                      >
                        <div className="mt-1 flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.02]">
                          <Icon className="h-4.5 w-4.5 text-amber-300/68" />
                        </div>
                        <span className="max-w-md text-white/66">
                          {item.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-10 border border-amber-400/16 bg-gradient-to-br from-amber-400/[0.04] to-transparent p-7">
                  <p className="text-sm italic leading-relaxed text-white/52">
                    Admission is by referral or verified mandate-fit. We protect
                    the conversation so the right people can talk honestly.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-amber-300/42" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                      By invitation only
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* PRINCIPLES */}
        <section className="relative py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <RailLabel>Institutional Principles</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                The pillars of honest rooms
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Under the Rule",
                  description:
                    "Wisdom exits the room; identities stay behind. One place where honesty is not a risk to reputation.",
                },
                {
                  icon: BookOpen,
                  title: "Truth & Strategy",
                  description:
                    "We draw from Scripture and market reality. Not theory, but wisdom that can be acted on Monday morning.",
                },
                {
                  icon: Users,
                  title: "No Spectators",
                  description:
                    "Everyone contributes. Everyone is accountable. We come to solve questions of legacy, not collect quotes.",
                },
              ].map((principle, index) => (
                <PrincipleCard
                  key={principle.title}
                  icon={principle.icon}
                  title={principle.title}
                  description={principle.description}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* HOST A ROOM */}
        <section className="relative border-t border-amber-400/10 py-24">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-400/[0.08] to-transparent" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-3">
              <div className="h-px w-12 bg-amber-400/28" />
              <Flame className="h-4 w-4 text-amber-300/56" />
              <div className="h-px w-12 bg-amber-400/28" />
            </div>

            <h2 className="font-serif text-4xl text-white md:text-5xl">
              Propose a Room
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-white/50">
              Host a closed session for your board, eldership, or leadership
              team. Share a context note with stakes and desired outcomes.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact?source=chatham-rooms&intent=propose-room"
                className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
              >
                <span>Propose Room</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/events"
                className="group inline-flex items-center justify-center gap-3 border border-white/10 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              >
                <span>View Upcoming</span>
                <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-20 inline-flex items-center gap-2">
              <Feather className="h-3 w-3 text-amber-300/20" />
              <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/10">
                Chatham Rooms • Estd 2025
              </span>
              <Feather className="h-3 w-3 text-amber-300/20" />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}