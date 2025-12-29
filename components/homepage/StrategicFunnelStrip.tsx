"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Users,
  BookOpen,
  Wrench,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

// 1. Precise type definition for Icons using Lucide's own type
type CardItem = {
  href: string;
  label: string;
  kicker: string;
  description: string;
  Icon: LucideIcon;
  pillar: {
    icon: LucideIcon;
    name: string;
    phase: string;
  };
};

const CARDS: readonly CardItem[] = [
  {
    href: "/consulting",
    label: "Consulting & Advisory",
    kicker: "Execution with accountability",
    description:
      "Board-level strategy for founders and senior leaders — designed to survive budgets, deadlines, and real consequences.",
    Icon: Briefcase,
    pillar: {
      icon: Wrench,
      name: "Tools",
      phase: "Operating Systems",
    },
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Closed rooms, plain truth",
    description:
      "Off-record conversations under Chatham House Rule — a rare place to speak plainly, think clearly, and sharpen judgment.",
    Icon: Users,
    pillar: {
      icon: ShieldCheck,
      name: "Rooms",
      phase: "Proof Under Pressure",
    },
  },
  {
    href: "/events",
    label: "Events & Salons",
    kicker: "Public sessions, serious work",
    description:
      "Live rooms blending Scripture, history, and hard market reality — without performance or therapy-speak.",
    Icon: CalendarDays,
    pillar: {
      icon: ShieldCheck,
      name: "Rooms",
      phase: "Proof Under Pressure",
    },
  },
] as const;

// 2. Smoother animation variants
const containerAnim = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardAnim = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function StrategicFunnelStrip(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-charcoal via-charcoal to-black/95 py-20 lg:py-28">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* --- Header Section --- */}
        <header className="mx-auto mb-16 max-w-3xl text-center md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold/60">
              The Framework
            </p>

            <h2 className="mt-6 font-serif text-3xl font-semibold leading-tight text-cream sm:text-4xl lg:text-5xl">
              Principles <span className="text-gold/40">→</span> Tools{" "}
              <span className="text-gold/40">→</span> Rooms
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gold/70 sm:text-lg">
              The Canon establishes first principles. The tools translate them
              into operating systems. The rooms prove them under pressure — in
              the boardroom, the household, and the real world.
            </p>
          </motion.div>

          {/* Three Pillars Visualizer */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Pillar 1 */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gold/50">
                  Canon
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Principles
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-px w-12 bg-gradient-to-r from-transparent via-gold/30 to-transparent sm:block" />

            {/* Pillar 2 */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <Wrench className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gold/50">
                  Tools
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Systems
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-px w-12 bg-gradient-to-r from-transparent via-gold/30 to-transparent sm:block" />

            {/* Pillar 3 */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <ShieldCheck className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gold/50">
                  Rooms
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Pressure
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* --- Cards Grid --- */}
        <motion.div
          className="grid gap-6 md:grid-cols-3 lg:gap-8"
          variants={containerAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {CARDS.map((card, index) => (
            <motion.article
              key={card.href}
              variants={cardAnim}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-charcoal/80 to-charcoal/40 p-1 backdrop-blur-md transition-all duration-500 hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5"
            >
              {/* Pillar Badge (Absolute Top Right) */}
              <div className="absolute right-5 top-5 z-20">
                <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-black/40 px-3 py-1 backdrop-blur-md transition-colors group-hover:border-gold/40 group-hover:bg-gold/10">
                  <card.pillar.icon className="h-3 w-3 text-gold/70 group-hover:text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold/70 group-hover:text-gold">
                    {card.pillar.name}
                  </span>
                </div>
              </div>

              {/* Inner Card Content */}
              <div className="relative flex h-full flex-col rounded-xl bg-charcoal/40 p-6 sm:p-8">
                {/* Icon Wrapper */}
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/10 to-transparent ring-1 ring-gold/20 transition-all duration-500 group-hover:scale-110 group-hover:from-gold/20 group-hover:ring-gold/40">
                  <card.Icon className="h-7 w-7 text-gold transition-transform duration-500 group-hover:-rotate-6" />
                </div>

                {/* Kicker */}
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold/50 transition-colors group-hover:text-gold/80">
                  {card.kicker}
                </p>

                {/* Title */}
                <h3 className="mb-4 font-serif text-2xl font-semibold leading-tight text-cream transition-colors group-hover:text-white">
                  {card.label}
                </h3>

                {/* Description */}
                <p className="mb-8 flex-1 text-sm leading-relaxed text-gold/60 transition-colors group-hover:text-gold/80">
                  {card.description}
                </p>

                {/* Footer / CTA */}
                <div className="mt-auto flex items-center justify-between border-t border-gold/10 pt-6">
                  <Link
                    href={card.href}
                    className="group/link flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold transition-colors hover:text-white"
                  >
                    <span>Explore</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 transition-all duration-300 group-hover/link:translate-x-1 group-hover/link:bg-gold group-hover/link:text-charcoal">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>

                  <span className="text-[10px] font-bold text-gold/20">
                    0{index + 1}
                  </span>
                </div>
              </div>

              {/* Hover Glow Effects */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.article>
          ))}
        </motion.div>

        {/* --- Bottom Note --- */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs font-medium text-gold/40">
            STRATEGY • OPERATIONS • LEGACY
          </p>
        </motion.div>
      </div>
    </section>
  );
}