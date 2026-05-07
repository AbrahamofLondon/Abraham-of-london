// components/decision/ConstitutionalNarrativeBlock.tsx
"use client";

import * as React from "react";
import {
  AlertTriangle,
  Briefcase,
  Compass,
  Eye,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ConstitutionalNarrativeData = {
  route: string;
  orgState: string;
  readinessTier: string;
  authorityType: string;
  priority: string;
  temperature: string;
  marketRiskBand: string;
  revenueBand: string;
  clarityScore?: number;
  authorityScore?: number;
  governanceScore?: number;
  severityScore?: number;
  revenueScore?: number;
  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes?: string[];
  worldviewAnchors?: string[];
  narrativeSummary: string;
  rationale?: string[];
};

export type ConstitutionalNarrativeBlockProps = {
  constitution: ConstitutionalNarrativeData;
  nextAction?: string;
  sessionKey?: string | null;
  variant?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

function MonoEyebrow({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "dark" | "light";
}) {
  return (
    <div
      className={cx(
        "font-mono text-[10px] uppercase tracking-[0.28em]",
        variant === "dark" ? "text-[#E6D1A1]" : "text-neutral-500"
      )}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  icon,
  variant,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant: "dark" | "light";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] transition-all duration-200",
        variant === "dark"
          ? "border-white/[0.08] bg-white/[0.03] text-white/62"
          : "border-neutral-200 bg-neutral-50 text-neutral-600"
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function MetricTile({
  label,
  value,
  subtext,
  variant,
}: {
  label: string;
  value: string;
  subtext: string;
  variant: "dark" | "light";
}) {
  return (
    <div
      className={cx(
        "rounded-[20px] border p-4",
        variant === "dark"
          ? "border-white/[0.08] bg-white/[0.03]"
          : "border-neutral-200 bg-neutral-50"
      )}
    >
      <div
        className={cx(
          "font-mono text-[9px] uppercase tracking-[0.2em]",
          variant === "dark" ? "text-white/36" : "text-neutral-400"
        )}
      >
        {label}
      </div>
      <div
        className={cx(
          "mt-2 text-2xl font-light tracking-tight",
          variant === "dark" ? "text-white" : "text-neutral-900"
        )}
      >
        {value}
      </div>
      <div
        className={cx(
          "mt-2 text-[11px] leading-5",
          variant === "dark" ? "text-white/48" : "text-neutral-500"
        )}
      >
        {subtext}
      </div>
    </div>
  );
}

export function ConstitutionalNarrativeBlock({
  constitution,
  nextAction,
  sessionKey,
  variant = "dark",
  compact = false,
  className,
}: ConstitutionalNarrativeBlockProps) {
  const sectionClass =
    variant === "dark"
      ? "rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
      : "rounded-[28px] border border-neutral-200 bg-white shadow-sm";

  const textMain = variant === "dark" ? "text-white" : "text-neutral-900";
  const textBody = variant === "dark" ? "text-white/66" : "text-neutral-600";
  const textMuted = variant === "dark" ? "text-white/48" : "text-neutral-500";
  const nextActionClass =
    variant === "dark"
      ? "rounded-[22px] border border-[#C9A96A]/22 bg-gradient-to-br from-[#C9A96A]/[0.08] to-transparent p-5"
      : "rounded-[22px] border border-amber-200 bg-amber-50/50 p-5";

  return (
    <section className={cx("relative overflow-hidden", sectionClass, className)}>
      {variant === "dark" ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.08),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </>
      ) : null}

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-4xl">
            <MonoEyebrow variant={variant}>⚖ Constitutional Posture</MonoEyebrow>

            <h2 className={cx("mt-4 text-3xl font-serif tracking-tight md:text-4xl", textMain)}>
              Decision-grade posture issued
            </h2>

            <p className={cx("mt-4 max-w-3xl text-sm leading-7", textBody)}>
              {constitution.narrativeSummary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill variant={variant} icon={<ShieldCheck className="h-3 w-3" />}>
              Route: {constitution.route}
            </Pill>
            <Pill variant={variant} icon={<Target className="h-3 w-3" />}>
              {constitution.priority}
            </Pill>
            <Pill variant={variant} icon={<Sparkles className="h-3 w-3" />}>
              {constitution.temperature}
            </Pill>
          </div>
        </div>

        {!compact ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Org State"
              value={constitution.orgState}
              subtext="Structural operating posture."
              variant={variant}
            />
            <MetricTile
              label="Readiness"
              value={constitution.readinessTier}
              subtext="Execution readiness under current conditions."
              variant={variant}
            />
            <MetricTile
              label="Authority"
              value={constitution.authorityType}
              subtext="Sponsor and escalation posture."
              variant={variant}
            />
            <MetricTile
              label="Market Risk"
              value={constitution.marketRiskBand}
              subtext="Risk environment inferred from constitutional indicators."
              variant={variant}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Pill variant={variant} icon={<Scale className="h-3 w-3" />}>
            Revenue: {constitution.revenueBand}
          </Pill>
          <Pill variant={variant} icon={<Briefcase className="h-3 w-3" />}>
            Priority: {constitution.priority}
          </Pill>
          {sessionKey ? (
            <Pill variant={variant} icon={<Lock className="h-3 w-3" />}>
              Session: {sessionKey.slice(0, 8)}
            </Pill>
          ) : null}
        </div>

        {nextAction ? (
          <div className={cx("mt-6", nextActionClass)}>
            <div className="flex items-center gap-2">
              <Compass
                className={cx(
                  "h-3.5 w-3.5",
                  variant === "dark" ? "text-[#E7D2A4]" : "text-amber-700"
                )}
              />
              <div
                className={cx(
                  "font-mono text-[10px] uppercase tracking-[0.22em]",
                  variant === "dark" ? "text-[#E7D2A4]" : "text-amber-800"
                )}
              >
                Next Action
              </div>
            </div>
            <p
              className={cx(
                "mt-3 text-sm leading-7",
                variant === "dark" ? "text-[#EDE0BE]" : "text-amber-950"
              )}
            >
              {nextAction}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div>
            <div className={cx("mb-3 flex items-center gap-2 text-[11px] font-medium", textMain)}>
              <Eye className="h-4 w-4" />
              Dominant Domains
            </div>
            <div className="flex flex-wrap gap-2">
              {constitution.dominantDomains.length ? (
                constitution.dominantDomains.map((item) => (
                  <Pill key={item} variant={variant}>
                    {item}
                  </Pill>
                ))
              ) : (
                <div className={cx("text-sm", textMuted)}>None isolated.</div>
              )}
            </div>
          </div>

          <div>
            <div className={cx("mb-3 flex items-center gap-2 text-[11px] font-medium", textMain)}>
              <AlertTriangle className="h-4 w-4" />
              Failure Modes
            </div>
            <div className="flex flex-wrap gap-2">
              {constitution.failureModes.length ? (
                constitution.failureModes.map((item) => (
                  <Pill key={item} variant={variant}>
                    {item}
                  </Pill>
                ))
              ) : (
                <div className={cx("text-sm", textMuted)}>None isolated.</div>
              )}
            </div>
          </div>

          <div>
            <div className={cx("mb-3 flex items-center gap-2 text-[11px] font-medium", textMain)}>
              <Sparkles className="h-4 w-4" />
              Required Interventions
            </div>
            <div className="flex flex-wrap gap-2">
              {constitution.requiredInterventions.length ? (
                constitution.requiredInterventions.map((item) => (
                  <Pill key={item} variant={variant}>
                    {item}
                  </Pill>
                ))
              ) : (
                <div className={cx("text-sm", textMuted)}>No intervention cluster surfaced.</div>
              )}
            </div>
          </div>
        </div>

        {constitution.rationale?.length ? (
          <div className="mt-6">
            <div className={cx("mb-3 text-[11px] font-medium", textMain)}>Rationale</div>
            <div className="space-y-2">
              {constitution.rationale.slice(0, 4).map((item, idx) => (
                <div
                  key={`${idx}-${item}`}
                  className={cx(
                    "rounded-[16px] border px-4 py-3 text-sm leading-6",
                    variant === "dark"
                      ? "border-white/[0.08] bg-white/[0.02] text-white/62"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600"
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}