"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";
import { EXECUTIVE_PRICING_TIERS } from "@/lib/diagnostics/executive-reporting-market-proof";

export default function ExecutivePricingGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {EXECUTIVE_PRICING_TIERS.map((tier, index) => (
        <motion.article
          key={tier.id}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.08 }}
          className={[
            "relative border p-8 transition-all duration-500",
            tier.emphasis
              ? "border-amber-500/24 bg-amber-500/[0.03]"
              : "border-white/[0.08] bg-white/[0.02]",
          ].join(" ")}
        >
          {tier.emphasis ? (
            <div className="absolute right-6 top-6 flex items-center gap-2 border border-amber-500/18 bg-amber-500/[0.06] px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-amber-400/76" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/76">
                Best commercial edge
              </span>
            </div>
          ) : null}

          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/36">
            {tier.label}
          </div>

          <h3 className="mt-5 font-serif text-3xl text-white">{tier.title}</h3>

          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/76">
            {tier.price}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/50">
            {tier.positioning}
          </p>

          <div className="mt-6">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
              Best for
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              {tier.bestFor}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            {tier.includes.map((entry) => (
              <div key={entry} className="text-sm text-white/56">
                • {entry}
              </div>
            ))}
          </div>

          <Link
            href={tier.ctaHref}
            className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70 transition-colors hover:text-amber-300"
          >
            <span>{tier.ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.article>
      ))}
    </div>
  );
}