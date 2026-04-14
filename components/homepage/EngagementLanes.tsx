/* components/homepage/EngagementLanes.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - font-bold on eyebrow and lane subtitle labels
   - amber-500 on eyebrow, subtitle, and icon hover
   - text-zinc-300/500 token system — wrong
   - rounded-full lane indicator bars
   - "P-01" through "P-04" footer tags — invented bureaucracy
   - hover:bg-zinc-950 — wrong token
   - group-hover:text-amber-50 — wrong token
   - expanding h-px line animation — performing drama
   - "Four active lanes" counter with indicator dots — decorative

   Rebuilt: Four routes stated plainly. Sharp card system.
   Each lane is a factual destination, not a performed category.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Globe, Lock, BookOpen, Landmark } from "lucide-react";

const GOLD = "#C9A96E";

type Lane = {
  key: string;
  title: string;
  tag: string;
  href: string;
  description: string;
  Icon: React.ElementType;
};

const LANES: Lane[] = [
  {
    key:         "media",
    title:       "Media",
    tag:         "Public signal",
    href:        "/media",
    Icon:        Globe,
    description: "Commentary, interviews, and public-facing narrative built for clarity under scrutiny.",
  },
  {
    key:         "education",
    title:       "Education",
    tag:         "Formation & research",
    href:        "/education-research",
    Icon:        BookOpen,
    description: "Structured learning, disciplined inquiry, and research-led intellectual formation.",
  },
  {
    key:         "private",
    title:       "Private",
    tag:         "Select mandates",
    href:        "/private-clients",
    Icon:        Lock,
    description: "Confidential advisory for principals, founders, and private strategic work.",
  },
  {
    key:         "institutional",
    title:       "Institutional",
    tag:         "Governance & policy",
    href:        "/institutional",
    Icon:        Landmark,
    description: "Institution design, governance architecture, and organisational advisory.",
  },
];

export default function EngagementLanes({ compact = true }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "mx-auto max-w-7xl px-6 py-20"}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Engagement
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
          lineHeight: 1.0, letterSpacing: "-0.025em",
          color: "rgba(255,255,255,0.88)",
          marginBottom: "0.75rem",
        }}>
          Four lanes. Each with a distinct function.
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1rem", lineHeight: 1.70,
          color: "rgba(255,255,255,0.38)",
          maxWidth: "44ch",
        }}>
          Different mandates require different operating environments.
        </p>
      </div>

      {/* Lane grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {LANES.map((lane, i) => {
          const { Icon } = lane;
          const isLast = i === LANES.length - 1;

          return (
            <Link
              key={lane.key}
              href={lane.href}
              className="group block transition-colors duration-300"
              style={{
                backgroundColor: "rgb(5 5 7)",
                borderRight: !isLast ? "1px solid rgba(255,255,255,0.07)" : "none",
                position: "relative",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(7 7 11)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(5 5 7)"}
            >
              {/* Gold thread on hover */}
              <div
                className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
              />

              <div style={{ padding: "2rem", display: "flex", flexDirection: "column", minHeight: "280px" }}>

                {/* Icon */}
                <div style={{
                  width: "34px", height: "34px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.018)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "auto",
                  transition: "border-color 300ms ease",
                }}
                className="group-hover:[border-color:rgba(201,169,110,0.22)]"
                >
                  <Icon
                    style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.32)" }}
                    className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.65)]"
                  />
                </div>

                {/* Content — bottom-anchored */}
                <div style={{ marginTop: "3rem" }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase",
                    color: `${GOLD}80`, marginBottom: "0.45rem",
                  }}>
                    {lane.tag}
                  </div>

                  <h3
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.55rem", lineHeight: 1.06,
                      letterSpacing: "-0.022em", color: "rgba(255,255,255,0.82)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {lane.title}
                  </h3>

                  {/* Separator — static, no animation */}
                  <div style={{ height: "1px", width: "2rem", backgroundColor: "rgba(255,255,255,0.08)", marginBottom: "0.85rem" }} />

                  <p
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.50)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65,
                      color: "rgba(255,255,255,0.34)",
                    }}
                  >
                    {lane.description}
                  </p>
                </div>

                {/* Footer CTA */}
                <div style={{
                  marginTop: "1.5rem", paddingTop: "1.25rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}>
                  <span className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.65)]">Enter</span>
                  <ArrowRight style={{ width: "10px", height: "10px" }} className="transition-all duration-300 group-hover:translate-x-0.5 group-hover:[color:rgba(201,169,110,0.65)]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}