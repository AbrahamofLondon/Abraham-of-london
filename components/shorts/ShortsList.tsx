// components/shorts/ShortsList.tsx — OPTIMIZED & TYPE-SAFE
'use client';

import React, { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';

// Pre-define transitions with proper typing
const itemTransition: Transition = {
  duration: 0.15,
  ease: "easeOut", // Use string literal instead of array
};

// Memoize individual short card
const ShortCard = memo(({ short, index }: { short: any; index: number }) => {
  // Create transition with proper typing
  const cardTransition: Transition = {
    ...itemTransition,
    delay: Math.min(index * 0.02, 0.3), // Cap delay
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={cardTransition}
      className="group relative bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-amber-500/30"
    >
      <Link href={`/shorts/${short.slug}`}>
        <h3 className="font-serif text-xl text-white group-hover:text-amber-400 transition-colors">
          {short.title}
        </h3>
        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
          {short.excerpt}
        </p>
        <span className="mt-4 inline-block text-xs text-amber-500">
          Read more →
        </span>
      </Link>
    </motion.article>
  );
});

ShortCard.displayName = 'ShortCard';

interface ShortsListProps {
  shorts: any[];
  initialLimit?: number;
}

export default function ShortsList({ shorts, initialLimit = 12 }: ShortsListProps) {
  const [limit, setLimit] = useState(initialLimit);
  
  // Memoize visible shorts
  const visibleShorts = useMemo(() => 
    shorts.slice(0, limit), 
    [shorts, limit]
  );

  const hasMore = shorts.length > limit;

  const loadMore = () => {
    setLimit(prev => Math.min(prev + 12, shorts.length));
  };

  // If no shorts, show empty state
  if (!shorts.length) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-600">No shorts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleShorts.map((short, index) => (
          <ShortCard key={short.slug || index} short={short} index={index} />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors text-sm"
          >
            Load More ({shorts.length - limit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}