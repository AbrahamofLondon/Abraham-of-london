// components/LuxuryAnimator.tsx
'use client';

import { motion } from 'framer-motion';

export default function LuxuryAnimator() {
Â  return (
Â  Â  <motion.div
Â  Â  Â  initial={{ opacity: 0, scale: 0.8 }}
Â  Â  Â  animate={{ opacity: 1, scale: 1 }}
Â  Â  Â  transition={{ duration: 0.8, ease: 'easeOut' }}
Â  Â  Â  // Using custom classes and theme variables for consistency
Â  Â  Â  className="card p-8 flex items-center justify-center bg-[var(--color-accent)] text-[var(--color-on-accent)]"
Â  Â  >
Â  Â  Â  <h2 className="text-3xl font-serif font-bold tracking-wide">
Â  Â  Â  Â  LuxuryAnimator
Â  Â  Â  </h2>
Â  Â  </motion.div>
Â  );
}
