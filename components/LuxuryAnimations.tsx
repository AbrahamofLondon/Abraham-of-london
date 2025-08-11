// components/LuxuryAnimator.tsx
'use client';

import { motion } from 'framer-motion';

export default function LuxuryAnimator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="flex items-center justify-center p-8 bg-gold-900 text-platinum rounded-xl shadow-lg"
    >
      <h2 className="text-3xl font-bold tracking-wide">
        LuxuryAnimator
      </h2>
    </motion.div>
  );
}