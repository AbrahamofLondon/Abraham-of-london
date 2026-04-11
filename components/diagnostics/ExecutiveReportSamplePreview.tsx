"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  DollarSign,
  Layers,
  CheckCircle2,
  Scale,
  TrendingUp,
} from "lucide-react";

type SampleMetric = {
  label: string;
  intent: number;
  reality: number;
  dissonance: number;
};

const SAMPLE_METRICS: SampleMetric[] = [
  { label: "Operational Clarity", intent: 88, reality: 47, dissonance: 41 },
  { label: "Leadership Trust", intent: 92, reality: 61, dissonance: 31 },
  { label: "Strategic Intent", intent: 95, reality: 74, dissonance: 21 },
  { label: "Cultural Cohesion", intent: 85, reality: 76, dissonance: 9 },
];

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm",
        "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function toneClass(value: number): string {
  if (value >= 30) return "text-red-300";
  if (value >= 15) return "text-amber-300";
  return "text-emerald-300";
}

export default function ExecutiveReportSamplePreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <Surface className="overflow-hidden">
          <div className="border-b border-white/6 bg-white/[0.02] px-8 py-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                  Executive Diagnostic Report
                </div>
                <h3 className="mt-3 font-serif text-3xl text-white">
                  Structural Misalignment Identified
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-white/54">
                  Execution remains active, but certainty has fallen below sovereign
                  threshold and leadership pressure is compounding drag across the
                  weakest operational domains.
                </p>
              </div>

              <div className="min-w-[140px] border border-amber-500/18 bg-amber-500/[0.06] px-4 py-3">
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/74">
                  State
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  MISALIGNED
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Certainty", value: "82.35%" },
                { label: "Avg Dissonance", value: "25.5%" },
                { label: "Burnout", value: "71%" },
                { label: "Bias", value: "Hold" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-white/[0.06] bg-black/25 p-4"
                >
                  <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
                    {item.label}
                  </div>
                  <div className="mt-2 font-serif text-2xl text-white/88">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden border border-white/[0.06]">
              <div className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.7fr] border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                {["Domain", "Intent", "Reality", "Gap"].map((label) => (
                  <div
                    key={label}
                    className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/32"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {SAMPLE_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.7fr] border-b border-white/[0.05] px-4 py-4 last:border-b-0"
                >
                  <div className="text-sm text-white/84">{item.label}</div>
                  <div className="text-sm text-white/58">{item.intent}%</div>
                  <div className="text-sm text-white/58">{item.reality}%</div>
                  <div className={`text-sm font-semibold ${toneClass(item.dissonance)}`}>
                    {item.dissonance}%
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="border border-white/[0.06] bg-black/25 p-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400/68" />
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/34">
                    Priority stack
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Suspend execution where alignment is unverified",
                    "Correct Operational Clarity before scaling activity",
                    "Reduce leadership load concentration immediately",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/66" />
                      <span className="text-sm leading-relaxed text-white/56">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/[0.06] bg-black/25 p-5">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-400/68" />
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/34">
                    Financial exposure
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    ["Replacement Cost", "$276.5K"],
                    ["Execution Loss", "$38.2K"],
                    ["Total Exposure", "$314.7K"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-white/[0.05] pb-3 last:border-b-0 last:pb-0"
                    >
                      <span className="text-sm text-white/50">{label}</span>
                      <span className="font-serif text-lg text-white/88">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.08 }}
        className="space-y-6"
      >
        <Surface className="p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400/68" />
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/76">
              What makes this premium
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "Executive language rather than assessment filler",
              "Readable by leadership without losing analytical sharpness",
              "Ties interpretation to exposure and correction priority",
              "Structured for PDF and institutional circulation",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/70" />
                <span className="text-sm leading-relaxed text-white/54">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400/68" />
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/76">
              What buyers remember
            </div>
          </div>

          <h4 className="mt-6 font-serif text-2xl text-white">
            Not the algorithm. The clarity.
          </h4>

          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Buyers remember that the report helped them see what was actually
            wrong, what it was costing, and what had to happen next.
          </p>
        </Surface>

        <Surface className="p-8">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-amber-400/68" />
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/76">
              Positioning summary
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-white/52">
            A premium executive reporting niche for founders, boards, and serious
            operators who need disciplined interpretation before intervention,
            not vague dashboards after instability.
          </p>
        </Surface>

        <Surface className="p-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-amber-400/68" />
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/76">
              Product effect
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-white/52">
            It raises the quality of the conversation before a mandate begins,
            which is exactly why the mandate later lands with more credibility.
          </p>
        </Surface>
      </motion.div>
    </div>
  );
}