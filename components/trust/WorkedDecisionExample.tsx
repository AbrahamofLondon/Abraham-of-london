/**
 * components/trust/WorkedDecisionExample.tsx
 *
 * Compact worked example: one real decision moving through the system.
 * Input → system tests → governed output → CTA.
 * Used on /trust and /engagements/operator-pilot.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const SYSTEM_TESTS = [
  "Evidence gap — is the service-level shortfall documented or asserted?",
  "Authority ambiguity — who owns the go or no-go, and have they been named?",
  "Cost of delay — what accrues each week the launch does not happen?",
  "Escalation condition — what event forces the decision, with or without action?",
] as const;

const GOVERNED_OUTPUTS: readonly { label: string; value: string }[] = [
  {
    label: "Required move",
    value: "Quantify the service-level gap before the launch date is revisited.",
  },
  {
    label: "Named owner",
    value: "Operations lead — accountable for the evidence report.",
  },
  {
    label: "Checkpoint",
    value: "Review in 5 days. If evidence is not ready, delay is the governed finding.",
  },
  {
    label: "Consequence if ignored",
    value: "Launch proceeds on assertion, not evidence. Governance gap is recorded.",
  },
  {
    label: "Memory carried forward",
    value: "The condition, the required move, and the checkpoint are written to the decision record.",
  },
];

export default function WorkedDecisionExample({ id }: { id?: string }) {
  return (
    <div id={id}>
      {/* Eyebrow */}
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
        Example
      </p>

      {/* Input */}
      <div
        style={{
          border: `1px solid ${GOLD}22`,
          backgroundColor: `${GOLD}04`,
          padding: "1rem 1.2rem",
          marginBottom: "0.75rem",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}80`,
            marginBottom: "0.45rem",
          }}
        >
          Decision submitted
        </p>
        <p
          style={{
            ...serif,
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.82)",
            fontStyle: "italic",
          }}
        >
          &ldquo;Should we delay a regional launch because operations cannot
          support the promised service level?&rdquo;
        </p>
      </div>

      {/* System tests + Governed output — two-col on md+, stacked on mobile */}
      <div className="grid gap-3 md:grid-cols-2" style={{ marginBottom: "1rem" }}>
        {/* System tests */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(255,255,255,0.015)",
            padding: "1rem",
          }}
        >
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
              marginBottom: "0.75rem",
            }}
          >
            System tests
          </p>
          <ul className="space-y-2">
            {SYSTEM_TESTS.map((test) => (
              <li key={test} className="flex items-start gap-2">
                <span
                  style={{
                    ...mono,
                    fontSize: "10px",
                    color: `${GOLD}55`,
                    flexShrink: 0,
                    marginTop: "3px",
                    lineHeight: 1,
                  }}
                >
                  →
                </span>
                <p
                  style={{
                    ...serif,
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {test}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Governed output */}
        <div
          style={{
            border: `1px solid ${GOLD}18`,
            backgroundColor: `${GOLD}03`,
            padding: "1rem",
          }}
        >
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: `${GOLD}88`,
              marginBottom: "0.75rem",
            }}
          >
            Governed output
          </p>
          <div className="space-y-3">
            {GOVERNED_OUTPUTS.map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    ...mono,
                    fontSize: "6.5px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: `${GOLD}70`,
                    marginBottom: "2px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "0.88rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/diagnostics/fast"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            border: `1px solid ${GOLD}50`,
            backgroundColor: `${GOLD}18`,
            color: GOLD,
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            padding: "0.65rem 1.1rem",
            textDecoration: "none",
            minHeight: "44px",
          }}
        >
          Run the Fast Diagnostic
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/tools/decision-delay-exposure"
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.42)",
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "0.65rem 1.1rem",
            textDecoration: "none",
            minHeight: "44px",
          }}
        >
          Estimate decision delay exposure
        </Link>
      </div>
    </div>
  );
}
