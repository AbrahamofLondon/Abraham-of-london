"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
  Globe,
  Users,
  ShieldCheck,
  Layers,
} from "lucide-react";

type VentureStatus = "Active" | "In development" | "Scaling";

interface Venture {
  name: "Alomarada" | "Endureluxe" | "InnovateHub";
  description: string;
  href: string;
  status: VentureStatus;
  focus: string;
  tag: string;
}

const ventures: Venture[] = [
  {
    name: "Alomarada",
    tag: "Advisory",
    description: "Institutional strategy and market-entry architecture for growth corridors.",
    href: process.env.NEXT_PUBLIC_ALOMARADA_URL || "#",
    status: "Active",
    focus: "Governance • Strategy",
  },
  {
    name: "Endureluxe",
    tag: "Field Gear",
    description: "Performance essentials designed for high-responsibility life.",
    href: process.env.NEXT_PUBLIC_ENDURELUXE_URL || "#",
    status: "Scaling",
    focus: "Utility • Resilience",
  },
  {
    name: "InnovateHub",
    tag: "Builders Lab",
    description: "Practical support for founders turning ideas into durable products.",
    href: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "#",
    status: "In development",
    focus: "Venture Design • Execution",
  },
];

const ventureIcons = {
  Alomarada: Building2,
  Endureluxe: PackageCheck,
  InnovateHub: Lightbulb,
} as const;

export default function BalancedVentures(): React.ReactElement {
  return (
    <section className="relative py-16 bg-black border-y border-white/5">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        
        {/* Compact Header: Integrated, not overwhelming */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-amber-500/80">
              <Layers size={14} />
              <span>Practice & Portfolio</span>
            </div>
            <h2 className="font-serif text-3xl text-white tracking-tight italic">
              Venture <span className="text-white/40">Ecosystem</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-white/40 font-light italic border-l border-white/10 pl-6">
            Distinct arms operating under a unified doctrine of governance and execution.
          </p>
        </div>

        {/* Compressed Grid: Height reduction and tighter packing */}
        <div className="grid gap-4 md:grid-cols-3">
          {ventures.map((venture) => {
            const Icon = ventureIcons[venture.name];

            return (
              <Link
                key={venture.name}
                href={venture.href}
                className="group relative flex flex-col p-6 border border-white/10 bg-zinc-900/10 hover:border-amber-500/30 transition-all duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="p-3 border border-white/5 bg-white/5 group-hover:bg-amber-500/5 group-hover:border-amber-500/20 transition-colors">
                    <Icon className="h-5 w-5 text-white/60 group-hover:text-amber-500" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 border ${
                    venture.status === 'Active' ? 'border-emerald-500/20 text-emerald-500/70' : 
                    venture.status === 'Scaling' ? 'border-amber-500/20 text-amber-500/70' : 
                    'border-white/10 text-white/40'
                  }`}>
                    {venture.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-mono font-bold text-amber-500/50 uppercase tracking-[0.3em]">
                    {venture.tag}
                  </div>
                  <h3 className="font-serif text-xl text-white group-hover:text-amber-100 transition-colors italic">
                    {venture.name}
                  </h3>
                  <p className="text-[12px] text-white/40 line-clamp-2 leading-relaxed font-light">
                    {venture.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest pt-4 border-t border-white/5 text-white/20 group-hover:text-amber-500/60 transition-colors">
                  <span>{venture.focus}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Minimal Footer Action */}
        <div className="mt-10 flex justify-center">
            <Link 
              href="/ventures" 
              className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white/30 hover:text-white border-b border-white/10 pb-1 transition-all"
            >
              View Full Portfolio Portfolio Directory
            </Link>
        </div>
      </div>
    </section>
  );
}