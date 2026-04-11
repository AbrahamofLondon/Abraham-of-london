"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Lock, Eye, Download, Search, Filter } from "lucide-react";

interface Brief {
  id: string;
  title: string;
  category: "STRATEGY" | "GOVERNANCE" | "EXECUTION" | "OPERATIONS";
  date: string;
  clearance: "LEVEL_1" | "LEVEL_2" | "TOP_SECRET";
  abstract: string;
}

const BRIEF_REGISTRY: Brief[] = [
  {
    id: "AOFL-B01",
    title: "The Architecture of Human Purpose",
    category: "GOVERNANCE",
    date: "2026.03.11",
    clearance: "LEVEL_1",
    abstract: "Foundational frameworks for institutional alignment and long-term sovereign endurance."
  },
  // ... this will scale to all 75 briefs
];

export default function BriefsGrid() {
  const [filter, setFilter] = React.useState("ALL");

  return (
    <section className="bg-[#060609] py-24 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        
        {/* Registry Header & Intelligence Counter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-white/10 pb-12 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-white/40 uppercase">
                Active_Intelligence_Vault
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif italic text-white">The Briefing Portfolio</h2>
            <p className="text-white/30 font-light max-w-md text-sm italic">
              A cumulative registry of 75 strategic dossiers. Access is restricted to authorized architecture partners.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 min-w-[240px]">
            <div className="text-[9px] font-mono text-amber-500/50 uppercase mb-2 tracking-widest">Registry_Status</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif text-white">75</span>
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">Verified_Briefs</span>
            </div>
          </div>
        </div>

        {/* Intelligence Filter Rail */}
        <div className="flex overflow-x-auto gap-4 mb-12 no-scrollbar border-b border-white/5 pb-6">
          {["ALL", "STRATEGY", "GOVERNANCE", "EXECUTION", "OPERATIONS"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all border ${
                filter === cat 
                ? "bg-white text-black border-white" 
                : "text-white/40 border-white/10 hover:border-amber-500/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* The Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {BRIEF_REGISTRY.map((brief) => (
            <Link 
              key={brief.id} 
              href={`/vault/briefs/${brief.id.toLowerCase()}`}
              className="group relative bg-[#060609] p-8 transition-all hover:bg-zinc-900/40 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="text-[9px] font-mono text-amber-500 font-bold tracking-widest">
                  {brief.id}
                </span>
                <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                  <Lock size={12} className="text-white/20 group-hover:text-amber-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">{brief.category}</h4>
                <h3 className="text-xl font-serif text-white group-hover:text-amber-100 transition-colors leading-snug italic">
                  {brief.title}
                </h3>
                <p className="text-[11px] text-white/20 line-clamp-2 leading-relaxed font-light italic">
                  {brief.abstract}
                </p>
              </div>

              <div className="mt-12 flex items-center justify-between pt-6 border-t border-white/5">
                <span className="text-[8px] font-mono text-white/20 tracking-tighter uppercase">{brief.date}</span>
                <span className="flex items-center gap-2 text-[8px] font-mono font-bold text-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                  View Dossier <Eye size={10} />
                </span>
              </div>
              
              {/* Institutional Scan Line Effect */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}