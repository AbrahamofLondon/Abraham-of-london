import * as React from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

export default function CanonInstitutionalIntro(): JSX.Element {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-950/20 to-black p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2">
                <Layers className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-amber-200">
                  The spine
                </span>
              </div>

              <h2 className="mt-5 font-serif text-3xl md:text-4xl font-bold text-white">
                The Canon is the system.
              </h2>

              <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
                Most sites show “content.” This shows an operating library. The Canon is the foundation — and everything
                else is a deployment from that foundation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                <BookOpen className="h-4 w-4" />
                Start here
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href="/canon"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 hover:border-white/18 hover:bg-white/10 transition-all"
              >
                Browse Canon
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <MiniPill title="Purpose architecture" body="Meaning, formation, direction — from first principles." />
            <MiniPill title="Governance & continuity" body="Cadence, metrics, stewardship — systems that last." />
            <MiniPill title="Civilisation & legacy" body="Institutions, culture, outcomes — generational design." />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniPill({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/60 leading-relaxed">{body}</div>
    </div>
  );
}