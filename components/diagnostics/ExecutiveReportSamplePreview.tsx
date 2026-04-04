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

export default function ExecutiveReportSamplePreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr]">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <Surface className="overflow-hidden">
          <div className="border-b border-white/6 bg-white/[0.02] px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                  Executive Diagnostic Report
                </div>
                <h3 className="mt-3 font-serif text-3xl text-white">
                  Structural Misalignment Identified
                </h3>
              </div>

              <div className="border border-amber-500/18 bg-amber-500/[0.06] px-4 py-2">
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/74">
                  State
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  MISALIGNED
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/52">
              Execution remains active, but certainty is below sovereign threshold
              and talent pressure is compounding drag across the weakest operational domains.
            </p>
          </div>

          <div className="p-8">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Certainty", value: "82.35%" },
                { label: "Avg Dissonance", value: "25.5%" },
                { label: "Burnout", value: "71%" },
                { label: "State", value: "Hold" },
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
              <div className="grid grid-cols-[1.6fr,0.6fr,0.6fr,0.7fr] border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
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
                  className="grid grid-cols-[1.6fr,0.6fr,0.6fr,0.7fr] border-b border-white/[0.05] px-4 py-4 last:border-b-0"
                >
                  <div className="text-sm text-white/84">{item.label}</div>
                  <div className="text-sm text-white/58">{item.intent}%</div>
                  <div className="text-sm text-white/58">{item.reality}%</div>
                  <div
                    className={[
                      "text-sm font-semibold",
                      item.dissonance >= 30
                        ? "text-red-300"
                        : item.dissonance >= 15
                        ? "text-amber-300"
                        : "text-emerald-300",
                    ].join(" ")}
                  >
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
                    "Suspend execution — alignment not verified",
                    "Correct Operational Clarity first",
                    "Reduce leadership load concentration",
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
                    <div key={label} className="flex items-center justify-between border-b border-white/[0.05] pb-3 last:border-b-0 last:pb-0">
                      <span className="text-sm text-white/50">{label}</span>
                      <span className="font-serif text-lg text-white/88">{value}</span>
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
              "An executive artifact with strategic language, not generic assessment filler",
              "Readable by leadership without losing analytical sharpness",
              "Ties interpretation to correction priorities and exposure, not just scores",
              "Exportable into PDF and JSON for institutional use",
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
              Buyer signal
            </div>
          </div>

          <h4 className="mt-6 font-serif text-2xl text-white">
            This is what buyers remember.
          </h4>

          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Not the algorithm. Not the slider. The fact that the report helps
            them see what is actually wrong, what it is costing, and what must
            happen next.
          </p>
        </Surface>

        <Surface className="p-8">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-amber-400/68" />
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
      </motion.div>
    </div>
  );
}