"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Compass,
  Cpu,
  Globe,
  Landmark,
  Shield,
  Target,
  Vault,
  Workflow,
} from "lucide-react";

type Dossier = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  meta: string;
  accent?: "amber" | "blue" | "neutral";
};

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export default function EnhancedVenturesSection() {
  // Everything live. Choose only routes you actually have.
  // You can swap hrefs later without touching layout.
  const dossiers: Dossier[] = [
    {
      title: "Institutional Advisory",
      description:
        "Governance-grade strategy for founders, leadership teams, and private institutions — built to hold under pressure.",
      icon: <Landmark className="h-6 w-6" />,
      href: "/consulting",
      meta: "Engagements • advisory • delivery",
      accent: "amber",
    },
    {
      title: "Strategic Frameworks",
      description:
        "Models, matrices, and decision tools engineered for use — not applause. Deploy the system.",
      icon: <Target className="h-6 w-6" />,
      href: "/resources/strategic-frameworks",
      meta: "Framework library • matrices • models",
      accent: "amber",
    },
    {
      title: "The Canon",
      description:
        "A coherent architecture: purpose, morality, governance, and institutional design — structured like a library, used like a weapon.",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/canon",
      meta: "Volumes • thesis • operator manuals",
      accent: "neutral",
    },
    {
      title: "The Vault",
      description:
        "Templates, operator packs, and execution artefacts. Practical, clean, and brutally deployable.",
      icon: <Vault className="h-6 w-6" />,
      href: "/downloads/vault",
      meta: "Packs • templates • operating assets",
      accent: "amber",
    },
    {
      title: "Strategy",
      description:
        "Positioning, systems, and decision discipline — a public library of methods that don’t crumble when reality shows up.",
      icon: <Compass className="h-6 w-6" />,
      href: "/strategy",
      meta: "Positioning • governance • execution",
      accent: "blue",
    },
    {
      title: "Ventures",
      description:
        "Practical deployment across multiple vectors — systems shipped, products built, institutions formed.",
      icon: <Workflow className="h-6 w-6" />,
      href: "/ventures",
      meta: "Portfolio • deployments • case notes",
      accent: "neutral",
    },
  ];

  const accentClass = (accent?: Dossier["accent"]) => {
    if (accent === "amber") {
      return "border-amber-400/20 hover:border-amber-400/35 hover:shadow-amber-500/10";
    }
    if (accent === "blue") {
      return "border-blue-400/15 hover:border-blue-400/25 hover:shadow-blue-500/10";
    }
    return "border-white/10 hover:border-white/20 hover:shadow-white/10";
  };

  const iconBg = (accent?: Dossier["accent"]) => {
    if (accent === "amber") return "bg-amber-500/10 text-amber-300";
    if (accent === "blue") return "bg-blue-500/10 text-blue-200";
    return "bg-white/5 text-gray-200";
  };

  return (
    <section className="relative overflow-hidden bg-black py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:84px_84px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
              Portfolio dossiers
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              Choose a file. Open it.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-gray-300">
              No “coming soon”. No placeholders. Each item is a live destination —
              built like a library and used like a war room.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/consulting"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-4 text-sm font-extrabold text-black shadow-2xl shadow-amber-900/25 transition-all hover:scale-[1.02]"
            >
              <Briefcase className="h-5 w-5" />
              Engage
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/downloads/vault"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-200 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Shield className="h-5 w-5 text-amber-300" />
              Vault
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dossiers.map((d) => (
            <Link
              key={d.title}
              href={d.href}
              className={cx(
                "group relative overflow-hidden rounded-3xl border bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.05] hover:shadow-xl",
                accentClass(d.accent)
              )}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-400">
                    dossier
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold text-amber-100">
                    {d.title}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-gray-300">
                    {d.description}
                  </p>
                  <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                    {d.meta}
                  </p>
                </div>

                <div
                  className={cx(
                    "flex h-14 w-14 items-center justify-center rounded-2xl",
                    iconBg(d.accent)
                  )}
                >
                  {d.icon}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                  open file
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  View{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>

              {/* Sheen */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.07),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        {/* Compact bottom rail */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "/resources", label: "Resources", icon: <Cpu className="h-4 w-4" /> },
            { href: "/shorts", label: "Shorts", icon: <BookOpen className="h-4 w-4" /> },
            { href: "/strategy", label: "Strategy", icon: <Compass className="h-4 w-4" /> },
            { href: "/canon", label: "Canon", icon: <Globe className="h-4 w-4" /> },
          ].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-200 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <span className="text-amber-300">{x.icon}</span>
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}