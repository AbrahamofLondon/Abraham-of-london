/* eslint-disable @typescript-eslint/no-explicit-any */
// components/playbooks/PlaybookContinuationPanel.tsx
//
// Governed next-step panel for playbook pages.
// Renders a continuation CTA from public method briefs into governed instruments,
// and from paid playbooks into the next admissible move.
//
// Access postures:
//   public_continuation  — free public brief → paid instrument/playbook
//   paid_methodology     — paid playbook → next move (may be gated)
//   restricted_architect — architect material → qualification route

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Shield } from "lucide-react";

const GOLD = "#C9A96E";

export type AccessPosture =
  | "public_continuation"
  | "paid_methodology"
  | "restricted_architect";

export type PlaybookContinuationPanelProps = {
  sourceSlug: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  evidenceNote: string;
  accessPosture: AccessPosture;
};

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export default function PlaybookContinuationPanel({
  sourceSlug,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  evidenceNote,
  accessPosture,
}: PlaybookContinuationPanelProps) {
  const label = safeStr(primaryLabel);
  const href = safeStr(primaryHref);
  const secondaryLabelText = safeStr(secondaryLabel);
  const secondaryHrefText = safeStr(secondaryHref);
  const note = safeStr(evidenceNote);

  if (!label || !href) return null;

  const postureConfig = {
    public_continuation: {
      border: `1px solid ${GOLD}22`,
      bg: `${GOLD}06`,
      icon: null,
      heading: "Continue with the governed instrument",
    },
    paid_methodology: {
      border: `1px solid ${GOLD}28`,
      bg: `${GOLD}08`,
      icon: null,
      heading: "Next admissible move",
    },
    restricted_architect: {
      border: `1px solid rgba(168,85,247,0.25)`,
      bg: "rgba(168,85,247,0.06)",
      icon: <Lock style={{ width: "11px", height: "11px", color: "rgba(168,85,247,0.70)" }} />,
      heading: "Restricted material",
    },
  };

  const config = postureConfig[accessPosture];

  return (
    <div
      style={{
        marginTop: "2.5rem",
        border: config.border,
        backgroundColor: config.bg,
        padding: "1.5rem 1.75rem",
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        {config.icon}
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: `${GOLD}99`,
          }}
        >
          {config.heading}
        </span>
      </div>

      {note && (
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.95rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.50)",
            fontStyle: "italic",
            maxWidth: "48ch",
            marginBottom: "1.25rem",
          }}
        >
          {note}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 transition-all duration-300"
          style={{
            padding: "10px 20px",
            border: `1px solid ${GOLD}35`,
            backgroundColor: `${GOLD}0D`,
            color: `${GOLD}BB`,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = `${GOLD}55`;
            el.style.backgroundColor = `${GOLD}14`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = `${GOLD}35`;
            el.style.backgroundColor = `${GOLD}0D`;
          }}
        >
          {label}
          <ArrowRight style={{ width: "11px", height: "11px" }} />
        </Link>

        {secondaryLabelText && secondaryHrefText && (
          <Link
            href={secondaryHrefText}
            className="inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "10px 20px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.38)";
            }}
          >
            {secondaryLabelText}
          </Link>
        )}
      </div>
    </div>
  );
}
