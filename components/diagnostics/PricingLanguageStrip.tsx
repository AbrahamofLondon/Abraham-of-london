"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Layers, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    title: "Committed entry",
    body:
      "The entry layer is structured to reflect commitment, attention, and decision value.",
    icon: ShieldCheck,
  },
  {
    title: "Premium flagship",
    body:
      "Executive Reporting stands as a consequence layer with its own decision value.",
    icon: Crown,
  },
  {
    title: "Selective escalation",
    body:
      "Private advisory is reserved for situations that justify mandate-level intervention.",
    icon: Layers,
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function PricingLanguageStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ITEMS.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className={cn(
              "relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-6",
              "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-amber-400/68" />
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                {item.title}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/52">
              {item.body}
            </p>
          </motion.article>
        );
      })}
    </div>
  );
}
