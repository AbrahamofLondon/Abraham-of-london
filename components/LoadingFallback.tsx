"use client";

import { motion } from '...';

interface LoadingFallbackProps {
  type?: "card" | "hero" | "stats" | "generic";
  className?: string;
}

export default function LoadingFallback({
  type = "generic",
  className = "",
}: LoadingFallbackProps) {
  const baseClasses = "bg-gray-100 animate-pulse rounded-lg";

  const variants = {
    card: "h-80 w-full",
    hero: "h-[70svh] w-full",
    stats: "h-24 w-full",
    generic: "h-32 w-full",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variants[type]} ${className}`}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-deepCharcoal rounded-full animate-spin" />
      </div>
    </motion.div>
  );
}
