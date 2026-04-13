/* components/homepage/HeroSection.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-full on every CTA, badge, and pill (6+ instances)
   - rounded-2xl on MiniStat and MicroKpi cards
   - rounded-[2rem] image container
   - bg-amber-500 primary CTA with rounded-full — wrong pattern
   - font-black/medium/semibold throughout
   - text-zinc-400/500/200 token system
   - Six capability Pill components with rounded-full
   - "Principled Strategy / Measurable Execution / Institutional Longevity"
     credo strip with amber-500/50 separators
   - amber-500/10 radial backdrop

   Rebuilt: Authority copy, sharp stats strip, two CTAs. No capability pills —
   they list what the platform does, which the platform demonstrates instead.
*/

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";

export type Counts = {
  shorts: number;
  canon: number;
  briefs: number;
  library: number;
};

type Props = {
  counts: Counts;
};

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.max(0, Math.floor(Number(n || 0))));
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.062)",
        backgroundColor: "rgb(5 5 7)",
        padding: "1rem 1.25rem",
        transition: "border-color 300ms ease",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}22`}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.062)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
        }}>
          {label}
        </span>
        {hint && (
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px", letterSpacing: "0.20em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)",
          }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300, fontSize: "1.5rem", lineHeight: 1.0,
        color: "rgba(255,255,255,0.82)",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function HeroSection({ counts }: Props): React.ReactElement {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "rgb(3 3 5)" }}>
      {/* Subtle radial — very low opacity */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 50% at 50% 0%, ${GOLD}09, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-16">

          {/* ── Left — authority copy ───────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
                color: `${GOLD}BF`,
              }}>
                Abraham of London
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
              lineHeight: 0.95, letterSpacing: "-0.035em",
              color: "rgba(255,255,255,0.94)",
              marginBottom: "1.25rem",
            }}>
              Strategy that survives scrutiny.
              <span style={{ display: "block", color: "rgba(255,255,255,0.42)" }}>
                Systems that hold under pressure.
              </span>
            </h1>

            {/* Body */}
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "1.12rem", lineHeight: 1.72,
              color: "rgba(255,255,255,0.42)",
              maxWidth: "46ch",
              marginBottom: "2.5rem",
            }}>
              Governance discipline, market clarity, and repeatable operating models —
              built from principle into practice, without noise.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2.5rem" }}>
              <Link
                href="#prelude"
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
                Start with the MiniBook
                <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "13px 26px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.48)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.72)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.48)"; }}
              >
                Strategy Room
                <ChevronRight style={{ width: "12px", height: "12px" }} />
              </Link>
            </div>

            {/* Stats — sharp tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Canon"   value={formatCount(counts.canon)}   hint="Entries"    />
              <StatTile label="Briefs"  value={formatCount(counts.briefs)}  hint="Memos"      />
              <StatTile label="Shorts"  value={formatCount(counts.shorts)}  hint="Dispatches" />
              <StatTile label="Library" value={formatCount(counts.library)} hint="Assets"     />
            </div>
          </div>

          {/* ── Right — image ────────────────────────────────────────────── */}
          <div className="relative">
            <div
              className="relative overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.09)" }}
            >
              {/* Gold top thread */}
              <div className="absolute inset-x-0 top-0 z-10 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)` }} />

              <Image
                src="/assets/images/abraham-of-london-banner.webp"
                alt="Abraham of London — Institutional Platform"
                width={1200} height={900}
                priority
                className="h-[320px] w-full object-cover sm:h-[380px] md:h-[480px]"
                style={{ filter: "grayscale(0.18)", display: "block" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Bottom overlay */}
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,3,5,0.55), transparent 45%)" }} />
            </div>

            {/* Below-image metric strip — sharp, no rounded */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Clarity",  value: "Decision-grade"  },
                { label: "Method",   value: "Operator-first"  },
                { label: "Output",   value: "Runbooks & assets" },
              ].map((item) => (
                <div key={item.label} style={{
                  border: "1px solid rgba(255,255,255,0.062)",
                  backgroundColor: "rgb(5 5 7)",
                  padding: "0.85rem 1rem",
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)", marginBottom: "0.35rem",
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.2,
                    color: "rgba(255,255,255,0.65)",
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}