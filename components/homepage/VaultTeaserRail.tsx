"use client";

/* components/homepage/VaultTeaserRail.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weight system

   Previous version had:
   - "Secure Repository" with ShieldCheck — the vault is not a security system
   - "Inspect Artefact" CTA — no institution calls documents "artefacts" in promotional copy
   - "Standard Issue: Templates • Playbooks • Guides" with animate-pulse dot
   - bg-white text-black hover:bg-amber-500 primary CTA — wrong pattern
   - bg-zinc-900/20 wrong token, font-black / font-bold / italic h4 throughout
   - Grid tag labels like "OS-V1", "GOV-CORE", "ASSET-09" — invented bureaucracy

   Rebuilt: Three vault categories presented factually. What each contains.
   Sharp platform card system. The content is the signal.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Workflow, Scale, FileText, Lock } from "lucide-react";

const GOLD = "#C9A96E";

const ITEMS = [
  {
    icon: Workflow,
    title: "Operating Cadence",
    body: "Weekly rhythms, governance tempo, and meeting structures for disciplined execution.",
  },
  {
    icon: Scale,
    title: "Governance Artefacts",
    body: "Decision rights, accountability rails, and structural controls for serious leadership environments.",
  },
  {
    icon: FileText,
    title: "Deployable Packs",
    body: "Templates, frameworks, and institutional objects designed to move directly into operating environments.",
  },
];

export default function VaultTeaserRail(): React.ReactElement {
  return (
    <div>
      {/* Section header */}
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end" style={{ marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Vault
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
            lineHeight: 1.0, letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.88)",
          }}>
            Deployable assets.
            <span style={{ color: "rgba(255,255,255,0.30)", display: "block" }}>
              Templates, frameworks, governance tools.
            </span>
          </h2>
        </div>

        <div style={{ flexShrink: 0 }}>
          <Link
            href="/vault"
            className="group inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "12px 22px",
              border: `1px solid ${GOLD}40`,
              backgroundColor: `${GOLD}0C`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}62`; el.style.backgroundColor = `${GOLD}14`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}40`; el.style.backgroundColor = `${GOLD}0C`; }}
          >
            <Lock style={{ width: "12px", height: "12px" }} />
            Open vault
            <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href="/vault" className="group block outline-none">
              <div
                className="relative overflow-hidden h-full transition-all duration-400"
                style={{ backgroundColor: "rgb(5 5 7)", border: "1px solid rgba(255,255,255,0.062)" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = `${GOLD}20`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "rgba(255,255,255,0.062)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Gold thread on hover */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
                />

                <div className="relative z-10 flex h-full flex-col p-7">
                  {/* Icon */}
                  <div style={{
                    width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)",
                    marginBottom: "2rem",
                    transition: "border-color 300ms ease",
                  }}
                  className="group-hover:[border-color:rgba(201,169,110,0.25)]"
                  >
                    <Icon
                      style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.32)" }}
                      className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.70)]"
                    />
                  </div>

                  {/* Content */}
                  <div style={{ marginBottom: "auto" }}>
                    <h4
                      className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.22rem", lineHeight: 1.10,
                        letterSpacing: "-0.018em", color: "rgba(255,255,255,0.82)",
                        marginBottom: "0.65rem",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.48)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65,
                        color: "rgba(255,255,255,0.34)",
                      }}
                    >
                      {item.body}
                    </p>
                  </div>

                  {/* CTA */}
                  <div style={{
                    marginTop: "1.5rem", paddingTop: "1.25rem",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.18)",
                  }}>
                    <span className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.65)]">
                      View
                    </span>
                    <ChevronRight
                      style={{ width: "10px", height: "10px" }}
                      className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.65)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer strip */}
      <div
        style={{
          marginTop: "1rem", padding: "1rem 1.25rem",
          border: `1px solid ${GOLD}18`,
          backgroundColor: `${GOLD}05`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.5rem",
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
        }}>
          Templates · Playbooks · Frameworks · Governance tools
        </span>
        <Link
          href="/resources/strategic-frameworks"
          className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase",
            color: `${GOLD}90`,
          }}
        >
          Preview
          <ChevronRight style={{ width: "10px", height: "10px" }} />
        </Link>
      </div>
    </div>
  );
}