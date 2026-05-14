// app/admin/snapshot/page.tsx
// Guard: auth is enforced by app/admin/layout.tsx → requireAdminServer()

import { prisma } from "@/lib/prisma.server";
import { DrillDownMatrix } from "@/components/admin/reporting/drill-down-matrix";
import { FragilityHeatmap } from "@/components/admin/reporting/fragility-heatmap";
import { InterventionScheduler } from "@/components/admin/reporting/intervention-scheduler";
import {
  Zap,
  ShieldCheck,
  Users,
  BarChart3,
  Activity,
  Calendar,
  AlertTriangle,
  FileText,
  Building2,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* ─── helpers ────────────────────────────────────────────────────────────── */

type SafeBand = "ALIGNED" | "FRAGMENTED" | "DISORDERED";

function safeBand(band: string | null | undefined): SafeBand {
  if (band === "ALIGNED" || band === "DISORDERED") return band;
  return "FRAGMENTED";
}

function parseDomainScores(
  json: string
): Array<{ domain: string; percentScore: number }> {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function parseDomainGaps(
  json: string
): Array<{ domain: string; gapPercent: number }> {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function fragilitySignalToScore(signal: string | null | undefined): number {
  if (signal === "HIGH" || signal === "VOLATILE") return 85;
  if (signal === "MEDIUM" || signal === "ELEVATED") return 50;
  return 20;
}

function bandLabel(band: SafeBand): string {
  if (band === "ALIGNED") return "Aligned";
  if (band === "DISORDERED") return "Disordered";
  return "Fragmented";
}

const BAND_CHIP: Record<SafeBand, string> = {
  ALIGNED:
    "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  FRAGMENTED:
    "border border-amber-500/25 bg-amber-500/10 text-amber-400",
  DISORDERED:
    "border border-rose-500/30 bg-rose-500/10 text-rose-400",
};

const FRAGILITY_CHIP: Record<string, string> = {
  HIGH: "border border-rose-500/30 bg-rose-500/10 text-rose-400",
  VOLATILE: "border border-rose-500/30 bg-rose-500/10 text-rose-400",
  MEDIUM: "border border-amber-500/25 bg-amber-500/10 text-amber-400",
  ELEVATED: "border border-amber-500/25 bg-amber-500/10 text-amber-400",
  LOW: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  STABLE: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="p-6">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center border border-white/10">
            <Zap className="w-4 h-4 text-amber-500/70" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
            Sovereign Intelligence
          </span>
        </div>
        <h1 className="font-serif text-3xl text-white">Executive Snapshot</h1>
      </header>

      <div className="border border-white/10 bg-zinc-950/70 p-12 text-center max-w-2xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-white/10 bg-white/5">
          <ShieldCheck className="h-7 w-7 text-white/30" />
        </div>
        <h2 className="font-serif text-xl text-white mb-3">
          No Snapshot Available
        </h2>
        <p className="text-sm leading-relaxed text-white/50 mb-8 max-w-md mx-auto">
          No pre-computed assessment snapshots were found. Run a campaign
          aggregation to generate the Enterprise Alignment Snapshot.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin/campaigns"
            className="inline-block border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            Campaign Registry
          </Link>
          <Link
            href="/admin/command"
            className="inline-block border border-amber-500/20 bg-amber-500/10 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-amber-300 transition-colors hover:bg-amber-500/15"
          >
            Command Centre
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── stat card ───────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
          {label}
        </p>
        <p className="mt-2 font-serif text-2xl font-light text-white">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-[10px] text-white/35">{sub}</p>
        )}
      </div>
      <div className="rounded border border-white/10 bg-white/5 p-3">{icon}</div>
    </div>
  );
}

/* ─── page ────────────────────────────────────────────────────────────────── */

