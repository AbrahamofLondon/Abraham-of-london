// components/homepage/StrategicFunnelStrip.tsx
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
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

type CardItem = {
  href: string;
  label: string;
  kicker: string;
  description: string;
  Icon: IconType;
  pillar: {
    icon: IconType;
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

const containerAnim = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const cardAnim = {
  hidden: { opacity: 0, y: 24 },
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
    <section className="relative overflow-hidden bg-gradient-to-b from-charcoal via-charcoal to-black/95 py-20">
      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto mb-16 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold/60">
              The Framework
            </p>

            <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-cream sm:text-4xl lg:text-5xl">
              Principles → Tools → Rooms
            </h2>

            <p className="mt-5 text-base leading-relaxed text-gold/70 sm:text-lg">
              The Canon establishes first principles. The tools translate them into 
              operating systems. The rooms prove them under pressure — in the boardroom, 
              the household, and the real world.
            </p>
          </motion.div>

          {/* Three Pillars Overview */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-gold/50">
                  Canon
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Principles
                </div>
              </div>
            </div>

            <div className="flex h-px w-8 bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <Wrench className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-gold/50">
                  Tools
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Operating Systems
                </div>
              </div>
            </div>

            <div className="flex h-px w-8 bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <ShieldCheck className="h-5 w-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-gold/50">
                  Rooms
                </div>
                <div className="text-sm font-medium text-cream/90">
                  Proof Under Pressure
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Cards Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {CARDS.map((card, index) => (
            <motion.article
              key={card.href}
              variants={cardAnim}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-charcoal/90 to-charcoal/70 backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5"
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Pillar Badge */}
              <div className="absolute right-4 top-4 z-10">
                <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-charcoal/80 px-3 py-1 backdrop-blur-sm">
                  <card.pillar.icon className="h-3 w-3 text-gold/80" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold/80">
                    {card.pillar.name}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex flex-1 flex-col p-7">
                {/* Icon */}
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 ring-1 ring-gold/30 transition-all duration-300 group-hover:scale-110 group-hover:ring-gold/50">
                  <card.Icon className="h-7 w-7 text-gold" />
                </div>

                {/* Kicker */}
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold/60">
                  {card.kicker}
                </p>

                {/* Title */}
                <h3 className="mt-2 font-serif text-xl font-semibold leading-tight text-cream transition-colors group-hover:text-white">
                  {card.label}
                </h3>

                {/* Description */}
                <p className="mt-4 flex-1 text-sm leading-relaxed text-gold/70">
                  {card.description}
                </p>

                {/* Bottom Section */}
                <div className="mt-6 flex items-center justify-between border-t border-gold/10 pt-5">
                  <Link
                    href={card.href}
                    className="group/link inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
                    aria-label={`Enter ${card.label}`}
                  >
                    <span>Enter</span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/30 transition-all group-hover/link:translate-x-1 group-hover/link:bg-gold/25 group-hover/link:ring-gold/50">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>

                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset ring-gold/0 transition-all duration-300 group-hover:opacity-100 group-hover:ring-gold/30" />
              
              {/* Gradient overlay on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gold/0 to-gold/0 opacity-0 transition-opacity duration-300 group-hover:from-gold/5 group-hover:to-transparent group-hover:opacity-100" />
            </motion.article>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-sm text-gold/60">
            Each door leads to real work. No performance. No pretense.
          </p>
        </motion.div>
      </div>
    </section>
  );
}