// components/MemberClearanceBanner.tsx — HARDENED (Conversion Logic)
'use client';

import React, { useEffect, useState } from 'react';
import { useRegistry } from '@/contexts/RegistryProvider';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export default function MemberClearanceBanner({ totalClassified }: { totalClassified: number }) {
  const { userTier } = useRegistry();
  const [isVisible, setIsVisible] = useState(false);

  // Only show to public users after a short delay
  useEffect(() => {
    if (userTier === 'public' || !userTier) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [userTier]);

  if (!isVisible || userTier !== 'public') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="bg-zinc-950 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1 flex items-center gap-4 group">
        
        <div className="bg-amber-500 p-4 text-black hidden sm:block">
          <ShieldCheck size={20} />
        </div>

        <div className="flex-1 py-2 pl-4 sm:pl-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500 mb-1">
            Access Restricted // Clearance Level 0
          </p>
          <p className="text-white text-xs font-light">
            There are <span className="font-bold text-amber-500">{totalClassified}</span> classified briefs hidden from your current view.
          </p>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <Link 
            href="/inner-circle"
            className="bg-white/5 hover:bg-white/10 text-white font-mono text-[9px] uppercase tracking-widest py-3 px-6 transition-all flex items-center gap-2"
          >
            Elevate <ArrowRight size={12} />
          </Link>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-3 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}