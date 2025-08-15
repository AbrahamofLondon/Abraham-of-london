// components/LuxuryAnimator.tsx
"use client";

import { motion } from "framer-motion";

export default function LuxuryAnimator() {
  return (
    <motion.div
      role="region"
      aria-label="Animated highlight"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl p-8 shadow-xl bg-gradient-to-br from-forest to-emerald-700 text-cream"
    >
      <h2 className="text-3xl font-serif font-bold tracking-wide text-center">
        LuxuryAnimator
      </h2>
    </motion.div>
  );
}
