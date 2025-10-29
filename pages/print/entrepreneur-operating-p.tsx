// pages/print/entrepreneur-operating-pack.tsx

import BrandFrame from "../../components/print/BrandFrame";
import EmbossedBrandMark from "../../components/EmbossedBrandMark";
import { PullLine, Rule } from "../../components/utils";
import * as React from "react";



export const frontmatter = {
 export const frontmatter = {
 title: "Entrepreneur Operating Pack"
 slug: "entreprenuer-operating-pack"
 date: "2024-10-22"
 author: "AbrahamofLondon"
 readTime: "5 min"
 category: "Operations"
 type: "Download"
};

const EntrepreneurOperatingPack = () => {
  return (
    <BrandFrame
      title="Entrepreneur Operating Pack — Week-in-Review System"
      subtitle="Operate on cadence, conserve cash, and communicate cleanly — especially under pressure."
      pageSize="A4"
    >
      {/* --- Branding: Logo Top Left --- */}
      <div className="absolute top-0 left-0">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={40}
              height={40}
              effect="emboss"
              baseColor="transparent"
          />
      </div>

      <PullLine subtle>Clarity beats comfort. Systems beat hustle. Operate like the franchise depends on it.</PullLine>

      <h2 className="mt-8">Weekly Operating Rhythm</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Monday Plan:</strong> Top 3 outcomes, calendar audit, resource check.</li>
        <li><strong>Daily Blocks:</strong> Focus (90m), Admin (45m), People (45m), Buffer (30m).</li>
        <li><strong>Friday Review:</strong> Score outcomes (0–1), learnings, next week preview.</li>
      </ul>

      <Rule className="my-8" />

      <h2>Survival Checklist (Cash &amp; Sanity)</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>13-week cash forecast; update weekly.</li>
        <li>Pipeline targets: <strong>20 conversations → 5 proposals → 2 deals</strong>.</li>
        <li>Stoplist: kill two low-yield tasks each week.</li>
      </ul>

      <Rule className="my-8" />

      <h2>Board/Investor One-Pager (Template)</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Header:</strong> Month, Runway (months), MRR/Revenue, Gross Margin.</li>
        <li><strong>Highlights (3)</strong> • <strong>Lowlights (3)</strong> • <strong>Asks (3)</strong>.</li>
        <li>Optional: one small chart.</li>
      </ul>

      <Rule className="my-8" />

      <h2>Crisis Cadence</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>Daily standup (15m): facts, risks, next steps. Freeze new initiatives.</li>
        <li>Communicate early and plainly.</li>
      </ul>

      {/* --- Branding: Certified Mark Bottom Center (Seal) --- */}
      <div className="mt-12 text-center pt-6 border-t border-lightGrey/80">
        <EmbossedBrandMark
            src="/assets/images/abraham-logo.jpg"
            alt="Abraham of London Certified Mark"
            width={100}
            height={100}
            effect="emboss"
            className="inline-block"
            baseColor="transparent"
        />
      </div>
    </BrandFrame>
  );
};

export default EntrepreneurOperatingPack;