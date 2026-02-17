"use client";

import * as React from "react";
import { Award, Building2, Globe2, BriefcaseBusiness } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
};

export default function StatsBar(): React.ReactElement {
  const stats: Stat[] = [
    {
      label: "Operating track record",
      value: "14+ years",
      meta: "Strategy • operations • execution (since 2014)",
      icon: <Award className="h-5 w-5" />,
    },
    {
      label: "UK-based strategy work",
      value: "10+ years",
      meta: "Market research • delivery • leadership (since 2016)",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: "Cross-region exposure",
      value: "Africa • EU • Americas",
      meta: "Partnerships • expansion • deal structuring",
      icon: <Globe2 className="h-5 w-5" />,
    },
    {
      label: "Brand & institutional builds",
      value: "EndureLuxe + Alomarada",
      meta: "Positioning • growth systems • governance",
      icon: <BriefcaseBusiness className="h-5 w-5" />,
    },
  ];

  return (
    <section className="relative bg-black border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300/80">
              Evidence
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              Output, not noise.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/75">
              Partner-led
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/75">
              Governance-ready
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  {s.icon}
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-amber-200">
                  substantiated
                </span>
              </div>

              <div className="mt-6 font-serif text-2xl text-amber-100">{s.value}</div>
              <div className="mt-2 text-sm font-semibold text-white/90">{s.label}</div>
              <div className="mt-3 text-sm font-light leading-relaxed text-white/55">{s.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}