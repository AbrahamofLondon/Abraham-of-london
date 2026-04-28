"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Copy,
  Eye,
  FileSignature,
  Gauge,
  Gavel,
  Heart,
  Loader2,
  Lock,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export type ConstitutionalRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type ReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";
export type AuthorityLevel =
  | "OBSERVER"
  | "PARTICIPANT"
  | "DELEGATE"
  | "AUTHORITY"
  | "SOVEREIGN";

export type ConstitutionalDecisionLite = {
  route: ConstitutionalRoute;
  confidence: number;
  disqualifiersTriggered?: string[];
  recommendedInterventions?: string[];
};

export type ConstitutionalAuthorityLite = {
  userId: string;
  authorityLevel: AuthorityLevel;
  scope: string[];
};

export type DomainDiagnosticLite = {
  domain: string;
  score: number;
  effortIndex: number;
  trajectory: "IMPROVING" | "STABLE" | "DECAYING";
  interventionScript: string;
};

export type EnhancedInterventionDiagnostic = DomainDiagnosticLite & {
  constitutionalImpact: {
    routeImpact: number;
    constitutionalRouteAlignment: ConstitutionalRoute;
    authorityTypeRequired: AuthorityType;
    readinessTierRequired: ReadinessTier;
    authorityLevelRequired: AuthorityLevel;
    recommendedInterventionPriority:
      | "immediate"
      | "short-term"
      | "medium-term"
      | "strategic";
    disqualifierRelevance: string[];
  };
  domainSpecificGuidance: string;
  estimatedTimeline: string;
  recommendedAction: string;
  signatureRequired: boolean;
};

