/* components/SectionDivider.tsx
   Design: Institutional Monumentalism

   Previous version had:
   - animate-ping pulsing amber dot
   - animate-pulse-horizontal scanning amber line
   - rounded-full label container
   - "SYS-CHECK-OK" default label
   - font-black on label text
   - The entire component was a decorative separator performing operational signalling

   Rebuilt: A divider. Its job is to separate sections with precision.
   A gold rule — present but not insistent.
   Optional cap label in the platform's Bridge pattern.
   No animation. No performed status. No dot.
*/

import * as React from "react";

const GOLD = "#C9A96E";

type Props = {
  tight?: boolean;
  className?: string;
  id?: string;
  cap?: string; // optional centre label — factual only, no invented codes
};

export default function SectionDivider({
  tight = false,
  className = "",
  id,
  cap,
}: Props): React.ReactElement {
  return (
    <div
      id={id}
      className={className}
      style={{ backgroundColor: "rgb(6 6 9)", overflow: "hidden" }}
    >
      <div className={`mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 ${tight ? "py-7" : "py-14"}`}>
        {cap ? (
          /* Cap variant — matches the Bridge pattern in pages/index.tsx */
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06))" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px", letterSpacing: "0.46em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
              whiteSpace: "nowrap",
            }}>
              {cap}
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(255,255,255,0.06))" }} />
          </div>
        ) : (
          /* Plain rule — softGold at low opacity */
          <div style={{
            height: "1px",
            background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)`,
          }} />
        )}
      </div>
    </div>
  );
}