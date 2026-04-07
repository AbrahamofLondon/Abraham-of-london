"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  Lock,
  Activity,
  TrendingUp,
  Heart,
  Briefcase,
  Gauge,
  Brain,
  AlertTriangle,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  generateMandate,
  type InterventionDomain,
} from "@/lib/alignment/intervention-engine";
import {
  generateHCDMandate,
  type HCDInterventionDomain,
} from "@/lib/alignment/human-capital-delta";
import { mandateProtocol } from "@/app/actions/governance";

export type TelemetryLens =
  | "STRATEGIC"
  | "HUMAN_CAPITAL"
  | "FINANCIAL"
  | "OPERATIONAL"
  | "GOVERNANCE";

type MetricRecord = {
  label?: string;
  intent?: number | null;
  reality?: number | null;
  burnoutIndex?: number | null;
  [key: string]: unknown;
};

type ReportContext = {
  state: string;
  priorityStack: string[];
  failureModes: string[];
};

interface InterventionProposalProps {
  metrics: MetricRecord[];
  campaignId: string;
  lens?: TelemetryLens;
  onLensChange?: (lens: TelemetryLens) => void;
  reportContext?: ReportContext;
}

type EnhancedMandate = {
  title: string;
  description: string;
  investment_tier: string;
  urgency: string;
};

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function roundTo(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function toDomainKey(label: string): string {
  return normalizeString(label)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getMetricDelta(metric: MetricRecord, lens: TelemetryLens): number {
  const intent = normalizeNumber(metric.intent, 0);
  const reality = normalizeNumber(metric.reality, 0);
  const baselineDelta = Math.max(0, intent - reality);

  if (lens === "HUMAN_CAPITAL") {
    return Math.max(
      0,
      normalizeNumber(metric.burnoutIndex, baselineDelta),
    );
  }

  return baselineDelta;
}

function getTopIssue(
  metrics: MetricRecord[],
  lens: TelemetryLens,
): MetricRecord | null {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;

  const sorted = [...metrics].sort(
    (a, b) => getMetricDelta(b, lens) - getMetricDelta(a, lens),
  );

  return sorted[0] ?? null;
}

/**
 * ALIGNMENT ORBIT — Visual Recovery Tracker
 */
function AlignmentOrbit({
  raw,
  current,
  label = "Resonance",
}: {
  raw: number;
  current: number;
  label?: string;
}) {
  const safeRaw = Math.max(0, raw);
  const safeCurrent = Math.max(0, current);
  const recovered = Math.max(0, safeRaw - safeCurrent);
  const percentage =
    safeRaw > 0 ? Math.round((recovered / safeRaw) * 100) : 0;

  return (
    <div className="mt-6 flex items-center justify-between gap-6 border-t border-neutral-100 pt-6">
      <div className="flex-1">
        <div className="mb-1.5 flex justify-between items-end">
          <p className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
            {label}
          </p>
          <p className="text-[7px] font-mono text-neutral-400">
            {percentage}% Recovered
          </p>
        </div>
        <div className="relative h-px w-full bg-neutral-200">
          <div
            className="absolute top-0 left-0 h-full bg-neutral-500 transition-all duration-1000 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="text-[5px] font-mono uppercase text-neutral-400">
            Baseline: {Math.round(safeRaw)}%
          </span>
          <span className="text-[5px] font-mono uppercase text-neutral-400">
            Target: Zero
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="border-l border-neutral-200 pl-4 text-right">
          <p className="mb-0.5 text-[5px] font-mono uppercase text-neutral-400">
            Current Delta
          </p>
          <p className="text-base font-light tracking-tight text-neutral-700">
            {Math.round(safeCurrent)}%
          </p>
        </div>
        <div className="border-l border-neutral-200 pl-4 text-right">
          <p className="mb-0.5 text-[5px] font-mono uppercase text-neutral-400">
            Status
          </p>
          <p
            className={`text-[7px] font-mono uppercase tracking-wider ${
              safeCurrent < 30 ? "text-emerald-600" : "text-neutral-500"
            }`}
          >
            {safeCurrent < 30 ? "Stable" : "Correcting"}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * LENS SELECTOR — Toggle between telemetry modes
 */
function LensSelector({
  currentLens,
  onLensChange,
}: {
  currentLens: TelemetryLens;
  onLensChange: (lens: TelemetryLens) => void;
}) {
  const lenses: { value: TelemetryLens; label: string; icon: React.ReactNode }[] =
    [
      {
        value: "STRATEGIC",
        label: "Strategic",
        icon: <TrendingUp className="h-2.5 w-2.5" />,
      },
      {
        value: "HUMAN_CAPITAL",
        label: "Human Capital",
        icon: <Heart className="h-2.5 w-2.5" />,
      },
      {
        value: "OPERATIONAL",
        label: "Operational",
        icon: <Gauge className="h-2.5 w-2.5" />,
      },
      {
        value: "FINANCIAL",
        label: "Financial",
        icon: <Briefcase className="h-2.5 w-2.5" />,
      },
      {
        value: "GOVERNANCE",
        label: "Governance",
        icon: <Brain className="h-2.5 w-2.5" />,
      },
    ];

  return (
    <div className="flex items-center gap-1 rounded-sm border border-neutral-100 bg-neutral-50/30 p-0.5">
      {lenses.map((lens) => (
        <button
          key={lens.value}
          onClick={() => onLensChange(lens.value)}
          className={`flex items-center gap-1 px-2 py-1 text-[6px] font-mono uppercase tracking-wider transition-all ${
            currentLens === lens.value
              ? "border border-neutral-200 bg-white text-neutral-800 shadow-sm"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
          type="button"
        >
          {lens.icon}
          <span>{lens.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * CONTEXT BADGES — Display report context if available
 */
function ContextBadges({ context }: { context?: ReportContext }) {
  if (!context) return null;

  const stateConfig =
    {
      ORDERED: {
        label: "ORDERED",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: ShieldCheck,
      },
      DRIFTING: {
        label: "DRIFTING",
        color: "text-amber-600",
        bg: "bg-amber-50",
        icon: TrendingUp,
      },
      MISALIGNED: {
        label: "MISALIGNED",
        color: "text-orange-600",
        bg: "bg-orange-50",
        icon: AlertTriangle,
      },
      DISORDERED: {
        label: "DISORDERED",
        color: "text-red-600",
        bg: "bg-red-50",
        icon: AlertTriangle,
      },
    }[context.state] || {
      label: context.state,
      color: "text-neutral-600",
      bg: "bg-neutral-50",
      icon: AlertTriangle,
    };

  const Icon = stateConfig.icon;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className={`flex items-center gap-1.5 px-2 py-1 ${stateConfig.bg}`}>
        <Icon className={`h-2.5 w-2.5 ${stateConfig.color}`} />
        <span
          className={`text-[6px] font-mono uppercase tracking-wider ${stateConfig.color}`}
        >
          {stateConfig.label}
        </span>
      </div>

      {context.failureModes?.length > 0 ? (
        <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1">
          <AlertTriangle className="h-2.5 w-2.5 text-red-500" />
          <span className="text-[6px] font-mono uppercase tracking-wider text-red-600">
            {context.failureModes.length} Failure Mode
            {context.failureModes.length !== 1 ? "s" : ""}
          </span>
        </div>
      ) : null}

      {context.priorityStack?.length > 0 ? (
        <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1">
          <Target className="h-2.5 w-2.5 text-neutral-500" />
          <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-600">
            {context.priorityStack.length} Priorit
            {context.priorityStack.length !== 1 ? "ies" : "y"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * SOVEREIGN KEY AUTHORIZATION OVERLAY
 */
function SovereignKeyAuth({
  actionLabel,
  isPending,
  onConfirm,
  onCancel,
}: {
  actionLabel: string;
  isPending: boolean;
  onConfirm: (key: string) => void;
  onCancel: () => void;
}) {
  const [keyCode, setKeyCode] = useState("");
  const REQUIRED_KEY = "SOVEREIGN-ALIGN-2026";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-8 text-center shadow-2xl">
        <Lock className="mx-auto mb-5 h-6 w-6 text-neutral-400" />
        <h3 className="mb-1 text-base font-light tracking-tight text-neutral-800">
          Authorization Required
        </h3>
        <p className="mb-6 text-[7px] font-mono uppercase tracking-wider text-neutral-500">
          {actionLabel}
        </p>

        <div className="space-y-4">
          <input
            type="text"
            autoFocus
            value={keyCode}
            onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
            placeholder="Sovereign Key"
            className="w-full border border-neutral-200 px-4 py-2 text-center text-[9px] font-mono tracking-wider text-neutral-700 placeholder:text-neutral-300 focus:border-neutral-400 focus:outline-none transition-all"
            disabled={isPending}
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="py-2 text-[7px] font-mono uppercase tracking-wider text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-all"
              type="button"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm(keyCode)}
              disabled={keyCode !== REQUIRED_KEY || isPending}
              className={`flex items-center justify-center gap-1.5 py-2 text-[7px] font-mono uppercase tracking-wider transition-all ${
                keyCode === REQUIRED_KEY && !isPending
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "cursor-not-allowed bg-neutral-100 text-neutral-400"
              }`}
              type="button"
            >
              {isPending ? <Activity className="h-2 w-2 animate-spin" /> : "Authorize"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate enhanced mandate with context awareness
 */
function generateEnhancedMandate(
  domain: string,
  delta: number,
  lens: TelemetryLens,
  context?: ReportContext,
): EnhancedMandate {
  const baseMandate =
    lens === "HUMAN_CAPITAL"
      ? generateHCDMandate(
          domain as HCDInterventionDomain,
          delta,
        )
      : generateMandate(domain as InterventionDomain, delta);

  if (!context) {
    return {
      ...baseMandate,
      urgency: "STANDARD",
    };
  }

  let urgency = "STANDARD";
  let title = baseMandate.title;
  let description = baseMandate.description;

  if (context.state === "DISORDERED") {
    urgency = "CRITICAL";
    title = `[CRITICAL] ${title}`;
    description = `${description} The organisation is in a DISORDERED state requiring immediate intervention.`;
  } else if (context.state === "MISALIGNED") {
    urgency = "HIGH";
    description = `${description} Systemic misalignment detected across multiple domains.`;
  } else if (context.state === "DRIFTING") {
    urgency = "ELEVATED";
    description = `${description} Early intervention recommended to prevent further drift.`;
  }

  if (context.failureModes?.length > 0) {
    description = `${description} Primary failure mode: ${context.failureModes[0]}.`;
  }

  if (context.priorityStack?.length > 0) {
    description = `${description} Aligns with top priority: "${context.priorityStack[0]}".`;
  }

  return {
    ...baseMandate,
    title,
    description,
    urgency,
  };
}

export function InterventionProposal({
  metrics,
  campaignId,
  lens = "STRATEGIC",
  onLensChange,
  reportContext,
}: InterventionProposalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeLens, setActiveLens] = useState<TelemetryLens>(lens);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveLens(lens);
  }, [lens]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const topIssue = useMemo(() => getTopIssue(metrics, activeLens), [metrics, activeLens]);

  if (!topIssue) return null;

  const delta = Math.max(0, getMetricDelta(topIssue, activeLens));
  const issueLabel = normalizeString(topIssue.label, "Unknown Domain");
  const domain = toDomainKey(issueLabel);
  const mandate = generateEnhancedMandate(domain, delta, activeLens, reportContext);

  const recoveryProjection = `+${Math.round(
    delta * (activeLens === "FINANCIAL" ? 0.95 : 0.85),
  )}%`;

  const currentDissonance = delta;
  const rawDissonance = roundTo(delta * 1.25, 2);

  const lensStyles =
    {
      STRATEGIC: {
        accent: "border-neutral-500",
        bg: "bg-neutral-50",
        text: "text-neutral-500",
        icon: <TrendingUp className="h-3 w-3" />,
      },
      HUMAN_CAPITAL: {
        accent: "border-blue-500",
        bg: "bg-blue-50/30",
        text: "text-blue-500",
        icon: <Heart className="h-3 w-3" />,
      },
      OPERATIONAL: {
        accent: "border-amber-500",
        bg: "bg-amber-50/30",
        text: "text-amber-500",
        icon: <Gauge className="h-3 w-3" />,
      },
      FINANCIAL: {
        accent: "border-emerald-500",
        bg: "bg-emerald-50/30",
        text: "text-emerald-500",
        icon: <Briefcase className="h-3 w-3" />,
      },
      GOVERNANCE: {
        accent: "border-purple-500",
        bg: "bg-purple-50/30",
        text: "text-purple-500",
        icon: <Brain className="h-3 w-3" />,
      },
    }[activeLens];

  const urgencyStyles =
    {
      CRITICAL: "border-red-500 bg-red-50 text-red-700",
      HIGH: "border-orange-500 bg-orange-50 text-orange-700",
      ELEVATED: "border-amber-500 bg-amber-50 text-amber-700",
      STANDARD: "border-neutral-500 bg-neutral-50 text-neutral-700",
    }[mandate.urgency] || "border-neutral-500 bg-neutral-50 text-neutral-700";

  const handleFinalDeployment = (key: string) => {
    startTransition(async () => {
      const result = await mandateProtocol({
        campaignId,
        domain: issueLabel,
        action: mandate.title || `${activeLens} Intervention`,
        recoveryProjection,
        sovereignKey: key,
        context: reportContext
          ? {
              state: reportContext.state,
              failureModes: reportContext.failureModes,
              priorityStack: reportContext.priorityStack,
            }
          : undefined,
      });

      if (result.success) {
        setShowAuth(false);
        return;
      }

      alert(result.error || "Deployment failed");
    });
  };

  return (
    <>
      {showAuth ? (
        <SovereignKeyAuth
          actionLabel={mandate.title || `${activeLens} Intervention`}
          isPending={isPending}
          onCancel={() => setShowAuth(false)}
          onConfirm={handleFinalDeployment}
        />
      ) : null}

      <div className="overflow-hidden border border-neutral-100 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-5 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`border p-1.5 ${lensStyles.accent} ${lensStyles.bg}`}>
                {React.cloneElement(lensStyles.icon as React.ReactElement, {
                  className: `h-3 w-3 ${lensStyles.text}`,
                })}
              </div>
              <div>
                <span className="block text-[6px] font-mono uppercase tracking-wider text-neutral-400">
                  Sovereign Mandate
                </span>
                <div className="mt-1 h-px w-5 bg-neutral-200" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LensSelector
                currentLens={activeLens}
                onLensChange={(nextLens) => {
                  setActiveLens(nextLens);
                  onLensChange?.(nextLens);
                }}
              />

              <span
                className={`border px-2 py-0.5 text-[5px] font-mono uppercase tracking-wider ${urgencyStyles}`}
              >
                {mandate.urgency}
              </span>

              <span className="border border-neutral-200 px-2 py-0.5 text-[5px] font-mono uppercase tracking-wider text-neutral-500">
                {mandate.investment_tier || "Standard"}
              </span>
            </div>
          </div>

          <ContextBadges context={reportContext} />

          <div className="grid grid-cols-12 items-center gap-6">
            <div className="col-span-12 lg:col-span-7">
              <h3 className="mb-3 text-lg font-light italic tracking-tight text-neutral-800 leading-tight">
                {mandate.title || `${activeLens} Intervention Required`}
              </h3>
              <div className="max-w-md">
                <p className="border-l border-neutral-200 py-1 pl-3 text-[10px] font-light leading-relaxed text-neutral-500">
                  {mandate.description ||
                    `Institutional variance of ${delta}% requires immediate recalibration within the ${activeLens.toLowerCase()} domain.`}
                </p>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="border border-neutral-100 bg-neutral-50/30 p-5">
                <div className="mb-3 flex justify-between items-end">
                  <div>
                    <p className="mb-0.5 text-[5px] font-mono uppercase tracking-wider text-neutral-400">
                      Efficiency Recovery
                    </p>
                    <p className="text-lg font-light tracking-tight text-neutral-700">
                      {recoveryProjection}
                    </p>
                  </div>
                </div>

                <div className="mb-4 h-px w-full overflow-hidden bg-neutral-200">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${lensStyles.text.replace(
                      "text",
                      "bg",
                    )}`}
                    style={{
                      width: isMounted
                        ? `${Math.min(100, Math.round(delta * 0.85))}%`
                        : "0%",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuth(true)}
                  className="group flex w-full items-center justify-center gap-1.5 border border-neutral-800 bg-neutral-900 py-2.5 text-[6px] font-mono uppercase tracking-wider text-white transition-all duration-300 hover:bg-black"
                >
                  <span>Deploy Protocol</span>
                  <ArrowRight className="h-2 w-2 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          <AlignmentOrbit
            raw={rawDissonance}
            current={currentDissonance}
            label={`${activeLens.replace(/_/g, " ")} Delta`}
          />
        </div>
      </div>
    </>
  );
}