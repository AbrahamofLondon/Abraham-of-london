/* components/homepage/CredibilityQuotes.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-3xl cards
   - Quote icon in text-amber-300
   - font-extrabold on attribution
   - hover:border-white/15 (fine but redundant with the platform hover pattern)
   - bg-white/[0.03] (close but not canonical rgb(5 5 7))
   - Quotation marks baked into the string — typographically imprecise
*/

import * as React from "react";

const GOLD = "#C9A96E";

const QUOTES = [
  {
    q: "This reads like an operator's briefing — not internet content.",
    a: "Reader",
  },
  {
    q: "The material is structured. It feels like a system I can deploy.",
    a: "Founder",
  },
  {
    q: "There's governance discipline in the way the thinking is laid out.",
    a: "Leadership team",
  },
];

export default function CredibilityQuotes(): React.ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {QUOTES.map((item, i) => (
        <div
          key={i}
          className="relative overflow-hidden transition-all duration-300"
          style={{ backgroundColor: "rgb(5 5 7)", border: "1px solid rgba(255,255,255,0.062)" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${GOLD}20`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(255,255,255,0.062)"; }}
        >
          {/* Gold thread on hover */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
            aria-hidden
          />

          <div style={{ padding: "1.75rem 2rem" }}>
            {/* Opening mark — typographically precise, softGold */}
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "3rem", lineHeight: 1,
              color: `${GOLD}55`,
              marginBottom: "0.5rem",
              userSelect: "none",
            }} aria-hidden>
              &ldquo;
            </div>

            {/* Quote */}
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "1.08rem", lineHeight: 1.68,
              color: "rgba(255,255,255,0.72)",
              fontStyle: "italic",
            }}>
              {item.q}
            </p>

            {/* Attribution */}
            <p style={{
              marginTop: "1.25rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.32em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
            }}>
              — {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}