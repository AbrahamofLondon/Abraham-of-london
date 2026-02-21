// components/Frameworks/PrivateFrameworkView.tsx — PRIVATE INTELLIGENCE LAYER
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { Eye, Shield, Activity, Download, Printer, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import { DecisionMemo } from "@/components/Frameworks/DecisionMemo";
import { AuditLog } from "@/components/Frameworks/AuditLog";

import type { User } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";
import type { Framework } from "@/lib/resources/strategic-frameworks";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const LIBRARY_HREF = "/resources/strategic-frameworks";

// ✅ FIX: Type-safe accent class generator
type AccentType = "gold" | "emerald" | "blue" | "rose" | "indigo";

const accentMap: Record<AccentType, string> = {
  gold: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent text-amber-200 shadow-[0_0_30px_-8px_rgba(245,158,11,0.3)]",
  emerald: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-emerald-200 shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)]",
  blue: "border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent text-sky-200 shadow-[0_0_30px_-8px_rgba(14,165,233,0.3)]",
  rose: "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent text-rose-200 shadow-[0_0_30px_-8px_rgba(244,63,94,0.3)]",
  indigo: "border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent text-indigo-200 shadow-[0_0_30px_-8px_rgba(99,102,241,0.3)]",
};

function accentClass(accent?: string): string {
  // ✅ Guard against undefined/null and ensure it's a valid key
  if (!accent || !(accent in accentMap)) {
    return accentMap.gold; // Default fallback
  }
  return accentMap[accent as AccentType];
}

interface PrivateFrameworkViewProps {
  framework: Framework;
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  onPrivateReady?: () => void;
}

export const PrivateFrameworkView: React.FC<PrivateFrameworkViewProps> = ({ 
  framework, 
  user, 
  innerCircleAccess, 
  onPrivateReady 
}) => {
  const hasAccess = Boolean(innerCircleAccess?.hasAccess) || user?.role === "admin" || user?.role === "editor";

  React.useEffect(() => {
    if (hasAccess) onPrivateReady?.();
  }, [hasAccess, onPrivateReady]);

  if (!hasAccess) return null;

  return (
    <Layout title={`${framework.title} | Strategic Briefing`} className="bg-black min-h-screen print:bg-white">
      <Head><meta name="robots" content="noindex,nofollow" /></Head>

      {/* Decision Memo Engine (Print Secret Layer) */}
      <div className="print:block hidden">
        <DecisionMemo framework={framework} />
      </div>

      <div className="print:hidden">
        {/* Navigation / Header */}
        <div className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live_Dossier_Active</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-tighter">{user?.name} // {user?.role}</span>
              <Link href={LIBRARY_HREF} className="text-white/40 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors">Close Brief</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-4 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-24">
            <header>
              <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] mb-8 ${accentClass(framework.accent)}`}>
                {framework.tag}
              </span>
              <h1 className="font-serif text-7xl font-bold text-white mb-8 uppercase leading-[0.85] tracking-tighter">
                {framework.title}
              </h1>
              <p className="text-2xl text-white/40 font-serif italic border-l-2 border-amber-500/40 pl-8 py-2 max-w-3xl">
                "{framework.oneLiner}"
              </p>
            </header>

            {/* Decision Memo Component (Screen View) */}
            <DecisionMemo framework={framework} />

            {/* Structured Content Sections */}
            <section>
              <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                <span className="h-px bg-amber-500/20 flex-1" /> Operating Logic <Activity size={14} />
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {framework.operatingLogic?.map((logic, i) => (
                  <div key={i} className="group relative bg-zinc-900/30 border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all duration-500" />
                    <div className="relative">
                      <div className="text-amber-500/30 text-5xl font-serif mb-4">{String(i+1).padStart(2, '0')}</div>
                      <h3 className="text-white font-bold text-lg mb-4 uppercase tracking-tight group-hover:text-amber-200 transition-colors">
                        {logic.title}
                      </h3>
                      <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">
                        {logic.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Board Questions */}
            <section className="relative bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-3xl p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-white font-bold text-3xl mb-10 flex items-center gap-4">
                  <Shield className="text-amber-500" size={28} /> 
                  <span>Fiduciary Inquiries</span>
                </h2>
                <div className="space-y-6">
                  {framework.boardQuestions?.map((q, i) => (
                    <div key={i} className="flex gap-6 text-zinc-300 text-lg font-serif italic border-b border-white/5 pb-6 last:border-0">
                      <span className="text-amber-500 font-mono text-sm tracking-tighter w-12">Q_{i+1}</span>
                      <p className="flex-1">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Intelligence */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 space-y-8">
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Eye size={14} className="text-amber-500" /> Intelligence
                </h4>
                <AuditLog slug={framework.slug} userName={user?.name || "Anonymous"} />
              </div>
              
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Metadata</h4>
                <div className="space-y-6">
                  <div>
                    <span className="block text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Institutional Tier</span>
                    <span className="text-amber-200 text-sm font-bold uppercase tracking-tight">{framework.tier.join(" + ")}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Canon Root</span>
                    <span className="text-zinc-300 text-sm italic">"{framework.canonRoot}"</span>
                  </div>
                </div>
              </div>

              {framework.artifactHref && (
                <a 
                  href={framework.artifactHref} 
                  className="group flex items-center justify-between w-full bg-white text-black p-5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-2xl"
                >
                  <span className="flex items-center gap-3">
                    <Download size={16} />
                    Download Package
                  </span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              )}

              <button className="w-full border border-white/5 p-5 rounded-xl text-white/40 hover:text-white transition-colors flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest">
                <Printer size={14} />
                Print Dossier
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default PrivateFrameworkView;