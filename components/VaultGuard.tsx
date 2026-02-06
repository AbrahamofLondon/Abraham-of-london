'use client';

import React, { useState } from 'react';
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import { requestAccessAction } from '@/app/actions/request-access';

interface VaultGuardProps {
  title: string;
  slug: string; // Added slug for tracking
  preview?: string;
  isGated: boolean;
  children: React.ReactNode;
}

export const VaultGuard = ({ title, slug, preview, isGated, children }: VaultGuardProps) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!isGated) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('slug', slug);
    formData.append('title', title);

    try {
      await requestAccessAction(formData);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  return (
    <div className="relative group rounded-2xl border border-white/5 bg-slate-950 p-1 overflow-hidden transition-all duration-700 hover:border-white/10 shadow-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute -top-[20%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      
      {/* Content Veil (The Blur) */}
      <div className="p-8 opacity-[0.03] select-none pointer-events-none filter blur-xl transition-all duration-1000 group-hover:blur-2xl">
        <h1 className="text-2xl font-light tracking-widest uppercase mb-6">{title}</h1>
        <div className="space-y-6">
          <p className="leading-relaxed">{preview || "The strategic architecture of this engagement follows a modular framework designed for high-impact scaling..."}</p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="h-4 w-full bg-white/5 rounded-full" />
          <div className="h-4 w-5/6 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* The Elegant Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center backdrop-blur-[3px] bg-slate-950/40">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-white/5 rounded-full animate-ping duration-[4000ms]" />
          <div className="relative bg-black border border-white/10 p-6 rounded-full shadow-2xl transition-transform duration-700 group-hover:scale-110">
            <Fingerprint className="w-12 h-12 text-white/70 font-extra-light" />
          </div>
        </div>

        <h2 className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4 font-medium">
          Institutional Engagement
        </h2>
        
        <h3 className="text-2xl font-serif italic text-white/90 mb-10 max-w-sm leading-snug">
          "The most valuable intelligence is that which is curated for the specific few."
        </h3>

        {status === 'success' ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <p className="text-sm tracking-widest uppercase text-blue-400 font-light">
              Request Logged. Awaiting Review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative w-full max-w-sm group/form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Institutional Email"
              className="w-full bg-transparent border-b border-white/10 py-3 px-2 text-center text-sm tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors uppercase"
            />
            <button 
              disabled={status === 'submitting'}
              className="mt-8 group relative inline-flex items-center gap-3 px-10 py-3 overflow-hidden rounded-full border border-white/10 bg-transparent transition-all hover:border-white/40 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
              <span className="relative text-[10px] tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors">
                {status === 'submitting' ? 'Processing' : 'Request Access Key'}
              </span>
              {status === 'submitting' ? (
                <Loader2 className="w-3 h-3 animate-spin text-white/60" />
              ) : (
                <ArrowRight className="w-3 h-3 text-white/40 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>
        )}

        <p className="absolute bottom-8 text-[9px] uppercase tracking-[0.3em] text-white/10">
          Abraham of London &copy; 2026 Registry 
        </p>
      </div>
    </div>
  );
};