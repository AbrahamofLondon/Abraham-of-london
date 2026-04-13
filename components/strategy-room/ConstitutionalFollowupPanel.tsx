// components/strategy-room/ConstitutionalFollowupPanel.tsx
"use client";

import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  Lock,
  RotateCcw,
  ShieldCheck,
  Target,
  Crown,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { deployIntervention } from "@/app/actions/deploy-intervention";

type ConstitutionalRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
type ReadinessTier =
  | "UNQUALIFIED"
  | "DIAGNOSTIC"
  | "ADVISORY"
  | "EXECUTION"
  | "SOVEREIGN"
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY";
type InterventionDomain =
  | "GOVERNANCE"
  | "EXECUTION"
  | "ALIGNMENT"
  | "DECISION_QUALITY"
  | "OPERATING_CADENCE"
  | "TRUST"
  | "BOARD"
  | "STRATEGIC_INTENT"
  | "OPERATIONAL_CLARITY"
  | "LEADERSHIP_TRUST"
  | "CULTURAL_COHESION";

export type ConstitutionalFollowupPayload = {
  sessionKey: string | null;
  constitution: {
    route: ConstitutionalRoute;
    orgState: string;
    readinessTier: ReadinessTier | string;
    authorityType: AuthorityType | string;
    domain?: InterventionDomain | string;
    confidence?: number | null;
    rationale?: string[] | null;
    disqualifiers?: string[] | null;
    interventions?: string[] | null;
  };
  onResubmit: () => Promise<void> | void;
  onStartDiagnostic: () => Promise<void> | void;
  onEscalateStrategy?: () => Promise<void> | void;
  organisationId?: string;
};

type ActionState = "idle" | "success" | "error";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function routeMeta(route: ConstitutionalRoute) {
  switch (route) {
    case "STRATEGY":
      return {
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        icon: Crown,
        label: "Strategy path",
        summary: "The case is fit for governed strategic progression.",
      };
    case "DIAGNOSTIC":
      return {
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        icon: Compass,
        label: "Diagnostic path",
        summary: "The signal is credible, but corrective work comes before escalation.",
      };
    case "REJECT":
    default:
      return {
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        icon: AlertTriangle,
        label: "Foundational route",
        summary: "The foundations need strengthening before any higher route is opened.",
      };
  }
}

function normaliseAuthorityType(value: string): AuthorityType {
  if (value === "DIRECT" || value === "PROXY" || value === "UNCLEAR") return value;
  return "UNCLEAR";
}

function normaliseReadinessTier(value: string): ReadinessTier {
  const allowed: ReadinessTier[] = [
    "UNQUALIFIED",
    "DIAGNOSTIC",
    "ADVISORY",
    "EXECUTION",
    "SOVEREIGN",
    "FRAGILE",
    "EMERGING",
    "STABILIZING",
    "EXECUTION_READY",
  ];
  return allowed.includes(value as ReadinessTier) ? (value as ReadinessTier) : "DIAGNOSTIC";
}

function normaliseDomain(value?: string): InterventionDomain {
  const allowed: InterventionDomain[] = [
    "GOVERNANCE",
    "EXECUTION",
    "ALIGNMENT",
    "DECISION_QUALITY",
    "OPERATING_CADENCE",
    "TRUST",
    "BOARD",
    "STRATEGIC_INTENT",
    "OPERATIONAL_CLARITY",
    "LEADERSHIP_TRUST",
    "CULTURAL_COHESION",
  ];
  return allowed.includes(value as InterventionDomain)
    ? (value as InterventionDomain)
    : "GOVERNANCE";
}

function formatReadinessTier(value: string): string {
  return value.replaceAll("_", " ");
}

function sessionSnippet(sessionKey: string | null): string | null {
  if (!sessionKey) return null;
  return sessionKey.slice(0, 8).toUpperCase();
}

async function safelyRun(fn?: () => Promise<void> | void) {
  if (!fn) return;
  await fn();
}

