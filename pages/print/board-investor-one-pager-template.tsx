// pages/print/board-investor-one-pager-template.tsx
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";
import PullLine from "@/components/PullLine";
import EmbossedSign from "@/components/print/EmbossedSign";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";

---
title: "Weekly Operating Rhythm"
slug: "weekly-operating-rhythm"
date: "2024-10-01"
author: "AbrahamogLondon"
readTime: "5 min"
category: "Operations"
type: "Download"
---

export default function BoardInvestorTemplate() {
 return (
  <BrandFrame
   title="Board/Investor One-Pager Template"
   subtitle="Communicate clearly, concisely, and consistently with your board and investors."
   pageSize="A4"
   marginsMm={15}
   // author="Abraham of London"
   // date={new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date())}
  >
   <section aria-labelledby="topline">
    <PullLine>
     Respect their time. Lead with the punchline. This one-pager forces clarity.
    </PullLine>

    <h2 id="topline" className="mt-8 font-serif text-2xl text-forest">
     Top-Line Metrics (Header)
    </h2>

    <div className="grid grid-cols-2 gap-4 rounded-lg border border-lightGrey bg-warmWhite p-4 sm:grid-cols-4">
     <div className="flex flex-col">
      <span className="text-xs font-semibold opacity-60">Reporting Period:</span>
      <span className="text-lg font-mono text-deepCharcoal">(e.g., September 2025)</span>
     </div>
     <div className="flex flex-col">
      <span className="text-xs font-semibold opacity-60">Runway:</span>
      <span className="text-lg font-mono text-deepCharcoal">(in months)</span>
     </div>
     <div className="flex flex-col">
      <span className="text-xs font-semibold opacity-60">MRR / Revenue:</span>
      <span className="text-lg font-mono text-deepCharcoal">(Current Status)</span>
     </div>
     <div className="flex flex-col">
      <span className="text-xs font-semibold opacity-60">Gross Margin:</span>
      <span className="text-lg font-mono text-deepCharcoal">(Current %)</span>
     </div>
    </div>
   </section>

   <section aria-labelledby="summary" className="mt-10">
    <h2 id="summary" className="font-serif text-2xl text-forest">
     Performance Summary (The 3×3)
    </h2>
    <p className="text-sm italic opacity-80">Be brutally honest in this section. Facts, not optimism.</p>

    <div className="mt-4 overflow-x-auto">
     <table className="w-full border-collapse">
      <thead>
       <tr className="bg-[color:var(--color-primary)/0.1] text-forest">
        <th className="border-b-2 border-[color:var(--color-primary)/0.2] p-3 text-left">Category</th>
        <th className="border-b-2 border-[color:var(--color-primary)/0.2] p-3 text-left">Item 1</th>
        <th className="border-b-2 border-[color:var(--color-primary)/0.2] p-3 text-left">Item 2</th>
        <th className="border-b-2 border-[color:var(--color-primary)/0.2] p-3 text-left">Item 3</th>
       </tr>
      </thead>
      <tbody>
       <tr className="border-b border-lightGrey/60">
        <td className="p-3 font-bold text-deepCharcoal">Highlights (Wins)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(Concrete, measurable success)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(Team or product milestone)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(Major risk mitigated)</td>
       </tr>
       <tr className="bg-warmWhite/50">
        <td className="p-3 font-bold text-deepCharcoal">Lowlights (Concerns)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(Revenue/pipeline gap)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(Key hire missing/churn)</td>
        <td className="p-3 text-sm text-[color:var(--color-on-secondary)/0.8]">(External market risk)</td>
       </tr>
      </tbody>
     </table>
    </div>
   </section>

   <section aria-labelledby="asks" className="mt-10">
    <h2 id="asks" className="font-serif text-2xl text-forest">
     The Asks (How They Can Help)
    </h2>

    <ol className="list-decimal space-y-3 pl-6">
     <li>
      <strong className="text-forest">(Specific Ask 1):</strong>{" "}
      <span className="italic opacity-80">e.g., Introduction to X for partnership.</span>
     </li>
     <li>
      <strong className="text-forest">(Specific Ask 2):</strong>{" "}
      <span className="italic opacity-80">e.g., 30 minutes to pressure-test the 2026 budget.</span>
     </li>
     <li>
      <strong className="text-forest">(Specific Ask 3):</strong>{" "}
      <span className="italic opacity-80">e.g., Advice on supplier contract negotiation.</span>
     </li>
    </ol>
   </section>

   <section aria-labelledby="optional" className="mt-10">
    <h2 id="optional" className="font-serif text-2xl text-forest">Optional Section</h2>
    <p className="opacity-90">
     Include <em>one</em> visual aid: a small chart showing revenue growth, burn rate, or customer retention
     over the last 6 months.
    </p>

    <div className="mt-12 text-center">
     <EmbossedBrandMark
      src="/assets/images/logo/abraham-of-london-logo.svg"
      alt="Abraham of London Brand Mark"
      width={80}
      height={80}
      effect="deboss"
      className="inline-block"
     />
    </div>
   </section>

   {/* Signature row (optional) */}
   <div className="mt-14 flex items-end justify-end">
    <div className="flex flex-col items-end">
     <EmbossedSign
      src="/assets/images/signature/abraham-of-london-cursive.svg"
      alt="Abraham of London Signature"
      width={120}
      height={30}
      effect="deboss"
     />
     <span className="mt-1 text-xs text-[color:var(--color-on-secondary)/0.6]">A.o.L. Standards</span>
    </div>
   </div>
  </BrandFrame>
 );
}