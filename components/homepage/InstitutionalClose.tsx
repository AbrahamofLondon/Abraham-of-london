import * as React from "react";
import Link from "next/link";
import { ArrowRight, Vault, Layers } from "lucide-react";

export default function InstitutionalClose(): JSX.Element {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-r from-black via-amber-950/15 to-black p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-300">
                Next move
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl font-bold text-white">
                Don’t browse. Deploy.
              </h2>
              <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
                Pick an entry point and put the material to work — frameworks, vault assets, or the Canon spine.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/resources/strategic-frameworks"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Frameworks
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/downloads/vault"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-white/5 px-6 py-3 text-sm font-bold text-amber-200 hover:border-amber-400/40 hover:bg-white/10 transition-all"
              >
                <Vault className="h-4 w-4 text-amber-300" />
                Vault
              </Link>

              <Link
                href="/canon"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 hover:border-white/18 hover:bg-white/10 transition-all"
              >
                <Layers className="h-4 w-4 text-amber-300" />
                Canon
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}