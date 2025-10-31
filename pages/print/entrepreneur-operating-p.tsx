// pages/print/entrepreneur-operating-p.tsx
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";

/** Frontmatter used by your site tooling */
export const frontmatter = {
  title: "Entrepreneur Operating Pack",
  slug: "entrepreneur-operating-pack",
  date: "2024-10-22",
  author: "Abraham of London",
};

// --- Local helpers (avoid missing '@/components/mdx' imports) ---
function Rule({ className = "" }: { className?: string }) {
  return <hr className={`my-8 border-0 h-px bg-gray-200 ${className}`} />;
}
function PullLine({
  children,
  subtle = false,
}: {
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <p
      className={
        subtle
          ? "mt-6 border-l-2 border-amber-600 pl-4 text-[0.98rem] text-gray-600"
          : "mt-6 text-[1.05rem] italic text-amber-700 text-center"
      }
    >
      {children}
    </p>
  );
}

export default function EntrepreneurOperatingPack() {
  return (
    <BrandFrame
      title="Entrepreneur Operating Pack — Week-in-Review System"
      subtitle="Operate on cadence, conserve cash, and communicate cleanly — especially under pressure."
      pageSize="A4"
    >
      {/* Logo top-left */}
      <div className="absolute left-0 top-0">
        <EmbossedBrandMark
          src="/assets/images/abraham-logo.jpg"
          alt="Abraham of London Logo"
          width={40}
          height={40}
          effect="emboss"
          baseColor="transparent"
        />
      </div>

      <PullLine subtle>
        Clarity beats comfort. Systems beat hustle. Operate like the franchise
        depends on it.
      </PullLine>

      <h2 className="mt-8 text-xl font-serif">Weekly Operating Rhythm</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Monday Plan:</strong> Top 3 outcomes, calendar audit, resource
          check.
        </li>
        <li>
          <strong>Daily Blocks:</strong> Focus (90m), Admin (45m), People (45m),
          Buffer (30m).
        </li>
        <li>
          <strong>Friday Review:</strong> Score outcomes (0–1), learnings, next
          week preview.
        </li>
      </ul>

      <Rule />

      <h2 className="text-xl font-serif">Survival Checklist (Cash &amp; Sanity)</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>13-week cash forecast; update weekly.</li>
        <li>
          Pipeline targets: <strong>20 conversations → 5 proposals → 2 deals</strong>.
        </li>
        <li>Stoplist: kill two low-yield tasks each week.</li>
      </ul>

      <Rule />

      <h2 className="text-xl font-serif">Board/Investor One-Pager (Template)</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Header:</strong> Month, Runway (months), MRR/Revenue, Gross
          Margin.
        </li>
        <li>
          <strong>Highlights (3)</strong> • <strong>Lowlights (3)</strong> •{" "}
          <strong>Asks (3)</strong>.
        </li>
        <li>Optional: one small chart.</li>
      </ul>

      <Rule />

      <h2 className="text-xl font-serif">Crisis Cadence</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Daily standup (15m): facts, risks, next steps. Freeze new initiatives.
        </li>
        <li>Communicate early and plainly.</li>
      </ul>

      {/* Seal bottom-center */}
      <div className="mt-12 border-t border-lightGrey/80 pt-6 text-center">
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
}
