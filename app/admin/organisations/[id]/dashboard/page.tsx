export const dynamic = "force-dynamic";
// app/admin/organisations/[id]/dashboard/page.tsx

import Link from "next/link";
import {
  Shield,
  Building2,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  BarChart3,
  Users,
  Target,
  ArrowRight,
} from "lucide-react";

import { db } from "@/lib/db";
import {
  OGRInteractiveView,
  type OGRInteractiveViewData,
  type OGRCampaignView,
} from "./ogr-interactive-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CampaignParticipant = {
  id: string;
  status?: string | null;
};

type CampaignRecord = {
  id: string;
  title: string;
  status?: string | null;
  createdAt?: Date | string | null;
  participants?: CampaignParticipant[];
  _count?: {
    participants?: number;
  };
};

type OrganisationRecord = {
  id: string;
  name: string;
  slug?: string | null;
  sector?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  campaigns?: CampaignRecord[];
  _count?: {
    campaigns?: number;
  };
};

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

function StatCardDark({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/60">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getPrismaClient() {
  if (typeof db.getPrismaClient === "function") {
    return await db.getPrismaClient();
  }
  return null;
}

async function getOrganisation(id: string): Promise<OrganisationRecord | null> {
  const prisma = await getPrismaClient();
  if (!prisma) return null;

  return await (prisma as any).organisation.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: {
          participants: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
      _count: {
        select: {
          campaigns: true,
        },
      },
    },
  });
}

function buildOgrData(organisation: OrganisationRecord): OGRInteractiveViewData {
  const campaignsRaw = Array.isArray(organisation.campaigns)
    ? organisation.campaigns
    : [];

  const campaigns: OGRCampaignView[] = campaignsRaw.map((campaign) => {
    const participantCount =
      campaign._count?.participants ?? campaign.participants?.length ?? 0;

    const completedCount =
      campaign.participants?.filter((p) => p.status === "completed").length ?? 0;

    const completionRate =
      participantCount > 0
        ? Math.round((completedCount / participantCount) * 100)
        : 0;

    return {
      id: campaign.id,
      title: campaign.title || "Untitled Campaign",
      status: campaign.status || "unknown",
      participantCount,
      completedCount,
      completionRate,
    };
  });

  const totalCampaigns = organisation._count?.campaigns ?? campaigns.length;
  const activeCampaigns = campaigns.filter(
    (campaign) => String(campaign.status).toLowerCase() === "active"
  ).length;
  const totalParticipants = campaigns.reduce(
    (acc, campaign) => acc + campaign.participantCount,
    0
  );
  const completedParticipants = campaigns.reduce(
    (acc, campaign) => acc + campaign.completedCount,
    0
  );
  const responseRate =
    totalParticipants > 0
      ? Math.round((completedParticipants / totalParticipants) * 100)
      : 0;

  return {
    organisation: {
      id: organisation.id,
      name: organisation.name,
      sector: organisation.sector || "Unspecified",
      slug: organisation.slug ?? null,
    },
    metrics: {
      totalCampaigns,
      activeCampaigns,
      totalParticipants,
      completedParticipants,
      responseRate,
    },
    campaigns,
  };
}

export default async function OrganisationDashboardPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!id?.trim()) {
    return (
      <EmptyState
        title="Invalid organisation reference"
        message="No valid organisation identifier was supplied for this dashboard."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  const organisation = await getOrganisation(id);

  if (!organisation) {
    return (
      <EmptyState
        title="Organisation not found"
        message="The requested organisation dashboard could not be located in the registry."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  const ogrData = buildOgrData(organisation);

  const createdAt = toDate(organisation.createdAt);
  const formattedCreatedAt = createdAt
    ? createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unknown";

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
              Registry Online
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
                    Organisation Command Surface
                  </div>
                </div>

                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {organisation.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span>
                    Sector:{" "}
                    <span className="font-medium text-white">
                      {organisation.sector || "Unspecified"}
                    </span>
                  </span>
                  <span className="text-white/25">•</span>
                  <span>
                    Registered:{" "}
                    <span className="font-medium text-white">
                      {formattedCreatedAt}
                    </span>
                  </span>
                  {organisation.slug ? (
                    <>
                      <span className="text-white/25">•</span>
                      <span>
                        Slug:{" "}
                        <span className="font-medium text-white">
                          {organisation.slug}
                        </span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:min-w-[360px]">
                <StatCardDark
                  icon={BarChart3}
                  label="Campaigns"
                  value={String(ogrData.metrics.totalCampaigns)}
                />
                <StatCardDark
                  icon={Users}
                  label="Participants"
                  value={String(ogrData.metrics.totalParticipants)}
                />
                <StatCardDark
                  icon={Activity}
                  label="Active Campaigns"
                  value={String(ogrData.metrics.activeCampaigns)}
                />
                <StatCardDark
                  icon={TrendingUp}
                  label="Response Rate"
                  value={`${ogrData.metrics.responseRate}%`}
                />
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                <Shield className="h-5 w-5 text-[#8A6A2F]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                  OGR Interactive View
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Live organisational posture, campaign health, response patterning,
                  and intervention indicator.
                </p>
              </div>
            </div>

            <OGRInteractiveView data={ogrData} />
          </div>
        </div>

        <div className="mt-10 rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-8 py-6">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
                Campaign Registry
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Latest campaign nodes linked to this organisation.
              </p>
            </div>

            <Link
              href={`/admin/organisations/${organisation.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              Open Organisation Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="px-8 py-6">
            {ogrData.campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
                <Target className="mx-auto h-8 w-8 text-neutral-400" />
                <p className="mt-4 text-sm font-medium text-neutral-700">
                  No campaigns found for this organisation.
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Once campaign nodes are created, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {ogrData.campaigns.map((campaign) => (
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
                          {campaign.title}
                        </h4>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                          <span>Status: {campaign.status}</span>
                          <span className="text-neutral-300">•</span>
                          <span>Participants: {campaign.participantCount}</span>
                          <span className="text-neutral-300">•</span>
                          <span>Completed: {campaign.completedCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-right">
                          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                            Completion
                          </div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900">
                            {campaign.completionRate}%
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:text-neutral-700" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
