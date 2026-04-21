"use client";

import * as React from "react";
import { FileText, Lock, ArrowRight, ShieldCheck, Download } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function ExecutiveReportSampleDownload() {
  return (
    <section
      className={cn(
        "relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8 md:p-10",
        "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
      )}
    >
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_40%,#f59e0b,transparent_60%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-400/70" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/60">
              Sample report
            </span>
          </div>

          <h2 className="mt-6 max-w-[16ch] font-serif text-3xl leading-tight text-white md:text-4xl">
            See what a real executive report looks like
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/54 md:text-base">
            This is not a brochure. It is a redacted, real-format extract showing
            how narrative, domain scoring, financial exposure, and correction
            priorities are structured inside the reporting system.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Format", value: "Executive PDF" },
              { label: "Status", value: "Redacted" },
              { label: "Purpose", value: "Buyer clarity" },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-white/[0.08] bg-black/20 p-4"
              >
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                  {item.label}
                </div>
                <div className="mt-2 font-serif text-lg text-white/86">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-white/42">
            <div className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400/70" />
              <span>Redacted for confidentiality</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400/70" />
              <span>Real structure, controlled exposure</span>
            </div>
          </div>

          <a
            href="#" /* TODO: executive-report-sample.pdf needs to be created and placed in /public/assets/downloads/ */
            className="group mt-10 inline-flex items-center gap-3 border border-amber-500/30 bg-amber-500/[0.06] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300 transition-all hover:bg-amber-500/12"
          >
            <Download className="h-4 w-4" />
            <span>Download sample</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="border border-white/[0.08] bg-black/20 p-6 md:p-7">
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/70">
            Why this matters
          </div>

          <div className="mt-5 space-y-4">
            {[
              "Buyers should see the product standard before they evaluate the price.",
              "A real sample removes ambiguity faster than polished claims.",
              "The format itself communicates seriousness, judgment, and operating quality.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-amber-400/70" />
                <span className="text-sm leading-relaxed text-white/56">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-white/6 pt-6">
            <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
              Commercial effect
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/54">
              It helps the buyer understand that this is not a decorative output.
              It is a decision-facing artifact designed to clarify what is wrong,
              what it is costing, and what must happen next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}