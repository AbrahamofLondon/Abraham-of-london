// components/homepage/StatsBar.tsx — PROOF STACK (Institutional)
// Goal: feels like audited evidence, not marketing fluff.

import * as React from "react";
import { Award, Building2, Globe2, BriefcaseBusiness, ShieldCheck, ChevronRight } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
  tag?: string;
};

export default function StatsBar(): React.ReactElement {
  const stats: Stat[] = [
    {
      label: "Operating track record",
      value: "14+ years",
      meta: "Strategy • operations • execution (since 2014)",
      icon: <Award className="h-5 w-5" />,
      tag: "proven",
    },
    {
      label: "UK-based strategy work",
      value: "10+ years",
      meta: "Market research • delivery • leadership (since 2016)",
      icon: <Building2 className="h-5 w-5" />,
      tag: "local",
    },
    {
      label: "Cross-region exposure",
      value: "Africa • EU • Americas",
      meta: "Partnerships • expansion • deal structuring",
      icon: <Globe2 className="h-5 w-5" />,
      tag: "global",
    },
    {
      label: "Institutional builds",
      value: "Alomarada + Endureluxe",
      meta: "Positioning • operating systems • governance",
      icon: <BriefcaseBusiness className="h-5 w-5" />,
      tag: "built",
    },
  ];

  return (
    <section className="relative bg-black border-t border-white/5">
      {/* restrained backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.14),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.42em] text-amber-200/90">
                Evidence Register
              </span>
            </div>

            <h2 className="mt-5 font-serif text-3xl md:text-4xl text-white/95 tracking-tight">
              Output, not noise.
            </h2>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-white/55 leading-relaxed">
              Not “thought leadership.” Operating history, geography, and institutional builds—cleanly stated.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
              Governance-ready
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
              Operator-led
            </span>
          </div>
        </div>

        {/* Proof cards */}
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-amber-500/25"
            >
              {/* top trace line */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-25 group-hover:opacity-80 transition-opacity"
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/15">
                  {s.icon}
                </div>

                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">
                  {s.tag || "verified"}
                </span>
              </div>

              <div className="mt-6 font-serif text-2xl text-white/95">{s.value}</div>
              <div className="mt-2 text-sm font-semibold text-white/85">{s.label}</div>
              <div className="mt-3 text-sm leading-relaxed text-white/55">{s.meta}</div>

              <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/35 group-hover:text-amber-200/70 transition-colors">
                indexed <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>

        {/* baseline */}
        <div className="mt-12 h-px w-40 bg-gradient-to-r from-amber-500/40 to-transparent" />
      </div>
    </section>
  );
}