"use client";

/**
 * FirstEncounterProof — reusable governed decision sequence proof.
 *
 * Shows the governing sequence in institutional, restrained style.
 * Use on entry surfaces or result surfaces where the user needs to
 * understand what the system does before committing.
 *
 * Do not overuse. This is institutional proof, not decorative UI.
 */

import * as React from "react";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck, Clock } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type ProofStep = {
  label: string;
  status: "tested" | "graded" | "detected" | "surfaced" | "restricted" | "allowed" | "issued" | "tracked";
  detail: string;
};

const DEFAULT_STEPS: ProofStep[] = [
  { label: "Claim tested", status: "tested", detail: "Input assessed for specificity, authority, and evidence quality." },
  { label: "Evidence graded", status: "graded", detail: "C3 fidelity score applied. Clarity, context, and consequence measured." },
  { label: "Contradiction detected", status: "detected", detail: "Cross-reference against stated position, operating reality, and prior signals." },
  { label: "Consequence surfaced", status: "surfaced", detail: "Financial exposure, authority gaps, and execution risk made visible." },
  { label: "Progression governed", status: "restricted", detail: "Allowed if evidence supports escalation. Restricted if the decision is not yet admissible." },
  { label: "Required action issued", status: "issued", detail: "Specific, directed, accountable. Not a recommendation — a governed move." },
];

const STATUS_CONFIG = {
  tested: { icon: CheckCircle, color: "text-zinc-400/60", border: "border-white/[0.06]" },
  graded: { icon: CheckCircle, color: "text-zinc-400/60", border: "border-white/[0.06]" },
  detected: { icon: AlertTriangle, color: "text-amber-400/60", border: "border-amber-500/10" },
  surfaced: { icon: AlertTriangle, color: "text-amber-400/60", border: "border-amber-500/10" },
  restricted: { icon: XCircle, color: "text-red-400/60", border: "border-red-500/15" },
  allowed: { icon: CheckCircle, color: "text-emerald-400/60", border: "border-emerald-500/10" },
  issued: { icon: ShieldCheck, color: "text-zinc-400/60", border: "border-white/[0.06]" },
  tracked: { icon: Clock, color: "text-zinc-500", border: "border-white/[0.04]" },
} as const;

type FirstEncounterProofProps = {
  /** Override default steps with context-specific proof sequence */
  steps?: ProofStep[];
  /** Section eyebrow label */
  eyebrow?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
};

export default function FirstEncounterProof({
  steps = DEFAULT_STEPS,
  eyebrow = "How the system governs",
  compact = false,
  className = "",
}: FirstEncounterProofProps) {
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          ...mono,
          fontSize: "10px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: `${GOLD}60`,
          marginBottom: compact ? "0.5rem" : "0.75rem",
        }}
      >
        {eyebrow}
      </div>

      <div className={compact ? "space-y-1" : "space-y-2"}>
        {steps.map((step, i) => {
          const config = STATUS_CONFIG[step.status];
          const Icon = config.icon;

          return (
            <div
              key={step.label}
              className={`border ${config.border} bg-white/[0.02] transition-all duration-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              } ${compact ? "px-3 py-2" : "px-4 py-3"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${config.color} shrink-0`} />
                <span
                  style={{
                    ...mono,
                    fontSize: compact ? "9px" : "10px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {!compact && (
                <p className="mt-1.5 text-xs leading-5 text-zinc-500 pl-5">{step.detail}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { ProofStep };
