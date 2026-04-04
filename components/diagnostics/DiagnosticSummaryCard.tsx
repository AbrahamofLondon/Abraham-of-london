/* components/diagnostics/DiagnosticSummaryCard.tsx */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Fingerprint } from "lucide-react";
import DiagnosticStatusPill from "@/components/diagnostics/DiagnosticStatusPill";

function toneFromBand(band: string): "neutral" | "good" | "warn" | "bad" {
  if (band === "stable") return "good";
  if (band === "watch") return "warn";
  if (band === "fragile" || band === "escalate") return "bad";
  return "neutral";
}

export default function DiagnosticSummaryCard({
  item,
  href,
}: {
  item: {
    diagnosticRef: string;
    submittedAt: string;
    kind: string;
    title: string;
    pct: number;
    band: string;
    severity: string;
    reportStatus: string;
    respondentName?: string | null;
    organisation?: string | null;
  };
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-white/[0.14] hover:bg-white/[0.03]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Fingerprint className="h-4 w-4 text-amber-400/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
              {item.diagnosticRef}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-2xl text-white">{item.title}</h3>

          <p className="mt-2 text-sm text-white/45">
            {item.respondentName || item.organisation || "Unnamed respondent"}
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <DiagnosticStatusPill label={item.kind} />
        <DiagnosticStatusPill label={item.band} tone={toneFromBand(item.band)} />
        <DiagnosticStatusPill label={`report ${item.reportStatus}`} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/6 pt-5">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
            Score
          </div>
          <div className="mt-2 font-serif text-lg text-white/84">{item.pct}%</div>
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
            Severity
          </div>
          <div className="mt-2 font-serif text-lg text-white/84">{item.severity}</div>
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
            Submitted
          </div>
          <div className="mt-2 font-serif text-lg text-white/84">
            {new Date(item.submittedAt).toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>
    </Link>
  );
}