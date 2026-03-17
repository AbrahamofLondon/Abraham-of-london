"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Lock, 
  FileText, 
  Workflow, 
  Scale, 
  Zap,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function VaultTeaserRail(): React.ReactElement {
  const items = [
    { 
      icon: <Workflow className="h-4 w-4" />, 
      title: "Operating Cadence", 
      body: "Weekly rhythms and meeting packs for rapid execution.",
      tag: "OS-V1"
    },
    { 
      icon: <Scale className="h-4 w-4" />, 
      title: "Governance Artefacts", 
      body: "Decision rights and accountability rails for high-stakes leadership.",
      tag: "GOV-CORE"
    },
    { 
      icon: <FileText className="h-4 w-4" />, 
      title: "Deployable Packs", 
      body: "Institutional objects ready for immediate environment integration.",
      tag: "ASSET-09"
    },
  ];

  return (
    <section className="relative bg-black py-20 overflow-hidden border-t border-white/10">
      {/* Background: Minimal technical grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          
          {/* Left: System Control / Narrative */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">
                Secure Repository
              </span>
            </div>

            <h3 className="font-serif text-5xl text-white leading-none tracking-tight italic mb-8">
              The work <br />
              <span className="text-white/20 not-italic">behind the words.</span>
            </h3>

            <p className="text-sm font-light leading-relaxed text-white/40 max-w-sm italic mb-10 border-l border-white/10 pl-6">
              A curated repository of high-signal institutional artefacts. These are not resources to be "read"—they are tools to be <span className="text-white/80">deployed</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/downloads/vault"
                className="group inline-flex items-center justify-center gap-4 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-amber-500 transition-all"
              >
                <Lock className="h-3 w-3" />
                Open Vault
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center gap-4 border border-white/20 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white transition-all"
              >
                Systems Preview
              </Link>
            </div>
          </div>

          {/* Right: Asset Ledger */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item, idx) => (
                <div
                  key={item.title}
                  className={`relative p-8 border border-white/10 bg-zinc-900/20 group hover:border-amber-500/40 transition-all duration-500 ${
                    idx === 2 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-12">
                    <div className="h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 text-white/40 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all">
                      {item.icon}
                    </div>
                    <span className="font-mono text-[9px] font-bold text-white/20 tracking-widest uppercase">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="text-lg font-serif italic text-white mb-2 group-hover:text-amber-100 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[12px] font-light leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
                    {item.body}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-[8px] font-mono font-bold uppercase tracking-widest text-white/10 group-hover:text-amber-500/40 transition-all">
                    <span>Inspect Artefact</span>
                    <ChevronRight size={10} />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Status Line */}
            <div className="p-6 border border-amber-500/10 bg-amber-500/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Zap className="h-3 w-3 text-amber-500/50" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/30">
                  Standard Issue: Templates • Playbooks • Guides
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}