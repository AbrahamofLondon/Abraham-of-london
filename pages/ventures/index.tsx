/* pages/ventures/index.tsx — DOCTRINE-IN-OPERATION VENTURE ARCHITECTURE */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Briefcase,
  Building,
  Shield,
  Compass,
  Target,
  PackageCheck,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";

import Layout from "@/components/Layout";

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
  relationshipToAOL: string;
  evidenceOfDoctrine: string;
  maturityNote?: string;
}

const statusConfig: Record<
  VentureStatus,
  { label: string; className: string; dot: string }
> = {
  Active: {
    label: "Active",
    className: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.05]",
    dot: "bg-emerald-400",
  },
  Scaling: {
    label: "Scaling",
    className: "text-amber-300 border-amber-400/20 bg-amber-400/[0.05]",
    dot: "bg-amber-400",
  },
  "In development": {
    label: "In development",
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
  "Product Strategy": Target,
  "Venture Architecture": Building2,
  Utility: PackageCheck,
  Resilience: ShieldCheck,
  "Field Gear": BriefcaseBusiness,
  "Builder Support": Building2,
};

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
    url: process.env.NEXT_PUBLIC_ALOMARADA_URL || "/ventures/alomarada",
    isInternal: !process.env.NEXT_PUBLIC_ALOMARADA_URL,
    status: "Active",
    relationshipToAOL: "Current operating-company and advisory foundation.",
    evidenceOfDoctrine: "Governance before growth.",
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
    url: process.env.NEXT_PUBLIC_ENDURELUXE_URL || "/ventures/endureluxe",
    isInternal: !process.env.NEXT_PUBLIC_ENDURELUXE_URL,
    status: "Scaling",
    relationshipToAOL: "Commercial expression of responsibility, endurance, and useful discipline.",
    evidenceOfDoctrine: "Resilience before theatre.",
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
    url: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "/ventures/innovatehub",
    isInternal: !process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
    status: "In development",
    relationshipToAOL: "Builder-support expression for disciplined venture formation.",
    evidenceOfDoctrine: "Structure before scale.",
    maturityNote: "Formation remains deliberate.",
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

        <div className="mt-8 space-y-4 border-y border-white/6 py-6">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/24">
              Relationship to Abraham of London
            </p>
            <p className="mt-2 text-sm leading-6 text-white/48">
              {venture.relationshipToAOL}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/58">
              Operating signal: {venture.evidenceOfDoctrine}
            </span>
            {venture.maturityNote ? (
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/22">
                {venture.maturityNote}
              </span>
            ) : null}
          </div>
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
      description="The venture ecosystem around Abraham of London, expressed through advisory, resilience, and builder support without diluting Decision Infrastructure."
    >
      <Head>
        <meta property="og:title" content="Ventures | Abraham of London" />
        <meta
          property="og:description"
          content="The venture ecosystem around Abraham of London, expressed through advisory, resilience, and builder support without diluting Decision Infrastructure."
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
              <RailLabel>Doctrine in Operation</RailLabel>

              <h1 className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.5rem]">
                A venture ecosystem
                <span className="block text-white/58">governed by discipline, not noise.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.2rem]">
                Abraham of London remains centred on Decision Infrastructure and
                governed strategic intelligence. Its adjacent ventures show how
                the same operating logic can be carried into advisory,
                resilience, and builder support without collapsing separate
                identities.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/38">
                Alomarada currently holds the operating-company role. Any future
                legal umbrella transition is stated only when complete.
              </p>

              <div className="mt-14 flex items-center gap-4">
                <div className="h-px w-12 bg-amber-500/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/28">
                  Architecture Registry
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="border-b border-white/5 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-8">
              <RailLabel>Architecture</RailLabel>
              <h2 className="mt-5 max-w-2xl font-serif text-3xl font-light text-white md:text-4xl">
                Product authority first. Venture expression after.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  layer: "Strategic Authority",
                  value: "Abraham of London",
                  detail: "Decision Infrastructure and governed intelligence.",
                },
                {
                  layer: "Operating Company",
                  value: "Alomarada",
                  detail: "Current company and advisory foundation.",
                },
                {
                  layer: "Venture Expressions",
                  value: "Endureluxe · InnovateHub",
                  detail: "Resilience goods and disciplined builder support.",
                },
                {
                  layer: "Product Spine",
                  value: "Diagnostics · Executive Reporting · Strategy Room · Market Intelligence",
                  detail: "Commercial paths remain structurally separable.",
                },
              ].map((item) => (
                <article
                  key={item.layer}
                  className="border border-white/[0.07] bg-white/[0.015] p-5"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/26">
                    {item.layer}
                  </p>
                  <h3 className="mt-4 font-serif text-xl font-light leading-7 text-white/86">
                    {item.value}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/42">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Venture expressions */}
        <section className="py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                  Venture Expressions
                </p>
                <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                  Governed expressions in different domains
                </h2>
              </div>

              <div className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-white/22 md:block">
                {ventures.length} expressions in view
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {ventures.map((venture, index) => (
                <VentureCard key={venture.slug} venture={venture} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-white/5 py-24 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.02),transparent_70%)]" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <RailLabel>Decision Infrastructure</RailLabel>

            <h2 className="mt-8 font-serif text-4xl text-white md:text-6xl">
              Return to the commercial spine
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/50">
              The ventures show doctrine in operation. Abraham of London remains
              centred on governed decisions, earned reporting, intelligence, and
              the case path that carries consequence.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/diagnostics/fast"
                className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
              >
                <span>Return to Decision Infrastructure</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
