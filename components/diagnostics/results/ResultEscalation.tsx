/**
 * BLOCK 9 — ESCALATION PATH
 * Only shown after logic is established. Must feel inevitable, not promotional.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";

export default function ResultEscalation({ qualifies, nextStep, href, reason }: {
  qualifies: boolean;
  nextStep: string;
  href: string;
  reason: string;
}) {
  return (
    <div style={{
      padding: "1rem 0",
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: qualifies ? `${GOLD}70` : "rgba(255,255,255,0.22)",
        marginBottom: "0.4rem",
      }}>
        {qualifies ? "Escalation warranted" : "Next layer"}
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300,
        fontSize: "0.85rem",
        lineHeight: 1.55,
        color: "rgba(255,255,255,0.38)",
        maxWidth: "52ch",
      }}>
        {reason}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-2 transition-all duration-200"
        style={{
          padding: "8px 16px",
          border: `1px solid ${qualifies ? `${GOLD}35` : "rgba(255,255,255,0.10)"}`,
          backgroundColor: qualifies ? `${GOLD}08` : "transparent",
          color: qualifies ? GOLD : "rgba(255,255,255,0.35)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {nextStep}
        <ArrowRight style={{ width: 9, height: 9 }} />
      </Link>
    </div>
  );
}