export type InterventionCopilotProps = {
  diagnostics: EnhancedInterventionDiagnostic[];
  campaignId: string;
  constitutionalDecision?: ConstitutionalDecisionLite | null;
  constitutionalAuthority?: ConstitutionalAuthorityLite | null;
  participantCount?: number;
  minimumResponses?: number;
  onCopyScript?: (domain: string, script: string) => void;
  onRequestDetail?: (domain: string) => void;
  onCreateIntervention?: (
    domain: string,
    intervention: string,
    meta: {
      campaignId: string;
      requiresSignature: boolean;
      authorityRequired: AuthorityLevel;
    },
  ) => Promise<void> | void;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function priorityTone(
  priority: EnhancedInterventionDiagnostic["constitutionalImpact"]["recommendedInterventionPriority"],
) {
  switch (priority) {
    case "immediate":
      return {
        badge: "border-red-400/20 bg-red-500/10 text-red-300",
        rail: "from-red-500 to-red-600",
        label: "Immediate",
      };
    case "short-term":
      return {
        badge: "border-amber-400/20 bg-amber-500/10 text-amber-300",
        rail: "from-amber-500 to-amber-600",
        label: "Short-Term",
      };
    case "medium-term":
      return {
        badge: "border-blue-400/20 bg-blue-500/10 text-blue-300",
        rail: "from-blue-500 to-blue-600",
        label: "Medium-Term",
      };
    case "strategic":
    default:
      return {
        badge: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        rail: "from-emerald-500 to-emerald-600",
        label: "Strategic",
      };
  }
}

function getDomainIcon(domain: string) {
  const key = domain.toLowerCase();

  if (key.includes("mandate")) return ShieldCheck;
  if (key.includes("decision")) return Gavel;
  if (key.includes("environment")) return Compass;
  if (key.includes("behaviour") || key.includes("behavior")) return Users;
  if (key.includes("emotion")) return Heart;
  if (key.includes("legacy")) return Target;
  return Gauge;
}

function canAct(
  current: AuthorityLevel | undefined,
  required: AuthorityLevel,
): boolean {
  const levels: Record<AuthorityLevel, number> = {
    OBSERVER: 0,
    PARTICIPANT: 1,
    DELEGATE: 2,
    AUTHORITY: 3,
    SOVEREIGN: 4,
  };

  return levels[current || "OBSERVER"] >= levels[required];
}

function participationReady(participantCount: number, minimumResponses: number) {
  return participantCount >= minimumResponses;
}

export default function InterventionCopilot({
  diagnostics,
  campaignId,
  constitutionalDecision,
  constitutionalAuthority,
  participantCount = 0,
  minimumResponses = 5,
  onCopyScript,
  onRequestDetail,
  onCreateIntervention,
}: InterventionCopilotProps) {
  const [workingDomain, setWorkingDomain] = React.useState<string | null>(null);

  const participationReadyForAction = participationReady(participantCount, minimumResponses);

  const sorted = React.useMemo(() => {
    const order = {
      immediate: 0,
      "short-term": 1,
      "medium-term": 2,
      strategic: 3,
    } as const;

    return [...diagnostics].sort((a, b) => {
      const p =
        order[a.constitutionalImpact.recommendedInterventionPriority] -
        order[b.constitutionalImpact.recommendedInterventionPriority];
      if (p !== 0) return p;
      return b.constitutionalImpact.routeImpact - a.constitutionalImpact.routeImpact;
    });
  }, [diagnostics]);

  const summary = React.useMemo(() => {
    return {
      immediate: diagnostics.filter(
        (d) => d.constitutionalImpact.recommendedInterventionPriority === "immediate",
      ).length,
      shortTerm: diagnostics.filter(
        (d) => d.constitutionalImpact.recommendedInterventionPriority === "short-term",
      ).length,
      strategic: diagnostics.filter(
        (d) => d.constitutionalImpact.recommendedInterventionPriority === "strategic",
      ).length,
    };
  }, [diagnostics]);

  const handleCopy = async (domain: string, script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      onCopyScript?.(domain, script);
    } catch {
      // no-op
    }
  };

  const handleCreate = async (item: EnhancedInterventionDiagnostic) => {
    if (!onCreateIntervention) return;
    if (workingDomain) return;

    const allowed = canAct(
      constitutionalAuthority?.authorityLevel,
      item.constitutionalImpact.authorityLevelRequired,
    );

    if (!allowed) return;
    if (item.signatureRequired && !participationReadyForAction) return;

    setWorkingDomain(item.domain);

    try {
      await onCreateIntervention(item.domain, item.interventionScript, {
        campaignId,
        requiresSignature: item.signatureRequired,
        authorityRequired: item.constitutionalImpact.authorityLevelRequired,
      });
    } finally {
      setWorkingDomain(null);
    }
  };

  if (!diagnostics?.length) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#090B0F] p-8 text-white">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400/70" />
          <h3 className="mt-4 text-xl font-medium text-white/90">
            No intervention intelligence available
          </h3>
          <p className="mt-3 text-sm text-white/52">
            Complete the diagnostic stages first so the system has enough evidence to
            produce intervention-grade outputs.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090B0F] text-white shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <div className="border-b border-white/10 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/82">
              <Target className="h-4 w-4" />
              Intervention Copilot
            </div>

            <h2 className="mt-3 font-serif text-2xl text-white/95 md:text-3xl">
              Prescriptive actions ranked by constitutional priority
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
              This is the report’s orchestration layer. It does not merely display
              dissonance. It turns the strongest diagnosis into ranked intervention
              actions with authority expectations, route implications, and execution posture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {constitutionalAuthority ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/60">
                Authority: {constitutionalAuthority.authorityLevel}
              </span>
            ) : null}

            {constitutionalDecision ? (
              <span className="rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#E6D1A1]">
                Route: {constitutionalDecision.route} · {Math.round(constitutionalDecision.confidence * 100)}%
              </span>
            ) : null}

            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em]",
                participationReadyForAction
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : "border-red-400/20 bg-red-500/10 text-red-300",
              )}
            >
              Review Point {participantCount}/{minimumResponses}
            </span>
          </div>
        </div>
      </div>

      {constitutionalDecision?.disqualifiersTriggered?.length ? (
        <div className="border-b border-white/10 bg-amber-500/[0.05] px-6 py-4 md:px-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300/84">
                Active constitutional disqualifiers
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {constitutionalDecision.disqualifiersTriggered.slice(0, 4).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] text-amber-200/86"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 px-6 py-6 md:px-8">
        {sorted.map((item) => {
          const tone = priorityTone(
            item.constitutionalImpact.recommendedInterventionPriority,
          );
          const Icon = getDomainIcon(item.domain);
          const canCreate = canAct(
            constitutionalAuthority?.authorityLevel,
            item.constitutionalImpact.authorityLevelRequired,
          );
          const blockedByThreshold = item.signatureRequired && !participationReadyForAction;
          const busy = workingDomain === item.domain;

          return (
            <article
              key={item.domain}
              className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.rail}`} />

              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="border-b border-white/10 bg-black/20 p-5 lg:border-b-0 lg:border-r lg:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        <Icon className="h-4.5 w-4.5 text-[#C9A96A]" />
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
                          {item.domain}
                        </div>
                        <div className="mt-2 text-3xl font-light text-white/92">
                          {Math.round(item.score)}%
                        </div>
                        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-white/32">
                          resonance score
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em]",
                        tone.badge,
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
                        Route alignment
                      </div>
                      <div className="mt-2 text-sm text-white/76">
                        {item.constitutionalImpact.constitutionalRouteAlignment}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
                        Authority / readiness
                      </div>
                      <div className="mt-2 text-sm text-white/76">
                        {item.constitutionalImpact.authorityLevelRequired} ·{" "}
                        {item.constitutionalImpact.readinessTierRequired}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
                        Timeline
                      </div>
                      <div className="mt-2 text-sm text-white/76">
                        {item.estimatedTimeline}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 lg:p-6">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
                    Recommended action
                  </div>

                  <h3 className="mt-2 text-xl font-medium text-white/94">
                    {item.recommendedAction}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-white/58">
                    {item.domainSpecificGuidance}
                  </p>

                  <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
                      Intervention script
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/68">
                      {item.interventionScript}
                    </p>
                  </div>

                  {item.constitutionalImpact.disqualifierRelevance?.length ? (
                    <div className="mt-4">
                      <div className="mb-2 text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
                        Why this moved up the stack
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.constitutionalImpact.disqualifierRelevance
                          .slice(0, 3)
                          .map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full border border-red-400/14 bg-red-500/8 px-3 py-1 text-[10px] text-red-200/82"
                            >
                              {reason}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.domain, item.interventionScript)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-white/64 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy script
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestDetail?.(item.domain)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-white/64 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View detail
                    </button>

                    {onCreateIntervention ? (
                      <button
                        type="button"
                        onClick={() => handleCreate(item)}
                        disabled={!canCreate || blockedByThreshold || busy}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] transition",
                          !canCreate || blockedByThreshold || busy
                            ? "cursor-not-allowed border-white/10 bg-white/[0.04] text-white/28"
                            : "border-[#C9A96A]/22 bg-[#C9A96A]/12 text-[#E6D1A1] hover:bg-[#C9A96A]/18",
                        )}
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Creating task
                          </>
                        ) : (
                          <>
                            <FileSignature className="h-3.5 w-3.5" />
                            Create task
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>

                  {item.signatureRequired || !canCreate || blockedByThreshold ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.signatureRequired ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-300">
                          Signature-governed
                        </span>
                      ) : null}

                      {!canCreate ? (
                        <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-red-300">
                          Authority insufficient
                        </span>
                      ) : null}

                      {blockedByThreshold ? (
                        <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-red-300">
                          Participation review point not met
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4 md:px-8">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
              Immediate interventions
            </div>
            <div className="mt-2 text-2xl font-light text-white/92">{summary.immediate}</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
              Short-term interventions
            </div>
            <div className="mt-2 text-2xl font-light text-white/92">{summary.shortTerm}</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/32">
              Strategic interventions
            </div>
            <div className="mt-2 text-2xl font-light text-white/92">{summary.strategic}</div>
          </div>
        </div>

        {constitutionalDecision?.recommendedInterventions?.length ? (
          <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#C9A96A]" />
              Constitutional recommendations
            </div>
            <div className="flex flex-wrap gap-2">
              {constitutionalDecision.recommendedInterventions.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/60"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
