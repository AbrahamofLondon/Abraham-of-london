"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
  ShieldCheck,
  Globe,
  Users,
  Layers,
} from "lucide-react";

type VentureStatus = "Active" | "In development" | "Scaling";

interface Venture {
  name: "Alomarada" | "Endureluxe" | "InnovateHub";
  description: string;
  href: string;
  status: VentureStatus;
  focus: string;
  launched?: string;
  tag: string;
}

const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com/";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://alomarada.com/endureluxe";
const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "https://innovatehub.abrahamoflondon.org";

const ventures: Venture[] = [
  {
    name: "Alomarada",
    tag: "Advisory",
    description:
      "Institutional strategy, operating systems, and market-entry architecture—built for founders and institutions across Africa and growth corridors.",
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategy · Governance · Deal architecture",
    launched: "2018",
  },
  {
    name: "Endureluxe",
    tag: "Field Gear",
    description:
      "Performance essentials designed for real life—where training, work, and responsibility share the same calendar.",
    href: ENDURELUXE_URL,
    status: "Scaling",
    focus: "Community · Durability · Performance",
    launched: "2024",
  },
  {
    name: "InnovateHub",
    tag: "Builders Lab",
    description:
      "Playbooks, sprints, and practical support for founders turning ideas into products that hold under pressure.",
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Venture design · Capability building · Execution cadence",
    launched: "2025",
  },
];

const ventureIcons = {
  Alomarada: Building2,
  Endureluxe: PackageCheck,
  InnovateHub: Lightbulb,
} as const;

function StatusPill({ status }: { status: VentureStatus }) {
  const tone =
    status === "Active"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : status === "Scaling"
        ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
        : "border-white/15 bg-white/5 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${tone}`}>
      {status}
    </span>
  );
}

function MicroStat({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/10">
        <Icon className="h-5 w-5 text-amber-200/80" />
      </div>
      <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35">{label}</div>
      <div className="mt-1 text-[12px] font-semibold text-white/70">{value}</div>
    </div>
  );
}

export default function VenturesSection(): React.ReactElement {
  return (
    <div className="relative">
      {/* Controlled, institutional backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.55),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2">
            <Layers className="h-4 w-4 text-amber-200" />
            <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-100/90">
              Ventures & Practice
            </span>
          </div>

          <h2 className="mb-5 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl [text-wrap:balance]">
            A portfolio designed for{" "}
            <span className="bg-gradient-to-r from-amber-100 to-amber-200 bg-clip-text text-transparent">
              builders
            </span>
            .
          </h2>

          <p className="mx-auto max-w-3xl text-[15px] sm:text-[17px] leading-relaxed text-white/55">
            These ventures serve different audiences without losing the thread: governance, discipline, and execution.
            Each one is a distinct arm — but the same operating doctrine.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-3xl mx-auto">
            <MicroStat Icon={Globe} label="Markets" value="Africa & growth corridors" />
            <MicroStat Icon={Users} label="Communities" value="Builders, men, fathers" />
            <MicroStat Icon={ShieldCheck} label="Standard" value="Institutional grade" />
          </div>
        </div>

        {/* Ventures Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {ventures.map((venture) => {
            const IconComponent = ventureIcons[venture.name];

            return (
              <article
                key={venture.name}
                className="group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/20 hover:bg-white/[0.04]"
              >
                {/* Corner accents */}
                <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="w-8 h-[1px] bg-amber-500/30" />
                  <div className="absolute right-4 top-4 h-8 w-[1px] bg-amber-500/30" />
                </div>

                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <IconComponent className="h-7 w-7 text-amber-200/85 group-hover:text-amber-100 transition-colors" />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={venture.status} />
                    {venture.launched ? (
                      <span className="text-[11px] text-white/30">Since {venture.launched}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-serif text-2xl font-semibold text-white/95">{venture.name}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                      {venture.tag}
                    </span>
                  </div>

                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">
                    {venture.focus}
                  </p>

                  <p className="text-sm leading-relaxed text-white/55 group-hover:text-white/70 transition-colors">
                    {venture.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    <ShieldCheck className="h-4 w-4 text-white/25" />
                    Portfolio link
                  </div>

                  <Link
                    href={venture.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-amber-200 transition-all hover:bg-amber-500/10 hover:border-amber-500/35"
                  >
                    Visit
                    <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover/link:text-amber-200 group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <h3 className="mb-3 font-serif text-2xl font-semibold text-white/90">
            Partnerships, programmes, and practical work.
          </h3>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/55">
            Where alignment matters, the next step should be obvious: venture partnership, programme, or advisory.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/ventures"
              className="group inline-flex items-center gap-2 rounded-full border border-amber-400/45 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-8 py-4 text-sm font-semibold text-amber-100 transition-all hover:from-amber-500/18 hover:to-amber-600/10"
            >
              <Users className="h-4 w-4" />
              Venture partnerships
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/consulting/strategy-room"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white/85 transition-all hover:bg-white/8 hover:text-white"
            >
              <Building2 className="h-4 w-4" />
              Strategic advisory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}