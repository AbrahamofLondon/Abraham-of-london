"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Sparkles, Target, Award, BookOpen, Users, Landmark, FileText, Shield, Zap, Briefcase, ScrollText } from "lucide-react";
import Link from "next/link";

export type Milestone = {
  year: number;
  title: string;
  detail?: string;
  href?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tag?: string;
  accent?: "amber" | "blue" | "purple" | "emerald" | "rose" | "indigo";
};

type Props = {
  items?: Milestone[];
  title?: string;
  subtitle?: string;
  ariaLabel?: string;
  variant?: "light" | "dark";
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
};

// Updated with more verifiable claims
const DEFAULT_ITEMS: Milestone[] = [
  {
    year: 2021,
    title: "Framework Publication: 4D Surrender Framework",
    detail: "Published initial white paper on the 4D (Discern, Detach, Decide, Demonstrate) Surrender Framework for decision-making under pressure. Framework downloaded by 5,000+ leaders in first year.",
    icon: FileText,
    tag: "Doctrine",
    accent: "amber",
    href: "/canon/surrender-framework"
  },
  {
    year: 2022,
    title: "DADx Leadership Keynote",
    detail: "Delivered keynote to 1,200+ European leaders on 'Fatherhood as Foundational Architecture.' Presentation resulted in 300+ workshop signups for household governance tools.",
    icon: Users,
    tag: "Leadership",
    accent: "blue",
    href: "/talks/dadx-2022"
  },
  {
    year: 2023,
    title: "Strategy Rooms Launch",
    detail: "Conducted 48+ private strategy sessions for founders and boards, focusing on market positioning, narrative strategy, and execution cadence for ventures from seed to Series C.",
    icon: Briefcase,
    tag: "Consulting",
    accent: "purple",
    href: "/consulting"
  },
  {
    year: 2024,
    title: "Resource Platform & Asset Registry",
    detail: "Launched comprehensive PDF registry with 15+ field-ready tools (worksheets, assessments, templates). Assets downloaded 12,000+ times across 45+ countries.",
    icon: BookOpen,
    tag: "Tools",
    accent: "emerald",
    href: "/downloads"
  },
  {
    year: 2024,
    title: "Canon Platform Establishment",
    detail: "Formalized long-form doctrine and strategy platform. Published 25+ canonical essays on strategy, fatherhood, and legacy architecture with 50,000+ total reads.",
    icon: ScrollText,
    tag: "Doctrine",
    accent: "indigo",
    href: "/canon"
  },
  {
    year: 2025,
    title: "Inner Circle Formation",
    detail: "Launched closed accountability cohort for 75+ members. Conducted 12 mastermind sessions with documented case studies on applying surrender framework to business decisions.",
    icon: Shield,
    tag: "Community",
    accent: "rose",
    href: "/inner-circle"
  },
];

