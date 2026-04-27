/**
 * DirectiveCTA — condition-based routing CTA. One primary directive, secondary links.
 * The system tells the user what to do next. Not a menu.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type DirectiveCTAProps = {
  assessmentType: string;
  conditionClass?: string;
  route?: string;
  score?: number;
  costFirst?: boolean;
};

type CTAConfig = { label: string; href: string; desc?: string };

function resolveDirective(props: DirectiveCTAProps): { primary: CTAConfig; secondary: CTAConfig[] } {
  const { assessmentType, conditionClass, route, score, costFirst } = props;

  // Enterprise assessment already has routing
  if (assessmentType === "enterprise" && route) {
    if (route === "EXECUTIVE_REPORTING") return {
      primary: { label: "Price the consequence", href: "/diagnostics/executive-reporting", desc: "Executive Reporting converts this into exposure, priority, and enforced next action." },
      secondary: [{ label: "Enter Strategy Room", href: "/strategy-room" }],
    };
    if (route === "STRATEGY_ROOM") return {
      primary: { label: "Enforce the decision", href: "/strategy-room", desc: "Strategy Room locks the decision and tracks whether it holds." },
      secondary: [{ label: "Price the consequence first", href: "/diagnostics/executive-reporting" }],
    };
  }

  // Purpose alignment → Constitutional (unless severe)
  if (assessmentType === "purpose") {
    if (score !== undefined && score < 45) return {
      primary: { label: "Price the consequence", href: "/diagnostics/executive-reporting", desc: "The misalignment is severe enough to warrant consequence pricing." },
      secondary: [{ label: "Test the structure", href: "/diagnostics/constitutional-diagnostic" }],
    };
    return {
      primary: { label: "Test the organisational structure", href: "/diagnostics/constitutional-diagnostic", desc: "Constitutional Diagnostic tests whether this misalignment extends into the operating structure." },
      secondary: [{ label: "Price the consequence", href: "/diagnostics/executive-reporting" }],
    };
  }

  // Constitutional → Team (or ER if severe)
  if (assessmentType === "constitutional") {
    if (score !== undefined && score < 40) return {
      primary: { label: "Price the consequence", href: "/diagnostics/executive-reporting", desc: "The structural condition is severe. Executive Reporting prices the exposure." },
      secondary: [{ label: "Test team perception", href: "/diagnostics/team-assessment" }],
    };
    return {
      primary: { label: "Test the perception gap", href: "/diagnostics/team-assessment", desc: "Team Assessment tests whether the same condition is understood differently across people." },
      secondary: [{ label: "Price the consequence", href: "/diagnostics/executive-reporting" }],
    };
  }

  // Team → Enterprise (or ER if severe)
  if (assessmentType === "team") {
    if (score !== undefined && score < 40) return {
      primary: { label: "Price the consequence", href: "/diagnostics/executive-reporting", desc: "The perception gap is severe. Executive Reporting prices what this costs." },
      secondary: [{ label: "Test institutional scale", href: "/diagnostics/enterprise-assessment" }],
    };
    return {
      primary: { label: "Test whether the condition is institutional", href: "/diagnostics/enterprise-assessment", desc: "Enterprise Assessment tests whether this is isolated or systemic." },
      secondary: [{ label: "Price the consequence", href: "/diagnostics/executive-reporting" }],
    };
  }

  // Condition-class-based (Fast Diagnostic style)
  if (conditionClass === "execution") return {
    primary: { label: "Enforce the decision", href: "/strategy-room", desc: "Strategy Room locks the decision and tracks whether it holds." },
    secondary: [{ label: "Test the structure", href: "/diagnostics/constitutional-diagnostic" }],
  };

  if (conditionClass === "instability" || costFirst) return {
    primary: { label: "Price the consequence", href: "/diagnostics/executive-reporting", desc: "Executive Reporting converts this into exposure, priority, and enforced next action." },
    secondary: [{ label: "Test the structure", href: "/diagnostics/constitutional-diagnostic" }],
  };

  // Default: Constitutional
  return {
    primary: { label: "Test the structure", href: "/diagnostics/constitutional-diagnostic", desc: "Constitutional Diagnostic tests whether this is embedded in how your organisation works." },
    secondary: [
      { label: "Price the consequence", href: "/diagnostics/executive-reporting" },
      { label: "Enforce the decision", href: "/strategy-room" },
    ],
  };
}

export default function DirectiveCTA(props: DirectiveCTAProps) {
  const { primary, secondary } = resolveDirective(props);

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "0.75rem" }}>
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.5rem" }}>
        System directive
      </p>

      <Link href={primary.href} className="group flex items-center justify-between" style={{ padding: "14px 18px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08` }}>
        <div>
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}CC` }}>
            {primary.label}
          </span>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.30)", marginTop: "0.15rem" }}>
            {primary.desc}
          </p>
        </div>
        <ArrowRight style={{ width: 12, height: 12, color: `${GOLD}80`, flexShrink: 0, marginLeft: "1rem" }} />
      </Link>

      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {secondary.map((link) => (
            <Link key={link.href} href={link.href} style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              {link.label} →
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
