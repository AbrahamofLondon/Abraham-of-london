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
  ChevronRight,
} from "lucide-react";

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
    label: "Advisory & Strategy",
    kicker: "Direct Implementation",
    description:
      "Board-level architecture for founders. We don't just advise; we build the operating logic required to survive growth and pressure.",
    Icon: Briefcase,
    pillar: { icon: Wrench, name: "Tools", phase: "Execution" },
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Asymmetric Intelligence",
    description:
      "Private, off-record sessions under strict protocol. A dedicated space for sharpening judgment away from the public eye.",
    Icon: Users,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "Pressure" },
  },
  {
    href: "/events",
    label: "Executive Salons",
    kicker: "Public Discourse",
    description:
      "High-signal environments blending Scripture, history, and market reality. Strategy sessions for the serious operator.",
    Icon: CalendarDays,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "Pressure" },
  },
] as const;

const containerAnim = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function StrategicFunnelStrip(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* 1. Background Architecture: Radial Glow + Grain */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* --- Header: The Logic Bridge --- */}
        <div className="flex flex-col items-center text-center mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60 mb-6"
          >
            The Operational Funnel
          </motion.span>
          
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-none mb-8">
            Doctrine <ChevronRight className="inline h-8 w-8 text-white/10" /> 
            Logic <ChevronRight className="inline h-8 w-8 text-white/10" /> 
            Artifacts
          </h2>

          <p className="max-w-2xl text-white/40 text-lg font-light leading-relaxed">
            From the deep architecture of the <span className="text-white/80">Canon</span> to the 
            reproducible <span className="text-white/80">Tools</span>, finally proven in the 
            <span className="text-white/80">Rooms</span>.
          </p>
        </div>

        {/* --- Card Grid: Modular Components --- */}
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          variants={containerAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {CARDS.map((card, index) => (
            <motion.div
              key={card.href}
              variants={cardAnim}
              className="group relative"
            >
              <Link href={card.href} className="block h-full">
                <div className="relative h-full flex flex-col p-8 rounded-3xl border border-white/5 bg-white/[0.02] transition-all duration-500 hover:bg-white/[0.04] hover:border-amber-500/20 group-hover:-translate-y-1">
                  
                  {/* Phase Indicator */}
                  <div className="flex items-center gap-2 mb-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-amber-500/60 transition-colors">
                      Phase 0{index + 1} // {card.pillar.name}
                    </span>
                  </div>

                  {/* Icon & Heading */}
                  <div className="mb-6">
                    <card.Icon className="h-6 w-6 text-white/40 mb-4 group-hover:text-amber-400 transition-colors duration-500" />
                    <h3 className="font-serif text-2xl font-medium text-white group-hover:text-amber-50 group-hover:tracking-tight transition-all">
                      {card.label}
                    </h3>
                  </div>

                  {/* Body */}
                  <p className="text-white/40 text-sm leading-relaxed mb-8 flex-1 group-hover:text-white/60 transition-colors">
                    {card.description}
                  </p>

                  {/* Footer Action */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">
                      Explore Asset
                    </span>
                    <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500/40 transition-colors">
                      <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-[1px] bg-amber-500/30" />
                    <div className="w-[1px] h-8 bg-amber-500/30 absolute top-4 right-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* --- Technical Footer --- */}
        <div className="mt-20 flex flex-col items-center gap-4">
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
             System Verification: Operational
           </p>
        </div>
      </div>
    </section>
  );
}