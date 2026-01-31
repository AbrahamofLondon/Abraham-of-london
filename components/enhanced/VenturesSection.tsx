"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Cpu,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

type Status = "live" | "development" | "incubation";

type Venture = {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: Status;
  href: string;
  tags: string[];
  proof: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const statusUI: Record<Status, { label: string; cls: string; dot: string }> = {
  live: {
    label: "Live",
    cls: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  development: {
    label: "In build",
    cls: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  incubation: {
    label: "Incubation",
    cls: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    dot: "bg-blue-400",
  },
};

export const EnhancedVenturesSection: React.FC = () => {
  const ventures: Venture[] = [
    {
      title: "Institutional Advisory",
      description: "Governance-grade strategy for serious operators: mandate, decision rights, cadence, and assets.",
      icon: <Building2 className="h-6 w-6" />,
      status: "live",
      href: "/consulting",
      tags: ["Governance", "Decision Rights", "Execution Cadence"],
      proof: "Owner maps + board-ready packs",
    },
    {
      title: "Founder OS",
      description: "Operating systems for founders building institutions, not just companies — discipline as a product.",
      icon: <Cpu className="h-6 w-6" />,
      status: "development",
      href: "/ventures/founder-os",
      tags: ["Systems", "Routines", "Compounding"],
      proof: "Cadence modules + templates",
    },
    {
      title: "Household Architecture",
      description: "Blueprints for multi-generational family systems: standards, legacy design, and durable leadership.",
      icon: <Shield className="h-6 w-6" />,
      status: "live",
      href: "/ventures/household-architecture",
      tags: ["Legacy", "Formation", "Family Governance"],
      proof: "Constitutional patterns for households",
    },
    {
      title: "Public Strategy",
      description: "Institutional positioning and narrative architecture that holds under pressure and scrutiny.",
      icon: <Globe className="h-6 w-6" />,
      status: "incubation",
      href: "/ventures/public-strategy",
      tags: ["Positioning", "Narrative", "Public Trust"],
      proof: "Signal engineering + credibility rails",
    },
  ];

  return (
    <section className="relative bg-black py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,158,11,0.08),transparent_55%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
              Portfolio proof
            </p>
            <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
              Ventures built like institutions.
            </h2>
            <p className="mt-6 max-w-3xl text-xl font-light text-gray-300">
              This is where principles become operating reality — standards, cadence, controls, and
              deployable artefacts.
            </p>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <Link
              href="/ventures"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200 transition-all duration-300 hover:border-amber-400/25 hover:bg-white/10"
            >
              View all ventures <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Portfolio grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {ventures.map((v) => {
            const ui = statusUI[v.status];
            return (
              <Link
                key={v.title}
                href={v.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-amber-500/10"
              >
                {/* top rail */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    {v.icon}
                  </div>

                  <div className={cx("inline-flex items-center gap-2 rounded-full border px-4 py-2", ui.cls)}>
                    <span className={cx("h-2 w-2 rounded-full", ui.dot)} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.35em]">
                      {ui.label}
                    </span>
                  </div>
                </div>

                <h3 className="mt-8 font-serif text-3xl font-semibold text-amber-100">
                  {v.title}
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-gray-300">
                  {v.description}
                </p>

                {/* tags */}
                <div className="mt-7 flex flex-wrap gap-2">
                  {v.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* proof line */}
                <div className="mt-9 flex items-center justify-between border-t border-white/10 pt-7">
                  <span className="inline-flex items-center gap-2 text-sm font-light text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-amber-300" />
                    {v.proof}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                    Open <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>

                {/* hover aura */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.08),transparent_55%)]" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Close rail: ties ventures back to vault + inner circle */}
        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                Access pathway
              </p>
              <p className="mt-3 text-lg font-light text-gray-300">
                Want the artefacts behind these builds? The templates, packs, and operator notes live in the Vault.
              </p>
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <Link
                href="/downloads/vault"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all duration-300 hover:border-amber-400/45 hover:bg-amber-500/15"
              >
                <Lock className="h-4 w-4 text-amber-300" />
                Open the Vault
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedVenturesSection;