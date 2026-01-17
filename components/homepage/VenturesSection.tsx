"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Building2, 
  PackageCheck, 
  Lightbulb,
  Target,
  Globe,
  Rocket,
  Shield,
  Users,
  Zap,
  Sparkles
} from "lucide-react";

interface Venture {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  status: "Active" | "In development" | "Scaling";
  focus: string;
  accentColor: "emerald" | "blue" | "amber" | "purple" | "rose" | "cyan";
  metrics?: {
    label: string;
    value: string;
  }[];
  launched?: string;
}

const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com/";
const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL ||
  "https://alomarada.com/endureluxe";
const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  "https://innovatehub.abrahamoflondon.org";

const ventures: Omit<Venture, "icon">[] = [
  {
    name: "Alomarada",
    description:
      "Board-level advisory, operating systems, and market-entry strategy for founders, boards, and institutions building sustainable ventures across Africa and emerging markets.",
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategic advisory · Market systems · Deal architecture",
    accentColor: "emerald",
    metrics: [
      { label: "Advisory sessions", value: "48+" },
      { label: "Markets covered", value: "12+" },
      { label: "Deals structured", value: "£5M+" }
    ],
    launched: "2023"
  },
  {
    name: "Endureluxe",
    description:
      "Community-driven fitness and performance gear engineered for durability. Built for people who train, build, and endure - designed to survive real life, not just product shoots.",
    href: ENDURELUXE_URL,
    status: "Scaling",
    focus: "Fitness community · Performance gear · Everyday durability",
    accentColor: "blue",
    metrics: [
      { label: "Products shipped", value: "2,500+" },
      { label: "Community members", value: "1,200+" },
      { label: "Countries served", value: "28+" }
    ],
    launched: "2024"
  },
  {
    name: "InnovateHub",
    description:
      "Strategy, playbooks, and hands-on support to help founders test ideas, ship durable products, and build operating rhythms that actually hold under pressure.",
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Innovation engine · Capability building · Venture design",
    accentColor: "amber",
    metrics: [
      { label: "Founders supported", value: "36+" },
      { label: "Products launched", value: "12+" },
      { label: "Playbooks shipped", value: "8+" }
    ],
    launched: "2025"
  },
];

// Map icons to ventures
const ventureIcons = {
  Alomarada: Building2,
  Endureluxe: PackageCheck,
  InnovateHub: Lightbulb
};

const colorClasses = {
  emerald: {
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
    iconText: "text-emerald-400",
    border: "border-emerald-400/20 group-hover:border-emerald-400/40",
    linkText: "text-emerald-300",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    glow: "bg-emerald-500/10",
    metric: "text-emerald-300"
  },
  blue: {
    pill: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    iconBg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
    iconText: "text-blue-400",
    border: "border-blue-400/20 group-hover:border-blue-400/40",
    linkText: "text-blue-300",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    glow: "bg-blue-500/10",
    metric: "text-blue-300"
  },
  amber: {
    pill: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
    iconText: "text-amber-400",
    border: "border-amber-400/20 group-hover:border-amber-400/40",
    linkText: "text-amber-300",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    glow: "bg-amber-500/10",
    metric: "text-amber-300"
  },
  purple: {
    pill: "bg-purple-500/15 text-purple-300 border-purple-400/30",
    iconBg: "bg-gradient-to-br from-purple-500/20 to-purple-600/10",
    iconText: "text-purple-400",
    border: "border-purple-400/20 group-hover:border-purple-400/40",
    linkText: "text-purple-300",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    glow: "bg-purple-500/10",
    metric: "text-purple-300"
  },
  rose: {
    pill: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-600/10",
    iconText: "text-rose-400",
    border: "border-rose-400/20 group-hover:border-rose-400/40",
    linkText: "text-rose-300",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    glow: "bg-rose-500/10",
    metric: "text-rose-300"
  },
  cyan: {
    pill: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10",
    iconText: "text-cyan-400",
    border: "border-cyan-400/20 group-hover:border-cyan-400/40",
    linkText: "text-cyan-300",
    gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    glow: "bg-cyan-500/10",
    metric: "text-cyan-300"
  },
};

const VenturesSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Execution Arms
            </span>
          </div>
          
          <h2 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Where philosophy becomes <span className="bg-gradient-to-r from-amber-200 to-amber-300 bg-clip-text text-transparent">operating system</span>
          </h2>
          
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300">
            Alomarada, Endureluxe, and InnovateHub are not side projects. They are execution arms 
            of the Canon — real-world laboratories for strategy, governance, and multi-generational design.
          </p>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: "Active Ventures", value: "3", icon: Rocket },
              { label: "Markets", value: "40+", icon: Globe },
              { label: "Impact", value: "£5M+", icon: Target },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/5 to-white/10 mb-3">
                    <Icon className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ventures Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {ventures.map((venture) => {
            const colors = colorClasses[venture.accentColor];
            const IconComponent = ventureIcons[venture.name as keyof typeof ventureIcons];

            return (
              <article
                key={venture.name}
                className={`group relative flex h-full flex-col rounded-3xl border ${colors.border} bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50`}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 bg-gradient-to-br ${colors.gradient} transition-opacity duration-500`} />
                
                {/* Status glow */}
                <div className={`absolute -top-2 -right-2 h-4 w-4 rounded-full ${colors.glow} blur-sm`} />

                {/* Icon and Status */}
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  <div className={`rounded-2xl p-4 ${colors.iconBg}`}>
                    <IconComponent className={`h-7 w-7 ${colors.iconText}`} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors.pill}`}
                    >
                      {venture.status}
                    </span>
                    {venture.launched && (
                      <span className="text-xs text-gray-500">
                        Launched {venture.launched}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="relative mb-6 flex-1">
                  <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                    {venture.name}
                  </h3>

                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-amber-300/90">
                    {venture.focus}
                  </p>

                  <p className="mb-6 text-sm leading-relaxed text-gray-300">
                    {venture.description}
                  </p>

                  {/* Metrics */}
                  {venture.metrics && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-3">
                        {venture.metrics.map((metric, idx) => (
                          <div key={idx} className="text-center">
                            <div className={`text-lg font-bold ${colors.metric} mb-1`}>
                              {metric.value}
                            </div>
                            <div className="text-xs text-gray-400">
                              {metric.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="relative mt-auto flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">Strategic arm</span>
                  </div>
                  <Link
                    href={venture.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group/link inline-flex items-center gap-1.5 rounded-full border ${colors.border} ${colors.iconBg} px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:gap-2 ${colors.linkText}`}
                  >
                    Visit site
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="mb-8">
            <h3 className="mb-4 font-serif text-2xl font-semibold text-white">
              Ready to build something durable?
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Each venture represents a different execution channel of the Canon philosophy — 
              from strategic advisory to physical products and founder support.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/ventures"
              className="group inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-8 py-4 text-sm font-semibold text-amber-200 transition-all hover:from-amber-500/20 hover:to-amber-600/10"
            >
              <Users className="h-4 w-4" />
              Venture partnerships
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <Zap className="h-4 w-4" />
              Strategic advisory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenturesSection;