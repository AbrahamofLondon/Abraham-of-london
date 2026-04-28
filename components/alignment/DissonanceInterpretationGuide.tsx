"use client";

import React from "react";

export default function DissonanceInterpretationGuide() {
  const reviewStates = [
    { state: "Structural Coherence", action: "Protocol Maintenance" },
    { state: "Elastic Drift", action: "Targeted Alignment" },
    { state: "Systemic Dissonance", action: "Forensic Audit" },
    { state: "Acute Fragility", action: "Institutional Reset" },
  ];

  return (
    <div className="print-guide mx-auto max-w-4xl bg-[#FDFBF7] p-0 shadow-2xl border border-[#D4C5A8]/30">
      {/* Premium Embossed Cover */}
      <div className="relative bg-gradient-to-br from-[#F5F2EA] to-[#EFEAE0] p-16 text-center border-b-2 border-[#D4C5A8]">
        {/* Corrected SVG Path for Strict TS/React Compliance */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 10 L40 20 L30 30 L20 20 Z\' fill=\'none\' stroke=\'%238A6A2F\' stroke-width=\'0.5\'/%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'15\' fill=\'none\' stroke=\'%238A6A2F\' stroke-width=\'0.5\'/%3E%3C/svg%3E')] bg-repeat" />
        
        <div className="relative space-y-6">
          <div className="inline-block border border-[#D4C5A8] bg-white/40 px-6 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">
              Institutional Framework
            </span>
          </div>
          
          <h1 className="font-serif text-6xl font-light tracking-tight text-[#2C2416]">
            Order Geometry<br />
            <span className="text-5xl italic text-[#8A6A2F]">Resonance</span>
          </h1>
          
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[#D4C5A8] to-transparent" />
          
          <p className="mx-auto max-w-md font-serif text-sm italic text-[#5C4E36]">
            The OGR-75 diagnostic for institutional coherence
          </p>
        </div>
      </div>

      {/* Document Body */}
      <div className="p-12">
        {/* Document Header */}
        <div className="mb-12 flex items-start justify-between border-b border-[#E8E0D4] pb-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#9B8A6B]">
              Classification: Restricted
            </span>
            <h2 className="mt-3 font-serif text-2xl font-light tracking-tighter text-[#2C2416]">
              Interpretative Framework
            </h2>
          </div>
          <div className="text-right font-mono text-[10px] text-[#C0B190]">
            Ref: AOL-OGR-2026<br />
            Copy № 01
          </div>
        </div>

        {/* Executive Reading */}
        <div className="mb-12 bg-gradient-to-r from-[#F5F2EA] to-transparent p-8 border-l-4 border-[#8A6A2F]">
          <p className="font-serif text-lg leading-relaxed text-[#4A3E2C]">
            The <span className="text-[#8A6A2F] italic">Dissonance Area</span> measures the spatial tension between disparate operating units. 
            A house divided remains standing in the statistics until the moment it collapses in the physics.
          </p>
        </div>

        {/* Review Table */}
        <div className="mb-12 bg-[#F9F6EF] p-8 border border-[#E8E0D4]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E8E0D4] text-left font-mono text-[10px] uppercase tracking-widest text-[#6B5A3E]">
                <th className="pb-4">State</th>
                <th className="pb-4 text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D4]">
              {reviewStates.map((row) => (
                <tr key={row.state} className="font-serif text-sm">
                  <td className="py-4 text-[#5C4E36]">{row.state}</td>
                  <td className="py-4 text-right font-mono text-[10px] text-[#8A6A2F] uppercase">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing Architecture */}
        <div className="mt-16 pt-8 border-t border-[#E8E0D4] flex justify-between items-end">
          <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#B8A77C]">
            © MMXXVI Abraham of London<br />
            Institutional Archive
          </div>
          <div className="text-right">
            <div className="font-serif italic text-neutral-500 text-xs italic">The Architect</div>
            <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 mt-1">
              Final Brief Authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
