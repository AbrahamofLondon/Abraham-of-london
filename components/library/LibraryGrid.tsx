// components/library/LibraryGrid.tsx — OPTIMIZED & TYPE-SAFE
'use client';

import React, { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { BookOpen, FileText, Download } from 'lucide-react';

// Pre-define transitions with proper typing
const gridTransition: Transition = {
  duration: 0.2,
  ease: "easeOut", // Use string literal instead of array
};

// Icon mapping
const TypeIcon = {
  book: BookOpen,
  download: Download,
  resource: FileText,
  default: FileText,
};

// Memoized grid item
const LibraryItem = memo(({ item, index }: { item: any; index: number }) => {
  const Icon = TypeIcon[item.type as keyof typeof TypeIcon] || TypeIcon.default;
  
  // Create transition with proper typing
  const itemTransition: Transition = {
    ...gridTransition,
    delay: Math.min(index * 0.01, 0.2),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={itemTransition}
      className="group bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-amber-500/30"
    >
      <Link href={item.href || `/${item.type}s/${item.slug}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20">
            <Icon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate group-hover:text-amber-400">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

LibraryItem.displayName = 'LibraryItem';

interface LibraryGridProps {
  items: any[];
  columns?: 2 | 3 | 4;
}

export default function LibraryGrid({ items, columns = 3 }: LibraryGridProps) {
  const [filter, setFilter] = useState('');
  
  // Memoize filtered items
  const filteredItems = useMemo(() => {
    if (!filter) return items;
    const lowerFilter = filter.toLowerCase();
    return items.filter(item => 
      item.title?.toLowerCase().includes(lowerFilter) ||
      item.description?.toLowerCase().includes(lowerFilter)
    );
  }, [items, filter]);

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  // If no items, show empty state
  if (!items.length) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-600">No items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter items..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-amber-500/50 outline-none"
        />
        <span className="absolute right-3 top-3 text-xs text-zinc-600">
          {filteredItems.length} items
        </span>
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
        {filteredItems.map((item, index) => (
          <LibraryItem key={item.slug || item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}