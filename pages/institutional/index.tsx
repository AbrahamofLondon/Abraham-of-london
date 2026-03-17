import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Landmark,
  ArrowRight,
  Building2,
  Shield,
  Network,
  Scale,
  Gavel,
  Crown,
  Eye,
  Briefcase,
} from "lucide-react";

import Layout from "@/components/Layout";

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-400/30" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
        <Crown className="relative h-4 w-4 text-amber-300/50" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
    </div>
  );
}

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-500/[0.05] blur-[130px]" />
      <div className="absolute right-[12%] top-[24%] h-[18rem] w-[18rem] rounded-full bg-white/[0.02] blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute inset-x-0 bottom-20 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  text,
  tag,
}: {
  icon: React.ComponentType<any>;
  title: string;
  text: string;
  tag: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.03]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 180px at 0% 0%, rgba(245,158,11,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.14))",
        }}
      />
      <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-amber-400/20 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <Icon className="h-5 w-5 text-amber-400/72 transition-transform duration-500 group-hover:scale-110" />
          <span className="font-mono text-[8px] text-white/18">{tag}</span>
        </div>

        <h3 className="mt-6 font-serif text-2xl text-white transition-colors group-hover:text-amber-50">
          {title}
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-white/50 transition-colors group-hover:text-white/68">
          {text}
        </p>
      </div>
    </div>
  );
}

const InstitutionalPage: NextPage = () => {
  return (
    <Layout
      title="Institutional | Abraham of London"
      description="Governance, policy, and institutional architecture for serious organisations that need systems built to outlast personalities."
      canonicalUrl="/institutional"
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <meta property="og:title" content="Institutional | Abraham of London" />
        <meta
          property="og:description"
          content="Governance with spine. Policy with structure. Advisory for organisations that need systems, standards, and decision architecture."
        />
      </Head>

      <main className="relative min-h-screen bg-black text-white">
        <AmbientField />

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div className="max-w-4xl">
                <RailLabel>Governance · Policy · Architecture</RailLabel>

                <h1 className="mt-8 font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.6rem]">
                  Governance with spine.
                  <span className="mt-3 block text-white/58">
                    Policy with structure.
                  </span>
                </h1>

                <p className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-white/56">
                  Advisory for organisations, public institutions, and serious
                  leadership teams that need systems, standards, and decision
                  architecture built to last.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Scale className="h-3 w-3 text-amber-400/60" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Decision rights
                    </span>
                  </div>

                  <div className="h-3 w-px bg-white/10" />

                  <div className="flex items-center gap-2">
                    <Gavel className="h-3 w-3 text-amber-400/60" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Accountability
                    </span>
                  </div>

                  <div className="h-3 w-px bg-white/10" />

                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-amber-400/60" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Control systems
                    </span>
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-amber-400/28 to-transparent" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    Built for institutional durability
                  </span>
                </div>
              </div>

              <div className="self-end lg:justify-self-end">
                <div className="border border-white/[0.08] bg-white/[0.02] p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="grid grid-cols-2 gap-px border border-white/8 bg-white/8">
                    {[
                      { icon: Landmark, label: "Governance" },
                      { icon: Scale, label: "Policy" },
                      { icon: Network, label: "Systems" },
                      { icon: Gavel, label: "Control" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="bg-black/70 p-6 text-center"
                        >
                          <Icon className="mx-auto h-5 w-5 text-amber-400/72" />
                          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/48">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 border border-white/10 bg-black/45 p-5">
                    <p className="font-serif text-lg text-white">
                      Institutional mandate
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      Systems designed to survive leadership transition, strain,
                      and external pressure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <RailLabel>Core Capabilities</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Systems that outlast personalities
                </h2>
              </div>

              <p className="max-w-md text-sm leading-relaxed text-white/48">
                Built for durability, not convenience. Designed to remain
                coherent through leadership transitions, institutional strain,
                and external pressure.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <CapabilityCard
                icon={Building2}
                title="Institution design"
                text="Structures, mandates, and operating principles designed to outlast personalities and preserve institutional continuity."
                tag="01"
              />
              <CapabilityCard
                icon={Shield}
                title="Governance advisory"
                text="Decision rights, accountability, controls, and legitimacy under scrutiny. Systems that hold under pressure."
                tag="02"
              />
              <CapabilityCard
                icon={Network}
                title="System architecture"
                text="Operating models that connect policy, leadership rhythm, and execution from boardroom to front line."
                tag="03"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* OPERATING POSTURE */}
        <section className="relative py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <RailLabel>Operating Posture</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Advisory for institutions
                  <span className="mt-2 block text-white/58">
                    that cannot afford drift
                  </span>
                </h2>
              </div>

              <div className="space-y-6 text-[1.02rem] leading-relaxed text-white/52">
                <p>
                  This work is suited to boards, executive teams, regulated
                  entities, and public institutions where legitimacy, operating
                  discipline, and continuity matter.
                </p>
                <p>
                  The aim is not decorative strategy. The aim is to produce
                  decision architecture, governance clarity, and system
                  coherence that survives scrutiny.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Briefcase,
                  title: "Boards",
                  text: "Governance rhythm, clarity of role, and defensible decision process.",
                },
                {
                  icon: Eye,
                  title: "Executive teams",
                  text: "Operational alignment between policy intent and execution reality.",
                },
                {
                  icon: Landmark,
                  title: "Public institutions",
                  text: "Structures with enough discipline to hold under political and external pressure.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="border border-white/[0.08] bg-white/[0.02] p-6"
                  >
                    <Icon className="mb-4 h-5 w-5 text-amber-400/70" />
                    <h3 className="font-serif text-xl text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/48">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-white/8 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(245,158,11,0.04),transparent_60%)]" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 lg:flex-row lg:items-center lg:px-12">
            <div className="max-w-xl">
              <RailLabel>Institutional Mandate</RailLabel>

              <h3 className="mt-5 font-serif text-3xl text-white md:text-4xl">
                Discuss an organisational brief
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-white/50">
                For boards, executive teams, and public institutions. Initial
                conversations are handled discreetly and with clear boundaries.
              </p>
            </div>

            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 border border-white/15 bg-white/[0.04] px-7 py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-white"
            >
              <span>Discuss a mandate</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InstitutionalPage;