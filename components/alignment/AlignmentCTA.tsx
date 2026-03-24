import React from "react";
import type { AlignmentNarrativeBundle } from "@/lib/alignment/report-language";

export default function AlignmentCTA({
  narrative,
  reportUrl,
}: {
  narrative: AlignmentNarrativeBundle;
  reportUrl?: string;
}) {
  return (
    <section className="rounded-[28px] border bg-[#FCFBF7] p-8 shadow-sm">
      <div className="max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
          Recommended Action
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          {narrative.ctaTitle}
        </h2>

        <p className="mt-4 text-sm leading-7 text-neutral-600">
          {narrative.ctaBody}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/purpose-alignment"
            className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Reassess now
          </a>

          {reportUrl ? (
            <a
              href={reportUrl}
              className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              Download current report
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}