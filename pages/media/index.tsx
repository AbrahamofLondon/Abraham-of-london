import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Globe,
  ArrowRight,
  Radio,
  Mic2,
  FileText,
  MessageSquare,
} from "lucide-react";

import Layout from "@/components/Layout";

const MediaPage: NextPage = () => {
  return (
    <Layout
      title="Media | Abraham of London"
      description="Commentary, interviews, and public-facing media engagements shaped for clarity, discipline, and substance."
      canonicalUrl="/media"
      fullWidth
    >
      <Head>
        <meta property="og:title" content="Media | Abraham of London" />
        <meta
          property="og:description"
          content="Public communication with discipline. Commentary, interviews, and analysis shaped for clarity under scrutiny."
        />
      </Head>

      <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(245,158,11,0.08),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
              <Globe className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                Media • Commentary • Public engagement
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
              Public communication,
              <br />
              <span className="text-amber-400/90">disciplined message.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              Commentary, interviews, essays, and cultural analysis shaped for public
              communication without sacrificing clarity, seriousness, or intellectual discipline.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Public commentary
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <Radio className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Broadcast ready
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Editorial work
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
                Engagement formats
              </span>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                How the work appears in public
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Different formats. Same standard of thought, structure, and public clarity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Radio,
                title: "Interviews & commentary",
                text: "Broadcast-ready perspectives for public discussion, interviews, and strategic commentary shaped for clarity under pressure.",
                tag: "01",
              },
              {
                icon: Mic2,
                title: "Speaking requests",
                text: "Panels, podcasts, roundtables, and public forums requiring structure, composure, and a disciplined message.",
                tag: "02",
              },
              {
                icon: FileText,
                title: "Editorial contributions",
                text: "Articles, commentary pieces, and public-facing writing built to hold their shape under scrutiny.",
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
              Media engagement
            </div>
            <h3 className="mt-3 font-serif text-3xl text-white">
              Request a media conversation
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              For interview requests, speaking engagements, or editorial contributions.
            </p>
          </div>

          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[10px] font-mono uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-white"
          >
            <span>Request conversation</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default MediaPage;