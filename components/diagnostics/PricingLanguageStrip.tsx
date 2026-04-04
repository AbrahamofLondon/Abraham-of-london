"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Layers, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    title: "Paid entry",
    body:
      "The first layer should require commitment. Free attracts curiosity; paid attracts seriousness.",
    icon: ShieldCheck,
  },
  {
    title: "Premium flagship",
    body:
      "The executive report should sit as a premium artifact, not a cheap add-on or a hidden appendix to consulting.",
    icon: Crown,
  },
  {
    title: "Selective escalation",
    body:
      "Private advisory remains separate. This protects trust, fit, and commercial seriousness.",
    icon: Layers,
  },
];

export default function PricingLanguageStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ITEMS.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-amber-400/68" />
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                {item.title}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              {item.body}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}