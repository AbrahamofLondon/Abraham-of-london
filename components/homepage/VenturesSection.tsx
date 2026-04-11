"use client";

/* components/homepage/VenturesSection.tsx  (also exports as BalancedVentures)
   Design: Institutional Monumentalism — sharp panels, softGold, correct weight system

   Previous version had:
   - bg-zinc-900/10 wrong token
   - font-black / font-bold throughout — wrong weights (platform uses 300 / regular)
   - italic h3 titles (serif display should be non-italic on this platform)
   - "View Full Portfolio Portfolio Directory" — duplicated word typo
   - "Distinct arms operating under a unified doctrine" — self-narrating
   - hover:text-amber-100 wrong token
   - Status badges with font-black

   Rebuilt: Three ventures, each presented factually. What each does, where it leads.
   Sharp card system matching the platform. No performance, no invented hierarchy.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, PackageCheck, Lightbulb, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";

type VentureStatus = "Active" | "In development" | "Scaling";

interface Venture {
  name: "Alomarada" | "Endureluxe" | "InnovateHub";
  description: string;
  href: string;
  status: VentureStatus;
  tag: string;
  focus: string;
}

const VENTURES: Venture[] = [
  {
    name:        "Alomarada",
    tag:         "Advisory",
    description: "Institutional strategy and market-entry architecture for growth corridors.",
    href:        process.env.NEXT_PUBLIC_ALOMARADA_URL || "#",
    status:      "Active",
    focus:       "Governance · Strategy",
  },
  {
    name:        "Endureluxe",
    tag:         "Field Gear",
    description: "Performance essentials designed for high-responsibility life.",
    href:        process.env.NEXT_PUBLIC_ENDURELUXE_URL || "#",
    status:      "Scaling",
    focus:       "Utility · Resilience",
  },
  {
    name:        "InnovateHub",
    tag:         "Builders Lab",
    description: "Practical support for founders turning ideas into durable products.",
    href:        process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "#",
    status:      "In development",
    focus:       "Venture Design · Execution",
  },
];

const VENTURE_ICONS = {
  Alomarada:   Building2,
  Endureluxe:  PackageCheck,
  InnovateHub: Lightbulb,
} as const;

const STATUS_COLOR: Record<VentureStatus, string> = {
  "Active":         "rgba(110,231,183,0.70)",
  "Scaling":        `${GOLD}CC`,
  "In development": "rgba(255,255,255,0.30)",
};

const STATUS_BG: Record<VentureStatus, string> = {
  "Active":         "rgba(110,231,183,0.06)",
  "Scaling":        `${GOLD}08`,
  "In development": "rgba(255,255,255,0.03)",
};

const STATUS_BORDER: Record<VentureStatus, string> = {
  "Active":         "rgba(110,231,183,0.18)",
  "Scaling":        `${GOLD}22`,
  "In development": "rgba(255,255,255,0.08)",
};

export default function VenturesSection(): React.ReactElement {
  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Ventures
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
          lineHeight: 1.0, letterSpacing: "-0.025em",
          color: "rgba(255,255,255,0.88)",
        }}>
          Three ventures. One governing logic.
        </h2>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {VENTURES.map((venture) => {
          const Icon = VENTURE_ICONS[venture.name];

          return (
            <Link
              key={venture.name}
              href={venture.href}
              className="group block outline-none"
            >
              <div
                className="relative overflow-hidden h-full transition-all duration-400"
                style={{ backgroundColor: "rgb(5 5 7)", border: "1px solid rgba(255,255,255,0.062)" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = `${GOLD}22`;
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
                  style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }}
                />

                <div className="relative z-10 flex h-full flex-col p-7 md:p-8">

                  {/* Icon + status */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
                    <div style={{
                      width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)",
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.35)" }} />
                    </div>

                    <div style={{
                      padding: "3px 10px",
                      border: `1px solid ${STATUS_BORDER[venture.status]}`,
                      backgroundColor: STATUS_BG[venture.status],
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: STATUS_COLOR[venture.status],
                      flexShrink: 0,
                    }}>
                      {venture.status}
                    </div>
                  </div>

                  {/* Tag + name + description */}
                  <div style={{ marginBottom: "auto" }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase",
                      color: `${GOLD}80`, marginBottom: "0.45rem",
                    }}>
                      {venture.tag}
                    </div>
                    <h3
                      className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.45rem", lineHeight: 1.06,
                        letterSpacing: "-0.022em", color: "rgba(255,255,255,0.85)",
                        marginBottom: "0.65rem",
                      }}
                    >
                      {venture.name}
                    </h3>
                    <p
                      className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.50)]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65,
                        color: "rgba(255,255,255,0.36)",
                      }}
                    >
                      {venture.description}
                    </p>
                  </div>

                  {/* Footer: focus + CTA */}
                  <div style={{
                    marginTop: "1.75rem", paddingTop: "1.25rem",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.20)",
                    }}>
                      {venture.focus}
                    </span>
                    <ChevronRight
                      style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.15)" }}
                      className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.65)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer link */}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
        <Link
          href="/ventures"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          Portfolio directory
          <ArrowRight style={{ width: "11px", height: "11px" }} />
        </Link>
      </div>
    </div>
  );
}

// Named re-export for components that import as BalancedVentures
export { VenturesSection as BalancedVentures };