import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Calendar, Clock, ChevronRight } from "lucide-react";

type ContentItem = {
  slug: string;
  title: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string | null;
  kind?: string | null;
};

type ContentShowcaseProps = {
  items: ContentItem[];
  title?: string;
  description?: string;
  maxItems?: number;
  className?: string;
};

function safeFormatDate(dateISO?: string | null): string | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export default function ContentShowcase({
  items,
  title = "Dispatches",
  description = "Strategic intelligence notes engineered for retrieval and reuse.",
  maxItems = 6,
  className = "",
}: ContentShowcaseProps): React.ReactElement | null {
  const validItems = (items || [])
    .filter((item) => item && typeof item === "object" && item.slug && item.title)
    .slice(0, maxItems);

  if (validItems.length === 0) return null;

  return (
    <section className={`relative overflow-hidden bg-black ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1">
              <FileText className="h-3.5 w-3.5 text-amber-500/70" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
                Dispatch Index
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-white/15" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
                recent
              </span>
            </div>

            <h2 className="mt-6 font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight">
              {title}
            </h2>
            <p className="mt-3 text-sm md:text-base text-white/45 max-w-xl leading-relaxed">
              {description}
            </p>
          </div>

          <Link
            href="/content"
            className="group inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-amber-500/70 hover:text-amber-300 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {validItems.map((item, idx) => {
            const dateLabel = safeFormatDate(item.dateISO);
            return (
              <Link key={item.slug} href={`/content/${item.slug}`} className="group block h-full">
                <article className="relative h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:border-amber-500/20 hover:-translate-y-1">
                  <div className="mb-8 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-amber-500/60 transition-colors">
                      Phase 0{(idx % 3) + 1} // {item.kind || "Brief"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/35">
                    <FileText className="h-3 w-3 text-amber-500/60" />
                    <span>{item.kind || "Brief"}</span>

                    {dateLabel ? (
                      <>
                        <span className="text-white/20">•</span>
                        <Calendar className="h-3 w-3 text-white/25" />
                        <span>{dateLabel}</span>
                      </>
                    ) : null}
                  </div>

                  <h3 className="mt-4 font-serif text-xl text-white transition-colors group-hover:text-amber-100 line-clamp-2">
                    {item.title}
                  </h3>

                  {item.excerpt ? (
                    <p className="mt-3 text-sm text-white/45 leading-relaxed line-clamp-3 group-hover:text-white/65 transition-colors">
                      {item.excerpt}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-white/35 leading-relaxed line-clamp-3">
                      Strategic note indexed for retrieval and reuse.
                    </p>
                  )}

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-500/75">
                      Read
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/25 group-hover:text-amber-500/60 transition-colors">
                      <Clock className="h-3.5 w-3.5" />
                      Indexed
                    </div>
                  </div>

                  <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="w-8 h-[1px] bg-amber-500/30" />
                    <div className="absolute right-4 top-4 h-8 w-[1px] bg-amber-500/30" />
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
            System Verification: Dispatch Indexed
          </p>
        </div>
      </div>
    </section>
  );
}