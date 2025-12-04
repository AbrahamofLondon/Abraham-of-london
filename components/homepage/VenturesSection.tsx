"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
} from "lucide-react";

import { LIBRARY_AESTHETICS } from "@/lib/content";

type VentureStatus = "Active" | "Emerging" | "In development";

interface Venture {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  status: VentureStatus | string;
  focus: string;
  externalLabel?: string;
}

// Use the same URLs as in the ventures page
const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com/";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://alomarada.com/endureluxe";
const INNOVATEHUB_URL = process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "https://innovatehub.abrahamoflondon.org";

const ventures: Venture[] = [
  {
    name: "Alomarada Ltd",
    description: "Board-level advisory, operating systems, and market-entry strategy for founders, boards, and institutions who take Africa seriously.",
    icon: Building2,
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategic advisory · Market systems · Deal architecture",
    externalLabel: "Visit Alomarada.com",
  },
  {
    name: "Endureluxe",
    description: "Community-driven fitness and performance gear for people who train, build, and endure – designed to survive real life, not just product shoots.",
    icon: PackageCheck,
    href: ENDURELUXE_URL,
    status: "Active",
    focus: "Fitness community · Performance gear · Everyday durability",
    externalLabel: "Explore Endureluxe",
  },
  {
    name: "InnovateHub",
    description: "Strategy, playbooks, and hands-on support to help founders test ideas, ship durable products, and build operating rhythms that actually hold.",
    icon: Lightbulb,
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Innovation engine · Capability building · Venture design",
    externalLabel: "Visit InnovateHub",
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const VenturesSection: React.FC = () => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70 mb-4">
            Ventures
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl mb-4">
            Where philosophy becomes operating system
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cream/75">
            Alomarada, Endureluxe, and InnovateHub are not side projects.
            They are execution arms of the Canon — testing grounds for
            strategy, governance, and multi-generational design.
          </p>
        </div>

        {/* Ventures Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {ventures.map((venture) => (
            <motion.article
              key={venture.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={itemVariants}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/60 to-slate-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-slate-950/80 hover:shadow-2xl"
            >
              {/* Icon and Status */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="rounded-xl bg-amber-400/10 p-3">
                  <venture.icon className="h-7 w-7 text-amber-300" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    venture.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : venture.status === "Emerging"
                      ? "bg-blue-500/10 text-blue-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {venture.status}
                </span>
              </div>

              {/* Content */}
              <h3 className="mb-3 font-serif text-xl font-semibold text-cream">
                {venture.name}
              </h3>
              
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/80">
                {venture.focus}
              </p>

              <p className="mb-6 flex-1 text-sm leading-relaxed text-cream/75">
                {venture.description}
              </p>

              {/* CTA */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-cream/60">
                  External ·{" "}
                  <span className="font-medium text-amber-300">
                    {venture.href.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <Link
                  href={venture.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center text-xs font-semibold uppercase tracking-wide text-amber-300 hover:text-amber-200"
                >
                  {venture.externalLabel ?? "Visit site"}
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/ventures"
            className="group inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-6 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
          >
            View All Ventures
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VenturesSection;