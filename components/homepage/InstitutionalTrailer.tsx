"use client";

/* components/enhanced/InstitutionalTrailer.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-full on both CTAs
   - bg-amber-600 filled primary CTA
   - hover:bg-amber-500/5 hover:border-amber-500/40 on ghost CTA (amber on non-action)
   - "Institutional Trailer" overline — names the section instead of orienting
   - font-mono on overline and signature line (correct token, wrong weight/size)

   Rebuilt: The copy is the strongest asset in this component.
   The container is still. The statement lands without ceremony.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";

export default function InstitutionalTrailer() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "rgb(3 3 5)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Softgold radial — barely perceptible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 0%, ${GOLD}07, transparent 60%)` }}
      />

      <div className="relative mx-auto max-w-4xl px-6 py-28 md:py-40 text-center">

        {/* Eyebrow — factual, not self-narrating */}
        <div style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px", letterSpacing: "0.46em", textTransform: "uppercase",
          color: `${GOLD}80`,
          marginBottom: "2rem",
        }}>
          Platform doctrine
        </div>

        {/* Primary statement */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
          lineHeight: 0.96, letterSpacing: "-0.035em",
          color: "rgba(255,255,255,0.94)",
          marginBottom: "1.25rem",
        }}>
          Civilisation is not an accident.
        </h2>

        {/* Secondary — italic, slightly dimmed */}
        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(1.5rem, 3.5vw, 2.8rem)",
          lineHeight: 1.05, letterSpacing: "-0.025em",
          color: `${GOLD}CC`,
          fontStyle: "italic",
          marginBottom: "3rem",
        }}>
          It is designed.
        </h3>

        {/* Manifesto — two paragraphs */}
        <div style={{ maxWidth: "52ch", margin: "0 auto" }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.78,
            color: "rgba(255,255,255,0.48)",
            marginBottom: "1.5rem",
          }}>
            Strategy without doctrine collapses.
            Doctrine without structure drifts.
            Power without moral architecture corrodes.
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.78,
            color: "rgba(255,255,255,0.42)",
          }}>
            This platform exists to restore architectural thinking —
            in men, in institutions, and in nations.
          </p>
        </div>

        {/* Signature line */}
        <div style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
          margin: "3rem 0",
        }}>
          Doctrine · Structure · Cadence · Deployment
        </div>

        {/* Divider */}
        <div style={{
          height: "1px", width: "4rem", margin: "0 auto 3rem",
          background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)`,
        }} />

        {/* CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
          <Link
            href="/canon"
            className="group inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "13px 28px",
              border: `1px solid ${GOLD}44`,
              backgroundColor: `${GOLD}10`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}18`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}10`; }}
          >
            Explore the Canon
            <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/vault"
            className="inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "13px 28px",
              border: "1px solid rgba(255,255,255,0.09)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.48)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.72)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.48)"; }}
          >
            Enter the vault
          </Link>
        </div>
      </div>
    </section>
  );
}