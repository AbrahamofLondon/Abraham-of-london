"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Shield,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export type OGRCampaignView = {
  id: string;
  title: string;
  status: string;
  participantCount: number;
  completedCount: number;
  completionRate: number;
};

export type OGRInteractiveViewData = {
  organisation: {
    id: string;
    name: string;
    sector: string;
    slug?: string | null;
  };
  metrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalParticipants: number;
    completedParticipants: number;
    responseRate: number;
  };
  campaigns: OGRCampaignView[];
};

export type OGRInteractiveViewProps = {
  data: OGRInteractiveViewData;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "neutral" | "gold" | "green" | "blue" | "red";
}) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-white",
    gold: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
    green: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
    blue: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
    red: "border-red-500/20 bg-red-500/[0.08] text-red-300",
  } as const;

  return (
    <div className={cx("rounded-2xl border p-5", tones[tone])}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
          {label}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {subtext ? (
        <p className="mt-2 text-xs leading-6 text-white/50">{subtext}</p>
      ) : null}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/70">{label}</span>
        <span className="text-[11px] font-mono text-white/45">{safeValue}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cx("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export function OGRInteractiveView({ data }: OGRInteractiveViewProps) {
  const { organisation, metrics, campaigns } = data;

  const weakestCampaigns = [...campaigns]
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 3);

  const strongestCampaigns = [...campaigns]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 3);

  const healthTone =
    metrics.responseRate >= 70
      ? "green"
      : metrics.responseRate >= 45
      ? "gold"
      : "red";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Organisation"
          value={organisation.name}
          subtext={organisation.sector || "Sector unspecified"}
          tone="neutral"
        />
        <MetricCard
          icon={BarChart3}
          label="Campaigns"
          value={metrics.totalCampaigns}
          subtext={`${metrics.activeCampaigns} active campaign nodes`}
          tone="blue"
        />
        <MetricCard
          icon={Users}
          label="Participants"
          value={metrics.totalParticipants}
          subtext={`${metrics.completedParticipants} completed submissions`}
          tone="neutral"
        />
        <MetricCard
          icon={Shield}
          label="Response Health"
          value={`${metrics.responseRate}%`}
          subtext="Aggregate organisational response velocity"
          tone={healthTone}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400/70" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Organisational Indicator
            </h3>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="Response Rate"
              value={metrics.responseRate}
              colorClass="bg-emerald-500"
            />
            <ProgressBar
              label="Campaign Activation"
              value={
                metrics.totalCampaigns > 0
                  ? Math.round((metrics.activeCampaigns / metrics.totalCampaigns) * 100)
                  : 0
              }
              colorClass="bg-blue-500"
            />
            <ProgressBar
              label="Completion Density"
              value={
                metrics.totalParticipants > 0
                  ? Math.round(
                      (metrics.completedParticipants / metrics.totalParticipants) * 100
                    )
                  : 0
              }
              colorClass="bg-amber-500"
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/10 bg-zinc-950/70 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
                  Strongest Campaigns
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {strongestCampaigns.length ? (
                  strongestCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-sm font-medium text-white">
                        {campaign.title || "Untitled Campaign"}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {campaign.completionRate}% completion • {campaign.completedCount}/
                        {campaign.participantCount} completed
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No campaign data available.</p>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-zinc-950/70 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
                  Weakest Campaigns
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {weakestCampaigns.length ? (
                  weakestCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-sm font-medium text-white">
                        {campaign.title || "Untitled Campaign"}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {campaign.completionRate}% completion • {campaign.completedCount}/
                        {campaign.participantCount} completed
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No campaign data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400/70" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Campaign Registry Snapshot
            </h3>
          </div>

          <div className="space-y-3">
            {campaigns.length ? (
              campaigns.slice(0, 8).map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-white/10 bg-zinc-950/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">
                        {campaign.title || "Untitled Campaign"}
                      </div>
                      <div className="mt-1 text-[11px] text-white/50">
                        Status: {campaign.status || "unknown"}
                      </div>
                    </div>
                    <div className="border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/60">
                      {campaign.completionRate}%
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-white/10 bg-white/10">
                    <div
                      className={cx(
                        "h-full rounded-full",
                        campaign.completionRate >= 70
                          ? "bg-emerald-500"
                          : campaign.completionRate >= 45
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${campaign.completionRate}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-white/50">
                    {campaign.completedCount}/{campaign.participantCount} completed
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                <Target className="mx-auto h-6 w-6 text-white/35" />
                <p className="mt-3 text-sm text-white/55">
                  No campaign activity available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OGRInteractiveView;
