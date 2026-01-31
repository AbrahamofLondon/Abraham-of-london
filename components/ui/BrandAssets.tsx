// components/ui/BrandAssets.tsx

import React from 'react';

export const InterfaceCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`city-gate-card ${className}`}>
    {children}
  </div>
);

export const MetadataTag = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
  <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60 border border-amber-500/20 px-4 py-1.5 rounded-full">
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </div>
);

export const ProtocolButton = ({ children, ...props }: any) => (
  <button className="aol-btn" {...props}>
    {children}
  </button>
);