/* components/homepage/MarketIntelligenceFeature.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct token system

   Previous version had:
   - rounded-full eyebrow badge, rounded-2xl on all cards and CTAs
   - bg-[#08131F] non-canonical token
   - bg-white text-black primary CTA with font-semibold — extreme departure from platform
   - text-sm font-semibold on all CTAs — wrong font family (should be JetBrains Mono)
   - py-18 / py-22 — non-standard spacing values

   Note: This component is largely superseded by FlagshipIntelligence in pages/index.tsx.
   Kept with full design-system alignment for any secondary entry points that use it
   (e.g. the /intelligence landing page sidebar or a consulting page teaser).

   Rebuilt: Sharp panel system. Cormorant / JetBrains Mono. Correct token hierarchy.
   Three editions presented as flat expandable rows, not rounded cards.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Scale, TrendingUp, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";

const EDITIONS = [
  {
    icon: TrendingUp,
    tag:  "Public Brief",
    body: "A refined public reading for serious readers who want the shape of the quarter without the full institutional edge.",
    href: "/artifacts/global-market-outlook-q1-2026-public",
    cta:  "Read public brief",
    gold: false,
  },
  {
    icon: Lock,
    tag:  "Institutional Edition",
    body: "The restricted document for strategic operators. Stronger framing, deeper implications, board-grade decision utility.",
    href: "/artifacts/global-market-intelligence-report-q1-2026",
    cta:  "Open institutional edition",
    gold: true,
  },
  {
    icon: Scale,
    tag:  "Boardroom PDF",
    body: "Premium portable format for executives, review packs, and cleaner internal circulation.",
    href: "/.netlify/functions/gmi-boardroom-pdf",
    cta:  "Open boardroom PDF",
    gold: false,
  },
] as const;

export default function MarketIntelligenceFeature() {
  return (
    <div>
      {/* Header */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start" style={{ marginBottom: "2rem" }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <TrendingUp style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BB`,
            }}>
              Global Market Intelligence
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
            lineHeight: 1.0, letterSpacing: "-0.028em",
            color: "rgba(255,255,255,0.93)",
            marginBottom: "1rem",
          }}>
            Global Market Intelligence Q1 2026
          </h2>

          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
            color: "rgba(255,255,255,0.42)",
            maxWidth: "46ch",
            marginBottom: "1.75rem",
          }}>
            A disciplined reading of a harder market, structured in public, institutional,
            and boardroom layers for serious operators.
          </p>

          <Link
            href="/intelligence/global-market-intelligence-q1-2026"
            className="group inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "13px 26px",
              border: `1px solid ${GOLD}42`,
              backgroundColor: `${GOLD}0E`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
          >
            Open intelligence surface
            <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Editions — right column */}
        <div className="space-y-2">
          {EDITIONS.map((ed) => {
            const Icon = ed.icon;
            return (
              <Link
                key={ed.tag}
                href={ed.href}
                className="group flex items-start gap-4 transition-all duration-300"
                style={{
                  padding: "1.25rem",
                  border: `1px solid ${ed.gold ? `${GOLD}22` : "rgba(255,255,255,0.062)"}`,
                  backgroundColor: ed.gold ? `${GOLD}06` : "rgba(255,255,255,0.015)",
                  display: "block",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = ed.gold ? `${GOLD}40` : "rgba(255,255,255,0.12)";
                  el.style.backgroundColor = ed.gold ? `${GOLD}0C` : "rgba(255,255,255,0.028)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = ed.gold ? `${GOLD}22` : "rgba(255,255,255,0.062)";
                  el.style.backgroundColor = ed.gold ? `${GOLD}06` : "rgba(255,255,255,0.015)";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                  <Icon style={{
                    width: "13px", height: "13px", flexShrink: 0, marginTop: "3px",
                    color: ed.gold ? `${GOLD}AA` : "rgba(255,255,255,0.30)",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
                      color: ed.gold ? `${GOLD}AA` : "rgba(255,255,255,0.28)",
                      marginBottom: "0.4rem",
                    }}>
                      {ed.tag}
                    </div>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60,
                      color: "rgba(255,255,255,0.45)",
                      marginBottom: "0.75rem",
                    }}>
                      {ed.body}
                    </p>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase",
                      color: ed.gold ? `${GOLD}BB` : "rgba(255,255,255,0.28)",
                    }}>
                      {ed.cta}
                      <ArrowRight style={{ width: "10px", height: "10px" }} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}