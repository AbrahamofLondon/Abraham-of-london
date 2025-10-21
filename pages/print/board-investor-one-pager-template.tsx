// pages/print/board-investor-one-pager-template.tsx
import * as React from "react";
// FIX: Changed alias @/ to relative path ../../ for correct Webpack resolution
import BrandFrame from "../../components/print/BrandFrame";
import PullLine from '../components/PullLine';
import EmbossedBrandMark from '../components/print/EmbossedBrandMark';

export default function BoardInvestorTemplate() {
  return (
    <BrandFrame
      title="Board/Investor One-Pager Template"
      subtitle="Communicate clearly, concisely, and consistently with your board and investors."
      pageSize="A4"
      marginsMm={15}
    >
      <PullLine subtle>
        Respect their time. Lead with the punchline. This one-pager forces clarity.
      </PullLine>

      <h2 className="mt-8 font-serif text-2xl text-forest">Top-Line Metrics (Header)</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-lightGrey rounded-lg bg-warmWhite">
        <div className="flex flex-col">
          <span className="text-xs font-semibold opacity-60">
            Reporting Period:
          </span>
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

      <h2 className="mt-10 font-serif text-2xl text-forest">Performance Summary (The 3×3)</h2>
      <p className="italic text-sm opacity-80">
        Be brutally honest in this section. Facts, not optimism.
      </p>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-[color:var(--color-primary)/0.1] text-forest">
            <th className="p-3 text-left border-b-2 border-[color:var(--color-primary)/0.2]">Category</th>
            <th className="p-3 text-left border-b-2 border-[color:var(--color-primary)/0.2]">Item 1</th>
            <th className="p-3 text-left border-b-2 border-[color:var(--color-primary)/0.2]">Item 2</th>
            <th className="p-3 text-left border-b-2 border-[color:var(--color-primary)/0.2]">Item 3</th>
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

      <h2 className="mt-10 font-serif text-2xl text-forest">The Asks (How They Can Help)</h2>
      <ol className="list-decimal pl-6 space-y-3">
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

      <h2 className="mt-10 font-serif text-2xl text-forest">Optional Section</h2>
      <p className="opacity-90">
        Include <em>one</em> visual aid: a small chart showing revenue growth, burn rate,
        or customer retention over the last 6 months.
      </p>

      <div className="mt-12 text-center">
        <EmbossedBrandMark
          src="/assets/images/logo/abraham-of-london-logo.svg"
          alt="Abraham of London Brand Mark"
          width={80}
          height={80}
          effect="deboss"
          className="inline-block"
          baseColor="transparent"
        />
      </div>
    </BrandFrame>
  );
}