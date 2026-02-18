// components/homepage/TrustSignals.tsx — SIGNAL PANEL (Institutional Standards)
// Goal: define your operating standards like an internal doctrine card.

import * as React from "react";
import { ShieldCheck, ArrowRight, ChevronRight } from "lucide-react";

type Signal = {
  label: string;
  detail: string;
  code: string;
};

export default function TrustSignals(): React.ReactElement {
  const signals: Signal[] = [
    {
      code: "STD-01",
      label: "Structured Intelligence",
      detail: "Briefings built like internal memos—concise, auditable, deployable.",
    },
    {
      code: "STD-02",
      label: "Operational Clarity",
      detail: "Inputs → logic → outputs. No mysticism. Just systems.",
    },
    {
      code: "STD-03",
      label: "Governance Discipline",
      detail: "Cadence, metrics, and review loops—the mechanics that keep it honest.",
    },
    {
      code: "STD-04",
      label: "Canon-Derived",
      detail: "Not random content. One doctrinal spine powering everything.",
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden">
      {/* texture: cleaner + less “busy” */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(245,158,11,0.20),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.42em] text-amber-200">
                Operating Standards
              </span>
            </div>

            <h2 className="mt-5 font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-white/95 tracking-tight">
              Signal, not noise.
            </h2>

            <p className="mt-3 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed">
              These standards describe how the platform thinks and ships—so visitors know exactly what they’re dealing with.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              doctrine-grade
            </span>
          </div>
        </div>

        {/* Panel */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/60">
          <div className="grid md:grid-cols-2 lg:grid-cols-4">
            {signals.map((signal, idx) => (
              <div
                key={signal.code}
                className="group relative p-8 md:p-9 bg-black/65 backdrop-blur-sm transition-all hover:bg-black/55"
              >
                {/* separators */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                  <div className="absolute inset-y-0 right-0 w-px bg-white/10 hidden lg:block" />
                </div>

                {/* top trace */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-25 group-hover:opacity-90 transition-opacity"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/35">
                    {signal.code}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/70 group-hover:text-amber-200 transition-colors">
                    {signal.label}
                  </div>
                </div>

                <p className="mt-5 text-[15px] md:text-[16px] font-serif text-white/85 leading-relaxed group-hover:text-white transition-colors">
                  {signal.detail}
                </p>

                <div className="mt-7 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/30 group-hover:text-amber-200/70 transition-colors">
                  indexed <ChevronRight className="h-3 w-3" />
                </div>

                {/* corner mark */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-amber-500/20 opacity-50 group-hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>

        {/* baseline */}
        <div className="mt-10 h-px w-40 bg-gradient-to-r from-amber-500/55 to-transparent" />
      </div>
    </section>
  );
}