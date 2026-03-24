/* components/alignment/EnterpriseAdvisoryCTA.tsx — Board-grade advisory CTA for enterprise diagnostic */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Crown, AlertTriangle } from "lucide-react";

type EnterpriseAdvisoryCTAProps = {
  title?: string;
  description?: string;
  intent?: string;
  showEscalationNote?: boolean;
};

export function EnterpriseAdvisoryCTA({
  title = "This diagnostic sits at the threshold of private chamber work",
  description = "When the signal is strong enough to warrant intervention, the next move is advisory, not another reading.",
  intent = "enterprise-alignment-diagnostic",
  showEscalationNote = true,
}: EnterpriseAdvisoryCTAProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-black via-amber-950/5 to-black p-8 md:p-10">
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            Advisory threshold
          </span>
        </div>

        <h3 className="font-serif text-2xl text-white md:text-3xl">{title}</h3>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
          {description}
        </p>

        {showEscalationNote && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
            <p className="text-sm text-white/50">
              <span className="font-semibold text-white/70">Escalation note:</span>{" "}
              If the enterprise diagnostic surfaces leadership gap, high team variance,
              or rising fragility signal, delay becomes a strategic error.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/contact?intent=${intent}`}
            className="group inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-amber-300 transition-all hover:bg-amber-500/18"
          >
            <ShieldCheck className="h-4 w-4" />
            Request diagnostic
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/consulting/strategy-room"
            className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/80 transition-all hover:border-white/20 hover:bg-white/10"
          >
            Private chamber
            <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseAdvisoryCTA;