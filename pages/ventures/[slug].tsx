/* pages/ventures/[slug].tsx — INDIVIDUAL VENTURE PAGE */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  ChevronLeft,
  Briefcase,
  Building,
  Shield,
  Compass,
  Target,
  PackageCheck,
  ShieldCheck,
  BriefcaseBusiness,
  Calendar,
  Users2,
  TrendingUp,
} from "lucide-react";

import Layout from "@/components/Layout";

// Re-use the same types and data from your index page
type VentureStatus = "Active" | "Scaling" | "In development";

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
  fullDescription?: string;
  principles?: string[];
  leadership?: {
    name: string;
    role: string;
  }[];
}

// Re-use the same ventures data
const ventures: Venture[] = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    sector: "Operating Company",
    description:
      "The operating and advisory company behind strategic market-entry, governance, and venture architecture.",
    descriptionShort: "Advisory, governance, and venture architecture",
    domain: ["Governance", "Strategic Advisory", "Organizational Design"],
    established: "2018",
    url: process.env.NEXT_PUBLIC_ALOMARADA_URL || "/ventures",
    isInternal: !process.env.NEXT_PUBLIC_ALOMARADA_URL,
    status: "Active",
    metrics: {
      founded: "2018",
      team: "12",
      stage: "Scaled",
    },
    fullDescription:
      "Alomarada holds the operating-company role behind strategic market-entry, governance, and venture architecture work. It provides a practical company frame for advisory activity and disciplined venture development while each public expression keeps its own identity.",
    principles: [
      "Decision rights clarity",
      "Succession as design principle",
      "Strategic cadence architecture",
      "Board effectiveness",
    ],
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    sector: "Resilience Goods",
    description:
      "A durable lifestyle and field-gear venture for people carrying responsibility under pressure.",
    descriptionShort: "Utility and resilience for high-responsibility life",
    domain: ["Utility", "Resilience", "Field Gear"],
    established: "2024",
    url: process.env.NEXT_PUBLIC_ENDURELUXE_URL || "/ventures",
    isInternal: !process.env.NEXT_PUBLIC_ENDURELUXE_URL,
    status: "Scaling",
    metrics: {
      founded: "2024",
      team: "6",
      stage: "Growth",
    },
    fullDescription:
      "Endureluxe extends the wider operating doctrine through durable lifestyle and field-gear work for people carrying responsibility under pressure. Its expression is utility and resilience, not a duplicate of Abraham of London strategic intelligence.",
    principles: [
      "Sustainable practice",
      "Community-centered design",
      "Open-access education",
      "Integrated methodology",
    ],
  },
  {
    name: "InnovateHub",
    slug: "innovatehub",
    sector: "Builder Support",
    description:
      "A practical formation environment for founders turning ideas into structured ventures.",
    descriptionShort: "Builder support for venture formation",
    domain: ["Builder Support", "Venture Architecture", "Product Strategy"],
    established: "2024",
    url: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "/ventures",
    isInternal: !process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
    status: "In development",
    metrics: {
      founded: "2024",
      team: "5",
      stage: "Formation",
    },
    fullDescription:
      "InnovateHub supports founders as ideas become structured ventures. It concentrates on practical formation, venture design, execution discipline, and the product choices that make early building less improvised.",
    principles: [
      "Structured venture development",
      "Product-market architecture",
      "Resource allocation discipline",
      "Scalable systems",
    ],
  },
];

const domainIcons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Governance: Shield,
  "Strategic Advisory": Compass,
  "Organizational Design": Building,
  "Product Strategy": Target,
  "Venture Architecture": Building2,
  Utility: PackageCheck,
  Resilience: ShieldCheck,
  "Field Gear": BriefcaseBusiness,
  "Builder Support": Building2,
};

const statusColors: Record<VentureStatus, { text: string; bg: string; border: string }> = {
  Active: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  Scaling: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  "In development": {
    text: "text-zinc-400",
    bg: "bg-zinc-400/10",
    border: "border-zinc-400/20",
  },
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = ventures.map((venture) => ({
    params: { slug: venture.slug },
  }));

  return {
    paths,
    fallback: "blocking",
  };


};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const venture = ventures.find((v) => v.slug === params?.slug);

  if (!venture) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      venture,
    },
    revalidate: 3600,
  };


};

const VenturePage: NextPage<{ venture: Venture }> = ({ venture }) => {
  const PrimaryIcon = (venture.domain[0] ? domainIcons[venture.domain[0]] : undefined) || Briefcase;
  const status = statusColors[venture.status];

  return (
    <Layout
      title={`${venture.name} | Abraham of London`}
      description={venture.descriptionShort}
    >
      <Head>
        <meta property="og:title" content={`${venture.name} | Abraham of London`} />
        <meta property="og:description" content={venture.descriptionShort} />
        <meta property="og:image" content="https://www.abrahamoflondon.org/ventures-og.png" />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/ventures/${venture.slug}`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <div className="border-b border-white/5">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
            <Link
              href="/ventures"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back to Ventures</span>
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_24%,rgba(245,158,11,0.04),transparent_56%)]" />
          
          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
              {/* Left column - meta */}
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28 space-y-8">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-px bg-amber-500/30" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                      {venture.sector}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className={`inline-flex items-center gap-2 rounded-full border ${status.border} ${status.bg} px-4 py-2`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.text.replace('text-', 'bg-')}`} />
                      <span className={`font-mono text-[9px] uppercase tracking-[0.22em] ${status.text}`}>
                        {venture.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-white/30" />
                        <span className="font-mono text-[11px] text-white/60">
                          Established {venture.metrics?.founded}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users2 className="h-4 w-4 text-white/30" />
                        <span className="font-mono text-[11px] text-white/60">
                          Team of {venture.metrics?.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-white/30" />
                        <span className="font-mono text-[11px] text-white/60">
                          {venture.metrics?.stage} stage
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-4">
                      Domain Focus
                    </h3>
                    <div className="space-y-3">
                      {venture.domain.map((d) => {
                        const Icon = domainIcons[d] || Briefcase;
                        return (
                          <div key={d} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-white/30" />
                            <span className="text-sm text-white/70">{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - content */}
              <div className="lg:col-span-7 lg:col-start-6">
                <div className="space-y-12">
                  <div>
                    <h1 className="font-serif text-5xl md:text-6xl font-light tracking-[-0.02em] text-white mb-6">
                      {venture.name}
                    </h1>
                    <p className="text-xl text-white/60 leading-relaxed">
                      {venture.fullDescription || venture.description}
                    </p>
                  </div>

                  {venture.principles && (
                    <div className="space-y-6">
                      <h2 className="font-serif text-2xl text-white">Governing principles</h2>
                      <div className="grid gap-4">
                        {venture.principles.map((principle, i) => (
                          <div key={i} className="flex items-start gap-4 border-l-2 border-amber-500/30 pl-5">
                            <span className="font-mono text-[8px] text-white/30 mt-1">
                              {(i + 1).toString().padStart(2, '0')}
                            </span>
                            <p className="text-white/70">{principle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 border-t border-white/5">
                    {venture.isInternal ? (
                      <Link
                        href={venture.url}
                        className="group inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">
                          Return to venture directory
                        </span>
                        <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ) : (
                      <a
                        href={venture.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">
                          Visit {venture.name}
                        </span>
                        <ExternalLink className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturePage;
