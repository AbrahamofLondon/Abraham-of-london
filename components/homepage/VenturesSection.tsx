// components/homepage/VenturesSection.tsx
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, PackageCheck, Lightbulb } from "lucide-react";

interface Venture {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status: string;
  focus: string;
  accentColor: "emerald" | "blue" | "amber";
}

const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com/";
const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL ||
  "https://alomarada.com/endureluxe";
const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  "https://innovatehub.abrahamoflondon.org";

const ventures: Venture[] = [
  {
    name: "Alomarada",
    description:
      "Board-level advisory, operating systems, and market-entry strategy for founders, boards, and institutions who take Africa seriously.",
    icon: Building2,
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategic advisory · Market systems · Deal architecture",
    accentColor: "emerald",
  },
  {
    name: "Endureluxe",
    description:
      "Community-driven fitness and performance gear for people who train, build, and endure - designed to survive real life, not just product shoots.",
    icon: PackageCheck,
    href: ENDURELUXE_URL,
    status: "Active",
    focus: "Fitness community · Performance gear · Everyday durability",
    accentColor: "blue",
  },
  {
    name: "InnovateHub",
    description:
      "Strategy, playbooks, and hands-on support to help founders test ideas, ship durable products, and build operating rhythms that actually hold.",
    icon: Lightbulb,
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Innovation engine · Capability building · Venture design",
    accentColor: "amber",
  },
];

const colorClasses = {
  emerald: {
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    border: "hover:border-emerald-400/40",
    linkText: "text-emerald-300",
  },
  blue: {
    pill: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
    border: "hover:border-blue-400/40",
    linkText: "text-blue-300",
  },
  amber: {
    pill: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    border: "hover:border-amber-400/40",
    linkText: "text-amber-300",
  },
};

const VenturesSection: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Ventures · Working arms
        </p>
        <h2 className="mb-4 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
          Where philosophy becomes operating system
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-gray-300">
          Alomarada, Endureluxe, and InnovateHub are not side projects. They
          are execution arms of the Canon - testing grounds for strategy,
          governance, and multi-generational design.
        </p>
      </div>

      {/* Ventures Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {ventures.map((venture) => {
          const colors = colorClasses[venture.accentColor];
          const IconComponent = venture.icon;

          return (
            <article
              key={venture.name}
              className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/80 hover:shadow-2xl ${colors.border}`}
            >
              {/* Icon and Status */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className={`rounded-xl p-3 ${colors.iconBg}`}>
                  <IconComponent className={`h-6 w-6 ${colors.iconText}`} />
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors.pill}`}
                >
                  {venture.status}
                </span>
              </div>

              {/* Content */}
              <h3 className="mb-2 font-serif text-xl font-semibold text-white">
                {venture.name}
              </h3>

              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-amber-300/80">
                {venture.focus}
              </p>

              <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-300">
                {venture.description}
              </p>

              {/* CTA */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-gray-500">External</span>
                <Link
                  href={venture.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group/link inline-flex items-center gap-1.5 text-sm font-semibold transition-all ${colors.linkText} hover:gap-2`}
                >
                  Visit site
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/ventures"
          className="group inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-sm font-semibold text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
        >
          View all ventures
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default VenturesSection;