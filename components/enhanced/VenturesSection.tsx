"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Building2, Briefcase, TrendingUp, Target, 
  Zap, Globe, Shield, Cpu,
  ArrowRight, ExternalLink
} from "lucide-react";

interface Venture {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'live' | 'development' | 'incubation';
  link: string;
}

export const EnhancedVenturesSection: React.FC = () => {
  const ventures: Venture[] = [
    {
      title: "Institutional Advisory",
      description: "Governance-grade strategy for family offices and private institutions.",
      icon: <Building2 className="h-6 w-6" />,
      color: "from-blue-500/20 to-blue-600/10",
      status: 'live',
      link: "/consulting",
    },
    {
      title: "Founder OS",
      description: "Operating systems for founders building institutions, not just companies.",
      icon: <Cpu className="h-6 w-6" />,
      color: "from-emerald-500/20 to-emerald-600/10",
      status: 'development',
      link: "/ventures/founder-os",
    },
    {
      title: "Household Architecture",
      description: "Blueprints for multi-generational family systems and legacy planning.",
      icon: <Shield className="h-6 w-6" />,
      color: "from-amber-500/20 to-amber-600/10",
      status: 'live',
      link: "/ventures/household-architecture",
    },
    {
      title: "Public Strategy",
      description: "Institutional positioning and public narrative architecture.",
      icon: <Globe className="h-6 w-6" />,
      color: "from-purple-500/20 to-purple-600/10",
      status: 'incubation',
      link: "/ventures/public-strategy",
    },
  ];

  const statusColors = {
    live: "bg-green-500/20 text-green-400 border-green-500/30",
    development: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    incubation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-20 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Ventures · Deployment
          </p>
          <h2 className="mt-6 font-serif text-4xl font-light text-slate-900 dark:text-white sm:text-5xl">
            Where theory meets<br />
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              institutional reality
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-gray-300">
            Practical deployment of canonical principles across multiple venture vectors.
          </p>
        </div>

        {/* Ventures Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {ventures.map((venture, index) => (
            <Link
              key={index}
              href={venture.link}
              className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/50 bg-gradient-to-b from-white to-slate-50 p-8 shadow-xl transition-all hover:-translate-y-2 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-900/20 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-950"
            >
              {/* Status Badge */}
              <div className={`absolute right-6 top-6 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColors[venture.status]}`}>
                {venture.status}
              </div>
              
              {/* Icon */}
              <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${venture.color}`}>
                <div className="text-slate-700 dark:text-slate-300">
                  {venture.icon}
                </div>
              </div>
              
              {/* Content */}
              <h3 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">
                {venture.title}
              </h3>
              <p className="mb-6 text-slate-600 dark:text-gray-300">
                {venture.description}
              </p>
              
              {/* CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Explore venture
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 transition-all group-hover:border-amber-500/60 group-hover:from-amber-500/20 group-hover:to-amber-600/10">
                  <ArrowRight className="h-5 w-5 text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400" />
                </div>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
        
        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/ventures"
            className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/5 to-amber-600/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-700 transition-all hover:border-amber-500/80 hover:from-amber-500/10 hover:to-amber-600/10 dark:text-amber-300"
          >
            <span>View all ventures</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EnhancedVenturesSection;