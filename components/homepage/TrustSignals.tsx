import * as React from "react";

export default function TrustSignals(): React.ReactElement {
  const signals = [
    {
      label: "Structured Intelligence",
      detail: "Briefings built like internal memos—concise, auditable, deployable.",
    },
    {
      label: "Operational Clarity",
      detail: "Inputs → logic → outputs. No mysticism. Just systems.",
    },
    {
      label: "Governance Discipline",
      detail: "Cadence, metrics, review loops. The mechanics that make it work.",
    },
    {
      label: "Canon-Derived",
      detail: "Not random content. One doctrinal spine powering everything.",
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Subtle grid texture (kept, but disciplined) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(245,158,11,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(245,158,11,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(212,175,55,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(212,175,55,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-14 md:py-16">
        {/* Header: stronger presence */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.42em] text-amber-200">
                Institutional posture
              </span>
            </span>

            <h2 className="mt-5 font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-white/95 tracking-tight">
              Signal, not noise.
            </h2>

            <p className="mt-3 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed">
              These are the operating standards behind the platform—how ideas become execution,
              and execution survives pressure.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              Builder-grade
            </span>
          </div>
        </div>

        {/* Cards: bolder edges + clearer typography */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/60 overflow-hidden">
          <div className="grid md:grid-cols-2 lg:grid-cols-4">
            {signals.map((signal) => (
              <div
                key={signal.label}
                className="group relative p-8 md:p-9 bg-black/70 backdrop-blur-sm transition-all"
              >
                {/* separators */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                  <div className="absolute inset-y-0 right-0 w-px bg-white/10 hidden lg:block" />
                </div>

                {/* top glow line */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-40 group-hover:opacity-100 transition-opacity"
                />

                <div className="text-[11px] font-mono uppercase tracking-[0.34em] text-amber-200/70 group-hover:text-amber-200 transition-colors">
                  {signal.label}
                </div>

                <p className="mt-5 text-base md:text-[17px] font-serif text-white/85 leading-relaxed group-hover:text-white transition-colors">
                  {signal.detail}
                </p>

                {/* corner mark */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-amber-500/25 opacity-50 group-hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Baseline */}
        <div className="mt-10 h-px w-40 bg-gradient-to-r from-amber-500/60 to-transparent" />
      </div>
    </section>
  );
}