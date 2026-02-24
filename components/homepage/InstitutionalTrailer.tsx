'use client';

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function InstitutionalTrailer() {
  return (
    <section className="relative bg-black overflow-hidden border-t border-white/5">
      {/* Subtle cinematic gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.06),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-36 text-center">

        {/* Overline */}
        <div className="text-[10px] font-mono uppercase tracking-[0.45em] text-amber-500/60">
          Institutional Trailer
        </div>

        {/* Primary Statement */}
        <h2 className="mt-8 font-serif text-4xl md:text-6xl text-white leading-tight tracking-tight text-balance">
          Civilisation is not an accident.
        </h2>

        <h3 className="mt-6 font-serif text-2xl md:text-3xl text-white/80 italic text-balance">
          It is designed.
        </h3>

        {/* Core Manifesto */}
        <p className="mt-12 max-w-3xl mx-auto text-lg md:text-xl text-white/60 leading-relaxed font-light text-pretty">
          Strategy without doctrine collapses.
          Doctrine without structure drifts.
          Power without moral architecture corrodes.
        </p>

        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-white/60 leading-relaxed font-light text-pretty">
          This platform exists to restore architectural thinking —
          in men, in institutions, and in nations.
        </p>

        {/* Signature Line */}
        <div className="mt-16 text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
          Doctrine ▸ Structure ▸ Cadence ▸ Deployment
        </div>

        {/* Action Row */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">

          <Link
            href="/canon"
            className="group px-8 py-4 rounded-full border border-white/15 bg-white/[0.02]
              text-[10px] font-mono uppercase tracking-[0.35em] text-white/80
              hover:text-white hover:border-amber-500/40 hover:bg-amber-500/5
              transition-all duration-300"
          >
            Explore the Canon
            <ArrowRight className="ml-2 h-4 w-4 inline-block text-white/30 group-hover:text-amber-400 transition-all" />
          </Link>

          <Link
            href="/downloads/vault"
            className="px-8 py-4 rounded-full bg-amber-600
              text-[10px] font-mono uppercase tracking-[0.35em] text-white
              hover:bg-amber-700 transition-all duration-300 shadow-lg shadow-amber-900/20"
          >
            Enter the Vault
          </Link>

        </div>
      </div>
    </section>
  );
}