"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, ShieldCheck, Users } from "lucide-react";
import { EXECUTIVE_BUYER_VARIANTS } from "@/lib/diagnostics/executive-reporting-market-proof";

const ICONS = {
  founder: Crown,
  board: ShieldCheck,
  leadership: Users,
};

export default function ExecutiveBuyerVariants() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {EXECUTIVE_BUYER_VARIANTS.map((item, index) => {
        const Icon = ICONS[item.id];

        return (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className="border border-white/[0.08] bg-white/[0.02] p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-5 w-5 text-amber-400/68" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/56">
                {item.label}
              </span>
            </div>

            <h3 className="mt-6 font-serif text-2xl text-white">
              {item.headline}
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-white/48">
              {item.subheadline}
            </p>

            <div className="mt-7">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                Friction pattern
              </div>
              <div className="mt-3 space-y-3">
                {item.pains.map((pain) => (
                  <div key={pain} className="text-sm text-white/56">
                    • {pain}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                Report outcome
              </div>
              <div className="mt-3 space-y-3">
                {item.outcomes.map((outcome) => (
                  <div key={outcome} className="text-sm text-white/56">
                    • {outcome}
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