"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ScrollText, 
  Shield, 
  Terminal,
  Fingerprint,
  FileSearch
} from "lucide-react";

type BriefLine = {
  id: string;
  title: string;
  body: string;
};

export default function OperatorBriefing() {
  const lines: BriefLine[] = [
    {
      id: "STRAT-01",
      title: "Scrutiny-Ready Architecture.",
      body: "If a strategy cannot survive a hostile cross-examination, it isn't a plan—it's theatre. We build for the audit, not the applause.",
    },
    {
      id: "OPS-04",
      title: "The Engine of Cadence.",
      body: "Institutional performance isn't a spark; it's a rhythm. We install the routines and decision rights that make excellence a default habit.",
    },
    {
      id: "ETHIC-09",
      title: "Load-Bearing Integrity.",
      body: "Character isn't a marketing claim. It is found in the pressure-testing of controls, incentives, and accountability loops.",
    },
  ];

  return (
    <section className="relative bg-black py-24 lg:py-32 overflow-hidden">
      {/* Background: Digital Topography */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/assets/images/grid.svg')] bg-[size:40px_40px]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          
          {/* Left: The "Official" Posture */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-md border border-white/10 bg-white/5">
              <Terminal className="h-3 w-3 text-amber-500/70" />
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">
                Briefing ID: AOL-2026-X
              </span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.05] tracking-tight">
              A memorandum <br />
              <span className="italic text-amber-200/80">for the Serious.</span>
            </h2>

            <p className="mt-8 text-lg font-light leading-relaxed text-white/40 max-w-md">
              This isn't content to be consumed. It is doctrine to be deployed. 
              We operate where scripture, history, and market reality intersect.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/resources/strategic-frameworks"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-sm font-black text-black hover:bg-amber-400 transition-all"
              >
                View Frameworks
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/canon"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                <ScrollText className="h-4 w-4 text-amber-400" />
                The Canon
              </Link>
            </div>
          </div>

          {/* Right: The Declassified Interface */}
          <div className="lg:col-span-7">
            <div className="relative group">
              {/* Outer Decorative Border */}
              <div className="absolute -inset-4 border border-white/[0.03] rounded-[40px] pointer-events-none" />
              
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-1">
                <div className="bg-black/90 rounded-[22px] p-8 md:p-10 backdrop-blur-md">
                  
                  {/* Header: Document Metadata */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Fingerprint className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                          Governance Extract
                        </h3>
                        <p className="text-[10px] font-mono text-white/30 uppercase mt-1">
                          Ref: AOL-SYS-CORE // Verified
                        </p>
                      </div>
                    </div>
                    
                    <div className="px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">
                        Institutional Grade
                      </span>
                    </div>
                  </div>

                  {/* Body: The Lines */}
                  <div className="space-y-4">
                    {lines.map((line) => (
                      <div 
                        key={line.id} 
                        className="group/line relative p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300"
                      >
                        <div className="flex items-start gap-5">
                          <span className="mt-1 font-mono text-[10px] text-amber-500/40 group-hover/line:text-amber-500 transition-colors">
                            {line.id}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-white mb-2 tracking-wide">
                              {line.title}
                            </h4>
                            <p className="text-sm font-light leading-relaxed text-white/50 group-hover/line:text-white/70 transition-colors">
                              {line.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: Secure Access Call-to-Action */}
                  <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <FileSearch className="h-5 w-5 text-white/20" />
                      <p className="text-xs text-white/40 max-w-[240px]">
                        Access the full repository of templates and artifacts.
                      </p>
                    </div>
                    
                    <Link
                      href="/downloads/vault"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Access Vault
                    </Link>
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