"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const FAQ = [
  {
    q: "Is this a replacement for consulting?",
    a: "No. It is the layer before consulting. It ensures that any advisory engagement starts from a position of clarity rather than assumption.",
  },
  {
    q: "How accurate is the report?",
    a: "Accuracy is a function of input integrity and structural interpretation. The system is designed to produce decision-grade clarity, not vanity metrics.",
  },
  {
    q: "Who is this designed for?",
    a: "Founders, boards, and leadership teams operating under real consequence, not exploratory curiosity.",
  },
  {
    q: "What happens after the report?",
    a: "You either correct internally, pause escalation, or proceed into a structured mandate. The report defines that decision boundary.",
  },
  {
    q: "Can this expose internal weaknesses?",
    a: "Yes. That is the point. Controlled exposure is cheaper than unmanaged failure.",
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function TrustFAQ() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {FAQ.map((item, i) => (
        <motion.article
          key={item.q}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className={cn(
            "relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-6 md:p-7",
            "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full border border-white/10 bg-white/[0.04] p-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400/68" />
            </div>

            <div className="min-w-0">
              <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/70">
                FAQ
              </div>
              <h3 className="mt-3 max-w-[22ch] font-serif text-xl leading-tight text-white md:text-2xl">
                {item.q}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/54">
                {item.a}
              </p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}