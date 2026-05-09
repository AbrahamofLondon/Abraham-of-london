"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

type Props = {
  className?: string;
  defaultOpen?: boolean;
};

export default function DiagnosticStandardPanel({ className = "", defaultOpen = false }: Props) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className={`border border-white/10 bg-white/[0.02] ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Diagnostic standard
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-zinc-500" />
        ) : (
          <ChevronDown size={14} className="text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
          <p className="text-sm leading-6 text-zinc-400">
            This is a <strong className="text-zinc-300">decision-structure instrument</strong>,
            not medical, legal, financial, or clinical advice.
          </p>

          <div className="space-y-2">
            <BulletItem>
              It uses your supplied answers and recorded evidence to identify structural tensions and decision risk.
            </BulletItem>
            <BulletItem>
              It does not guarantee outcomes. Readings are strongest when combined with
              human review, team evidence, or follow-up execution data.
            </BulletItem>
            <BulletItem>
              This instrument has not been independently validated as a psychometric tool.
              Its value lies in structured decision triage, not clinical measurement.
            </BulletItem>
            <BulletItem>
              You remain responsible for all decisions made on the basis of these findings.
              Human review is available on request.
            </BulletItem>
          </div>

          <p className="text-xs leading-5 text-zinc-500 pt-1">
            For high-consequence decisions, we recommend combining instrument findings with
            independent professional review. Contact{" "}
            <a
              href="mailto:info@abrahamoflondon.org"
              className="text-amber-400/70 hover:text-amber-300"
            >
              info@abrahamoflondon.org
            </a>{" "}
            for guidance.
          </p>
        </div>
      )}
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm leading-6 text-zinc-400">
      <span className="mt-1 text-zinc-600 shrink-0">&#8226;</span>
      <span>{children}</span>
    </div>
  );
}
