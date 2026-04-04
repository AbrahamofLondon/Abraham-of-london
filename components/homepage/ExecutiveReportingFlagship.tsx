"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Building2,
  Crown,
  CheckCircle2,
  Scale,
} from "lucide-react";

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm",
        "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-500/30" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
        {children}
      </span>
    </div>
  );
}

export default function ExecutiveReportingFlagship() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative border-t border-white/5 bg-[#070707] py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(245,158,11,0.06),transparent_42%),radial-gradient(ellipse_at_82%_36%,rgba(255,255,255,0.04),transparent_55%)]" />
      <div className="absolute inset-0 aol-grain opacity-[0.04]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-4xl"
          >
            <RailLabel>Flagship Reporting Product</RailLabel>

            <div className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2">
              <Crown className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                Executive Reporting
              </span>
            </div>

            <h2 className="mt-8 max-w-[12ch] font-serif text-4xl font-light leading-[0.96] tracking-[-0.03em] text-white md:text-5xl lg:text-[4.1rem]">
              Premium reports for people
              <span className="mt-2 block text-white/58">
                carrying consequence
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/56 md:text-lg">
              A premium executive reporting product for founders, boards,
              leadership teams, and institutions that need disciplined
              interpretation before escalation, not vague dashboards after the
              fact.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Narrative + matrix + exposure in one disciplined artifact",
                "Useful before advisory, during correction, and under pressure",
                "Built for serious operators, not casual browsers",
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/70" />
                  <span className="text-sm leading-relaxed text-white/54">
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
              >
                <span>View flagship product</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              >
                <span>Request strategic review</span>
                <Scale className="h-4 w-4 opacity-60 transition-transform group-hover:scale-105" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <Surface className="h-full p-8 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                  Buyer fit
                </div>
                <FileText className="h-4 w-4 text-amber-500/50" />
              </div>

              <div className="mt-8 space-y-6">
                {[
                  {
                    icon: Building2,
                    title: "Founders & leadership teams",
                    body: "When execution is active but clarity is deteriorating.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Boards & operators",
                    body: "When a sharper reading is needed before intervention.",
                  },
                  {
                    icon: Crown,
                    title: "High-consequence environments",
                    body: "When the cost of being wrong is already material.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="border-b border-white/6 pb-6 last:border-b-0"
                    >
                      <div className="flex items-start gap-4">
                        <Icon className="mt-0.5 h-5 w-5 text-amber-400/65" />
                        <div>
                          <div className="text-base font-semibold text-white/88">
                            {item.title}
                          </div>
                          <div className="mt-2 text-sm leading-relaxed text-white/48">
                            {item.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-white/6 pt-6">
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                  Positioning
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/58">
                  A defensible niche between shallow diagnostics and full
                  advisory retainers.
                </p>
              </div>
            </Surface>
          </motion.div>
        </div>
      </div>
    </section>
  );
}