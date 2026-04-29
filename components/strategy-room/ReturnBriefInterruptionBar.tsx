"use client";

/**
 * Full-width interruption bar for Strategy Room pages.
 * Checks for available return brief and displays authority-level notice.
 *
 * Normal: "A new briefing has been generated based on your execution."
 * Critical: "Execution has deteriorated since your last session."
 */

import * as React from "react";
import Link from "next/link";

type BriefStatus = {
  available: boolean;
  trajectory?: string;
  trigger?: string;
};

export default function ReturnBriefInterruptionBar({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = React.useState<BriefStatus | null>(null);

  React.useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/strategy-room/briefing/return/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.briefAvailable) {
          setStatus({
            available: true,
            trajectory: data.brief?.trajectory?.state,
            trigger: data.brief?.trigger,
          });
        }
      })
      .catch(() => {});
  }, [sessionId]);

  if (!status?.available) return null;

  const isCritical =
    status.trajectory === "DETERIORATING" ||
    status.trigger === "contradiction_persistence";

  return (
    <div
      style={{
        width: "100%",
        padding: "12px 20px",
        backgroundColor: isCritical ? "rgba(252,165,165,0.06)" : "rgba(201,169,110,0.04)",
        borderBottom: `1px solid ${isCritical ? "rgba(252,165,165,0.15)" : "rgba(201,169,110,0.15)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.92rem",
          lineHeight: 1.5,
          color: isCritical ? "rgba(252,165,165,0.75)" : "rgba(255,255,255,0.60)",
          margin: 0,
        }}
      >
        {isCritical
          ? "Execution has deteriorated since your last session."
          : "A new briefing has been generated based on your execution."}
      </p>
      <Link
        href={`/briefing/return/${sessionId}`}
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: isCritical ? "rgba(252,165,165,0.70)" : "#C9A96EBB",
          textDecoration: "none",
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
        }}
      >
        {isCritical ? "Review now" : "View now"}
      </Link>
    </div>
  );
}
