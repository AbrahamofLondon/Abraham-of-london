// components/MembershipGate.tsx — HARDENED (Total Content Lockdown)
'use client';

import React from 'react';
import { Lock, ShieldAlert, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRegistry } from '@/contexts/RegistryProvider';

interface MembershipGateProps {
  requiredTier: 'inner-circle' | 'private';
  assetTitle?: string;
}

export default function MembershipGate({ requiredTier, assetTitle }: MembershipGateProps) {
  const router = useRouter();
  const { toggleSearch } = useRegistry();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6">
      {/* BACKGROUND TEXTURE */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black" />
        <div className="font-mono text-[40vh] text-white/5 absolute -bottom-20 -left-20 select-none">
          00
        </div>
      </div>

      <div className="relative max-w-xl w-full text-center">
        {/* 1. ICONOGRAPHY */}
        <div className="inline-flex items-center justify-center p-6 border border-amber-500/20 bg-amber-500/5 mb-10">
          <ShieldAlert className="text-amber-500" size={32} />
        </div>

        {/* 2. SECURITY HEADER */}
        <div className="space-y-4 mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-500">
            Security Protocol // Unauthorized Access
          </p>
          <h2 className="text-4xl md:text-5xl font-serif italic text-white leading-tight">
            Classification: {requiredTier.replace('-', ' ')}
          </h2>
          {assetTitle && (
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-4">
              Asset: {assetTitle}
            </p>
          )}
        </div>

        {/* 3. TACTICAL OPTIONS */}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={toggleSearch}
            className="w-full py-5 bg-white text-black font-mono text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-500 transition-all"
          >
            <Key size={14} /> Provide Credentials
          </button>

          <Link 
            href="/inner-circle"
            className="w-full py-5 border border-white/10 text-white font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
          >
            Request Clearance <ArrowRight size={14} />
          </Link>
        </div>

        {/* 4. EMERGENCY EXIT */}
        <button
          onClick={() => router.back()}
          className="mt-12 group flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
            Return to Public Registry
          </span>
        </button>
      </div>

      {/* FOOTER METADATA */}
      <div className="absolute bottom-10 w-full text-center pointer-events-none">
        <p className="font-mono text-[8px] uppercase tracking-[0.8em] text-zinc-800">
          Abraham of London // Secure Node 8.2
        </p>
      </div>
    </div>
  );
}

// Helper for linking
import Link from 'next/link';