import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Users,
  Eye,
  KeyRound,
} from "lucide-react";

import Layout from "@/components/Layout";

const PrivateClientsPage: NextPage = () => {
  return (
    <Layout
      title="Private Clients | Abraham of London"
      description="Confidential strategic advisory for principals, founders, and select private mandates where discretion and judgment matter."
      canonicalUrl="/private-clients"
      fullWidth
    >
      <Head>
        <meta property="og:title" content="Private Clients | Abraham of London" />
        <meta
          property="og:description"
          content="Quiet advisory. Serious discretion. Bespoke strategic support for principals and founders."
        />
      </Head>

      <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(245,158,11,0.04),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                Private • Confidential • Select access
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
              Quiet advisory.
              <br />
              <span className="text-amber-400/90">Serious discretion.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              Bespoke strategic support for principals, founders, and select
              private mandates where confidentiality and judgment matter more than volume.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Strict confidence
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <KeyRound className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Select access
                </span>
              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-amber-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  Deliberate scope
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
                Areas of engagement
              </span>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                Built for trust, not scale
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Deliberately limited access. Each engagement is treated as a serious
              advisory relationship, not a volume service.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Confidential strategy",
                text: "Private strategic counsel for sensitive decisions and high-consequence environments, handled with discretion and clear boundaries.",
                tag: "01",
              },
              {
                icon: Briefcase,
                title: "Principal advisory",
                text: "Focused support for leadership judgment, positioning, and long-range strategic thinking with direct access and direct accountability.",
                tag: "02",
              },
              {
                icon: Users,
                title: "Select engagements",
                text: "Deliberately limited capacity. Not built for volume. Built for quality, continuity, and trust over time.",
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(245,158,11,0.03),transparent_60%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center lg:px-12">
          <div className="max-w-xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/80">
              Confidential inquiry
            </div>
            <h3 className="mt-3 font-serif text-3xl text-white">
              Request a private conversation
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              For principals and their representatives. Initial contact is handled
              discreetly and with clear boundaries from the outset.
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

export default PrivateClientsPage;