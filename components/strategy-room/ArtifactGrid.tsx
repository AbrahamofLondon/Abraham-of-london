/* components/strategy-room/ArtifactGrid.tsx — BRUTALIST PORTFOLIO GRID */
"use client";

import * as React from "react";
import { FileText, Lock, Eye, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ArtifactGrid({ hasAccess, artifacts = [] }: { hasAccess: boolean, artifacts?: any[] }) {
  if (!hasAccess) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-black p-12 flex flex-col items-center justify-center space-y-6 grayscale opacity-40 select-none">
            <Lock size={20} className="text-zinc-800" />
            <div className="text-center space-y-2">
              <div className="h-4 w-32 bg-zinc-900 mx-auto" />
              <div className="h-2 w-24 bg-zinc-950 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
      {artifacts.map((artifact) => (
        <Link 
          key={artifact.id} 
          href={`/strategy/${artifact.slug}`}
          className="group bg-black p-10 hover:bg-white/[0.02] transition-all duration-500 flex flex-col justify-between aspect-square"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono text-zinc-700 group-hover:text-primary transition-colors">
                REF_{artifact.slug.slice(0, 4).toUpperCase()}
              </span>
              <ArrowUpRight size={14} className="text-zinc-800 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="font-editorial text-3xl text-zinc-400 group-hover:text-white leading-tight tracking-tighter">
              {artifact.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 border-t border-white/5 pt-6">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              {artifact.category || "Strategic Asset"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}