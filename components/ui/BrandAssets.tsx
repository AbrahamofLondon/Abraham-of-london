"use client";

import * as React from "react";

/**
 * Abraham of London: Metadata Tag
 * A React implementation that uses the CSS classes defined in brand-system.css
 */
interface MetadataTagProps {
  icon?: React.ElementType;
  children: React.ReactNode;
}

export const MetadataTag = ({ icon: Icon, children }: MetadataTagProps) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1">
      {Icon && <Icon className="h-3 w-3 text-amber-500/60" />}
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
        {children}
      </span>
    </div>
  );
};

// This file is now pure TypeScript. No CSS directives here.