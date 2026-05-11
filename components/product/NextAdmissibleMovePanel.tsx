/**
 * components/product/NextAdmissibleMovePanel.tsx
 *
 * Standardised next admissible move display for all surfaces.
 * Shows what the user should do next, whether escalation is earned,
 * and what the consequence of inaction is.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Props = {
  /** The next move description */
  move: string;
  /** Optional link href */
  href?: string;
  /** Optional cost of delay */
  costOfDelay?: string;
  /** Whether escalation is earned */
  escalationEarned?: boolean;
  /** Escalation target if earned */
  escalationTarget?: string;
  /** Compact variant */
  compact?: boolean;
};

export default function NextAdmissibleMovePanel({
  move,
  href,
  costOfDelay,
  escalationEarned,
  escalationTarget,
  compact,
}: Props) {
  const content = (
    <div style={{
      border: `1px solid ${GOLD}20`,
      backgroundColor: `${GOLD}04`,
      padding: compact ? "0.6rem" : "0.75rem",
    }}>
      <p style={{ ...mono, fontSize: compact ? "6px" : "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}77`, marginBottom: "0.25rem" }}>
        Next admissible move
      </p>
      <p style={{ fontSize: compact ? "12px" : "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
        {move}
      </p>
      {costOfDelay && (
        <div className="flex items-start gap-1.5" style={{ marginTop: "0.35rem" }}>
          <AlertTriangle style={{ width: 10, height: 10, color: AMBER, marginTop: 2, flexShrink: 0 }} />
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: `${AMBER}88` }}>
            Cost of delay: {costOfDelay}
          </p>
        </div>
      )}
      {escalationEarned && escalationTarget && (
        <div style={{ marginTop: "0.35rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.10em", color: `${GOLD}88` }}>
            Escalation earned → {escalationTarget}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }

  return content;
}
