import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";

// --- Local helpers to avoid missing component imports ---
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
// -----------------------------------------------------------------

/** Frontmatter used by your site tooling */
export const frontmatter = {
  title: "Leadership Playbook",
  slug: "leadership-playbook",
  date: "2024-10-22",
  author: "Abraham of London",
};

export default function LeadershipPlaybook() {
  return (
    <BrandFrame
      title="Leadership Playbook"
      subtitle="Principles and Systems for Enduring Leadership"
      pageSize="A4"
    >
      <PullLine subtle>
        {/* FIX 1: "leader's" changed to "leader&apos;s" */}
        A leader&apos;s first responsibility is to define reality. The last is to say thank you.
      </PullLine>

      <h2 className="mt-8 text-xl font-serif">Core Principles</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Clarity:</strong> Be ruthlessly clear in communication and goals.
        </li>
        <li>
          <strong>Ownership:</strong> Take extreme ownership of outcomes, good and bad.
        </li>
        <li>
          {/* FIX 2: "don't" changed to "don&apos;t" */}
          <strong>Discipline:</strong> Do the hard things, especially when you don&apos;t feel like it.
        </li>
      </ul>

      <Rule />

      <h2 className="text-xl font-serif">Board/Investor One-Pager (Template)</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Header:</strong> Month, Runway (months), MRR/Revenue, Gross
          Margin.
        </li>
        <li>
          <strong>Highlights (3)</strong> &bull; <strong>Lowlights (3)</strong> &bull;{" "}
          <strong>Asks (3)</strong>.
        </li>
        <li>Optional: one small chart.</li>
      </ul>
    </BrandFrame>
  );
}