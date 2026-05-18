/**
 * components/trust/PlainEnglishDecisionLayer.tsx
 *
 * "What this means in practice" — a translation strip that clarifies
 * category language without replacing it. Used on /trust,
 * /engagements/operator-pilot, and the homepage (variant="homepage").
 */

import * as React from "react";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const PAIRS = [
  {
    term: "Governed decision infrastructure",
    plain: "A structured way to record, test, and follow through on important decisions.",
  },
  {
    term: "Evidence posture",
    plain: "Whether the decision is supported by facts or mainly by assertion.",
  },
  {
    term: "Consequence path",
    plain: "What happens if the decision is delayed, wrong, or not acted on.",
  },
  {
    term: "Institutional memory",
    plain: "A durable record of what was decided, why, and what changed later.",
  },
  {
    term: "Provenance",
    plain: "The accountable chain showing what was reviewed, constrained, delivered, and recorded.",
  },
] as const;

type Variant = "page" | "homepage";

export default function PlainEnglishDecisionLayer({
  variant = "page",
  id,
}: {
  variant?: Variant;
  id?: string;
}) {
  const inner = (
    <>
      <p
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "1.1rem",
        }}
      >
        What this means in practice
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {PAIRS.map(({ term, plain }) => (
          <div
            key={term}
            className="border border-white/[0.06] bg-white/[0.01] p-4"
          >
            <p
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}CC`,
                marginBottom: "0.45rem",
              }}
            >
              {term}
            </p>
            <div className="flex items-start gap-2">
              <span
                style={{
                  ...mono,
                  fontSize: "11px",
                  color: `${GOLD}44`,
                  flexShrink: 0,
                  marginTop: "2px",
                  lineHeight: 1,
                }}
              >
                →
              </span>
              <p
                style={{
                  ...serif,
                  fontSize: "0.93rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                {plain}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (variant === "homepage") {
    return (
      <section
        id={id ?? "plain-english"}
        className="border-t border-white/[0.05] px-6 py-12 md:py-16"
        style={{ backgroundColor: "rgb(3,3,5)" }}
      >
        <div className="mx-auto max-w-[1100px]">{inner}</div>
      </section>
    );
  }

  // "page" variant — inline, no section padding. Callers sit inside their
  // own space-y container which handles the vertical gap.
  return (
    <div id={id}>
      {inner}
    </div>
  );
}
