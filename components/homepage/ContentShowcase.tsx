/* components/homepage/ContentShowcase.tsx
   Design: Institutional Monumentalism — matches platform card system
   Sharp panels. No rounded corners. No theatrical metadata ("Phase 01", "indexed").
   The content is the signal. The card presents it cleanly.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileText } from "lucide-react";

const GOLD = "#C9A96E";

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
  const slug  = safeString(item?.slug).trim().replace(/^\/+|\/+$/g, "");
  const title = safeString(item?.title).trim();
  if (!slug || !title) return null;
  return {
    slug,
    title,
    excerpt: safeString(item?.excerpt).trim() || null,
    dateISO: safeString(item?.dateISO).trim() || null,
    theme:   safeString(item?.theme).trim()   || null,
    kind:    safeString(item?.kind).trim()    || null,
  };
}

export default function ContentShowcase({
  items,
  title       = "Dispatches",
  description = "Short, sharp intelligence notes. Written for retrieval and reuse.",
  maxItems    = 6,
  className   = "",
  viewAllHref = "/shorts",
}: ContentShowcaseProps): React.ReactElement | null {
  const validItems = (items || [])
    .map(normalizeItem)
    .filter((item): item is ContentItem => Boolean(item))
    .slice(0, maxItems);

  if (validItems.length === 0) return null;

  return (
    <div className={className}>
      {/* Section header */}
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              {title}
            </span>
          </div>
          <p className="mt-3 font-['Cormorant_Garamond',Georgia,serif] font-light leading-relaxed text-white/38"
            style={{ fontSize: "clamp(1rem, 1.3vw, 1.15rem)", maxWidth: "44ch" }}>
            {description}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-2 transition-opacity hover:opacity-75"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
            color: `${GOLD}AA`,
          }}
        >
          View all
          <ArrowRight style={{ width: "12px", height: "12px" }} />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {validItems.map((item) => {
          const dateLabel = safeFormatDate(item.dateISO);
          const kind      = item.kind || "Brief";
          const href      = item.slug.startsWith("/") ? item.slug : `/shorts/${item.slug}`;

          return (
            <Link key={item.slug} href={href} className="group block h-full outline-none">
              <article
                className="relative overflow-hidden h-full transition-all duration-400"
                style={{ backgroundColor: "rgb(5 5 7)", border: "1px solid rgba(255,255,255,0.062)" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${GOLD}20`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.062)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Gold thread — appears on hover */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }}
                />

                <div className="relative z-10 flex h-full flex-col p-7 md:p-8">
                  {/* Meta */}
                  <div className="mb-5 flex items-center gap-3">
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}>
                      {kind}
                    </span>
                    {item.theme && (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                        }}>
                          {item.theme}
                        </span>
                      </>
                    )}
                    {dateLabel && (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                        }}>
                          {dateLabel}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(1.2rem, 1.5vw, 1.45rem)",
                      lineHeight: 1.08, letterSpacing: "-0.022em",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  {item.excerpt && (
                    <p
                      className="mt-3 transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.52)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65,
                        color: "rgba(255,255,255,0.38)",
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {item.excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "auto" }}>
                    <div style={{ paddingTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.80)]"
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        Read
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.18)" }}>
                        <FileText style={{ width: "11px", height: "11px" }} />
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}