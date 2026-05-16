/**
 * components/onboarding/DecisionCentreChecklist.tsx
 *
 * Lightweight onboarding checklist for first-time Decision Centre users.
 * Renders a collapsible panel with actionable first steps.
 * Dismissed state is stored in localStorage — no backend needed.
 *
 * Shows when: user has zero governed cases OR checklist not yet dismissed.
 * Hides when: user dismisses it, or when all steps are marked complete.
 */

import * as React from "react";
import Link from "next/link";
import { CheckCircle, ChevronDown, ChevronUp, X } from "lucide-react";

const GOLD = "#C9A96E";
const STORAGE_KEY = "dc_onboarding_dismissed";
const STEPS_KEY = "dc_onboarding_steps";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Step = {
  id: string;
  label: string;
  description: string;
  href?: string;
  action?: string;
};

const STEPS: Step[] = [
  {
    id: "read_orientation",
    label: "Read the orientation",
    description: "Understand what a governed case is and how the Decision Centre works.",
    href: "/decision-centre#orientation",
  },
  {
    id: "run_diagnostic",
    label: "Run your first diagnostic",
    description: "Identify the decision you need to govern and start a record.",
    href: "/diagnostics/fast",
  },
  {
    id: "review_case",
    label: "Review your first case",
    description: "Open the case created from your diagnostic and review the governed record.",
    href: "/decision-centre",
  },
  {
    id: "send_to_self",
    label: "Send yourself a copy",
    description: "Use Send to Self to receive a governed summary by email.",
    href: "/tools/send-to-self",
  },
  {
    id: "understand_return_brief",
    label: "Learn about Return Briefs",
    description: "Understand what triggers a Return Brief and when you will receive one.",
    href: "/decision-centre#return-brief",
  },
];

type Props = {
  /** Pass true when the user has at least one saved case — checklist hides automatically */
  hasExistingCases?: boolean;
};

export default function DecisionCentreChecklist({ hasExistingCases = false }: Props) {
  const [dismissed, setDismissed] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "1";
    const savedSteps = localStorage.getItem(STEPS_KEY);
    setDismissed(wasDismissed);
    if (savedSteps) {
      try {
        const arr = JSON.parse(savedSteps) as string[];
        setCompleted(new Set(arr));
      } catch {
        // ignore
      }
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function toggleStep(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STEPS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  // Only show for first-time users (no cases yet) and not dismissed
  if (!mounted || dismissed || (hasExistingCases && completed.size === STEPS.length)) return null;

  const allDone = STEPS.every((s) => completed.has(s.id));

  return (
    <div
      role="region"
      aria-label="Getting started checklist"
      style={{
        border: `1px solid ${GOLD}22`,
        backgroundColor: `${GOLD}06`,
        marginBottom: "2rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
            Getting started
          </span>
          <span
            style={{
              ...mono,
              fontSize: "7px",
              padding: "2px 7px",
              border: `1px solid ${GOLD}30`,
              color: `${GOLD}70`,
              backgroundColor: allDone ? `${GOLD}12` : "transparent",
            }}
          >
            {completed.size}/{STEPS.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {expanded ? (
            <ChevronUp style={{ width: 14, height: 14, color: "rgba(255,255,255,0.25)" }} />
          ) : (
            <ChevronDown style={{ width: 14, height: 14, color: "rgba(255,255,255,0.25)" }} />
          )}
          <button
            aria-label="Dismiss checklist"
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
          >
            <X style={{ width: 13, height: 13, color: "rgba(255,255,255,0.22)" }} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "4px 0 8px" }}>
          {STEPS.map((step) => {
            const done = completed.has(step.id);
            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "10px 20px",
                  opacity: done ? 0.45 : 1,
                }}
              >
                <button
                  aria-label={done ? `Mark "${step.label}" incomplete` : `Mark "${step.label}" complete`}
                  onClick={() => toggleStep(step.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "1px", flexShrink: 0 }}
                >
                  <CheckCircle
                    style={{
                      width: 15,
                      height: 15,
                      color: done ? `${GOLD}CC` : "rgba(255,255,255,0.18)",
                    }}
                  />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)", textDecoration: done ? "line-through" : "none" }}>
                      {step.label}
                    </span>
                    {step.href && !done && (
                      <Link
                        href={step.href}
                        style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}70`, textDecoration: "none", flexShrink: 0 }}
                      >
                        Go
                      </Link>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.32)", marginTop: "2px", lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
