'use client';

import { motion } from 'framer-motion';

export default function AnimatedSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20"
    >
      {/* Your premium content */}
    </motion.section>
  );
}
