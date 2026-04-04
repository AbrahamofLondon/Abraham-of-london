"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EXECUTIVE_DEMO_SCENARIOS } from "@/lib/diagnostics/executive-reporting-market-proof";

export default function ExecutiveDemoScenarios() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {EXECUTIVE_DEMO_SCENARIOS.map((item, index) => (
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.08 }}
          className="border border-white/[0.08] bg-white/[0.02] p-8"
        >
          <div className="flex items-center justify-between gap-4">
            <FileText className="h-5 w-5 text-amber-400/68" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/56">
              {item.label}
            </span>
          </div>

          <h3 className="mt-6 font-serif text-2xl text-white">{item.title}</h3>

          <p className="mt-4 text-sm leading-relaxed text-white/48">
            {item.context}
          </p>

          <div className="mt-6 border-l border-amber-500/28 pl-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400/68" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                Trigger
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/54">
              {item.trigger}
            </p>
          </div>

          <div className="mt-7">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
              Example findings
            </div>
            <div className="mt-3 space-y-3">
              {item.findings.map((finding) => (
                <div key={finding} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/66" />
                  <span className="text-sm text-white/54">{finding}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-white/6 pt-5">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/32">
              Output value
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/56">
              {item.output}
            </p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}