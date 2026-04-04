"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Crown, Users } from "lucide-react";

export default function BuyerCTACluster() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Link
        href="/consulting/strategy-room"
        className="group border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-amber-400/68" />
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
            Founder-led
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl text-white">
          Commission founder review
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-white/50">
          For founder-led firms approaching complexity faster than internal clarity can support.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70">
          <span>Enter Strategy Room</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      <Link
        href="/diagnostics/executive-reporting"
        className="group border border-amber-500/24 bg-amber-500/[0.03] p-6 transition-colors hover:border-amber-500/42 hover:bg-amber-500/[0.05]"
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-amber-400/68" />
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
            Board / institution
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl text-white">
          View executive reporting
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-white/50">
          For boards and institutions needing disciplined interpretation before formal intervention.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70">
          <span>View flagship product</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      <Link
        href="/diagnostics"
        className="group border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-amber-400/68" />
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
            Leadership team
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl text-white">
          Start with diagnostics
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-white/50">
          For leadership teams needing a cleaner reading before deciding whether escalation is justified.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70">
          <span>Open diagnostics</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}