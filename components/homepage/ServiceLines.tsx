/* components/homepage/ServiceLines.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-3xl cards, rounded-2xl icon container, rounded-full badge pill
   - font-black / font-medium / font-extrabold — platform uses weight 300 / regular
   - bg-amber-500/10 + border-amber-500/20 + text-amber-300 icon container
   - "Phase 01/02/03" invented hierarchy labels
   - "system-index" breadcrumb eyebrow
   - rounded-md border eyebrow badge
   - "System Verification: Active" footer — performed operational status
   - amber-500/20 gradient footer rule
   - Corner bracket decorations (opacity-0 hover reveal)
   - rounded-full ArrowRight button
   - hover:border-amber-500/20 hover:-translate-y-1
   - Vault icon (removed from Lucide — causes import error)

   Rebuilt: Three service lines stated plainly.
   Sharp card system. The content is the argument.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Layers, Archive, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";

type ServiceItem = {
  title: string;
  body: string;
  href: string;
  tag: string;
  Icon: React.ElementType;
};

const ITEMS: readonly ServiceItem[] = [
  {
    Icon:  Briefcase,
    title: "Counsel Review",
    tag:   "Governed Escalation",
    body:  "Evidence-gated counsel for decisions the system should not resolve alone. Governance, decision rights, structural correction.",
    href:  "/counsel",
  },
  {
    Icon:  Layers,
    title: "The Canon",
    tag:   "Doctrine",
    body:  "Foundational architecture: purpose, doctrine, governance, civilisation, and legacy — built to survive scrutiny.",
    href:  "/canon",
  },
  {
    Icon:  Archive,
    title: "The Vault",
    tag:   "Deployables",
    body:  "Templates, operator packs, and implementation tools — built for execution under pressure.",
    href:  "/vault",
  },
] as const;

export default function ServiceLines(): React.ReactElement {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Service lines
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
          lineHeight: 1.0, letterSpacing: "-0.028em",
          color: "rgba(255,255,255,0.90)",
          marginBottom: "0.85rem",
        }}>
          Strategy, doctrine, deployables.
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
          color: "rgba(255,255,255,0.38)",
          maxWidth: "50ch",
        }}>
          One operating continuum: advice you can defend, architecture you can teach,
          and artifacts you can deploy.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {ITEMS.map((item) => {
          const { Icon } = item;
          return (
            <Link key={item.title} href={item.href} className="group block h-full outline-none">
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
                  style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }}
                />

                <div className="relative z-10 flex h-full flex-col p-7 md:p-8">

                  {/* Icon + tag */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
                    <div style={{
                      width: "36px", height: "36px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(255,255,255,0.018)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    className="group-hover:[border-color:rgba(201,169,110,0.22)] transition-all duration-300"
                    >
                      <Icon
                        style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.32)" }}
                        className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.70)]"
                      />
                    </div>

                    <span style={{
                      padding: "3px 10px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(255,255,255,0.018)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.32)",
                    }}>
                      {item.tag}
                    </span>
                  </div>

                  {/* Title + body */}
                  <h3
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.55rem", lineHeight: 1.08,
                      letterSpacing: "-0.022em", color: "rgba(255,255,255,0.85)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.52)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.68,
                      color: "rgba(255,255,255,0.38)",
                      marginBottom: "auto",
                    }}
                  >
                    {item.body}
                  </p>

                  {/* Footer CTA */}
                  <div style={{
                    marginTop: "1.75rem", paddingTop: "1.25rem",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span
                      className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)]"
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}
                    >
                      Open
                    </span>
                    <ArrowRight
                      style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.18)" }}
                      className="transition-all duration-300 group-hover:translate-x-0.5 group-hover:[color:rgba(201,169,110,0.65)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}