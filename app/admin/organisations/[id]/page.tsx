export const dynamic = "force-dynamic";
// app/admin/organisations/[id]/page.tsx

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronLeft,
  Shield,
  Target,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";

import {
  getEnterpriseDashboardView,
} from "@/lib/alignment/enterprise-repository";

type PageProps = {
  params: Promise<{ id: string }>;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function EmptyState({
  title,
  message,
  href,
  cta,
}: {
  title: string;
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-full max-w-xl border border-white/10 bg-zinc-950/70 p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          <AlertTriangle className="h-7 w-7 text-white/40" />
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-white/80">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/55">{message}</p>
        <Link
          href={href}
          className="mt-8 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: "neutral" | "gold" | "green" | "blue";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/[0.03] text-white",
    gold: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
    green: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
    blue: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  } as const;

  return (
    <div className={`rounded-2xl border p-5 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
          {label}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default async function OrganisationPage({ params }: PageProps) {
  const { id } = await params;

  if (!id?.trim()) {
    return (
      <EmptyState
        title="Invalid organisation reference"
        message="No valid organisation identifier was supplied for this page."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  let view: any = null;

  try {
    view = await getEnterpriseDashboardView(id);
  } catch (error) {
    console.error("[ADMIN_ORGANISATION_PAGE_ERROR]", error);
    return (
      <EmptyState
        title="Unable to load organisation"
        message="The enterprise repository could not assemble this organisation view."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  if (!view) {
    return (
      <EmptyState
        title="Organisation not found"
        message="The requested organisation could not be located in the enterprise registry."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  const organisation =
    view.organisation ??
    view.entity ??
    view.company ??
    {};

  const campaigns: any[] =
    view.campaigns ??
    view.registry?.campaigns ??
    view.dashboard?.campaigns ??
    [];

  const participantsTotal =
    view.metrics?.participantsTotal ??
    view.metrics?.totalParticipants ??
    campaigns.reduce(
      (acc: number, campaign: any) =>
        acc +
        (campaign?._count?.participants ??
          campaign?.participantCount ??
          campaign?.participants?.length ??
          0),
      0
    );

  const completedParticipants =
    view.metrics?.completedParticipants ??
    view.metrics?.participantsCompleted ??
    campaigns.reduce(
      (acc: number, campaign: any) =>
        acc +
        (campaign?.completedCount ??
          campaign?.participants?.filter((p: any) => p?.status === "completed").length ??
          0),
      0
    );

  const totalCampaigns =
    view.metrics?.totalCampaigns ??
    campaigns.length;

  const activeCampaigns =
    view.metrics?.activeCampaigns ??
    campaigns.filter(
      (campaign: any) => String(campaign?.status || "").toLowerCase() === "active"
    ).length;

  const responseRate =
    participantsTotal > 0
      ? Math.round((completedParticipants / participantsTotal) * 100)
      : 0;

  const createdAt = toDate(
    organisation.createdAt ?? view.createdAt ?? view.organisationCreatedAt
  );

  const formattedCreatedAt = createdAt
    ? createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  const organisationName =
    organisation.name ??
    view.name ??
    "Unknown Organisation";

  const organisationSector =
    organisation.sector ??
    view.sector ??
    "Unspecified";

  const organisationSlug =
    organisation.slug ??
    view.slug ??
    null;

  const organisationId =
    organisation.id ??
    id;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/admin/organisations"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Organisations
          </Link>

          <div className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300">
              Enterprise Registry Online
            </span>
          </div>
        </div>

        <div className="overflow-hidden border border-white/10 bg-zinc-950/70">
          <div className="border-b border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">
                    Enterprise Organisation View
                  </div>
                </div>

                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {organisationName}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span>
                    Sector:{" "}
                    <span className="font-medium text-white">
                      {organisationSector}
                    </span>
                  </span>
                  <span className="text-white/25">•</span>
                  <span>
                    Registered:{" "}
                    <span className="font-medium text-white">
                      {formattedCreatedAt}
                    </span>
                  </span>
                  {organisationSlug ? (
                    <>
                      <span className="text-white/25">•</span>
                      <span>
                        Slug:{" "}
                        <span className="font-medium text-white">
                          {organisationSlug}
                        </span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:min-w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                      Campaigns
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {totalCampaigns}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                      Participants
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {participantsTotal}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                      Active Campaigns
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {activeCampaigns}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                      Response Rate
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {responseRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-4">
              <StatCard
                icon={Shield}
                label="Registry Integrity"
                value="Live"
                tone="green"
              />
              <StatCard
                icon={Building2}
                label="Organisation ID"
                value={String(organisationId).slice(0, 8).toUpperCase()}
                tone="neutral"
              />
              <StatCard
                icon={Users}
                label="Completed"
                value={completedParticipants}
                tone="blue"
              />
              <StatCard
                icon={Target}
                label="Engagement"
                value={`${responseRate}%`}
                tone="gold"
              />
            </div>

            <div className="mt-10 border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-400/70" />
                <div>
                  <h2 className="font-serif text-xl tracking-tight text-white">
                    Dashboard Actions
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Open deeper operational surfaces for this organisation.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Link
                  href={`/admin/organisations/${organisationId}/dashboard`}
                  className="border border-white/10 bg-zinc-950/70 p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-amber-400/70" />
                    <ArrowRight className="h-4 w-4 text-white/35" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    OGR Dashboard
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Open the interactive dashboard, campaign posture, and intervention surfaces.
                  </p>
                </Link>

                <Link
                  href="/admin/organisations"
                  className="border border-white/10 bg-zinc-950/70 p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <Building2 className="h-5 w-5 text-amber-400/70" />
                    <ArrowRight className="h-4 w-4 text-white/35" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    Registry Index
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Return to the enterprise organisations registry and inspect adjacent nodes.
                  </p>
                </Link>

                <div className="border border-white/10 bg-zinc-950/70 p-5">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-amber-400/70" />
                    <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
                      Snapshot
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    Campaign Footprint
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {totalCampaigns} campaign node{totalCampaigns === 1 ? "" : "s"} and{" "}
                    {participantsTotal} total participant{participantsTotal === 1 ? "" : "s"} linked to this organisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5 flex items-center gap-3">
                <Target className="h-5 w-5 text-amber-400/70" />
                <div>
                  <h2 className="font-serif text-xl tracking-tight text-white">
                    Campaign Registry
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Latest campaign nodes linked to this organisation.
                  </p>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-white/35" />
                  <p className="mt-4 text-sm font-medium text-white/70">
                    No campaigns found for this organisation.
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Once campaign nodes are created, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {campaigns.map((campaign: any) => {
                    const participantCount =
                      campaign?._count?.participants ??
                      campaign?.participantCount ??
                      campaign?.participants?.length ??
                      0;

                    const completedCount =
                      campaign?.completedCount ??
                      campaign?.participants?.filter((p: any) => p?.status === "completed")
                        .length ??
                      0;

                    const completionRate =
                      participantCount > 0
                        ? Math.round((completedCount / participantCount) * 100)
                        : 0;

                    return (
                      <Link
                        key={campaign.id}
                        href={`/admin/campaigns/${campaign.id}`}
                        className="group border border-white/10 bg-zinc-950/70 px-5 py-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-500/70">
                              Campaign Node
                            </div>
                            <h4 className="mt-2 truncate text-lg font-semibold tracking-tight text-white group-hover:text-white">
                              {campaign.title || "Untitled Campaign"}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
                              <span>Status: {campaign.status || "Unknown"}</span>
                              <span className="text-white/20">•</span>
                              <span>Participants: {participantCount}</span>
                              <span className="text-white/20">•</span>
                              <span>Completed: {completedCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
                                Completion
                              </div>
                              <div className="mt-1 text-sm font-semibold text-white">
                                {completionRate}%
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-white/35 transition group-hover:text-white/70" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
