export const dynamic = "force-dynamic";
import Link from "next/link";
import { getEnterpriseDashboardView } from "@/lib/alignment/enterprise-repository";
import { STRATEGIC_INTERVENTIONS } from "@/lib/alignment/enterprise-recommendations";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  Fingerprint,
  Globe,
  Activity,
  Award,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Building2,
  BarChart3,
  Target,
  Users,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Icon className="h-5 w-5 text-[#8A6A2F]" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "neutral" | "gold" | "green" | "blue" | "red";
}) {
  const tones = {
    neutral: "border-neutral-200 bg-white text-neutral-900",
    gold: "border-amber-200 bg-amber-50 text-[#8A6A2F]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <div className={cx("rounded-2xl border p-5", tones[tone])}>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {subtext ? (
        <p className="mt-2 text-xs leading-6 text-neutral-500">{subtext}</p>
      ) : null}
    </div>
  );
}

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function OrganisationReportPage({ params }: PageProps) {
  const { id } = await params;

  if (!id?.trim()) {
    return (
      <EmptyState
        title="Invalid organisation reference"
        message="No valid organisation identifier was supplied for this report."
        href="/admin/organisations"
        cta="Return to Organisations"
      />
    );
  }

  let view: any = null;

  try {
    view = await getEnterpriseDashboardView(id);
  } catch (error) {
    console.error("[ADMIN_ORGANISATION_REPORT_ERROR]", error);
    return (
      <EmptyState
        title="Unable to generate report"
        message="The enterprise repository could not assemble this organisation report."
        href={`/admin/organisations/${id}`}
        cta="Return to Organisation"
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

  const organisation = view.organisation ?? view.entity ?? view.company ?? {};
  const organisationName = organisation.name ?? view.name ?? "Unknown Organisation";
  const organisationSector = organisation.sector ?? view.sector ?? "Unspecified";
  const organisationId = organisation.id ?? id;

  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const campaigns = toArray(view.campaigns ?? view.registry?.campaigns);
  const totalCampaigns = view.metrics?.totalCampaigns ?? campaigns.length;

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

  const activeCampaigns =
    view.metrics?.activeCampaigns ??
    campaigns.filter((campaign: any) => String(campaign?.status || "").toLowerCase() === "active")
      .length;

  const responseRate =
    participantsTotal > 0
      ? Math.round((completedParticipants / participantsTotal) * 100)
      : 0;

  const scorecards = toArray(
    view.scorecards ??
      view.enterpriseScorecards ??
      view.dashboard?.scorecards
  );

  const domains = toArray(
    view.domains ??
      view.domainSignals ??
      view.dashboard?.domains
  );

  const strengths = toArray(
    view.strengths ??
      view.summary?.strengths ??
      view.executiveSummary?.strengths
  );

  const risks = toArray(
    view.risks ??
      view.summary?.risks ??
      view.executiveSummary?.risks
  );

  const recommendations = toArray(
    view.recommendations ??
      view.summary?.recommendations ??
      STRATEGIC_INTERVENTIONS
  ).slice(0, 6);

  const createdAt = toDate(organisation.createdAt ?? view.createdAt);
  const createdLabel = createdAt
    ? createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  const overallHealthTone =
    responseRate >= 70 ? "green" : responseRate >= 45 ? "gold" : "red";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href={`/admin/organisations/${organisationId}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Organisation
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-700">
              Report Generated
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Fingerprint className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">
                    Enterprise Organisation Report
                  </div>
                </div>

                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {organisationName}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span>
                    Sector:{" "}
                    <span className="font-medium text-white">{organisationSector}</span>
                  </span>
                  <span className="text-white/25">•</span>
                  <span>
                    Registered:{" "}
                    <span className="font-medium text-white">{createdLabel}</span>
                  </span>
                  <span className="text-white/25">•</span>
                  <span>
                    Generated:{" "}
                    <span className="font-medium text-white">{generatedAt}</span>
                  </span>
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
                    <Building2 className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                      Sector
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {organisationSector}
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

          <div className="p-8 md:p-10">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Overall Health"
                value={`${responseRate}%`}
                subtext="Aggregate participation and completion posture."
                tone={overallHealthTone}
              />
              <MetricCard
                label="Active Campaigns"
                value={activeCampaigns}
                subtext="Currently active campaign nodes."
                tone="blue"
              />
              <MetricCard
                label="Completed Participants"
                value={completedParticipants}
                subtext="Submitted and closed responses."
                tone="green"
              />
              <MetricCard
                label="Organisation ID"
                value={String(organisationId).slice(0, 8).toUpperCase()}
                subtext="Registry reference."
                tone="neutral"
              />
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard title="Executive Summary" icon={Shield}>
                <div className="space-y-4 text-sm leading-7 text-neutral-700">
                  <p>
                    This report consolidates enterprise posture across campaign activity,
                    participation quality, structural indicators, and intervention readiness.
                  </p>
                  <p>
                    The present snapshot indicates{" "}
                    <span className="font-semibold text-neutral-900">
                      {responseRate >= 70
                        ? "a stable and responsive organisation"
                        : responseRate >= 45
                        ? "a workable but uneven operating posture"
                        : "a fragile participation and execution posture"}
                    </span>
                    , with{" "}
                    <span className="font-semibold text-neutral-900">
                      {activeCampaigns}
                    </span>{" "}
                    active campaign node{activeCampaigns === 1 ? "" : "s"} and{" "}
                    <span className="font-semibold text-neutral-900">
                      {completedParticipants}
                    </span>{" "}
                    completed participant submission
                    {completedParticipants === 1 ? "" : "s"}.
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Strategic Indicator" icon={Activity}>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-neutral-700">
                        Response Health
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {responseRate}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={cx(
                          "h-full rounded-full",
                          responseRate >= 70
                            ? "bg-emerald-500"
                            : responseRate >= 45
                            ? "bg-amber-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-neutral-700">
                        Campaign Activation
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {totalCampaigns > 0
                          ? Math.round((activeCampaigns / totalCampaigns) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${
                            totalCampaigns > 0
                              ? Math.round((activeCampaigns / totalCampaigns) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <SectionCard title="Strengths" icon={CheckCircle2}>
                {strengths.length ? (
                  <div className="space-y-3">
                    {strengths.map((item: any, idx: number) => (
                      <div
                        key={`${idx}-${String(item)}`}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                      >
                        {String(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No explicit strengths were surfaced in the current repository view.
                  </p>
                )}
              </SectionCard>

              <SectionCard title="Risks" icon={AlertTriangle}>
                {risks.length ? (
                  <div className="space-y-3">
                    {risks.map((item: any, idx: number) => (
                      <div
                        key={`${idx}-${String(item)}`}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      >
                        {String(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No explicit risk notes were surfaced in the current repository view.
                  </p>
                )}
              </SectionCard>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1fr]">
              <SectionCard title="Domain Indicators" icon={Globe}>
                {domains.length ? (
                  <div className="space-y-3">
                    {domains.slice(0, 8).map((domain: any, idx: number) => (
                      <div
                        key={`${idx}-${domain?.label ?? domain?.name ?? "domain"}`}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                      >
                        <div className="text-sm font-medium text-neutral-900">
                          {domain?.label ?? domain?.name ?? `Domain ${idx + 1}`}
                        </div>
                        {(domain?.summary || domain?.description) && (
                          <p className="mt-1 text-sm leading-6 text-neutral-600">
                            {domain.summary ?? domain.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No domain-level indicator map was available in the current enterprise snapshot.
                  </p>
                )}
              </SectionCard>

              <SectionCard title="Strategic Interventions" icon={Zap}>
                {recommendations.length ? (
                  <div className="space-y-3">
                    {recommendations.map((item: any, idx: number) => {
                      const title =
                        item?.title ??
                        item?.name ??
                        item?.label ??
                        `Intervention ${idx + 1}`;
                      const summary =
                        item?.summary ??
                        item?.description ??
                        item?.rationale ??
                        null;

                      return (
                        <div
                          key={`${idx}-${title}`}
                          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                        >
                          <div className="text-sm font-medium text-neutral-900">
                            {title}
                          </div>
                          {summary ? (
                            <p className="mt-1 text-sm leading-6 text-neutral-600">
                              {String(summary)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No strategic interventions were returned for this organisation.
                  </p>
                )}
              </SectionCard>
            </div>

            {scorecards.length ? (
              <div className="mt-8">
                <SectionCard title="Scorecards" icon={Award}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {scorecards.slice(0, 6).map((card: any, idx: number) => (
                      <div
                        key={`${idx}-${card?.label ?? card?.title ?? "scorecard"}`}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                          {card?.label ?? card?.title ?? `Scorecard ${idx + 1}`}
                        </div>
                        {card?.value !== undefined ? (
                          <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
                            {String(card.value)}
                          </div>
                        ) : null}
                        {(card?.summary || card?.description) && (
                          <p className="mt-2 text-xs leading-6 text-neutral-500">
                            {card.summary ?? card.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
