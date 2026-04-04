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
  ChevronRight,
} from "lucide-react";

export default function VaultTeaserRail(): React.ReactElement {
  const items = [
    {
      icon: <Workflow className="h-4 w-4" />,
      title: "Operating Cadence",
      body: "Weekly rhythms, governance tempo, and meeting structures designed for disciplined execution.",
      tag: "OS-V1",
    },
    {
      icon: <Scale className="h-4 w-4" />,
      title: "Governance Artefacts",
      body: "Decision rights, accountability rails, and structural controls for serious leadership environments.",
      tag: "GOV-CORE",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Deployable Packs",
      body: "Institutional objects designed to move from page to operating environment without translation drama.",
      tag: "ASSET-09",
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-20">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-5">
            <div className="mb-8 flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">
                Secure Repository
              </span>
            </div>

            <h3 className="mb-8 font-serif text-5xl leading-none tracking-tight text-white">
              The work <br />
              <span className="italic text-white/20 not-italic">behind the words.</span>
            </h3>

            <p className="mb-10 max-w-sm border-l border-white/10 pl-6 text-sm font-light italic leading-relaxed text-white/40">
              A curated repository of high-signal institutional artefacts. These are not resources
              to be merely read. They are tools to be deployed.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/vault"
                className="group inline-flex items-center justify-center gap-4 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-amber-500"
              >
                <Lock className="h-3 w-3" />
                Open Vault
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center gap-4 border border-white/20 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:border-white hover:text-white"
              >
                Systems Preview
              </Link>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item, idx) => (
                <div
                  key={item.title}
                  className={`group relative border border-white/10 bg-zinc-900/20 p-8 transition-all duration-500 hover:border-amber-500/40 ${
                    idx === 2 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="mb-12 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-white/40 transition-all group-hover:border-amber-500/20 group-hover:text-amber-500">
                      {item.icon}
                    </div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/20">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="mb-2 text-lg font-serif italic text-white transition-colors group-hover:text-amber-100">
                    {item.title}
                  </h4>
                  <p className="text-[12px] font-light leading-relaxed text-white/40 transition-colors group-hover:text-white/60">
                    {item.body}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-[8px] font-mono font-bold uppercase tracking-widest text-white/10 transition-all group-hover:text-amber-500/40">
                    <span>Inspect Artefact</span>
                    <ChevronRight size={10} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border border-amber-500/10 bg-amber-500/[0.02] p-6">
              <div className="flex items-center gap-4">
                <Zap className="h-3 w-3 text-amber-500/50" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/30">
                  Standard Issue: Templates • Playbooks • Guides
                </span>
              </div>
              <div className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}