"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, Lock, ArrowRight } from "lucide-react";

export default function ExecutiveReportSampleDownload() {
  return (
    <section className="relative border border-white/[0.08] bg-white/[0.02] p-10 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_40%,#f59e0b,transparent_60%)]" />

      <div className="relative max-w-3xl">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-400/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/60">
            Sample report
          </span>
        </div>

        <h2 className="mt-6 font-serif text-4xl text-white">
          See what a real executive report looks like
        </h2>

        <p className="mt-4 text-white/50 leading-relaxed">
          This is not a brochure. It is a redacted, real-format extract showing
          how narrative, domain scoring, and correction priorities are structured
          inside the reporting system.
        </p>

        <div className="mt-8 flex items-center gap-4 text-xs text-white/40">
          <Lock className="h-4 w-4" />
          <span>Redacted for confidentiality</span>
        </div>

        <a
          href="/downloads/executive-report-sample.pdf"
          className="group mt-10 inline-flex items-center gap-3 border border-amber-500/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 hover:bg-amber-500/10 transition-all"
        >
          <span>Download sample</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </section>
  );
}