/* components/homepage/OperatorBriefing.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-3xl/2xl/xl/full/[40px]/[22px] — six distinct rounded values
   - font-black/bold/medium throughout — wrong weights
   - bg-amber-500 filled primary CTA with text-black — wrong pattern
   - "Status: Operational", "sys-check-ok", "Doctrine over noise."
   - STRAT-01/OPS-04/ETHIC-09 invented reference codes on line cards
   - rounded-full "Institutional Grade" badge
   - Corner bracket decorations on every hover state
   - Terminal icon + ChevronRight compound eyebrow badge
   - rounded-xl icon container with amber-500/10 fill
   - amber-500 used as decorative colour throughout

   Rebuilt: The briefing lines carry the weight. Container is still.
   Sharp card system. No performed operational status.
*/

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ScrollText,
  Fingerprint,
  Lock,
  ShieldCheck,
  ScanSearch,
} from "lucide-react";

const GOLD = "#C9A96E";

type FeaturedCard = {
  title: string;
  href: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string | null;
  kind?: string | null;
};

type BriefLine = {
  title: string;
  body: string;
};

const BRIEF_LINES: BriefLine[] = [
  {
    title: "Scrutiny-ready architecture.",
    body:  "If it cannot survive hostile cross-examination, it is not strategy — it is theatre. We build for audit, not applause.",
  },
  {
    title: "The engine of cadence.",
    body:  "Institutional performance is not a spark; it is a rhythm. Routines and decision rights make excellence the default.",
  },
  {
    title: "Load-bearing integrity.",
    body:  "Integrity is not a slogan. It is proven in controls, incentives, and accountability loops under pressure.",
  },
];

export default function OperatorBriefing({
  featured,
}: {
  featured: FeaturedCard | null;
}): React.ReactElement | null {
  if (!featured) return null;

  return (
    <div>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">

        {/* ── Left — featured brief ─────────────────────────────────────── */}
        <div className="lg:col-span-5">

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Operator briefing
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3.6rem)",
            lineHeight: 0.97, letterSpacing: "-0.030em",
            color: "rgba(255,255,255,0.92)",
            marginBottom: "1.25rem",
          }}>
            {featured.title}
          </h2>

          {/* Excerpt */}
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.08rem", lineHeight: 1.72,
            color: "rgba(255,255,255,0.42)",
            maxWidth: "44ch",
            marginBottom: "2rem",
          }}>
            {featured.excerpt || "Doctrine, frameworks, and deployables — organised for governance and execution."}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link
              href={featured.href}
              className="group inline-flex items-center gap-2 transition-all duration-300"
              style={{
                padding: "13px 26px",
                border: `1px solid ${GOLD}44`,
                backgroundColor: `${GOLD}10`,
                color: GOLD,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}18`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}10`; }}
            >
              Open briefing
              <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/canon"
              className="inline-flex items-center gap-2 transition-all duration-300"
              style={{
                padding: "13px 26px",
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.72)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.45)"; }}
            >
              <ScrollText style={{ width: "12px", height: "12px" }} />
              The Canon
            </Link>
          </div>
        </div>

        {/* ── Right — governance protocol panel ────────────────────────── */}
        <div className="lg:col-span-7">
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(10 14 20)" }}>

            {/* Panel header */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: "1rem",
              padding: "1.5rem 1.75rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: "36px", height: "36px",
                  border: `1px solid ${GOLD}22`,
                  backgroundColor: `${GOLD}08`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Fingerprint style={{ width: "16px", height: "16px", color: `${GOLD}AA` }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px", letterSpacing: "0.34em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    Governance protocol
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.20)", marginTop: "0.2rem",
                  }}>
                    {featured.theme ? `Category: ${featured.theme}` : "Institutional doctrine"}
                  </div>
                </div>
              </div>

              {/* Status — sharp badge, no rounded-full */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "4px 12px",
                border: `1px solid ${GOLD}20`,
                backgroundColor: `${GOLD}07`,
                flexShrink: 0,
              }}>
                <ShieldCheck style={{ width: "11px", height: "11px", color: `${GOLD}90` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase",
                  color: `${GOLD}AA`,
                }}>
                  Institutional grade
                </span>
              </div>
            </div>

            {/* Briefing lines — no invented reference codes, no corner brackets */}
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {BRIEF_LINES.map((line, i) => (
                <div
                  key={i}
                  className="group transition-colors duration-300"
                  style={{ padding: "1.5rem 1.75rem", backgroundColor: "transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.018)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"}
                >
                  <h4
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.92)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.12rem", lineHeight: 1.15,
                      letterSpacing: "-0.018em", color: "rgba(255,255,255,0.78)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {line.title}
                  </h4>
                  <p
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.52)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.68,
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    {line.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Panel footer */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: "1rem",
              padding: "1.25rem 1.75rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <ScanSearch style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.22)" }} />
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.5,
                  color: "rgba(255,255,255,0.35)",
                  maxWidth: "28ch",
                }}>
                  Browse the full repository of artifacts and frameworks.
                </p>
              </div>

              <Link
                href="/vault"
                className="inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "9px 18px",
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}08`,
                  color: `${GOLD}BB`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}50`; el.style.backgroundColor = `${GOLD}10`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}30`; el.style.backgroundColor = `${GOLD}08`; }}
              >
                <Lock style={{ width: "11px", height: "11px" }} />
                Access vault
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}