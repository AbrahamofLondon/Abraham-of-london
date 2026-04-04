// components/strategy-room/ConstitutionalResultSurface.tsx
"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Eye,
  Gauge,
  GitBranch,
  Layers3,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ConstitutionalNarrativeBlock } from "@/components/decision/ConstitutionalNarrativeBlock";
import { UnifiedRecommendationList } from "@/components/decision/UnifiedRecommendationList";
import { ConstitutionalFollowupPanel } from "@/components/strategy-room/ConstitutionalFollowupPanel";
import type { CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function routeMeta(route?: string) {
  switch (route) {
    case "STRATEGY":
      return {
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        label: "Strategy path",
      };
    case "DIAGNOSTIC":
      return {
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        label: "Diagnostic path",
      };
    case "REJECT":
    default:
      return {
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        label: route || "Governed route",
      };
  }
}

function metricTone(value: number): string {
  if (value >= 75) return "bg-emerald-400";
  if (value >= 50) return "bg-[#C9A96A]";
  if (value >= 25) return "bg-amber-300";
  return "bg-white/25";
}

function resultReadinessMeta(
  route?: string,
  recommendationCount?: number,
  suppressedCount?: number,
) {
  const recommendations = safeNumber(recommendationCount);
  const suppressed = safeNumber(suppressedCount);

  if (route === "STRATEGY" && recommendations >= 2) {
    return {
      label: "Escalation ready",
      chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
      text: "The case has sufficient fit and governed direction to proceed to the next strategic layer.",
    };
  }

  if (route === "DIAGNOSTIC" || suppressed > recommendations) {
    return {
      label: "Correction first",
      chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
      text: "The signal is usable, but governed correction should come before any higher-order move.",
    };
  }

  return {
    label: "Foundation required",
    chip: "border-red-400/25 bg-red-500/10 text-red-300",
    text: "The constitutional posture points toward foundational strengthening before progression.",
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/36">
              {label}
            </div>
            {sublabel ? (
              <div className="mt-1 text-[11px] text-white/45">{sublabel}</div>
            ) : null}
          </div>
        </div>
        <div className="text-2xl font-light tracking-tight text-white">{value}</div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", metricTone(value))}
          style={{ width: `${Math.max(6, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function StatusPanel({
  sessionKey,
  route,
  recommendationCount,
  suppressedCount,
}: {
  sessionKey: string | null;
  route?: string;
  recommendationCount: number;
  suppressedCount: number;
}) {
  const routeState = routeMeta(route);
  const readiness = resultReadinessMeta(route, recommendationCount, suppressedCount);

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D1A1]">
          <Sparkles className="h-3.5 w-3.5" />
          Result Surface
        </span>

        <span className={cn("rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]", routeState.chip)}>
          {routeState.label}
        </span>

        {sessionKey ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] text-white/50">
            <Lock className="h-3 w-3" />
            {sessionKey.slice(0, 8).toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h3 className="text-2xl font-serif tracking-tight text-white">
            Governed result
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
            The constitutional reading, recommendation surface, and follow-up path now sit in one
            chain. Signal, selection, and next move remain under the same governing logic.
          </p>
        </div>

        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/36">
            Present state
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={cn("rounded-full border px-3 py-1 text-[11px]", readiness.chip)}>
              {readiness.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58">
              Recommendations {recommendationCount}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58">
              Suppressed {suppressedCount}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/60">{readiness.text}</p>
        </div>
      </div>
    </section>
  );
}

function DiagnosticsPanel({
  diagnostics,
}: {
  diagnostics?: CanonicalSectionsEnvelope["diagnostics"];
}) {
  if (!diagnostics) return null;

  const assetPoolSize = safeNumber(diagnostics.assetPoolSize);
  const matchedAssetCount = safeNumber(diagnostics.matchedAssetCount);
  const governanceRuleCount = safeNumber(diagnostics.governanceRuleCount);
  const governanceSuppressedCount = safeNumber(diagnostics.governanceSuppressedCount);
  const adaptiveAssetsLoaded = safeNumber(diagnostics.adaptiveAssetsLoaded);
  const contextualAssetsLoaded = safeNumber(diagnostics.contextualAssetsLoaded);

  const qualitySignal =
    matchedAssetCount > 0
      ? Math.round((matchedAssetCount / Math.max(assetPoolSize, 1)) * 100)
      : 0;

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D1A1]">
          <Gauge className="h-3.5 w-3.5" />
          System Diagnostics
        </span>

        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
          Internal visibility
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Database}
          label="Asset Pool"
          value={assetPoolSize}
          sublabel="Total addressable assets"
        />
        <MetricCard
          icon={Eye}
          label="Matched Assets"
          value={matchedAssetCount}
          sublabel="Assets surviving first pass"
        />
        <MetricCard
          icon={Scale}
          label="Governance Rules"
          value={governanceRuleCount}
          sublabel="Rule pressure applied"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Suppressed Assets"
          value={governanceSuppressedCount}
          sublabel="Removed under governance"
        />
        <MetricCard
          icon={Layers3}
          label="Adaptive Assets"
          value={adaptiveAssetsLoaded}
          sublabel="Adaptive layer loaded"
        />
        <MetricCard
          icon={GitBranch}
          label="Contextual Assets"
          value={contextualAssetsLoaded}
          sublabel="Context layer loaded"
        />
      </div>

      <div className="mt-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/36">
          Match efficiency
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-3xl font-light tracking-tight text-white">{qualitySignal}%</div>
          <div className="text-right text-[11px] leading-5 text-white/48">
            matched ÷ pool
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full transition-all duration-500", metricTone(qualitySignal))}
            style={{ width: `${Math.max(6, Math.min(qualitySignal, 100))}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function ConstitutionalResultSurface({
  data,
  sessionKey,
  onResubmit,
  onMarkDiagnosticStarted,
  onMarkStrategyAccepted,
  organisationId,
}: {
  data: CanonicalSectionsEnvelope;
  sessionKey: string | null;
  onResubmit: () => Promise<void> | void;
  onMarkDiagnosticStarted: () => Promise<void> | void;
  onMarkStrategyAccepted?: () => Promise<void> | void;
  organisationId?: string;
}) {
  const sections = data?.sections;
  const diagnostics = data?.diagnostics;

  if (!sections?.constitutionalPosture || !sections?.governedRecommendations) {
    return (
      <div className="mt-10">
        <section className="overflow-hidden rounded-[28px] border border-red-400/15 bg-red-500/[0.05] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-300/80">
                Result unavailable
              </div>
              <p className="mt-2 text-sm leading-7 text-red-100/85">
                The governed result surface could not be assembled because the required constitutional sections were not present.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const posture = sections.constitutionalPosture;
  const governed = sections.governedRecommendations;
  const recommendationItems = Array.isArray(governed.recommendations)
    ? governed.recommendations
    : [];

  const recommendationCount = recommendationItems.length;
  const suppressedCount = safeNumber(diagnostics?.governanceSuppressedCount);

  return (
    <div className="mt-10 space-y-6">
      <StatusPanel
        sessionKey={sessionKey}
        route={posture?.route}
        recommendationCount={recommendationCount}
        suppressedCount={suppressedCount}
      />

      <ConstitutionalNarrativeBlock
        constitution={posture}
        nextAction={governed.nextAction}
        sessionKey={sessionKey}
        variant="dark"
      />

      <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <UnifiedRecommendationList
          items={recommendationItems}
          variant="dark"
          title="Governed Recommendations"
          emptyText="No constitutionally suitable assets were surfaced strongly enough to recommend."
        />
      </section>

      <DiagnosticsPanel diagnostics={diagnostics} />

      <ConstitutionalFollowupPanel
        sessionKey={sessionKey}
        constitution={posture}
        organisationId={organisationId}
        onResubmit={onResubmit}
        onStartDiagnostic={onMarkDiagnosticStarted}
        onEscalateStrategy={onMarkStrategyAccepted}
      />
    </div>
  );
}