// components/LuxuryAnimator.tsx
"use client";

import { motion } from "framer-motion";

export default function LuxuryAnimator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      // Using custom classes and theme variables for consistency
      className="card p-8 flex items-center justify-center bg-[var(--color-accent)] text-[var(--color-on-accent)]"
    >
      <h2 className="text-3xl font-serif font-bold tracking-wide">
        LuxuryAnimator
      </h2>
    </motion.div>
  );
}







