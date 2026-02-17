"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Lock, 
  FileText, 
  Workflow, 
  Scale, 
  Binary, 
  Zap 
} from "lucide-react";

export default function VaultTeaserRail(): React.ReactElement {
  const items = [
    { 
      icon: <Workflow className="h-5 w-5" />, 
      title: "Operating Cadence", 
      body: "Weekly rhythms and meeting packs for rapid execution.",
      tag: "OS-V1"
    },
    { 
      icon: <Scale className="h-5 w-5" />, 
      title: "Governance Artefacts", 
      body: "Decision rights and accountability rails for high-stakes leadership.",
      tag: "GOV-CORE"
    },
    { 
      icon: <FileText className="h-5 w-5" />, 
      title: "Deployable Packs", 
      body: "Institutional objects ready for immediate environment integration.",
      tag: "ASSET-09"
    },
  ];

  return (
    <section className="relative bg-black py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-amber-500/[0.03] blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/assets/images/dots.svg')] opacity-5" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-8 bg-amber-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">
                Authorized Access Only
              </span>
            </div>

            <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight">
              The work <br />
              <span className="text-white/40 italic">behind the words.</span>
            </h3>

            <p className="mt-8 text-lg font-light leading-relaxed text-white/40 max-w-md">
              A curated repository of high-signal institutional artefacts. These are not resources to be "read"—they are tools to be <span className="text-white">deployed</span>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/downloads/vault"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-amber-500 px-8 py-4 text-sm font-black text-black transition-all hover:bg-amber-400"
              >
                <Lock className="h-4 w-4" />
                Open the Vault
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                Preview Systems
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="absolute -inset-6 border border-white/[0.03] pointer-events-none rounded-[40px]" />
            
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((x, idx) => (
                <motion.div
                  key={x.title}
                  whileHover={{ y: -5 }}
                  className={`relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group ${
                    idx === 2 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-12">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                      {x.icon}
                    </div>
                    <span className="font-mono text-[9px] text-white/20 tracking-tighter uppercase">
                      {x.tag}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 tracking-wide group-hover:text-amber-100 transition-colors">
                    {x.title}
                  </h4>
                  <p className="text-sm font-light leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
                    {x.body}
                  </p>

                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-500/40 transition-all duration-500 group-hover:w-full" />
                </motion.div>
              ))}

              <div className="sm:col-span-2 mt-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-500/20 items-center justify-center">
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                      Standard Issue Performance
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 uppercase font-mono">
                      Pack contents: Templates • Playbooks • Playlists • Guides
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}