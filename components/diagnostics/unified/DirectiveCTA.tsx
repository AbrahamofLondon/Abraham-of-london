/**
 * DirectiveCTA — evidence-based routing CTA. One primary directive, secondary links.
 *
 * The system tells the user what the evidence warrants next.
 * No coercive language. No funnel pressure. No guilt-based framing.
 *
 * Language rules:
 * - "Test" not "Price"
 * - "Analyse" not "See the cost you are already paying"
 * - "Earned next step" not "Recommended"
 * - Always include: "You may stop here"
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

function resolveDirective(props: DirectiveCTAProps): { primary: CTAConfig; secondary: CTAConfig[]; stopNote: string } {
  const { assessmentType, conditionClass, route, score } = props;

  const stopNote = "Your current finding and checkpoint remain active if you stop here.";

  // Enterprise assessment with explicit routing
  if (assessmentType === "enterprise" && route) {
    if (route === "EXECUTIVE_REPORTING") return {
      primary: { label: "Analyse institutional consequence", href: "/diagnostics/executive-reporting", desc: "Executive Reporting converts this evidence into a governed priority stack and escalation route." },
      secondary: [{ label: "Test execution readiness", href: "/strategy-room" }],
      stopNote,
    };
    if (route === "STRATEGY_ROOM") return {
      primary: { label: "Enter governed execution", href: "/strategy-room", desc: "The evidence supports moving to execution. Strategy Room tracks whether the decision holds." },
      secondary: [{ label: "Analyse consequence first", href: "/diagnostics/executive-reporting" }],
      stopNote,
    };
  }

  // Purpose alignment → Constitutional (unless evidence is severe)
  if (assessmentType === "purpose") {
    if (score !== undefined && score < 45) return {
      // Evidence threshold: alignment score below 45 indicates structural misalignment
      primary: { label: "Analyse institutional consequence", href: "/diagnostics/executive-reporting", desc: "The misalignment evidence is severe enough to warrant consequence analysis. This step is available because your alignment score crossed the threshold." },
      secondary: [{ label: "Test the organisational structure", href: "/diagnostics/constitutional-diagnostic" }],
      stopNote,
    };
    return {
      primary: { label: "Test the organisational structure", href: "/diagnostics/constitutional-diagnostic", desc: "Constitutional Diagnostic tests whether this misalignment extends into governance and authority." },
      secondary: [{ label: "Analyse consequence", href: "/diagnostics/executive-reporting" }],
      stopNote,
    };
  }

  // Constitutional → Team (or ER if evidence is severe)
  if (assessmentType === "constitutional") {
    if (score !== undefined && score < 40) return {
      // Evidence threshold: constitutional score below 40 indicates structural disorder
      primary: { label: "Analyse institutional consequence", href: "/diagnostics/executive-reporting", desc: "The structural evidence is severe. Executive Reporting analyses the exposure and produces a governed priority stack." },
      secondary: [{ label: "Test team perception", href: "/diagnostics/team-assessment" }],
      stopNote,
    };
    return {
      primary: { label: "Test the perception gap", href: "/diagnostics/team-assessment", desc: "Team Assessment tests whether this condition is understood differently across leadership and execution." },
      secondary: [{ label: "Analyse consequence", href: "/diagnostics/executive-reporting" }],
      stopNote,
    };
  }

  // Team → Enterprise (or ER if evidence is severe)
  if (assessmentType === "team") {
    if (score !== undefined && score < 40) return {
      // Evidence threshold: team score below 40 indicates severe divergence
      primary: { label: "Analyse institutional consequence", href: "/diagnostics/executive-reporting", desc: "The perception gap is severe. Executive Reporting analyses what this divergence costs." },
      secondary: [{ label: "Test institutional scale", href: "/diagnostics/enterprise-assessment" }],
      stopNote,
    };
    return {
      primary: { label: "Test whether the condition is institutional", href: "/diagnostics/enterprise-assessment", desc: "Enterprise Assessment tests whether this is isolated or systemic." },
      secondary: [{ label: "Analyse consequence", href: "/diagnostics/executive-reporting" }],
      stopNote,
    };
  }

  // Condition-class-based routing
  if (conditionClass === "execution") return {
    primary: { label: "Enter governed execution", href: "/strategy-room", desc: "The evidence supports execution. Strategy Room tracks the decision and whether it holds." },
    secondary: [{ label: "Test the structure", href: "/diagnostics/constitutional-diagnostic" }],
    stopNote,
  };

  if (conditionClass === "instability") return {
    primary: { label: "Analyse institutional consequence", href: "/diagnostics/executive-reporting", desc: "The instability evidence warrants consequence analysis. This step is available because the evidence crossed the threshold." },
    secondary: [{ label: "Test the structure", href: "/diagnostics/constitutional-diagnostic" }],
    stopNote,
  };

  // Default: Constitutional
  return {
    primary: { label: "Test the organisational structure", href: "/diagnostics/constitutional-diagnostic", desc: "Constitutional Diagnostic tests whether this is embedded in how the organisation works." },
    secondary: [
      { label: "Analyse consequence", href: "/diagnostics/executive-reporting" },
    ],
    stopNote,
  };
}

export default function DirectiveCTA(props: DirectiveCTAProps) {
  const { primary, secondary, stopNote } = resolveDirective(props);

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "0.75rem" }}>
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.5rem" }}>
        Earned next step
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

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem" }}>
        {stopNote}
      </p>
    </div>
  );
}
