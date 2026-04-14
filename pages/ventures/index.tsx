/* pages/ventures/index.tsx — VENTURE PORTFOLIO (ADULT / BOARDROOM EDITION) */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Activity,
  ExternalLink,
  ChevronRight,
  Briefcase,
  TrendingUp as TrendingUpIcon,
  Building,
  Shield,
  Layers,
  Users,
  Compass,
  Gauge,
  Scale,
  Clock,
  Target,
  LineChart,
  Hexagon,
} from "lucide-react";

import Layout from "@/components/Layout";

type VentureStatus = "Operational" | "Development" | "Inactive";

interface Venture {
  name: string;
  slug: string;
  sector: string;
  description: string;
  descriptionShort?: string;
  domain: string[];
  established: string;
  url: string;
  isInternal?: boolean;
  status: VentureStatus;
  metrics?: {
    founded: string;
    team?: string;
    stage?: string;
  };
}

const statusConfig: Record<
  VentureStatus,
  { label: string; className: string; dot: string }
> = {
  Operational: {
    label: "Operational",
    className: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.05]",
    dot: "bg-emerald-400",
  },
  Development: {
    label: "Development",
    className: "text-amber-300 border-amber-400/20 bg-amber-400/[0.05]",
    dot: "bg-amber-400",
  },
  Inactive: {
    label: "Inactive",
    className: "text-zinc-400 border-zinc-500/20 bg-zinc-500/[0.04]",
    dot: "bg-zinc-500",
  },
};

const domainIcons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Governance: Shield,
  "Strategic Advisory": Compass,
  "Organizational Design": Building,
  "Community Health": Activity,
  "Performance Systems": Gauge,
  "Equipment Design": Hexagon,
  "Product Strategy": Target,
  "Venture Architecture": Building2,
  "Market Development": TrendingUpIcon,
  "Discourse Architecture": Users,
  "Knowledge Management": Layers,
  "Strategic Dialogue": Scale,
};

const ventures: Venture[] = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    sector: "Institutional Advisory",
    description:
      "We provide governance frameworks and strategic operating systems for boards and institutions navigating complex market environments. Our work centers on aligning oversight, execution, and succession across organizational structures.",
    descriptionShort: "Governance architecture for institutions",
    domain: ["Governance", "Strategic Advisory", "Organizational Design"],
    established: "2018",
    url: "https://alomarada.com",
    status: "Operational",
    metrics: {
      founded: "2018",
      team: "12",
      stage: "Scaled",
    },
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    sector: "Health & Performance",
    description:
      "A community-centered approach to physical and mental health. We develop training systems and performance tools while maintaining open access to resources that support sustainable practice across experience levels.",
    descriptionShort: "Community health systems",
    domain: ["Community Health", "Performance Systems", "Equipment Design"],
    established: "2024",
    url: "https://alomarada.com/endureluxe",
    status: "Operational",
    metrics: {
      founded: "2024",
      team: "6",
      stage: "Growth",
    },
  },
  {
    name: "Chatham Rooms",
    slug: "chatham-rooms",
    sector: "Knowledge Exchange",
    description:
      "A secure environment for high-stakes discourse and institutional knowledge exchange. We facilitate structured dialogue between stakeholders under protocols designed to ensure candor, confidentiality, and objective synthesis of complex issues.",
    descriptionShort: "High-stakes dialogue architecture",
    domain: ["Discourse Architecture", "Knowledge Management", "Strategic Dialogue"],
    established: "2025",
    url: "/chatham-rooms", // ✅ FIXED: Points to internal page, not external URL
    isInternal: true,
    status: "Operational",
    metrics: {
      founded: "2025",
      team: "4",
      stage: "Early",
    },
  },
  {
    name: "InnovateHub",
    slug: "innovatehub",
    sector: "Product & Venture Development",
    description:
      "Structured frameworks for product strategy and venture architecture. We work with founders and organizations to establish systematic approaches to development, resource allocation, and market positioning.",
    descriptionShort: "Venture architecture frameworks",
    domain: ["Product Strategy", "Venture Architecture", "Market Development"],
    established: "2024",
    url: "https://innovatehub.abrahamoflondon.org",
    status: "Development",
    metrics: {
      founded: "2024",
      team: "5",
      stage: "Formation",
    },
  },
];

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-500/30" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
        {children}
      </span>
    </div>
  );
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="border-l border-white/6 pl-4 first:border-l-0 first:pl-0 transition-colors duration-300 group-hover/metric:border-amber-500/20">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 transition-colors group-hover/metric:text-amber-400/40">
        {label}
      </div>
      <div className="mt-2 font-serif text-lg text-white/84 transition-colors group-hover/metric:text-amber-50/90">
        {value || "—"}
      </div>
    </div>
  );
}

