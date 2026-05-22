export const dynamic = "force-dynamic";
// app/admin/campaigns/[id]/enterprise-report/page.tsx
// Enterprise decision authority report — full pipeline output with FragilityRadar.
import Link from "next/link";
import { ChevronLeft, ShieldCheck, AlertTriangle, Zap, Activity, Users } from "lucide-react";

import { FragilityRadar } from "@/components/briefing/FragilityRadar";
import { runEnterprisePipeline } from "@/lib/alignment/enterprise-pipeline";
import DiagnosticLineagePanel from "@/components/dashboard/DiagnosticLineagePanel";
import { getAdminReportLineage } from "@/lib/reporting/report-lineage";

type PageProps = {
  params: Promise<{ id: string }>;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center border border-amber-500/20 bg-amber-500/10">
          <Icon className="h-4 w-4 text-amber-400/70" />
        </div>
        <h2 className="font-serif text-lg tracking-tight text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricTile({ label, value, tone = "neutral" }: {
  label: string;
  value: string | number;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-white",
    green: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
    amber: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
    red: "border-red-500/20 bg-red-500/[0.08] text-red-300",
  } as const;
  return (
    <div className={cx("rounded-xl border p-4", tones[tone])}>
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-60">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function bandTone(band: string): "green" | "amber" | "red" | "neutral" {
  if (band === "ALIGNED") return "green";
  if (band === "DRIFTING") return "amber";
  if (band === "MISALIGNED" || band === "DISORDERED") return "red";
  return "neutral";
}

function routeColor(route: string) {
  if (route === "STRATEGY") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  if (route === "DIAGNOSTIC") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-red-300 border-red-500/30 bg-red-500/10";
}

function directiveColor(action: string) {
  if (action === "ALLOW") return "text-emerald-300";
  if (action === "WARN") return "text-amber-300";
  if (action === "RESTRICT" || action === "MANDATE_INTERVENTION") return "text-orange-300";
  return "text-red-300";
}

