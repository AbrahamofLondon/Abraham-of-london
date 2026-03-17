"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Workflow,
  Shield,
  Scale,
  Target,
  Activity,
  ChevronRight,
  Monitor,
  Terminal
} from "lucide-react";

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

function toDateLabel(input?: LooseShort["date"]): string {
  if (!input) return "PENDING";
  const d = input instanceof Date ? input : new Date(String(input));
  if (!Number.isFinite(d.getTime())) return "PENDING";
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function getHref(s: LooseShort): string {
  if (s.url) return s.url;
  if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
  const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
  if (raw) return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
  return "/shorts";
}

const rails = [
  { label: "Cadence", icon: <Workflow className="h-3 w-3" /> },
  { label: "Controls", icon: <Shield className="h-3 w-3" /> },
  { label: "Decision Rights", icon: <Scale className="h-3 w-3" /> },
  { label: "Mandate", icon: <Target className="h-3 w-3" /> },
] as const;

export default function ExecutiveIntelligenceStrip({
  shorts,
  viewAllHref = "/shorts",
}: {
  shorts: LooseShort[];
  viewAllHref?: string;
}): React.ReactElement | null {
  const [sessionId, setSessionId] = useState<string>("");

  const items: LooseShort[] = Array.isArray(shorts) ? shorts.slice(0, 5) : [];

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);

  const lead = items.length > 0 ? items[0] : null;
  if (!lead) return null;

  const rest = items.slice(1);

  return (
    <section className="relative bg-black py-20 overflow-hidden border-t border-white/10">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        
        {/* --- Institutional Header --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">
                Intelligence Briefings
              </span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl text-white tracking-tight leading-none italic">
              Field notes <span className="text-white/20 not-italic">for deployment.</span>
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {rails.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                  <span className="text-amber-500/50">{r.icon}</span>
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          <Link
            href={viewAllHref}
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors border-b border-white/10 pb-2"
          >
            Archive Access <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- The Briefing Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-white/10 bg-white/5">
          
          {/* THE LEAD BRIEF: Large-scale clarity */}
          <Link 
            href={getHref(lead)} 
            className="lg:col-span-7 bg-black p-10 md:p-14 flex flex-col group relative border-r border-white/10 overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-24">
                <div className="flex items-center gap-3 font-mono text-[9px] font-bold text-amber-500/60 uppercase tracking-widest">
                  <Monitor size={14} />
                  <span>Priority: High // {lead.readTime || "5 MIN"}</span>
                </div>
                <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">
                  {toDateLabel(lead.date)}
                </div>
              </div>

              <div className="mt-auto space-y-6">
                <h3 className="font-serif text-4xl text-white italic leading-tight group-hover:text-amber-50 transition-colors">
                  {lead.title || "Untitled Intelligence"}
                </h3>
                <p className="text-sm leading-relaxed text-white/40 group-hover:text-white/60 transition-colors max-w-md font-light italic">
                  {lead.excerpt || lead.description || ""}
                </p>
                <div className="pt-8 flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Initialize Briefing</span>
                  <div className="h-[1px] w-12 bg-amber-500/30 group-hover:w-20 transition-all" />
                </div>
              </div>
            </div>
          </Link>

          {/* THE TRIAGE FEED: Ledger style */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-white/10 bg-black">
            {rest.map((s, idx) => (
              <Link key={idx} href={getHref(s)} className="group block flex-1 transition-all hover:bg-white/[0.03]">
                <div className="p-8 flex items-start justify-between gap-6">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono font-bold text-amber-500/40">0{idx + 2}</span>
                        <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">
                          {toDateLabel(s.date)}
                        </span>
                    </div>
                    <h4 className="text-lg font-serif text-white/80 group-hover:text-white transition-colors truncate italic">
                      {s.title || "Untitled Brief"}
                    </h4>
                  </div>
                  <ChevronRight size={18} className="text-white/10 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
            
            {/* View All Terminal Link */}
            <Link href={viewAllHref} className="p-8 bg-zinc-900/30 group flex items-center justify-between hover:bg-amber-500/5 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-amber-500">Access Full Intelligence Registry</span>
                <Activity size={16} className="text-white/10 group-hover:text-amber-500 animate-pulse" />
            </Link>
          </div>
        </div>

        {/* --- System Meta Data --- */}
        <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">Feed Status: Operational</span>
            </div>
            <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest hidden md:inline">Session_{sessionId}</span>
          </div>
          <div className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">
            Abraham of London • Intel Division
          </div>
        </div>
      </div>
    </section>
  );
}