function VentureCard({ venture, index }: { venture: Venture; index: number }) {
  const status = statusConfig[venture.status];
  const PrimaryIcon = (venture.domain[0] ? domainIcons[venture.domain[0]] : undefined) || Briefcase;

  return (
    <article
      id={venture.slug}
      className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.015] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(245,158,11,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.16))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[1px]"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.45)",
        }}
      />

      <div className="relative p-8 md:p-10">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-white/18 transition-all duration-500 group-hover:text-amber-400/40">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${status.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className="font-mono text-[8px] uppercase tracking-[0.22em]">
                {status.label}
              </span>
            </div>
          </div>

          <PrimaryIcon className="h-5 w-5 text-white/22 transition-colors duration-500 group-hover:text-amber-300/55" />
        </div>

        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
            {venture.sector}
          </p>

          <h2 className="font-serif text-3xl tracking-[-0.02em] text-white transition-colors duration-500 group-hover:text-amber-50 md:text-[2.15rem]">
            {venture.name}
          </h2>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/54">
            {venture.descriptionShort || venture.description}
          </p>
        </div>

        <div className="group/metric mt-10 grid grid-cols-3 gap-6 border-y border-white/6 py-6">
          <MetricCell label="Founded" value={venture.metrics?.founded} />
          <MetricCell label="Team" value={venture.metrics?.team} />
          <MetricCell label="Stage" value={venture.metrics?.stage} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {venture.domain.map((d) => {
            const DomainIcon = domainIcons[d] || Briefcase;
            return (
              <div
                key={d}
                className="inline-flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-all duration-300 hover:border-amber-500/30 hover:bg-amber-500/[0.04] group"
              >
                <DomainIcon className="h-3.5 w-3.5 text-white/28 transition-colors group-hover:text-amber-300/50" />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/42 transition-colors group-hover:text-amber-300/70">
                  {d}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-white/6 pt-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-amber-500/30 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/24">
              Platform
            </span>
          </div>

          {venture.isInternal ? (
            <Link
              href={venture.url}
              className="group/link inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/42 transition-colors duration-300 hover:text-amber-300"
            >
              <span>Enter Platform</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
            </Link>
          ) : (
            <a
              href={venture.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/42 transition-colors duration-300 hover:text-amber-300"
            >
              <span>Visit Platform</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

const VenturesPage: NextPage = () => {
  return (
    <Layout
      title="Ventures | Abraham of London"
      description="Applied frameworks across institutional, performance, and development domains."
    >
      <Head>
        <meta property="og:title" content="Ventures | Abraham of London" />
        <meta
          property="og:description"
          content="Applied frameworks across institutional, performance, and development domains."
        />
        <meta
          property="og:image"
          content="https://www.abrahamoflondon.org/ventures-og.png"
        />
        <link rel="canonical" href="https://www.abrahamoflondon.org/ventures" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_24%,rgba(245,158,11,0.04),transparent_56%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_50%,transparent_100%)]" />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="max-w-4xl">
              <RailLabel>Operating Platforms</RailLabel>

              <h1 className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.5rem]">
                Ventures built for
                <span className="block text-white/58">serious work</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.2rem]">
                Applied platforms across institutional advisory, performance
                systems, venture architecture, and structured discourse.
              </p>

              <div className="mt-14 flex items-center gap-4">
                <div className="h-px w-12 bg-amber-500/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/28">
                  Portfolio Registry
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                  Current Platforms
                </p>
                <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                  Active portfolio
                </h2>
              </div>

              <div className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-white/22 md:block">
                {ventures.length} ventures indexed
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {ventures.map((venture, index) => (
                <VentureCard key={venture.slug} venture={venture} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Method */}
        <section className="relative overflow-hidden border-t border-white/5 py-28 md:py-36">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_28%,rgba(245,158,11,0.025),transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <RailLabel>Method</RailLabel>

                  <h2 className="mt-8 max-w-[10ch] font-serif text-4xl leading-tight text-white md:text-5xl">
                    Philosophy turned into operating logic
                  </h2>

                  <p className="mt-6 max-w-md text-white/46">
                    The portfolio is not a random collection of projects. Each
                    platform is a practical expression of the same governing
                    discipline.
                  </p>
                </div>
              </div>

              <div className="space-y-14 lg:col-span-7 lg:col-start-6">
                {[
                  {
                    icon: Scale,
                    title: "Integration over isolation",
                    description:
                      "Solutions are designed with the full system in view: governance, market, people, and execution.",
                  },
                  {
                    icon: Building,
                    title: "Structure before scale",
                    description:
                      "Expansion without architecture creates fragility. Foundations must be able to carry added complexity.",
                  },
                  {
                    icon: Clock,
                    title: "Succession by design",
                    description:
                      "Institutional continuity requires transfer logic from the start, not improvised inheritance later.",
                  },
                  {
                    icon: LineChart,
                    title: "Measured deployment",
                    description:
                      "Timing matters, but timing without readiness is noise. We prefer disciplined release to theatrical motion.",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="group relative border-b border-white/6 pb-10 last:border-b-0">
                      <div className="flex gap-5">
                        <div className="mt-1 hidden sm:block">
                          <div className="flex h-12 w-12 items-center justify-center border border-white/[0.08] bg-white/[0.02]">
                            <Icon className="h-5 w-5 text-white/28 transition-colors duration-300 group-hover:text-amber-300/60" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <h3 className="font-serif text-xl text-white transition-colors duration-300 group-hover:text-amber-50">
                              {item.title}
                            </h3>

                            <span className="font-mono text-[8px] text-white/14">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <p className="max-w-2xl leading-relaxed text-white/42">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-white/5 py-24 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.02),transparent_70%)]" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <RailLabel>Engagement</RailLabel>

            <h2 className="mt-8 font-serif text-4xl text-white md:text-6xl">
              Strategic engagements
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/50">
              We work with leaders, founders, and institutions prepared for
              structured thinking and serious execution.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
              >
                <span>Initiate conversation</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/canon"
                className="group inline-flex items-center justify-center gap-3 border border-white/10 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-white/20 hover:bg-white/5"
              >
                <span>Explore the Canon</span>
                <ExternalLink className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
              </Link>
            </div>

            <div className="mt-20 flex justify-center">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-amber-500/30 to-transparent" />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturesPage;