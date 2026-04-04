"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
    title: "Founder-led organisation nearing burnout threshold",
    outcome:
      "Detected systemic overload patterns. Intervention prevented leadership breakdown.",
  },
];

export default function AnonymisedCaseProof() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {CASES.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <ShieldCheck className="h-5 w-5 text-amber-400/70" />

          <h3 className="mt-4 text-white font-serif text-xl">
            {item.title}
          </h3>

          <p className="mt-3 text-sm text-white/50 leading-relaxed">
            {item.outcome}
          </p>
        </motion.div>
      ))}
    </div>
  );
}