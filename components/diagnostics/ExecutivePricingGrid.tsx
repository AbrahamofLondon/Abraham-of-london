"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, CheckCircle2 } from "lucide-react";
import { EXECUTIVE_PRICING_TIERS } from "@/lib/diagnostics/executive-reporting-market-proof";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

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
          className={cn(
            "relative overflow-hidden border p-8 transition-all duration-500",
            "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
            tier.emphasis
              ? "border-amber-500/24 bg-amber-500/[0.03]"
              : "border-white/[0.08] bg-white/[0.02]",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {tier.emphasis ? (
            <div className="absolute right-6 top-6 inline-flex items-center gap-2 border border-amber-500/18 bg-amber-500/[0.06] px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-amber-400/76" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/76">
                Best commercial edge
              </span>
            </div>
          ) : null}

          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/34">
            {tier.label}
          </div>

          <h3 className="mt-5 max-w-[12ch] font-serif text-3xl leading-tight text-white">
            {tier.title}
          </h3>

          <div className="mt-4">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
              Investment
            </div>
            <div className="mt-2 font-serif text-2xl text-amber-300/86">
              {tier.price}
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/54">
            {tier.positioning}
          </p>

          <div className="mt-7 border border-white/[0.08] bg-black/20 p-4">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
              Best for
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {tier.bestFor}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            {tier.includes.map((entry) => (
              <div key={entry} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                <span className="text-sm leading-relaxed text-white/58">
                  {entry}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-1">
            <Link
              href={tier.ctaHref}
              className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/72 transition-colors hover:text-amber-300"
            >
              <span>{tier.ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.article>
      ))}
    </div>
  );
}