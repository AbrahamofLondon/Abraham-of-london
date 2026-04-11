/* components/homepage/StrategicFunnelStrip.tsx
   Design: Institutional Monumentalism
   
   Previous version had: "Initialize Protocol", "Auth.State: Verified_Operational",
   "P-01 // Tools" — theatrical tech-cosplay signalling insecurity.
   
   Rebuilt as: Three routes, stated plainly. What each does. Where it leads.
   No performed seriousness. No invented jargon. No corner-bracket decorations.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays, Users, type LucideIcon } from "lucide-react";

const GOLD = "#C9A96E";

type RouteItem = {
  href: string;
  label: string;
  tag: string;
  description: string;
  Icon: LucideIcon;
};

const ROUTES: readonly RouteItem[] = [
  {
    href: "/consulting",
    label: "Advisory & Consulting",
    tag: "Direct engagement",
    description:
      "Board-level architecture for founders and leadership teams navigating growth, transition, or structural pressure.",
    Icon: Briefcase,
  },
  {
    href: "/consulting/strategy-room",
    label: "Strategy Room",
    tag: "Private mandate",
    description:
      "Reserved for situations where consequence is material and casual engagement would not serve the problem.",
    Icon: Users,
  },
  {
    href: "/events",
    label: "Executive Salons",
    tag: "Live sessions",
    description:
      "High-signal environments for serious operators. Doctrine meets current conditions in structured, off-record form.",
    Icon: CalendarDays,
  },
] as const;

export default function StrategicFunnelStrip(): React.ReactElement {
  return (
    <div>
      {/* Section header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Engagement routes
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
          lineHeight: 1.0, letterSpacing: "-0.025em",
          color: "rgba(255,255,255,0.88)",
        }}>
          Three routes. Each with a distinct function.
        </h2>
      </div>

      {/* Route cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {ROUTES.map((route) => {
          const Icon = route.Icon;
          return (
            <Link key={route.href} href={route.href} className="group block outline-none">
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

                <div className="relative z-10 p-7 md:p-8 flex flex-col h-full">
                  {/* Icon + tag */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex items-center justify-center transition-colors duration-300"
                      style={{ width: "32px", height: "32px", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <Icon style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.35)" }} />
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.32em", textTransform: "uppercase",
                      color: `${GOLD}80`,
                    }}>
                      {route.tag}
                    </span>
                  </div>

                  {/* Label */}
                  <h3
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.35rem", lineHeight: 1.10,
                      letterSpacing: "-0.020em", color: "rgba(255,255,255,0.82)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {route.label}
                  </h3>

                  {/* Description */}
                  <p
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.50)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68,
                      color: "rgba(255,255,255,0.36)",
                    }}
                  >
                    {route.description}
                  </p>

                  {/* CTA */}
                  <div
                    className="mt-auto pt-5 flex items-center gap-2 transition-all duration-300 group-hover:gap-3"
                    style={{
                      marginTop: "auto", paddingTop: "1.25rem",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    <span className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)]">
                      Enter
                    </span>
                    <ArrowRight style={{ width: "11px", height: "11px" }} className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)]" />
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