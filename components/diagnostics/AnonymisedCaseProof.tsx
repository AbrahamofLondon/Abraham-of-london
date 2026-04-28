"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

const CASES = [
  {
    title: "Board misalignment under growth pressure",
    outcome:
      "Identified strategic intent drift across leadership layers. Prevented premature capital deployment.",
  },
  {
    title: "Operational clarity collapse in scaling team",
    outcome:
      "Exposed hidden execution bottlenecks. Reduced friction before expansion phase.",
  },
  {
    title: "Founder-led organisation nearing burnout limit",
    outcome:
      "Detected systemic overload patterns. Intervention prevented leadership breakdown.",
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function AnonymisedCaseProof() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {CASES.map((item, i) => (
        <motion.article
          key={item.title}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: i * 0.08 }}
          className={cn(
            "relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-6 md:p-7",
            "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400/70" />
            <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
              Anonymised case
            </div>
          </div>

          <h3 className="mt-5 max-w-[16ch] font-serif text-xl leading-tight text-white md:text-2xl">
            {item.title}
          </h3>

          <div className="mt-5 border border-white/[0.08] bg-black/20 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/68" />
              <p className="text-sm leading-relaxed text-white/54">
                {item.outcome}
              </p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
