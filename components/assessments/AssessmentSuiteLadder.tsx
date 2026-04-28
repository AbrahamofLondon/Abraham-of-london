// components/assessments/AssessmentSuiteLadder.tsx
// Design: Institutional Monumentalism
// Changes from v1:
// - "use client" removed (Pages Router)
// - All rounded-[26px] / rounded-2xl / rounded-full → sharp panel system
// - amber-500 → #C9A96E softGold throughout (CTA gold on flagship only)
// - bg-black/50 backdrop-blur-sm → rgb(5 5 7) platform token
// - Connector line removed (decorative noise)
// - Step badges: rounded-full → sharp pills
// - Icon containers: rounded-2xl → sharp 38×38 frames
// - All four rungs use the same sharp panel baseline
// - Flagship (Executive Reporting) distinguished by gold border only
// - Hover: translateY(-2px) + gold thread top

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, LayoutGrid, Radar, Users } from "lucide-react";
import { ASSESSMENT_LADDER, type AssessmentId } from "@/lib/assessments/suite-registry";

const GOLD = "#C9A96E";

const ICONS: Record<AssessmentId, React.ComponentType<{ style?: React.CSSProperties }>> = {
  CONSTITUTIONAL:     Radar,
  TEAM:               Users,
  ENTERPRISE:         LayoutGrid,
  EXECUTIVE_REPORTING:FileText,
};

function stepConfig(isFlagship: boolean) {
  if (isFlagship) return {
    border:     `${GOLD}32`, borderHover: `${GOLD}54`,
    iconColor:  `${GOLD}AA`, numColor: `${GOLD}36`,
    badgeBorder:`${GOLD}24`, badgeBg: "rgb(14 14 18)", badgeText: `${GOLD}CC`,
    ctaColor:   `${GOLD}BB`, ctaHover: GOLD,
  };
  return {
    border:     "rgba(255,255,255,0.14)", borderHover: "rgba(255,255,255,0.22)",
    iconColor:  "rgba(255,255,255,0.64)", numColor: "rgba(255,255,255,0.18)",
    badgeBorder:"rgba(255,255,255,0.14)", badgeBg: "rgb(14 14 18)", badgeText: "rgba(255,255,255,0.58)",
    ctaColor:   "rgba(255,255,255,0.72)", ctaHover: "rgba(255,255,255,0.92)",
  };
}

export default function AssessmentSuiteLadder() {
  const [hovered, setHovered] = React.useState<string | null>(null);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-4">
        {ASSESSMENT_LADDER.map((item, i) => {
          const Icon      = ICONS[item.id];
          const isFlagship = i === ASSESSMENT_LADDER.length - 1;
          const cfg       = stepConfig(isFlagship);
          const isHovered = hovered === item.id;

          return (
            <Link key={item.id} href={item.href}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative flex flex-col overflow-hidden"
              style={{
                border:          `1px solid ${isHovered ? cfg.borderHover : cfg.border}`,
                backgroundColor: "rgb(14 14 18)",
                transform:       isHovered ? "translateY(-2px)" : "translateY(0)",
                transition:      "border-color 300ms ease, transform 300ms ease, box-shadow 300ms ease",
                boxShadow:       isHovered ? "0 20px 60px -20px rgba(0,0,0,0.65)" : "none",
              }}
            >
              {/* Gold thread — hover only */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)`, opacity: isHovered ? 1 : 0, transition: "opacity 300ms ease" }} />

              {/* Flagship ambient */}
              {isFlagship && <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at top right, ${GOLD}03, transparent 60%)` }} />}

              <div className="relative z-10 flex flex-1 flex-col" style={{ padding: "1.75rem 2rem" }}>

                {/* Number + icon */}
                <div className="flex items-start justify-between mb-6">
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "2.8rem", lineHeight: 1, letterSpacing: "-0.04em", color: cfg.numColor, transition: "color 300ms ease" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ width: "38px", height: "38px", border: "1px solid rgba(255,255,255,0.14)", backgroundColor: "rgb(10 10 14)", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 300ms ease" }}>
                    <Icon style={{ width: "18px", height: "18px", color: cfg.iconColor }} />
                  </div>
                </div>

                {/* Position badge */}
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ display: "inline-block", padding: "3px 10px", border: `1px solid ${cfg.badgeBorder}`, backgroundColor: cfg.badgeBg, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: cfg.badgeText, transition: "border-color 300ms ease" }}>
                    {item.position}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.1rem, 1.5vw, 1.35rem)", lineHeight: 1.10, letterSpacing: "-0.018em", color: "rgba(255,255,255,0.88)", marginBottom: "0.65rem", transition: "color 300ms ease" }}>
                  {item.title}
                </h3>

                {/* Strapline */}
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65, color: "rgba(255,255,255,0.72)", flex: 1, marginBottom: "1.25rem" }}>
                  {item.strapline}
                </p>

                {/* Divider */}
                <div style={{ height: "1px", background: "linear-gradient(to right, rgba(255,255,255,0.14), transparent)", marginBottom: "1rem" }} />

                {/* Output */}
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", marginBottom: "0.35rem" }}>
                  Output
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(255,255,255,0.68)", marginBottom: "1.25rem" }}>
                  {item.output}
                </div>

                {/* CTA */}
                <div className="inline-flex items-center" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: isHovered ? cfg.ctaHover : cfg.ctaColor, transition: "color 300ms ease", gap: isHovered ? "10px" : "6px" }}>
                  {isFlagship ? "Open flagship" : "Open"}
                  <ArrowRight style={{ width: "11px", height: "11px", transform: isHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 300ms ease" }} />
                </div>
              </div>

              {/* Bottom shimmer */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
          Each layer carries context to the next without rework
        </span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)" }} />
      </div>
    </div>
  );
}
