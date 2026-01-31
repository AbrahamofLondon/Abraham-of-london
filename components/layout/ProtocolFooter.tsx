"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Shield, 
  Terminal, 
  Cpu, 
  Globe, 
  Lock,
  ArrowUp
} from "lucide-react";
import { MetadataTag } from "@/components/ui/BrandAssets";

export default function ProtocolFooter() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-white/5 bg-black pt-20 pb-10 overflow-hidden">
      {/* 1. Structural Accents */}
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          
          {/* Column A: Institutional Identity */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5">
                <Shield className="h-4 w-4 text-white/40" />
              </div>
              <span className="font-serif text-xl font-medium tracking-tight text-white">
                Abraham <span className="text-white/40">of London</span>
              </span>
            </div>
            
            <p className="max-w-xs text-sm font-light leading-relaxed text-white/30">
              A private governance and strategy collective. We architect institutional 
              integrity where scripture, history, and market reality intersect.
            </p>

            <div className="flex flex-wrap gap-3">
              <MetadataTag icon={Globe}>London // Global</MetadataTag>
              <MetadataTag icon={Lock}>Secure Channel</MetadataTag>
            </div>
          </div>

          {/* Column B: System Directories */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">
                Directives
              </h4>
              <nav className="flex flex-col gap-4">
                {['The Canon', 'Field Briefs', 'The Vault', 'Case Studies'].map((link) => (
                  <Link 
                    key={link} 
                    href={`/${link.toLowerCase().replace(' ', '-')}`}
                    className="text-xs font-light text-white/40 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">
                Governance
              </h4>
              <nav className="flex flex-col gap-4">
                {['Terms', 'Privacy', 'Ethics', 'Mandates'].map((link) => (
                  <Link 
                    key={link} 
                    href={`/${link.toLowerCase()}`}
                    className="text-xs font-light text-white/40 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Column C: Terminal Status */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                  System Status
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-white/20 uppercase">Encryption</span>
                  <span className="text-[9px] font-mono text-green-500/80 uppercase">AES-256</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-white/20 uppercase">Uptime</span>
                  <span className="text-[9px] font-mono text-white/40 uppercase">99.99%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[9px] font-mono text-white/20 uppercase">Protocol</span>
                  <span className="text-[9px] font-mono text-amber-500/60 uppercase">ACTIVE</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={scrollToTop}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Return to Zenith
            </button>
          </div>
        </div>

        {/* --- Bottom Audit Line --- */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Cpu className="h-4 w-4 text-white/10" />
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              © {currentYear} Abraham of London. All Rights Reserved. Institutional Property.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-[8px] font-mono text-white/10 uppercase tracking-tighter">
              Build Ver: 2026.1.31-ALPHA
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-white/5" />
            <span className="text-[8px] font-mono text-white/10 uppercase tracking-tighter">
              Lat: 51.5074° N // Long: 0.1278° W
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}