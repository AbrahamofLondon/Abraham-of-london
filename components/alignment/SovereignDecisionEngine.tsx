"use client";

import React from "react";

export default function SovereignDecisionEngine() {
  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,13,0.96)_0%,rgba(6,6,7,0.98)_100%)] p-10 text-white shadow-[0_32px_90px_-55px_rgba(0,0,0,0.95)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D6B77A]">
        Sovereign Decision Review
      </div>
      <h3 className="mt-4 font-serif text-3xl leading-tight">
        Public surfaces no longer expose the internal execution model
      </h3>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
        This surface previously disclosed private operating logic. It now serves
        as a public-safe shell and should be connected only to governed outputs:
        state, posture, summary, directive, and recommended next step.
      </p>
      <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.03] p-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
          Current status
        </div>
        <div className="mt-3 text-2xl font-semibold text-white">Governed completion only</div>
      </div>
    </div>
  );
}
