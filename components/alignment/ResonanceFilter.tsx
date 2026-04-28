"use client";

import React from "react";

export default function ResonanceFilter() {
  return (
    <div className="mx-auto my-20 max-w-4xl rounded-[28px] border border-[#D4C5A8]/30 bg-[#FDFBF7] p-12 text-[#2C2416] shadow-sm">
      <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#8A6A2F]">
        Strategic Fit Review
      </div>
      <h2 className="mt-4 font-serif text-4xl tracking-tight">
        This public surface now shows the outcome, not the calibration model
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#5C4E36]">
        The detailed fit model for this instrument is non-public. Public-facing
        surfaces should show the reading, the directive, and the next action,
        not the internal calibration criteria.
      </p>
      <div className="mt-8 rounded-[22px] border border-[#D4C5A8]/30 bg-white p-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#8A6A2F]">
          Governed output
        </div>
        <div className="mt-3 text-2xl font-semibold text-[#2C2416]">
          Under Review
        </div>
        <p className="mt-3 text-sm leading-7 text-[#5C4E36]">
          Use the governed assessment route to retrieve a public-safe reading
          with posture, required action, and escalation status.
        </p>
      </div>
    </div>
  );
}
