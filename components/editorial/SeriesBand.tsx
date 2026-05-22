import Link from "next/link";
import type { EditorialSeries } from "@/lib/editorial/series";

type SeriesBandProps = {
  series: EditorialSeries[];
};

export function SeriesBand({ series }: SeriesBandProps) {
  if (!series.length) return null;

  return (
    <section className="mb-24">
      {/* Section label */}
      <div className="flex items-baseline justify-between mb-8">
        <span className="text-xs tracking-[0.12em] uppercase text-[#8A8A8A] font-medium">
          Editorial Series
        </span>
        {series.length > 1 && (
          <Link
            href="/editorials/series"
            className="text-xs tracking-[0.08em] text-[#8A8A8A] hover:text-[#C9963A] transition-colors duration-200"
          >
            All series
          </Link>
        )}
      </div>

      {/* Series cards */}
      <div className="space-y-0">
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/editorials/series/${s.slug}`}
            className="group block border-t border-[#2A2A2A] dark:border-[#2A2A2A] border-opacity-20 dark:border-opacity-100 py-8 hover:border-[#C9963A] transition-colors duration-300"
          >
            <div className="flex items-start justify-between gap-8">
              {/* Left: content */}
              <div className="flex-1 min-w-0">
                {/* Series type pill */}
                <div className="mb-3">
                  <span className="text-[10px] tracking-[0.14em] uppercase text-[#C9963A] font-medium">
                    {s.partCount}-Part Series
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-2xl text-[#1A1A1A] dark:text-[#F0EDE8] group-hover:text-[#C9963A] transition-colors duration-300 mb-3 leading-snug">
                  {s.title}
                </h3>

                {/* Descriptor */}
                <p className="text-sm text-[#5A5A5A] dark:text-[#8A8A8A] leading-relaxed max-w-xl">
                  {s.descriptor}
                </p>
              </div>

              {/* Right: enter signal */}
              <div className="flex-shrink-0 flex flex-col items-end justify-between gap-6 pt-1">
                <span className="text-xs text-[#8A8A8A] whitespace-nowrap">
                  {s.status === "PUBLISHED" ? "Complete" : "In progress"}
                </span>
                <span className="text-xs text-[#8A8A8A] group-hover:text-[#C9963A] transition-colors duration-300 whitespace-nowrap">
                  Read series →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}