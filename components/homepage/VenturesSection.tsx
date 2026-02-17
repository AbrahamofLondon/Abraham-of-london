/* components/homepage/VenturesSection.tsx */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
  Globe,
  ShieldCheck,
  Users,
  ChevronRight,
  Layers,
} from "lucide-react";

type Accent = "emerald" | "blue" | "amber";

interface Venture {
  name: "Alomarada" | "Endureluxe" | "InnovateHub";
  description: string;
  href: string;
  status: "Active" | "In development" | "Scaling";
  focus: string;
  accentColor: Accent;
  launched?: string;
  ref?: string;
}

const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com/";
const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://alomarada.com/endureluxe";
const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "https://innovatehub.abrahamoflondon.org";

const ventures: readonly Venture[] = [
  {
    name: "Alomarada",
    description:
      "Advisory, operating systems, and market-entry architecture—built for founders and institutions across Africa and growth markets.",
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategy · Governance · Deal Architecture",
    accentColor: "emerald",
    launched: "2018",
    ref: "AOL-HLD-ALM",
  },
  {
    name: "Endureluxe",
    description:
      "Performance essentials designed for real life—where training, work, and responsibility share the same calendar.",
    href: ENDURELUXE_URL,
    status: "Scaling",
    focus: "Community · Performance Gear · Durability",
    accentColor: "blue",
    launched: "2024",
    ref: "AOL-HLD-END",
  },
  {
    name: "InnovateHub",
    description:
      "A builder’s workshop: playbooks, sprints, and support for founders turning ideas into products that hold under pressure.",
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Venture Design · Capability · Execution Cadence",
    accentColor: "amber",
    launched: "2025",
    ref: "AOL-HLD-INH",
  },
] as const;

const ventureIcons = {
  Alomarada: Building2,
  Endureluxe: PackageCheck,
  InnovateHub: Lightbulb,
} as const;

const accent: Record<
  Accent,
  {
    pill: string;
    ring: string;
    icon: string;
    edge: string;
    link: string;
    glow: string;
  }
> = {
  emerald: {
    pill: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    ring: "group-hover:border-emerald-400/25",
    icon: "text-emerald-300",
    edge: "bg-emerald-500/20",
    link: "text-emerald-200",
    glow: "bg-emerald-500/10",
  },
  blue: {
    pill: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    ring: "group-hover:border-blue-400/25",
    icon: "text-blue-300",
    edge: "bg-blue-500/20",
    link: "text-blue-200",
    glow: "bg-blue-500/10",
  },
  amber: {
    pill: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    ring: "group-hover:border-amber-400/25",
    icon: "text-amber-300",
    edge: "bg-amber-500/20",
    link: "text-amber-200",
    glow: "bg-amber-500/10",
  },
};

function StatusPill({ status, tone }: { status: Venture["status"]; tone: Accent }) {
  const c = accent[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${c.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.edge}`} />
      {status}
    </span>
  );
}

function MicroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
        <Icon className="h-5 w-5 text-amber-200/80" />
      </div>
      <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35">{label}</div>
      <div className="mt-1 text-[12px] font-semibold text-white/70">{value}</div>
    </div>
  );
}

export default function VenturesSection(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* AOL Background Architecture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-[0.10]" />
        <div className="absolute left-1/2 top-[-280px] h-[760px] w-[1040px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[190px]" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header (Institutional Portfolio tone) */}
        <div className="mb-14 md:mb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1">
              <Layers className="h-3.5 w-3.5 text-amber-500/70" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
                Portfolio Registry
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-white/15" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
                ventures-core
              </span>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">
              holdings // practice // execution
            </div>
          </div>

          <h2 className="mt-7 font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.05]">
            A portfolio built to{" "}
            <span className="text-amber-200/90">carry weight</span>.
          </h2>

          <p className="mt-6 max-w-3xl text-white/40 text-base md:text-lg font-light leading-relaxed">
            These ventures are not side-projects. They are execution theatres — different audiences, same doctrine:
            governance, cadence, clarity. If it doesn’t survive real responsibility, it doesn’t ship.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-3xl">
            <MicroStat icon={Globe} label="Markets" value="Africa & growth corridors" />
            <MicroStat icon={Users} label="Communities" value="Builders, teams, households" />
            <MicroStat icon={ShieldCheck} label="Protocol" value="Governance, controls, cadence" />
          </div>
        </div>

        {/* Ventures Grid (AOL cards + controlled accents) */}
        <div className="grid gap-4 md:grid-cols-3">
          {ventures.map((v, idx) => {
            const Icon = ventureIcons[v.name];
            const c = accent[v.accentColor];

            return (
              <article
                key={v.name}
                className={`group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-1 ${c.ring}`}
              >
                {/* Controlled edge accent: thin bar + corner tick */}
                <div aria-hidden className="pointer-events-none absolute left-0 top-10 h-24 w-[2px] rounded-full opacity-60">
                  <div className={`h-full w-full ${c.edge}`} />
                </div>

                <div aria-hidden className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className={`w-8 h-[1px] ${c.edge}`} />
                  <div className={`absolute right-4 top-4 h-8 w-[1px] ${c.edge}`} />
                </div>

                <div aria-hidden className="pointer-events-none absolute -top-2 -right-2 h-4 w-4 rounded-full blur-sm opacity-70">
                  <div className={`h-full w-full rounded-full ${c.glow}`} />
                </div>

                {/* Top row: phase + status */}
                <div className="mb-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-amber-500/60 transition-colors">
                      Phase 0{idx + 1} // Holding
                    </span>
                  </div>
                  <StatusPill status={v.status} tone={v.accentColor} />
                </div>

                {/* Icon + identity */}
                <div className="mb-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                    <Icon className={`h-6 w-6 ${c.icon} transition-colors`} />
                  </div>

                  <h3 className="mt-5 font-serif text-2xl font-medium text-white transition-colors group-hover:text-amber-50">
                    {v.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/30">
                      Ref: {v.ref ?? "AOL-HLD-CORE"}
                    </span>
                    {v.launched ? (
                      <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/25">
                        Since {v.launched}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Focus + body */}
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-500/60">
                    {v.focus}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-white/45 group-hover:text-white/65 transition-colors">
                    {v.description}
                  </p>
                </div>

                {/* Footer action */}
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/35">
                    External Link
                  </span>

                  <Link
                    href={v.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group/link inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-xs font-black uppercase tracking-widest ${c.link} hover:border-amber-500/25 hover:bg-white/[0.04] transition-all`}
                  >
                    Visit
                    <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover/link:text-amber-400 group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer CTA (still on-brand, no “salesy sparkle”) */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-2xl">
            <h3 className="font-serif text-2xl md:text-3xl font-medium text-white">
              Partnerships, programmes, practical work.
            </h3>
            <p className="mt-4 text-sm md:text-base leading-relaxed text-white/45">
              Where alignment matters, the next step should be obvious: venture partnership, programme engagement, or
              advisory for leadership teams under pressure.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/ventures"
              className="group inline-flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
            >
              Portfolio overview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/consulting/strategy-room"
              className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              Strategy room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
              System Verification: Portfolio Indexed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}