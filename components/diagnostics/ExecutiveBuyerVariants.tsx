"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, ShieldCheck, Users, CheckCircle2 } from "lucide-react";
import { EXECUTIVE_BUYER_VARIANTS } from "@/lib/diagnostics/executive-reporting-market-proof";

const ICONS = {
  founder: Crown,
  board: ShieldCheck,
  leadership: Users,
} as const;

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function ExecutiveBuyerVariants() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {EXECUTIVE_BUYER_VARIANTS.map((item, index) => {
        const Icon = ICONS[item.id as keyof typeof ICONS] || Users;

        return (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className={cn(
              "border border-white/[0.08] bg-white/[0.02] p-8",
              "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-5 w-5 text-amber-400/68" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/56">
                {item.label}
              </span>
            </div>

            <h3 className="mt-6 max-w-[13ch] font-serif text-2xl leading-tight text-white">
              {item.headline}
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-white/48">
              {item.subheadline}
            </p>

            <div className="mt-7 border border-white/[0.08] bg-black/20 p-5">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                Friction pattern
              </div>
              <div className="mt-4 space-y-3">
                {item.pains.map((pain) => (
                  <div key={pain} className="flex items-start gap-3">
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-amber-400/70" />
                    <span className="text-sm leading-relaxed text-white/56">
                      {pain}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border border-white/[0.08] bg-black/20 p-5">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                Report outcome
              </div>
              <div className="mt-4 space-y-3">
                {item.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <span className="text-sm leading-relaxed text-white/56">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={item.ctaHref}
              className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70 transition-colors hover:text-amber-300"
            >
              <span>{item.ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}