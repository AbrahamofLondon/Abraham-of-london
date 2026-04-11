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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <AlertTriangle className="h-7 w-7 text-neutral-500" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
        <Link
          href={href}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
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
    neutral: "border-neutral-200 bg-white text-neutral-900",
    gold: "border-amber-200 bg-amber-50 text-[#8A6A2F]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
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
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/admin/organisations"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Organisations
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-700">
              Enterprise Registry Online
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 px-8 py-8 text-white">
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

            <div className="mt-10 rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#8A6A2F]" />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                    Dashboard Actions
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Open deeper operational surfaces for this organisation.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Link
                  href={`/admin/organisations/${organisationId}/dashboard`}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-[#8A6A2F]" />
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900">
                    OGR Dashboard
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Open the interactive dashboard, campaign posture, and intervention surfaces.
                  </p>
                </Link>

                <Link
                  href="/admin/organisations"
                  className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between">
                    <Building2 className="h-5 w-5 text-[#8A6A2F]" />
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900">
                    Registry Index
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Return to the enterprise organisations registry and inspect adjacent nodes.
                  </p>
                </Link>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-[#8A6A2F]" />
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500">
                      Snapshot
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900">
                    Campaign Footprint
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {totalCampaigns} campaign node{totalCampaigns === 1 ? "" : "s"} and{" "}
                    {participantsTotal} total participant{participantsTotal === 1 ? "" : "s"} linked to this organisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <Target className="h-5 w-5 text-[#8A6A2F]" />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                    Campaign Registry
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Latest campaign nodes linked to this organisation.
                  </p>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-neutral-400" />
                  <p className="mt-4 text-sm font-medium text-neutral-700">
                    No campaigns found for this organisation.
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
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
                        className="group rounded-2xl border border-neutral-200 bg-white px-5 py-5 transition hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                              Campaign Node
                            </div>
                            <h4 className="mt-2 truncate text-lg font-semibold tracking-tight text-neutral-900 group-hover:text-black">
                              {campaign.title || "Untitled Campaign"}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                              <span>Status: {campaign.status || "Unknown"}</span>
                              <span className="text-neutral-300">•</span>
                              <span>Participants: {participantCount}</span>
                              <span className="text-neutral-300">•</span>
                              <span>Completed: {completedCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-neutral-100 px-3 py-2 text-right">
                              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                                Completion
                              </div>
                              <div className="mt-1 text-sm font-semibold text-neutral-900">
                                {completionRate}%
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:text-neutral-700" />
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