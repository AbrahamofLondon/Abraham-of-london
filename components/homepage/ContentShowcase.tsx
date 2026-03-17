import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Calendar,
  ChevronRight,
} from "lucide-react";

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
  viewAllHref?: string;
};

function safeFormatDate(dateISO?: string | null): string | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeItem(item: ContentItem): ContentItem | null {
  const slug = safeString(item?.slug).trim().replace(/^\/+|\/+$/g, "");
  const title = safeString(item?.title).trim();

  if (!slug || !title) return null;

  return {
    slug,
    title,
    excerpt: safeString(item?.excerpt).trim() || null,
    dateISO: safeString(item?.dateISO).trim() || null,
    theme: safeString(item?.theme).trim() || null,
    kind: safeString(item?.kind).trim() || null,
  };
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.10] bg-white/[0.03] px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.20em] text-white/46">
      {kind}
    </span>
  );
}

export default function ContentShowcase({
  items,
  title = "Dispatches",
  description = "Strategic intelligence notes engineered for retrieval and reuse.",
  maxItems = 6,
  className = "",
  viewAllHref = "/content",
}: ContentShowcaseProps): React.ReactElement | null {
  const validItems = (items || [])
    .map(normalizeItem)
    .filter((item): item is ContentItem => Boolean(item))
    .slice(0, maxItems);

  if (validItems.length === 0) return null;

  return (
    <section className={`relative overflow-hidden bg-black ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.05),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.03),transparent_36%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2 backdrop-blur-md">
              <FileText className="h-3.5 w-3.5 text-amber-400/70" />
              <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300/72">
                Dispatch Index
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-white/18" />
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/34">
                Recent
              </span>
            </div>

            <h2 className="mt-6 font-serif text-3xl font-medium tracking-[-0.03em] text-white md:text-4xl lg:text-5xl">
              {title}
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/48 md:text-base">
              {description}
            </p>
          </div>

          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-2 self-start text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300/72 transition-colors duration-300 hover:text-amber-200"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {validItems.map((item, idx) => {
            const dateLabel = safeFormatDate(item.dateISO);
            const kind = item.kind || "Brief";
            const phase = `Phase 0${(idx % 3) + 1}`;

            return (
              <Link
                key={item.slug}
                href={`/content/${item.slug}`}
                className="group block h-full"
              >
                <article className="relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-7 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.75)] backdrop-blur-md transition-all duration-500 hover:-translate-y-[2px] hover:border-white/[0.14] hover:bg-white/[0.035]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(700px 180px at 0% 0%, rgba(245,158,11,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.18))",
                    }}
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[1px] rounded-[25px]"
                    style={{
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.035), inset 0 -1px 0 rgba(0,0,0,0.45)",
                    }}
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="mb-7 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/28 transition-colors duration-300 group-hover:text-amber-300/58">
                          {phase}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/18 transition-colors duration-300 group-hover:text-white/34">
                        indexed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/34">
                      <KindBadge kind={kind} />
                      {dateLabel ? (
                        <>
                          <span className="text-white/14">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-white/24" />
                            <span>{dateLabel}</span>
                          </span>
                        </>
                      ) : null}
                      {item.theme ? (
                        <>
                          <span className="text-white/14">•</span>
                          <span className="text-amber-300/56">{item.theme}</span>
                        </>
                      ) : null}
                    </div>

                    <h3 className="mt-5 font-serif text-[1.55rem] leading-[1.08] tracking-[-0.025em] text-white/92 transition-colors duration-300 group-hover:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/46 transition-colors duration-300 group-hover:text-white/62">
                      {item.excerpt || "Strategic note indexed for retrieval and reuse."}
                    </p>

                    <div className="mt-auto pt-8">
                      <div className="mb-5 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/76">
                          Read
                        </span>

                        <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/28 transition-colors duration-300 group-hover:text-white/48">
                          <FileText className="h-3.5 w-3.5" />
                          Dispatch
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="h-[1px] w-8 bg-amber-400/28" />
                    <div className="absolute right-4 top-4 h-8 w-[1px] bg-amber-400/28" />
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400/24 to-transparent" />
          <p className="text-[9px] font-mono uppercase tracking-[0.42em] text-white/18">
            System Verification: Dispatch Indexed
          </p>
        </div>
      </div>
    </section>
  );
}