export const dynamic = "force-dynamic";

import { getEnterpriseDashboardView } from "@/lib/alignment/enterprise-repository";
import { buildEnterpriseNarrative } from "@/lib/alignment/enterprise-report-language";
import EnterpriseAdvisoryCTA from "@/components/alignment/EnterpriseAdvisoryCTA";

function formatBand(value: string): string {
  return value.toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function EnterpriseCampaignDashboardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const dashboard = await getEnterpriseDashboardView(campaignId);

  if (!dashboard) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-[32px] border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Campaign not found
          </h1>
        </section>
      </main>
    );
  }

  const narrative = buildEnterpriseNarrative(dashboard);
  const snapshot = dashboard.organisationSnapshot;
  type TeamSnapshot = (typeof dashboard.teamSnapshots)[number];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="max-w-5xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6A2F]">
            Institutional Alignment Intelligence
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            {dashboard.campaign.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            {dashboard.organisation.name} · {dashboard.organisation.sector ?? "Sector not set"}
          </p>
          <p className="mt-2 text-sm leading-7 text-neutral-500">
            Opens: {formatDate(dashboard.campaign.opensAt)} · Closes: {formatDate(dashboard.campaign.closesAt)}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border bg-[#FCFBF7] p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
            Executive Reading
          </div>
          <p className="mt-4 text-base leading-7 text-neutral-800">
            {narrative.executivePosture}
          </p>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            {narrative.organisationalInterpretation}
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Organisation Score
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {snapshot?.totalScore ?? "—"}
          </div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Current Band
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {snapshot ? formatBand(snapshot.band) : "—"}
          </div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Completion Rate
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {snapshot ? `${snapshot.completionRate}%` : "—"}
          </div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Fragility Signal
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {snapshot?.fragilitySignal ?? "—"}
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
          Leadership Gap
        </div>
        <p className="mt-4 text-sm leading-7 text-neutral-700">
          {narrative.leadershipGapCommentary}
        </p>
      </section>

      <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
          Variance Commentary
        </div>
        <p className="mt-4 text-sm leading-7 text-neutral-700">
          {narrative.varianceCommentary}
        </p>
      </section>

      <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
          Team Snapshots
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.teamSnapshots.map((team: TeamSnapshot) => (
            <div key={team.teamName} className="rounded-[22px] border bg-[#FCFBF7] p-5">
              <div className="text-sm font-semibold text-neutral-950">{team.teamName}</div>
              <div className="mt-4 text-3xl font-semibold text-neutral-950">{team.percentScore}%</div>
              <div className="mt-2 text-sm text-neutral-600">
                {formatBand(team.band)} · {team.respondentCount} respondents
              </div>
            </div>
          ))}
        </div>
      </section>

      <EnterpriseAdvisoryCTA
        title={narrative.advisoryCtaTitle}
        description={narrative.advisoryCtaBody}
      />
    </main>
  );
}
