import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Scale, TrendingUp } from "lucide-react";

export default function MarketIntelligenceFeature() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#08131F] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.05] aol-grain" />

      <div className="relative mx-auto max-w-7xl px-6 py-18 md:px-10 md:py-22">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
              <TrendingUp className="h-3.5 w-3.5" />
              Featured Intelligence
            </div>

            <h2 className="mt-6 font-serif text-3xl leading-tight text-white/95 md:text-5xl">
              Global Market Intelligence Q1 2026
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/70 md:text-base">
              A disciplined reading of a harder market, structured in public,
              institutional, and boardroom layers for serious operators.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/intelligence/global-market-intelligence-q1-2026"
                className="inline-flex items-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                Open intelligence surface
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/artifacts/global-market-outlook-q1-2026-public"
                className="inline-flex items-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
              >
                Public brief
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]">
                <Lock className="h-3.5 w-3.5" />
                Institutional Edition
              </div>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Full restricted briefing for sharper interpretation, stronger
                framing, and better board-level utility.
              </p>
              <Link
                href="/artifacts/global-market-intelligence-report-q1-2026"
                className="mt-4 inline-flex items-center text-sm font-semibold text-white"
              >
                Open institutional edition
                <ArrowRight className="ml-2 h-4 w-4 text-[#C9A96A]" />
              </Link>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]">
                <Scale className="h-3.5 w-3.5" />
                Boardroom PDF
              </div>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Premium portable format for executives, review packs, and cleaner
                internal circulation.
              </p>
              <Link
                href="/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf"
                className="mt-4 inline-flex items-center text-sm font-semibold text-white"
              >
                Open boardroom PDF
                <ArrowRight className="ml-2 h-4 w-4 text-[#C9A96A]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}