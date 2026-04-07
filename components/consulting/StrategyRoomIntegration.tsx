"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Crown,
  FileText,
  ShieldCheck,
  Scale,
  Target,
  Compass,
  Activity,
  Lock,
} from "lucide-react";

const TRANSITION = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

const SIGNALS = [
  "Use Diagnostics when the matter still requires disciplined reading and route clarity.",
  "Use Executive Reporting when the signal is serious enough to require structured interpretation.",
  "Use Strategy Room when consequence, execution pressure, and mandate fit are already material.",
];

const PATHWAYS = [
  {
    icon: Activity,
    title: "Signal before mandate",
    body: "The architecture begins with disciplined reading, not premature intervention.",
  },
  {
    icon: FileText,
    title: "Report before response",
    body: "Executive Reporting clarifies posture, pressure, exposure, and likely failure modes before advisory begins.",
  },
  {
    icon: Crown,
    title: "Escalation by fitness, not appetite",
    body: "Not every serious case belongs in private chamber work. The system protects fit, seriousness, and legitimacy.",
  },
  {
    icon: Scale,
    title: "Mandate under constitutional order",
    body: "The Strategy Room exists for cases where authority, stakes, and execution consequence require governed counsel.",
  },
];

const OUTCOMES = [
  {
    icon: Target,
    title: "Sharper decision chain",
    body: "Problem framing, route discipline, interpretation, and intervention move in sequence rather than as disconnected fragments.",
  },
  {
    icon: Compass,
    title: "Clearer mandate fit",
    body: "The right matters advance. The wrong matters are held, redirected, or declined without confusion or theatre.",
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
      {children}
    </span>
  );
}

export default function StrategyRoomIntegration() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#070707] py-24 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_18%,rgba(201,169,106,0.10),transparent_40%),radial-gradient(ellipse_at_12%_88%,rgba(255,255,255,0.04),transparent_32%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[1.03fr_0.97fr]">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={TRANSITION}
            className="rounded-[30px] border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] md:p-10"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-6 w-px bg-[#C9A96A]/30" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9A96A]/80">
                Selective escalation
              </span>
            </div>

            <h2 className="mt-7 max-w-[13ch] font-serif text-4xl leading-[0.95] tracking-tight text-white md:text-5xl">
              When interpretation becomes mandate work
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
              Strategy Room is not the first stop in the system. It is the
              private chamber for cases that have already crossed from diagnostic
              clarity into mandate-level consequence.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Pill>Route discipline</Pill>
              <Pill>Mandate fit</Pill>
              <Pill>Governed escalation</Pill>
            </div>

            <div className="mt-10 space-y-4">
              {SIGNALS.map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C9A96A]/80" />
                  <span className="text-sm leading-7 text-white/65">{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-amber-400/70" />
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                    Chamber discipline
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/56">
                    The point is not to make the chamber feel exclusive for show.
                    The point is to make escalation feel earned, appropriate, and
                    commercially legitimate.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ ...TRANSITION, delay: 0.06 }}
            className="rounded-[30px] border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] md:p-10"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#C9A96A]/20 bg-[#C9A96A]/10 p-2.5">
                <Briefcase className="h-5 w-5 text-[#C9A96A]/85" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C9A96A]/80">
                Strategy Room path
              </div>
            </div>

            <h3 className="mt-6 font-serif text-3xl tracking-tight text-white">
              Structured counsel for live consequence
            </h3>

            <div className="mt-8 space-y-4">
              {PATHWAYS.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/[0.06] bg-black/25 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <Icon className="h-4 w-4 text-[#C9A96A]/80" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white/90">
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm leading-7 text-white/58">
                          {item.body}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {OUTCOMES.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/[0.06] bg-black/25 p-4"
                  >
                    <Icon className="h-4 w-4 text-[#C9A96A]/80" />
                    <div className="mt-3 text-sm font-semibold text-white/88">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm leading-7 text-white/55">
                      {item.body}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/diagnostics/executive-reporting"
                className={cn(
                  "group inline-flex w-full items-center justify-center gap-3 rounded-2xl",
                  "border border-white/10 bg-white/[0.04] px-6 py-4",
                  "transition-colors hover:border-white/20 hover:bg-white/[0.07]",
                )}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">
                  Review flagship product
                </span>
                <FileText className="h-4 w-4 text-white/45 transition-transform group-hover:scale-105 group-hover:text-white/70" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className={cn(
                  "group inline-flex w-full items-center justify-center gap-3 rounded-2xl",
                  "border border-[#C9A96A]/25 bg-[#C9A96A]/[0.06] px-6 py-4",
                  "transition-colors hover:border-[#C9A96A]/50 hover:bg-[#C9A96A]/[0.10]",
                )}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#E6C27A]">
                  Enter Strategy Room
                </span>
                <ArrowRight className="h-4 w-4 text-[#C9A96A]/70 transition-transform group-hover:translate-x-1 group-hover:text-[#E6C27A]" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}