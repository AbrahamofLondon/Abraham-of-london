import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Library,
  Search,
  GraduationCap,
  ScrollText,
} from "lucide-react";

import Layout from "@/components/Layout";

const EducationResearchPage: NextPage = () => {
  return (
    <Layout
      title="Education & Research | Abraham of London"
      description="Research-led education, structured learning, and advanced intellectual formation."
      canonicalUrl="/education-research"
      fullWidth
    >
      <Head>
        <meta property="og:title" content="Education & Research | Abraham of London" />
        <meta
          property="og:description"
          content="Formation with structure. Research with purpose. A disciplined environment for inquiry and intellectual development."
        />
      </Head>

      <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(245,158,11,0.06),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                Formation • Research • Knowledge
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
              Formation with structure.
              <br />
              <span className="text-amber-400/90">Research with purpose.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              A disciplined environment for inquiry, knowledge transfer, and the
              development of durable intellectual frameworks that stand up to scrutiny.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <ScrollText className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Primary research
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <GraduationCap className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Structured learning
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <Library className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Reusable knowledge
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#070707] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
                Areas of focus
              </span>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                Three working modes
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Each designed for depth. Each governed by the same intellectual standard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Research frameworks",
                text: "Structured models for analysis, evidence review, and strategic interpretation, built for decisions under uncertainty.",
                tag: "01",
              },
              {
                icon: GraduationCap,
                title: "Learning programs",
                text: "Teaching environments designed for substance rather than noise, including seminars, tutorials, and deep-dive learning.",
                tag: "02",
              },
              {
                icon: Library,
                title: "Knowledge architecture",
                text: "Systems for organising doctrine, insight, and applied reasoning into reusable institutional memory that compounds over time.",
                tag: "03",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative rounded-[28px] border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-amber-500/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between">
                  <item.icon className="h-5 w-5 text-amber-400 transition-transform group-hover:scale-110" />
                  <span className="font-mono text-[8px] text-white/20">{item.tag}</span>
                </div>

                <h2 className="mt-6 font-serif text-2xl text-white transition-colors group-hover:text-amber-50">
                  {item.title}
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-white/60 transition-colors group-hover:text-white/70">
                  {item.text}
                </p>

                <div className="absolute bottom-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(245,158,11,0.05),transparent_60%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center lg:px-12">
          <div className="max-w-xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/80">
              Next step
            </div>
            <h3 className="mt-3 font-serif text-3xl text-white">
              Discuss a research or learning mandate
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              For institutional partnerships, research collaborations, or tailored
              learning programmes.
            </p>
          </div>

          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[10px] font-mono uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-white"
          >
            <span>Discuss mandate</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default EducationResearchPage;