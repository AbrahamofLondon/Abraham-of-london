/* components/homepage/StrategicFunnelStrip.tsx */
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Users,
  Wrench,
  ShieldCheck,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

type CardItem = {
  href: string;
  label: string;
  kicker: string;
  description: string;
  Icon: LucideIcon;
  pillar: { icon: LucideIcon; name: string; phase: string };
};

const CARDS: readonly CardItem[] = [
  {
    href: "/consulting",
    label: "Advisory & Strategy",
    kicker: "Direct Implementation",
    description:
      "Board-level architecture for founders. We don't just advise; we build the operating logic required to survive growth and pressure.",
    Icon: Briefcase,
    pillar: { icon: Wrench, name: "Tools", phase: "Phase 01" },
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Asymmetric Intelligence",
    description:
      "Private, off-record sessions under strict protocol. A dedicated space for sharpening judgment away from the public eye.",
    Icon: Users,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "Phase 02" },
  },
  {
    href: "/events",
    label: "Executive Salons",
    kicker: "Public Discourse",
    description:
      "High-signal environments blending Scripture, history, and market reality. Strategy sessions for the serious operator.",
    Icon: CalendarDays,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "Phase 03" },
  },
] as const;

export default function StrategicFunnelStrip(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* Background Architecture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-[0.10]" />
        <div className="absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[180px]" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60">
            The Operational Funnel
          </span>

          <h2 className="mt-7 font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-none">
            Doctrine <ChevronRight className="inline h-8 w-8 text-white/10" />
            Logic <ChevronRight className="inline h-8 w-8 text-white/10" />
            Artifacts
          </h2>

          <p className="mt-7 max-w-2xl text-white/40 text-lg font-light leading-relaxed">
            From the deep architecture of the <span className="text-white/80">Canon</span> to reproducible{" "}
            <span className="text-white/80">Tools</span>, finally proven in the{" "}
            <span className="text-white/80">Rooms</span>.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {CARDS.map((card, index) => (
            <Link key={card.href} href={card.href} className="group block h-full">
              <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:border-amber-500/20 hover:-translate-y-1">
                {/* Phase line */}
                <div className="mb-10 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors group-hover:text-amber-500/60">
                    {card.pillar.phase} // {card.pillar.name} // 0{index + 1}
                  </span>
                </div>

                <div className="mb-6">
                  <card.Icon className="mb-4 h-6 w-6 text-white/40 transition-colors duration-500 group-hover:text-amber-400" />
                  <h3 className="font-serif text-2xl font-medium text-white transition-all group-hover:text-amber-50">
                    {card.label}
                  </h3>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-amber-500/60">
                    {card.kicker}
                  </p>
                </div>

                <p className="mb-8 flex-1 text-sm leading-relaxed text-white/45 transition-colors group-hover:text-white/65">
                  {card.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-500/80">
                    Explore Asset
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
        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
            System Verification: Operational
          </p>
        </div>
      </div>
    </section>
  );
}