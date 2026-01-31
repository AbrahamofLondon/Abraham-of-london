// components/homepage/OperatorBriefing.tsx — DECLASSIFIED BRIEF (viral, institutional, premium)
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ScrollText, Shield } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type BriefLine = {
  title: string;
  body: string;
};

export default function OperatorBriefing() {
  const lines: BriefLine[] = [
    {
      title: "Every strategy must survive cross-examination.",
      body: "If it can’t withstand scrutiny, it isn’t strategy — it’s theatre.",
    },
    {
      title: "Cadence is the hidden engine.",
      body: "Install routines and decision rights; performance becomes a habit.",
    },
    {
      title: "Ethics isn’t branding. It’s load-bearing.",
      body: "Character shows up in controls, incentives, and accountability loops.",
    },
  ];

  return (
    <section className="relative bg-black py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(245,158,11,0.10),transparent_55%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Briefing header */}
          <div className="lg:col-span-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Operator briefing
            </p>

            <h2 className="mt-6 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
              A memo for serious people.
            </h2>

            <p className="mt-6 text-lg font-light leading-relaxed text-gray-300">
              If someone forwards this page, it’s because it doesn’t feel like the internet.
              It feels like governance.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-4 text-sm font-bold text-black shadow-2xl shadow-amber-900/25 transition-all duration-300 hover:scale-[1.02]"
              >
                Strategic Frameworks <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/blog/ultimate-purpose-of-man"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-semibold text-gray-200 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <ScrollText className="h-4 w-4 text-amber-300" />
                Ultimate Purpose <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Declassified card */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl">
              {/* top rail */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 p-2 text-amber-300">
                    <Shield className="h-full w-full" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                      Governance-grade notes
                    </p>
                    <p className="mt-1 text-sm font-light text-gray-300">
                      Built for builders who deploy, not spectators who scroll.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200">
                    declassified extract
                  </span>
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {lines.map((x) => (
                  <div key={x.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-amber-100">{x.title}</p>
                        <p className="mt-2 text-sm font-light leading-relaxed text-gray-300">
                          {x.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* bottom rail */}
              <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-light text-gray-300">
                  Want the artefacts behind the method? Templates, packs, and operator notes live in the Vault.
                </p>

                <Link
                  href="/downloads/vault"
                  className={cx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl",
                    "border border-amber-400/25 bg-amber-500/10 px-6 py-3",
                    "text-sm font-semibold text-amber-200 transition-all duration-300",
                    "hover:border-amber-400/45 hover:bg-amber-500/15"
                  )}
                >
                  <Lock className="h-4 w-4 text-amber-300" />
                  Open Vault <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* aura */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.08),transparent_60%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}