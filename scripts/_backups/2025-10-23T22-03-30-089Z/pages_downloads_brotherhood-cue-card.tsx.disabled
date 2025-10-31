import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="mb-1 leading-tight">{children}</li>
);

function Card() {
  return (
    <div className="relative flex h-[148mm] w-[105mm] flex-col overflow-hidden rounded-2xl border border-lightGrey bg-white p-4 shadow-sm print:shadow-none">
      {/* corner brand tick */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-45 bg-softGold/10" />
      <h2 className="mb-2 font-serif text-lg text-forest">Leader's Cue</h2>
      <ol className="mb-3 list-decimal pl-5 text-[12.5px]">
        <Bullet>
          <strong>Opening (5)</strong>: welcome, purpose, prayer.
        </Bullet>
        <Bullet>
          <strong>Scripture (15)</strong>: read; each man shares one line.
        </Bullet>
        <Bullet>
          <strong>Formation (20)</strong>: habits/money/marriage/parenting.
        </Bullet>
        <Bullet>
          <strong>Commitments (10)</strong>: one concrete step + deadline.
        </Bullet>
        <Bullet>
          <strong>Intercession (10)</strong>: names, needs, next steps.
        </Bullet>
      </ol>
      <div className="mt-auto border-t border-lightGrey pt-2 text-[11.5px] leading-snug">
        <p className="mb-1">
          <strong>Roles:</strong> Convener - Timekeeper - Scribe - Chaplain (rotate monthly)
        </p>
        <p className="mb-1">
          <strong>Red flags:</strong> lateness w/o accountability - secrets - triangulation - one-upmanship
        </p>
        <p className="italic text-[11px]">"As iron sharpens iron..." - Proverbs 27:17</p>
      </div>
    </div>
  );
}

export default function CueCard() {
  return (
    <BrandFrame
      title="Leader's Cue Card - A6 (Two-Up)"
      subtitle="Print on A4, portrait - cut down the middle - rotate roles monthly."
      // REMOVED: noWatermark prop
    >
      <div className="not-prose">
        {/* two-up grid; on print we preserve exact dimensions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-6">
          <Card />
          <Card />
        </div>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          /* ensure the physical size of each card matches A6 (105x148mm) */
          .print\\:gap-6 {
            gap: 12mm !important;
          }
        }
      `}</style>
    </BrandFrame>
  );
}