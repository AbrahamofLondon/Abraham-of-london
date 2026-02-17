/* components/homepage/ServiceLines.tsx */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Layers, Vault, ChevronRight } from "lucide-react";

type ServiceItem = {
  title: string;
  body: string;
  href: string;
  badge: string;
  phase: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: readonly ServiceItem[] = [
  {
    Icon: Briefcase,
    title: "Advisory",
    body: "Institutional-grade strategy for founders and leadership teams. Governance, operating logic, decision rights.",
    href: "/consulting",
    badge: "Engage",
    phase: "Phase 01",
  },
  {
    Icon: Layers,
    title: "The Canon",
    body: "Foundational architecture: purpose, doctrine, governance, civilisation, and legacy — built to survive scrutiny.",
    href: "/canon",
    badge: "Explore",
    phase: "Phase 02",
  },
  {
    Icon: Vault,
    title: "The Vault",
    body: "Deployable assets: templates, operator packs, and implementation tools — built for execution under pressure.",
    href: "/downloads/vault",
    badge: "Access",
    phase: "Phase 03",
  },
] as const;

export default function ServiceLines(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-black py-20 lg:py-28">
      {/* Background Architecture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-[0.10]" />
        <div className="absolute left-1/2 top-[-260px] h-[740px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[180px]" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              Core Service Lines
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-white/15" />
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
              system-index
            </span>
          </div>

          <h2 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.05]">
            Strategy, Doctrine, Deployables.
          </h2>

          <p className="mt-5 max-w-2xl text-white/40 text-base md:text-lg font-light leading-relaxed">
            A single operating continuum: <span className="text-white/75">advice</span> you can defend,{" "}
            <span className="text-white/75">architecture</span> you can teach, and{" "}
            <span className="text-white/75">artifacts</span> you can deploy.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {ITEMS.map((x) => (
            <Link key={x.title} href={x.href} className="group block h-full">
              <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:border-amber-500/20 hover:-translate-y-1">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                    <x.Icon className="h-5 w-5 text-amber-300" />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/55">
                      {x.badge}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
                      {x.phase}
                    </span>
                  </div>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-medium text-white transition-colors group-hover:text-amber-50">
                  {x.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white/50 transition-colors group-hover:text-white/70">
                  {x.body}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-500/80">
                    Open
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-colors group-hover:border-amber-500/40">
                    <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:text-amber-400 group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Corner Accent */}
                <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="w-8 h-[1px] bg-amber-500/30" />
                  <div className="absolute right-4 top-4 h-8 w-[1px] bg-amber-500/30" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer tick */}
        <div className="mt-14 flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
            System Verification: Active
          </p>
        </div>
      </div>
    </section>
  );
}