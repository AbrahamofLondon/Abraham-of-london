"use client";

import * as React from "react";
import { motion } from "framer-motion";

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
    a: "Founders, boards, and leadership teams operating under real consequence—not exploratory curiosity.",
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

export default function TrustFAQ() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {FAQ.map((item, i) => (
        <motion.div
          key={item.q}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <h3 className="text-white font-serif text-xl">{item.q}</h3>
          <p className="mt-3 text-sm text-white/50 leading-relaxed">{item.a}</p>
        </motion.div>
      ))}
    </div>
  );
}