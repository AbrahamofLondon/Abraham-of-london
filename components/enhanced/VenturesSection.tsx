"use client";

/* components/enhanced/VentureSection.tsx (EnhancedVenturesSection)
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-3xl cards, rounded-2xl icon containers, rounded-full bottom rail
   - Three accent systems: amber / blue / neutral — blue-400/500 decorative colour
   - font-extrabold on every label, overline, and meta field
   - bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 primary CTA
   - hover:scale-[1.02] on CTA — scaling CTAs performs anxiety
   - "dossier" label on every card — self-narrating category
   - "Choose a file. Open it." headline — file cabinet metaphor
   - "built like a library and used like a war room" — mixed metaphors
   - text-gray-200/300/400 — wrong token system
   - Technical grid background at opacity-15
   - Amber/blue dual radial backdrop

   Rebuilt: Six destination cards. What each contains. Where it leads.
   Sharp card system. One colour system (softGold). No accent variants.
*/

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Compass,
  Globe,
  Landmark,
  Target,
  Database,
  Workflow,
  Cpu,
  Shield,
} from "lucide-react";

const GOLD = "#C9A96E";

type Destination = {
  title: string;
  description: string;
  Icon: React.ElementType;
  href: string;
  tag: string;
};

const DESTINATIONS: Destination[] = [
  {
    Icon:        Landmark,
    title:       "Institutional Advisory",
    tag:         "Consulting",
    description: "Governance-grade strategy for founders, leadership teams, and private institutions — built to hold under pressure.",
    href:        "/consulting",
  },
  {
    Icon:        Target,
    title:       "Strategic Frameworks",
    tag:         "Library",
    description: "Models, matrices, and decision tools engineered for use. Deploy the system.",
    href:        "/resources/strategic-frameworks",
  },
  {
    Icon:        BookOpen,
    title:       "The Canon",
    tag:         "Doctrine",
    description: "A coherent architecture: purpose, morality, governance, and institutional design — structured for use.",
    href:        "/canon",
  },
  {
    Icon:        Database,
    title:       "The Vault",
    tag:         "Deployables",
    description: "Templates, operator packs, and execution artifacts. Practical, clean, and deployable.",
    href:        "/vault",
  },
  {
    Icon:        Compass,
    title:       "Strategy",
    tag:         "Method",
    description: "Positioning, systems, and decision discipline — a public library of methods that hold under pressure.",
    href:        "/strategy",
  },
  {
    Icon:        Workflow,
    title:       "Ventures",
    tag:         "Portfolio",
    description: "Practical deployment across multiple vectors — systems shipped, products built, institutions formed.",
    href:        "/ventures",
  },
];

const BOTTOM_RAIL = [
  { href: "/resources", label: "Resources", Icon: Cpu    },
  { href: "/shorts",    label: "Shorts",    Icon: BookOpen },
  { href: "/strategy",  label: "Strategy",  Icon: Compass  },
  { href: "/canon",     label: "Canon",     Icon: Globe    },
];

export default function EnhancedVenturesSection() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
              <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
                color: `${GOLD}BF`,
              }}>
                Platform destinations
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              lineHeight: 1.0, letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.90)",
              marginBottom: "0.65rem",
            }}>
              Six destinations. Each with a distinct function.
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "0.98rem", lineHeight: 1.68,
              color: "rgba(255,255,255,0.36)",
              maxWidth: "44ch",
            }}>
              No placeholders. Each item is a live destination.
            </p>
          </div>

          {/* Header CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", flexShrink: 0 }}>
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 transition-all duration-300"
              style={{
                padding: "11px 22px",
                border: `1px solid ${GOLD}42`,
                backgroundColor: `${GOLD}0E`,
                color: GOLD,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}62`; el.style.backgroundColor = `${GOLD}16`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
            >
              <Briefcase style={{ width: "12px", height: "12px" }} />
              Engage
              <ArrowRight style={{ width: "11px", height: "11px" }} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 transition-all duration-300"
              style={{
                padding: "11px 22px",
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.70)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Shield style={{ width: "12px", height: "12px" }} />
              Vault
            </Link>
          </div>
        </div>
      </div>

      {/* Destination cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((dest) => {
          const { Icon } = dest;
          return (
            <Link key={dest.title} href={dest.href} className="group block h-full outline-none">
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
                  {/* Icon + tag */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
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
                      color: "rgba(255,255,255,0.28)",
                    }}>
                      {dest.tag}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.42rem", lineHeight: 1.08,
                      letterSpacing: "-0.020em", color: "rgba(255,255,255,0.84)",
                      marginBottom: "0.65rem",
                    }}
                  >
                    {dest.title}
                  </h3>

                  <p
                    className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,0.52)]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65,
                      color: "rgba(255,255,255,0.36)",
                      marginBottom: "auto",
                    }}
                  >
                    {dest.description}
                  </p>

                  {/* Footer */}
                  <div style={{
                    marginTop: "1.5rem", paddingTop: "1.15rem",
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

      {/* Bottom rail — sharp, no rounded-full */}
      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {BOTTOM_RAIL.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "7px 16px",
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "rgba(255,255,255,0.015)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.14)"; el.style.color = "rgba(255,255,255,0.62)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.35)"; }}
          >
            <Icon style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}