export function ConstitutionalFollowupPanel({
  sessionKey,
  constitution,
  onResubmit,
  onStartDiagnostic,
  onEscalateStrategy,
  organisationId,
}: ConstitutionalFollowupPayload) {
  const [deploying, setDeploying] = React.useState(false);
  const [resubmitting, setResubmitting] = React.useState(false);
  const [startingDiagnostic, setStartingDiagnostic] = React.useState(false);
  const [escalating, setEscalating] = React.useState(false);

  const [deployState, setDeployState] = React.useState<ActionState>("idle");
  const [deployMessage, setDeployMessage] = React.useState("");

  const showDiagnostic =
    constitution.route === "DIAGNOSTIC" || constitution.route === "REJECT";
  const showStrategy =
    constitution.route === "STRATEGY" && typeof onEscalateStrategy === "function";
  const showIntervention =
    constitution.route === "STRATEGY" && Boolean(organisationId);

  const meta = routeMeta(constitution.route);
  const RouteIcon = meta.icon;

  const visibleRationale = (constitution.rationale ?? []).filter(Boolean).slice(0, 3);
  const visibleDisqualifiers = (constitution.disqualifiers ?? []).filter(Boolean).slice(0, 3);
  const visibleInterventions = (constitution.interventions ?? []).filter(Boolean).slice(0, 4);

  const handleResubmit = React.useCallback(async () => {
    setResubmitting(true);
    try {
      await safelyRun(onResubmit);
    } finally {
      setResubmitting(false);
    }
  }, [onResubmit]);

  const handleStartDiagnostic = React.useCallback(async () => {
    setStartingDiagnostic(true);
    try {
      await safelyRun(onStartDiagnostic);
    } finally {
      setStartingDiagnostic(false);
    }
  }, [onStartDiagnostic]);

  const handleEscalateStrategy = React.useCallback(async () => {
    if (!onEscalateStrategy) return;
    setEscalating(true);
    try {
      await safelyRun(onEscalateStrategy);
    } finally {
      setEscalating(false);
    }
  }, [onEscalateStrategy]);

  const handleDeployIntervention = React.useCallback(async () => {
    if (!organisationId) return;

    setDeploying(true);
    setDeployState("idle");
    setDeployMessage("");

    try {
      const result = await deployIntervention({
        organisationId,
        domain: normaliseDomain(constitution.domain),
        baselineScore: 65,
        urgency: "immediate",
        clarityScore: 70,
        authorityType: normaliseAuthorityType(constitution.authorityType),
        readinessTier: normaliseReadinessTier(constitution.readinessTier) as "FRAGILE" | "EMERGING" | "STABILIZING" | "EXECUTION_READY" | "SOVEREIGN",
        failureModeCount: 2,
      });

      if (result.success) {
        setDeployState("success");
        setDeployMessage(
          "Constitutional intervention deployed successfully under governed escalation.",
        );
      } else {
        setDeployState("error");
        setDeployMessage(result.error || "Intervention deployment was blocked.");
      }
    } catch {
      setDeployState("error");
      setDeployMessage("Intervention deployment failed.");
    } finally {
      setDeploying(false);
    }
  }, [organisationId, constitution.domain, constitution.authorityType, constitution.readinessTier]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#E6D1A1]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Follow-up Path
          </span>

          <span className={cn("rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]", meta.chip)}>
            <RouteIcon className="mr-1 inline h-3.5 w-3.5" />
            {meta.label}
          </span>

          {sessionKey ? (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] text-white/50">
              <Lock className="h-3 w-3" />
              {sessionSnippet(sessionKey)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-2xl font-serif tracking-tight text-white">
          Governed next steps
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
          {meta.summary}
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                Current posture
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>{constitution.orgState}</Pill>
                <Pill>{formatReadinessTier(constitution.readinessTier)}</Pill>
                <Pill>{constitution.authorityType}</Pill>
                {typeof constitution.confidence === "number" ? (
                  <Pill>Confidence {Math.round(constitution.confidence * 100)}%</Pill>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-white/62">
                Present state:{" "}
                <span className="text-white/88">{constitution.orgState}</span> · readiness{" "}
                <span className="text-white/88">
                  {formatReadinessTier(constitution.readinessTier)}
                </span>{" "}
                · authority{" "}
                <span className="text-white/88">{constitution.authorityType}</span>.
              </p>
            </div>

            {visibleRationale.length > 0 ? (
              <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Basis
                </div>
                <div className="mt-4 space-y-2">
                  {visibleRationale.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/66">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleDisqualifiers.length > 0 ? (
              <div className="rounded-[24px] border border-amber-400/15 bg-amber-500/[0.05] p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300/75">
                  Active constraints
                </div>
                <div className="mt-4 space-y-2">
                  {visibleDisqualifiers.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/66">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleInterventions.length > 0 ? (
              <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Priority interventions
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {visibleInterventions.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#E6D1A1]">
                <Sparkles className="h-3.5 w-3.5" />
                Next moves
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-mono uppercase tracking-[0.18em] text-white/75 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                >
                  {resubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing signal
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Resubmit stronger signal
                    </>
                  )}
                </button>

                {showDiagnostic ? (
                  <button
                    onClick={handleStartDiagnostic}
                    disabled={startingDiagnostic}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C9A96A]/30 bg-[#C9A96A]/[0.08] px-5 py-3 text-xs font-mono uppercase tracking-[0.18em] text-[#E6D1A1] transition-all hover:bg-[#C9A96A]/[0.15] disabled:opacity-60"
                  >
                    {startingDiagnostic ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening diagnostic
                      </>
                    ) : (
                      <>
                        <ClipboardList className="h-4 w-4" />
                        Start diagnostic correction
                      </>
                    )}
                  </button>
                ) : null}

                {showStrategy ? (
                  <button
                    onClick={handleEscalateStrategy}
                    disabled={escalating}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-xs font-mono uppercase tracking-[0.18em] text-emerald-200 transition-all hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {escalating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening strategy path
                      </>
                    ) : (
                      <>
                        <Compass className="h-4 w-4" />
                        Proceed to strategy execution
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : null}

                {showIntervention ? (
                  <button
                    onClick={handleDeployIntervention}
                    disabled={deploying}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-xs font-mono uppercase tracking-[0.18em] text-amber-300 transition-all hover:bg-amber-500/20 disabled:opacity-60"
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying intervention
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4" />
                        Deploy constitutional intervention
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>

            {deployState !== "idle" ? (
              <div
                className={cn(
                  "rounded-[24px] border p-5 text-sm leading-7",
                  deployState === "success"
                    ? "border-emerald-400/15 bg-emerald-500/[0.06] text-emerald-100/90"
                    : "border-red-400/15 bg-red-500/[0.06] text-red-100/90",
                )}
              >
                <div className="flex items-start gap-3">
                  {deployState === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
                  )}
                  <div>{deployMessage}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58">
      {children}
    </span>
  );
}