export default async function ExecutiveSnapshotPage() {
  /* 1 ── most recent org snapshot ---------------------------------------- */
  const orgSnapshot = await prisma.organisationAssessmentSnapshot.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  if (!orgSnapshot) return <EmptyState />;

  /* 2 ── team snapshots for that campaign --------------------------------- */
  const rawTeams = await prisma.teamAssessmentSnapshot.findMany({
    where: { campaignId: orgSnapshot.campaignId },
    orderBy: { percentScore: "asc" },
  });

  /* 3 ── leadership gap --------------------------------------------------- */
  const leadershipGap = await prisma.leadershipGapSnapshot.findFirst({
    where: { campaignId: orgSnapshot.campaignId },
  });

  /* 4 ── campaign + org --------------------------------------------------- */
  const campaign = await prisma.alignmentCampaign.findUnique({
    where: { id: orgSnapshot.campaignId },
  });

  const org = campaign
    ? await prisma.organisation.findUnique({
        where: { id: campaign.organisationId },
      })
    : null;

  /* ── derived data ──────────────────────────────────────────────────────── */

  const orgBand = safeBand(orgSnapshot.band);
  const orgScore = orgSnapshot.percentScore;

  const globalData = {
    respondentCount: orgSnapshot.respondentCount,
    band: orgBand,
    percentScore: orgScore,
    domainScoresJson: parseDomainScores(orgSnapshot.domainScoresJson),
    rawResponses: [],
  };

  const teamSnapshotData = rawTeams.map((t) => ({
    teamName: t.teamName,
    respondentCount: t.respondentCount,
    band: safeBand(t.band),
    percentScore: t.percentScore,
    domainScoresJson: parseDomainScores(t.domainScoresJson),
    varianceScoresJson: t.varianceScoresJson,
    rawResponses: [],
  }));

  // Worst team = lowest percentScore (already asc-sorted)
  const worstTeam = rawTeams[0] ?? null;
  const interventionDelta = worstTeam
    ? Math.max(0, orgScore - worstTeam.percentScore)
    : 0;
  const fragilityScore = fragilitySignalToScore(orgSnapshot.fragilitySignal);

  // Leadership gap insight
  const domainGaps = leadershipGap
    ? parseDomainGaps(leadershipGap.domainGapsJson).sort(
        (a, b) => b.gapPercent - a.gapPercent
      )
    : [];
  const topGap = domainGaps[0] ?? null;

  // Completion rate
  const completionRate = orgSnapshot.completionRate;

  // Fragility chip
  const fragilitySignal = orgSnapshot.fragilitySignal ?? "STABLE";
  const fragilityChipClass =
    FRAGILITY_CHIP[fragilitySignal] ??
    "border border-white/10 bg-white/5 text-white/50";

  return (
    <div className="p-6 font-sans">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center border border-white/10">
              <Zap className="w-4 h-4 text-amber-500/70 fill-current" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
              Sovereign Intelligence
            </span>
          </div>
          <h1 className="font-serif text-3xl text-white">Executive Snapshot</h1>
          {(org || campaign) && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {org && (
                <span className="flex items-center gap-1.5 text-xs text-white/45">
                  <Building2 className="h-3 w-3 text-white/30" />
                  {org.name}
                </span>
              )}
              {campaign && (
                <span className="flex items-center gap-1.5 text-xs text-white/35">
                  <FileText className="h-3 w-3 text-white/25" />
                  {campaign.title}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest ${BAND_CHIP[orgBand]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {bandLabel(orgBand)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest ${fragilityChipClass}`}
          >
            <Activity className="h-3 w-3" />
            {fragilitySignal.charAt(0) + fragilitySignal.slice(1).toLowerCase()}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/30">
            <Calendar className="h-3 w-3" />
            {formatDate(orgSnapshot.generatedAt)}{" "}
            <span className="text-white/20">
              {formatTime(orgSnapshot.generatedAt)}
            </span>
          </span>
        </div>
      </header>

      {/* ── Stat strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Respondents"
          value={orgSnapshot.respondentCount}
          sub={
            orgSnapshot.invitedCount
              ? `of ${orgSnapshot.invitedCount} invited`
              : undefined
          }
          icon={<Users className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Alignment Score"
          value={`${orgScore}%`}
          sub="organisation-wide"
          icon={<BarChart3 className="h-4 w-4 text-amber-400" />}
        />
        <StatCard
          label="Teams Assessed"
          value={rawTeams.length}
          sub={
            rawTeams.length > 0
              ? `${rawTeams.reduce((s, t) => s + t.respondentCount, 0)} respondents`
              : undefined
          }
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          sub={leadershipGap ? `${leadershipGap.overallGapPercent}% leadership gap` : undefined}
          icon={<ShieldCheck className="h-4 w-4 text-white/40" />}
        />
      </div>

      {/* ── Leadership gap alert (when significant) ─────────────────────── */}
      {leadershipGap && leadershipGap.overallGapPercent >= 20 && (
        <div className="mb-8 flex items-start gap-3 border border-amber-500/20 bg-amber-500/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-1">
              Leadership Gap Signal
            </p>
            <p className="text-sm text-amber-100/75">
              {leadershipGap.overallGapPercent}% overall leadership-to-team
              gap detected
              {topGap
                ? ` — most acute in ${topGap.domain} (${topGap.gapPercent}% gap)`
                : ""}
              . Intervention sequencing is recommended.
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-10">
        {/* Left column — Drill-Down + Intervention */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 whitespace-nowrap">
                Dissonance &amp; Drill-Down
              </h2>
            </div>
            <DrillDownMatrix
              globalData={globalData}
              teamSnapshots={teamSnapshotData}
            />
          </section>

          {worstTeam && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-white/10" />
                <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 whitespace-nowrap">
                  Deployment Command
                </h2>
              </div>
              <InterventionScheduler
                targetTeam={worstTeam.teamName}
                delta={interventionDelta}
                fragilityScore={fragilityScore}
              />
            </section>
          )}
        </div>

        {/* Right column — Fragility Heatmap + Snapshot Context */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          {teamSnapshotData.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 whitespace-nowrap">
                  Institutional Risk Map
                </h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <FragilityHeatmap teams={teamSnapshotData} />
            </section>
          )}

          {/* Snapshot context panel */}
          <section className="border border-white/10 bg-zinc-950/70 p-6">
            <div className="flex items-center gap-3 mb-5">
              <FileText className="w-4 h-4 text-amber-500/60" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                Snapshot Context
              </h3>
            </div>

            <dl className="space-y-4">
              {org && (
                <div>
                  <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                    Organisation
                  </dt>
                  <dd className="text-sm text-white/70">{org.name}</dd>
                </div>
              )}
              {campaign && (
                <div>
                  <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                    Campaign
                  </dt>
                  <dd className="text-sm text-white/70">{campaign.title}</dd>
                </div>
              )}
              <div>
                <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                  Generated
                </dt>
                <dd className="text-sm text-white/70">
                  {formatDate(orgSnapshot.generatedAt)} at{" "}
                  {formatTime(orgSnapshot.generatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                  Completion Rate
                </dt>
                <dd className="text-sm text-white/70">{completionRate}%</dd>
              </div>
              {orgSnapshot.fragilitySignal && (
                <div>
                  <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                    Fragility Signal
                  </dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${fragilityChipClass}`}
                    >
                      {orgSnapshot.fragilitySignal}
                    </span>
                  </dd>
                </div>
              )}
              {topGap && (
                <div>
                  <dt className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                    Critical Gap Domain
                  </dt>
                  <dd className="text-sm text-white/70">
                    {topGap.domain}{" "}
                    <span className="text-rose-400 font-mono">
                      ({topGap.gapPercent}%)
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500/60 shrink-0" />
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                Pre-computed via aggregation pipeline
              </span>
            </div>
          </section>

          {/* Team performance summary (if multiple teams) */}
          {rawTeams.length > 1 && (
            <section className="border border-white/10 bg-zinc-950/70 p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-5">
                Team Performance
              </h3>
              <div className="space-y-3">
                {rawTeams
                  .slice()
                  .sort((a, b) => b.percentScore - a.percentScore)
                  .map((team) => {
                    const tBand = safeBand(team.band);
                    return (
                      <div key={team.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs text-white/70 truncate">
                              {team.teamName}
                            </span>
                            <span className="font-mono text-xs text-white/50 shrink-0">
                              {team.percentScore}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tBand === "ALIGNED"
                                  ? "bg-emerald-500/60"
                                  : tBand === "DISORDERED"
                                  ? "bg-rose-500/60"
                                  : "bg-amber-500/60"
                              }`}
                              style={{ width: `${team.percentScore}%` }}
                            />
                          </div>
                        </div>
                        <span
                          className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 shrink-0 ${BAND_CHIP[tBand]}`}
                        >
                          {bandLabel(tBand)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-white/5 pt-6 flex items-center justify-between gap-4">
        <p className="text-[10px] font-mono text-white/25">
          Snapshot generated from pre-computed aggregation. Re-run aggregation
          via{" "}
          <Link
            href="/admin/campaigns"
            className="text-white/40 underline underline-offset-2 hover:text-white/60"
          >
            campaign registry
          </Link>{" "}
          to refresh.
        </p>
        <Link
          href={`/admin/campaigns/${orgSnapshot.campaignId}`}
          className="text-[10px] font-mono uppercase tracking-widest text-white/30 border border-white/10 px-4 py-2 hover:text-white/50 hover:border-white/20 transition-colors whitespace-nowrap"
        >
          View Campaign
        </Link>
      </footer>
    </div>
  );
}
