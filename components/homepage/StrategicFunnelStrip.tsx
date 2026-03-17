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
      "Board-level architecture for founders. We build the operating logic required to survive growth and pressure.",
    Icon: Briefcase,
    pillar: { icon: Wrench, name: "Tools", phase: "01" },
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Asymmetric Intelligence",
    description:
      "Private, off-record sessions under strict protocol. A space for sharpening judgment away from the public eye.",
    Icon: Users,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "02" },
  },
  {
    href: "/events",
    label: "Executive Salons",
    kicker: "Public Discourse",
    description:
      "High-signal environments blending Scripture and market reality. Strategy sessions for the serious operator.",
    Icon: CalendarDays,
    pillar: { icon: ShieldCheck, name: "Rooms", phase: "03" },
  },
] as const;

export default function StrategicFunnelStrip(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-black py-16 lg:py-20">
      {/* Background Architecture — Reduced blurs, sharper grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header — 80% Scale with increased letter-spacing */}
        <div className="mb-12 flex flex-col items-start text-left border-l border-amber-500/30 pl-6">
          <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-amber-500/60">
            System Sequence
          </span>

          <h2 className="mt-4 font-serif text-3xl md:text-4xl text-white tracking-tight leading-none italic">
            Doctrine <ChevronRight className="inline h-5 w-5 text-white/10" /> Logic{" "}
            <ChevronRight className="inline h-5 w-5 text-white/10" /> Artifacts
          </h2>

          <p className="mt-4 max-w-xl text-white/30 text-sm font-light leading-relaxed">
            From the architecture of the <span className="text-white/60">Canon</span> to reproducible{" "}
            <span className="text-white/60">Tools</span>, proven in the{" "}
            <span className="text-white/60">Rooms</span>.
          </p>
        </div>

        {/* Cards — Hard edges, metadata focus */}
        <div className="grid gap-px bg-white/5 border border-white/5 md:grid-cols-3">
          {CARDS.map((card, index) => (
            <Link key={card.href} href={card.href} className="group block bg-black h-full">
              <div className="relative h-full p-8 transition-colors duration-700 hover:bg-white/[0.03]">
                {/* Metadata Row */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] w-4 bg-amber-500/40" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 group-hover:text-amber-500/80 transition-colors">
                      P-{card.pillar.phase} // {card.pillar.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-700">0{index + 1}</span>
                </div>

                <div className="mb-6">
                  <h3 className="font-serif text-xl text-white italic transition-all group-hover:text-amber-50">
                    {card.label}
                  </h3>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-amber-600/70">
                    {card.kicker}
                  </p>
                </div>

                <p className="mb-10 text-[13px] leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-300">
                  {card.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/[0.03]">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-white transition-colors">
                    Initialize Protocol
                  </span>
                  <ArrowRight className="h-3 w-3 text-zinc-700 transition-all group-hover:text-amber-500 group-hover:translate-x-1" />
                </div>

                {/* Corner Accent — Sharp & Subtle */}
                <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-transparent group-hover:border-amber-500/20 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer — Minimalist verification */}
        <div className="mt-12 flex items-center gap-4">
          <div className="h-px w-8 bg-amber-500/30" />
          <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-zinc-700">
            Auth.State: Verified_Operational
          </p>
        </div>
      </div>
    </section>
  );
}