// Accepts CUID, UUID, and short slug-style IDs — rejects anything that could
// be used for injection or path traversal before it reaches the pipeline.
function isValidCampaignId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export default async function EnterpriseReportPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || !isValidCampaignId(id)) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl border border-white/10 bg-zinc-950/70 p-10 text-center">
          <AlertTriangle className="mx-auto mb-5 h-10 w-10 text-amber-400" />
          <h2 className="font-serif text-2xl text-white/80">Invalid Campaign ID</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            The campaign identifier in the URL is not valid.
          </p>
        </div>
      </div>
    );
  }

  const result = await runEnterprisePipeline(id);

  if (!result.ok) {
    const messages: Record<string, string> = {
      CAMPAIGN_NOT_FOUND: "Campaign not found in the enterprise registry.",
      NO_SNAPSHOT: "No alignment snapshot exists for this campaign yet. Run the aggregation after participants complete their assessments.",
      COHORT_TOO_SMALL: `Anonymity threshold not met. A minimum of 5 completed participants is required. This campaign has ${result.participantCount ?? 0}.`,
      PIPELINE_ERROR: "An internal error occurred while generating the enterprise report.",
    };

    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/admin/campaigns/${id}`}
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Campaign
          </Link>
          <div className="border border-white/10 bg-zinc-950/70 p-10 text-center">
            <AlertTriangle className="mx-auto mb-5 h-10 w-10 text-amber-400" />
            <h2 className="font-serif text-2xl text-white/80">Report Not Available</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {messages[result.reason] ?? "An unexpected error occurred."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { report } = result;
  const { metadata, scores, domainPerformance, varianceScores, findings, strategicGuidance, constitution, kernel, costOfDelay, enforcement, leadershipGap, teamSnapshots } = report;

  const constitutionRoute = constitution.constitutionalDecision.route;
  const directiveAction = enforcement.directive.action;
  const escalationLevel = enforcement.directive.escalation;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href={`/admin/campaigns/${metadata.campaignId}`}
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Campaign
          </Link>
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">
              Enterprise Report Generated
            </span>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-10 border border-white/10 bg-zinc-950/70 px-8 py-8">
          <div className="mb-3 flex items-center gap-4">
            <div className="h-px w-10 bg-white/20" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              Sovereign Alignment Registry — Enterprise Intelligence
            </span>
          </div>
          <h1 className="font-serif text-4xl tracking-tighter text-white">
            {metadata.organisationName}
          </h1>
          <p className="mt-3 text-white/55">
            {metadata.campaignTitle} &bull; Audit Ref: {metadata.auditID}
          </p>
          <p className="mt-1 text-xs text-white/35">
            {metadata.participantCount} completed participants &bull; Generated{" "}
            {new Date(metadata.generatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Scorecard grid */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Alignment Score" value={`${scores.overall}%`} tone={bandTone(scores.band)} />
          <MetricTile label="Band" value={scores.band} tone={bandTone(scores.band)} />
          <MetricTile label="Completion Rate" value={`${Math.round(scores.completionRate)}%`} tone={scores.completionRate >= 70 ? "green" : scores.completionRate >= 45 ? "amber" : "red"} />
          <MetricTile label="Dissonance Area" value={scores.dissonanceArea.toLocaleString()} tone={scores.dissonanceArea > 1500 ? "red" : scores.dissonanceArea > 800 ? "amber" : "green"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          {/* Left column */}
          <div className="space-y-6">

            {/* Constitutional posture */}
            <Section title="Constitutional Posture" icon={ShieldCheck}>
              <div className="mb-4 flex items-center gap-3">
                <div className={cx("border px-3 py-1 font-mono text-[10px] uppercase tracking-widest", routeColor(constitutionRoute))}>
                  Route: {constitutionRoute}
                </div>
                <span className="text-xs text-white/50">
                  Confidence: {Math.round(constitution.constitutionalDecision.confidence * 100)}%
                </span>
              </div>
              <p className="mb-4 text-sm leading-7 text-white/70">
                {constitution.derived.executiveSummary}
              </p>
              {constitution.constitutionalDecision.recommendedInterventions.length > 0 && (
                <div className="space-y-2">
                  {constitution.constitutionalDecision.recommendedInterventions.slice(0, 4).map((intervention, i) => (
                    <div key={i} className="border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/60">
                      {intervention}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Findings */}
            {findings.length > 0 && (
              <Section title="Critical Findings" icon={AlertTriangle}>
                <div className="space-y-2">
                  {findings.map((finding, i) => {
                    const [tag, ...rest] = finding.split(": ");
                    return (
                      <div key={i} className="border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-wider text-amber-500/70">{tag}</div>
                        <p className="mt-1 text-sm text-white/65">{rest.join(": ")}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Enforcement directive */}
            <Section title="Enforcement Directive" icon={Zap}>
              <div className="mb-4 flex items-center gap-4">
                <div className={cx("font-mono text-sm font-semibold uppercase tracking-wider", directiveColor(directiveAction))}>
                  {directiveAction.replace(/_/g, " ")}
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  Escalation: {escalationLevel.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-white/60">{enforcement.directive.reason}</p>
              {enforcement.directive.recommendedToolkit && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-amber-500/60">
                  Toolkit: {enforcement.directive.recommendedToolkit}
                </p>
              )}
            </Section>

            {/* Decision kernel */}
            <Section title="Decision Kernel" icon={Activity}>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Nodes", value: kernel.graphMetrics.totalNodes },
                  { label: "Active Contradictions", value: kernel.graphMetrics.activeContradictions },
                  { label: "Signal Strength", value: kernel.signal.strength },
                  { label: "Graph Depth", value: kernel.graphMetrics.accumulatedDepth },
                ].map((item) => (
                  <div key={item.label} className="border border-white/8 bg-white/[0.02] p-3">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">{item.label}</div>
                    <div className="mt-1 text-sm font-mono text-white/80">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="border border-white/8 bg-white/[0.02] p-4">
                <div className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/40">Required Decision</div>
                <p className="text-sm text-white/70">{kernel.decision.required}</p>
              </div>
              {kernel.decision.blocked && kernel.decision.reason && (
                <div className="mt-3 border border-red-500/20 bg-red-500/[0.05] p-3 text-sm text-red-300">
                  Blocked: {kernel.decision.reason}
                </div>
              )}
              <div className="mt-4 space-y-2 text-sm text-white/55">
                <p><span className="text-white/35">30-day:</span> {kernel.simulation.horizon30}</p>
                <p><span className="text-white/35">60-day:</span> {kernel.simulation.horizon60}</p>
                <p><span className="text-white/35">90-day:</span> {kernel.simulation.horizon90}</p>
              </div>
            </Section>

            {/* Cost of delay */}
            <Section title="Cost of Delay" icon={AlertTriangle}>
              <p className="mb-4 text-sm leading-7 text-white/65">{costOfDelay.narrative}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">Months to Critical</div>
                  <div className="mt-1 text-xl font-mono text-amber-300">{costOfDelay.monthsToCritical}</div>
                </div>
                <div className="border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">Recovery Multiplier</div>
                  <div className="mt-1 text-xl font-mono text-amber-300">{costOfDelay.recoveryMultiplier.toFixed(1)}x</div>
                </div>
                <div className="border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">Monthly Degradation</div>
                  <div className="mt-1 text-xl font-mono text-amber-300">{costOfDelay.monthlyDegradation}pts</div>
                </div>
              </div>
            </Section>

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Fragility Radar */}
            {scores.fragility && varianceScores.length > 0 && (
              <FragilityRadar
                fragilitySignal={scores.fragility}
                varianceScores={varianceScores.map((vs) => ({
                  domain: vs.domain,
                  variance: vs.variance,
                }))}
                dissonanceArea={scores.dissonanceArea}
              />
            )}

            {/* Strategic guidance */}
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                Strategic Guidance
              </div>
              <p className="text-sm leading-7 text-white/70">{strategicGuidance}</p>
            </div>

            {/* Domain performance */}
            {domainPerformance.length > 0 && (
              <Section title="Domain Performance" icon={Activity}>
                <div className="space-y-3">
                  {domainPerformance.map((ds) => (
                    <div key={ds.domain}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/60 capitalize">
                          {ds.domain.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] font-mono text-white/40">{ds.percent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={cx(
                            "h-full rounded-full",
                            ds.percent >= 75 ? "bg-emerald-500" : ds.percent >= 50 ? "bg-amber-500" : "bg-red-500",
                          )}
                          style={{ width: `${ds.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Leadership gap */}
            {leadershipGap && (
              <Section title="Leadership Gap" icon={Users}>
                <div className="mb-3 flex items-center gap-3">
                  <div className={cx(
                    "border px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
                    leadershipGap.overallGapPercent > 20
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : leadershipGap.overallGapPercent > 10
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                  )}>
                    Gap: {leadershipGap.overallGapPercent}%
                  </div>
                </div>
                <div className="space-y-2">
                  {leadershipGap.domainGaps.slice(0, 5).map((gap) => (
                    <div key={gap.domain} className="border border-white/8 bg-white/[0.02] px-3 py-2">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-white/40 capitalize mb-1">
                        {gap.domain.replace(/_/g, " ")}
                      </div>
                      <div className="flex gap-4 text-xs font-mono text-white/60">
                        <span>Exec: {gap.executivePercent}%</span>
                        <span>Staff: {gap.nonExecutivePercent}%</span>
                        <span className={gap.delta > 15 ? "text-red-300" : "text-white/40"}>
                          Δ {gap.delta}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Team snapshots */}
            {teamSnapshots.length > 0 && (
              <Section title="Team Breakdown" icon={Users}>
                <div className="space-y-2">
                  {teamSnapshots.slice(0, 8).map((team) => (
                    <div key={team.teamName} className="flex items-center justify-between border border-white/8 bg-white/[0.02] px-4 py-3">
                      <div>
                        <div className="text-sm text-white/80">{team.teamName}</div>
                        <div className="text-[10px] font-mono text-white/40">
                          {team.respondentCount} respondents
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cx("font-mono text-sm", bandTone(team.band) === "green" ? "text-emerald-300" : bandTone(team.band) === "amber" ? "text-amber-300" : "text-red-300")}>
                          {team.percentScore}%
                        </div>
                        <div className="text-[9px] font-mono text-white/40">{team.band}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        </div>

        {/* Chain of custody */}
        <div className="mt-8">
          <EnterpriseLineagePanelSection campaignId={metadata.campaignId} />
        </div>
      </div>
    </div>
  );
}

async function EnterpriseLineagePanelSection({ campaignId }: { campaignId: string }) {
  const events = await getAdminReportLineage(campaignId);
  return <DiagnosticLineagePanel events={events} />;
}
