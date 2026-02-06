"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, ArrowUp, Briefcase, Vault, Globe } from "lucide-react";

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden pt-24 pb-12">
      <div className="container mx-auto px-6">
        
        {/* High-End CTACards (Sovereign Rails) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 border border-border/30 mb-24 overflow-hidden shadow-soft">
          <FooterCTA href="/consulting" title="Engage Advisory" label="GOVERNANCE" icon={<Briefcase size={18}/>} />
          <FooterCTA href="/inner-circle" title="Secure Clearance" label="MEMBERSHIP" icon={<Fingerprint size={18}/>} />
          <FooterCTA href="/downloads/vault" title="Open the Vault" label="RESOURCES" icon={<Vault size={18}/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="group inline-block">
              <h2 className="font-editorial text-4xl italic text-white tracking-tighter group-hover:text-primary transition-all duration-500">
                Abraham of London
              </h2>
              <div className="font-mono text-3xs uppercase tracking-[0.6em] text-primary/60 mt-2">
                Sovereign Intelligence Architecture
              </div>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-light italic">
              "Faith-rooted strategy for institutions that refuse to outsource responsibility."
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 pt-4">
             <div className="space-y-6">
               <h4 className="font-mono text-3xs uppercase tracking-[0.4em] text-zinc-800">Registry</h4>
               <ul className="space-y-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                 <li><Link href="/canon" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Full_Canon</Link></li>
                 <li><Link href="/registry/dispatches" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Dispatches</Link></li>
               </ul>
             </div>
             <div className="space-y-6">
               <h4 className="font-mono text-3xs uppercase tracking-[0.4em] text-zinc-800">System</h4>
               <ul className="space-y-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                 <li><Link href="/security" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Vault_Security</Link></li>
                 <li><Link href="/contact" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Terminal_Contact</Link></li>
               </ul>
             </div>
          </div>
        </div>

        {/* Bottom Status Terminal */}
        <div className="pt-12 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-1">
            <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
              © {year} AOL // PORTFOLIO_V.01 // 75_BRIEFS_SYNCED
            </div>
            <div className="flex items-center gap-4 text-[8px] font-mono text-zinc-800 uppercase tracking-tighter">
              <span>Sovereignty: Absolute</span>
              <span>Node: London_HQ</span>
            </div>
          </div>
          
          <button onClick={scrollToTop} className="group flex items-center gap-4 font-mono text-3xs uppercase tracking-[0.5em] text-zinc-500 hover:text-white transition-all">
            Ascend_Protocol <ArrowUp size={12} className="group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterCTA({ href, title, label, icon }: any) {
  return (
    <Link href={href} className="group p-12 bg-background hover:bg-surface transition-all duration-700 relative overflow-hidden">
      <div className="relative z-10">
        <p className="font-mono text-[9px] text-zinc-700 group-hover:text-primary transition-colors mb-6 tracking-[0.4em]">{label}</p>
        <div className="flex justify-between items-end">
          <h3 className="font-editorial text-2xl italic text-white group-hover:translate-x-1 transition-transform duration-500">{title}</h3>
          <div className="text-zinc-800 group-hover:text-primary group-hover:rotate-12 transition-all duration-500">{icon}</div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 text-white/[0.02] rotate-12 pointer-events-none group-hover:text-primary/5 transition-colors">
        <ShieldCheck size={120} />
      </div>
    </Link>
  );
}