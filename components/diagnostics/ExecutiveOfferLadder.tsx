"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, CheckCircle2 } from "lucide-react";

type Offer = {
  title: string;
  label: string;
  price: string;
  body: string;
  bullets: string[];
  href: string;
  emphasis?: boolean;
};

const DEFAULT_OFFERS: Offer[] = [
  {
    title: "Diagnostics",
    label: "Entry",
    price: "Free",
    body:
      "The first disciplined layer for leaders who need clarity before escalation.",
    bullets: [
      "Pattern reading and structural interpretation",
      "Useful before advisory is justified",
      "Best when drift is visible but diagnosis is still weak",
    ],
    href: "/diagnostics",
  },
  {
    title: "Executive Reporting",
    label: "Flagship",
    price: "Premium",
    body:
      "The core reporting layer for decision-makers who need a sharper reading, clearer exposure, and correction architecture.",
    bullets: [
      "Narrative, matrix, exposure, and correction priority",
      "Readable by founders, boards, and operators",
      "The strongest bridge before mandate work",
    ],
    href: "/diagnostics/executive-reporting",
    emphasis: true,
  },
  {
    title: "Strategy Room",
    label: "Selective",
    price: "Mandate",
    body:
      "The private chamber for situations where consequence is already material and structured intervention is justified.",
    bullets: [
      "Private advisory path",
      "Correction environment design",
      "Decision architecture under pressure",
    ],
    href: "/strategy-room",
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function ExecutiveOfferLadder({
  offers = DEFAULT_OFFERS,
}: {
  offers?: Offer[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {offers.map((item, index) => (
        <motion.article
          key={`${item.title}-${item.href}`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.08 }}
          className={cn(
            "relative overflow-hidden border p-8 transition-all duration-500",
            "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
            item.emphasis
              ? "border-amber-500/24 bg-amber-500/[0.03] hover:border-amber-500/42 hover:bg-amber-500/[0.05]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {item.emphasis ? (
            <div className="absolute right-6 top-6 flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-amber-400/76" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/76">
                Flagship
              </span>
            </div>
          ) : null}

          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/36">
            {item.label}
          </div>

          <h3 className="mt-5 max-w-[11ch] font-serif text-3xl leading-tight text-white">
            {item.title}
          </h3>

          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/76">
            {item.price}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/52">
            {item.body}
          </p>

          <div className="mt-7 space-y-3">
            {item.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                <span className="text-sm leading-relaxed text-white/58">
                  {bullet}
                </span>
              </div>
            ))}
          </div>

          <Link
            href={item.href}
            className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70 transition-colors hover:text-amber-300"
          >
            <span>Open pathway</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.article>
      ))}
    </div>
  );
}
