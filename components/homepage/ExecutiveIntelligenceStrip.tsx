"use client";

/* components/homepage/ExecutiveIntelligenceStrip.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, no theatrical jargon

   Previous version had:
   - "Initialize Briefing", "Priority: High // 5 MIN"
   - "Session_[random]", "Feed Status: Operational"
   - "Access Full Intelligence Registry", "Abraham of London • Intel Division"
   - "Archive Access" — all invented operational jargon cosplaying as a terminal
   - rounded-2xl, bg-zinc-900/30, amber-500 used as decorative colour

   Rebuilt as: Shorts presented as shorts. Editorial card system. No performance.
   The content is the signal. The container presents it cleanly.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileText } from "lucide-react";

const GOLD = "#C9A96E";

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

function toDateLabel(input?: LooseShort["date"]): string | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(String(input));
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function getHref(s: LooseShort): string {
  if (s.url)  return s.url;
  if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
  const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
  if (raw)    return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
  return "/shorts";
}

export default function ExecutiveIntelligenceStrip({
  shorts,
  viewAllHref = "/shorts",
}: {
  shorts: LooseShort[];
  viewAllHref?: string;
}): React.ReactElement | null {
  const items = Array.isArray(shorts) ? shorts.slice(0, 5) : [];
  const lead  = items[0] ?? null;
  if (!lead) return null;
  const rest  = items.slice(1);

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Shorts
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
            lineHeight: 1.0, letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.88)",
          }}>
            Short, sharp intelligence notes.
          </h2>
        </div>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
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

      {/* Grid — lead + triage */}
      <div
        className="grid lg:grid-cols-12"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Lead brief */}
        <Link
          href={getHref(lead)}
          className="group lg:col-span-7 block transition-colors"
          style={{ backgroundColor: "rgb(5 5 7)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgb(7 7 11)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgb(5 5 7)"}
        >
          {/* Gold thread on hover */}
          <div
            className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)`, position: "relative", height: "1px" }}
          />
          <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", height: "100%", minHeight: "280px" }}>

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "auto" }}>
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase",
                color: `${GOLD}90`,
              }}>
                {lead.readTime ?? "5 min"}
              </span>
              {toDateLabel(lead.date) && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}>
                    {toDateLabel(lead.date)}
                  </span>
                </>
              )}
            </div>

            {/* Title + excerpt */}
            <div style={{ marginTop: "3rem" }}>
              <h3
                className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
                  lineHeight: 1.06, letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "0.85rem",
                }}
              >
                {lead.title || "Untitled"}
              </h3>
              {(lead.excerpt || lead.description) && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "1rem", lineHeight: 1.68,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "48ch",
                }}>
                  {lead.excerpt || lead.description}
                </p>
              )}
            </div>

            {/* CTA */}
            <div
              className="flex items-center gap-2 transition-all duration-300 group-hover:gap-3"
              style={{
                marginTop: "2rem", paddingTop: "1.25rem",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
              }}
            >
              <span className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.80)]">Read</span>
              <ArrowRight style={{ width: "11px", height: "11px" }} className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.80)]" />
            </div>
          </div>
        </Link>

        {/* Triage feed */}
        <div className="lg:col-span-5 flex flex-col divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {rest.map((s, idx) => {
            const date = toDateLabel(s.date);
            return (
              <Link
                key={idx}
                href={getHref(s)}
                className="group flex-1 block transition-colors"
                style={{ backgroundColor: "rgb(5 5 7)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgb(7 7 11)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgb(5 5 7)"}
              >
                <div style={{ padding: "1.5rem 1.75rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {date && (
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)", marginBottom: "0.4rem",
                      }}>
                        {date}
                      </div>
                    )}
                    <h4
                      className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.08rem", lineHeight: 1.15,
                        letterSpacing: "-0.018em", color: "rgba(255,255,255,0.72)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {s.title || "Untitled"}
                    </h4>
                  </div>
                  <ChevronRight
                    style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "4px" }}
                    className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)] text-white/15"
                  />
                </div>
              </Link>
            );
          })}

          {/* View all footer */}
          <Link
            href={viewAllHref}
            className="group flex items-center justify-between transition-colors"
            style={{ padding: "1.25rem 1.75rem", backgroundColor: "rgba(255,255,255,0.012)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.025)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.012)"}
          >
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.30em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}>
              All dispatches
            </span>
            <FileText style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.18)" }} className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.60)]" />
          </Link>
        </div>
      </div>
    </div>
  );
}