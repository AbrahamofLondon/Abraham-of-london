/* components/homepage/EngagementLanes.tsx — Route-normalized, production-safe */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Globe, Lock, BookOpen, Landmark } from "lucide-react";

type Lane = {
  key: "media" | "education" | "private" | "institutional";
  title: string;
  subtitle: string;
  href: string;
  description: string;
  icon: React.ElementType;
};

const LANES: Lane[] = [
  {
    key: "media",
    title: "Media",
    subtitle: "PUBLIC SIGNAL",
    href: "/media",
    icon: Globe,
    description:
      "Commentary, interviews, and public-facing narrative built for clarity under scrutiny.",
  },
  {
    key: "education",
    title: "Education",
    subtitle: "FORMATION & RESEARCH",
    href: "/education-research",
    icon: BookOpen,
    description:
      "Structured learning, disciplined inquiry, and research-led intellectual formation.",
  },
  {
    key: "private",
    title: "Private",
    subtitle: "SELECT MANDATES",
    href: "/private-clients",
    icon: Lock,
    description:
      "Confidential advisory for principals, founders, and private strategic work.",
  },
  {
    key: "institutional",
    title: "Institutional",
    subtitle: "GOVERNANCE & POLICY",
    href: "/institutional",
    icon: Landmark,
    description:
      "Institution design, governance architecture, and organisational advisory.",
  },
];

export default function EngagementLanes({
  compact = true,
}: {
  compact?: boolean;
}) {
  return (
    <section className="w-full bg-black text-white">
      <div className={compact ? "p-1" : "mx-auto max-w-7xl px-6 py-20"}>
        <div className="mb-12 flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.36em] text-amber-500">
              Engagement
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-white md:text-5xl">
              Modes of access
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-zinc-300">
              Different mandates require different operating environments. Choose
              the lane that matches the work.
            </p>
          </div>

          <div className="text-right">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              Four active lanes
            </div>
            <div className="flex justify-end gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={`lane-indicator-${i}`}
                  className="h-1 w-6 overflow-hidden rounded-full bg-amber-500/20"
                >
                  <div className="h-full w-full bg-amber-500/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {LANES.map((lane, index) => {
            const Icon = lane.icon;

            return (
              <Link
                key={lane.key}
                href={lane.href}
                className="group relative flex min-h-[320px] flex-col bg-black p-8 transition-all duration-500 hover:bg-zinc-950"
              >
                <div className="mb-12 flex items-start justify-between">
                  <div className="border border-white/5 bg-white/[0.02] p-3 transition-colors group-hover:border-amber-500/30">
                    <Icon className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-amber-500" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-zinc-800 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-amber-500" />
                </div>

                <div className="mt-auto">
                  <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-amber-500/60">
                    {lane.subtitle}
                  </span>

                  <h3 className="font-serif text-3xl text-white transition-colors group-hover:text-amber-50">
                    {lane.title}
                  </h3>

                  <div className="my-6 h-px w-8 bg-zinc-800 transition-all duration-700 group-hover:w-full group-hover:bg-amber-500/30" />

                  <p className="text-[13px] font-light leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-300">
                    {lane.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">
                    Open lane
                  </span>
                  <span className="font-mono text-[9px] text-zinc-700">
                    P-0{index + 1}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}