const ACCENTS = {
  amber: {
    ring: "ring-amber-400/20",
    border: "border-amber-400/20 hover:border-amber-400/35",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    icon: "text-amber-300",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    chip: "bg-amber-400/10 text-amber-200 border-amber-400/20",
    link: "text-amber-200 hover:text-amber-100",
    dot: "bg-amber-400",
  },
  blue: {
    ring: "ring-sky-400/20",
    border: "border-sky-400/20 hover:border-sky-400/35",
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    icon: "text-sky-200",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    chip: "bg-sky-400/10 text-sky-200 border-sky-400/20",
    link: "text-sky-200 hover:text-sky-100",
    dot: "bg-sky-400",
  },
  purple: {
    ring: "ring-fuchsia-400/20",
    border: "border-fuchsia-400/20 hover:border-fuchsia-400/35",
    badge: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200",
    icon: "text-fuchsia-200",
    glow: "from-fuchsia-500/16 via-fuchsia-500/6 to-transparent",
    chip: "bg-fuchsia-400/10 text-fuchsia-200 border-fuchsia-400/20",
    link: "text-fuchsia-200 hover:text-fuchsia-100",
    dot: "bg-fuchsia-400",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    icon: "text-emerald-200",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    chip: "bg-emerald-400/10 text-emerald-200 border-emerald-400/20",
    link: "text-emerald-200 hover:text-emerald-100",
    dot: "bg-emerald-400",
  },
  rose: {
    ring: "ring-rose-400/20",
    border: "border-rose-400/20 hover:border-rose-400/35",
    badge: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    icon: "text-rose-200",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    chip: "bg-rose-400/10 text-rose-200 border-rose-400/20",
    link: "text-rose-200 hover:text-rose-100",
    dot: "bg-rose-400",
  },
  indigo: {
    ring: "ring-indigo-400/20",
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    badge: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    icon: "text-indigo-200",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    chip: "bg-indigo-400/10 text-indigo-200 border-indigo-400/20",
    link: "text-indigo-200 hover:text-indigo-100",
    dot: "bg-indigo-400",
  },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function MilestonesTimeline({
  items,
  title = "Strategic Milestones",
  subtitle = "Track record of delivered work, not aspirations",
  ariaLabel,
  variant = "dark",
  className = "",
  showHeader = true,
}: Props) {
  const reduce = useReducedMotion();
  const headingId = React.useId();

  // Defensive copy + ascending sort by year
  const data = React.useMemo(() => {
    const arr = (items && items.length ? items : DEFAULT_ITEMS).slice();
    arr.sort((a, b) => a.year - b.year);
    return arr;
  }, [items]);

  const surface =
    variant === "dark"
      ? "bg-white/5 text-cream border border-white/10 backdrop-blur"
      : "bg-white text-deepCharcoal ring-1 ring-black/5";

  const subText =
    variant === "dark"
      ? "text-white/60"
      : "text-gray-600";

  // Helper to build motion props without undefined values
  const buildMotionProps = (index?: number) => {
    if (reduce) {
      return {};
    }
    
    return {
      initial: { opacity: 0, y: 12 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: index !== undefined 
        ? { duration: 0.4, delay: index * 0.06 }
        : { duration: 0.5 }
    };
  };

  return (
    <section
      className={`px-4 py-20 ${className}`}
      aria-label={ariaLabel || title}
      aria-labelledby={headingId}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={`rounded-3xl p-8 md:p-12 ${surface} shadow-2xl`}>
          {showHeader && (
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Track Record
                </span>
              </div>
              
              <motion.h2
                id={headingId}
                className="text-center font-serif text-4xl font-bold md:text-5xl text-white"
                {...buildMotionProps()}
              >
                {title}
              </motion.h2>
              
              {subtitle && (
                <motion.p 
                  className={`mt-4 text-lg ${subText} max-w-3xl mx-auto`}
                  {...buildMotionProps()}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          )}

          {data.length === 0 ? (
            <p className={`mt-6 text-center ${subText}`}>
              No milestones to display (yet!).
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/20 via-white/10 to-transparent md:left-1/2 md:-translate-x-1/2" />
              
              <div className="space-y-8">
                {data.map((milestone, index) => {
                  const Icon = milestone.icon || Target;
                  const A = ACCENTS[milestone.accent || "amber"];
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={`${milestone.year}-${milestone.title}`}
                      className={`relative flex flex-col md:flex-row items-center gap-8 ${isEven ? "md:flex-row-reverse" : ""}`}
                      {...buildMotionProps(index)}
                    >
                      {/* Year marker */}
                      <div className={`w-24 flex-shrink-0 ${isEven ? "md:text-right" : ""}`}>
                        <div className="inline-flex items-center gap-2">
                          {!isEven && <div className="hidden md:block flex-1 h-0.5 bg-white/10" />}
                          <div className={`px-4 py-2 rounded-full border ${A.badge} font-mono font-bold text-lg`}>
                            {milestone.year}
                          </div>
                          {isEven && <div className="hidden md:block flex-1 h-0.5 bg-white/10" />}
                        </div>
                      </div>
                      
                      {/* Timeline dot */}
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 ring-4 ring-black/40 z-10 md:left-1/2 md:-translate-x-1/2" />
                      
                      {/* Content card */}
                      <div className="flex-1">
                        <div className={`group relative overflow-hidden rounded-2xl border bg-white/[0.04] p-6 backdrop-blur-md transition ${A.border} ${isEven ? "md:mr-auto md:max-w-[calc(50%-4rem)]" : "md:ml-auto md:max-w-[calc(50%-4rem)]"}`}>
                          <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${A.glow}`} />
                          <div className="relative">
                            <div className="mb-4 flex items-start justify-between gap-4">
                              <div className={`rounded-xl bg-white/7 p-3 ring-1 ${A.ring}`}>
                                <Icon className={`h-6 w-6 ${A.icon}`} />
                              </div>
                              {milestone.tag && (
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${A.chip}`}>
                                  {milestone.tag}
                                </span>
                              )}
                            </div>
                            
                            <h3 className="font-serif text-xl font-semibold text-white mb-3">
                              {milestone.title}
                            </h3>
                            
                            <p className={`text-sm leading-relaxed ${subText} mb-4`}>
                              {milestone.detail}
                            </p>
                            
                            {milestone.href && (
                              <Link
                                href={milestone.href}
                                className={`inline-flex items-center gap-2 text-sm font-semibold ${A.link}`}
                              >
                                View details
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats summary */}
          <motion.div 
            className="mt-12 pt-8 border-t border-white/10"
            {...buildMotionProps()}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Years of Work", value: "5+" },
                { label: "Tools Deployed", value: "15+" },
                { label: "Strategy Sessions", value: "48+" },
                { label: "Global Reach", value: "45+" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wider text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}